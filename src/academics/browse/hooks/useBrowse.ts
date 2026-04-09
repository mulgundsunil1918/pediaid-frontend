// =============================================================================
// browse/hooks/useBrowse.ts — React Query hooks for taxonomy + chapter data
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import {
  getSubjects,
  getSystems,
  getTopics,
  getChapters,
} from '../../api/academics.api';

// Query key factory — keeps cache keys consistent across the app
export const browseKeys = {
  subjects: () => ['academics', 'subjects'] as const,
  systems: (subjectId: string) =>
    ['academics', 'systems', subjectId] as const,
  topics: (systemId: string) =>
    ['academics', 'topics', systemId] as const,
  chapters: (topicId: string, page: number) =>
    ['academics', 'chapters', topicId, page] as const,
};

// ---------------------------------------------------------------------------
// useSubjects
// ---------------------------------------------------------------------------

export function useSubjects() {
  return useQuery({
    queryKey: browseKeys.subjects(),
    queryFn: getSubjects,
    staleTime: 5 * 60 * 1_000, // 5 minutes
  });
}

// ---------------------------------------------------------------------------
// useSystems
// ---------------------------------------------------------------------------

export function useSystems(subjectId: string | undefined) {
  return useQuery({
    queryKey: browseKeys.systems(subjectId ?? ''),
    queryFn: () => getSystems(subjectId!),
    enabled: Boolean(subjectId),
    staleTime: 5 * 60 * 1_000,
  });
}

// ---------------------------------------------------------------------------
// useTopics
// ---------------------------------------------------------------------------

export function useTopics(systemId: string | undefined) {
  return useQuery({
    queryKey: browseKeys.topics(systemId ?? ''),
    queryFn: () => getTopics(systemId!),
    enabled: Boolean(systemId),
    staleTime: 5 * 60 * 1_000,
  });
}

// ---------------------------------------------------------------------------
// useChapterList
// ---------------------------------------------------------------------------

export function useChapterList(topicId: string | undefined, page = 1) {
  return useQuery({
    queryKey: browseKeys.chapters(topicId ?? '', page),
    queryFn: () => getChapters(topicId!, page),
    enabled: Boolean(topicId),
    staleTime: 2 * 60 * 1_000, // 2 minutes — chapters change more frequently
    placeholderData: (prev) => prev, // keep previous page visible while loading next
  });
}

// ---------------------------------------------------------------------------
// Recent Guides + Taxonomy Tree (Home page)
// ---------------------------------------------------------------------------

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface RecentGuide {
  id: string;
  title: string;
  slug: string;
  abstract: string | null;
  authorName: string;
  authorQualification: string | null;
  readingTimeMinutes: number;
  publishedAt: string | null;
  topicId: string;
  topicName: string;
  systemName: string;
  subjectCode: string;
  subjectName: string;
}

export function useRecentGuides(limit = 12) {
  return useQuery<RecentGuide[], Error>({
    queryKey: ['academics', 'recent-guides', limit],
    queryFn: async () => {
      const res = await fetchJson<{ data: RecentGuide[] }>(
        `/api/academics/chapters/recent?limit=${limit}`,
      );
      return res.data;
    },
    staleTime: 60 * 1_000,
  });
}

export interface TaxonomyTreeTopic {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  chapterCount: number;
}
export interface TaxonomyTreeSystem {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  displayOrder: number;
  topics: TaxonomyTreeTopic[];
}
export interface TaxonomyTreeSubject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  displayOrder: number;
  systems: TaxonomyTreeSystem[];
}

export function useTaxonomyTree() {
  return useQuery<TaxonomyTreeSubject[], Error>({
    queryKey: ['academics', 'taxonomy-tree'],
    queryFn: async () => {
      const res = await fetchJson<{ data: TaxonomyTreeSubject[] }>(
        `/api/academics/taxonomy/tree`,
      );
      return res.data;
    },
    staleTime: 10 * 60 * 1_000,
  });
}
