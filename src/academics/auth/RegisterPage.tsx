// =============================================================================
// academics/auth/RegisterPage.tsx — /academics/register[?role=author|moderator]
//
// Three modes:
//
//   • No ?role= query param       → plain reader signup (free to browse).
//   • ?role=author                → applies to become an Author. Creates a
//                                   pending_author account, emails the admin,
//                                   and shows a "pending approval" screen.
//   • ?role=moderator             → applies to become a Moderator. Same flow
//                                   but creates pending_moderator.
//
// The form shows bio / registration-reason textareas only in the author
// and moderator modes, since the admin needs that context to approve.
// =============================================================================

import { useState, type FormEvent } from 'react';
import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { CheckCircle2, Clock, PencilLine, Scale } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE } from '../../lib/apiBase';
import type { AuthResponse } from '../types';

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

type RequestedRole = 'author' | 'moderator';

function parseRequestedRole(raw: string | null): RequestedRole | null {
  if (raw === 'author' || raw === 'moderator') return raw;
  return null;
}

// ---------------------------------------------------------------------------
// RegisterPage
// ---------------------------------------------------------------------------

interface RegisterResponseBody {
  message?: string;
  userId?: string;
  requiresApproval?: boolean;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedRole = parseRequestedRole(searchParams.get('role'));

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [institution, setInstitution] = useState('');
  const [bio, setBio] = useState('');
  const [reason, setReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingSuccess, setPendingSuccess] = useState(false);

  // Whether to show the extra bio / reason fields
  const applyingForRole = requestedRole !== null;

  // UI labels / visuals
  const roleLabel =
    requestedRole === 'author'
      ? 'Author'
      : requestedRole === 'moderator'
        ? 'Moderator'
        : null;
  const RoleIcon =
    requestedRole === 'moderator' ? Scale : requestedRole === 'author' ? PencilLine : null;
  const accentColor = requestedRole === 'moderator' ? '#b45309' : '#1e3a5f';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const body: Record<string, unknown> = {
      email: email.trim(),
      password,
    };
    if (fullName.trim()) body.fullName = fullName.trim();
    if (qualification.trim()) body.qualification = qualification.trim();
    if (specialty.trim()) body.specialty = specialty.trim();
    if (institution.trim()) body.institution = institution.trim();
    if (bio.trim()) body.bio = bio.trim();
    if (reason.trim()) body.reason = reason.trim();
    if (requestedRole) body.requestedRole = requestedRole;

