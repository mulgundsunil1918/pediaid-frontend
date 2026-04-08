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
  return useQuery({
    queryKey: ['moderation', 'review', id],
    queryFn: () => apiFetch<import('../../reader/hooks/useChapterReader').ReaderChapter>(
      `/api/academics/chapters/id/${id}`,
    ),
    enabled: Boolean(id),
    staleTime: 0,
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
