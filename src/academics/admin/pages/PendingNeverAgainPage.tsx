// =============================================================================
// academics/admin/pages/PendingNeverAgainPage.tsx
//
// Admin-only moderation queue for anonymous "Never Again" posts. Posts have
// no account attached (device_id only) and stay anonymous to every other
// user forever — but a submitter can optionally leave a contact email that
// only the admin ever sees, so there's a real way to reach them if a post
// needs a revision rather than an outright reject. The submitting device
// also always checks its own status via GET /never-again/mine regardless
// of whether an email was left. Otherwise this mirrors PendingCmeEventsPage.tsx.
// =============================================================================

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Check,
  X,
  Clock,
  Inbox,
  Loader2,
  ShieldAlert,
  Mail,
  MessageSquareWarning,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { AdminLayout } from '../AdminLayout';
import {
  useAdminPendingNeverAgainPosts,
  useApproveNeverAgainPost,
  useRejectNeverAgainPost,
  useRequestNeverAgainChanges,
  type PendingNeverAgainPost,
} from '../hooks/useAdmin';

function daysAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

// ---------------------------------------------------------------------------
// Reject modal
// ---------------------------------------------------------------------------

function RejectModal({
  onCancel,
  onConfirm,
  isPending,
  hasEmail,
}: {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
  hasEmail: boolean;
}) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-na-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-danger px-6 py-4">
          <h2
            id="reject-na-modal-title"
            className="font-bold text-white text-lg flex items-center gap-2"
          >
            <X size={20} /> Reject post
          </h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-ink leading-relaxed">
            This post stays hidden from the public feed.{' '}
            {hasEmail
              ? "We'll email the submitter this reason."
              : "The reason is stored for your own records only — this submitter didn't leave a contact email."}
          </p>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Reason (required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 1000))}
              rows={4}
              placeholder="e.g. Identifies a specific hospital/patient — too identifiable to publish."
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-danger transition-colors resize-y"
              autoFocus
            />
            <p className="text-xs text-ink-muted mt-1">
              {reason.length}/1000 — minimum 5 characters
            </p>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-ink border border-border rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={!valid || isPending}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-danger disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isPending ? 'Rejecting…' : 'Confirm reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Request changes modal
// ---------------------------------------------------------------------------

function ChangesModal({
  onCancel,
  onConfirm,
  isPending,
  hasEmail,
}: {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
  hasEmail: boolean;
}) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="changes-na-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div style={{ backgroundColor: '#d69e2e' }} className="px-6 py-4">
          <h2
            id="changes-na-modal-title"
            className="font-bold text-white text-lg flex items-center gap-2"
          >
            <MessageSquareWarning size={20} /> Request changes
          </h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-ink leading-relaxed">
            The post goes back to a "needs changes" state instead of being
            rejected outright.{' '}
            {hasEmail
              ? "We'll email the submitter exactly what to fix — they can share a revised version any time."
              : "This submitter didn't leave a contact email, so the only way they'll see this is by checking \"My Submissions\" in the app."}
          </p>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              What needs to change? (required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 1000))}
              rows={4}
              placeholder="e.g. Remove the ward name in paragraph 2, otherwise this is good to publish."
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-500 transition-colors resize-y"
              autoFocus
            />
            <p className="text-xs text-ink-muted mt-1">
              {reason.length}/1000 — minimum 5 characters
            </p>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-ink border border-border rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={!valid || isPending}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: '#d69e2e' }}
          >
            {isPending ? 'Sending…' : 'Send back for changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Post card
// ---------------------------------------------------------------------------

function PendingPostCard({ post }: { post: PendingNeverAgainPost }) {
  const approveMutation = useApproveNeverAgainPost();
  const rejectMutation = useRejectNeverAgainPost();
  const changesMutation = useRequestNeverAgainChanges();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [error, setError] = useState('');

  const hasEmail = Boolean(post.submitter_email);
  const isSubmitting =
    approveMutation.isPending || rejectMutation.isPending || changesMutation.isPending;

  async function handleApprove() {
    setError('');
    try {
      await approveMutation.mutateAsync(post.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed.');
    }
  }

  async function handleReject(reason: string) {
    setError('');
    try {
      await rejectMutation.mutateAsync({ id: post.id, reason });
      setRejectOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed.');
    }
  }

  async function handleRequestChanges(reason: string) {
    setError('');
    try {
      await changesMutation.mutateAsync({ id: post.id, reason });
      setChangesOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request changes failed.');
    }
  }

  return (
    <article className="bg-white rounded-2xl shadow-card border border-border overflow-hidden p-6">
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-800">
          {post.category}
        </span>
        {post.role && (
          <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-[10px] font-semibold uppercase text-ink-muted">
            {post.role}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
          <Clock size={10} /> Submitted {daysAgo(post.created_at)}
        </span>
        {hasEmail && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-accent"
            title={`${post.submitter_email} — private, only visible to admins, never shown publicly`}
          >
            <Mail size={10} /> {post.submitter_email}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase mb-1">
            What happened
          </p>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {post.what_happened}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase mb-1">
            What went wrong
          </p>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {post.what_went_wrong}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase mb-1">
            The lesson
          </p>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {post.the_lesson}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#38a169' }}
        >
          {approveMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          Approve
        </button>
        <button
          type="button"
          onClick={() => setChangesOpen(true)}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50"
          style={{ color: '#b45309', borderColor: '#fbd38d', backgroundColor: '#fffaf0' }}
        >
          <MessageSquareWarning size={14} />
          Request changes
        </button>
        <button
          type="button"
          onClick={() => setRejectOpen(true)}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-danger border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <X size={14} />
          Reject
        </button>
      </div>

      {rejectOpen && (
        <RejectModal
          onCancel={() => setRejectOpen(false)}
          onConfirm={handleReject}
          isPending={rejectMutation.isPending}
          hasEmail={hasEmail}
        />
      )}

      {changesOpen && (
        <ChangesModal
          onCancel={() => setChangesOpen(false)}
          onConfirm={handleRequestChanges}
          isPending={changesMutation.isPending}
          hasEmail={hasEmail}
        />
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function PendingNeverAgainPage() {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('admin')) {
    return <Navigate to={`/academics/login?next=${encodeURIComponent(window.location.pathname)}`} replace />;
  }

  const { data, isLoading, isError, error } = useAdminPendingNeverAgainPosts();
  const posts = data ?? [];

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <ShieldAlert size={22} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl text-ink leading-tight">
                Pending Never Again posts
              </h1>
              <p className="text-sm text-ink-muted mt-0.5">
                Anonymous clinical-mistake posts awaiting review before they
                go live in the public feed.
              </p>
            </div>
          </div>
        </header>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-ink-muted text-sm">
            <Loader2 size={18} className="animate-spin mr-2" />
            Loading submissions…
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger">
            {error instanceof Error
              ? error.message
              : 'Failed to load pending posts.'}
          </div>
        )}

        {!isLoading && !isError && posts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card border border-border py-16 px-6 text-center">
            <Inbox
              size={48}
              className="mx-auto text-ink-muted mb-4"
              aria-hidden="true"
            />
            <p className="text-ink font-semibold text-lg mb-1">
              No posts waiting
            </p>
            <p className="text-sm text-ink-muted max-w-sm mx-auto">
              When someone shares a Never Again post from the Flutter app,
              it'll appear here for your review.
            </p>
          </div>
        )}

        {!isLoading && !isError && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <PendingPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
