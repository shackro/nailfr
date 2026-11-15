import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Camera, Menu, Moon, Phone, Sun, X } from 'lucide-react';
import FlowerMark from './FlowerMark';
import { studioAddress, studioDirectionsUrl } from '../lib/location';
import { useSiteSettings } from '../lib/siteSettings';
import { applyTheme, getThemePreference, saveThemePreference } from '../lib/theme';
import BotanicalAtmosphere from './BotanicalAtmosphere';
export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => getThemePreference() === 'dark');
  const location = useLocation();
  const content = useSiteSettings();
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const links = [['Home', '/'], ['Services', '/services'], ['Gallery', '/gallery'], ['Events', '/events'], ['Reviews', '/reviews'], ['About', '/about'], ['Contact', '/contact']];

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    setDark(getThemePreference() === 'dark');
  }, [location.pathname]);

  useEffect(() => {
    const theme = dark ? 'dark' : 'light';
    applyTheme(theme);
    saveThemePreference(theme);
  }, [dark]);

  useEffect(() => {
    if (!open) return;
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.target instanceof Node
        && !menuRef.current?.contains(event.target)
        && !menuButtonRef.current?.contains(event.target)
      ) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (location.pathname === '/admin' || location.pathname === '/invite') return <main>{children}</main>;

  return (
    <div className="site-shell">
      <BotanicalAtmosphere />
      <header className="nav">
        <Link className="brand" to="/">
          <span className="brand-mark"><FlowerMark /></span>
          <span>{content.business_name.toUpperCase()}<small>S PA & NAILS</small></span>
        </Link>
        <nav ref={menuRef} className={`nav-links${open ? ' open' : ''}`} id="primary-navigation" aria-label="Main navigation">
          <div className="mobile-nav-heading">
            <span className="brand-mark"><FlowerMark /></span>
            <span>Explore Glamourglow<small>SPA & NAILS · THIKA</small></span>
            <button type="button" className="icon-button mobile-nav-close" aria-label="Close navigation" onClick={() => setOpen(false)}><X /></button>
          </div>
          {links.map(([name, path]) => (
            <NavLink key={path} to={path} onClick={() => setOpen(false)}>{name}</NavLink>
          ))}
          <Link className="mobile-nav-book" to="/services" onClick={() => setOpen(false)}>Book your visit <span>→</span></Link>
        </nav>
        {open && <button type="button" className="mobile-nav-backdrop" aria-label="Close navigation menu" onClick={() => setOpen(false)} />}
        <div className="nav-actions">
          <button className={`icon-button theme-toggle ${dark ? 'is-dark' : ''}`} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={dark} onClick={() => setDark(!dark)}>
            {dark ? <Sun /> : <Moon />}
          </button>
          <Link className="book-button desktop-only" to="/services">Book now</Link>
          <button ref={menuButtonRef} className="icon-button menu" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <div>
          <Link className="brand footer-brand" to="/">
            <span className="brand-mark"><FlowerMark /></span>
            <span>{content.business_name.toUpperCase()}<small>S PA & NAILS</small></span>
          </Link>
          <p>Beautiful nails, carefully crafted in Thika.</p>
          <Link className="footer-staff-link" to="/admin">Staff portal <span aria-hidden="true">→</span></Link>
        </div>
        <div><b>Visit us</b><a className="footer-location-link" href={studioDirectionsUrl} target="_blank" rel="noopener noreferrer">{content.address || studioAddress}<small>Get directions ↗</small></a></div>
        <div><b>Opening hours</b><p>{content.weekday_hours}<br />{content.sunday_hours}</p></div>
        <div><b>Say hello</b><a href={`tel:${content.phone.replace(/\D/g, '')}`}><Phone /> {content.phone}</a><a href={`mailto:${content.email}`}><Camera /> {content.email}</a></div>
        <small>© {new Date().getFullYear()} {content.business_name}. Made with care.</small>
      </footer>
    </div>
  );
}
