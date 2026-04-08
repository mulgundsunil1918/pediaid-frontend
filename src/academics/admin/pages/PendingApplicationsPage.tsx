// =============================================================================
// academics/admin/pages/PendingApplicationsPage.tsx
//
// Admin-only screen for reviewing visitors who applied as Author or Moderator
// on the landing page. For each applicant the admin sees credentials, the
// bio, and the "why do you want to join" reason collected at registration —
// everything they need to make a decision.
//
// Actions:
//   • Approve  → PUT /admin/users/:id/approve-role (backend promotes role +
//                sends the applicant a branded welcome email)
//   • Reject   → PUT /admin/users/:id/reject-role (demotes to 'reader';
//                the account still exists for browsing)
//
// Sidebar badge on AdminLayout shows the count of pending applications.
// =============================================================================

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  UserPlus,
  Check,
  X,
  PencilLine,
  Scale,
  Clock,
  Loader2,
  Inbox,
  Building2,
  GraduationCap,
  Stethoscope,
  Mail,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { AdminLayout } from '../AdminLayout';
import {
  useAdminPendingApplicants,
  useApprovePendingApplicant,
  useRejectPendingApplicant,
  type PendingApplicant,
} from '../hooks/useAdmin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

function RoleBadge({ role }: { role: PendingApplicant['role'] }) {
  if (role === 'pending_moderator') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
        <Scale size={11} aria-hidden="true" />
        Moderator applicant
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
      <PencilLine size={11} aria-hidden="true" />
      Author applicant
    </span>
  );
}

// ---------------------------------------------------------------------------
// Applicant card
// ---------------------------------------------------------------------------

interface ApplicantCardProps {
  applicant: PendingApplicant;
}

