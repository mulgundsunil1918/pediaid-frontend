// =============================================================================
// academics/dashboard/components/ReviewFeedbackModal.tsx
//
// Shows moderator feedback to the author for a chapter that was either
// rejected outright or sent back with "Request Changes". The modal's
// colour scheme, header icon, and copy adapt to the chapter status so the
// same component handles both flows with one look-and-feel.
//
// This file replaces the old RejectionFeedbackModal. A re-export named
// `RejectionFeedbackModal` is kept at the bottom for backwards compatibility
// with any remaining import sites during the migration.
// =============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XCircle,
  AlertCircle,
  X,
  Pencil,
  History,
} from 'lucide-react';
import type { MyChapter } from '../hooks/useDashboard';
import { ReviewHistoryModal } from './ReviewHistoryModal';

interface ReviewFeedbackModalProps {
  chapter: MyChapter;
  onClose: () => void;
  onEdit: () => void;
}

// ---------------------------------------------------------------------------
// Theme configuration per status
// ---------------------------------------------------------------------------

type Theme = {
  headerBg: string;
  headerBorder: string;
  titleColor: string;
  closeHover: string;
  closeColor: string;
  blockBorder: string;
  blockBg: string;
  title: string;
  bodyIntro: string;
  Icon: typeof XCircle;
};

const REJECTED_THEME: Theme = {
  headerBg: 'bg-red-50',
  headerBorder: 'border-red-100',
  titleColor: 'text-danger',
  closeHover: 'hover:bg-red-100 hover:text-danger',
  closeColor: 'text-red-400',
  blockBorder: 'border-danger/40',
  blockBg: 'bg-red-50',
  title: 'Chapter Rejected',
  bodyIntro:
    'The reviewer has rejected this chapter. Review the feedback below and start a new revision if you wish to continue.',
  Icon: XCircle,
};

const CHANGES_THEME: Theme = {
  headerBg: 'bg-orange-50',
  headerBorder: 'border-orange-100',
  titleColor: 'text-orange-600',
  closeHover: 'hover:bg-orange-100 hover:text-orange-600',
  closeColor: 'text-orange-400',
  blockBorder: 'border-orange-400/40',
  blockBg: 'bg-orange-50',
  title: 'Changes Requested',
  bodyIntro:
    'The reviewer has asked for revisions on this chapter. Read the feedback below, edit the chapter, and resubmit for review.',
  Icon: AlertCircle,
};

function themeForStatus(status: MyChapter['status']): Theme {
  if (status === 'rejected') return REJECTED_THEME;
  // Default to the "changes requested" theme for changes_requested and for
  // any other status that might get routed here in the future.
  return CHANGES_THEME;
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function ReviewFeedbackModal({
  chapter,
  onClose,
  onEdit,
}: ReviewFeedbackModalProps) {
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const theme = themeForStatus(chapter.status);
  const { Icon } = theme;

  function handleEdit() {
    onEdit();
    navigate(`/academics/editor/${chapter.id}`);
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <>
      <div
        className="
          fixed inset-0 z-50
          bg-black/50 backdrop-blur-sm
          flex items-center justify-center
          px-4 animate-fadeIn
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-feedback-title"
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
          "
        >
          {/* Header */}
          <div
            className={`flex items-center gap-3 ${theme.headerBg} border-b ${theme.headerBorder} px-5 py-4`}
          >
            <Icon
              size={22}
              className={`${theme.titleColor} shrink-0`}
              aria-hidden="true"
            />
            <h2
              id="review-feedback-title"
              className={`flex-1 text-base font-semibold ${theme.titleColor}`}
            >
              {theme.title}
            </h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-lg ${theme.closeColor} ${theme.closeHover} transition-colors`}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-4">
            {/* Chapter title */}
            <div>
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
                Chapter
              </p>
              <p className="text-base font-semibold text-ink leading-snug">
                {chapter.title}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">
                {chapter.subjectCode} · {chapter.systemName} · {chapter.topicName}
              </p>
            </div>

            {/* Intro copy */}
            <p className="text-sm text-ink-muted leading-relaxed">
              {theme.bodyIntro}
            </p>

            {/* Moderator notes */}
            <div>
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                Reviewer Feedback
              </p>
              {chapter.moderatorNotes ? (
                <blockquote
                  className={`
                    border-l-4 ${theme.blockBorder}
                    ${theme.blockBg} rounded-r-lg
                    px-4 py-3
                    text-sm text-ink leading-relaxed
                    italic
                  `}
                >
                  {chapter.moderatorNotes}
                </blockquote>
              ) : (
                <p className="text-sm text-ink-muted italic">
                  No specific notes were provided by the reviewer.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border bg-bg">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="
                flex items-center gap-1.5
                px-3 py-2 text-xs font-medium rounded-xl
                text-ink-muted hover:text-ink hover:bg-gray-100
                transition-colors
              "
            >
              <History size={13} />
              View full history
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="
                  px-4 py-2 text-sm font-medium rounded-xl
                  text-ink hover:bg-gray-100
                  border border-border
                  transition-colors
                "
              >
                Dismiss
              </button>
              <button
                onClick={handleEdit}
                className="
                  flex items-center gap-2
                  px-4 py-2 text-sm font-medium rounded-xl
                  bg-primary text-white
                  hover:bg-primary-light
                  transition-colors
                "
              >
                <Pencil size={15} />
                Edit Chapter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nested review-history modal */}
      {showHistory && (
        <ReviewHistoryModal
          chapterId={chapter.id}
          chapterTitle={chapter.title}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Backwards-compatible alias
// ---------------------------------------------------------------------------

/** @deprecated Use `ReviewFeedbackModal` — kept for existing import sites. */
export const RejectionFeedbackModal = ReviewFeedbackModal;
