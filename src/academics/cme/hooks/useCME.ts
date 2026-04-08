// =============================================================================
// academics/cme/hooks/useCME.ts — React Query hooks for CME Events module
// =============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { AcademicsApiError } from '../../api/academics.api';

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface Speaker {
  id: string;
  name: string;
  title: string;
  institution: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface CMEEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string | null;
  eventType: 'webinar' | 'workshop' | 'conference' | 'course';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  startsAt: string;
  endsAt: string;
  timezone: string;
  venue: string | null;
  onlineUrl: string | null;
  maxAttendees: number | null;
  registeredCount: number;
  creditHours: number;
  creditType: string;
  price: number;
  currency: string;
  coverImageUrl: string | null;
  speakers: Speaker[];
  tags: string[];
  isRegistered: boolean;
  certificateAvailable: boolean;
}

export interface Certificate {
  id: string;
  eventTitle: string;
  recipientName: string;
  creditHours: number;
  creditType: string;
  completedAt: string;
  verificationCode: string;
  issuedAt: string;
}

export interface CMEFilters {
  status?: 'upcoming' | 'ongoing' | 'completed';
  eventType?: string;
  page?: number;
}

interface CMEEventsResponse {
  data: CMEEvent[];
  total: number;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper (mirrors academics.api.ts pattern)
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new AcademicsApiError(body.message ?? 'Unauthorized', 401);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new AcademicsApiError(
      body.message ?? `Request failed: ${response.status}`,
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/**
 * GET /api/academics/cme/events
 * Returns paginated list of CME events, filtered by status / eventType / page.
 */
export function useCMEEvents(filters: CMEFilters) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.eventType) params.set('eventType', filters.eventType);
  if (filters.page != null) params.set('page', String(filters.page));

  const qs = params.toString();

  return useQuery<CMEEventsResponse, AcademicsApiError>({
    queryKey: ['cme', 'events', filters],
    queryFn: () =>
      apiFetch<CMEEventsResponse>(
        `/api/academics/cme/events${qs ? `?${qs}` : ''}`,
      ),
    staleTime: 60_000,
  });
}

/**
 * GET /api/academics/cme/events/:slug
 * Returns full detail for a single event.
 */
export function useCMEEvent(slug: string) {
  return useQuery<CMEEvent, AcademicsApiError>({
    queryKey: ['cme', 'event', slug],
    queryFn: () => apiFetch<CMEEvent>(`/api/academics/cme/events/${slug}`),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

/**
 * GET /api/academics/cme/certificates
 * Returns certificates earned by the authenticated user.
 */
export function useMyCertificates() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  return useQuery<Certificate[], AcademicsApiError>({
    queryKey: ['cme', 'certificates'],
    queryFn: () => apiFetch<Certificate[]>('/api/academics/cme/certificates'),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/**
 * POST /api/academics/cme/events/:id/register
 * Registers the authenticated user for an event.
 */
export function useRegisterForEvent() {
  const queryClient = useQueryClient();

  return useMutation<void, AcademicsApiError, string>({
    mutationFn: (eventId: string) =>
      apiFetch<void>(`/api/academics/cme/events/${eventId}/register`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cme'] });
    },
  });
}

/**
 * DELETE /api/academics/cme/events/:id/register
 * Cancels the authenticated user's registration for an event.
 */
export function useCancelRegistration() {
  const queryClient = useQueryClient();

  return useMutation<void, AcademicsApiError, string>({
    mutationFn: (eventId: string) =>
      apiFetch<void>(`/api/academics/cme/events/${eventId}/register`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cme'] });
    },
  });
}
