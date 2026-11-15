import { useState, type FormEvent } from 'react';
import { Clock, Mail, MapPin, Navigation, Phone, Send } from 'lucide-react';
import { api } from '../lib/api';
import { studioAddress, studioDirectionsUrl } from '../lib/location';

export default function Contact() {
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api('/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: form.get('name'),
        phone: form.get('phone'),
        email: form.get('email'),
        subject: form.get('subject'),
        message: form.get('message'),
      }),
    }).catch(() => undefined);
    setSent(true);
  };

  return (
    <>
      <section className="page-hero compact">
        <span className="eyebrow">CONTACT US</span>
        <h1>Let&apos;s talk<br /><em>beautiful.</em></h1>
      </section>
      <div className="contact-layout">
        <aside className="contact-details">
          <h2>We’d love to see you.</h2>
          <p>Send a note, call the studio or stop by. We’re here to help you choose the right set.</p>
          <a href="tel:+254712872030"><Phone /><span><small>Call</small>0712 872 030</span></a>
          <a href="https://wa.me/254712872030"><Send /><span><small>WhatsApp</small>Chat with the studio</span></a>
          <a href="mailto:info@glamourglow.co.ke"><Mail /><span><small>Email</small>info@glamourglow.co.ke</span></a>
          <a className="contact-location-link" href={studioDirectionsUrl} target="_blank" rel="noopener noreferrer"><MapPin /><span><small>Studio location</small>{studioAddress}<small className="contact-location-action"><Navigation /> Tap to get directions</small></span></a>
          <div><Clock /><span><small>Hours</small>Mon–Sat 8am–6pm · Sunday 10am–4pm</span></div>
        </aside>
        {sent ? (
          <div className="success">
            <Send /><h2>Message received.</h2>
            <p>Thank you. The studio team will get back to you shortly.</p>
            <button className="text-link" onClick={() => setSent(false)}>Send another message</button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={submit}>
            <span className="eyebrow">SEND A NOTE</span>
            <div className="form-split">
              <label>Name<input name="name" required /></label>
              <label>Phone<input name="phone" required /></label>
            </div>
            <label>Email<input name="email" type="email" required /></label>
            <label>Subject<select name="subject">
              <option>Appointment enquiry</option><option>Partnership</option>
              <option>Custom workshop</option><option>Other</option>
            </select></label>
            <label>Message<textarea name="message" rows={6} required /></label>
            <button className="primary full"><Send /> Send message</button>
          </form>
        )}
      </div>
    </>
  );
}
