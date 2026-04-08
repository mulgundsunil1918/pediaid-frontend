// =============================================================================
// academics/auth/RegisterPage.tsx — /academics/register
// =============================================================================

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { AuthResponse } from '../types';

// ---------------------------------------------------------------------------
// RegisterPage
// ---------------------------------------------------------------------------

export function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [institution, setInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const body: Record<string, string> = {
      email: email.trim(),
      password,
    };
    if (fullName.trim()) body.fullName = fullName.trim();
    if (qualification.trim()) body.qualification = qualification.trim();
    if (specialty.trim()) body.specialty = specialty.trim();
    if (institution.trim()) body.institution = institution.trim();

    try {
      const res = await fetch('/api/academics/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = 'Registration failed. Please try again.';
        try {
          const parsed = await res.json();
          if (parsed?.message) msg = parsed.message;
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
      className="min-h-screen bg-bg flex items-center justify-center px-4 py-10"
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
            <h1 className="text-2xl font-bold text-primary">Create account</h1>
            <p className="text-sm text-ink-muted mt-1">
              Join PediAid Academics
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Required fields */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Email address <span className="text-danger">*</span>
              </label>
              <input
                id="reg-email"
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

            <div>
              <label
                htmlFor="reg-password"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Password <span className="text-danger">*</span>
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
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

            {/* Optional profile fields */}
            <div className="pt-1">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
                Profile (optional)
              </p>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="reg-fullname"
                    className="block text-sm font-medium text-ink mb-1.5"
                  >
                    Full name
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="w-full px-4 py-2.5 rounded-xl border border-border
                               text-sm text-ink placeholder-ink-muted
                               outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                               transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-qualification"
                    className="block text-sm font-medium text-ink mb-1.5"
                  >
                    Qualification
                  </label>
                  <input
                    id="reg-qualification"
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. MBBS, MD, MRCPCH"
                    className="w-full px-4 py-2.5 rounded-xl border border-border
                               text-sm text-ink placeholder-ink-muted
                               outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                               transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-specialty"
                    className="block text-sm font-medium text-ink mb-1.5"
                  >
                    Specialty
                  </label>
                  <input
                    id="reg-specialty"
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Paediatrics, Neonatology"
                    className="w-full px-4 py-2.5 rounded-xl border border-border
                               text-sm text-ink placeholder-ink-muted
                               outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                               transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-institution"
                    className="block text-sm font-medium text-ink mb-1.5"
                  >
                    Institution
                  </label>
                  <input
                    id="reg-institution"
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Great Ormond Street Hospital"
                    className="w-full px-4 py-2.5 rounded-xl border border-border
                               text-sm text-ink placeholder-ink-muted
                               outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                               transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white
                         transition-opacity disabled:opacity-60 mt-2"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center text-sm text-ink-muted space-y-2">
            <p>
              Already have an account?{' '}
              <Link
                to="/academics/login"
                className="font-medium text-accent hover:underline underline-offset-2"
              >
                Sign in
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
