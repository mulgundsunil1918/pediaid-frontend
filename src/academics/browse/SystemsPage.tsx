// =============================================================================
// browse/SystemsPage.tsx — /academics/subjects/:subjectId
// =============================================================================

import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { useSubjects, useSystems } from './hooks/useBrowse';
import { Breadcrumb } from './components/Breadcrumb';
import type { AcadSystem } from '../types';

// ---------------------------------------------------------------------------
// SystemRow
// ---------------------------------------------------------------------------

function SystemRow({
  system,
  subjectId,
}: {
  system: AcadSystem;
  subjectId: string;
}) {
  return (
    <Link
      to={`/academics/subjects/${subjectId}/systems/${system.id}`}
      className="group flex items-center justify-between px-5 py-4
                 bg-white border border-border rounded-card
                 hover:bg-blue-50 hover:border-accent/30
                 transition-all duration-150 ease-out
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-accent focus-visible:ring-offset-1"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Layers
          size={18}
          className="text-ink-muted shrink-0 group-hover:text-accent
                     transition-colors"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <span className="font-semibold text-ink group-hover:text-primary
                           transition-colors block truncate">
            {system.name}
          </span>
          <span className="text-xs text-ink-muted">
            {system.topicCount ?? 0}{' '}
            {system.topicCount === 1 ? 'topic' : 'topics'}
          </span>
        </div>
      </div>

      <ChevronRight
        size={18}
        className="text-ink-muted shrink-0 group-hover:text-accent
                   group-hover:translate-x-0.5 transition-all"
        aria-hidden="true"
      />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SystemsPage() {
  const { subjectId } = useParams<{ subjectId: string }>();

  const {
    data: subjects,
    isLoading: subjectsLoading,
  } = useSubjects();

  const {
    data: systems,
    isLoading: systemsLoading,
    isError,
    error,
  } = useSystems(subjectId);

  const subject = subjects?.find((s) => s.id === subjectId);
  const isLoading = subjectsLoading || systemsLoading;

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          to="/academics"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted
                     hover:text-primary transition-colors mb-6 group"
        >
          <ChevronLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
            aria-hidden="true"
          />
          Back to Specialties
        </Link>

        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Academics', href: '/academics' },
            { label: subject?.name ?? '…' },
          ]}
        />

        {/* Page title */}
        <div className="mb-8">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-64 bg-gray-200 rounded-lg mb-2" />
              <div className="h-4 w-96 bg-gray-200 rounded-lg" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-sans font-bold text-2xl sm:text-3xl text-primary">
                  {subject?.name ?? 'Subject'}
                </h1>
                {subject?.code && (
                  <span
                    className="acad-badge text-white"
                    style={{ backgroundColor: '#3182ce' }}
                  >
                    {subject.code}
                  </span>
                )}
              </div>
              {subject?.description && (
                <p className="text-ink-muted text-sm max-w-2xl">
                  {subject.description}
                </p>
              )}
            </>
          )}
        </div>

        {/* Systems list */}
        <section aria-label="Systems">
          <h2 className="text-xs font-semibold text-ink-muted uppercase
                         tracking-widest mb-4">
            Systems
          </h2>

          {isError && (
            <div className="rounded-card border border-red-200 bg-red-50 p-5">
              <p className="text-danger font-medium text-sm">
                {error instanceof Error
                  ? error.message
                  : 'Failed to load systems'}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {isLoading &&
              Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-16 bg-white border border-border
                             rounded-card"
                />
              ))}

            {!isLoading && !isError && systems?.length === 0 && (
              <p className="text-ink-muted text-sm py-8 text-center">
                No systems found for this subject.
              </p>
            )}

            {systems?.map((system) => (
              <SystemRow
                key={system.id}
                system={system}
                subjectId={subjectId ?? ''}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
