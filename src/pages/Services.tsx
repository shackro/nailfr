import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Check, ChevronDown, Heart, MessageCircle, Minus, Plus, Search, ShoppingBag, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useServices } from '../lib/dataHooks';
import { useSiteSettings } from '../lib/siteSettings';
import { resolveImageSource } from '../lib/imageSources';
import FlowerMark from '../components/FlowerMark';
import SpinningRoseBranch from '../components/SpinningRoseBranch';
import type { PortfolioItem, Service } from '../types';

const fallback: Service[] = [
  { id: 1, name: 'Gel', category: 'Nails', price: 300, duration: 45, description: 'Glossy professional gel finish' },
  { id: 2, name: 'Tips + Gel (plain)', category: 'Nails', price: 600, duration: 75, description: 'Precision tips with a clean gel overlay' },
  { id: 3, name: 'Acrylic', category: 'Nails', price: 1500, duration: 120, description: 'Structured, durable acrylic set' },
  { id: 4, name: 'Builder Gel Extension', category: 'Nails', price: 1000, duration: 90, description: 'Light, strong builder gel extensions' },
  { id: 5, name: 'Builder Overlay', category: 'Nails', price: 700, duration: 75, description: 'Protective builder overlay' },
  { id: 6, name: 'Gum Gel', category: 'Nails', price: 1000, duration: 90, description: 'Flexible gum gel set' },
  { id: 7, name: 'Manicure', category: 'Nails', price: 250, duration: 30, description: 'Cuticle care, shaping and polished finish' },
  { id: 8, name: 'Pedicure', category: 'Self care', price: 800, duration: 60, description: 'Soak, scrub and exfoliate ritual' },
  { id: 9, name: 'Pedicure + Gel', category: 'Self care', price: 1000, duration: 75, description: 'Complete pedicure with gel' },
  { id: 10, name: 'Nail Art (per nail)', category: 'Add-ons', price: 50, duration: 10, description: 'Custom art, priced per nail' },
  { id: 11, name: 'Cotton Candy', category: 'Add-ons', price: 100, duration: 15, description: 'Soft, colourful detail' },
];

const CART_STORAGE_KEY = 'glamourglow-service-cart';
const REFERRAL_STORAGE_KEY = 'glamourglow-referral-code';

function AnimatedPrice({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const currentValue = useRef(value);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentValue.current = value;
      setDisplayValue(value);
      return;
    }

    const from = currentValue.current;
    const started = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - started) / 420, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (value - from) * eased);
      currentValue.current = next;
      setDisplayValue(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="animated-price">KSh {displayValue.toLocaleString()}</span>;
}

function isReferralCode(value: string): boolean {
  return /^[a-z\d_-]{3,64}$/i.test(value);
}

function loadSavedReferral(): string {
  const queryReferral = new URLSearchParams(window.location.search).get('ref')?.trim() ?? '';
  if (isReferralCode(queryReferral)) return queryReferral;
  try {
    const savedReferral = localStorage.getItem(REFERRAL_STORAGE_KEY)?.trim() ?? '';
    if (isReferralCode(savedReferral)) return savedReferral;
    const saved: unknown = JSON.parse(savedReferral);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return '';
    const attribution = saved as { code?: unknown; captured_at?: unknown };
    if (typeof attribution.code !== 'string' || typeof attribution.captured_at !== 'string' || !isReferralCode(attribution.code)) return '';
    const capturedAt = Date.parse(attribution.captured_at);
    return Number.isFinite(capturedAt) && Date.now() - capturedAt <= 90 * 24 * 60 * 60 * 1000 ? attribution.code : '';
  } catch {
    return '';
  }
}

