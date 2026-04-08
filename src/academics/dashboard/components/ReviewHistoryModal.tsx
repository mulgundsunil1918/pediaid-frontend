// =============================================================================
// academics/dashboard/components/ReviewHistoryModal.tsx
//
// Renders the full moderation timeline for a single chapter — every approve,
// reject, request_changes, and archive entry, oldest first, with moderator
// name and notes. Used from:
//   • ReviewFeedbackModal (author dashboard, via the "View full history" link)
//   • EditorPage feedback banner (author editor)
//
// Data source: useChapterReviews(chapterId) which hits
// GET /api/academics/chapters/:id/reviews.
// =============================================================================

import {
  X,
  History,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Archive,
  Loader2,
} from 'lucide-react';
import { useChapterReviews } from '../../editor/hooks/useChapterEditor';
import type { ChapterReviewLogEntry, ReviewAction } from '../../types';

interface ReviewHistoryModalProps {
  chapterId: string;
  chapterTitle?: string;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Action theming
// ---------------------------------------------------------------------------

const ACTION_THEMES: Record<
  ReviewAction,
  {
    label: string;
    Icon: typeof CheckCircle2;
    accent: string;
    dotBg: string;
    dotRing: string;
  }
> = {
  approved: {
    label: 'Approved',
    Icon: CheckCircle2,
    accent: 'text-success',
    dotBg: 'bg-green-50',
    dotRing: 'ring-green-200',
  },
  rejected: {
    label: 'Rejected',
    Icon: XCircle,
    accent: 'text-danger',
    dotBg: 'bg-red-50',
    dotRing: 'ring-red-200',
  },
  request_changes: {
    label: 'Changes requested',
    Icon: RotateCcw,
    accent: 'text-orange-600',
    dotBg: 'bg-orange-50',
    dotRing: 'ring-orange-200',
  },
  archived: {
    label: 'Archived',
    Icon: Archive,
    accent: 'text-gray-500',
    dotBg: 'bg-gray-100',
    dotRing: 'ring-gray-200',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

function TimelineEntry({
  entry,
  isLast,
}: {
  entry: ChapterReviewLogEntry;
  isLast: boolean;
}) {
  const theme = ACTION_THEMES[entry.action];
  const { Icon } = theme;

  return (
    <li className="relative pl-10 pb-6 last:pb-0">
      {/* Vertical connector */}
      {!isLast && (
        <span
          className="absolute left-[15px] top-8 bottom-0 w-px bg-border"
          aria-hidden="true"
        />
      )}

      {/* Icon dot */}
      <span
        className={`
          absolute left-0 top-0
          flex items-center justify-center
          w-8 h-8 rounded-full
          ${theme.dotBg} ring-2 ${theme.dotRing}
        `}
      >
        <Icon size={15} className={theme.accent} aria-hidden="true" />
      </span>

      {/* Body */}
      <div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className={`text-sm font-semibold ${theme.accent}`}>
            {theme.label}
          </p>
          <p className="text-xs text-ink-muted">
            by{' '}
            <span className="font-medium text-ink">
              {entry.moderatorName}
            </span>
            {entry.moderatorRole ? ` · ${entry.moderatorRole}` : ''}
          </p>
        </div>
        <p className="text-xs text-ink-muted mt-0.5">
          {formatDate(entry.performedAt)}
        </p>

        {entry.notes && entry.notes.trim() !== '' && (
          <blockquote
            className="
              mt-2 border-l-2 border-border
              bg-gray-50 rounded-r-md
              px-3 py-2
              text-sm text-ink leading-relaxed whitespace-pre-wrap
            "
          >
            {entry.notes}
          </blockquote>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function ReviewHistoryModal({
  chapterId,
  chapterTitle,
  onClose,
}: ReviewHistoryModalProps) {
  const { data: entries = [], isLoading, isError, error } =
    useChapterReviews(chapterId);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div
      className="
        fixed inset-0 z-[60]
        bg-black/50 backdrop-blur-sm
        flex items-center justify-center
        px-4 animate-fadeIn
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-history-title"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="
          bg-card rounded-card shadow-card-hover
          w-full max-w-lg
          overflow-hidden
          animate-fadeSlideIn
          flex flex-col
          max-h-[85vh]
        "
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-gray-50 border-b border-border px-5 py-4 shrink-0">
          <History size={20} className="text-primary shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <h2
              id="review-history-title"
              className="text-base font-semibold text-primary leading-snug"
            >
              Review History
            </h2>
            {chapterTitle && (
              <p className="text-xs text-ink-muted truncate">{chapterTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="
              p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100
              transition-colors
            "
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-ink-muted text-sm">
              <Loader2 size={16} className="animate-spin mr-2" />
              Loading review history…
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {error instanceof Error
                ? error.message
                : 'Failed to load review history.'}
            </div>
          )}

          {!isLoading && !isError && entries.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-8">
              No review actions have been recorded for this chapter yet.
            </p>
          )}

          {!isLoading && !isError && entries.length > 0 && (
            <ol className="list-none p-0 m-0">
              {entries.map((entry, idx) => (
                <TimelineEntry
                  key={entry.id}
                  entry={entry}
                  isLast={idx === entries.length - 1}
                />
              ))}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-border bg-bg shrink-0">
          <button
            onClick={onClose}
            className="
              px-4 py-2 text-sm font-medium rounded-xl
              text-ink hover:bg-gray-100
              border border-border
              transition-colors
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
