import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';

type InviteDetails = { name: string; email: string; role: 'nail_tech' | 'reception_manager'; expires_at: string };

export default function StaffInviteClaim() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) {
      setError('This invitation link is missing its secure token.');
      setLoading(false);
      return () => { active = false; };
    }
    void api<InviteDetails>(`/staff/invites/validate?token=${encodeURIComponent(token)}`)
      .then((invite) => { if (active) setDetails(invite); })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'This invitation is invalid or has expired.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const claim = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !details) return;
    if (password.length < 12) {
      setError('Use a password with at least 12 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api('/staff/invites/claim', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setClaimed(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not claim this invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="staff-invite-page">
      <section className="admin-login-card staff-invite-card">
        <span className="staff-invite-icon"><ShieldCheck /></span>
        <span className="eyebrow">SECURE STAFF INVITATION</span>
        {loading ? <p role="status">Validating invitation…</p> : claimed ? (
          <>
            <h1>Welcome to the team.</h1>
            <p>Your staff account has been created for {details?.email}. Sign in to the staff portal to continue.</p>
            <Link className="primary full" to="/admin">Go to staff sign in</Link>
          </>
        ) : details ? (
          <>
            <h1>Claim your access.</h1>
            <p>You are invited as <strong>{details.role.replace('_', ' ')}</strong>. Set a password to activate your staff account.</p>
            <form onSubmit={(event) => void claim(event)}>
              <label>Name<input value={details.name} readOnly /></label>
              <label>Email<input value={details.email} readOnly /></label>
              <label>Create password<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <label>Confirm password<input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
              {error && <p className="affiliate-error" role="alert">{error}</p>}
              <button type="submit" className="primary full" disabled={submitting}>{submitting ? 'Creating account…' : 'Create staff account'}</button>
            </form>
          </>
        ) : (
          <>
            <h1>Invitation unavailable.</h1>
            <p>{error || 'This invitation is invalid, expired or has already been used.'}</p>
            <Link className="primary full" to="/">Return to Glamourglow</Link>
          </>
        )}
      </section>
    </main>
  );
}
