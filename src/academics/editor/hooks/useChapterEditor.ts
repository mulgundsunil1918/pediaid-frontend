// =============================================================================
// editor/hooks/useChapterEditor.ts — React Query mutations for the editor
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { AcademicsApiError } from '../../api/academics.api';
import type { ChapterDetail, ChapterPayload } from '../types/editor.types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

// ---------------------------------------------------------------------------
// Typed fetch helper (same pattern as academics.api.ts)
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken, clearAuth } = useAuthStore.getState();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.dispatchEvent(new CustomEvent('acad:unauthorized'));
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new AcademicsApiError(body.message ?? 'Unauthorized', 401);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new AcademicsApiError(
      body.message ?? `Request failed: ${res.status}`,
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// useChapterDraft — load an existing chapter for editing
// ---------------------------------------------------------------------------

export function useChapterDraft(chapterId: string | undefined) {
  return useQuery({
    queryKey: ['editor', 'chapter', chapterId],
    queryFn: () =>
      apiFetch<ChapterDetail>(`/api/academics/chapters/id/${chapterId}`),
    enabled: Boolean(chapterId),
    staleTime: Infinity, // Editor owns this copy; no background refetch
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// useCreateChapter — POST /api/academics/chapters
// ---------------------------------------------------------------------------

export function useCreateChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChapterPayload) =>
      apiFetch<{ id: string }>('/api/academics/chapters', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academics', 'chapters'] });
    },
  });
}

// ---------------------------------------------------------------------------
// useSaveDraft — PUT /api/academics/chapters/:id
// ---------------------------------------------------------------------------

export function useSaveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ChapterPayload;
    }) =>
      apiFetch<{ id: string }>(`/api/academics/chapters/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ['editor', 'chapter', id] });
      void qc.invalidateQueries({ queryKey: ['academics', 'chapters'] });
    },
  });
}

// ---------------------------------------------------------------------------
// useSubmitChapter — POST /api/academics/chapters/:id/submit
// ---------------------------------------------------------------------------

export function useSubmitChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chapterId: string) =>
      apiFetch<void>(`/api/academics/chapters/${chapterId}/submit`, {
        method: 'POST',
      }),
    onSuccess: (_data, chapterId) => {
      void qc.invalidateQueries({ queryKey: ['editor', 'chapter', chapterId] });
      void qc.invalidateQueries({ queryKey: ['academics', 'chapters'] });
    },
  });
}

// ---------------------------------------------------------------------------
// useUploadImage — POST /api/academics/upload/image (multipart)
// ---------------------------------------------------------------------------

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      const form = new FormData();
      form.append('image', file);
      return apiFetch<{ url: string }>('/api/academics/upload/image', {
        method: 'POST',
        body: form,
      });
    },
  });
}
