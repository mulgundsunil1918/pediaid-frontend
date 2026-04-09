// =============================================================================
// moderation/ReviewPage.tsx — /academics/moderator/review/:id
//
// Full-page chapter review. The moderator sees:
//   • a sticky top bar with three action buttons (Approve / Request Changes
//     / Reject) that perform the action directly, with a confirmation step
//     and a required-notes textarea for the two destructive flows
//   • the complete chapter content — title, author, abstract, all blocks,
//     references — rendered below the action bar
//
// Each action hits the existing backend endpoint and, on success, shows a
// toast then redirects back to /academics/dashboard per the spec.
//
// The moderator review endpoint GET /chapters/id/:id returns a FLAT response
// (topicName/subjectCode as top-level strings, content as a plain block
// array, author.name instead of author.fullName). Using the reader-shaped
// ReaderChapter type here was the source of the previous "blank page" bug
// — accessing chapter.content.blocks (undefined) crashed rendering. This
// page uses ModeratorReviewChapter, which matches the real backend shape.
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import {
  useParams,
  useNavigate,
  Navigate,
} from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  useChapterForReview,
  useApproveChapter,
  useRejectChapter,
  useRequestChanges,
} from './hooks/useModeration';
import { ChapterRenderer } from '../reader/components/ChapterRenderer';
import { useAuthStore } from '../../store/authStore';
import type { ApiBlock, ChapterReference } from '../editor/types/editor.types';

// ---------------------------------------------------------------------------
// Loading / error states
// ---------------------------------------------------------------------------

function ReviewSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse space-y-4 p-8">
      <div className="h-10 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
      <div className="h-4 bg-gray-100 rounded" />
      <div className="h-4 bg-gray-100 rounded w-5/6" />
      <div className="h-4 bg-gray-100 rounded" />
      <div className="h-4 bg-gray-100 rounded w-4/6" />
      <div className="h-4 bg-gray-100 rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success toast
// ---------------------------------------------------------------------------

function SuccessToast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="
        fixed top-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3
        bg-green-600 text-white
        px-5 py-3 rounded-xl shadow-2xl
        animate-fadeSlideIn
      "
    >
      <CheckCircle2 size={18} aria-hidden="true" />
      <p className="text-sm font-semibold">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reject modal — type "REJECT" to confirm (irreversible action)
// ---------------------------------------------------------------------------

