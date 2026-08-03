// =============================================================================
// academics/submissions/components/SubmissionActionsMenu.tsx
//
// First 3-dot/kebab menu component in this codebase. Only offers actions
// that have real backing today — "View feedback" (when the backend
// returned adminFeedback) and "View live" (published CME events, which
// carry a real slug; Never Again has no per-post permalink yet, so it
// never shows this item). No edit/withdraw/resubmit — there is no
// self-service API for those on either module today, so adding menu items
// for them would just be dead buttons.
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, MessageSquare, ExternalLink, X } from 'lucide-react';
import type { NormalizedSubmission } from '../types';

interface SubmissionActionsMenuProps {
  submission: NormalizedSubmission;
}

export function SubmissionActionsMenu({ submission }: SubmissionActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const canViewLive = submission.status === 'published' && !!submission.slug;
  const canViewFeedback = !!submission.adminFeedback;

  if (!canViewLive && !canViewFeedback) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Submission actions"
        aria-expanded={open}
        className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-xl shadow-card-hover py-1.5 z-10">
          {canViewLive && (
            <Link
              to={`/academics/cme/${submission.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2 text-sm text-ink hover:bg-gray-50"
            >
              <ExternalLink size={14} aria-hidden="true" />
              View live
            </Link>
          )}
          {canViewFeedback && (
            <button
              type="button"
              onClick={() => {
                setShowFeedback(true);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-ink hover:bg-gray-50 text-left"
            >
              <MessageSquare size={14} aria-hidden="true" />
              View feedback
            </button>
          )}
        </div>
      )}

      {showFeedback && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setShowFeedback(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-card-hover max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-base font-bold text-ink">Reviewer feedback</h2>
              <button
                type="button"
                onClick={() => setShowFeedback(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
              {submission.adminFeedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
