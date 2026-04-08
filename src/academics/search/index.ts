// =============================================================================
// academics/search/index.ts — Public API for the Search module
// =============================================================================

// ---------------------------------------------------------------------------
// Pages & global components
// ---------------------------------------------------------------------------
export { SearchPage } from './SearchPage';
export { GlobalSearchBar } from './GlobalSearchBar';

// ---------------------------------------------------------------------------
// Sub-components (individually re-exported for flexible use)
// ---------------------------------------------------------------------------
export { SearchBar } from './components/SearchBar';
export { FilterBar } from './components/FilterBar';
export { RecentSearches } from './components/RecentSearches';
export { SearchResultCard } from './components/SearchResultCard';
export { SearchResultsSummary } from './components/SearchResultsSummary';
export { NoResultsState } from './components/NoResultsState';
export { SearchPagination } from './components/SearchPagination';

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export { useSearch, useSearchSuggestions } from './hooks/useSearch';

// ---------------------------------------------------------------------------
// localStorage utilities
// ---------------------------------------------------------------------------
export {
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
} from './hooks/useSearch';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type {
  SearchResult,
  SearchFilters,
  SearchResponse,
  Suggestion,
} from './hooks/useSearch';

// Re-export SearchBarProps for consumers embedding SearchBar
export type { SearchBarProps } from './components/SearchBar';
