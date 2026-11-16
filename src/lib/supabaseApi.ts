import { supabase } from './supabase';
import type { Database } from './database.types';

type BookingInput = Database['public']['Tables']['bookings']['Insert'];
type ReviewInput = Database['public']['Tables']['reviews']['Insert'];
type ContactInput = Database['public']['Tables']['contact_messages']['Insert'];
type BookingStatus = Database['public']['Tables']['bookings']['Row']['status'];

function isBookingStatus(value: string | null): value is BookingStatus {
  return value === 'pending' || value === 'confirmed' || value === 'completed' || value === 'cancelled';
}

function toE164(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
  return `+254${digits}`;
}

function requestBody<T>(init?: RequestInit): T {
  if (!init?.body || typeof init.body !== 'string') throw new Error('A request body is required.');
  return JSON.parse(init.body) as T;
}

function ensureClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

async function requireAdmin(client: NonNullable<typeof supabase>) {
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Sign in with an owner account to manage the lookbook.');
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile?.is_admin) throw new Error('Only an authorized site administrator can manage the lookbook.');
}

export async function supabaseApi<T>(path: string, init?: RequestInit): Promise<T> {
  const client = ensureClient();
  const method = (init?.method ?? 'GET').toUpperCase();
  const url = new URL(path, 'http://glamourglow.local');
  let result: unknown;

  if (url.pathname === '/site-settings' && method === 'GET') {
    const { data, error } = await client.from('site_settings').select('content').eq('id', 1).maybeSingle();
    if (error) throw error;
    result = data?.content ?? {};
  } else if (url.pathname === '/admin/site-settings' && method === 'PUT') {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Sign in with an owner account to update site settings.');
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('is_admin')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.is_admin) throw new Error('Only an authorized site administrator can publish these settings.');
    const content = requestBody<Record<string, unknown>>(init);
    const { error } = await client.from('site_settings').upsert({ id: 1, content });
    if (error) throw error;
    result = content;
  } else if (url.pathname === '/admin/services' && method === 'GET') {
    const { data, error } = await client.from('salon_services').select('*').order('category').order('name');
    if (error) throw error;
    result = data;
  } else if (url.pathname === '/admin/services' && method === 'POST') {
    await requireAdmin(client);
    const service = requestBody<Database['public']['Tables']['salon_services']['Insert']>(init);
    const { data, error } = await client.from('salon_services').insert(service).select('*').single();
    if (error) throw error;
    result = data;
  } else if (/^\/admin\/services\/\d+$/.test(url.pathname) && method === 'PATCH') {
    const id = Number(url.pathname.split('/').at(-1));
    const updates = requestBody<Database['public']['Tables']['salon_services']['Update']>(init);
    const { data, error } = await client.from('salon_services').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    result = data;
  } else if (url.pathname === '/health' && method === 'GET') {
    result = { status: 'ok' };
  } else if (url.pathname === '/services' && method === 'GET') {
    const { data, error } = await client.from('salon_services').select('*').eq('is_active', true).order('category');
    if (error) throw error;
    result = data;
  } else if (url.pathname === '/bookings' && method === 'GET') {
    const { data, error } = await client.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    result = data;
  } else if (url.pathname === '/bookings' && method === 'POST') {
    const body = requestBody<BookingInput>(init);
    const booking = { ...body, phone: toE164(body.phone) };
    const { error } = await client.from('bookings').insert(booking);
    if (error) throw error;
    result = { status: 'pending' };
  } else if (/^\/bookings\/\d+$/.test(url.pathname) && method === 'PATCH') {
    const id = Number(url.pathname.split('/').at(-1));
    const status = url.searchParams.get('status');
    if (!isBookingStatus(status)) throw new Error('Invalid booking status.');
    const { error } = await client.from('bookings').update({ status }).eq('id', id);
    if (error) throw error;
    result = { id, status };
  } else if (url.pathname === '/reviews' && method === 'GET') {
    const { data, error } = await client.from('reviews').select('*').eq('status', 'approved').order('created_at', { ascending: false });
    if (error) throw error;
    result = data;
  } else if (url.pathname === '/reviews' && method === 'POST') {
    const review = requestBody<ReviewInput>(init);
    const { error } = await client.from('reviews').insert(review);
    if (error) throw error;
    result = { status: 'submitted' };
  } else if (url.pathname === '/portfolio' && method === 'GET') {
    const { data, error } = await client.from('portfolio_items').select('*').eq('is_published', true).order('created_at', { ascending: false });
    if (error) throw error;
    result = data;
  } else if (url.pathname === '/admin/portfolio' && method === 'GET') {
    const { data, error } = await client.from('portfolio_items').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    result = data;
  } else if (url.pathname === '/admin/portfolio' && method === 'POST') {
    await requireAdmin(client);
    const item = requestBody<Database['public']['Tables']['portfolio_items']['Insert']>(init);
    const { data, error } = await client.from('portfolio_items').insert(item).select('*').single();
    if (error) throw error;
    result = data;
  } else if (/^\/admin\/portfolio\/\d+$/.test(url.pathname) && method === 'PUT') {
    await requireAdmin(client);
    const id = Number(url.pathname.split('/').at(-1));
    const updates = requestBody<Database['public']['Tables']['portfolio_items']['Update']>(init);
    const { data, error } = await client.from('portfolio_items').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    result = data;
  } else if (url.pathname === '/events' && method === 'GET') {
    const { data, error } = await client.from('events').select('*').eq('is_published', true).order('date');
    if (error) throw error;
    result = data.map((event) => ({ ...event, remaining_slots: Math.max(0, event.total_slots - event.booked_slots) }));
  } else if (url.pathname === '/events/register' && method === 'POST') {
    const registration = requestBody<{ event_id: number; name: string; phone: string }>(init);
    const { data, error } = await client.rpc('reserve_event', {
      p_event_id: registration.event_id,
      p_name: registration.name,
      p_phone: toE164(registration.phone),
    });
    if (error) throw error;
    result = { id: data, status: 'reserved', payment_required: true, message: 'Your seat is reserved pending payment confirmation.' };
  } else if (url.pathname === '/contact' && method === 'POST') {
    const message = requestBody<ContactInput>(init);
    const { error } = await client.from('contact_messages').insert(message);
    if (error) throw error;
    result = { status: 'received' };
  } else if (url.pathname === '/affiliates' && method === 'POST') {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    const user = userData.user;
    if (!user?.phone) throw new Error('Verify your mobile number before creating a referral link.');
    const { data: existing, error: lookupError } = await client.from('affiliate_accounts').select('user_id,phone,code').eq('user_id', user.id).maybeSingle();
    if (lookupError) throw lookupError;
    let account = existing;
    if (!account) {
      const code = crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
      const { data, error } = await client.from('affiliate_accounts').insert({ user_id: user.id, phone: user.phone, code }).select('user_id,phone,code').single();
      if (error) throw error;
      account = data;
    }
    result = await loadAffiliate(client, account.code, account.phone);
  } else if (url.pathname === '/affiliates/summary' && method === 'GET') {
    const [{ count, error: accountsError }, { data: logs, error: logsError }] = await Promise.all([
      client.from('affiliate_accounts').select('user_id', { count: 'exact', head: true }),
      client.from('affiliate_sales_logs').select('commission_amount,payout_state'),
    ]);
    if (accountsError) throw accountsError;
    if (logsError) throw logsError;
    result = {
      count: count ?? 0,
      referrals: logs.length,
      pending: logs.filter((log) => log.payout_state === 'Pending').reduce((sum, log) => sum + log.commission_amount, 0),
      paid: logs.filter((log) => log.payout_state === 'Approved_Sent').reduce((sum, log) => sum + log.commission_amount, 0),
    };
  } else if (url.pathname === '/admin/affiliates' && method === 'GET') {
    const [{ data: accounts, error: accountError }, { data: logs, error: logError }] = await Promise.all([
      client.from('affiliate_accounts').select('phone,code'),
      client.from('affiliate_sales_logs').select('affiliate_mpesa_number,commission_amount,payout_state'),
    ]);
    if (accountError) throw accountError;
    if (logError) throw logError;
    result = accounts.map((account) => {
      const accountLogs = logs.filter((log) => log.affiliate_mpesa_number === account.phone);
      return {
        code: account.code,
        phone: account.phone,
        referrals: accountLogs.length,
        pending: accountLogs.filter((log) => log.payout_state === 'Pending').reduce((sum, log) => sum + log.commission_amount, 0),
        paid: accountLogs.filter((log) => log.payout_state === 'Approved_Sent').reduce((sum, log) => sum + log.commission_amount, 0),
      };
    });
  } else if (/^\/admin\/affiliates\/[A-Za-z0-9]+\/payout$/.test(url.pathname) && method === 'PATCH') {
    const code = decodeURIComponent(url.pathname.split('/').at(-2) ?? '');
    const { data: account, error: accountError } = await client.from('affiliate_accounts').select('phone').eq('code', code).single();
    if (accountError) throw accountError;
    const { data, error } = await client.from('affiliate_sales_logs')
      .update({ payout_state: 'Approved_Sent' })
      .eq('affiliate_mpesa_number', account.phone)
      .eq('payout_state', 'Pending')
      .select('id,commission_amount');
    if (error) throw error;
    result = { code, paid: data.reduce((sum, log) => sum + log.commission_amount, 0) };
  } else if (/^\/affiliates\/[A-Za-z0-9]+$/.test(url.pathname) && method === 'GET') {
    const code = decodeURIComponent(url.pathname.split('/').at(-1) ?? '');
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!userData.user?.phone) throw new Error('Verify your mobile number to view affiliate activity.');
    result = await loadAffiliate(client, code, userData.user.phone);
  } else {
    throw new Error(`Supabase does not support ${method} ${url.pathname}.`);
  }

  return result as T;
}

