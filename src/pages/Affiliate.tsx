import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Award, Check, Copy, Share2, Smartphone, Sparkles, Users, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import { useAffiliateStats } from '../lib/dataHooks';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { useSiteSettings } from '../lib/siteSettings';

const burstParticles = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2;
  return {
    x: Math.round(Math.cos(angle) * 38),
    y: Math.round(Math.sin(angle) * 38),
    color: index % 2 === 0 ? '#f472b6' : '#fbbf24',
  };
});

function AnimatedMetric({ value, currency = false }: { value: number; currency?: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  const currentValue = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentValue.current = value;
      setDisplayed(value);
      return;
    }

    const from = currentValue.current;
    const started = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - started) / 850, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (value - from) * eased);
      currentValue.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{currency ? `KSh ${displayed.toLocaleString()}` : displayed.toLocaleString()}</>;
}

function isValidKenyanPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return /^(07|01)\d{8}$/.test(digits) || /^254[17]\d{8}$/.test(digits);
}

function phoneToE164(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
  return `+254${digits}`;
}

export default function Affiliate() {
  const siteSettings = useSiteSettings();
  const [phone, setPhone] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const copyResetTimer = useRef<number | undefined>(undefined);
  const { data: affiliate, loading: statsLoading, error: statsError } = useAffiliateStats(affiliateCode);

  useEffect(() => () => window.clearTimeout(copyResetTimer.current), []);

  const generate = async () => {
    if (!isValidKenyanPhone(phone)) {
      setError('Enter a valid Kenyan mobile number, such as 0712 345 678.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      if (hasSupabaseConfig) {
        if (!supabase) throw new Error('Supabase authentication is unavailable.');
        const { error: authError } = await supabase.auth.signInWithOtp({
          phone: phoneToE164(phone),
          options: { shouldCreateUser: true },
        });
        if (authError) throw authError;
        setOtpSent(true);
        return;
      }
      const result = await api<{ code: string }>('/affiliates', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setAffiliateCode(result.code);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not create your referral link.');
    } finally {
      setBusy(false);
    }
  };

  const verifyPhone = async () => {
    if (!supabase || !otp.trim()) {
      setError('Enter the one-time code sent to your phone.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({ phone: phoneToE164(phone), token: otp.trim(), type: 'sms' });
      if (otpError) throw otpError;
      const result = await api<{ code: string }>('/affiliates', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setAffiliateCode(result.code);
      setOtpSent(false);
      setOtp('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not verify your number.');
    } finally {
      setBusy(false);
    }
  };

  const referralLink = affiliate ? `${window.location.origin}${affiliate.link}` : '';

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.clearTimeout(copyResetTimer.current);
      copyResetTimer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError('Clipboard access is unavailable. Select and copy the link above.');
    }
  };

  const shareLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Glamourglow Spa', text: 'Book your next set with Glamourglow.', url: referralLink });
      } catch (shareError) {
        if (shareError instanceof Error && shareError.name !== 'AbortError') setError('Could not open the share menu.');
      }
      return;
    }
    await copyLink();
  };

  return (
    <main className="affiliate-page">
      <div className="affiliate-inner">
        <header className="affiliate-heading">
          <span className="eyebrow"><Share2 /> GLAMOURGLOW PARTNER PROGRAM</span>
          <h1>Earn <em>{siteSettings.affiliate_cash_percent}% commission</em><br />on every booking.</h1>
          <p>Share your personal referral link with your community. Your referrals and commission balance are tracked here; no account signup is needed to get started.</p>
        </header>

        <section className="affiliate-generator">
          <span className="eyebrow"><Smartphone /> CREATE YOUR PERSONAL LINK</span>
          <h2>Start sharing the glow.</h2>
          <p>Use your M-Pesa number for your unique referral code and payout identity.</p>
          <div className="affiliate-phone-row">
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-label="M-Pesa number"
              placeholder="M-Pesa number, e.g. 0712 345 678"
              value={phone}
              onChange={(event) => { setPhone(event.target.value); setError(''); }}
              onKeyDown={(event) => { if (event.key === 'Enter') void generate(); }}
            />
            {!otpSent && <button type="button" className="primary" onClick={() => void generate()} disabled={busy}>
              <Share2 /> {busy ? 'Creating link…' : 'Generate link'}
            </button>}
          </div>
          {otpSent && (
            <div className="affiliate-otp">
              <p>We sent a verification code to {phoneToE164(phone)}. Enter it to secure your account and view your commissions.</p>
              <div className="affiliate-phone-row">
                <input aria-label="SMS verification code" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="6-digit code" />
                <button type="button" className="primary" disabled={busy} onClick={() => void verifyPhone()}>{busy ? 'Verifying…' : 'Verify number'}</button>
              </div>
            </div>
          )}
          {error && <p className="affiliate-error" role="alert">{error}</p>}
          {affiliateCode && statsLoading && <p className="affiliate-activity-empty">Loading your referral dashboard…</p>}
          {affiliateCode && statsError && <p className="affiliate-error" role="alert">{statsError}</p>}
          {affiliate && (
            <div className="affiliate-link-card">
              <small><Check /> Your referral link · Code {affiliate.code}</small>
              <div className="affiliate-link-row">
                <code>{referralLink}</code>
                <button type="button" className={copied ? 'is-copied' : ''} onClick={() => void copyLink()} aria-label="Copy referral link" aria-live="polite">
                  {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
                  {copied && <span className="affiliate-copy-burst" aria-hidden="true">{burstParticles.map((particle, index) => (
                    <i
                      key={index}
                      style={{
                        '--burst-x': `${particle.x}px`,
                        '--burst-y': `${particle.y}px`,
                        '--burst-color': particle.color,
                      } as CSSProperties}
                    />
                  ))}</span>}
                </button>
                <button type="button" onClick={() => void shareLink()} aria-label="Share referral link"><Share2 /> Share</button>
              </div>
            </div>
          )}
        </section>

        {affiliate && (
          <>
            <section className="affiliate-stats" aria-label="Affiliate earnings">
              <article className="affiliate-stat"><span className="affiliate-stat-icon"><Wallet /></span><small>Paid commissions</small><strong><AnimatedMetric value={affiliate.paid} currency /></strong></article>
              <article className="affiliate-stat"><span className="affiliate-stat-icon"><Award /></span><small>Pending commissions</small><strong><AnimatedMetric value={affiliate.pending} currency /></strong></article>
              <article className="affiliate-stat"><span className="affiliate-stat-icon"><Users /></span><small>Referred bookings</small><strong><AnimatedMetric value={affiliate.referrals} /></strong></article>
            </section>
            <section className="affiliate-explainer">
              <h2>How your commission works</h2>
              <p>When someone books using your referral code, their booking is recorded here. Cash commission is {siteSettings.affiliate_cash_percent}% of the booking total and moves to paid after the appointment is completed.</p>
              <div className="affiliate-steps">
                <article className="affiliate-step"><b>1</b><strong>Share your link</strong><p>Send it by WhatsApp, social media or email.</p></article>
                <article className="affiliate-step"><b>2</b><strong>They book</strong><p>Your code is included with their booking request.</p></article>
                <article className="affiliate-step"><b>3</b><strong>Track your reward</strong><p>Completed bookings count toward paid commission.</p></article>
              </div>
            </section>
            <section className="affiliate-activity">
              <h2><Sparkles /> Recent referral activity</h2>
              {affiliate.activity.length ? (
                <table>
                  <thead><tr><th>Appointment</th><th>Booking value</th><th>Your {siteSettings.affiliate_cash_percent}%</th><th>Status</th></tr></thead>
                  <tbody>{affiliate.activity.map((item) => (
                    <tr key={item.id}>
                      <td>{item.services.join(', ')}<small>{item.date}</small></td>
                      <td>KSh {item.amount.toLocaleString()}</td>
                      <td>KSh {item.commission.toLocaleString()}</td>
                      <td><span className={`status ${item.status}`}>{item.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <p className="affiliate-activity-empty">No referral bookings yet. Share your link to get started.</p>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
