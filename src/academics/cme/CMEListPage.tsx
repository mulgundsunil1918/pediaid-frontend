// =============================================================================
// academics/cme/CMEListPage.tsx — /academics/cme route
// =============================================================================

import { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCMEEvents } from './hooks/useCME';
import type { CMEFilters, CMEEvent } from './hooks/useCME';
import { EventCard } from './components/EventCard';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 12;

type StatusFilter = CMEFilters['status'] | 'all';
type TypeFilter = CMEEvent['eventType'] | 'all';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
];

const TYPE_PILLS: { label: string; value: TypeFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Webinar', value: 'webinar' },
  { label: 'Workshop', value: 'workshop' },
  { label: 'Conference', value: 'conference' },
  { label: 'Course', value: 'course' },
];

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-card shadow-card overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="flex justify-between mt-2">
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
          <div className="h-5 w-12 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ statusFilter, typeFilter }: { statusFilter: StatusFilter; typeFilter: TypeFilter }) {
  const filterDesc = [
    statusFilter !== 'all' ? statusFilter : null,
    typeFilter !== 'all' ? typeFilter : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-border flex items-center justify-center">
        <BookOpen size={28} className="text-ink-muted" />
      </div>
      <div>
        <p className="font-semibold text-ink">No events found</p>
        <p className="text-sm text-ink-muted mt-1">
          {filterDesc
            ? `No ${filterDesc} CME events at the moment. Try a different filter.`
            : 'Check back soon for upcoming CME events.'}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CMEListPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [page, setPage] = useState(1);

  const filters: CMEFilters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(typeFilter !== 'all' && { eventType: typeFilter }),
    page,
  };

  const { data, isLoading, isError, error } = useCMEEvents(filters);

  const events = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Reset to page 1 on filter change
  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleTypeChange(value: TypeFilter) {
    setTypeFilter(value);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">CME Events</h1>
          <p className="mt-1 text-ink-muted">
            Earn continuing medical education credits
          </p>
        </div>

        {/* Status tab bar */}
        <div className="flex gap-1 p-1 bg-card border border-border rounded-xl w-fit mb-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none ${
                statusFilter === tab.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Event type filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TYPE_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => handleTypeChange(pill.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors focus:outline-none ${
                typeFilter === pill.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-card text-ink-muted border-border hover:border-accent hover:text-accent'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {isError && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-card text-danger text-sm">
            {error?.message ?? 'Failed to load events. Please try again.'}
          </div>
        )}

        {/* Event grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {isLoading ? (
            Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
          ) : events.length === 0 ? (
            <EmptyState statusFilter={statusFilter} typeFilter={typeFilter} />
          ) : (
            events.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-primary text-white'
                    : 'border border-border text-ink-muted hover:bg-card hover:text-ink'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Total count */}
        {!isLoading && events.length > 0 && (
          <p className="mt-4 text-center text-xs text-ink-muted">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} events
          </p>
        )}

      </div>
    </div>
  );
}
