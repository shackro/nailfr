import { useEffect, useState } from 'react';
import { api } from './api';

export type SiteSettings = {
  business_name: string;
  phone: string;
  email: string;
  address: string;
  weekday_hours: string;
  sunday_hours: string;
  home_eyebrow: string;
  home_title: string;
  home_description: string;
  weekend_title: string;
  weekend_description: string;
  about_title: string;
  about_description: string;
  butterfly_count: number;
  touch_wave_enabled: boolean;
  uv_gloss_enabled: boolean;
  weekend_shots_mode: 'auto_weekend' | 'always_on' | 'off';
  weekend_min_spend: number;
  affiliate_cash_percent: number;
  affiliate_credit_percent: number;
  attribution_days: number;
  hero_rose_image_url: string;
  booking_rose_image_url: string;
};

export const defaultSiteSettings: SiteSettings = {
  business_name: 'Glamourglow Spa',
  phone: '0712 872 030',
  email: 'info@glamourglow.co.ke',
  address: 'Opposite Maku Gate A, first stall from the Bridge, Thika',
  weekday_hours: 'Mon–Sat: 8:00 AM–6:00 PM',
  sunday_hours: 'Sunday: 10:00 AM–4:00 PM',
  home_eyebrow: 'Premium nail & beauty care',
  home_title: 'Because your nails tell your story.',
  home_description: 'Experience personal nail design and thoughtful beauty care in Thika. Custom looks, flawless finishes and a studio that feels like you.',
  weekend_title: 'Free shots on weekends.',
  weekend_description: 'Enjoy complimentary shots with your weekend service booking.',
  about_title: 'Beauty, made personal in Thika.',
  about_description: 'Glamourglow began with a simple belief: great nail care should feel warm, unhurried and made for the person in the chair.',
  butterfly_count: 5,
  touch_wave_enabled: true,
  uv_gloss_enabled: true,
  weekend_shots_mode: 'auto_weekend',
  weekend_min_spend: 0,
  affiliate_cash_percent: 10,
  affiliate_credit_percent: 15,
  attribution_days: 30,
  hero_rose_image_url: '/images/reflexed-rose-clean.png',
  booking_rose_image_url: '/images/rose-held-by-client.png',
};

const SITE_SETTINGS_EVENT = 'glamourglow:site-settings';

export function publishSiteSettings(settings: SiteSettings) {
  window.dispatchEvent(new CustomEvent<SiteSettings>(SITE_SETTINGS_EVENT, { detail: settings }));
}

export function useSiteSettings() {
  const [settings, setSettings] = useState(defaultSiteSettings);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      void api<Partial<SiteSettings>>('/site-settings')
        .then((data) => { if (active) setSettings({ ...defaultSiteSettings, ...data }); })
        .catch(() => { /* Keep the editable defaults available if the content API is offline. */ });
    };
    const handlePublishedSettings = (event: Event) => {
      if (event instanceof CustomEvent) {
        const published = event as CustomEvent<Partial<SiteSettings>>;
        setSettings({ ...defaultSiteSettings, ...published.detail });
      }
    };
    refresh();
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener(SITE_SETTINGS_EVENT, handlePublishedSettings);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener(SITE_SETTINGS_EVENT, handlePublishedSettings);
    };
  }, []);
  return settings;
}
