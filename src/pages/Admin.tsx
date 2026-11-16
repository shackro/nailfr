import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, Image, LayoutDashboard, LogOut, Moon, Radio, Search, Settings, Sun, Users, UserPlus, Save, Copy, ShoppingBag, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useBookings } from '../lib/dataHooks';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { applyTheme, getThemePreference, saveThemePreference } from '../lib/theme';
import FlowerMark from '../components/FlowerMark';
import type { Booking, PortfolioItem, Service } from '../types';
import { defaultSiteSettings, publishSiteSettings, type SiteSettings } from '../lib/siteSettings';
import { resolveImageSource } from '../lib/imageSources';

type Tab = 'overview' | 'bookings' | 'affiliates' | 'portfolio' | 'settings' | 'staff' | 'services';
type StaffRole = 'nail_tech' | 'reception_manager' | 'super_admin';
type StaffMember = { email: string; name: string; phone: string | null; role: StaffRole; is_active: boolean };
type LocalStaff = { email: string; name: string; role: StaffRole };
type InviteForm = { name: string; email: string; phone: string; role: 'nail_tech' | 'reception_manager' };
type GallerySubmission = { title: string; category: string; services: string; price: number };
type PortfolioDraft = { title: string; category: string; image: string; services: string; price: number };
type VisualImageField = 'hero_rose_image_url' | 'booking_rose_image_url';
type ServiceDraft = Pick<Service, 'name' | 'category' | 'price' | 'duration' | 'description'>;
type AffiliateSummary = { count: number; referrals: number; pending: number; paid: number };
type AffiliateRow = { code: string; phone: string; referrals: number; pending: number; paid: number };

async function uploadImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }
  if (!file.size || file.size > 5 * 1024 * 1024) {
    throw new Error('Choose an image smaller than 5 MB.');
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The image file could not be read.'));
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('The image file could not be read.'));
    reader.readAsDataURL(file);
  });
  const separator = dataUrl.indexOf(',');
  if (separator < 0) throw new Error('The image file could not be encoded.');
  const media = await api<{ url: string }>('/admin/media', {
    method: 'POST',
    body: JSON.stringify({
      name: file.name,
      mime_type: file.type,
      content_base64: dataUrl.slice(separator + 1),
    }),
  });
  return media.url;
}