function RejectModal({
  notes,
  onConfirm,
  onCancel,
  isPending,
  error,
}: {
  notes: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string;
}) {
  const [typed, setTyped] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-danger px-6 py-4">
          <h2
            id="reject-modal-title"
            className="font-bold text-white text-lg flex items-center gap-2"
          >
            <XCircle size={20} /> Reject Chapter
          </h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-danger">
            <p className="font-semibold mb-1">This cannot be undone.</p>
            <p className="text-ink-muted">
              The author will be notified and must create a new chapter from scratch.
            </p>
          </div>
          {!notes.trim() && (
            <p className="text-sm text-danger font-medium">
              ⚠ Please add notes explaining the rejection before confirming.
            </p>
          )}
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">
              Type{' '}
              <span className="font-mono bg-gray-100 px-1 rounded">REJECT</span>{' '}
              to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm
                         outline-none focus:border-danger transition-colors"
              placeholder="REJECT"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
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
            onClick={onConfirm}
            disabled={typed !== 'REJECT' || !notes.trim() || isPending}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-danger
                       disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isPending ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReviewPage
// ---------------------------------------------------------------------------

export function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);

  // Guard: only moderators and admins may access this page
  if (!hasRole('moderator', 'admin')) {
    return <Navigate to="/academics" replace />;
  }

  const { data: chapter, isLoading, isError, error } = useChapterForReview(id);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const approveMutation = useApproveChapter();
  const rejectMutation = useRejectChapter();
  const changesMutation = useRequestChanges();

  const isSubmitting =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    changesMutation.isPending;

  // Redirect back to the dashboard 1.5 s after any successful action
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => {
      navigate('/academics/dashboard');
    }, 1500);
    return () => clearTimeout(t);
  }, [successMessage, navigate]);

  function requireNotes(): boolean {
    if (!notes.trim()) {
      setNotesError('Notes are required for this action.');
      notesRef.current?.focus();
      notesRef.current?.classList.add('ring-2', 'ring-danger');
      setTimeout(
        () => notesRef.current?.classList.remove('ring-2', 'ring-danger'),
        1500,
      );
      return false;
    }
    setNotesError('');
    return true;
  }

  async function handleApprove() {
    if (!chapter) return;
    setActionError('');
    try {
      await approveMutation.mutateAsync({ id: chapter.id, notes });
      setSuccessMessage('Chapter approved and published.');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Approval failed. Please retry.',
      );
    }
  }

  async function handleRequestChanges() {
    if (!chapter) return;
    if (!requireNotes()) return;
    setActionError('');
    try {
      await changesMutation.mutateAsync({ id: chapter.id, notes });
      setSuccessMessage('Changes requested. Author has been notified.');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Action failed. Please retry.',
      );
    }
  }

  async function handleReject() {
    if (!chapter) return;
    if (!requireNotes()) return;
    setShowRejectModal(true);
  }

  async function handleConfirmReject() {
    if (!chapter) return;
    setActionError('');
    try {
      await rejectMutation.mutateAsync({ id: chapter.id, notes });
      setShowRejectModal(false);
      setSuccessMessage('Chapter rejected. Author has been notified.');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Rejection failed. Please retry.',
      );
      setShowRejectModal(false);
    }
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (isError) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3 px-4">
        <AlertTriangle size={32} className="text-danger" aria-hidden="true" />
        <p className="text-lg font-bold text-ink">Failed to load chapter</p>
        <p className="text-sm text-ink-muted text-center max-w-md">
          {error instanceof Error
            ? error.message
            : 'The moderator review endpoint returned an error.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/academics/dashboard')}
          className="
            mt-3 inline-flex items-center gap-1.5
            px-4 py-2 rounded-xl text-sm font-semibold
            text-white
          "
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Loaded state
  // -------------------------------------------------------------------------

  // The backend returns chapter.content as a raw block array; cast once.
  const blocks: ApiBlock[] = Array.isArray(chapter?.content)
    ? ((chapter?.content as unknown) as ApiBlock[])
    : [];
  const references: ChapterReference[] = Array.isArray(chapter?.references)
    ? ((chapter?.references as unknown) as ChapterReference[])
    : [];

  return (
    <div className="min-h-screen bg-bg">
      {/* --------------------------------------------------------------- */}
      {/* Sticky top bar: back button + three action buttons                */}
      {/* --------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-white border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/academics/dashboard')}
            className="p-2 rounded-xl hover:bg-gray-100 text-ink-muted transition-colors shrink-0"
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Moderator Review
            </p>
            <p className="text-sm font-semibold text-primary truncate">
              {isLoading ? 'Loading…' : chapter?.title}
            </p>
          </div>

          {/* Three action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={handleApprove}
              disabled={isLoading || isSubmitting || !chapter}
              className="
                inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl
                text-xs sm:text-sm font-semibold text-white transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              style={{ backgroundColor: '#38a169' }}
            >
              {approveMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 size={14} aria-hidden="true" />
              )}
              Approve
            </button>

            <button
              type="button"
              onClick={handleRequestChanges}
              disabled={isLoading || isSubmitting || !chapter}
              className="
                inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl
                text-xs sm:text-sm font-semibold text-white transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              style={{ backgroundColor: '#d69e2e' }}
            >
              {changesMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <RotateCcw size={14} aria-hidden="true" />
              )}
              Request Changes
            </button>

            <button
              type="button"
              onClick={handleReject}
              disabled={isLoading || isSubmitting || !chapter}
              className="
                inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl
                text-xs sm:text-sm font-semibold text-white bg-danger transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <XCircle size={14} aria-hidden="true" />
              Reject
            </button>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------- */}
      {/* Action error banner                                               */}
      {/* --------------------------------------------------------------- */}
      {actionError && (
        <div className="max-w-4xl mx-auto mt-4 px-4 sm:px-6">
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50">
            <AlertTriangle size={15} className="text-danger shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-danger">{actionError}</p>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* Reviewer notes textarea (shared by Reject + Request Changes)       */}
      {/* --------------------------------------------------------------- */}
      {chapter && !successMessage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-5">
          <label
            htmlFor="mod-notes"
            className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5"
          >
            Notes for author
            <span className="ml-1 font-normal text-ink-muted/70 normal-case">
              (required for Request Changes and Reject)
            </span>
          </label>
          <textarea
            id="mod-notes"
            ref={notesRef}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value.slice(0, 2000));
              setNotesError('');
            }}
            rows={4}
            placeholder="Explain what needs to change, or why the chapter is being rejected…"
            className="
              w-full text-sm text-ink
              border border-border rounded-xl px-4 py-3
              outline-none focus:border-accent
              resize-y transition-colors
            "
          />
          <div className="flex justify-between mt-1">
            {notesError ? (
              <p className="text-xs text-danger">{notesError}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-ink-muted">{notes.length}/2000</span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* Chapter content                                                   */}
      {/* --------------------------------------------------------------- */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {isLoading && <ReviewSkeleton />}

        {!isLoading && chapter && (
          <article>
            <h1 className="text-3xl font-bold text-primary leading-snug mb-2">
              {chapter.title}
            </h1>
            <p className="text-sm text-ink-muted mb-1">
              By{' '}
              <span className="font-medium text-ink">
                {[chapter.author.name, chapter.author.qualification]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </p>
            {chapter.author.institution && (
              <p className="text-xs text-ink-muted">
                {chapter.author.institution}
              </p>
            )}
            <p className="text-xs text-ink-muted mt-1 mb-6">
              {chapter.subjectCode} · {chapter.systemName} · {chapter.topicName}
            </p>

            {chapter.abstract && (
              <div className="bg-gray-50 rounded-xl px-5 py-4 mb-8 border border-border">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                  Abstract
                </p>
                <p className="text-sm leading-relaxed text-ink">
                  {chapter.abstract}
                </p>
              </div>
            )}

            <div className="prose-reading">
              <ChapterRenderer blocks={blocks} references={references} />
            </div>

            {references.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border">
                <h2 className="text-base font-bold text-ink mb-3">References</h2>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-ink leading-relaxed">
                  {references.map((ref, idx) => (
                    <li key={idx}>{(ref as { title?: string }).title ?? ''}</li>
                  ))}
                </ol>
              </div>
            )}
          </article>
        )}
      </main>

      {/* --------------------------------------------------------------- */}
      {/* Reject modal                                                      */}
      {/* --------------------------------------------------------------- */}
      {showRejectModal && (
        <RejectModal
          notes={notes}
          onConfirm={handleConfirmReject}
          onCancel={() => setShowRejectModal(false)}
          isPending={rejectMutation.isPending}
          error={actionError}
        />
      )}

      {/* --------------------------------------------------------------- */}
      {/* Success toast (shown briefly before redirect)                     */}
      {/* --------------------------------------------------------------- */}
      {successMessage && <SuccessToast message={successMessage} />}
    </div>
  );
}
