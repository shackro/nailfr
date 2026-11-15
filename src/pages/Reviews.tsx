import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '../lib/api';
import { useReviews } from '../lib/dataHooks';

function ReviewStars({ rating }: { rating: number }) {
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stars = starsRef.current;
    if (!stars) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      stars.classList.add('is-visible');
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(stars);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={starsRef} className="stars review-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span className={index < rating ? 'review-star is-rated' : 'review-star'} key={index}>{index < rating ? '★' : '☆'}</span>
      ))}
    </div>
  );
}

export default function Reviews() {
  const { data: reviews, loading, error: loadError, refresh } = useReviews();
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  const submit = async () => {
    if (name.trim().length < 2 || text.trim().length < 10) {
      setError('Add your name and a review of at least 10 characters.');
      return;
    }
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await api('/reviews', { method: 'POST', body: JSON.stringify({ name: name.trim(), rating, text: text.trim(), service: service.trim() }) });
      await refresh();
      setName('');
      setText('');
      setService('');
      setMessage('Thank you! Your review has been submitted for publication.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not submit your review.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="page-hero compact review-page-hero"><span className="eyebrow">CLIENT STORIES</span><h1>Love notes from<br /><em>lovely hands.</em></h1><img src="/images/reflexed-rose-clean.png" alt="" aria-hidden="true" /></section>
      <div className="reviews-summary"><strong>{reviews.length ? average.toFixed(1) : '—'}</strong><div><div className="stars">{reviews.length ? '★'.repeat(Math.round(average)) : '☆☆☆☆☆'}</div><span>{reviews.length} published {reviews.length === 1 ? 'review' : 'reviews'}</span></div></div>
      <div className="review-layout">
        <section>
          {loading && <p className="muted">Loading published reviews…</p>}
          {loadError && <p className="affiliate-error" role="alert">{loadError}</p>}
          {!loading && !loadError && reviews.length === 0 && <p className="muted">No published reviews yet. Be the first to share your experience.</p>}
          {reviews.map((review) => <article className="review-card" key={review.id}>
            <div className="review-author"><span>{review.name.charAt(0).toUpperCase()}</span><div><b>{review.name}</b><small>{review.service || 'Glamourglow client'}</small></div></div>
            <ReviewStars rating={review.rating} />
            <p>“{review.text}”</p>
          </article>)}
        </section>
        <aside className="review-form">
          <span className="eyebrow">SHARE YOUR STORY</span><h2>How was your visit?</h2>
          <div className="rating-picker" role="group" aria-label="Rating">{[1, 2, 3, 4, 5].map((value) => <button type="button" aria-label={`${value} stars`} key={value} onClick={() => setRating(value)} className={value <= rating ? 'active' : ''}>★</button>)}</div>
          <label>Name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>
          <label>Service<input value={service} onChange={(event) => setService(event.target.value)} placeholder="Builder gel, acrylic…" /></label>
          <label>Review<textarea value={text} onChange={(event) => setText(event.target.value)} rows={5} /></label>
          {error && <p className="affiliate-error" role="alert">{error}</p>}
          {message && <p className="review-success" role="status">{message}</p>}
          <button type="button" className="primary full" disabled={busy} onClick={() => void submit()}><Send /> {busy ? 'Submitting…' : 'Submit review'}</button>
        </aside>
      </div>
    </>
  );
}
