// =============================================================================
// academics/search/components/SearchBar.tsx — Large + compact search input
// =============================================================================

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
} from 'react';
import { Search, X } from 'lucide-react';
import {
  useSearchSuggestions,
  getRecentSearches,
  clearRecentSearches,
  type Suggestion,
} from '../hooks/useSearch';
import { RecentSearches } from './RecentSearches';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchBarProps {
  variant?: 'large' | 'compact';
  initialValue?: string;
  onSearch: (q: string) => void;
  autoFocus?: boolean;
}

type SuggestionGroup = {
  type: Suggestion['type'];
  label: string;
  items: Suggestion[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<Suggestion['type'], string> = {
  subject: 'Subjects',
  system: 'Systems',
  topic: 'Topics',
  author: 'Authors',
};

function groupSuggestions(suggestions: Suggestion[]): SuggestionGroup[] {
  const map = new Map<Suggestion['type'], Suggestion[]>();
  for (const s of suggestions) {
    const existing = map.get(s.type) ?? [];
    existing.push(s);
    map.set(s.type, existing);
  }
  return Array.from(map.entries()).map(([type, items]) => ({
    type,
    label: TYPE_LABELS[type],
    items,
  }));
}

// Flat list of all suggestion items across groups (for keyboard nav)
function flattenSuggestions(groups: SuggestionGroup[]): Suggestion[] {
  return groups.flatMap((g) => g.items);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchBar({
  variant = 'large',
  initialValue = '',
  onSearch,
  autoFocus = false,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // Force re-render of recent searches when cleared
  const [recentVersion, setRecentVersion] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep value in sync with initialValue prop changes (e.g., URL param changes)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Suggestions query — only fires when value has 1+ non-space chars
  const { data: suggestions = [] } = useSearchSuggestions(value);

  const groups = groupSuggestions(suggestions);
  const flatSuggestions = flattenSuggestions(groups);

  const showDropdown = focused && (value.trim().length === 0 || suggestions.length > 0);
  const showRecents = focused && value.trim().length === 0;
  const showSuggestions = focused && value.trim().length >= 1 && suggestions.length > 0;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setFocused(false);
      setHighlightedIndex(-1);
      onSearch(trimmed);
    },
    [onSearch],
  );

  const handleSelect = useCallback(
    (q: string) => {
      setValue(q);
      handleSubmit(q);
    },
    [handleSubmit],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    const total = showSuggestions ? flatSuggestions.length : getRecentSearches().length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        if (showSuggestions && flatSuggestions[highlightedIndex]) {
          handleSelect(flatSuggestions[highlightedIndex].label);
        } else if (showRecents) {
          const recents = getRecentSearches();
          if (recents[highlightedIndex]) {
            handleSelect(recents[highlightedIndex]);
          }
        }
      } else {
        handleSubmit(value);
      }
    } else if (e.key === 'Escape') {
      setFocused(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const isLarge = variant === 'large';

  const inputClasses = isLarge
    ? 'w-full rounded-xl border border-border bg-white text-ink placeholder-ink-muted shadow-card focus:outline-none focus:ring-2 focus:ring-accent py-4 pl-12 pr-16 text-base transition-shadow'
    : 'w-full rounded-full border border-border bg-white text-ink placeholder-ink-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-accent py-2 pl-9 pr-3 text-sm transition-shadow';

  const iconSize = isLarge ? 20 : 16;
  const iconLeft = isLarge ? 'left-4' : 'left-3';

  // Dropdown rendering for suggestion groups
  let recentHighlightOffset = 0;
  void recentHighlightOffset; // suppress unused warning — used via closures below

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Form wrapper */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(value);
        }}
      >
        {/* Search icon */}
        <span
          className={`pointer-events-none absolute ${iconLeft} top-1/2 -translate-y-1/2 text-ink-muted`}
          aria-hidden="true"
        >
          <Search size={iconSize} />
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-activedescendant={
            highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined
          }
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            isLarge ? 'Search chapters, topics, subjects…' : 'Search chapters… (Ctrl+K)'
          }
          className={inputClasses}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Clear button — large variant only */}
        {isLarge && value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue('');
              setHighlightedIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted hover:text-ink hover:bg-bg transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-white shadow-card-hover overflow-hidden"
        >
          {/* Recent searches panel */}
          {showRecents && (
            <RecentSearches
              key={recentVersion}
              onSelect={handleSelect}
              onClear={() => {
                clearRecentSearches();
                setRecentVersion((v) => v + 1);
              }}
            />
          )}

          {/* Suggestions grouped by type */}
          {showSuggestions && (
            <div className="py-2">
              {groups.map((group) => {
                return (
                  <div key={group.type}>
                    <div className="px-4 py-1">
                      <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                        {group.label}
                      </span>
                    </div>
                    {group.items.map((item) => {
                      const flatIndex = flatSuggestions.findIndex(
                        (s) => s.id === item.id && s.type === item.type,
                      );
                      const isHighlighted = highlightedIndex === flatIndex;
                      return (
                        <button
                          key={`${item.type}-${item.id}`}
                          id={`suggestion-${flatIndex}`}
                          role="option"
                          aria-selected={isHighlighted}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelect(item.label)}
                          onMouseEnter={() => setHighlightedIndex(flatIndex)}
                          className={`flex w-full items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
                            isHighlighted
                              ? 'bg-bg text-accent'
                              : 'text-ink hover:bg-bg'
                          }`}
                        >
                          <Search
                            size={13}
                            className="shrink-0 text-ink-muted"
                            aria-hidden="true"
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.sublabel && (
                            <span className="text-xs text-ink-muted truncate max-w-[120px]">
                              {item.sublabel}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
