// =============================================================================
// academics/search/components/SearchResultsSummary.tsx — Result count + timing
// =============================================================================

import { Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchResultsSummaryProps {
  total: number;
  took: number;
  query: string;
  isFetching: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchResultsSummary({
  total,
  took,
  query,
  isFetching,
}: SearchResultsSummaryProps) {
  if (isFetching && total === 0) {
    // First load — show spinner only
    return (
      <div className="flex items-center gap-2 text-sm text-ink-muted py-1">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        <span>Searching…</span>
      </div>
    );
  }

  return (
    <p className="text-sm text-ink-muted py-1" aria-live="polite" aria-atomic="true">
      <span className="font-medium text-ink">{total.toLocaleString()}</span>{' '}
      {total === 1 ? 'result' : 'results'} for{' '}
      <span className="font-medium text-ink">"{query}"</span>{' '}
      <span className="text-ink-muted">({took}ms)</span>
      {isFetching && (
        <Loader2
          size={12}
          className="inline-block ml-2 animate-spin align-middle text-accent"
          aria-label="Refreshing results"
        />
      )}
    </p>
  );
}
