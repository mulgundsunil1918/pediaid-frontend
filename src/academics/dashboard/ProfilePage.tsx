// =============================================================================
// academics/dashboard/ProfilePage.tsx — Edit author profile
// =============================================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useMyProfile, useUpdateProfile } from './hooks/useDashboard';
import type { UpdateProfileInput } from './hooks/useDashboard';

// ---------------------------------------------------------------------------
// Role badge helper
// ---------------------------------------------------------------------------

const ROLE_STYLES: Record<string, string> = {
  reader: 'bg-gray-100 text-gray-600',
  author: 'bg-blue-50 text-accent',
  moderator: 'bg-purple-50 text-purple-700',
  admin: 'bg-red-50 text-danger',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={[
        'acad-badge capitalize',
        ROLE_STYLES[role] ?? 'bg-gray-100 text-gray-600',
      ].join(' ')}
    >
      {role}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const { mutate, isPending, isSuccess, error, reset } = useUpdateProfile();

  const [form, setForm] = useState<UpdateProfileInput>({
    fullName: '',
    qualification: '',
    institution: '',
    bio: '',
    orcid: '',
  });

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName ?? '',
        qualification: profile.qualification ?? '',
        institution: profile.institution ?? '',
        bio: profile.bio ?? '',
        orcid: profile.orcid ?? '',
      });
    }
  }, [profile]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (isSuccess) reset(); // clear success banner on new edits
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(form);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-accent" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-reading mx-auto px-4 sm:px-6 py-8">
        {/* Back + title */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/academics/dashboard"
            className="
              flex items-center gap-1 text-sm text-ink-muted
              hover:text-accent transition-colors
            "
          >
            <ChevronLeft size={16} />
            Dashboard
          </Link>
          <span className="text-ink-muted">/</span>
          <h1 className="text-xl font-bold text-ink">Edit Profile</h1>
        </div>

        <div className="bg-card rounded-card shadow-card p-6">
          {/* Read-only meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-muted">Email</p>
              <p className="text-base text-ink truncate">{profile?.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RoleBadge role={profile?.role ?? 'reader'} />
              {profile?.credentialsVerified && (
                <span
                  className="
                    flex items-center gap-1
                    acad-badge bg-green-50 text-success
                  "
                  title="Credentials verified"
                >
                  <ShieldCheck size={13} aria-hidden="true" />
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* Profile form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Dr. Jane Smith"
                className="
                  w-full px-3.5 py-2.5 rounded-xl
                  border border-border bg-bg
                  text-sm text-ink placeholder:text-ink-muted
                  focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                  transition
                "
              />
            </div>

            {/* Qualification */}
            <div>
              <label
                htmlFor="qualification"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Qualification
              </label>
              <input
                id="qualification"
                name="qualification"
                type="text"
                value={form.qualification ?? ''}
                onChange={handleChange}
                placeholder="MBBS, MD (Paediatrics)"
                className="
                  w-full px-3.5 py-2.5 rounded-xl
                  border border-border bg-bg
                  text-sm text-ink placeholder:text-ink-muted
                  focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                  transition
                "
              />
            </div>

            {/* Institution */}
            <div>
              <label
                htmlFor="institution"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Institution
              </label>
              <input
                id="institution"
                name="institution"
                type="text"
                value={form.institution ?? ''}
                onChange={handleChange}
                placeholder="All India Institute of Medical Sciences"
                className="
                  w-full px-3.5 py-2.5 rounded-xl
                  border border-border bg-bg
                  text-sm text-ink placeholder:text-ink-muted
                  focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                  transition
                "
              />
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Bio{' '}
                <span className="text-ink-muted font-normal">(optional)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={form.bio ?? ''}
                onChange={handleChange}
                placeholder="Brief professional bio shown on your published chapters…"
                className="
                  w-full px-3.5 py-2.5 rounded-xl
                  border border-border bg-bg
                  text-sm text-ink placeholder:text-ink-muted
                  resize-y min-h-[96px]
                  focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                  transition
                "
              />
            </div>

            {/* ORCID */}
            <div>
              <label
                htmlFor="orcid"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                ORCID iD{' '}
                <span className="text-ink-muted font-normal">(optional)</span>
              </label>
              <input
                id="orcid"
                name="orcid"
                type="text"
                value={form.orcid ?? ''}
                onChange={handleChange}
                placeholder="0000-0000-0000-0000"
                className="
                  w-full px-3.5 py-2.5 rounded-xl
                  border border-border bg-bg
                  text-sm text-ink placeholder:text-ink-muted
                  focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                  transition
                "
              />
            </div>

            {/* API error */}
            {error && (
              <p className="text-sm text-danger" role="alert">
                {error.message}
              </p>
            )}

            {/* Success banner */}
            {isSuccess && (
              <div
                className="
                  flex items-center gap-2
                  bg-green-50 border border-green-200
                  rounded-xl px-4 py-3
                  text-sm font-medium text-success
                  animate-fadeSlideIn
                "
                role="status"
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                Profile updated successfully.
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="
                  flex items-center gap-2
                  px-5 py-2.5 rounded-xl
                  bg-primary text-white text-sm font-semibold
                  hover:bg-primary-light
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