    try {
      const res = await fetch(`${API_BASE}/api/academics/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = 'Registration failed. Please try again.';
        try {
          const parsed = (await res.json()) as { message?: string };
          if (parsed?.message) msg = parsed.message;
        } catch {
          // ignore parse error
        }
        setError(msg);
        return;
      }

      // The register endpoint returns { message, userId, requiresApproval }.
      // If the account requires admin approval we do NOT log the user in,
      // and we flip to the pending-success screen. Otherwise we go straight
      // to the dashboard (best-effort auto-login via the login endpoint is
      // out of scope — they can sign in on the next screen).
      const data = (await res.json()) as RegisterResponseBody;

      if (data.requiresApproval) {
        setPendingSuccess(true);
        return;
      }

      // Old-style reader signup path — try to auto-login for a smooth UX.
      try {
        const loginRes = await fetch(`${API_BASE}/api/academics/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (loginRes.ok) {
          const auth = (await loginRes.json()) as AuthResponse;
          useAuthStore.getState().setAuth(auth);
          navigate('/academics/dashboard', { replace: true });
          return;
        }
      } catch {
        // fall through
      }
      // Auto-login failed — just send them to the sign-in page
      navigate('/academics/login', { replace: true });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Pending-approval success screen
  // ---------------------------------------------------------------------------

  if (pendingSuccess) {
    return (
      <div
        className="min-h-screen bg-bg flex items-center justify-center px-4 py-10"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-card border border-border p-8 sm:p-10 text-center">
            <div className="flex justify-center mb-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#dcfce7' }}
              >
                <CheckCircle2 size={30} className="text-success" aria-hidden="true" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-primary mb-2">
              Application submitted
            </h1>
            <p className="text-sm text-ink mb-5 leading-relaxed">
              Thanks for applying to join PediAid Academics as a{' '}
              <strong>{roleLabel}</strong>.
            </p>

            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left mb-6">
              <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-amber-800 leading-relaxed">
                An admin will review your credentials and you'll receive an
                email at <strong>{email}</strong> once a decision has been made.
                Until then, your account is created in a pending state and you
                can still browse approved content.
              </p>
            </div>

            <Link
              to="/academics"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              Back to Academics
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main register form
  // ---------------------------------------------------------------------------

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center px-4 py-10"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card border border-border p-8 sm:p-10">
          {/* Header */}
          <div className="mb-6 text-center">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
              style={{ backgroundColor: accentColor }}
            >
              {RoleIcon ? (
                <RoleIcon size={22} className="text-white" aria-hidden="true" />
              ) : (
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
              )}
            </div>
            <h1 className="text-2xl font-bold text-primary">
              {roleLabel ? `Apply as ${roleLabel}` : 'Create account'}
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              {roleLabel
                ? 'Your application will be reviewed by an admin.'
                : 'Join PediAid Academics'}
            </p>
          </div>

          {/* Eligibility banner for applicants */}
          {roleLabel && (
            <div
              className="mb-6 rounded-xl border px-4 py-3 text-xs leading-relaxed"
              style={
                requestedRole === 'moderator'
                  ? { borderColor: '#fde68a', backgroundColor: '#fffbeb', color: '#92400e' }
                  : { borderColor: '#bfdbfe', backgroundColor: '#eff6ff', color: '#1e3a5f' }
              }
            >
              <p className="font-semibold uppercase tracking-wide text-[10px] mb-1">
                Eligibility
              </p>
              <p>
                {requestedRole === 'moderator'
                  ? 'MD / DNB with 3+ years clinical experience.'
                  : 'MBBS / MD or equivalent medical degree.'}
              </p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-ink placeholder-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
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
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-ink placeholder-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </div>

            {/* Profile fields — required in role-application mode, optional otherwise */}
            <div className="pt-1">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
                {applyingForRole ? 'Your credentials' : 'Profile (optional)'}
              </p>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="reg-fullname"
                    className="block text-sm font-medium text-ink mb-1.5"
                  >
                    Full name {applyingForRole && <span className="text-danger">*</span>}
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    autoComplete="name"
                    required={applyingForRole}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-ink placeholder-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-qualification"
                    className="block text-sm font-medium text-ink mb-1.5"
                  >
                    Qualification {applyingForRole && <span className="text-danger">*</span>}
                  </label>
                  <input
                    id="reg-qualification"
                    type="text"
                    required={applyingForRole}
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. MBBS, MD, MRCPCH"
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-ink placeholder-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-ink placeholder-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-ink placeholder-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Bio + reason — only for applicants */}
            {applyingForRole && (
              <div className="pt-1">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
                  A little about you
                </p>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="reg-bio"
                      className="block text-sm font-medium text-ink mb-1.5"
                    >
                      Brief bio
                    </label>
                    <textarea
                      id="reg-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Your training, current role, areas of clinical interest…"
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-ink placeholder-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors resize-y"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-reason"
                      className="block text-sm font-medium text-ink mb-1.5"
                    >
                      Why do you want to join? <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="reg-reason"
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder={
                        requestedRole === 'moderator'
                          ? 'e.g. I want to contribute to evidence-based paediatric reference material by reviewing peer submissions.'
                          : 'e.g. I want to share teaching notes from my neonatology fellowship with a wider audience.'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-ink placeholder-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors resize-y"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 mt-2"
              style={{ backgroundColor: accentColor }}
            >
              {isSubmitting
                ? 'Submitting…'
                : applyingForRole
                  ? `Submit ${roleLabel} Application`
                  : 'Create account'}
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
