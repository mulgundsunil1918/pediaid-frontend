// =============================================================================
// academics/search/components/NoResultsState.tsx — Empty results illustration
// =============================================================================

import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NoResultsStateProps {
  query: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  'Check your spelling',
  'Try broader search terms',
];

export function NoResultsState({ query }: NoResultsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon */}
      <div
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-bg"
        aria-hidden="true"
      >
        <SearchX size={40} className="text-ink-muted" />
      </div>

      {/* Heading */}
      <h2 className="mb-2 text-lg font-semibold text-ink">
        No results for{' '}
        <span className="text-primary">"{query}"</span>
      </h2>

      {/* Tips list */}
      <ul className="mb-5 space-y-1.5 text-sm text-ink-muted">
        {SUGGESTIONS.map((tip) => (
          <li key={tip} className="flex items-center justify-center gap-2">
            <span className="inline-block h-1 w-1 rounded-full bg-ink-muted" aria-hidden="true" />
            {tip}
          </li>
        ))}
        <li className="flex items-center justify-center gap-2">
          <span className="inline-block h-1 w-1 rounded-full bg-ink-muted" aria-hidden="true" />
          <Link
            to="/academics"
            className="text-accent underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
          >
            Browse by specialty instead
          </Link>
        </li>
      </ul>
    </div>
  );
}
