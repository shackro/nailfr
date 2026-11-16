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
const mobileButterflyFlights = [
  { startX: '-12vw', startY: '8vh', midX: '8vw', midY: '12vh', landX: '14vw', landY: '17vh', exitX: '112vw', exitY: '-8vh' },
  { startX: '108vw', startY: '14vh', midX: '90vw', midY: '17vh', landX: '85vw', landY: '22vh', exitX: '-28vw', exitY: '-12vh' },
  { startX: '-14vw', startY: '25vh', midX: '10vw', midY: '27vh', landX: '20vw', landY: '31vh', exitX: '110vw', exitY: '-5vh' },
  { startX: '112vw', startY: '32vh', midX: '92vw', midY: '34vh', landX: '80vw', landY: '38vh', exitX: '-25vw', exitY: '-10vh' },
  { startX: '-12vw', startY: '41vh', midX: '34vw', midY: '41vh', landX: '42vw', landY: '46vh', exitX: '114vw', exitY: '-8vh' },
  { startX: '108vw', startY: '19vh', midX: '83vw', midY: '45vh', landX: '60vw', landY: '51vh', exitX: '-24vw', exitY: '-12vh' },
  { startX: '-15vw', startY: '53vh', midX: '32vw', midY: '56vh', landX: '34vw', landY: '60vh', exitX: '112vw', exitY: '-7vh' },
  { startX: '114vw', startY: '58vh', midX: '90vw', midY: '59vh', landX: '84vw', landY: '64vh', exitX: '-26vw', exitY: '-11vh' },
  { startX: '-12vw', startY: '21vh', midX: '28vw', midY: '25vh', landX: '28vw', landY: '29vh', exitX: '113vw', exitY: '-10vh' },
  { startX: '112vw', startY: '43vh', midX: '76vw', midY: '42vh', landX: '72vw', landY: '47vh', exitX: '-25vw', exitY: '-8vh' },
  { startX: '-13vw', startY: '12vh', midX: '70vw', midY: '48vh', landX: 'calc(82vw - 24px)', landY: '50vh', exitX: '112vw', exitY: '-9vh' },
  { startX: '113vw', startY: '18vh', midX: '89vw', midY: '30vh', landX: '87vw', landY: '35vh', exitX: '-25vw', exitY: '-11vh' },
];
const migratingButterflies = [
  { left: '0%', top: '0%', size: 30, duration: '29s', delay: '-2s', curve: '-7vh', wing: '#ed8b26', highlight: '#f6c95d', detail: '#281a1b', edge: '#352020', flap: '1.2s' },
  { left: '10%', top: '2%', size: 24, duration: '34s', delay: '-9s', curve: '8vh', wing: '#327ac7', highlight: '#8ed5ff', detail: '#e9f8ff', edge: '#173c69', flap: '1.35s' },
  { left: '3%', top: '7%', size: 27, duration: '31s', delay: '-5s', curve: '-4vh', wing: '#d86781', highlight: '#f8b4bd', detail: '#fff0d9', edge: '#71394c', flap: '1.45s' },
  { left: '20%', top: '0%', size: 22, duration: '36s', delay: '-13s', curve: '6vh', wing: '#8371bd', highlight: '#d4c7f5', detail: '#fff3d4', edge: '#443a73', flap: '1.3s' },
  { left: '27%', top: '4%', size: 25, duration: '32s', delay: '-16s', curve: '-9vh', wing: '#4d9479', highlight: '#b8dda2', detail: '#f8f0d7', edge: '#285745', flap: '1.55s' },
  { left: '12%', top: '8%', size: 24, duration: '33s', delay: '-7s', curve: '5vh', wing: '#d7a643', highlight: '#ffe49a', detail: '#fff5dd', edge: '#72511e', flap: '1.4s' },
  { left: '35%', top: '1%', size: 21, duration: '38s', delay: '-12s', curve: '-6vh', wing: '#4293a7', highlight: '#a5e5e7', detail: '#f2fff8', edge: '#245366', flap: '1.25s' },
  { left: '6%', top: '10%', size: 23, duration: '30s', delay: '-3s', curve: '8vh', wing: '#b64d8d', highlight: '#f2a1cb', detail: '#fff1de', edge: '#693658', flap: '1.5s' },
  { left: '25%', top: '10%', size: 20, duration: '35s', delay: '-15s', curve: '-5vh', wing: '#67765a', highlight: '#c9d89a', detail: '#fff6db', edge: '#384832', flap: '1.65s' },
  { left: '39%', top: '8%', size: 22, duration: '37s', delay: '-18s', curve: '7vh', wing: '#9167a4', highlight: '#d8b7e5', detail: '#fff2db', edge: '#574066', flap: '1.3s' },
  { left: '58%', top: '2%', size: 54, duration: '48s', delay: '-21s', curve: '-11vh', wing: '#e88931', highlight: '#ffe28a', detail: '#37201d', edge: '#5e3028', flap: '1.7s', large: true },
  { left: '67%', top: '4%', size: 50, duration: '52s', delay: '-34s', curve: '10vh', wing: '#477eb7', highlight: '#b8e4f4', detail: '#fff4d7', edge: '#263d6e', flap: '1.85s', large: true },
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
  const [looksLoading, setLooksLoading] = useState(true);
  const [lookError, setLookError] = useState('');
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const rippleId = useRef(0);
  const heroRef = useRef<HTMLElement>(null);
  const [headlineLandings, setHeadlineLandings] = useState<{ x: number; y: number }[]>([]);
  const { data: reviews, loading: reviewsLoading } = useReviews();
  const content = useSiteSettings();
  const directionsUrl = studioDirectionsUrlFor(content.address || studioAddress);
  const featuredReview = reviews[0];
  const happyClientCount = reviews.filter((review) => review.rating >= 4).length;
  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : '—';
  useEffect(() => {
    const hero = heroRef.current;
    const heading = hero?.querySelector('h1');
    if (!hero || !heading) return;

    const updateHeadlineLandings = () => {
      const range = document.createRange();
      range.selectNodeContents(heading);
      const heroBounds = hero.getBoundingClientRect();
      const points = Array.from(range.getClientRects()).slice(0, 4).map((line) => ({
        x: Math.round(line.left + line.width * 0.72 - heroBounds.left),
        y: Math.round(line.top + line.height / 2 - heroBounds.top),
      }));
      setHeadlineLandings((current) =>
        current.length === points.length && current.every((point, index) =>
          point.x === points[index].x && point.y === points[index].y
        ) ? current : points
      );
    };

    updateHeadlineLandings();
    const observer = new ResizeObserver(updateHeadlineLandings);
    observer.observe(heading);
    window.addEventListener('resize', updateHeadlineLandings);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeadlineLandings);
    };
  }, [content.home_title]);
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
    }).finally(() => setLooksLoading(false));
  }, []);
  const filteredLooks = activeFilter === 'All' ? looks : looks.filter((look) => look.category === activeFilter);
  const visibleButterflies = [
    ...migratingButterflies.slice(0, Math.min(content.butterfly_count, migratingButterflies.length - 2)),
    ...(content.butterfly_count > 0 ? migratingButterflies.slice(-2) : []),
  ];

  return (
    <>
      <section
        ref={heroRef}
        className="hero vibrant-hero"
        onPointerDown={handleHeroPointerDown}
      >
        <div className="hero-migration-layer" aria-hidden="true">
          {visibleButterflies.map((butterfly, index) => {
            const baseFlight = butterfly.large
              ? mobileButterflyFlights[10 + index - (visibleButterflies.length - 2)]
              : mobileButterflyFlights[index];
            const headlineLanding = butterfly.large ? undefined : headlineLandings[index];
            const mobileFlight = headlineLanding
              ? { ...baseFlight, landX: `${headlineLanding.x}px`, landY: `${headlineLanding.y}px` }
              : baseFlight;
            return (
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
                '--butterfly-flap-duration': butterfly.flap,
                '--mobile-start-x': mobileFlight.startX,
                '--mobile-start-y': mobileFlight.startY,
                '--mobile-mid-x': mobileFlight.midX,
                '--mobile-mid-y': mobileFlight.midY,
                '--mobile-land-x': `calc(${mobileFlight.landX} - ${butterfly.size / 2}px)`,
                '--mobile-land-y': `calc(${mobileFlight.landY} - ${butterfly.size * 0.625}px)`,
                '--mobile-exit-x': mobileFlight.exitX,
                '--mobile-exit-y': mobileFlight.exitY,
              } as CSSProperties}
            >
              <svg viewBox="0 0 64 80">
                <defs>
                  <linearGradient id={`butterfly-wing-${index}`} x1="10" y1="8" x2="53" y2="68" gradientUnits="userSpaceOnUse">
                    <stop stopColor={butterfly.highlight} />
                    <stop offset=".52" stopColor={butterfly.wing} />
                    <stop offset="1" stopColor={butterfly.edge} />
                  </linearGradient>
                    <linearGradient id={`butterfly-body-${index}`} x1="29" y1="20" x2="35" y2="68" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#c99a68" />
                      <stop offset=".35" stopColor="#806047" />
                      <stop offset="1" stopColor="#49352d" />
                  </linearGradient>
                </defs>
                <g
                  className="butterfly-wing-pair"
                  transform={butterfly.large ? 'translate(-2.56 -3.2) scale(1.08)' : undefined}
                >
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
                </g>
                <g
                  className="butterfly-insect-body"
                  transform={butterfly.large ? 'translate(13.44 16.8) scale(.58)' : 'translate(8.96 11.2) scale(.72)'}
                >
                  <path className="butterfly-antennae" d="M31 20C28 13 25 11 22 10m11 10c3-7 6-9 9-10" />
                  <circle className="butterfly-head" fill={`url(#butterfly-body-${index})`} cx="32" cy="21" r="2.7" />
                  <circle className="butterfly-eye" cx="30.3" cy="20.7" r=".55" />
                  <circle className="butterfly-eye" cx="33.7" cy="20.7" r=".55" />
                  <ellipse className="butterfly-thorax" fill={`url(#butterfly-body-${index})`} cx="32" cy="29" rx="3.1" ry="6.3" />
                  <path className="butterfly-abdomen" fill={`url(#butterfly-body-${index})`} d="M29.2 34Q32 31 34.8 34L34.5 49Q34 54 32 57Q30 54 29.5 49Z" />
                  <path className="butterfly-abdomen-segment" d="M29.5 39Q32 40.5 34.5 39M29.5 43Q32 44.5 34.5 43M29.5 47Q32 48.5 34.5 47M29.8 51Q32 52.2 34.2 51M30.5 54.5Q32 55.2 33.5 54.5" />
                  <path className="butterfly-leg" d="M29 28Q26 30 25 34L23 36M29 31Q25 32 24 36L22 38M30 34Q27 36 27 39L25 41M35 28Q38 30 39 34L41 36M35 31Q39 32 40 36L42 38M34 34Q37 36 37 39L39 41" />
                  <path className="butterfly-body-highlight" d="M31.1 19.5v3m.1 5v8m-.1 4v16" />
                </g>
              </svg>
            </span>
            );
          })}
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
            <img className="hero-mobile-flower" src={content.hero_rose_image_url} alt="" aria-hidden="true" />
          </div>
          <div className="proof">
            <div><strong>{reviewsLoading ? '…' : happyClientCount}</strong><span>happy clients</span></div>
            <div><strong>{looksLoading ? '…' : looks.length}</strong><span>signature designs</span></div>
            <div><strong>{reviewsLoading ? '…' : averageRating}</strong><span><Star /> client rating</span></div>
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
