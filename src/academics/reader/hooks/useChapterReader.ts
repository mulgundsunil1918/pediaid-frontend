// =============================================================================
// reader/hooks/useChapterReader.ts
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
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
// Types
// ---------------------------------------------------------------------------

export interface ReaderChapter {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  version: number;
  readingTimeMinutes: number;
  abstract: string | null;
  publishedAt: string | null;
  content: { blocks: import('../../editor/types/editor.types').ApiBlock[] };
  chapterReferences: import('../../editor/types/editor.types').ChapterReference[];
  references: import('../../editor/types/editor.types').ChapterReference[];
  featuredImageUrl: string;
  authorId: string;
  coAuthors: string[];
  moderatorNotes: string | null;
  reviewedAt: string | null;
  subject: { id: string; name: string; code: string };
  system: { id: string; name: string };
  topic: { id: string; name: string };
  author: ReaderAuthor;
  moderator: ReaderAuthor | null;
  coAuthorProfiles: ReaderAuthor[];
}

export interface ReaderAuthor {
  id: string;
  fullName: string;
  qualification: string | null;
  specialty: string | null;
  institution: string | null;
  credentialsVerified: boolean;
  orcidId: string | null;
  profileImageUrl: string | null;
}

export interface Comment {
  id: string;
  parentId: string | null;
  authorId: string;
  content: string;
  depth: number;
  isDeleted: boolean;
  isEdited: boolean;
  isFlagged: boolean;
  createdAt: string;
  editedAt: string | null;
  author: {
    id: string;
    fullName: string;
    qualification: string | null;
    credentialsVerified: boolean;
  };
  replies?: Comment[];
}

export interface CommentsPage {
  data: Comment[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// useChapterBySlug
// ---------------------------------------------------------------------------

export function useChapterBySlug(slug: string | undefined) {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['reader', 'chapter', slug],
    queryFn: () => apiFetch<ReaderChapter>(`/api/academics/chapters/${slug}`),
    enabled: Boolean(slug),
    staleTime: 2 * 60 * 1_000,
    retry: (count, err) => {
      if (err instanceof AcademicsApiError && (err.statusCode === 404 || err.statusCode === 403)) {
        return false;
      }
      return count < 1;
    },
  });

  // Navigate away on 404/403
  useEffect(() => {
    if (query.isError && query.error instanceof AcademicsApiError) {
      if (query.error.statusCode === 404) {
        navigate('/academics', { replace: true, state: { toast: 'Chapter not found.' } });
      } else if (query.error.statusCode === 403) {
        navigate('/academics', { replace: true, state: { toast: 'Access denied.' } });
      }
    }
  }, [query.isError, query.error, navigate]);

  return query;
}

// ---------------------------------------------------------------------------
// useComments
// ---------------------------------------------------------------------------

export function useComments(chapterId: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['reader', 'comments', chapterId, page],
    queryFn: () =>
      apiFetch<CommentsPage>(
        `/api/academics/chapters/${chapterId}/comments?page=${page}&pageSize=20`,
      ),
    enabled: Boolean(chapterId),
    staleTime: 60 * 1_000,
  });
}

// ---------------------------------------------------------------------------
// usePostComment
// ---------------------------------------------------------------------------

export function usePostComment(chapterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: string; parentId?: string }) =>
      apiFetch<Comment>(`/api/academics/chapters/${chapterId}/comments`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reader', 'comments', chapterId] });
    },
  });
}

// ---------------------------------------------------------------------------
// useEditComment
// ---------------------------------------------------------------------------

export function useEditComment(chapterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      apiFetch<Comment>(`/api/academics/comments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reader', 'comments', chapterId] });
    },
  });
}

// ---------------------------------------------------------------------------
// useFlagComment
// ---------------------------------------------------------------------------

export function useFlagComment(chapterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<void>(`/api/academics/comments/${id}/flag`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reader', 'comments', chapterId] });
    },
  });
}
