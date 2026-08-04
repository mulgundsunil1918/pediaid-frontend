// =============================================================================
// academics/auth/LoginPage.tsx — /academics/login
//
// Sign in with Google or Apple. No passwords.
//
// Why no email/password:
//   - Every password is a support burden that eventually lands on a human —
//     resets, "which method did I use again", credential stuffing, weak
//     choices reused from elsewhere.
//   - Both providers hand back an already-verified email, so there is nothing
//     for us to verify and no verification mail to send.
//   - Nothing here stores or transports a credential, so there is no password
//     to leak from this app at all.
//
// Both buttons appear on every device rather than being chosen by platform.
// Detection guesses wrong constantly — an iPhone user whose account is Google,
// a Mac user who has never touched Apple ID — and guessing wrong leaves
// someone facing the one button that cannot let them in.
//
// The likeliest failure here is a returning user tapping the OTHER provider
// with the same email. Firebase refuses to merge those, so friendlyAuthError
// names that case explicitly instead of showing its generic message.
// =============================================================================

import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import {
  signInGoogle,
  signInApple,
  bridgeSignIn,
  friendlyAuthError,
} from '../../lib/firebaseAuth';
import { hasSeenTutorial } from '../onboarding/onboardingStorage';
import { defaultDestinationFor, needsProfileDetails } from './destination';

// ---------------------------------------------------------------------------
// Provider marks
//
// Inline SVG rather than an icon font or remote image: the sign-in page has to
// render correctly on a cold first load, and both marks carry brand
// requirements a generic icon set wouldn't meet.
// ---------------------------------------------------------------------------

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l2.99-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.94c-.03-2.7 2.2-4 2.3-4.06-1.25-1.83-3.2-2.08-3.9-2.11-1.66-.17-3.24.98-4.08.98-.84 0-2.14-.96-3.52-.93-1.81.03-3.48 1.05-4.41 2.67-1.88 3.26-.48 8.08 1.35 10.72.9 1.29 1.97 2.74 3.38 2.69 1.36-.06 1.87-.88 3.51-.88 1.64 0 2.1.88 3.53.85 1.46-.02 2.38-1.31 3.27-2.61 1.03-1.5 1.46-2.95 1.48-3.03-.03-.01-2.84-1.09-2.87-4.32M14.4 4.6c.74-.9 1.24-2.15 1.1-3.4-1.07.05-2.36.72-3.13 1.61-.68.79-1.28 2.06-1.12 3.28 1.2.09 2.42-.61 3.15-1.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------

type Provider = 'google' | 'apple';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState('');

  // Where to go afterwards. Only an internal /academics/... path is accepted
  // (never an absolute URL) so a crafted ?next= can't become an open redirect.
  const rawNext = searchParams.get('next');
  const explicitNext = rawNext && rawNext.startsWith('/academics/') ? rawNext : null;

  const currentRole = useAuthStore.getState().user?.role;
  const nextPath = explicitNext ?? defaultDestinationFor(currentRole);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  function afterSignIn() {
    try {
      sessionStorage.removeItem(`pediaid_login_bounce:${nextPath}`);
    } catch {
      /* ignore */
    }

    // Re-read from the store: the role is only known once sign-in has
    // populated it, so anything captured at render time may still be stale.
    const signedIn = useAuthStore.getState().user;
    const role = signedIn?.role;

    // A first sign-in yields a name and an email and nothing else, so offer
    // the details step once. Skipped when the user asked for somewhere
    // specific (a shared chapter link, an admin page) — that intent outranks
    // our onboarding — and skipped for staff, who signed in to do a job.
    if (!explicitNext && signedIn != null && needsProfileDetails(role, signedIn.profile)) {
      navigate('/academics/complete-profile', { replace: true });
      return;
    }

    navigate(explicitNext ?? defaultDestinationFor(role), { replace: true });
  }

  async function handleProvider(provider: Provider) {
    setError('');
    setBusy(provider);
    try {
      const user = provider === 'google' ? await signInGoogle() : await signInApple();
      await bridgeSignIn(user);
      afterSignIn();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(null);
    }
  }

  // The tutorial comes before sign-in for anyone who hasn't seen it. Guarded
  // on isAuthenticated so it can never interrupt a returning user mid-session.
  if (!isAuthenticated && !hasSeenTutorial()) {
    return <Navigate to="/academics/welcome" replace />;
  }

  // Already signed in — showing "Sign in" to someone with an active session is
  // nonsense. But bouncing them onward is only safe ONCE: if the destination
  // sends them back here, the two redirects ping-pong forever, neither throws,
  // and the page renders blank with no error. So the hop is recorded, and a
  // second arrival with the same target shows the buttons instead.
  const bounceKey = `pediaid_login_bounce:${nextPath}`;
  let alreadyBounced = false;
  try {
    alreadyBounced = sessionStorage.getItem(bounceKey) === '1';
  } catch {
    // Storage unavailable — treat as bounced so we can never loop, at the
    // cost of one extra click.
    alreadyBounced = true;
  }

  if (isAuthenticated && !alreadyBounced) {
    try {
      sessionStorage.setItem(bounceKey, '1');
    } catch {
      /* ignore */
    }
    return <Navigate to={nextPath} replace />;
  }

  const anyBusy = busy !== null;

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center px-4 py-10"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card border border-border p-8 sm:p-10">
          <div className="mb-8 text-center">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2L3 7v10l9 5 9-5V7L12 2z"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 7v10M7 9.5l5 2.5 5-2.5"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary">Sign in to PediAid</h1>
            <p className="text-sm text-ink-muted mt-1.5">
              Use an account you already have — no new password to remember.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleProvider('google')}
              disabled={anyBusy}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border text-sm font-semibold text-ink bg-white hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              {busy === 'google' ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <GoogleMark />
              )}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleProvider('apple')}
              disabled={anyBusy}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-black hover:bg-gray-900 disabled:opacity-60 transition-colors"
            >
              {busy === 'apple' ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <AppleMark />
              )}
              Continue with Apple
            </button>
          </div>

          <p className="text-xs text-ink-muted text-center mt-7 leading-relaxed">
            Signing in creates your PediAid account if you don't have one yet.
            We only ever receive your name and email address.
          </p>
        </div>

        <p className="text-center text-xs text-ink-muted mt-5">
          Trouble signing in? Email{' '}
          <a href="mailto:help@bridgr.co.in" className="font-medium hover:text-ink">
            help@bridgr.co.in
          </a>
        </p>
      </div>
    </div>
  );
}