function loadSavedCart(): Record<number, number> {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return {};
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const cart: Record<number, number> = {};
    for (const [id, quantity] of Object.entries(parsed)) {
      if (/^\d+$/.test(id) && typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0) {
        cart[Number(id)] = quantity;
      }
    }
    return cart;
  } catch {
    return {};
  }
}

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: services, error: serviceError } = useServices(fallback);
  const content = useSiteSettings();
  const [chosen, setChosen] = useState<Record<number, number>>(loadSavedCart);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [referral, setReferral] = useState(loadSavedReferral);
  const [referralNotice, setReferralNotice] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioError, setPortfolioError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartInView, setCartInView] = useState(false);
  const [cartExpanded, setCartExpanded] = useState(false);

  useEffect(() => {
    void api<PortfolioItem[]>('/portfolio')
      .then(setPortfolio)
      .catch((requestError: unknown) => setPortfolioError(requestError instanceof Error ? requestError.message : 'Service preview images could not be loaded.'));
  }, []);

  useEffect(() => {
    const cart = document.getElementById('booking-cart');
    if (!cart) return;
    const observer = new IntersectionObserver(([entry]) => setCartInView(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(cart);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      if (Object.keys(chosen).length) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(chosen));
      else localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      setApiError('Your browser could not save your cart. Keep this page open while you finish booking.');
    }
  }, [chosen]);

  useEffect(() => {
    const queryReferral = searchParams.get('ref')?.trim();
    if (!queryReferral) return;
    if (!isReferralCode(queryReferral)) {
      setReferralNotice('That partner referral link is not valid. You can enter a referral code below.');
      return;
    }

    setReferral(queryReferral);
    setReferralNotice('Partner code saved on this browser and will be included with your booking.');
    try {
      localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify({ code: queryReferral, captured_at: new Date().toISOString() }));
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('ref');
        return next;
      }, { replace: true });
    } catch {
      setReferralNotice('Partner code is active for this visit, but your browser could not save it for later.');
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    try {
      if (!referral || !isReferralCode(referral)) {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
        return;
      }
      const current = localStorage.getItem(REFERRAL_STORAGE_KEY);
      if (current === referral) {
        localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify({ code: referral, captured_at: new Date().toISOString() }));
        return;
      }
      try {
        const saved: unknown = current ? JSON.parse(current) : null;
        if (saved && typeof saved === 'object' && !Array.isArray(saved) && 'code' in saved && saved.code === referral) return;
      } catch {
        // Existing referral strings are upgraded to expiring first-party attribution records.
      }
      localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify({ code: referral, captured_at: new Date().toISOString() }));
    } catch {
      setReferralNotice('Your browser could not save the referral code. It will still be included if you book now.');
    }
  }, [referral]);

  useEffect(() => {
    try {
      const current = localStorage.getItem(REFERRAL_STORAGE_KEY);
      if (!current || isReferralCode(current)) return;
      const saved: unknown = JSON.parse(current);
      if (!saved || typeof saved !== 'object' || Array.isArray(saved) || !('captured_at' in saved) || typeof saved.captured_at !== 'string') return;
      const capturedAt = Date.parse(saved.captured_at);
      if (Number.isFinite(capturedAt) && Date.now() - capturedAt > content.attribution_days * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
        setReferral('');
        setReferralNotice('The saved partner referral has expired.');
      }
    } catch {
      setReferralNotice('Your browser could not verify the saved referral window.');
    }
  }, [content.attribution_days]);

  useEffect(() => {
    const preselected = searchParams.get('preselect');
    if (!preselected) return;
    const names = preselected.split(',').map((item) => item.trim().toLowerCase());
    setChosen((current) => {
      const next = { ...current };
      for (const service of services) {
        if (names.some((serviceName) => service.name.toLowerCase().startsWith(serviceName))) next[service.id] = 1;
      }
      return next;
    });
  }, [searchParams, services]);

  const total = useMemo(() => services.reduce((sum, service) => sum + service.price * (chosen[service.id] || 0), 0), [services, chosen]);
  const minutes = useMemo(() => services.reduce((sum, service) => sum + service.duration * (chosen[service.id] || 0), 0), [services, chosen]);
  const selected = services.filter((service) => chosen[service.id]).flatMap((service) =>
    Array.from({ length: chosen[service.id] }, () => service.name === 'Nail Art (per nail)' ? 'Nail Art' : service.name),
  );
  const cartCount = Object.values(chosen).reduce((sum, quantity) => sum + quantity, 0);
  const categories = ['All', ...new Set(services.map((service) => service.category))];
  const serviceGroups = ['Nails', 'Self care', 'Add-ons', ...categories.slice(1).filter((item) => !['Nails', 'Self care', 'Add-ons'].includes(item))];
  const visibleServices = services.filter((service) =>
    (category === 'All' || service.category === category)
    && `${service.name} ${service.description} ${service.category}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const isWeekend = content.weekend_shots_mode === 'always_on'
    || (content.weekend_shots_mode === 'auto_weekend' && Boolean(date) && [0, 5, 6].includes(new Date(`${date}T12:00:00`).getDay()));
  const hasWeekendPerk = isWeekend && total >= content.weekend_min_spend;
  const artworkFor = (service: Service) => {
    const linkedName = service.name === 'Nail Art (per nail)' ? 'Nail Art' : service.name;
    const exactMatch = portfolio.find((item) => item.services.some((linkedService) => linkedService.toLowerCase() === linkedName.toLowerCase()));
    if (exactMatch) return exactMatch;
    const preferredCategory = service.category === 'Self care' ? 'Self Care' : service.category === 'Add-ons' ? 'Nail Art' : 'Gel';
    return portfolio.find((item) => item.category.toLowerCase() === preferredCategory.toLowerCase()) ?? portfolio[0];
  };

  const toggle = (id: number, delta: number) => setChosen((current) => {
    const next = { ...current, [id]: Math.max(0, (current[id] || 0) + delta) };
    if (!next[id]) delete next[id];
    return next;
  });

  const goToCart = () => {
    const target = document.getElementById(cartCount ? 'booking-cart' : 'service-menu');
    target?.scrollIntoView({ behavior: 'smooth', block: cartCount ? 'start' : 'center' });
    if (cartCount) {
      window.setTimeout(() => document.getElementById('booking-name')?.focus({ preventScroll: true }), 450);
    }
  };

  const tiltServiceCard = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty('--service-tilt-x', `${-y * 2.5}deg`);
    event.currentTarget.style.setProperty('--service-tilt-y', `${x * 2.5}deg`);
  };

  const resetServiceCardTilt = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--service-tilt-x', '0deg');
    event.currentTarget.style.setProperty('--service-tilt-y', '0deg');
  };

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !date || !time || !selected.length) {
      setApiError('Add your details, appointment date and time, and at least one service.');
      return;
    }
    setApiError('');
    setLoading(true);
    const whatsapp = window.open('', '_blank');
    if (!whatsapp) {
      setApiError('Allow pop-ups to continue to WhatsApp.');
      setLoading(false);
      return;
    }
    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), phone, date, time, services: selected, total, referral: referral || null }),
      });
      const message = [
        '🌸 GLAMOURGLOW SPA BOOKING',
        '================',
        `Name: ${name.trim()}`,
        `Phone: ${phone}`,
        '',
        'Services:',
        ...selected.map((service, index) => `${index + 1}. ${service}`),
        `\nTotal: KSh ${total.toLocaleString()}`,
        `Estimated duration: ${minutes} minutes`,
        `Date: ${date}`,
        `Time: ${time}`,
        referral ? `Referral: ${referral}` : '',
        `Weekend special: ${hasWeekendPerk ? 'FREE SHOTS ✓' : 'Not applicable'}`,
        '\nPlease confirm availability!',
      ].filter(Boolean).join('\n');
      whatsapp.location.href = `https://wa.me/254712872030?text=${encodeURIComponent(message)}`;
    } catch (requestError) {
      whatsapp.close();
      setApiError(requestError instanceof Error ? requestError.message : 'The booking could not be saved. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="page-hero booking-page-hero">
        <div className="booking-page-copy">
          <span className="eyebrow"><FlowerMark /> BOOK A VISIT</span>
          <h1>Make time for<br /><em>yourself.</em></h1>
          <p>Choose what you love. We’ll take care of the details.</p>
        </div>
        <SpinningRoseBranch />
      </section>
      <div className="booking-layout">
        <section className="service-menu" id="service-menu">
          <div className="menu-title"><div><span className="eyebrow">PERSONALIZE YOUR VISIT</span><h2>The service menu</h2></div><span>{cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart</span></div>
          <div className="service-discovery">
            <label className="service-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search nails, pedicure, gel…" aria-label="Search services" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X /></button>}</label>
            <div className="service-categories" aria-label="Filter services">
              {categories.map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
          </div>
          {visibleServices.length ? serviceGroups.filter((group) => visibleServices.some((service) => service.category === group) && (category === 'All' || category === group)).map((group) => (
            <div className="menu-group" key={group}>
              <h3><Heart /> {group}<span>{visibleServices.filter((service) => service.category === group).length} options</span></h3>
              {visibleServices.filter((service) => service.category === group).map((service) => (
                <article className={`service-row ${chosen[service.id] ? 'selected' : ''}`} key={service.id} onPointerMove={tiltServiceCard} onPointerLeave={resetServiceCardTilt}>
                  <div className="service-art">
                    {artworkFor(service) ? <img src={resolveImageSource(artworkFor(service)?.image ?? '')} alt="" loading="lazy" /> : <FlowerMark />}
                    <button type="button" className={`service-select ${chosen[service.id] ? 'is-selected' : ''}`} aria-label={chosen[service.id] ? `Remove ${service.name} from booking` : `Select ${service.name}`} aria-pressed={Boolean(chosen[service.id])} onClick={() => toggle(service.id, chosen[service.id] ? -chosen[service.id] : 1)}><Check /></button>
                  </div>
                  <div className="service-card-copy">
                    <div className="service-info"><b>{service.name}</b><p>{service.description}</p><small>{service.duration} min</small></div>
                    <div className="service-pick">
                      <strong>KSh {service.price.toLocaleString()}</strong>
                      {chosen[service.id] ? (
                        <div className="counter"><button type="button" aria-label={`Remove one ${service.name}`} onClick={() => toggle(service.id, -1)}><Minus /></button><span>{chosen[service.id]}</span><button type="button" aria-label={`Add one ${service.name}`} onClick={() => toggle(service.id, 1)}><Plus /></button></div>
                      ) : <button type="button" aria-label={`Add ${service.name} to booking`} onClick={() => toggle(service.id, 1)}><Plus /> Add</button>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )) : <p className="service-empty">No services match that search. Try another name or category.</p>}
          {serviceError && <p className="affiliate-error" role="status">Showing the saved menu because live services could not be loaded: {serviceError}</p>}
          {portfolioError && <p className="service-image-note" role="status">Design previews are unavailable right now; you can still choose from the full service menu.</p>}
          {apiError && <p className="affiliate-error" role="alert">{apiError}</p>}
        </section>
        <aside className={`summary ${cartExpanded ? '' : 'cart-collapsed'} ${cartInView ? 'has-mobile-dock' : ''}`} id="booking-cart">
          <div className="summary-head">
            <span><ShoppingBag /> Your booking</span>
            <button type="button" className="cart-collapse" aria-controls="booking-cart-breakdown" aria-expanded={cartExpanded} onClick={() => setCartExpanded((expanded) => !expanded)}>
              <b>{cartCount} {cartCount === 1 ? 'item' : 'items'}</b><ChevronDown />
            </button>
          </div>
          <div className="cart-breakdown" id="booking-cart-breakdown">
            {selected.length ? <ul className="cart-items">{services.filter((service) => chosen[service.id]).map((service) => (
              <li key={service.id}><div><b>{service.name}</b><small>{chosen[service.id]} × KSh {service.price.toLocaleString()}</small></div><div className="counter"><button type="button" aria-label={`Remove one ${service.name} from cart`} onClick={() => toggle(service.id, -1)}><Minus /></button><span>{chosen[service.id]}</span><button type="button" aria-label={`Add one ${service.name} to cart`} onClick={() => toggle(service.id, 1)}><Plus /></button></div></li>
            ))}</ul> : <p className="muted cart-empty">Your cart is waiting. Add a service to start planning your visit.</p>}
            <div className="price-line"><span>Estimated time</span><b>{minutes} min</b></div>
          </div>
          <div className="price-line total"><span>Subtotal</span><b><AnimatedPrice value={total} /></b></div>
          {hasWeekendPerk && <div className="special"><FlowerMark /> {content.weekend_title}</div>}
          {isWeekend && !hasWeekendPerk && content.weekend_min_spend > 0 && <p className="fine">Spend KSh {content.weekend_min_spend.toLocaleString()} or more to unlock this weekend perk.</p>}
          <div className="cart-details-heading"><span>Booking details</span><small>Complete these to request your visit</small></div>
          <label>Your name<input id="booking-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Jane N." /></label>
          <label>Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="0712 345 678" /></label>
          <div className="form-split">
            <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} min={new Date().toISOString().slice(0, 10)} /></label>
            <label>Time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
          </div>
          <label>Referral code <small>(optional)</small>
            <div className="referral-code-field">
              <input value={referral} onChange={(event) => setReferral(event.target.value.trim())} placeholder="Your partner's code" autoComplete="off" />
              {referral && <button type="button" onClick={() => { setReferral(''); setReferralNotice('Referral code cleared from this browser.'); }}>Clear</button>}
            </div>
          </label>
          <small className="referral-privacy-note">{referralNotice || 'Partner codes are saved only in this browser so your booking keeps its referral. Clear the code anytime.'}</small>
          <button type="button" className="primary full" disabled={loading} onClick={() => void submit()}><MessageCircle /> {loading ? 'Saving booking…' : 'Book via WhatsApp'}</button>
          <small className="fine">Your booking is saved before WhatsApp opens. We’ll confirm your appointment there.</small>
        </aside>
      </div>
      <div className={`mobile-cart-bar ${cartInView ? 'is-near-cart' : ''}`}>
        <div><span><ShoppingBag /> Your cart <b>{cartCount}</b></span><strong><AnimatedPrice value={total} /></strong></div>
        <button type="button" onClick={cartInView ? () => document.getElementById('service-menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : goToCart}>{cartInView ? 'Services' : cartCount ? 'Review & book' : 'Browse services'} <span>{cartInView ? '↑' : '→'}</span></button>
      </div>
    </>
  );
}
