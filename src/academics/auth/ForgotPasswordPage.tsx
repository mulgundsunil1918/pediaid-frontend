// =============================================================================
// academics/auth/ForgotPasswordPage.tsx — /academics/forgot-password
//
// Single email field + submit. On submit, calls POST /auth/forgot-password
// (which always returns 200) and flips to a success state telling the user
// to check their inbox — without revealing whether the email actually
// matched an account.
// =============================================================================

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../../lib/apiBase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/academics/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubmitted(true);
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
          {submitted ? (
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#dcfce7' }}
                >
                  <CheckCircle2 size={32} className="text-success" aria-hidden="true" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-primary mb-3">
                Check your inbox
              </h1>
              <p className="text-sm text-ink-muted leading-relaxed mb-2">
                If an account exists for{' '}
                <strong className="text-ink">{email}</strong>, we've sent a
                password reset link that's valid for the next hour.
              </p>
              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                Click the link in the email to choose a new password.
              </p>
              <Link
                to="/academics/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                  style={{ backgroundColor: '#1e3a5f' }}
                >
                  <Mail size={22} className="text-white" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-bold text-primary">
                  Forgot your password?
                </h1>
                <p className="text-sm text-ink-muted mt-1">
                  Enter your email and we'll send you a reset link.
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
                    htmlFor="forgot-email"
                    className="block text-sm font-medium text-ink mb-1.5"
                  >
                    Email address <span className="text-danger">*</span>
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-ink placeholder-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: '#1e3a5f' }}
                >
                  {isSubmitting ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-ink-muted">
                <Link
                  to="/academics/login"
                  className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
                >
                  <ArrowLeft size={14} />
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
