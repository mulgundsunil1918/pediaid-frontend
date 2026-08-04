// =============================================================================
// academics/cme/components/CMEFilterBar.tsx
//
// Search, state and mode filters for the CME list.
//
// The list was a single reverse-chronological scroll. That is fine at twenty
// events and useless at a thousand: the constraint isn't the database, it's
// that nobody scrolls that far. These three filters are what actually decide
// whether someone can attend — can I get there, can I join from home, and is
// it about the thing I care about.
//
// The state dropdown is populated from GET /cme/filter-options rather than a
// list hardcoded here, so the options, the validation and the stored values
// all come from one place and cannot drift.
//
// Search is debounced. Firing a full-text query on every keystroke would send
// roughly one request per character, and the answer for "neon" is thrown away
// the moment "neona" is typed.
// =============================================================================

import { useEffect, useState } from 'react';
import { Search, X, MapPin, Monitor } from 'lucide-react';
import { useCMEFilterOptions } from '../hooks/useCME';
import type { CMEFilters } from '../hooks/useCME';

type Mode = NonNullable<CMEFilters['mode']>;

const MODE_LABELS: Record<Mode, string> = {
  online: 'Online',
  in_person: 'In person',
  hybrid: 'Hybrid',
};

interface CMEFilterBarProps {
  state: string;
  mode: Mode | '';
  search: string;
  onStateChange: (value: string) => void;
  onModeChange: (value: Mode | '') => void;
  /** Fires debounced, not per keystroke. */
  onSearchChange: (value: string) => void;
  /** Shown alongside the clear control so a filtered empty list is explicable. */
  resultCount?: number;
}

export function CMEFilterBar({
  state,
  mode,
  search,
  onStateChange,
  onModeChange,
  onSearchChange,
  resultCount,
}: CMEFilterBarProps) {
  const { data: options } = useCMEFilterOptions();

  // Local copy so typing stays responsive while the committed value lags.
  const [draft, setDraft] = useState(search);

  // Keep in step when the parent clears filters from outside.
  useEffect(() => {
    setDraft(search);
  }, [search]);

  useEffect(() => {
    if (draft === search) return;
    const t = setTimeout(() => onSearchChange(draft), 300);
    return () => clearTimeout(t);
  }, [draft, search, onSearchChange]);

  const hasFilters = Boolean(state || mode || search);

  function clearAll() {
    setDraft('');
    onSearchChange('');
    onStateChange('');
    onModeChange('');
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search by title, speaker, venue or city…"
          aria-label="Search CME events"
          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border text-sm text-ink bg-white focus:outline-none focus:border-accent"
        />
      </div>

      {/* Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <MapPin
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
            aria-hidden="true"
          />
          <select
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            aria-label="Filter by state"
            className="pl-8 pr-8 py-2 rounded-xl border border-border text-sm text-ink bg-white focus:outline-none focus:border-accent appearance-none cursor-pointer"
          >
            <option value="">Any state</option>
            {(options?.states ?? []).map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Monitor
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
            aria-hidden="true"
          />
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as Mode | '')}
            aria-label="Filter by attendance mode"
            className="pl-8 pr-8 py-2 rounded-xl border border-border text-sm text-ink bg-white focus:outline-none focus:border-accent appearance-none cursor-pointer"
          >
            <option value="">Online or in person</option>
            {(options?.modes ?? []).map((m) => (
              <option key={m} value={m}>
                {MODE_LABELS[m] ?? m}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-ink-muted hover:text-ink hover:bg-gray-50"
          >
            <X size={14} aria-hidden="true" />
            Clear
          </button>
        )}

        {hasFilters && resultCount != null && (
          <span className="text-sm text-ink-muted ml-auto">
            {resultCount} {resultCount === 1 ? 'event' : 'events'}
          </span>
        )}
      </div>

      {/* Filtering to a state hides online events, which is rarely what someone
          means — say so rather than leave them wondering where those went. */}
      {state && !mode && (
        <p className="text-xs text-ink-muted">
          Showing events in this state. Online events have no location — pick
          "Online" above to see those.
        </p>
      )}
    </div>
  );
}
