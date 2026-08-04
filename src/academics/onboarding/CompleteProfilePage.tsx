// =============================================================================
// academics/onboarding/CompleteProfilePage.tsx
//
// Shown once, straight after a first Google sign-in: Google gives us a name
// and an email and nothing else, so this is where we ask for the clinical
// details the rest of the platform depends on.
//
// Skippable by design. This screen stands between someone who has just signed
// in and the thing they actually came for, so blocking them here converts a
// completed sign-up into an abandoned one. Anyone who skips gets a dismissible
// banner instead (ProfileNudge), and can fill it in from Profile at any time.
//
// Nothing here is required by the backend either — PUT /api/academics/me
// patches only the fields it is given, so a partial save is valid.
// =============================================================================

import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { Loader2, UserCircle2 } from 'lucide-react';
import { useUpdateProfile } from '../dashboard/hooks/useDashboard';
import { useAuthStore } from '../../store/authStore';
import { dismissNudge } from './onboardingStorage';
import { defaultDestinationFor } from '../auth/destination';

/**
 * Common paediatric sub-specialties, offered as suggestions rather than a
 * closed dropdown — the list will never be complete, and forcing an
 * approximate choice produces worse data than letting someone type their own.
 */
const SPECIALTY_SUGGESTIONS = [
  'General Paediatrics',
  'Neonatology',
  'Paediatric Cardiology',
  'Paediatric Neurology',
  'Paediatric Intensive Care',
  'Paediatric Pulmonology',
  'Paediatric Gastroenterology',
  'Paediatric Nephrology',
  'Paediatric Endocrinology',
  'Paediatric Haematology & Oncology',
  'Paediatric Infectious Diseases',
  'Paediatric Surgery',
  'Developmental Paediatrics',
  'Adolescent Medicine',
];

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  // Google supplies a display name, so start from it rather than an empty box.
  const [fullName, setFullName] = useState(user?.profile?.fullName ?? '');
  const [qualification, setQualification] = useState(user?.profile?.qualification ?? '');
  const [specialty, setSpecialty] = useState(user?.profile?.specialty ?? '');
  const [institution, setInstitution] = useState(user?.profile?.institution ?? '');
  const [error, setError] = useState('');

  function goToApp() {
    // Honour where the user was originally headed (LoginPage passes it
    // through when a protected screen bounced them to sign in), falling back
    // to the role's home. Only internal /academics/... paths are accepted, so
    // a crafted ?next= can't turn this into an open redirect.
    const raw = params.get('next');
    const target =
      raw && raw.startsWith('/academics/') ? raw : defaultDestinationFor(user?.role);
    navigate(target, { replace: true });
  }

  function handleSkip() {
    // Skipping is a real choice, not a deferral — but the nudge banner stays
    // (it is only dismissed by its own X) so the prompt isn't lost entirely.
    goToApp();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    // Send only what was actually filled in, so blanks don't overwrite
    // anything Google or a previous session already provided.
    const payload = {
      ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
      ...(qualification.trim() ? { qualification: qualification.trim() } : {}),
      ...(specialty.trim() ? { specialty: specialty.trim() } : {}),
      ...(institution.trim() ? { institution: institution.trim() } : {}),
    };

    if (Object.keys(payload).length === 0) {
      handleSkip();
      return;
    }

    try {
      await updateProfile.mutateAsync(payload);
      // A completed profile shouldn't then be nagged about.
      dismissNudge();
      goToApp();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save your details. You can add them later from Profile.',
      );
    }
  }

  const saving = updateProfile.isPending;

  // Reachable directly by URL and from the nudge banner, so it can be opened
  // without a session. Saving would 401 and show an error for something the
  // user can't fix from here; send them to sign in instead. `replace` so Back
  // doesn't land them straight back on this screen.
  if (!isAuthenticated) {
    return <Navigate to="/academics/login" replace />;
  }

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center px-4 py-10"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card border border-border p-8 sm:p-10">
          <div className="mb-7">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <UserCircle2 size={24} color="white" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-primary">A few details</h1>
            <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">
              This helps us show you relevant guidelines and CME. You can change
              any of it later, and skip anything you'd rather not share.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="cp-name" className="block text-sm font-semibold text-ink mb-1.5">
                Full name
              </label>
              <input
                id="cp-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Priya Sharma"
                autoComplete="name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="cp-qual" className="block text-sm font-semibold text-ink mb-1.5">
                Qualification
              </label>
              <input
                id="cp-qual"
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="MD Paediatrics, DNB"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="cp-spec" className="block text-sm font-semibold text-ink mb-1.5">
                Specialty
              </label>
              <input
                id="cp-spec"
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="General Paediatrics"
                list="cp-spec-options"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm text-ink focus:outline-none focus:border-accent"
              />
              <datalist id="cp-spec-options">
                {SPECIALTY_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="cp-inst" className="block text-sm font-semibold text-ink mb-1.5">
                Institution
              </label>
              <input
                id="cp-inst"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="KEM Hospital, Mumbai"
                autoComplete="organization"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 !mt-6"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {saving ? 'Saving…' : 'Save and continue'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="text-sm text-ink-muted hover:text-ink font-medium disabled:opacity-60"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
