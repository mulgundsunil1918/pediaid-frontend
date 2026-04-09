// =============================================================================
// moderation/hooks/useModeration.ts
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { AcademicsApiError } from '../../api/academics.api';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken, clearAuth } = useAuthStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) { clearAuth(); window.dispatchEvent(new CustomEvent('acad:unauthorized')); }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new AcademicsApiError(body.message ?? `Request failed: ${res.status}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueueItem {
  id: string;
  title: string;
  slug: string;
  submittedAt: string;
  hoursInQueue: number;
  readingTimeMinutes: number;
  subjectCode: string;
  subjectName: string;
  systemName: string;
  topicName: string;
  authorId: string;
  authorFullName: string;
  authorQualification: string | null;
  authorInstitution: string | null;
  authorCredentialsVerified: boolean;
}

export interface ModerationStats {
  pending: number;
  reviewedToday: number;
  avgHoursInQueue: number;
}

export interface HistoryItem {
  id: string;
  chapterId: string;
  chapterTitle: string;
  chapterSlug: string;
  authorName: string;
  action: 'approved' | 'rejected' | 'request_changes';
  performedAt: string;
  notes: string | null;
}

export interface HistoryFilters {
  action?: 'approved' | 'rejected' | 'request_changes';
  period?: 'today' | 'week' | 'month' | 'all';
  page?: number;
}

// ---------------------------------------------------------------------------
// ModeratorReviewChapter — exact shape returned by GET /chapters/id/:id
//
// This is intentionally NOT the same type as ReaderChapter, because the
// backend endpoint powering the moderator review returns a flat payload
// (topicName/systemName/subjectCode as top-level strings, content as a
// plain block array, author.name instead of author.fullName) produced by
// ContentService.resolveChapter() on the backend. Using the reader type
// here was the root cause of the blank-page bug — the component was
// reading `chapter.content.blocks` (undefined) and `chapter.author.fullName`
// (undefined) and crashing during render.
// ---------------------------------------------------------------------------

export interface ModeratorReviewChapter {
  id: string;
  title: string;
  slug: string;
  abstract: string | null;
  status:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'changes_requested'
    | 'archived';
  authorId: string;
  authorName: string;
  authorQualification: string | null;
  authorCredentialsVerified: boolean;
  readingTimeMinutes: number;
  viewCount: number;
  publishedAt: string | null;
  submittedAt: string | null;
  version: number;
  /** Backend returns the blocks list directly as an array at this key. */
  content: Array<Record<string, unknown>>;
  references: Array<Record<string, unknown>>;
  author: {
    id: string;
    /** Backend uses "name", not "fullName" */
    name: string;
    qualification: string | null;
    institution: string | null;
    credentialsVerified: boolean;
  };
  topicId: string;
  topicName: string;
  systemName: string;
  subjectCode: string;
  subjectName: string;
  createdAt: string;
  updatedAt: string;
  moderatorNotes: string | null;
  reviewedAt: string | null;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useModerationQueue() {
  return useQuery({
    queryKey: ['moderation', 'queue'],
    queryFn: () => apiFetch<QueueItem[]>('/api/academics/moderation/queue'),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useChapterForReview(id: string | undefined) {
  return useQuery<ModeratorReviewChapter, AcademicsApiError>({
    queryKey: ['moderation', 'review', id],
    queryFn: () =>
      apiFetch<ModeratorReviewChapter>(`/api/academics/chapters/id/${id}`),
    enabled: Boolean(id),
    staleTime: 0,
    retry: false,
  });
}

export function useModerationStats() {
  return useQuery({
    queryKey: ['moderation', 'stats'],
    queryFn: () => apiFetch<ModerationStats>('/api/academics/moderation/stats'),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useModerationHistory(filters: HistoryFilters = {}) {
  const params = new URLSearchParams();
  if (filters.action) params.set('action', filters.action);
  if (filters.period) params.set('period', filters.period);
  if (filters.page) params.set('page', String(filters.page));
  return useQuery({
    queryKey: ['moderation', 'history', filters],
    queryFn: () =>
      apiFetch<{ data: HistoryItem[]; total: number }>(
        `/api/academics/moderation/reviewed?${params}`,
      ),
    staleTime: 60_000,
  });
}

function useModAction(endpoint: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      apiFetch<void>(`/api/academics/chapters/${id}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['moderation'] });
      void qc.invalidateQueries({ queryKey: ['academics', 'chapters'] });
    },
  });
}

export const useApproveChapter = () => useModAction('approve');
export const useRejectChapter = () => useModAction('reject');
export const useRequestChanges = () => useModAction('request-changes');