const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'affiliates', label: 'Affiliates', icon: Users },
  { id: 'portfolio', label: 'Portfolio', icon: Image },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'services', label: 'Services', icon: ShoppingBag },
  { id: 'staff', label: 'Staff', icon: UserPlus },
];
function isBookingStatus(value: string): value is Booking['status'] {
  return value === 'pending' || value === 'confirmed' || value === 'completed' || value === 'cancelled';
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [affiliateSummary, setAffiliateSummary] = useState<AffiliateSummary>({ count: 0, referrals: 0, pending: 0, paid: 0 });
  const [affiliateRows, setAffiliateRows] = useState<AffiliateRow[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [savingServiceId, setSavingServiceId] = useState<number | null>(null);
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft>({ name: '', category: '', price: 0, duration: 30, description: '' });
  const [addingService, setAddingService] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [serviceMessage, setServiceMessage] = useState('');
  const [portfolioDraft, setPortfolioDraft] = useState<PortfolioDraft>({ title: '', category: 'Nail Art', image: '', services: '', price: 0 });
  const [portfolioImageFile, setPortfolioImageFile] = useState<File | null>(null);
  const portfolioImageInputRef = useRef<HTMLInputElement>(null);
  const [portfolioFormOpen, setPortfolioFormOpen] = useState(false);
  const [publishPortfolioImmediately, setPublishPortfolioImmediately] = useState(true);
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [uploadingVisualImage, setUploadingVisualImage] = useState<VisualImageField | null>(null);
  const [portfolioMessage, setPortfolioMessage] = useState('');
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [gallerySubmission, setGallerySubmission] = useState<GallerySubmission>({ title: '', category: 'Nail Art', services: '', price: 0 });
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [galleryMessage, setGalleryMessage] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig);
  const [staffAuthorized, setStaffAuthorized] = useState(false);
  const [localStaff, setLocalStaff] = useState<LocalStaff | null>(null);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [updatedBookingId, setUpdatedBookingId] = useState<number | null>(null);
  const [markedPaidCode, setMarkedPaidCode] = useState('');
  const [liveBookingId, setLiveBookingId] = useState<number | null>(null);
  const [liveFeedConnected, setLiveFeedConnected] = useState(false);
  const [dark, setDark] = useState(() => getThemePreference() === 'dark');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [inviteForm, setInviteForm] = useState<InviteForm>({ name: '', email: '', phone: '', role: 'nail_tech' });
  const [inviteLink, setInviteLink] = useState('');
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingInvite, setSavingInvite] = useState(false);
  const currentRole: StaffRole | null = hasSupabaseConfig
    ? staffAuthorized ? 'super_admin' : null
    : localStaff?.role ?? null;
  const isOwner = currentRole === 'super_admin';
  const canManageContent = currentRole === 'reception_manager' || isOwner;
  const isAuthorized = hasSupabaseConfig ? staffAuthorized : Boolean(localStaff);
  const visibleNavItems = navItems.filter(({ id }) => {
    if (id === 'affiliates') return isOwner;
    if (id === 'staff') return isOwner && !hasSupabaseConfig;
    if (id === 'portfolio') return canManageContent || (!hasSupabaseConfig && currentRole === 'nail_tech');
    if (id === 'settings' || id === 'services') return canManageContent;
    return true;
  });
  const { data: bookings, loading: bookingsLoading, error: bookingsError, refresh: refreshBookings, updateBookingStatus } = useBookings(isAuthorized);

  const refresh = () => {
    setLoading(true);
    setError('');
    const contentRequest = canManageContent
      ? api<PortfolioItem[]>('/admin/portfolio')
      : Promise.resolve([]);
    const servicesRequest = canManageContent ? api<Service[]>('/admin/services') : Promise.resolve([]);
    const categoriesRequest = canManageContent ? api<string[]>('/admin/service-categories') : Promise.resolve([]);
    const ownerRequest = isOwner
      ? Promise.all([api<AffiliateSummary>('/affiliates/summary'), api<AffiliateRow[]>('/admin/affiliates')])
      : Promise.resolve(null);
    void Promise.all([refreshBookings(), contentRequest, servicesRequest, categoriesRequest, ownerRequest]).then(([, items, serviceItems, categories, finance]) => {
      setPortfolio(items);
      setServices(serviceItems);
      setServiceCategories(categories);
      if (finance) {
        setAffiliateSummary(finance[0]);
        setAffiliateRows(finance[1]);
      }
    }).catch((requestError: unknown) => {
      setError(requestError instanceof Error ? requestError.message : 'Could not load studio data.');
    }).finally(() => setLoading(false));
  };

  const createServiceCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddingCategory(true);
    setServiceMessage('');
    setError('');
    try {
      const created = await api<{ name: string }>('/admin/service-categories', {
        method: 'POST',
        body: JSON.stringify({ name: categoryDraft.trim() }),
      });
      setServiceCategories((current) => [...current, created.name].sort((a, b) => a.localeCompare(b)));
      setServiceDraft((current) => ({ ...current, category: current.category || created.name }));
      setCategoryDraft('');
      setCategoryFormOpen(false);
      setServiceMessage(`${created.name} was added to service categories.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not add this category.');
    } finally {
      setAddingCategory(false);
    }
  };

  useEffect(() => {
    const client = supabase;
    if (!hasSupabaseConfig || !client) return;
    let active = true;
    void client.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (sessionError) throw sessionError;
      if (!data.session) return;
      const { data: profile, error: profileError } = await client.from('profiles').select('is_admin').eq('id', data.session.user.id).maybeSingle();
      if (profileError) throw profileError;
      if (active) setStaffAuthorized(profile?.is_admin === true);
    }).catch((requestError: unknown) => {
      if (active) setAuthError(requestError instanceof Error ? requestError.message : 'Could not verify staff access.');
    }).finally(() => {
      if (active) setAuthReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (hasSupabaseConfig || !sessionStorage.getItem('glamourglow-admin-token')) return;
    let active = true;
    void api<LocalStaff>('/admin/me').then((staff) => {
      if (active) setLocalStaff(staff);
    }).catch(() => {
      sessionStorage.removeItem('glamourglow-admin-token');
      if (active) setAuthError('Your admin session expired. Please sign in again.');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!canManageContent || hasSupabaseConfig) {
      setStaffMembers([]);
      return;
    }
    let active = true;
    void api<StaffMember[]>('/admin/staff').then((members) => {
      if (active) setStaffMembers(members);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load staff members.');
    });
    return () => { active = false; };
  }, [canManageContent]);

  useEffect(() => {
    if (activeTab !== 'settings' || !canManageContent) return;
    let active = true;
    void api<SiteSettings>('/site-settings').then((current) => {
      if (active) setSettings({ ...defaultSiteSettings, ...current });
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load site settings.');
    });
    return () => { active = false; };
  }, [activeTab, canManageContent]);

  useEffect(() => {
    if (isAuthorized) {
      refresh();
    }
  }, [isAuthorized, localStaff?.role]);

  useEffect(() => {
    if (!hasSupabaseConfig || !staffAuthorized || !supabase) return;
    let highlightTimer: number | undefined;
    const channel = supabase
      .channel('admin-live-bookings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
        const id: unknown = payload.new.id;
        if (typeof id === 'number') {
          setLiveBookingId(id);
          window.clearTimeout(highlightTimer);
          highlightTimer = window.setTimeout(() => setLiveBookingId((current) => current === id ? null : current), 3200);
        }
        void refreshBookings();
      })
      .subscribe((status) => setLiveFeedConnected(status === 'SUBSCRIBED'));

    return () => {
      window.clearTimeout(highlightTimer);
      void supabase?.removeChannel(channel);
      setLiveFeedConnected(false);
    };
  }, [staffAuthorized, refreshBookings]);

  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((booking) => booking.date === today);
  const completedValue = bookings.filter((booking) => booking.status === 'completed').reduce((sum, booking) => sum + booking.total, 0);
  const pendingCount = bookings.filter((booking) => booking.status === 'pending').length;
  const serviceCategoryOptions = useMemo(
    () => [...new Set([...serviceCategories, ...services.map((service) => service.category)])].filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [serviceCategories, services],
  );
  const upcoming = useMemo(() => bookings.filter((booking) => booking.date >= today && booking.status !== 'cancelled').slice(0, 5), [bookings, today]);
  const filteredBookings = bookings.filter((booking) => `${booking.name} ${booking.phone} ${booking.services.join(' ')}`.toLowerCase().includes(search.toLowerCase()));

  const changeStatus = async (id: number, status: string) => {
    if (!isBookingStatus(status)) return;
    setError('');
    try {
      await updateBookingStatus(id, status);
      setUpdatedBookingId(id);
      window.setTimeout(() => setUpdatedBookingId((current) => current === id ? null : current), 1400);
      refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update the appointment.');
    }
  };

  const approvePayout = async (code: string) => {
    setError('');
    try {
      await api(`/admin/affiliates/${encodeURIComponent(code)}/payout`, { method: 'PATCH' });
      setMarkedPaidCode(code);
      window.setTimeout(() => setMarkedPaidCode((current) => current === code ? '' : current), 1400);
      refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not approve this payout.');
    }
  };

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    try {
      if (!hasSupabaseConfig) {
        const result = await api<{ access_token: string; email: string; name: string; role: StaffRole }>('/admin/login', {
          method: 'POST',
          body: JSON.stringify({ email: staffEmail, password: staffPassword }),
        });
        sessionStorage.setItem('glamourglow-admin-token', result.access_token);
        setLocalStaff({ email: result.email, name: result.name, role: result.role });
        setStaffPassword('');
        return;
      }
      if (!supabase) throw new Error('Staff sign-in is unavailable.');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: staffEmail, password: staffPassword });
      if (signInError) throw signInError;
      const { data: profile, error: profileError } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).maybeSingle();
      if (profileError) throw profileError;
      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        throw new Error('This account does not have staff administrator access.');
      }
      setStaffAuthorized(true);
      setStaffPassword('');
    } catch (requestError) {
      setAuthError(requestError instanceof Error ? requestError.message : 'Could not sign in.');
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    if (hasSupabaseConfig && supabase) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        return;
      }
      setStaffAuthorized(false);
    } else {
      sessionStorage.removeItem('glamourglow-admin-token');
      setLocalStaff(null);
      setActiveTab('overview');
    }
  };

  const assignBooking = async (booking: Booking, assignedTo: string) => {
    setError('');
    try {
      await api(`/bookings/${booking.id}?status=${booking.status}&assigned_to=${encodeURIComponent(assignedTo)}`, { method: 'PATCH' });
      await refreshBookings();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not assign this booking.');
    }
  };

  const saveService = async (service: Service) => {
    setSavingServiceId(service.id);
    setError('');
    const updates = currentRole === 'reception_manager'
      ? { is_active: Boolean(service.is_active) }
      : {
          name: service.name,
          category: service.category,
          price: service.price,
          duration: service.duration,
          description: service.description,
          is_active: Boolean(service.is_active),
        };
    try {
      const saved = await api<Service>(`/admin/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setServices((current) => current.map((item) => item.id === saved.id ? saved : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save this service.');
    } finally {
      setSavingServiceId(null);
    }
  };

  const createService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddingService(true);
    setServiceMessage('');
    setError('');
    try {
      const created = await api<Service>('/admin/services', {
        method: 'POST',
        body: JSON.stringify({
          ...serviceDraft,
          name: serviceDraft.name.trim(),
          category: serviceDraft.category.trim(),
          description: serviceDraft.description.trim(),
        }),
      });
      setServices((current) => [...current, created].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
      setServiceDraft({ name: '', category: '', price: 0, duration: 30, description: '' });
      setServiceFormOpen(false);
      setServiceMessage(`${created.name} was added to the service menu.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not add this service.');
    } finally {
      setAddingService(false);
    }
  };

  const submitGalleryWork = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!galleryFile) {
      setError('Choose a JPG, PNG or WebP photo to submit.');
      return;
    }
    setGalleryBusy(true);
    setError('');
    setGalleryMessage('');
    try {
      const image = await uploadImage(galleryFile);
      await api('/admin/portfolio', {
        method: 'POST',
        body: JSON.stringify({
          title: gallerySubmission.title.trim(),
          category: gallerySubmission.category,
          image,
          services: gallerySubmission.services.split(',').map((service) => service.trim()).filter(Boolean),
          price: gallerySubmission.price,
          is_published: false,
        }),
      });
      setGallerySubmission({ title: '', category: 'Nail Art', services: '', price: 0 });
      setGalleryFile(null);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
      setGalleryMessage('Photo submitted as a draft for manager review.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not submit this gallery photo.');
    } finally {
      setGalleryBusy(false);
    }
  };

  const createPortfolioItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const enteredImage = portfolioDraft.image.trim();
    if (!portfolioImageFile && !enteredImage.startsWith('/') && !/^https?:\/\//i.test(enteredImage)) {
      setError('Use an image URL beginning with https:// or a local /images/ path.');
      return;
    }

    setSavingPortfolio(true);
    setError('');
    setPortfolioMessage('');
    try {
      const image = portfolioImageFile ? await uploadImage(portfolioImageFile) : enteredImage;
      const created = await api<PortfolioItem>('/admin/portfolio', {
        method: 'POST',
        body: JSON.stringify({
          title: portfolioDraft.title.trim(),
          category: portfolioDraft.category.trim(),
          image,
          services: portfolioDraft.services.split(',').map((service) => service.trim()).filter(Boolean),
          price: portfolioDraft.price,
          is_published: publishPortfolioImmediately,
        }),
      });
      setPortfolio((current) => [created, ...current]);
      setPortfolioDraft({ title: '', category: 'Nail Art', image: '', services: '', price: 0 });
      setPortfolioImageFile(null);
      if (portfolioImageInputRef.current) portfolioImageInputRef.current.value = '';
      setPortfolioFormOpen(false);
      setPortfolioMessage(publishPortfolioImmediately
        ? `${created.title} was added to the public lookbook.`
        : `${created.title} was saved as a draft.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not add this lookbook item.');
    } finally {
      setSavingPortfolio(false);
    }
  };

  const togglePortfolioPublication = async (item: PortfolioItem) => {
    setError('');
    try {
      const updated = { ...item, is_published: !item.is_published };
      await api(`/admin/portfolio/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      setPortfolio((current) => current.map((entry) => entry.id === item.id ? updated : entry));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update this gallery submission.');
    }
  };

  const saveSiteSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage('');
    setError('');
    try {
      const saved = await api<SiteSettings>('/admin/site-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSettings({ ...defaultSiteSettings, ...saved });
      publishSiteSettings(saved);
      setSettingsMessage('Site controls published.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save site controls.');
    } finally {
      setSavingSettings(false);
    }
  };

  const uploadVisualImage = async (field: VisualImageField, file: File | undefined) => {
    if (!file) return;
    setUploadingVisualImage(field);
    setError('');
    setSettingsMessage('');
    try {
      const imageUrl = await uploadImage(file);
      setSettings((current) => ({ ...current, [field]: imageUrl }));
      setSettingsMessage('Image uploaded. Publish changes to apply it to the site.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not upload this image.');
    } finally {
      setUploadingVisualImage(null);
    }
  };

  const createInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingInvite(true);
    setError('');
    setInviteLink('');
    try {
      const invite = await api<{ invite_path: string }>('/admin/staff/invites', {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      });
      setInviteLink(new URL(invite.invite_path, window.location.origin).toString());
      setInviteForm({ name: '', email: '', phone: '', role: 'nail_tech' });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not create the staff invitation.');
    } finally {
      setSavingInvite(false);
    }
  };

  const copyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch (requestError) {
      setError(requestError instanceof Error ? 'Clipboard access is unavailable. Select and copy the invite link.' : 'Could not copy the invite link.');
    }
  };

  const changeStaffAccess = async (member: StaffMember) => {
    setError('');
    try {
      await api(`/admin/staff/${encodeURIComponent(member.email)}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !member.is_active }),
      });
      setStaffMembers((current) => current.map((item) => item.email === member.email ? { ...item, is_active: !item.is_active } : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update staff access.');
    }
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    const theme = next ? 'dark' : 'light';
    applyTheme(theme);
    saveThemePreference(theme);
  };

  const title = navItems.find((item) => item.id === activeTab)?.label ?? 'Overview';

  if (hasSupabaseConfig && !authReady) return <div className="admin-login"><p>Checking staff access…</p></div>;
  if ((hasSupabaseConfig && !staffAuthorized) || (!hasSupabaseConfig && !localStaff)) return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={(event) => void signIn(event)}>
        <Link to="/" className="admin-logo"><span className="brand-mark"><FlowerMark /></span><span>GLAMOUR<span>ADMIN</span></span></Link>
        <span className="eyebrow">STAFF ACCESS</span>
        <h1>Welcome back.</h1>
        <p>Sign in with your authorized staff account to manage studio operations.</p>
        <label>Email<input type="email" autoComplete="username" required value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} /></label>
        <label>Password<input type="password" autoComplete="current-password" required value={staffPassword} onChange={(event) => setStaffPassword(event.target.value)} /></label>
        {authError && <p className="affiliate-error" role="alert">{authError}</p>}
        <button className="primary full" disabled={authBusy}>{authBusy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );

  return (
    <div className="admin admin-vibrant">
      <aside className="admin-side admin-vibrant-side">
        <Link to="/" className="admin-logo"><span className="brand-mark"><FlowerMark /></span><span>GLAMOUR<span>ADMIN</span></span></Link>
        <small className="admin-side-label">WORKSPACE</small>
        <nav aria-label="Admin sections">{visibleNavItems.map(({ id, label, icon: Icon }) => (
          <button type="button" className={activeTab === id ? 'active' : ''} key={id} onClick={() => setActiveTab(id)} aria-label={label} aria-current={activeTab === id ? 'page' : undefined} title={label}><Icon /> <span>{label}</span></button>
        ))}</nav>
        <div className="admin-side-bottom"><button type="button" onClick={() => void signOut()}><LogOut /> Sign out</button><small>{localStaff?.name ?? 'Glamourglow Spa'} · {currentRole?.replace('_', ' ')}</small></div>
      </aside>

      <main className="admin-vibrant-main">
        <header className="admin-vibrant-header">
          <div className="admin-mobile-logo"><span className="brand-mark"><FlowerMark /></span><b>GLAMOUR<span>ADMIN</span></b></div>
          <div><small>STUDIO OPERATIONS</small><h1>{activeTab === 'overview' ? 'Dashboard overview' : title}</h1></div>
          <div className="admin-header-right">{hasSupabaseConfig && <span className={`admin-live-indicator${liveFeedConnected ? ' is-connected' : ''}`}><Radio /> {liveFeedConnected ? 'Live' : 'Connecting'}</span>}<span>{new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short' })}</span><button type="button" onClick={toggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={dark}>{dark ? <Sun /> : <Moon />}</button><button type="button" onClick={refresh} aria-label="Refresh dashboard"><ArrowUpRight /></button></div>
        </header>

        <div className="admin-safety-note">Signed in as {localStaff?.name ?? 'authorized staff'} · {currentRole?.replace('_', ' ')}. Permissions are enforced by the API.</div>
        {(error || bookingsError) && <p className="affiliate-error" role="alert">{error || bookingsError} <button type="button" className="text-link" onClick={refresh}>Retry</button></p>}
        {loading || bookingsLoading ? <p className="admin-empty">Loading studio data…</p> : (
          <>
            {activeTab === 'overview' && (
              <>
                <section className="admin-vibrant-stats">
                  <article><span><CalendarDays /></span><small>Today&apos;s appointments</small><strong>{todayBookings.length}</strong><em>Live booking records</em></article>
                  <article><span><CheckCircle2 /></span><small>Completed revenue</small><strong>KSh {completedValue.toLocaleString()}</strong><em>From completed visits</em></article>
                  <article><span><Clock3 /></span><small>Awaiting confirmation</small><strong>{pendingCount}</strong><em>Pending appointments</em></article>
                  {isOwner && <article><span><Users /></span><small>Affiliate referrals</small><strong>{affiliateSummary.referrals}</strong><em>{affiliateSummary.count} partner accounts</em></article>}
                </section>
                <section className="admin-panel">
                  <div className="admin-panel-heading"><div><h2>Upcoming appointments</h2><p>Next scheduled client visits</p></div><button type="button" className="admin-text-button" onClick={() => setActiveTab('bookings')}>View all <ArrowUpRight /></button></div>
                  {upcoming.length ? <div className="admin-upcoming">{upcoming.map((booking) => (
                    <article key={booking.id} className={liveBookingId === booking.id ? 'admin-booking-live' : ''}><span className="admin-date-pill">{booking.date}</span><div><b>{booking.name}</b><small>{booking.services.join(', ')}</small></div><span className={`status ${booking.status}`}>{booking.status}</span><strong>KSh {booking.total.toLocaleString()}</strong></article>
                  ))}</div> : <p className="admin-empty">No upcoming appointments are on the calendar yet.</p>}
                </section>
              </>
            )}

            {activeTab === 'bookings' && (
              <section className="admin-panel">
                <div className="admin-panel-heading"><div><h2>Incoming bookings</h2><p>Appointments requested through the booking form</p></div><label className="admin-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients or services" /></label></div>
                <div className="table-wrap">
                  <table><thead><tr><th>Client</th><th>Services</th><th>Date & time</th><th>Total</th>{canManageContent && !hasSupabaseConfig && <th>Assigned technician</th>}<th>Status</th><th>Update</th></tr></thead>
                    <tbody>{filteredBookings.map((booking) => (
                      <tr key={booking.id} className={`${updatedBookingId === booking.id ? 'admin-row-updated' : ''} ${liveBookingId === booking.id ? 'admin-row-live' : ''}`}>
                        <td><b>{booking.name}</b><small>{booking.phone}</small>{booking.referral && <small className="admin-ref">Referral: {booking.referral}</small>}</td>
                        <td>{booking.services.join(', ')}</td><td>{booking.date}<small>{booking.time}</small></td>
                        <td>KSh {booking.total.toLocaleString()}</td>
                                       {canManageContent && !hasSupabaseConfig && <td><select aria-label={`Assign ${booking.name} to a nail technician`} value={booking.assigned_to ?? ''} onChange={(event) => void assignBooking(booking, event.target.value)}><option value="">Unassigned</option>{staffMembers.filter((member) => member.role === 'nail_tech' && member.is_active).map((member) => <option key={member.email} value={member.email}>{member.name}</option>)}</select></td>}
                        <td><span className={`status ${booking.status}`}>{booking.status}</span></td>
                        <td><select value={booking.status} onChange={(event) => { if (isBookingStatus(event.target.value)) void changeStatus(booking.id, event.target.value); }}><option value="pending" disabled={currentRole === 'nail_tech'}>Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled" disabled={currentRole === 'nail_tech'}>Cancelled</option></select></td>
                      </tr>
                    ))}</tbody>
                  </table>
                  {!filteredBookings.length && <p className="admin-empty">No bookings match your search.</p>}
                </div>
              </section>
            )}

            {activeTab === 'affiliates' && (
              <>
                <section className="admin-vibrant-stats affiliate-admin-stats">
                  <article><span><Users /></span><small>Partner accounts</small><strong>{affiliateSummary.count}</strong></article>
                  <article><span><CalendarDays /></span><small>Referred bookings</small><strong>{affiliateSummary.referrals}</strong></article>
                  <article><span><Clock3 /></span><small>Commission pending</small><strong>KSh {affiliateSummary.pending.toLocaleString()}</strong></article>
                  <article><span><CheckCircle2 /></span><small>Commission paid</small><strong>KSh {affiliateSummary.paid.toLocaleString()}</strong></article>
                </section>
                <section className="admin-panel">
                  <div className="admin-panel-heading"><div><h2>Partner payouts</h2><p>Completed referrals earn {settings.affiliate_cash_percent}%. Approve a pending balance after sending payment by M-Pesa.</p></div></div>
                  {affiliateRows.length ? <div className="table-wrap"><table><thead><tr><th>Partner</th><th>Referrals</th><th>Pending payout</th><th>Paid to date</th><th></th></tr></thead><tbody>
                    {affiliateRows.map((affiliate) => <tr key={affiliate.code} className={markedPaidCode === affiliate.code ? 'admin-row-confirmed' : ''}><td><b>{affiliate.phone}</b><small>Code: {affiliate.code}</small></td><td>{affiliate.referrals}</td><td>KSh {affiliate.pending.toLocaleString()}</td><td>KSh {affiliate.paid.toLocaleString()}</td><td><button type="button" className="admin-payout-button" disabled={!affiliate.pending} onClick={() => void approvePayout(affiliate.code)}>{markedPaidCode === affiliate.code ? 'Marked paid ✓' : 'Mark paid'}</button></td></tr>)}
                  </tbody></table></div> : <p className="admin-empty">No affiliate accounts have been created yet.</p>}
                </section>
              </>
            )}

            {activeTab === 'portfolio' && (
              currentRole === 'nail_tech' ? (
                <section className="admin-panel">
                  <div className="admin-panel-heading"><div><h2>Submit a finished set</h2><p>Your photo will stay in drafts until a manager approves it for the lookbook.</p></div></div>
                  <form className="admin-gallery-form" onSubmit={(event) => void submitGalleryWork(event)}>
                    <label>Design title<input required minLength={2} maxLength={160} value={gallerySubmission.title} onChange={(event) => setGallerySubmission({ ...gallerySubmission, title: event.target.value })} /></label>
                    <label>Category<select value={gallerySubmission.category} onChange={(event) => setGallerySubmission({ ...gallerySubmission, category: event.target.value })}><option>Nail Art</option><option>Gel</option><option>Acrylic</option><option>Self Care</option></select></label>
                    <label>Treatments used<input value={gallerySubmission.services} onChange={(event) => setGallerySubmission({ ...gallerySubmission, services: event.target.value })} placeholder="Gel, Nail Art" /></label>
                    <label>Look price (KSh)<input type="number" min="0" value={gallerySubmission.price} onChange={(event) => setGallerySubmission({ ...gallerySubmission, price: Number(event.target.value) })} /></label>
                    <label>Photo<input ref={galleryFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" required={!galleryFile} onChange={(event) => setGalleryFile(event.target.files?.[0] ?? null)} /></label>
                    <button type="submit" className="admin-payout-button" disabled={galleryBusy}>{galleryBusy ? 'Submitting…' : 'Submit for review'}</button>
                  </form>
                  {galleryMessage && <p className="review-success" role="status">{galleryMessage}</p>}
                </section>
              ) : (
                <section className="admin-panel">
                  <div className="admin-panel-heading">
                    <div><h2>Portfolio &amp; lookbook</h2><p>Add new designs, review team submissions, and manage what appears in the public lookbook.</p></div>
                    {canManageContent && <button type="button" className="admin-payout-button" aria-expanded={portfolioFormOpen} aria-controls="admin-portfolio-form" onClick={() => { setPortfolioFormOpen((open) => !open); setPortfolioMessage(''); }}><Plus /> {portfolioFormOpen ? 'Cancel' : 'Add lookbook item'}</button>}
                  </div>
                  {portfolioMessage && <p className="review-success" role="status">{portfolioMessage}</p>}
                  {canManageContent && portfolioFormOpen && (
                    <form id="admin-portfolio-form" className="admin-gallery-form admin-portfolio-create-form" onSubmit={(event) => void createPortfolioItem(event)}>
                      <label>Design title<input required minLength={2} maxLength={160} value={portfolioDraft.title} onChange={(event) => setPortfolioDraft({ ...portfolioDraft, title: event.target.value })} /></label>
                      <label>Category<select value={portfolioDraft.category} onChange={(event) => setPortfolioDraft({ ...portfolioDraft, category: event.target.value })}><option>Nail Art</option><option>Gel</option><option>Acrylic</option><option>Self Care</option></select></label>
                      <label>Treatments used<input value={portfolioDraft.services} onChange={(event) => setPortfolioDraft({ ...portfolioDraft, services: event.target.value })} placeholder="Gel, Nail Art" /></label>
                      <label>Look price (KSh)<input type="number" min="0" step="1" value={portfolioDraft.price} onChange={(event) => setPortfolioDraft({ ...portfolioDraft, price: Number(event.target.value) })} /></label>
                      <label className="admin-portfolio-image-field">Image URL or local path<input required={!portfolioImageFile} maxLength={2000} value={portfolioDraft.image} onChange={(event) => setPortfolioDraft({ ...portfolioDraft, image: event.target.value })} placeholder="https://… or /images/…" /><small>Paste a URL/path, or choose a JPG, PNG, or WebP image to upload (max 5 MB).</small><input ref={portfolioImageInputRef} aria-label="Upload lookbook image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; setPortfolioImageFile(file); if (file) setPortfolioDraft((current) => ({ ...current, image: '' })); }} />{portfolioImageFile && <small>Selected: {portfolioImageFile.name}</small>}</label>
                      <label className="admin-settings-toggle admin-portfolio-publish"><span>Publish immediately</span><input type="checkbox" checked={publishPortfolioImmediately} onChange={(event) => setPublishPortfolioImmediately(event.target.checked)} /></label>
                      <button type="submit" className="admin-payout-button" disabled={savingPortfolio}>{savingPortfolio ? 'Adding…' : 'Add to lookbook'}</button>
                    </form>
                  )}
                  <div className="admin-portfolio">{portfolio.map((item) => (
                    <article className="admin-portfolio-item" key={item.id}>
                      <img src={resolveImageSource(item.image)} alt={item.title} loading="lazy" />
                      <div><b>{item.title}</b><small>{item.category} · KSh {item.price.toLocaleString()}</small><span className={`status ${item.is_published ? 'confirmed' : 'pending'}`}>{item.is_published ? 'Published' : 'Draft'}</span>
                        {canManageContent && <button type="button" className="admin-payout-button" onClick={() => void togglePortfolioPublication(item)}>{item.is_published ? 'Unpublish' : 'Approve & publish'}</button>}
                      </div>
                    </article>
                  ))}</div>
                  {!portfolio.length && <p className="admin-empty">No gallery submissions yet.</p>}
                </section>
              )
            )}

            {activeTab === 'services' && (
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div><h2>Service menu</h2><p>{isOwner ? 'Add treatments and update prices, timing, descriptions, or availability.' : 'Toggle treatments on or off as stock changes.'}</p></div>
                  {isOwner && <div className="admin-service-actions">
                    <button type="button" className="admin-payout-button" aria-expanded={categoryFormOpen} aria-controls="admin-category-form" onClick={() => { setCategoryFormOpen((open) => !open); setServiceMessage(''); }}><Plus /> {categoryFormOpen ? 'Cancel category' : 'Add category'}</button>
                    <button type="button" className="admin-payout-button" aria-expanded={serviceFormOpen} aria-controls="admin-service-form" onClick={() => { setServiceFormOpen((open) => !open); setServiceMessage(''); }}><Plus /> {serviceFormOpen ? 'Cancel service' : 'Add service'}</button>
                  </div>}
                </div>
                {serviceMessage && <p className="review-success" role="status">{serviceMessage}</p>}
                {isOwner && categoryFormOpen && (
                  <form id="admin-category-form" className="admin-category-form" onSubmit={(event) => void createServiceCategory(event)}>
                    <label>New category<input required minLength={2} maxLength={80} value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="e.g. Nail extensions" /></label>
                    <button type="submit" className="admin-payout-button" disabled={addingCategory}>{addingCategory ? 'Adding…' : 'Save category'}</button>
                  </form>
                )}
                {isOwner && serviceFormOpen && (
                  <form id="admin-service-form" className="admin-service-form" onSubmit={(event) => void createService(event)}>
                    <label>Service name<input required minLength={2} maxLength={120} value={serviceDraft.name} onChange={(event) => setServiceDraft({ ...serviceDraft, name: event.target.value })} /></label>
                    <label>Category<select required value={serviceDraft.category} onChange={(event) => setServiceDraft({ ...serviceDraft, category: event.target.value })}><option value="" disabled>Select a category</option>{serviceCategoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                    <label>Price (KSh)<input required type="number" min="0" step="1" value={serviceDraft.price} onChange={(event) => setServiceDraft({ ...serviceDraft, price: Number(event.target.value) })} /></label>
                    <label>Duration (minutes)<input required type="number" min="1" step="1" value={serviceDraft.duration} onChange={(event) => setServiceDraft({ ...serviceDraft, duration: Number(event.target.value) })} /></label>
                    <label className="admin-service-description">Description<textarea rows={2} maxLength={1000} value={serviceDraft.description} onChange={(event) => setServiceDraft({ ...serviceDraft, description: event.target.value })} /></label>
                    <button type="submit" className="admin-payout-button" disabled={addingService}>{addingService ? 'Adding…' : 'Add to menu'}</button>
                  </form>
                )}
                <div className="table-wrap">
                  <table><thead><tr><th>Treatment</th><th>Category</th><th>Price (KSh)</th><th>Minutes</th><th>Available</th><th></th></tr></thead>
                    <tbody>{services.map((service) => (
                      <tr key={service.id}>
                        <td>{isOwner ? <input aria-label={`${service.name} name`} value={service.name} onChange={(event) => setServices((current) => current.map((item) => item.id === service.id ? { ...item, name: event.target.value } : item))} /> : service.name}</td>
                        <td>{isOwner ? <select aria-label={`${service.name} category`} value={service.category} onChange={(event) => setServices((current) => current.map((item) => item.id === service.id ? { ...item, category: event.target.value } : item))}>{serviceCategoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select> : service.category}</td>
                        <td>{isOwner ? <input aria-label={`${service.name} price`} type="number" min="0" value={service.price} onChange={(event) => setServices((current) => current.map((item) => item.id === service.id ? { ...item, price: Number(event.target.value) } : item))} /> : service.price.toLocaleString()}</td>
                        <td>{isOwner ? <input aria-label={`${service.name} duration`} type="number" min="1" value={service.duration} onChange={(event) => setServices((current) => current.map((item) => item.id === service.id ? { ...item, duration: Number(event.target.value) } : item))} /> : service.duration}</td>
                        <td><input aria-label={`${service.name} available`} type="checkbox" checked={Boolean(service.is_active)} onChange={(event) => setServices((current) => current.map((item) => item.id === service.id ? { ...item, is_active: event.target.checked } : item))} /></td>
                        <td><button type="button" className="admin-payout-button" disabled={savingServiceId === service.id} onClick={() => void saveService(service)}>{savingServiceId === service.id ? 'Saving…' : 'Save'}</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                {!services.length && <p className="admin-empty">No services are available to manage.</p>}
              </section>
            )}

            {activeTab === 'settings' && (
              <section className="admin-panel admin-settings-panel">
                <div className="admin-panel-heading"><div><h2>Live site controls</h2><p>Changes are saved to FastAPI and reflected in public pages.</p></div><button type="button" className="admin-payout-button" disabled={savingSettings} onClick={() => void saveSiteSettings()}><Save /> {savingSettings ? 'Publishing…' : 'Publish changes'}</button></div>
                {settingsMessage && <p className="review-success" role="status">{settingsMessage}</p>}
                <div className="admin-settings-grid">
                  {isOwner && <fieldset><legend>Studio profile</legend>
                    <label>Business name<input value={settings.business_name} onChange={(event) => setSettings({ ...settings, business_name: event.target.value })} /></label>
                    <label>Phone<input value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} /></label>
                    <label>Email<input type="email" value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} /></label>
                    <label>Address<input value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} /></label>
                    <label>Weekday hours<input value={settings.weekday_hours} onChange={(event) => setSettings({ ...settings, weekday_hours: event.target.value })} /></label>
                    <label>Sunday hours<input value={settings.sunday_hours} onChange={(event) => setSettings({ ...settings, sunday_hours: event.target.value })} /></label>
                  </fieldset>}
                  <fieldset><legend>Homepage & promotions</legend>
                    <label>Hero badge<input value={settings.home_eyebrow} onChange={(event) => setSettings({ ...settings, home_eyebrow: event.target.value })} /></label>
                    <label>Hero headline<textarea rows={2} value={settings.home_title} onChange={(event) => setSettings({ ...settings, home_title: event.target.value })} /></label>
                    <label>Hero description<textarea rows={3} value={settings.home_description} onChange={(event) => setSettings({ ...settings, home_description: event.target.value })} /></label>
                    <label>About page headline<input value={settings.about_title} onChange={(event) => setSettings({ ...settings, about_title: event.target.value })} /></label>
                    <label>About page story<textarea rows={3} value={settings.about_description} onChange={(event) => setSettings({ ...settings, about_description: event.target.value })} /></label>
                    <label>Weekend perk title<input value={settings.weekend_title} onChange={(event) => setSettings({ ...settings, weekend_title: event.target.value })} /></label>
                    <label>Weekend perk details<textarea rows={2} value={settings.weekend_description} onChange={(event) => setSettings({ ...settings, weekend_description: event.target.value })} /></label>
                    <label>Weekend perk schedule<select value={settings.weekend_shots_mode} onChange={(event) => setSettings({ ...settings, weekend_shots_mode: event.target.value as SiteSettings['weekend_shots_mode'] })}><option value="auto_weekend">Friday–Sunday</option><option value="always_on">Always active</option><option value="off">Off</option></select></label>
                    <label>Minimum booking total (KSh)<input type="number" min="0" max="100000" value={settings.weekend_min_spend} onChange={(event) => setSettings({ ...settings, weekend_min_spend: Number(event.target.value) })} /></label>
                  </fieldset>
                  {isOwner && <fieldset><legend>Visuals & business rules</legend>
                    <label>Homepage rose image URL<input maxLength={2000} value={settings.hero_rose_image_url} onChange={(event) => setSettings({ ...settings, hero_rose_image_url: event.target.value })} /></label>
                    <label>Upload homepage rose image<input aria-label="Upload homepage rose image" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingVisualImage !== null} onChange={(event) => void uploadVisualImage('hero_rose_image_url', event.target.files?.[0])} /><small>{uploadingVisualImage === 'hero_rose_image_url' ? 'Uploading…' : 'JPG, PNG, or WebP · max 5 MB'}</small></label>
                    <label>Booking rose image URL<input maxLength={2000} value={settings.booking_rose_image_url} onChange={(event) => setSettings({ ...settings, booking_rose_image_url: event.target.value })} /></label>
                    <label>Upload booking rose image<input aria-label="Upload booking rose image" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingVisualImage !== null} onChange={(event) => void uploadVisualImage('booking_rose_image_url', event.target.files?.[0])} /><small>{uploadingVisualImage === 'booking_rose_image_url' ? 'Uploading…' : 'JPG, PNG, or WebP · max 5 MB'}</small></label>
                    <label>Small butterflies · {settings.butterfly_count}<input type="range" min="0" max="10" value={settings.butterfly_count} onChange={(event) => setSettings({ ...settings, butterfly_count: Number(event.target.value) })} /></label>
                    {settings.butterfly_count > 0 && <small className="admin-settings-hint">Two larger butterflies are also shown while the effect is enabled.</small>}
                    <label className="admin-settings-toggle">Tap ripple waves<input type="checkbox" checked={settings.touch_wave_enabled} onChange={(event) => setSettings({ ...settings, touch_wave_enabled: event.target.checked })} /></label>
                    <label className="admin-settings-toggle">Gallery gloss sweep<input type="checkbox" checked={settings.uv_gloss_enabled} onChange={(event) => setSettings({ ...settings, uv_gloss_enabled: event.target.checked })} /></label>
                    <label>Cash referral rate (%)<input type="number" min="0" max="100" step="0.5" value={settings.affiliate_cash_percent} onChange={(event) => setSettings({ ...settings, affiliate_cash_percent: Number(event.target.value) })} /></label>
                    <label>Glow credit rate (%)<input type="number" min="0" max="100" step="0.5" value={settings.affiliate_credit_percent} onChange={(event) => setSettings({ ...settings, affiliate_credit_percent: Number(event.target.value) })} /></label>
                    <label>Referral attribution window (days)<input type="number" min="1" max="90" value={settings.attribution_days} onChange={(event) => setSettings({ ...settings, attribution_days: Number(event.target.value) })} /></label>
                  </fieldset>}
                </div>
              </section>
            )}
            {activeTab === 'staff' && isOwner && (
              <section className="admin-panel">
                <div className="admin-panel-heading"><div><h2>Staff access</h2><p>Invite reception managers and nail technicians. Invitations expire after seven days and can be claimed once.</p></div></div>
                <form className="admin-invite-form" onSubmit={(event) => void createInvite(event)}>
                  <label>Full name<input required minLength={2} value={inviteForm.name} onChange={(event) => setInviteForm({ ...inviteForm, name: event.target.value })} /></label>
                  <label>Email<input required type="email" value={inviteForm.email} onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} /></label>
                  <label>Phone<input required type="tel" value={inviteForm.phone} onChange={(event) => setInviteForm({ ...inviteForm, phone: event.target.value })} placeholder="0712 345 678" /></label>
                  <label>Role<select value={inviteForm.role} onChange={(event) => setInviteForm({ ...inviteForm, role: event.target.value as InviteForm['role'] })}><option value="nail_tech">Nail technician</option><option value="reception_manager">Reception manager</option></select></label>
                  <button type="submit" className="admin-payout-button" disabled={savingInvite}><UserPlus /> {savingInvite ? 'Creating invite…' : 'Create invite'}</button>
                </form>
                {inviteLink && <div className="affiliate-link-card"><small>One-time staff invite</small><div className="affiliate-link-row"><code>{inviteLink}</code><button type="button" onClick={() => void copyInvite()}><Copy /> Copy</button></div></div>}
                <div className="table-wrap">
                  <table><thead><tr><th>Staff member</th><th>Phone</th><th>Role</th><th>Access</th><th></th></tr></thead><tbody>
                    {staffMembers.map((member) => <tr key={member.email}><td><b>{member.name}</b><small>{member.email}</small></td><td>{member.phone ?? '—'}</td><td>{member.role.replace('_', ' ')}</td><td>{member.is_active ? 'Active' : 'Disabled'}</td><td>{member.email !== localStaff?.email && <button type="button" className="admin-payout-button" onClick={() => void changeStaffAccess(member)}>{member.is_active ? 'Disable access' : 'Restore access'}</button>}</td></tr>)}
                  </tbody></table>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