async function loadAffiliate(client: NonNullable<typeof supabase>, code: string, phone: string) {
  const { data: account, error: accountError } = await client.from('affiliate_accounts').select('code,phone').eq('code', code).single();
  if (accountError) throw accountError;
  if (account.phone !== phone) throw new Error('This referral account does not belong to the verified number.');
  const { data: logs, error: logsError } = await client.from('affiliate_sales_logs').select('id,booking_id,booking_services,booking_amount,commission_amount,payout_state,created_at').eq('affiliate_mpesa_number', phone).order('created_at', { ascending: false });
  if (logsError) throw logsError;
  return {
    code: account.code,
    link: `/services?ref=${account.code}`,
    referrals: logs.length,
    pending: logs.filter((log) => log.payout_state === 'Pending').reduce((sum, log) => sum + log.commission_amount, 0),
    paid: logs.filter((log) => log.payout_state === 'Approved_Sent').reduce((sum, log) => sum + log.commission_amount, 0),
    activity: logs.map((log) => ({
      id: log.booking_id,
      services: log.booking_services,
      amount: log.booking_amount,
      commission: log.commission_amount,
      status: log.payout_state === 'Approved_Sent' ? 'paid' : 'pending',
      date: log.created_at.slice(0, 10),
    })),
  };
}
