// =============================================================================
// browse/TopicsPage.tsx — /academics/subjects/:subjectId/systems/:systemId
// =============================================================================

import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { useSubjects, useSystems, useTopics } from './hooks/useBrowse';
import { Breadcrumb } from './components/Breadcrumb';
import { SkeletonGrid } from './SkeletonCard';
import type { Topic } from '../types';

// ---------------------------------------------------------------------------
// TopicCard
// ---------------------------------------------------------------------------

function TopicCard({
  topic,
  subjectId,
  systemId,
}: {
  topic: Topic;
  subjectId: string;
  systemId: string;
}) {
  const chapterCount = topic.chapterCount ?? 0;

  return (
    <Link
      to={`/academics/subjects/${subjectId}/systems/${systemId}/topics/${topic.id}`}
      className="acad-card p-5 flex flex-col gap-2 group
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-accent focus-visible:ring-offset-1"
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className="font-sans font-semibold text-base text-ink
                     group-hover:text-primary transition-colors leading-snug"
        >
          {topic.name}
        </h3>
        <BookOpen
          size={16}
          className="text-ink-muted shrink-0 mt-0.5 group-hover:text-accent
                     transition-colors"
          aria-hidden="true"
        />
      </div>

      {topic.description && (
        <p className="text-xs text-ink-muted line-clamp-2">
          {topic.description}
        </p>
      )}

      <p className="mt-auto text-xs text-ink-muted font-medium pt-1">
        {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
      </p>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function TopicsPage() {
  const { subjectId, systemId } = useParams<{
    subjectId: string;
    systemId: string;
  }>();

  const { data: subjects } = useSubjects();
  const { data: systems } = useSystems(subjectId);
  const {
    data: topics,
    isLoading,
    isError,
    error,
  } = useTopics(systemId);

  const subject = subjects?.find((s) => s.id === subjectId);
  const system = systems?.find((s) => s.id === systemId);

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          to={`/academics/subjects/${subjectId}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted
                     hover:text-primary transition-colors mb-6 group"
        >
          <ChevronLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
            aria-hidden="true"
          />
          Back to {subject?.name ?? 'Subject'}
        </Link>

        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Academics', href: '/academics' },
            {
              label: subject?.name ?? '…',
              href: `/academics/subjects/${subjectId}`,
            },
            { label: system?.name ?? '…' },
          ]}
        />

        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-primary">
            {system?.name ?? 'System'}
          </h1>
        </div>

        {/* Topics grid — 2 columns */}
        <section aria-label="Topics">
          <h2 className="text-xs font-semibold text-ink-muted uppercase
                         tracking-widest mb-4">
            Topics
          </h2>

          {isError && (
            <div className="rounded-card border border-red-200 bg-red-50 p-5">
              <p className="text-danger font-medium text-sm">
                {error instanceof Error
                  ? error.message
                  : 'Failed to load topics'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoading && <SkeletonGrid variant="topic" count={6} />}

            {!isLoading && !isError && topics?.length === 0 && (
              <p className="col-span-full text-ink-muted text-sm py-8 text-center">
                No topics found for this system.
              </p>
            )}

            {topics?.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                subjectId={subjectId ?? ''}
                systemId={systemId ?? ''}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
