import { MapPin, ShieldCheck } from 'lucide-react';
import FlowerMark from '../components/FlowerMark';
import StudioMap from '../components/StudioMap';
import { studioAddress } from '../lib/location';
import { useSiteSettings } from '../lib/siteSettings';

export default function About() {
  const content = useSiteSettings();

  return (
    <>
      <section className="about-hero">
        <div><span className="eyebrow">OUR STORY</span><h1>{content.about_title}</h1><p>{content.about_description}</p></div>
        <img src="/images/portfolio-gel-overlay.jpg" alt="Glamourglow nail artistry" />
      </section>
      <section className="values">
        <article className="value-card creative-precision-card">
          <div className="value-card-media value-card-media--rose"><img src={content.hero_rose_image_url} alt="Blush-pink reflexed rose with detailed leaves" loading="lazy" /></div>
          <div className="value-card-copy"><FlowerMark /><h3>Creative precision</h3><p>From the first file to the final detail, every set is considered and carefully finished.</p></div>
        </article>
        <article className="value-card">
          <div className="value-card-media value-card-media--care"><img src="/images/clean-care-tools.webp" alt="Nail clippers, file, cuticle nipper and pusher arranged as clean manicure tools" loading="lazy" /></div>
          <div className="value-card-copy"><ShieldCheck /><h3>Clean care</h3><p>Tools are sanitised, work surfaces are prepared and hygiene is never an afterthought.</p></div>
        </article>
        <article className="value-card">
          <div className="value-card-media"><img src="/images/about-made-for-you.webp" alt="A finished custom nail design, made to feel personal" loading="lazy" /></div>
          <div className="value-card-copy"><MapPin /><h3>Made for you</h3><p>A calm local studio on the edge of town, with honest advice and a warm welcome.</p></div>
        </article>
      </section>
      <section className="location-detail">
        <StudioMap />
        <div><span className="eyebrow">FIND THE STUDIO</span><h2>{(content.address || studioAddress).split(',')[0]}.</h2><p>Look for the first stall from the Bridge in Thika. If you need help finding us, call or WhatsApp and we’ll guide you in.</p><dl><div><dt>Monday–Saturday</dt><dd>{content.weekday_hours}</dd></div><div><dt>Sunday</dt><dd>{content.sunday_hours}</dd></div></dl></div>
      </section>
    </>
  );
}
