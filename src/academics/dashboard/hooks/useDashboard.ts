// =============================================================================
// academics/dashboard/hooks/useDashboard.ts — React Query hooks for the
// Author Dashboard (stats, my chapters, profile, upgrade)
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { AcademicsApiError } from '../../api/academics.api';

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalChapters: number;
  publishedChapters: number;
  pendingChapters: number;
  rejectedChapters: number;
  totalViews: number;
  totalReadTime: number; // minutes
}

export interface MyChapter {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'changes_requested' | 'archived';
  topicName: string;
  systemName: string;
  subjectCode: string;
  version: number;
  updatedAt: string;
  publishedAt: string | null;
  moderatorNotes: string | null;
  viewCount: number;
  readingTimeMinutes: number;
}

export interface DashboardProfile {
  id: string;
  email: string;
  fullName: string;
  qualification: string | null;
  institution: string | null;
  bio: string | null;
  orcid: string | null;
  role: 'reader' | 'author' | 'moderator' | 'admin';
  credentialsVerified: boolean;
  createdAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  qualification?: string;
  institution?: string;
  bio?: string;
  orcid?: string;
}

// ---------------------------------------------------------------------------
// Internal fetch wrapper — mirrors academics.api.ts pattern
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

  const response = await fetch(`${BASE}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearAuth();
    window.dispatchEvent(new CustomEvent('acad:unauthorized'));
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new AcademicsApiError(body.message ?? 'Unauthorized', 401);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new AcademicsApiError(
      body.message ?? `Request failed: ${response.status}`,
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => ['dashboard', 'stats'] as const,
  chapters: (status?: string) =>
    ['dashboard', 'chapters', status ?? 'all'] as const,
  profile: () => ['dashboard', 'profile'] as const,
};

// ---------------------------------------------------------------------------
// useDashboardStats
// ---------------------------------------------------------------------------

export function useDashboardStats() {
  return useQuery<DashboardStats, AcademicsApiError>({
    queryKey: dashboardKeys.stats(),
    queryFn: () => apiFetch<DashboardStats>('/api/academics/dashboard/stats'),
    staleTime: 60 * 1_000, // 60 seconds
  });
}

// ---------------------------------------------------------------------------
// useMyChapters
// ---------------------------------------------------------------------------

export function useMyChapters(status?: string) {
  const url =
    status && status !== 'all'
      ? `/api/academics/dashboard/chapters?status=${encodeURIComponent(status)}`
      : '/api/academics/dashboard/chapters';

  return useQuery<MyChapter[], AcademicsApiError>({
    queryKey: dashboardKeys.chapters(status),
    queryFn: () => apiFetch<MyChapter[]>(url),
    staleTime: 30 * 1_000, // 30 seconds
  });
}

// ---------------------------------------------------------------------------
// useMyProfile
// ---------------------------------------------------------------------------

export function useMyProfile() {
  return useQuery<DashboardProfile, AcademicsApiError>({
    queryKey: dashboardKeys.profile(),
    queryFn: () => apiFetch<DashboardProfile>('/api/academics/me'),
    staleTime: 5 * 60 * 1_000, // 5 minutes
  });
}

// ---------------------------------------------------------------------------
// useUpdateProfile
// ---------------------------------------------------------------------------

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<DashboardProfile, AcademicsApiError, UpdateProfileInput>({
    mutationFn: (input: UpdateProfileInput) =>
      apiFetch<DashboardProfile>('/api/academics/me', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.profile() });
    },
  });
}

// ---------------------------------------------------------------------------
// useUpgradeToAuthor
// ---------------------------------------------------------------------------

export function useUpgradeToAuthor() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AcademicsApiError, void>({
    mutationFn: () =>
      apiFetch<{ message: string }>('/api/academics/dashboard/upgrade', {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
