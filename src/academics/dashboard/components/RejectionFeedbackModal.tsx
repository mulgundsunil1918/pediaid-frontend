// =============================================================================
// academics/dashboard/components/RejectionFeedbackModal.tsx
// Modal showing moderator rejection notes for a chapter
// =============================================================================

import { useNavigate } from 'react-router-dom';
import { XCircle, X, Pencil } from 'lucide-react';
import type { MyChapter } from '../hooks/useDashboard';

interface RejectionFeedbackModalProps {
  chapter: MyChapter;
  onClose: () => void;
  onEdit: () => void;
}

export function RejectionFeedbackModal({
  chapter,
  onClose,
  onEdit,
}: RejectionFeedbackModalProps) {
  const navigate = useNavigate();

  function handleEdit() {
    onEdit();
    navigate(`/academics/editor/${chapter.id}`);
  }

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape key
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/50 backdrop-blur-sm
        flex items-center justify-center
        px-4 animate-fadeIn
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="rejection-modal-title"
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
        <div className="flex items-center gap-3 bg-red-50 border-b border-red-100 px-5 py-4">
          <XCircle size={22} className="text-danger shrink-0" aria-hidden="true" />
          <h2
            id="rejection-modal-title"
            className="flex-1 text-base font-semibold text-danger"
          >
            Chapter Rejected
          </h2>
          <button
            onClick={onClose}
            className="
              p-1 rounded-lg text-red-400 hover:text-danger hover:bg-red-100
              transition-colors
            "
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

          {/* Moderator notes */}
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
              Reviewer Feedback
            </p>
            {chapter.moderatorNotes ? (
              <blockquote
                className="
                  border-l-4 border-danger/40
                  bg-red-50 rounded-r-lg
                  px-4 py-3
                  text-sm text-ink leading-relaxed
                  italic
                "
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
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-bg">
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
  );
}
