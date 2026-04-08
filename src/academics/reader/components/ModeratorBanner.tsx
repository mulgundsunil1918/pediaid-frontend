// =============================================================================
// reader/components/ModeratorBanner.tsx
// Only visible to the chapter's own author and moderators/admins.
// =============================================================================

import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, FileEdit, Send } from 'lucide-react';

interface ModeratorBannerProps {
  chapterId: string;
  status: 'draft' | 'pending' | 'rejected' | 'archived';
  moderatorNotes: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'less than an hour ago';
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function ModeratorBanner({
  chapterId,
  status,
  moderatorNotes,
  reviewedByName,
  reviewedAt,
}: ModeratorBannerProps) {
  const navigate = useNavigate();

  if (status === 'rejected') {
    return (
      <div
        className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4"
        role="alert"
        aria-label="Chapter rejected"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-danger text-sm">
              Chapter rejected
              {reviewedByName && ` by ${reviewedByName}`}
              {reviewedAt && ` on ${formatDate(reviewedAt)}`}
            </p>
            {moderatorNotes && (
              <blockquote className="mt-2 pl-3 border-l-2 border-red-300 text-sm text-ink-muted italic">
                {moderatorNotes}
              </blockquote>
            )}
            <button
              type="button"
              onClick={() => navigate(`/academics/editor/${chapterId}`)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold
                         text-white px-4 py-2 rounded-xl transition-colors"
              style={{ backgroundColor: '#e53e3e' }}
            >
              <FileEdit size={14} aria-hidden="true" />
              Edit Chapter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div
        className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4"
        role="status"
        aria-label="Chapter under review"
      >
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-warning shrink-0" aria-hidden="true" />
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-warning">Under review.</span>{' '}
            {reviewedAt
              ? `Submitted ${relativeTime(reviewedAt)}.`
              : 'Awaiting moderator review.'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'draft') {
    return (
      <div
        className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4"
        role="status"
        aria-label="Draft chapter"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink">Draft.</span>{' '}
            This chapter is not published. Submit for review when ready.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/academics/editor/${chapterId}`)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold
                       text-white px-4 py-2 rounded-xl transition-colors"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <Send size={13} aria-hidden="true" />
            Go to Editor
          </button>
        </div>
      </div>
    );
  }

  return null;
}
