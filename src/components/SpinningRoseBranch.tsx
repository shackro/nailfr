import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { useReviews } from '../lib/dataHooks';
import { useSiteSettings } from '../lib/siteSettings';

type DragState = {
  pointerId: number;
  startX: number;
  startRotation: number;
};

const clampRotation = (rotation: number) => Math.max(-35, Math.min(35, rotation));

export default function SpinningRoseBranch() {
  const imageRef = useRef<HTMLImageElement>(null);
  const dragState = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const { data: reviews, loading: reviewsLoading, error: reviewsError } = useReviews();
  const { booking_rose_image_url: roseImageUrl } = useSiteSettings();
  const featuredReviews = reviews.slice(0, 10);

  useEffect(() => {
    if (featuredReviews.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setActiveReviewIndex((index) => (index + 1) % featuredReviews.length);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [featuredReviews.length]);

  useEffect(() => {
    setActiveReviewIndex((index) => Math.min(index, Math.max(featuredReviews.length - 1, 0)));
  }, [featuredReviews.length]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startRotation: Number(imageRef.current?.dataset.rotation ?? 0),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.abs(event.clientX - drag.startX) > 3) setIsDragging(true);
    const rotation = clampRotation(drag.startRotation + (event.clientX - drag.startX) * 0.55);
    if (imageRef.current) {
      imageRef.current.dataset.rotation = String(rotation);
      imageRef.current.style.setProperty('--rose-drag-turn', `${rotation}deg`);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragState.current?.pointerId !== event.pointerId) return;
    dragState.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="rose-branch" role="group" aria-label="Rose held by a client with client reviews">
      <span className="rose-branch-aura" aria-hidden="true" />
      <div
        className={`rose-showcase-stage${isDragging ? ' is-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="Drag to turn the rose"
      >
        <div className="rose-display-spin">
          <img
            ref={imageRef}
            className="rose-showcase-image"
            src={roseImageUrl}
            alt="A client holding a reflexed blush-pink rose with glossy pink nails"
            draggable={false}
          />
          <span className="rose-showcase-sheen" />
        </div>
      </div>
      {featuredReviews.length > 0 ? (
        <blockquote className="rose-client-quote" key={featuredReviews[activeReviewIndex]?.id}>
          <p>“{featuredReviews[activeReviewIndex]?.text}”</p>
          <div className="rose-client-byline">
            <span aria-label={`${featuredReviews[activeReviewIndex]?.rating} out of 5 stars`}>
              {'★'.repeat(Math.max(0, Math.min(5, featuredReviews[activeReviewIndex]?.rating ?? 0)))}
            </span>
            <cite>{featuredReviews[activeReviewIndex]?.name}</cite>
          </div>
        </blockquote>
      ) : reviewsLoading ? (
        <div className="rose-client-quote rose-client-invite" role="status">Loading client words…</div>
      ) : (
        <Link className="rose-client-quote rose-client-invite" to="/reviews">
          {reviewsError ? 'See client reviews' : 'Share your experience'}
        </Link>
      )}
    </div>
  );
}
