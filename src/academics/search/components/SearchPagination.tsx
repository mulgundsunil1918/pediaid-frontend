// =============================================================================
// academics/search/components/SearchPagination.tsx — Prev / Next pagination
// =============================================================================

import { ChevronLeft, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchPaginationProps {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchPagination({
  total,
  page,
  perPage,
  onPageChange,
}: SearchPaginationProps) {
  const totalPages = Math.ceil(total / perPage);

  // Don't render if everything fits on one page
  if (total <= perPage) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav
      aria-label="Search results pagination"
      className="flex items-center justify-center gap-4 py-6"
    >
      {/* Previous */}
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={isFirst}
        aria-label="Previous page"
        className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Prev
      </button>

      {/* Page indicator */}
      <span className="text-sm text-ink-muted" aria-current="page">
        Page{' '}
        <span className="font-semibold text-ink">{page}</span>
        {' '}of{' '}
        <span className="font-semibold text-ink">{totalPages}</span>
      </span>

      {/* Next */}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={isLast}
        aria-label="Next page"
        className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
