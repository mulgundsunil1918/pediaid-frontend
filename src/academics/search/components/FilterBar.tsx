// =============================================================================
// academics/search/components/FilterBar.tsx — Subject / System / Topic filters
// =============================================================================

import { ChevronDown, X } from 'lucide-react';
import {
  useSubjects,
  useSystems,
  useTopics,
} from '../../browse/hooks/useBrowse';
import type { SearchFilters } from '../hooks/useSearch';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FilterBarProps {
  filters: SearchFilters;
  onFiltersChange: (f: SearchFilters) => void;
}

// ---------------------------------------------------------------------------
// Sub-component: styled select
// ---------------------------------------------------------------------------

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  disabled = false,
  children,
}: FilterSelectProps) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-8 text-sm text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[140px]"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted">
        <ChevronDown size={14} aria-hidden="true" />
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: systems = [], isLoading: systemsLoading } = useSystems(
    filters.subjectId,
  );
  const { data: topics = [], isLoading: topicsLoading } = useTopics(
    filters.systemId,
  );

  const hasActiveFilters = Boolean(
    filters.subjectId || filters.systemId || filters.topicId,
  );

  function handleSubjectChange(subjectId: string) {
    onFiltersChange({
      ...filters,
      subjectId: subjectId || undefined,
      // Reset downstream selections
      systemId: undefined,
      topicId: undefined,
      page: 1,
    });
  }

  function handleSystemChange(systemId: string) {
    onFiltersChange({
      ...filters,
      systemId: systemId || undefined,
      topicId: undefined,
      page: 1,
    });
  }

  function handleTopicChange(topicId: string) {
    onFiltersChange({
      ...filters,
      topicId: topicId || undefined,
      page: 1,
    });
  }

  function handleClearFilters() {
    onFiltersChange({
      ...filters,
      subjectId: undefined,
      systemId: undefined,
      topicId: undefined,
      page: 1,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Subject */}
      <FilterSelect
        id="filter-subject"
        label="Filter by subject"
        value={filters.subjectId ?? ''}
        onChange={handleSubjectChange}
        disabled={subjectsLoading}
      >
        <option value="">All subjects</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </FilterSelect>

      {/* System — only when subject selected */}
      {filters.subjectId && (
        <FilterSelect
          id="filter-system"
          label="Filter by system"
          value={filters.systemId ?? ''}
          onChange={handleSystemChange}
          disabled={systemsLoading}
        >
          <option value="">All systems</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </FilterSelect>
      )}

      {/* Topic — only when system selected */}
      {filters.systemId && (
        <FilterSelect
          id="filter-topic"
          label="Filter by topic"
          value={filters.topicId ?? ''}
          onChange={handleTopicChange}
          disabled={topicsLoading}
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </FilterSelect>
      )}

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearFilters}
          className="flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink-muted hover:text-danger hover:border-danger transition-colors"
        >
          <X size={14} aria-hidden="true" />
          Clear filters
        </button>
      )}
    </div>
  );
}
