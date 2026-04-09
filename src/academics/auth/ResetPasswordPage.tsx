// =============================================================================
// academics/auth/ResetPasswordPage.tsx — /academics/reset-password?token=xxx
//
// Landed on from the password-reset email. Reads the token from the URL,
// collects a new password (+ confirmation), posts to /auth/reset-password,
// then redirects to the login page on success.
// =============================================================================

import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../../lib/apiBase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If the token is missing entirely, show a clear error immediately
  useEffect(() => {
    if (!token) {
      setError(
        'This reset link is missing its token. Please request a new password reset email.',
      );
    }
  }, [token]);

  // After success, bounce to login after a short delay so the user can read
  // the confirmation.
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      navigate('/academics/login', { replace: true });
    }, 2500);
    return () => clearTimeout(t);
  }, [success, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/academics/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword }),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        setError(body.message ?? 'Reset failed. Please try again.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center px-4 py-10"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card border border-border p-8 sm:p-10">
          {success ? (
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#dcfce7' }}
                >
                  <CheckCircle2
                    size={32}
                    className="text-success"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-primary mb-3">
                Password reset
              </h1>
              <p className="text-sm text-ink-muted mb-5 leading-relaxed">
                Your password has been updated. Redirecting you to sign in…
              </p>
              <Link
                to="/academics/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
              >
                Sign in now
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                  style={{ backgroundColor: '#1e3a5f' }}
                >
                  <KeyRound size={22} className="text-white" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-bold text-primary">
                  Choose a new password
                </h1>
                <p className="text-sm text-ink-muted mt-1">
                  At least 6 characters.
                </p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-password"
                    className="block text-sm font-medium text-ink mb-1.5"
                  >
                    New password <span className="text-danger">*</span>
                  </label>
                  <input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={!token}
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-ink placeholder-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reset-password-confirm"
                    className="block text-sm font-medium text-ink mb-1.5"
                  >
                    Confirm new password <span className="text-danger">*</span>
                  </label>
                  <input
                    id="reset-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={!token}
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-ink placeholder-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !token}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: '#1e3a5f' }}
                >
                  {isSubmitting ? 'Updating…' : 'Reset password'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-ink-muted">
                <Link
                  to="/academics/login"
                  className="font-medium text-accent hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
