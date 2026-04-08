// =============================================================================
// academics/search/components/RecentSearches.tsx — Recent search terms list
// =============================================================================

import { Clock } from 'lucide-react';
import { getRecentSearches } from '../hooks/useSearch';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RecentSearchesProps {
  onSelect: (q: string) => void;
  onClear: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecentSearches({ onSelect, onClear }: RecentSearchesProps) {
  const recents = getRecentSearches();

  if (recents.length === 0) return null;

  return (
    <div className="px-2 py-2">
      {/* Header row */}
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
          Recent searches
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
          className="text-xs text-accent hover:underline focus:outline-none"
        >
          Clear all
        </button>
      </div>

      {/* List */}
      <ul role="listbox" aria-label="Recent searches">
        {recents.map((term) => (
          <li key={term} role="option" aria-selected={false}>
            <button
              type="button"
              onMouseDown={(e) => {
                // Prevent input blur before select fires
                e.preventDefault();
              }}
              onClick={() => onSelect(term)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-ink hover:bg-bg focus:bg-bg focus:outline-none transition-colors"
            >
              <Clock
                size={14}
                className="shrink-0 text-ink-muted"
                aria-hidden="true"
              />
              <span className="truncate">{term}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
