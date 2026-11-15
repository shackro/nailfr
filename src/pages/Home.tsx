import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ArrowRight, CalendarDays, Camera, Heart, MapPin, Navigation, Phone, ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useReviews } from '../lib/dataHooks';
import { studioAddress, studioDirectionsUrlFor } from '../lib/location';
import { useSiteSettings } from '../lib/siteSettings';
import { resolveImageSource } from '../lib/imageSources';
import FlowerMark from '../components/FlowerMark';
import StudioMap from '../components/StudioMap';
import type { PortfolioItem } from '../types';

const categories = ['All', 'Gel', 'Acrylic', 'Nail Art', 'Self Care'];
const waveColors = ['#ec4899', '#a855f7', '#f472b6'];
const migratingButterflies = [
  { left: '0%', top: '0%', size: 30, duration: '29s', delay: '-2s', curve: '-7vh', wing: '#ed8b26', highlight: '#f6c95d', detail: '#281a1b', edge: '#352020', body: '#2b1b1b', flap: '1.2s' },
  { left: '10%', top: '2%', size: 24, duration: '34s', delay: '-9s', curve: '8vh', wing: '#327ac7', highlight: '#8ed5ff', detail: '#e9f8ff', edge: '#173c69', body: '#222641', flap: '1.35s' },
  { left: '3%', top: '7%', size: 27, duration: '31s', delay: '-5s', curve: '-4vh', wing: '#d86781', highlight: '#f8b4bd', detail: '#fff0d9', edge: '#71394c', body: '#38202f', flap: '1.45s' },
  { left: '20%', top: '0%', size: 22, duration: '36s', delay: '-13s', curve: '6vh', wing: '#8371bd', highlight: '#d4c7f5', detail: '#fff3d4', edge: '#443a73', body: '#292239', flap: '1.3s' },
  { left: '27%', top: '4%', size: 25, duration: '32s', delay: '-16s', curve: '-9vh', wing: '#4d9479', highlight: '#b8dda2', detail: '#f8f0d7', edge: '#285745', body: '#22372f', flap: '1.55s' },
  { left: '12%', top: '8%', size: 24, duration: '33s', delay: '-7s', curve: '5vh', wing: '#d7a643', highlight: '#ffe49a', detail: '#fff5dd', edge: '#72511e', body: '#3e2e20', flap: '1.4s' },
  { left: '35%', top: '1%', size: 21, duration: '38s', delay: '-12s', curve: '-6vh', wing: '#4293a7', highlight: '#a5e5e7', detail: '#f2fff8', edge: '#245366', body: '#233747', flap: '1.25s' },
  { left: '6%', top: '10%', size: 23, duration: '30s', delay: '-3s', curve: '8vh', wing: '#b64d8d', highlight: '#f2a1cb', detail: '#fff1de', edge: '#693658', body: '#3a2638', flap: '1.5s' },
  { left: '25%', top: '10%', size: 20, duration: '35s', delay: '-15s', curve: '-5vh', wing: '#67765a', highlight: '#c9d89a', detail: '#fff6db', edge: '#384832', body: '#28332a', flap: '1.65s' },
  { left: '39%', top: '8%', size: 22, duration: '37s', delay: '-18s', curve: '7vh', wing: '#9167a4', highlight: '#d8b7e5', detail: '#fff2db', edge: '#574066', body: '#30273c', flap: '1.3s' },
  { left: '58%', top: '2%', size: 54, duration: '48s', delay: '-21s', curve: '-11vh', wing: '#e88931', highlight: '#ffe28a', detail: '#37201d', edge: '#5e3028', body: '#302020', flap: '1.7s', large: true },
  { left: '67%', top: '4%', size: 50, duration: '52s', delay: '-34s', curve: '10vh', wing: '#477eb7', highlight: '#b8e4f4', detail: '#fff4d7', edge: '#263d6e', body: '#20243a', flap: '1.85s', large: true },
];
const floatingHearts = [
  { left: '18%', top: '70%', size: 18, delay: '-2s' },
  { left: '43%', top: '80%', size: 14, delay: '-6s' },
  { left: '70%', top: '63%', size: 22, delay: '-4s' },
  { left: '85%', top: '34%', size: 16, delay: '-8s' },
];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [looks, setLooks] = useState<PortfolioItem[]>([]);
  const [lookError, setLookError] = useState('');
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const rippleId = useRef(0);
  const { data: reviews } = useReviews();
  const content = useSiteSettings();
  const directionsUrl = studioDirectionsUrlFor(content.address || studioAddress);
  const featuredReview = reviews[0];
  const handleHeroPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!content.touch_wave_enabled) return;
    if (event.target instanceof Element && event.target.closest('button, a, input')) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const id = ++rippleId.current;
    const ripple = {
      id,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      color: waveColors[(id - 1) % waveColors.length],
    };
    setRipples((current) => [...current.slice(-3), ripple]);
  };
  useEffect(() => {
    api<PortfolioItem[]>('/portfolio').then(setLooks).catch((requestError: unknown) => {
      setLookError(requestError instanceof Error ? requestError.message : 'Could not load the lookbook.');
    });
  }, []);
  const filteredLooks = activeFilter === 'All' ? looks : looks.filter((look) => look.category === activeFilter);

  return (
    <>
      <section
        className="hero vibrant-hero"
        onPointerDown={handleHeroPointerDown}
      >
        <div className="hero-migration-layer" aria-hidden="true">
          {[...migratingButterflies.slice(0, Math.min(content.butterfly_count, migratingButterflies.length - 2)), ...(content.butterfly_count > 0 ? migratingButterflies.slice(-2) : [])].map((butterfly, index) => (
            <span
              className={`hero-migrating-butterfly${butterfly.large ? ' hero-migrating-butterfly-large' : ''}`}
              key={index}
              style={{
                left: butterfly.left,
                top: butterfly.top,
                '--butterfly-size': `${butterfly.size}px`,
                '--butterfly-duration': butterfly.duration,
                '--butterfly-delay': butterfly.delay,
                '--butterfly-curve': butterfly.curve,
                '--butterfly-wing': butterfly.wing,
                '--butterfly-highlight': butterfly.highlight,
                '--butterfly-detail': butterfly.detail,
                '--butterfly-edge': butterfly.edge,
                '--butterfly-body-color': butterfly.body,
                '--butterfly-flap-duration': butterfly.flap,
              } as CSSProperties}
            >
              <svg viewBox="0 0 64 80">
                <defs>
                  <linearGradient id={`butterfly-wing-${index}`} x1="10" y1="8" x2="53" y2="68" gradientUnits="userSpaceOnUse">
                    <stop stopColor={butterfly.highlight} />
                    <stop offset=".52" stopColor={butterfly.wing} />
                    <stop offset="1" stopColor={butterfly.edge} />
                  </linearGradient>
                </defs>
                <g className="butterfly-wing butterfly-wing-left">
                  <path className="butterfly-wing-shape" fill={`url(#butterfly-wing-${index})`} d="M30 37C22 23 15 7 8 7 2 7 2 18 5 28 8 39 17 46 29 48Z" />
                  <path className="butterfly-wing-shape" fill={`url(#butterfly-wing-${index})`} d="M29 43C19 40 11 43 9 51 7 59 12 70 20 72 26 73 31 63 32 51Z" />
                  <path className="butterfly-wing-vein" d="M28 42 10 12M28 44 6 25M27 46 12 46M28 47 12 56M29 49 20 67M27 42 19 14M25 44 10 34M27 48 15 51M29 51 23 63" />
                  <path className="butterfly-wing-mark" d="m10 12 2-2m4 8 2-2m3 8 2-2" />
                  <circle className="butterfly-wing-spot-ring" cx="15" cy="57" r="3.1" />
                  <circle className="butterfly-wing-spot" cx="15" cy="57" r="1.6" />
                  <circle className="butterfly-wing-spot-ring" cx="20" cy="64" r="2.6" />
                  <circle className="butterfly-wing-spot" cx="20" cy="64" r="1.2" />
                </g>
                <g className="butterfly-wing butterfly-wing-right">
                  <path className="butterfly-wing-shape" fill={`url(#butterfly-wing-${index})`} d="M34 37C42 23 49 7 56 7 62 7 62 18 59 28 56 39 47 46 35 48Z" />
                  <path className="butterfly-wing-shape" fill={`url(#butterfly-wing-${index})`} d="M35 43C45 40 53 43 55 51 57 59 52 70 44 72 38 73 33 63 32 51Z" />
                  <path className="butterfly-wing-vein" d="m36 42 18-30m-18 32 22-19m-21 21h15m-16 1 15 10m-16-8 9 18m-1-55-8 28m9-14L42 44m-5 4 12 3m-13 4 6 12" />
                  <path className="butterfly-wing-mark" d="m54 12-2-2m-4 8-2-2m-3 8-2-2" />
                  <circle className="butterfly-wing-spot-ring" cx="49" cy="57" r="3.1" />
                  <circle className="butterfly-wing-spot" cx="49" cy="57" r="1.6" />
                  <circle className="butterfly-wing-spot-ring" cx="44" cy="64" r="2.6" />
                  <circle className="butterfly-wing-spot" cx="44" cy="64" r="1.2" />
                </g>
                <path className="butterfly-antennae" d="M31 19C28 13 25 11 22 10m11 9c3-6 6-8 9-9" />
                <path className="butterfly-body" d="M32 17c-2 0-3 2-3 5s1 4 3 4 3-2 3-4-1-5-3-5Zm0 9v20c0 5-2 10-3 15m3-15c0 5 2 10 3 15" />
              </svg>
            </span>
          ))}
          {floatingHearts.map((heart, index) => (
            <Heart
              className="hero-floating-heart"
              key={index}
              fill="currentColor"
              style={{
                left: heart.left,
                top: heart.top,
                width: heart.size,
                height: heart.size,
                animationDelay: heart.delay,
              }}
            />
          ))}
          {content.touch_wave_enabled && ripples.map((ripple) => (
            <span
              className="hero-touch-wave-group"
              key={ripple.id}
              style={{ left: ripple.x, top: ripple.y, '--wave-color': ripple.color } as CSSProperties}
            >
              {[0, 1, 2].map((wave) => (
                <i
                  className="hero-touch-ripple"
                  key={wave}
                  style={{ '--wave-delay': `${wave * 140}ms` } as CSSProperties}
                  onAnimationEnd={wave === 2 ? () => setRipples((current) => current.filter((item) => item.id !== ripple.id)) : undefined}
                />
              ))}
            </span>
          ))}
        </div>
        <div className="hero-copy">
          <span className="eyebrow hero-label"><FlowerMark /> {content.home_eyebrow}</span>
          <h1>{content.home_title}</h1>
          <p>{content.home_description}</p>
          <div className="hero-actions">
            <Link className="primary" to="/book">Design your set <ArrowRight /></Link>
            <Link className="text-link" to="/gallery"><Camera /> View our work</Link>
          </div>
          <div className="proof">
            <div><strong>500+</strong><span>happy clients</span></div>
            <div><strong>50+</strong><span>signature designs</span></div>
            <div><strong>4.9</strong><span><Star /> client rating</span></div>
          </div>
        </div>
        <div className="hero-art vibrant-hero-art">
          <img className="hero-rose-art" src={content.hero_rose_image_url} alt="" aria-hidden="true" />
          {content.weekend_shots_mode !== 'off' && (
            <div className="hero-promo">
              <span className="eyebrow">A LITTLE WEEKEND MAGIC</span>
              <strong>{content.weekend_title}</strong>
              <small>{content.weekend_description}</small>
              <Link to="/services">Plan your visit <ArrowRight /></Link>
            </div>
          )}
          <span className="hero-sparkle sparkle-one">✦</span>
          <span className="hero-sparkle sparkle-two">✧</span>
        </div>
      </section>

      <section className="ticker vibrant-ticker"><span>NAIL ART</span><i>✦</i><span>BUILDER GEL</span><i>✦</i><span>ACRYLIC</span><i>✦</i><span>SELF CARE</span><i>✦</i><span>MADE IN THIKA</span></section>

      <section className="section home-services">
        <div className="section-heading">
          <div><span className="eyebrow">THE MENU</span><h2>A little love<br />for every <em>you.</em></h2></div>
          <Link className="text-link" to="/services">See all services <ArrowRight /></Link>
        </div>
        <div className="category-grid">
          <Link className="category nails" to="/services"><div /><span>01</span><h3>Nails</h3><p>Gel, acrylic, builder and art</p><ArrowRight /></Link>
          <Link className="category selfcare" to="/services"><div /><span>02</span><h3>Self care</h3><p>Soothing mani & pedi rituals</p><ArrowRight /></Link>
          <Link className="category beauty" to="/services"><div /><span>03</span><h3>Special finishes</h3><p>From subtle to statement</p><ArrowRight /></Link>
        </div>
      </section>

      <section className="lookbook-section">
        <div className="lookbook-heading">
          <span className="eyebrow"><FlowerMark /> THE GLAMOURGLOW LOOKBOOK</span>
          <h2>Find your next<br /><em>favourite look.</em></h2>
          <p>Browse recent favourites and book a set inspired by the designs you love.</p>
        </div>
        <div className="lookbook-filters" role="group" aria-label="Filter designs">
          {categories.map((category) => (
            <button type="button" className={category === activeFilter ? 'active' : ''} key={category} onClick={() => setActiveFilter(category)}>
              {category}
            </button>
          ))}
        </div>
        <div className="lookbook-grid">
          {filteredLooks.map((look, index) => (
            <Link
              className={`lookbook-card lookbook-card-${index % 3}`}
              key={look.title}
              to={`/services?preselect=${encodeURIComponent(look.services.join(','))}`}
            >
              <img src={resolveImageSource(look.image)} alt={look.title} loading="lazy" />
              <span className="lookbook-heart"><Heart /></span>
              <div className="lookbook-overlay">
                <span>{look.category}</span>
                <strong>{look.title}</strong>
                <small><Star /> KSh {look.price.toLocaleString()}</small>
                <b><ShoppingBag /> Book this look</b>
              </div>
            </Link>
          ))}
        </div>
        {lookError && <p className="affiliate-activity-empty" role="status">The live lookbook is temporarily unavailable: {lookError}</p>}
        {!lookError && filteredLooks.length === 0 && <p className="affiliate-activity-empty">There are no designs in this category yet.</p>}
        <div className="lookbook-more"><Link className="text-link" to="/gallery">Explore the full gallery <ArrowRight /></Link></div>
      </section>

      <section className="home-promo">
        <div className="home-promo-copy">
          <span className="eyebrow"><CalendarDays /> YOUR WEEKEND PLANS, SORTED</span>
          <h2>{content.weekend_title}</h2>
          <p>{content.weekend_description}</p>
          <Link className="primary" to="/services">Book your weekend <ArrowRight /></Link>
        </div>
        <div className="home-promo-art">
          <div className="promo-orbit orbit-one" /><div className="promo-orbit orbit-two" />
          <div className="promo-sticker"><FlowerMark /><strong>FREE<br />SHOTS</strong><small>weekends</small></div>
        </div>
      </section>

      {featuredReview && <section className="testimonial">
        <div className="quote-mark">“</div>
        <blockquote>{featuredReview.text}</blockquote>
        <div className="stars">{'★'.repeat(featuredReview.rating)}{'☆'.repeat(5 - featuredReview.rating)}</div>
        <p>— {featuredReview.name}, {featuredReview.service || 'Glamourglow client'}</p>
        <Link className="text-link" to="/reviews">Read client stories <ArrowRight /></Link>
      </section>}

      <section className="home-join">
        <span className="eyebrow"><Heart /> GOOD THINGS ARE BETTER SHARED</span>
        <h2>Love the glow?<br /><em>Share the love.</em></h2>
        <p>Join our partner programme and earn {content.affiliate_cash_percent}% commission on completed bookings from your referrals.</p>
        <Link className="primary" to="/affiliate">Become a partner <ArrowRight /></Link>
      </section>

      <section className="visit vibrant-visit">
        <div>
          <span className="eyebrow">COME FIND US</span>
          <h2>Your next set starts<br /><em>right here.</em></h2>
          <p><MapPin /> {content.address || studioAddress}</p>
          <p><CalendarDays /> {content.weekday_hours} · {content.sunday_hours}</p>
          <div className="visit-actions">
            <a className="primary" href={directionsUrl} target="_blank" rel="noopener noreferrer"><Navigation /> Get directions</a>
            <a className="text-link" href={`tel:${content.phone.replace(/\D/g, '')}`}><Phone /> Call {content.phone}</a>
          </div>
        </div>
        <StudioMap />
      </section>
    </>
  );
}
