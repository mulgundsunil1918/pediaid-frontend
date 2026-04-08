// =============================================================================
// academics/dashboard/components/MyChaptersList.tsx — Author's chapter list
// =============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  Pencil,
  MessageSquare,
  Clock,
  BookOpen,
  History,
} from 'lucide-react';
import { StatusBadge } from '../../browse/components/StatusBadge';
import type { MyChapter } from '../hooks/useDashboard';
import { ReviewHistoryModal } from './ReviewHistoryModal';
import { useAuthStore } from '../../../store/authStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="bg-card rounded-card shadow-card p-4 animate-pulse space-y-2">
      <div className="flex items-center gap-3">
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-100 rounded-full ml-auto" />
      </div>
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
      <div className="h-3 w-1/4 bg-gray-100 rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single chapter card
// ---------------------------------------------------------------------------

interface ChapterCardProps {
  chapter: MyChapter;
  onViewFeedback: (chapter: MyChapter) => void;
}

function ChapterCard({ chapter, onViewFeedback }: ChapterCardProps) {
  const canModerate = useAuthStore((s) => s.canModerate());
  const isApproved = chapter.status === 'approved';

  // Author can open the editor on any re-workable state. Moderators viewing
  // the same card (e.g. reviewing a chapter from their queue) don't "edit" —
  // they use the review page instead, so the Edit button gets remapped.
  const isEditable =
    chapter.status === 'draft' ||
    chapter.status === 'rejected' ||
    chapter.status === 'changes_requested';
  // Moderator left notes — show the Feedback button
  const hasReviewerFeedback =
    chapter.status === 'rejected' || chapter.status === 'changes_requested';
  // Any chapter that has been submitted at least once has a timeline worth viewing
  const hasReviewHistory = chapter.status !== 'draft';

  const [showHistory, setShowHistory] = useState(false);

  // Destination when the card's title or Edit button is clicked. Moderators
  // go to the dedicated review page; authors go to the editor; approved
  // chapters always open in the public reader.
  const editHref = canModerate
    ? `/academics/moderator/review/${chapter.id}`
    : `/academics/editor/${chapter.id}`;
  const titleHref = isApproved ? `/academics/c/${chapter.slug}` : editHref;

  return (
    <div
      className="
        bg-card rounded-card shadow-card
        px-4 py-4
        hover:-translate-y-0.5 hover:shadow-card-hover
        transition-all duration-200
      "
    >
      {/* Top row: title + status badge */}
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <Link
          to={titleHref}
          className="
            text-base font-semibold text-ink
            hover:text-accent transition-colors
            leading-snug
          "
        >
          {chapter.title}
        </Link>
        <StatusBadge status={chapter.status} className="shrink-0 mt-0.5" />
      </div>

      {/* Breadcrumb */}
      <p className="text-xs text-ink-muted mb-2">
        <span className="font-medium">{chapter.subjectCode}</span>
        {' · '}
        {chapter.systemName}
        {' · '}
        {chapter.topicName}
      </p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1">
          <BookOpen size={12} aria-hidden="true" />
          v{chapter.version}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} aria-hidden="true" />
          Updated {daysAgo(chapter.updatedAt)}
        </span>
        {isApproved && chapter.viewCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <Eye size={12} aria-hidden="true" />
            {chapter.viewCount.toLocaleString()} views
          </span>
        )}
      </div>

      {/* Action buttons */}
      {(isEditable || hasReviewerFeedback || hasReviewHistory) && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
          {isEditable && (
            <Link
              to={editHref}
              className="
                flex items-center gap-1.5
                px-3 py-1.5 rounded-xl
                border border-border text-xs font-medium text-ink
                hover:border-accent hover:text-accent hover:bg-blue-50
                transition-all duration-150
              "
            >
              <Pencil size={13} aria-hidden="true" />
              {canModerate ? 'Review' : 'Edit'}
            </Link>
          )}

          {hasReviewerFeedback && (
            <button
              onClick={() => onViewFeedback(chapter)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium',
                'transition-all duration-150',
                chapter.status === 'rejected'
                  ? 'border border-red-200 text-danger hover:bg-red-50'
                  : 'border border-orange-200 text-orange-600 hover:bg-orange-50',
              ].join(' ')}
            >
              <MessageSquare size={13} aria-hidden="true" />
              View Feedback
            </button>
          )}

          {hasReviewHistory && (
            <button
              onClick={() => setShowHistory(true)}
              className="
                flex items-center gap-1.5
                px-3 py-1.5 rounded-xl
                border border-border text-xs font-medium text-ink-muted
                hover:text-ink hover:border-accent/40 hover:bg-gray-50
                transition-all duration-150
              "
            >
              <History size={13} aria-hidden="true" />
              Review History
            </button>
          )}
        </div>
      )}

      {showHistory && (
        <ReviewHistoryModal
          chapterId={chapter.id}
          chapterTitle={chapter.title}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MyChaptersList
// ---------------------------------------------------------------------------

interface MyChaptersListProps {
  chapters: MyChapter[];
  isLoading: boolean;
  onViewFeedback: (chapter: MyChapter) => void;
}

export function MyChaptersList({
  chapters,
  isLoading,
  onViewFeedback,
}: MyChaptersListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div
        className="
          bg-card rounded-card shadow-card
          flex flex-col items-center justify-center
          py-14 px-6 text-center
        "
      >
        <BookOpen size={36} className="text-ink-muted mb-3" aria-hidden="true" />
        <p className="text-base font-semibold text-ink mb-1">No chapters yet</p>
        <p className="text-sm text-ink-muted">
          Create your first chapter to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chapters.map((chapter) => (
        <ChapterCard
          key={chapter.id}
          chapter={chapter}
          onViewFeedback={onViewFeedback}
        />
      ))}
    </div>
  );
}
