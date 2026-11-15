import { useEffect, useState } from 'react';
import { AlertCircle, BriefcaseBusiness, CalendarDays, CheckCircle2, GraduationCap, MapPin, PartyPopper, Ticket, Users, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Event } from '../types';
import FlowerMark from '../components/FlowerMark';
import { resolveImageSource } from '../lib/imageSources';

type Reservation = { id: number; status: string; payment_required: boolean; message: string };

function EventIcon({ category }: { category: string }) {
  if (category.toLowerCase().includes('training')) return <GraduationCap />;
  if (category.toLowerCase().includes('skill')) return <BriefcaseBusiness />;
  return <PartyPopper />;
}

function EventDate({ date }: { date: string }) {
  const parsed = new Date(`${date}T12:00:00`);
  return <span>{parsed.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}</span>;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selected, setSelected] = useState<Event | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadEvents = () => {
    setLoading(true);
    setError('');
    void api<Event[]>('/events')
      .then(setEvents)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Could not load upcoming events.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadEvents, []);

  const closeModal = () => {
    setSelected(null);
    setReservation(null);
    setName('');
    setPhone('');
    setError('');
  };

  const reserveSeat = async (event: Event) => {
    if (!name.trim() || !phone.trim()) {
      setError('Enter your name and mobile number to request a seat.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const result = await api<Reservation>('/events/register', {
        method: 'POST',
        body: JSON.stringify({ event_id: event.id, name: name.trim(), phone }),
      });
      setReservation(result);
      loadEvents();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not reserve this seat.');
    } finally {
      setBusy(false);
    }
  };

  const whatsappUrl = selected && reservation
    ? `https://wa.me/254712872030?text=${encodeURIComponent(`Hello Glamourglow! I reserved a seat for ${selected.title} (reservation #${reservation.id}). Please let me know how to complete the KSh ${selected.price.toLocaleString()} M-Pesa payment.`)}`
    : '';

  return (
    <>
      <header className="events-hero">
        <span className="eyebrow"><FlowerMark /> PROFESSIONAL DEVELOPMENT & NETWORKING</span>
        <h1>Events &<br /><em>Masterclasses.</em></h1>
        <p>Build your skills, grow your business and connect with the beauty community. Explore hands-on training and thoughtful studio experiences in Thika.</p>
      </header>

      {loading && <p className="affiliate-activity-empty">Loading upcoming events…</p>}
      {error && !selected && <div className="affiliate-activity-empty" role="alert">{error} <button className="text-link" onClick={loadEvents}>Try again</button></div>}
      {!loading && !error && events.length === 0 && <p className="affiliate-activity-empty">No upcoming events are scheduled right now. Please check back soon.</p>}

      {!loading && events.length > 0 && (
        <section className="events-grid">
          {events.map((event) => {
            const remaining = event.remaining_slots;
            const progress = event.total_slots ? Math.min(100, event.booked_slots / event.total_slots * 100) : 0;
            return (
              <article className={`event-card ${event.featured ? 'event-featured' : ''}`} key={event.id}>
                <div className="event-image">
                  <img src={resolveImageSource(event.image)} alt="" loading="lazy" />
                  <span className="event-category"><EventIcon category={event.category} /> {event.category}</span>
                  <span className={`event-seats${remaining > 0 && remaining <= 4 ? ' is-low' : ''}`}><Users /> {remaining} seats left</span>
                </div>
                <div className="event-body">
                  <span className="eyebrow">{event.featured ? 'FEATURED WORKSHOP' : 'UPCOMING EXPERIENCE'}</span>
                  <h2>{event.title}</h2>
                  <p>{event.description}</p>
                  <div className="event-meta">
                    <span><CalendarDays /> <EventDate date={event.date} /> · {event.time}</span>
                    <span><MapPin /> {event.location}</span>
                  </div>
                  <div className="capacity-label"><span>Enrollment progress</span><span>{event.booked_slots} / {event.total_slots} booked</span></div>
                  <div className="capacity-track"><span style={{ width: `${progress}%` }} /></div>
                  <div className="event-action">
                    <div className="event-price"><small>Ticket price</small><strong>KSh {event.price.toLocaleString()}</strong></div>
                    <button className="primary" disabled={!remaining} onClick={() => { setSelected(event); setError(''); }}>
                      <Ticket /> {remaining ? 'Reserve a seat' : 'Fully booked'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={closeModal}>
          <section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" aria-label="Close" onClick={closeModal}><X /></button>
            {reservation ? (
              <div className="event-confirmation">
                <CheckCircle2 />
                <span className="eyebrow">SEAT REQUESTED</span>
                <h2 id="event-modal-title">Your seat is on hold.</h2>
                <p>Reservation #{reservation.id} for <strong>{selected.title}</strong>. The studio will help you complete payment and confirm your ticket.</p>
                <div className="event-modal-note">This site does not initiate a live M-Pesa STK push or collect payment. Please confirm payment details with the studio before sending money.</div>
                <a className="primary full" href={whatsappUrl} target="_blank" rel="noreferrer">Continue with the studio on WhatsApp</a>
              </div>
            ) : (
              <>
                <span className="eyebrow"><Ticket /> RESERVE YOUR PLACE</span>
                <h2 id="event-modal-title">{selected.title}</h2>
                <p><EventDate date={selected.date} /> · KSh {selected.price.toLocaleString()} · {selected.remaining_slots} seats left</p>
                <label>Name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>
                <label>Mobile number<input type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="0712 345 678" /></label>
                <div className="event-modal-note"><AlertCircle /> A seat reservation is not a payment. M-Pesa payment instructions are confirmed by the studio after your request.</div>
                {error && <p className="affiliate-error" role="alert">{error}</p>}
                <button className="primary full" disabled={busy} onClick={() => void reserveSeat(selected)}>{busy ? 'Saving reservation…' : 'Request a seat'}</button>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