function ApplicantCard({ applicant }: ApplicantCardProps) {
  const approveMutation = useApprovePendingApplicant();
  const rejectMutation = useRejectPendingApplicant();
  const [confirm, setConfirm] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState('');

  const isSubmitting =
    approveMutation.isPending || rejectMutation.isPending;

  const targetRole: 'author' | 'moderator' =
    applicant.role === 'pending_moderator' ? 'moderator' : 'author';

  async function handleApprove() {
    setError('');
    try {
      await approveMutation.mutateAsync({
        id: applicant.id,
        role: targetRole,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed.');
    }
  }

  async function handleReject() {
    setError('');
    try {
      await rejectMutation.mutateAsync(applicant.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed.');
    }
  }

  const age = daysAgo(applicant.submittedAt);
  const ageLabel =
    age === 0 ? 'today' : age === 1 ? '1 day ago' : `${age} days ago`;

  return (
    <article className="bg-white rounded-2xl shadow-card border border-border p-6">
      {/* Header: initials + name + role badge */}
      <div className="flex flex-wrap items-start gap-4 mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-lg"
          style={{ backgroundColor: '#1e3a5f' }}
          aria-hidden="true"
        >
          {getInitials(applicant.fullName)}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-bold text-lg text-ink leading-tight">
            {applicant.fullName ?? applicant.email}
          </h3>
          <p className="flex items-center gap-1 text-xs text-ink-muted mt-0.5">
            <Mail size={11} aria-hidden="true" />
            {applicant.email}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <RoleBadge role={applicant.role} />
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <Clock size={11} aria-hidden="true" />
              Submitted {formatDate(applicant.submittedAt)} ({ageLabel})
            </span>
          </div>
        </div>
      </div>

      {/* Credentials grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-border px-4 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-muted uppercase tracking-wide mb-1">
            <GraduationCap size={11} aria-hidden="true" />
            Qualification
          </p>
          <p className="text-sm text-ink leading-snug">
            {applicant.qualification ?? <span className="italic text-ink-muted">Not provided</span>}
          </p>
        </div>
        <div className="rounded-xl border border-border px-4 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-muted uppercase tracking-wide mb-1">
            <Stethoscope size={11} aria-hidden="true" />
            Specialty
          </p>
          <p className="text-sm text-ink leading-snug">
            {applicant.specialty ?? <span className="italic text-ink-muted">Not provided</span>}
          </p>
        </div>
        <div className="rounded-xl border border-border px-4 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-muted uppercase tracking-wide mb-1">
            <Building2 size={11} aria-hidden="true" />
            Institution
          </p>
          <p className="text-sm text-ink leading-snug">
            {applicant.institution ?? <span className="italic text-ink-muted">Not provided</span>}
          </p>
        </div>
      </div>

      {/* Bio */}
      {applicant.bio && applicant.bio.trim() !== '' && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
            Bio
          </p>
          <blockquote className="border-l-4 border-blue-200 bg-blue-50/40 rounded-r-lg px-4 py-3 text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {applicant.bio}
          </blockquote>
        </div>
      )}

      {/* Reason to join */}
      {applicant.registrationReason && applicant.registrationReason.trim() !== '' && (
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
            Why they want to join
          </p>
          <blockquote className="border-l-4 border-amber-200 bg-amber-50/60 rounded-r-lg px-4 py-3 text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {applicant.registrationReason}
          </blockquote>
        </div>
      )}

      {/* Action error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
        {confirm === 'approve' ? (
          <div className="w-full rounded-xl border border-green-200 bg-green-50 p-3 space-y-2">
            <p className="text-sm text-ink">
              Approve <strong>{applicant.fullName ?? applicant.email}</strong> as{' '}
              <strong>{targetRole}</strong>? They'll receive a welcome email.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold text-white rounded-xl bg-success disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin" />
                    Approving…
                  </span>
                ) : (
                  'Confirm Approve'
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={isSubmitting}
                className="px-3 py-2 text-sm text-ink-muted rounded-xl hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : confirm === 'reject' ? (
          <div className="w-full rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
            <p className="text-sm text-ink">
              Reject this application? The account will be demoted to{' '}
              <strong>reader</strong> — they can still browse but will no longer
              be an applicant.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold text-white rounded-xl bg-danger disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin" />
                    Rejecting…
                  </span>
                ) : (
                  'Confirm Reject'
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={isSubmitting}
                className="px-3 py-2 text-sm text-ink-muted rounded-xl hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setConfirm('approve')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                         text-sm font-semibold text-white transition-colors
                         disabled:opacity-50"
              style={{ backgroundColor: '#38a169' }}
            >
              <Check size={14} aria-hidden="true" />
              Approve as {targetRole}
            </button>
            <button
              type="button"
              onClick={() => setConfirm('reject')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                         text-sm font-semibold text-danger border border-red-200
                         hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <X size={14} aria-hidden="true" />
              Reject
            </button>
          </>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function PendingApplicationsPage() {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('admin')) {
    return <Navigate to="/academics" replace />;
  }

  const { data: applicants, isLoading, isError, error } =
    useAdminPendingApplicants();

  const list = applicants ?? [];
  const authorCount = list.filter((a) => a.role === 'pending_author').length;
  const moderatorCount = list.filter(
    (a) => a.role === 'pending_moderator',
  ).length;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <UserPlus size={22} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl text-ink leading-tight">
                Pending Applications
              </h1>
              <p className="text-sm text-ink-muted mt-0.5">
                Review visitors who applied for Author or Moderator access.
              </p>
            </div>
          </div>

          {/* Counts pill row */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
              <PencilLine size={12} aria-hidden="true" />
              Authors: <strong>{authorCount}</strong>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-100">
              <Scale size={12} aria-hidden="true" />
              Moderators: <strong>{moderatorCount}</strong>
            </span>
          </div>
        </header>

        {/* States */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-ink-muted text-sm">
            <Loader2 size={18} className="animate-spin mr-2" />
            Loading applicants…
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger">
            {error instanceof Error
              ? error.message
              : 'Failed to load pending applications.'}
          </div>
        )}

        {!isLoading && !isError && list.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card border border-border py-16 px-6 text-center">
            <Inbox
              size={48}
              className="mx-auto text-ink-muted mb-4"
              aria-hidden="true"
            />
            <p className="text-ink font-semibold text-lg mb-1">
              No applications waiting
            </p>
            <p className="text-sm text-ink-muted max-w-sm mx-auto">
              When someone applies to join as an Author or Moderator from the
              landing page, they'll appear here for your review.
            </p>
          </div>
        )}

        {/* Applicant cards */}
        {!isLoading && !isError && list.length > 0 && (
          <div className="space-y-4">
            {list.map((applicant) => (
              <ApplicantCard key={applicant.id} applicant={applicant} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
