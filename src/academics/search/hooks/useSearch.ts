// =============================================================================
// academics/search/hooks/useSearch.ts — Search query hooks + localStorage utils
// =============================================================================

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { AcademicsApiError } from '../../api/academics.api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  abstract: string | null;
  snippet: string | null; // highlighted snippet from content
  authorName: string;
  authorQualification: string | null;
  subjectCode: string;
  subjectName: string;
  systemName: string;
  topicName: string;
  readingTimeMinutes: number;
  publishedAt: string;
  viewCount: number;
}

export interface SearchFilters {
  q: string;
  subjectId?: string;
  systemId?: string;
  topicId?: string;
  page?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  took: number; // ms
}

export interface Suggestion {
  type: 'subject' | 'system' | 'topic' | 'author';
  label: string;
  sublabel?: string;
  id: string;
}

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function searchFetch<T>(path: string): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE}${path}`, { headers });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new AcademicsApiError(
      body.message ?? `Request failed: ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// useSearch
// ---------------------------------------------------------------------------

export function useSearch(filters: SearchFilters) {
  const params = new URLSearchParams();
  params.set('q', filters.q);
  if (filters.subjectId) params.set('subjectId', filters.subjectId);
  if (filters.systemId) params.set('systemId', filters.systemId);
  if (filters.topicId) params.set('topicId', filters.topicId);
  if (filters.page) params.set('page', String(filters.page));

  return useQuery<SearchResponse, AcademicsApiError>({
    queryKey: ['search', filters],
    queryFn: () => searchFetch<SearchResponse>(`/api/academics/search?${params}`),
    enabled: filters.q.trim().length >= 2,
    staleTime: 30 * 1_000, // 30 seconds
    placeholderData: keepPreviousData,
  });
}

// ---------------------------------------------------------------------------
// useSearchSuggestions
// ---------------------------------------------------------------------------

export function useSearchSuggestions(q: string) {
  const params = new URLSearchParams({ q });

  return useQuery<Suggestion[], AcademicsApiError>({
    queryKey: ['search', 'suggest', q],
    queryFn: () => searchFetch<Suggestion[]>(`/api/academics/search/suggest?${params}`),
    enabled: q.trim().length >= 1,
    staleTime: 60 * 1_000, // 60 seconds
  });
}

// ---------------------------------------------------------------------------
// Recent searches — localStorage utilities (not hooks)
// ---------------------------------------------------------------------------

const RECENT_KEY = 'acad-recent-searches';
const MAX_RECENT = 8;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter((item): item is string => typeof item === 'string')
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function addRecentSearch(q: string): void {
  const trimmed = q.trim();
  if (!trimmed) return;
  const existing = getRecentSearches();
  const deduped = [trimmed, ...existing.filter((s) => s !== trimmed)].slice(
    0,
    MAX_RECENT,
  );
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(deduped));
  } catch {
    // ignore storage errors
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore storage errors
  }
}
