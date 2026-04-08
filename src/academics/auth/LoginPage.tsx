// =============================================================================
// academics/auth/LoginPage.tsx — /academics/login
// =============================================================================

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { AuthResponse } from '../types';

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/academics/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        let msg = 'Login failed. Please check your credentials.';
        try {
          const body = await res.json();
          if (body?.message) msg = body.message;
        } catch {
          // ignore parse error
        }
        setError(msg);
        return;
      }

      const data: AuthResponse = await res.json();
      useAuthStore.getState().setAuth(data);
      navigate('/academics/dashboard', { replace: true });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
              Sign in to PediAid Academics
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Password
              </label>
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
