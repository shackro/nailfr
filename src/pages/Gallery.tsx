import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ArrowUpRight, Heart, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useSiteSettings } from '../lib/siteSettings';
import { resolveImageSource } from '../lib/imageSources';
import type { PortfolioItem } from '../types';

const categories = ['All', 'Gel', 'Acrylic', 'Nail Art', 'Self Care'];

function GalleryCard({
  work,
  index,
  liked,
  onOpen,
  onToggleLike,
  glossEnabled,
}: {
  work: PortfolioItem;
  index: number;
  liked: boolean;
  onOpen: () => void;
  onToggleLike: () => void;
  glossEnabled: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const resetTimer = useRef<number | undefined>(undefined);
  const style = { '--gallery-index': index } as CSSProperties;

  const setTilt = (event: PointerEvent<HTMLElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.setProperty('--tilt-x', `${-y * 8}deg`);
    card.style.setProperty('--tilt-y', `${x * 8}deg`);
  };

  const sweepGloss = () => {
    if (!glossEnabled) return;
    const card = cardRef.current;
    if (!card) return;
    window.clearTimeout(resetTimer.current);
    card.classList.remove('gloss-active');
    void card.offsetWidth;
    card.classList.add('gloss-active');
    resetTimer.current = window.setTimeout(() => card.classList.remove('gloss-active'), 850);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse') setTilt(event);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      setTilt(event);
      sweepGloss();
    }
  };

  const resetTilt = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  };

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  return (
    <article
      ref={cardRef}
      className="work-card gallery-tilt-card"
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerDown={handlePointerDown}
      onPointerUp={resetTilt}
      onPointerCancel={resetTilt}
    >
      <button type="button" className="work-open" onClick={onOpen} aria-label={`View ${work.title}`}>
        <img src={resolveImageSource(work.image)} alt={work.title} loading="lazy" />
      </button>
      <div className="work-meta">
        <div><span>{work.category}</span><h3>{work.title}</h3><small>KSh {work.price.toLocaleString()}</small></div>
        <button type="button" aria-label={`${liked ? 'Unlike' : 'Like'} ${work.title}`} aria-pressed={liked} onClick={onToggleLike} className={liked ? 'liked' : ''}><Heart fill="currentColor" /></button>
      </div>
    </article>
  );
}

export default function Gallery() {
  const [works, setWorks] = useState<PortfolioItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [liked, setLiked] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { uv_gloss_enabled: glossEnabled } = useSiteSettings();

  useEffect(() => {
    api<PortfolioItem[]>('/portfolio')
      .then(setWorks)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Could not load the portfolio.'))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => works.filter((work) =>
    (filter === 'All' || work.category === filter)
    && `${work.title} ${work.category} ${work.services.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
  ), [filter, query, works]);
  const selected = items.find((work) => work.id === active);

  return (
    <>
      <section className="page-hero compact"><span className="eyebrow">THE LOOKBOOK</span><h1>Made to inspire<br /><em>your next set.</em></h1></section>
      <div className="gallery-tools">
        <div className="filters">{categories.map((category) => <button type="button" className={filter === category ? 'active' : ''} onClick={() => setFilter(category)} key={category}>{category}</button>)}</div>
        <label className="search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search looks" /></label>
      </div>
      {loading && <p className="affiliate-activity-empty">Loading the lookbook…</p>}
      {error && <p className="affiliate-activity-empty" role="alert">{error}</p>}
      {!loading && !error && !items.length && <p className="affiliate-activity-empty">No designs match your search yet.</p>}
      {!loading && !error && <div className="masonry">{items.map((work, index) => (
        <GalleryCard
          key={work.id}
          work={work}
          index={index}
          liked={liked.includes(work.id)}
          onOpen={() => setActive(work.id)}
          onToggleLike={() => setLiked((current) => current.includes(work.id) ? current.filter((id) => id !== work.id) : [...current, work.id])}
          glossEnabled={glossEnabled}
        />
      ))}</div>}
      {selected && (
        <div className="modal-backdrop" onClick={() => setActive(null)}>
          <div className="lightbox" role="dialog" aria-modal="true" aria-label={selected.title} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setActive(null)}><X /></button>
            <img src={resolveImageSource(selected.image)} alt={selected.title} />
            <div><span className="eyebrow">{selected.category}</span><h2>{selected.title}</h2><p>{selected.services.join(', ')} · KSh {selected.price.toLocaleString()}</p><button type="button" className="primary full" onClick={() => navigate(`/services?preselect=${encodeURIComponent(selected.services.join(','))}`)}>Book a similar look <ArrowUpRight /></button></div>
          </div>
        </div>
      )}
    </>
  );
}
