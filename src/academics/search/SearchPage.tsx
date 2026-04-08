// =============================================================================
// academics/search/SearchPage.tsx — Route: /academics/search
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from './components/SearchBar';
import { FilterBar } from './components/FilterBar';
import { SearchResultCard } from './components/SearchResultCard';
import { SearchResultsSummary } from './components/SearchResultsSummary';
import { NoResultsState } from './components/NoResultsState';
import { SearchPagination } from './components/SearchPagination';
import {
  useSearch,
  addRecentSearch,
  type SearchFilters,
} from './hooks/useSearch';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PER_PAGE = 20;

// ---------------------------------------------------------------------------
// Skeleton card — shown during first load
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div
      className="rounded-card border border-border bg-white shadow-card p-5 animate-pulse"
      aria-hidden="true"
    >
      <div className="mb-2 h-3 w-1/3 rounded bg-bg" />
      <div className="mb-3 h-5 w-3/4 rounded bg-bg" />
      <div className="mb-1 h-3 w-full rounded bg-bg" />
      <div className="mb-3 h-3 w-5/6 rounded bg-bg" />
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-full bg-bg" />
        <div className="h-3 w-28 rounded bg-bg" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 w-20 rounded bg-bg" />
        <div className="h-3 w-16 rounded bg-bg" />
        <div className="h-3 w-16 rounded bg-bg" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SearchPage
// ---------------------------------------------------------------------------

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive initial query from URL
  const urlQuery = searchParams.get('q') ?? '';

  // Local filter state (subjectId, systemId, topicId, page)
  const [filters, setFilters] = useState<SearchFilters>({
    q: urlQuery,
    page: 1,
  });

  // Keep filters.q in sync with URL ?q= changes (e.g. back navigation)
  useEffect(() => {
    setFilters((prev) => ({ ...prev, q: urlQuery, page: 1 }));
  }, [urlQuery]);

  // Save to recent searches whenever q changes and has 2+ chars
  useEffect(() => {
    if (filters.q.trim().length >= 2) {
      addRecentSearch(filters.q.trim());
    }
  }, [filters.q]);

  // React Query
  const { data, isLoading, isFetching, isPlaceholderData } = useSearch(filters);

  const results = data?.results ?? [];
  const total = data?.total ?? 0;
  const took = data?.took ?? 0;

  // True first load (no data yet, actively loading)
  const isFirstLoad = isLoading && results.length === 0;

  // Subtle refetch bar: has data but currently re-fetching (page change / filter change)
  const isRefetching = isFetching && !isFirstLoad;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      setSearchParams({ q: trimmed }, { replace: false });
      setFilters((prev) => ({ ...prev, q: trimmed, page: 1 }));
    },
    [setSearchParams],
  );

  const handleFiltersChange = useCallback((f: SearchFilters) => {
    setFilters(f);
  }, []);

  const handlePageChange = useCallback((p: number) => {
    setFilters((prev) => ({ ...prev, page: p }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-bg">
      {/* Subtle refetch indicator — thin blue bar at the very top */}
      {isRefetching && (
        <div
          className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-accent"
          style={{
            animation: 'progress-bar 1.2s ease-in-out infinite',
          }}
          role="progressbar"
          aria-label="Loading results"
        />
      )}

      {/* Page header */}
      <header className="border-b border-border bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="mb-4 text-xl font-bold text-primary">Search</h1>
          <SearchBar
            variant="large"
            initialValue={filters.q}
            onSearch={handleSearch}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Filters */}
        <div className="mb-5">
          <FilterBar filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* Results area — only shown when there's a query */}
        {filters.q.trim().length >= 2 ? (
          <>
            {/* Summary */}
            {(data !== undefined || isFetching) && (
              <div className="mb-4">
                <SearchResultsSummary
                  total={total}
                  took={took}
                  query={filters.q}
                  isFetching={isFetching}
                />
              </div>
            )}

            {/* Skeleton cards — first load */}
            {isFirstLoad && (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Results list */}
            {!isFirstLoad && results.length > 0 && (
              <div
                className={`space-y-4 transition-opacity duration-200 ${
                  isPlaceholderData ? 'opacity-60' : 'opacity-100'
                }`}
              >
                {results.map((result) => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    query={filters.q}
                  />
                ))}
              </div>
            )}

            {/* No results */}
            {!isFirstLoad && !isFetching && results.length === 0 && data !== undefined && (
              <NoResultsState query={filters.q} />
            )}

            {/* Pagination */}
            {!isFirstLoad && results.length > 0 && (
              <SearchPagination
                total={total}
                page={filters.page ?? 1}
                perPage={PER_PAGE}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          /* Empty state before search */
          <div className="flex flex-col items-center justify-center py-20 text-center text-ink-muted">
            <p className="text-sm">
              Enter at least 2 characters to search chapters, topics, and subjects.
            </p>
          </div>
        )}
      </main>

      {/* Progress bar keyframe animation injected inline */}
      <style>{`
        @keyframes progress-bar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
