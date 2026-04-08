// =============================================================================
// browse/SubjectsPage.tsx — /academics
// =============================================================================

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { useSubjects } from './hooks/useBrowse';
import { SkeletonGrid } from './SkeletonCard';
import type { Subject } from '../types';

// ---------------------------------------------------------------------------
// SubjectCard
// ---------------------------------------------------------------------------

function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <Link
      to={`/academics/subjects/${subject.id}`}
      className="acad-card p-6 flex flex-col gap-3 group cursor-pointer
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-accent focus-visible:ring-offset-2"
      aria-label={`Browse ${subject.name}`}
    >
      {/* Code badge */}
      <span
        className="self-start acad-badge text-white"
        style={{ backgroundColor: '#3182ce' }}
      >
        {subject.code}
      </span>

      {/* Name */}
      <h2 className="font-sans font-semibold text-lg text-primary leading-snug">
        {subject.name}
      </h2>

      {/* Description — 2 lines max */}
      {subject.description && (
        <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed">
          {subject.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-xs text-ink-muted font-medium">
          {subject.systemCount ?? 0}{' '}
          {subject.systemCount === 1 ? 'system' : 'systems'}
        </span>
        <ChevronRight
          size={16}
          className="text-ink-muted group-hover:text-accent
                     group-hover:translate-x-0.5 transition-all"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center
                    py-20 text-center">
      <BookOpen size={48} className="text-border mb-4" aria-hidden="true" />
      <p className="text-ink font-medium text-lg mb-1">No subjects yet</p>
      <p className="text-ink-muted text-sm max-w-sm">
        Content is being set up. Check back soon.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ message }: { message: string }) {
  return (
    <div className="col-span-full rounded-card border border-red-200
                    bg-red-50 p-6 text-center">
      <p className="text-danger font-medium">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SubjectsPage() {
  const { data: subjects, isLoading, isError, error } = useSubjects();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/academics/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <div
      className="min-h-screen bg-bg"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="border-b border-border"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="font-sans font-bold text-3xl sm:text-4xl text-white mb-2">
            PediAid Academics
          </h1>
          <p className="text-blue-200 text-base sm:text-lg max-w-2xl mb-8">
            Structured medical knowledge, peer-reviewed and organized by
            specialty
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            role="search"
            className="flex max-w-xl"
          >
            <label htmlFor="acad-search" className="sr-only">
              Search chapters
            </label>
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <input
                id="acad-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chapters, topics, or authors…"
                className="w-full pl-10 pr-4 py-3 rounded-l-xl border-0
                           text-ink placeholder-ink-muted text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent
                           shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-r-xl font-semibold text-sm text-white
                         transition-colors"
              style={{ backgroundColor: '#3182ce' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  '#2c5282')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  '#3182ce')
              }
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Subject grid                                                         */}
      {/* ------------------------------------------------------------------ */}
      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-5">
          Specialties
        </h2>

        <div
          className="grid gap-4
                     grid-cols-1
                     sm:grid-cols-2
                     lg:grid-cols-3
                     xl:grid-cols-4"
        >
          {isLoading && <SkeletonGrid variant="subject" count={6} />}

          {isError && (
            <ErrorState
              message={
                error instanceof Error
                  ? error.message
                  : 'Failed to load subjects'
              }
            />
          )}

          {!isLoading && !isError && subjects?.length === 0 && (
            <EmptyState />
          )}

          {subjects?.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      </main>
    </div>
  );
}
