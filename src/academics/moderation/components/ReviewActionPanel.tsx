// =============================================================================
// moderation/components/ReviewActionPanel.tsx
// =============================================================================

import { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';
import { ReviewChecklist } from './ReviewChecklist';
import { useApproveChapter, useRejectChapter, useRequestChanges } from '../hooks/useModeration';
import { useNavigate } from 'react-router-dom';
import type { ReaderChapter } from '../../reader/hooks/useChapterReader';
import { useChapterReviews } from '../../editor/hooks/useChapterEditor';
import type { ChapterReviewLogEntry, ReviewAction } from '../../types';

interface ReviewActionPanelProps {
  chapter: ReaderChapter;
  queueLength: number;
  nextChapterId?: string;
}

type ConfirmState = 'approve' | 'changes' | 'reject' | null;

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'less than an hour ago';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function hoursMinutes(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ---------------------------------------------------------------------------
// Reject confirmation modal (requires typing "REJECT")
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-danger px-6 py-4">
          <h2 id="reject-modal-title" className="font-bold text-white text-lg flex items-center gap-2">
            <XCircle size={20} /> Reject Chapter Permanently
          </h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-danger">
            <p className="font-semibold mb-1">This cannot be undone.</p>
            <p className="text-ink-muted">The author will be notified and must create a new chapter from scratch.</p>
          </div>
          {!notes.trim() && (
            <p className="text-sm text-danger font-medium">⚠ Please add notes explaining the rejection.</p>
          )}
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">
              Type <span className="font-mono bg-gray-100 px-1 rounded">REJECT</span> to confirm
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
          <button type="button" onClick={onCancel} disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-ink border border-border rounded-xl hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            disabled={typed !== 'REJECT' || !notes.trim() || isPending}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-danger
                       disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
            {isPending ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Previous review rounds (collapsible, shown only if non-empty)
// ---------------------------------------------------------------------------
//
// When a chapter is re-submitted after a rejection or request_changes, the
// moderator needs context from the previous round(s): what was asked for and
// by whom. This panel pulls GET /chapters/:id/reviews and displays a compact
// timeline above the action area.

const ACTION_LABEL: Record<ReviewAction, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  request_changes: 'Changes requested',
  archived: 'Archived',
};

const ACTION_COLOR: Record<ReviewAction, string> = {
  approved: 'text-success',
  rejected: 'text-danger',
  request_changes: 'text-orange-600',
  archived: 'text-gray-500',
};

function formatShort(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function PreviousRoundsPanel({ chapterId }: { chapterId: string }) {
  const { data: entries = [], isLoading } = useChapterReviews(chapterId);
  const [expanded, setExpanded] = useState(true);

  if (isLoading) return null;
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="
          w-full flex items-center justify-between gap-2
          px-4 py-3 text-left
          hover:bg-gray-50 transition-colors
        "
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <History size={14} className="text-ink-muted" />
          Previous review rounds
          <span className="text-xs font-medium text-ink-muted">
            ({entries.length})
          </span>
        </span>
        {expanded ? (
          <ChevronUp size={16} className="text-ink-muted" />
        ) : (
          <ChevronDown size={16} className="text-ink-muted" />
        )}
      </button>

      {expanded && (
        <ol className="list-none m-0 p-0 border-t border-border">
          {entries.map((entry: ChapterReviewLogEntry) => (
            <li
              key={entry.id}
              className="px-4 py-3 border-b last:border-b-0 border-border"
            >
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span
                  className={`text-xs font-semibold ${ACTION_COLOR[entry.action]}`}
                >
                  {ACTION_LABEL[entry.action]}
                </span>
                <span className="text-xs text-ink-muted">
                  by <span className="text-ink">{entry.moderatorName}</span>
                </span>
                <span className="text-xs text-ink-muted ml-auto">
                  {formatShort(entry.performedAt)}
                </span>
              </div>
              {entry.notes && entry.notes.trim() !== '' && (
                <p className="mt-1 text-xs text-ink leading-relaxed whitespace-pre-wrap">
                  {entry.notes}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReviewActionPanel
// ---------------------------------------------------------------------------

export function ReviewActionPanel({ chapter, queueLength, nextChapterId }: ReviewActionPanelProps) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [actionError, setActionError] = useState('');
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const approveMutation = useApproveChapter();
  const rejectMutation = useRejectChapter();
  const changesMutation = useRequestChanges();

  const isSubmitting = approveMutation.isPending || rejectMutation.isPending || changesMutation.isPending;

  function requireNotes(): boolean {
    if (!notes.trim()) {
      setNotesError('Please add notes for the author.');
      notesRef.current?.focus();
      // Shake effect via class toggle
      notesRef.current?.classList.add('ring-2', 'ring-danger');
      setTimeout(() => notesRef.current?.classList.remove('ring-2', 'ring-danger'), 1500);
      return false;
    }
    setNotesError('');
    return true;
  }

  async function executeAction(action: 'approve' | 'reject' | 'changes') {
    setActionError('');
    try {
      if (action === 'approve') await approveMutation.mutateAsync({ id: chapter.id, notes });
      else if (action === 'reject') await rejectMutation.mutateAsync({ id: chapter.id, notes });
      else await changesMutation.mutateAsync({ id: chapter.id, notes });

      setConfirm(null);

      // Navigate to next or queue
      setTimeout(() => {
        if (nextChapterId) {
          navigate(`/academics/moderator/review/${nextChapterId}`);
        } else {
          navigate('/academics/moderator/queue');
        }
      }, 2000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed. Please retry.');
      setConfirm(null);
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'a' || e.key === 'A') setConfirm('approve');
      if (e.key === 'r' || e.key === 'R') { notesRef.current?.focus(); }
      if (e.key === 'x' || e.key === 'X') { if (requireNotes()) setConfirm('reject'); }
      if (e.key === 'Escape') navigate('/academics/moderator/queue');
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [notes]); // eslint-disable-line react-hooks/exhaustive-deps

  const submittedAt = (chapter as unknown as { submittedAt?: string }).submittedAt ?? chapter.publishedAt ?? '';

  return (
    <div className="space-y-5">
      {/* Previous rounds (only if this chapter has prior moderation entries) */}
      <PreviousRoundsPanel chapterId={chapter.id} />

      {/* Meta */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
        <p><span className="text-ink-muted">Author:</span>{' '}
          <span className="font-semibold text-ink">
            {[chapter.author.fullName, chapter.author.qualification].filter(Boolean).join(', ')}
          </span>
        </p>
        {submittedAt && (
          <>
            <p><span className="text-ink-muted">Submitted:</span>{' '}
              <span className="text-ink">{relativeTime(submittedAt)}</span>
            </p>
            <p><span className="text-ink-muted">Time in queue:</span>{' '}
              <span className="text-ink">{hoursMinutes(submittedAt)}</span>
            </p>
          </>
        )}
        <p><span className="text-ink-muted">Version:</span>{' '}
          <span className="text-ink">{chapter.version}</span>
        </p>
        {queueLength > 0 && (
          <p className="text-xs text-ink-muted pt-1 border-t border-border mt-2">
            {queueLength} chapter{queueLength !== 1 ? 's' : ''} remaining in queue
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2"
          htmlFor="mod-notes">
          Notes for Author
        </label>
        <textarea
          id="mod-notes"
          ref={notesRef}
          value={notes}
          onChange={(e) => { setNotes(e.target.value.slice(0, 1000)); setNotesError(''); }}
          placeholder="Optional for approval. Required for reject / request changes."
          rows={4}
          className="w-full text-sm border border-border rounded-xl px-4 py-3
                     outline-none focus:border-accent resize-none transition-colors text-ink"
        />
        <div className="flex justify-between mt-1">
          {notesError ? <p className="text-xs text-danger">{notesError}</p> : <span />}
          <span className="text-xs text-ink-muted">{notes.length}/1000</span>
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="flex gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50">
          <AlertTriangle size={14} className="text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{actionError}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        {/* Approve */}
        {confirm === 'approve' ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 space-y-2">
            <p className="text-sm text-ink">Approve this chapter? It will be immediately published.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => executeAction('approve')} disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold text-white rounded-xl bg-success disabled:opacity-50">
                {isSubmitting ? 'Approving…' : 'Confirm Approve'}
              </button>
              <button type="button" onClick={() => setConfirm(null)}
                className="px-3 py-2 text-sm text-ink-muted rounded-xl hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirm('approve')} disabled={isSubmitting}
            className="w-full flex items-center justify-between px-5 py-3 rounded-xl
                       font-semibold text-sm text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#38a169' }}>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Approve Chapter</span>
            <kbd className="text-xs bg-white/20 px-1.5 py-0.5 rounded font-mono">A</kbd>
          </button>
        )}

        {/* Request Changes */}
        {confirm === 'changes' ? (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 space-y-2">
            <p className="text-sm text-ink">Return to author for revision? The author can edit and resubmit.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => executeAction('changes')} disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-50"
                style={{ backgroundColor: '#d69e2e' }}>
                {isSubmitting ? 'Sending…' : 'Request Changes'}
              </button>
              <button type="button" onClick={() => setConfirm(null)}
                className="px-3 py-2 text-sm text-ink-muted rounded-xl hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button"
            onClick={() => { if (requireNotes()) setConfirm('changes'); }}
            disabled={isSubmitting}
            className="w-full flex items-center justify-between px-5 py-3 rounded-xl
                       font-semibold text-sm text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#d69e2e' }}>
            <span className="flex items-center gap-2"><RotateCcw size={16} /> Request Changes</span>
            <kbd className="text-xs bg-white/20 px-1.5 py-0.5 rounded font-mono">R</kbd>
          </button>
        )}

        {/* Reject */}
        <button type="button"
          onClick={() => { if (requireNotes()) setConfirm('reject'); }}
          disabled={isSubmitting}
          className="w-full flex items-center justify-between px-5 py-3 rounded-xl
                     font-semibold text-sm text-white bg-danger transition-colors
                     disabled:opacity-50">
          <span className="flex items-center gap-2"><XCircle size={16} /> Reject Chapter</span>
          <kbd className="text-xs bg-white/20 px-1.5 py-0.5 rounded font-mono">X</kbd>
        </button>

        <p className="text-xs text-ink-muted/60 text-center">
          Esc — back to queue
        </p>
      </div>

      <hr className="border-border" />

      {/* Checklist */}
      <ReviewChecklist />

      {/* Reject confirmation modal */}
      {confirm === 'reject' && (
        <RejectModal
          notes={notes}
          onConfirm={() => executeAction('reject')}
          onCancel={() => setConfirm(null)}
          isPending={rejectMutation.isPending}
          error={actionError}
        />
      )}
    </div>
  );
}
