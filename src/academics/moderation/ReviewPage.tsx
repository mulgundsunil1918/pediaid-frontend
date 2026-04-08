// =============================================================================
// moderation/ReviewPage.tsx — two-panel chapter review view
// =============================================================================

import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import { useChapterForReview } from './hooks/useModeration';
import {
  ReviewActionPanel,
  ReviewTopActionBar,
} from './components/ReviewActionPanel';
import { ChapterRenderer } from '../reader/components/ChapterRenderer';
import { ReferencesDisplay } from '../reader/components/ReferencesDisplay';
import { useAuthStore } from '../../store/authStore';

function ReviewSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
      <div className="h-4 bg-gray-100 rounded" />
      <div className="h-4 bg-gray-100 rounded w-5/6" />
      <div className="h-4 bg-gray-100 rounded" />
      <div className="h-4 bg-gray-100 rounded w-4/6" />
    </div>
  );
}

export function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRole = useAuthStore((s) => s.hasRole);

  // Guard: only moderators/admins
  if (!hasRole('moderator', 'admin')) {
    return <Navigate to="/academics" replace />;
  }

  const { data: chapter, isLoading, error } = useChapterForReview(id);

  // Pull queue context from navigation state (passed from ModerationQueuePage)
  const nextChapterId = (location.state as { nextChapterId?: string } | null)?.nextChapterId;
  const queueLength = (location.state as { queueLength?: number } | null)?.queueLength ?? 0;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-2xl font-bold text-border">Error</p>
        <p className="text-ink-muted text-sm">
          {error instanceof Error ? error.message : 'Failed to load chapter'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/academics/moderator/queue')}
          className="mt-2 text-sm text-accent hover:underline"
        >
          ← Back to queue
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-border px-4 sm:px-6
                      py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/academics/moderator/queue')}
            className="p-2 rounded-xl hover:bg-gray-100 text-ink-muted transition-colors shrink-0"
            title="Back to queue (Esc)"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm text-primary truncate">
              {isLoading ? 'Loading…' : chapter?.title}
            </h1>
            <p className="text-xs text-ink-muted">Moderator Review</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/academics/moderator/queue')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink-muted
                     border border-border rounded-xl hover:bg-gray-50 transition-colors shrink-0"
        >
          <Layers size={13} /> Queue
          {queueLength > 0 && (
            <span className="ml-0.5 bg-primary text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              {queueLength}
            </span>
          )}
        </button>
      </div>

      {/* Sticky action bar — three big buttons up top, as requested.
           Each button scrolls the moderator to the notes textarea in the
           side panel below so they can type notes then confirm. The actual
           confirmation still happens inside the side panel to preserve the
           reject-modal safety flow and keyboard shortcuts. */}
      {!isLoading && chapter && (
        <ReviewTopActionBar
          isSubmitting={false}
          onApprove={() => {
            document
              .getElementById('mod-action-panel')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
              document.getElementById('mod-approve-btn')?.click();
            }, 350);
          }}
          onRequestChanges={() => {
            document
              .getElementById('mod-action-panel')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
              document.getElementById('mod-notes')?.focus();
            }, 350);
          }}
          onReject={() => {
            document
              .getElementById('mod-action-panel')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
              document.getElementById('mod-notes')?.focus();
            }, 350);
          }}
        />
      )}

      {/* Two-column layout */}
      <div className="flex max-w-screen-xl mx-auto">
        {/* ── Left: Chapter content ── */}
        <article className="flex-1 min-w-0 border-r border-border px-6 sm:px-10 py-8">
          {isLoading && <ReviewSkeleton />}

          {!isLoading && chapter && (
            <>
              {/* Chapter heading */}
              <h1 className="text-3xl font-bold text-primary leading-snug mb-2">
                {chapter.title}
              </h1>
              <p className="text-sm text-ink-muted mb-1">
                By{' '}
                <span className="font-medium text-ink">
                  {[chapter.author.fullName, chapter.author.qualification]
                    .filter(Boolean).join(', ')}
                </span>
              </p>
              {chapter.author.institution && (
                <p className="text-xs text-ink-muted mb-6">{chapter.author.institution}</p>
              )}

              {/* Abstract */}
              {chapter.abstract && (
                <div className="bg-gray-50 rounded-xl px-5 py-4 mb-8 border border-border">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                    Abstract
                  </p>
                  <p className="text-sm leading-relaxed text-ink">{chapter.abstract}</p>
                </div>
              )}

              {/* Chapter blocks */}
              <div className="prose-reading">
                <ChapterRenderer blocks={chapter.content.blocks} references={chapter.chapterReferences ?? []} />
              </div>

              {/* References */}
              {chapter.references && chapter.references.length > 0 && (
                <div className="mt-10 pt-6 border-t border-border">
                  <ReferencesDisplay references={chapter.references} />
                </div>
              )}
            </>
          )}
        </article>

        {/* ── Right: Review panel ── */}
        <aside className="w-80 xl:w-96 shrink-0">
          <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto px-5 py-6">
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-32 bg-gray-100 rounded-xl" />
                <div className="h-24 bg-gray-100 rounded-xl" />
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-12 bg-gray-100 rounded-xl" />
              </div>
            ) : chapter ? (
              <ReviewActionPanel
                chapter={chapter}
                queueLength={queueLength}
                nextChapterId={nextChapterId}
              />
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
