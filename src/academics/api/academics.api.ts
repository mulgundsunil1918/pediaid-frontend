// =============================================================================
// academics/api/academics.api.ts — typed API client for PediAid Academics
// =============================================================================

import { useAuthStore } from '../../store/authStore';
import type {
  Subject,
  AcadSystem,
  Topic,
  PaginatedChapters,
  ApiError,
} from '../types';

// ---------------------------------------------------------------------------
// Base URL — empty string in dev (Vite proxy handles /api → backend)
// ---------------------------------------------------------------------------

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken, clearAuth } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid — wipe local auth state
    clearAuth();
    // Redirect to login without a hard reload
    window.dispatchEvent(new CustomEvent('acad:unauthorized'));
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new AcademicsApiError(body.message ?? 'Unauthorized', 401);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Partial<ApiError>;
    throw new AcademicsApiError(
      body.message ?? `Request failed: ${response.status}`,
      response.status,
    );
  }

  // 204 No Content — return undefined cast to T
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Custom error class — carries statusCode for conditional handling in UI
// ---------------------------------------------------------------------------

export class AcademicsApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AcademicsApiError';
  }
}

// ---------------------------------------------------------------------------
// Taxonomy endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/academics/subjects
 * Returns all active subjects with system count.
 */
export async function getSubjects(): Promise<Subject[]> {
  return apiFetch<Subject[]>('/api/academics/subjects');
}

/**
 * GET /api/academics/subjects/:subjectId/systems
 * Returns all active systems for a subject with topic count.
 */
export async function getSystems(subjectId: string): Promise<AcadSystem[]> {
  return apiFetch<AcadSystem[]>(`/api/academics/subjects/${subjectId}/systems`);
}

/**
 * GET /api/academics/systems/:systemId/topics
 * Returns all active topics for a system with chapter count.
 */
export async function getTopics(systemId: string): Promise<Topic[]> {
  return apiFetch<Topic[]>(`/api/academics/systems/${systemId}/topics`);
}

/**
 * GET /api/academics/topics/:topicId/chapters
 * Returns paginated chapters for a topic.
 * Passes auth token if present so authors can see their own non-approved chapters.
 */
export async function getChapters(
  topicId: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedChapters> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiFetch<PaginatedChapters>(
    `/api/academics/topics/${topicId}/chapters?${params}`,
  );
}
