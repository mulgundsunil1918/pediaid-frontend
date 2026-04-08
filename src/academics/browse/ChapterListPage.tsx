// =============================================================================
// browse/ChapterListPage.tsx — /academics/subjects/:subjectId/systems/:systemId/topics/:topicId
// =============================================================================

import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Clock,
  Calendar,
  User,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from 'lucide-react';
import { useSubjects, useSystems, useTopics, useChapterList } from './hooks/useBrowse';
import { Breadcrumb } from './components/Breadcrumb';
import { StatusBadge } from './components/StatusBadge';
import { VerifiedBadge } from './components/VerifiedBadge';
import { SkeletonGrid } from './SkeletonCard';
import { useAuthStore } from '../../store/authStore';
import type { ChapterListItem } from '../types';

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// ChapterCard
// ---------------------------------------------------------------------------

function ChapterCard({
  chapter,
  showStatus,
}: {
  chapter: ChapterListItem;
  showStatus: boolean;
}) {
  const { subjectId, systemId, topicId } = useParams<{
    subjectId: string;
    systemId: string;
    topicId: string;
  }>();

  const authorName = chapter.author.fullName;
  const authorQual = chapter.author.qualification;
  const displayName = authorQual
    ? `${authorName}, ${authorQual}`
    : authorName;

  return (
    <article className="acad-card p-5 flex flex-col gap-3 group">
      {/* Title */}
      <Link
        to={`/academics/subjects/${subjectId}/systems/${systemId}/topics/${topicId}/chapters/${chapter.id}`}
        className="font-sans font-semibold text-lg text-ink leading-snug
                   hover:text-primary transition-colors group-focus-within:text-primary"
      >
        {chapter.title}
      </Link>

      {/* Author row */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full
                     bg-primary/10 shrink-0"
          aria-hidden="true"
        >
          <User size={14} className="text-primary" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink truncate">
              {displayName}
            </span>
            <VerifiedBadge
              credentialsVerified={chapter.author.credentialsVerified}
            />
          </div>
          {chapter.author.institution && (
            <p className="text-xs text-ink-muted truncate">
              {chapter.author.institution}
            </p>
          )}
        </div>
      </div>

      {/* Footer meta */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3
                   border-t border-border mt-auto"
      >
        <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
          <Clock size={12} aria-hidden="true" />
          {chapter.readingTimeMinutes} min read
        </span>

        {chapter.publishedAt && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <Calendar size={12} aria-hidden="true" />
            {formatDate(chapter.publishedAt)}
          </span>
        )}

        {/* Only visible to logged-in authors/moderators for non-approved chapters */}
        {showStatus && chapter.status !== 'approved' && (
          <StatusBadge status={chapter.status} className="ml-auto" />
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({
  topicName,
  topicId,
  canAuthor,
}: {
  topicName: string;
  topicId: string;
  canAuthor: boolean;
}) {
  return (
    <div className="col-span-full flex flex-col items-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center
                   bg-blue-50 mb-5"
      >
        <Plus size={28} className="text-accent" aria-hidden="true" />
      </div>
      <p className="text-ink font-semibold text-lg mb-2">
        No chapters yet for this topic
      </p>
      <p className="text-ink-muted text-sm max-w-sm mb-6">
        {canAuthor
          ? `Be the first to contribute a chapter on "${topicName}".`
          : 'Content for this topic is coming soon.'}
      </p>
      {canAuthor && (
        <Link
          to={`/academics/editor/new?topic=${topicId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     font-semibold text-sm text-white transition-colors"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <Plus size={16} aria-hidden="true" />
          Write a Chapter
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagination controls
// ---------------------------------------------------------------------------

function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 mt-8"
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm
                   font-medium text-ink-muted border border-border bg-white
                   hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors"
        aria-label="Previous page"
      >
        <PrevIcon size={14} aria-hidden="true" />
        Prev
      </button>

      <span className="text-sm text-ink-muted px-3">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm
                   font-medium text-ink-muted border border-border bg-white
                   hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors"
        aria-label="Next page"
      >
        Next
        <NextIcon size={14} aria-hidden="true" />
      </button>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ChapterListPage() {
  const { subjectId, systemId, topicId } = useParams<{
    subjectId: string;
    systemId: string;
    topicId: string;
  }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { isAuthenticated, canAuthor, hasRole } = useAuthStore();
  const isElevated = hasRole('author', 'moderator', 'admin');

  const { data: subjects } = useSubjects();
  const { data: systems } = useSystems(subjectId);
  const { data: topics } = useTopics(systemId);
  const {
    data: chapterPage,
    isLoading,
    isError,
    error,
  } = useChapterList(topicId, page);

  const subject = subjects?.find((s) => s.id === subjectId);
  const system = systems?.find((s) => s.id === systemId);
  const topic = topics?.find((t) => t.id === topicId);

  // Sort: approved first, then by publishedAt DESC (already sorted by API,
  // but guard here for resilience)
  const sortedChapters = chapterPage?.data
    ? [...chapterPage.data].sort((a, b) => {
        if (a.status === 'approved' && b.status !== 'approved') return -1;
        if (a.status !== 'approved' && b.status === 'approved') return 1;
        const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return db - da;
      })
    : [];

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          to={`/academics/subjects/${subjectId}/systems/${systemId}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted
                     hover:text-primary transition-colors mb-6 group"
        >
          <ChevronLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
            aria-hidden="true"
          />
          Back to {system?.name ?? 'Topics'}
        </Link>

        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Academics', href: '/academics' },
            {
              label: subject?.name ?? '…',
              href: `/academics/subjects/${subjectId}`,
            },
            {
              label: system?.name ?? '…',
              href: `/academics/subjects/${subjectId}/systems/${systemId}`,
            },
            { label: topic?.name ?? '…' },
          ]}
        />

        {/* Page title + "New Chapter" button */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-primary">
            {topic?.name ?? 'Topic'}
          </h1>

          {isAuthenticated() && canAuthor() && (
            <Link
              to={`/academics/editor/new?topic=${topicId}`}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5
                         rounded-xl font-semibold text-sm text-white transition-colors"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <Plus size={16} aria-hidden="true" />
              <span className="hidden sm:inline">New Chapter</span>
              <span className="sm:hidden">New</span>
            </Link>
          )}
        </div>

        {/* Chapter list */}
        <section aria-label="Chapters">
          {isError && (
            <div className="rounded-card border border-red-200 bg-red-50 p-5">
              <p className="text-danger font-medium text-sm">
                {error instanceof Error
                  ? error.message
                  : 'Failed to load chapters'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {isLoading && <SkeletonGrid variant="chapter" count={4} />}

            {!isLoading && !isError && sortedChapters.length === 0 && (
              <EmptyState
                topicName={topic?.name ?? 'this topic'}
                topicId={topicId ?? ''}
                canAuthor={isAuthenticated() && canAuthor()}
              />
            )}

            {sortedChapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                showStatus={isElevated}
              />
            ))}
          </div>

          {chapterPage && (
            <Pagination
              page={page}
              total={chapterPage.total}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </section>
      </main>
    </div>
  );
}
