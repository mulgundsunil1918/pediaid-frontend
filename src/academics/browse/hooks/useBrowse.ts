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
