// =============================================================================
// academics/auth/LoginPage.tsx — /academics/login
// =============================================================================

import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  signInEmail,
  signInGoogle,
  bridgeSignIn,
  friendlyAuthError,
} from '../../lib/firebaseAuth';

// localStorage key for the "Remember me on this device" saved email.
// When set, the login page pre-fills the email field on mount and we also
// ask the backend for a 30-day refresh token instead of the default 7 days.
const SAVED_EMAIL_KEY = 'acad_saved_email';

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Where to send the user after a successful login. Only accept an
  // internal /academics/... path (never an absolute URL) so a crafted
  // ?next= query can't be used as an open redirect.
  const rawNext = searchParams.get('next');
  const nextPath =
    rawNext && rawNext.startsWith('/academics/') ? rawNext : '/academics/dashboard';

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // On mount, restore a saved email if one exists. Having an email in
  // localStorage means the last successful login on this device opted in
  // to "remember me", so we also pre-check the checkbox.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      // localStorage blocked (private mode, etc.) — silently ignore
    }
  }, []);

  function afterSignIn() {
    try {
      sessionStorage.removeItem(`pediaid_login_bounce:${nextPath}`);
    } catch {
      /* ignore */
    }
    // Persist (or clear) the saved email depending on the checkbox.
    try {
      if (rememberMe) {
        localStorage.setItem(SAVED_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
    } catch {
      // localStorage blocked — non-fatal
    }
    navigate(nextPath, { replace: true });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await signInEmail(email, password);
      await bridgeSignIn(user);
      afterSignIn();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setIsSubmitting(true);
    try {
      const user = await signInGoogle();
      await bridgeSignIn(user);
      afterSignIn();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Already signed in — showing "Welcome back / Sign in" to someone with an
  // active session is nonsense, and signing in again as the same person
  // changes nothing.
  //
  // But bouncing them onward is only safe ONCE. If the destination sends
  // them straight back here, the two redirects ping-pong forever: neither
  // throws, so React Router just spins and the page renders blank with no
  // error — which is exactly the failure this guard caused. So the hop is
  // recorded, and a second arrival with the same target shows the form
  // instead. A visible login page is a bad outcome; an invisible infinite
  // loop is a much worse one.
  const bounceKey = `pediaid_login_bounce:${nextPath}`;
  let alreadyBounced = false;
  try {
    alreadyBounced = sessionStorage.getItem(bounceKey) === '1';
  } catch {
    // sessionStorage unavailable — treat as "already bounced" so we can
    // never loop, at the cost of one extra manual click.
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

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center px-4"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card border border-border p-8 sm:p-10">
          {/* Logo / heading */}
          <div className="mb-8 text-center">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
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
            <h1 className="text-2xl font-bold text-primary">Welcome back</h1>
            <p className="text-sm text-ink-muted mt-1">
              Sign in to your PediAid account
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            autoComplete="on"
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border
                           text-sm text-ink placeholder-ink-muted
                           outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                           transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-ink"
                >
                  Password
                </label>
                <Link
                  to="/academics/forgot-password"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-border
                           text-sm text-ink placeholder-ink-muted
                           outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                           transition-colors"
              />
            </div>

            {/* Remember me */}
            <label
              htmlFor="login-remember"
              className="flex items-center gap-2.5 select-none cursor-pointer"
            >
              <input
                id="login-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent
                           focus:ring-2 focus:ring-accent/30 cursor-pointer"
              />
              <span className="text-sm text-ink">
                Remember me on this device
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white
                         transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* OR divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-semibold tracking-wide text-ink-muted">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-ink
                       border border-border transition-opacity disabled:opacity-60
                       flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.61z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>

          {/* Footer links */}
          <div className="mt-6 text-center text-sm text-ink-muted space-y-2">
            <p>
              Don't have an account?{' '}
              <Link
                to="/academics/register"
                className="font-medium text-accent hover:underline underline-offset-2"
              >
                Create one
              </Link>
            </p>
            <p>
              <Link
                to="/academics"
                className="text-ink-muted hover:text-ink underline underline-offset-2 transition-colors"
              >
                Back to Browse
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
