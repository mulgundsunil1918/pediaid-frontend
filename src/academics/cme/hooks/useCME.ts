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
  /**
   * Human-usable identifier shown to users as "PediAid ID no.", e.g.
   * PA-CME-00042.
   *
   * The API has returned this since reference codes were added; the type
   * simply never declared it, so the web dropped the one identifier a user
   * can quote in a query. Nullable because older rows predate the column.
   */
  referenceCode: string | null;
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
  /// Absent from the API today — it sends speakerName/speakerBio/
  /// speakerCredentials instead. Optional so the type stops promising a
  /// field the server never sends.
  speakers?: Speaker[];
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
  /** ISO 3166-2:IN subdivision code, e.g. 'KA'. */
  state?: string;
  mode?: 'online' | 'in_person' | 'hybrid';
  /** Free-text search across title, description, speaker, venue and city. */
  q?: string;
  page?: number;
}

export interface CMEFilterOptions {
  states: Array<{ code: string; name: string }>;
  modes: Array<'online' | 'in_person' | 'hybrid'>;
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
    // Only claim a JSON body when one is actually being sent — Fastify's
    // default body parser rejects a JSON-content-typed request with an
    // empty body (e.g. POST .../register, which takes no body at all).
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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
  if (filters.state) params.set('state', filters.state);
  if (filters.mode) params.set('mode', filters.mode);
  if (filters.q?.trim()) params.set('q', filters.q.trim());
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
 * GET /api/academics/cme/filter-options
 *
 * The state and mode vocabulary, served by the API so the dropdown and the
 * validation are built from the same list. Static, so it is cached hard —
 * refetching a list of Indian states on every visit would be silly.
 */
export function useCMEFilterOptions() {
  return useQuery<CMEFilterOptions, AcademicsApiError>({
    queryKey: ['cme', 'filter-options'],
    queryFn: () => apiFetch<CMEFilterOptions>('/api/academics/cme/filter-options'),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
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

// ---------------------------------------------------------------------------
// Submission — any signed-in user, status forced to 'pending' server-side
// ---------------------------------------------------------------------------

export interface CmeCoordinatorInput {
  name: string;
  email?: string;
  phone?: string;
}

export interface SubmitCMEEventInput {
  title: string;
  subtitle?: string;
  eventType: 'webinar' | 'workshop' | 'conference' | 'course';
  description: string;
  longDescription?: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  timezone?: string;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  onlineUrl?: string;
  organisedBy?: string;
  speakerName?: string;
  speakerCredentials?: string;
  speakerBio?: string;
  creditHours?: number;
  creditType?: string;
  maxAttendees?: number;
  price?: number;
  currency?: string;
  coverImageUrl?: string;
  brochureUrl?: string;
  registrationUrl?: string;
  tags?: string[];
  coordinators?: CmeCoordinatorInput[];
}

export interface SubmitCMEEventResult {
  id: string;
  slug: string;
  status: string;
  message: string;
}

/**
 * GET /api/academics/cme/my-events
 * Every event the signed-in user has posted, across all statuses.
 */
export function useMyCMEEvents() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  return useQuery<{ data: RawCmeEvent[] }, AcademicsApiError>({
    queryKey: ['cme', 'my-events'],
    queryFn: () => apiFetch<{ data: RawCmeEvent[] }>('/api/academics/cme/my-events'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

/** Raw shape returned by the backend's toCmeEventJson() — not the browsing-page CMEEvent type above. */
export interface RawCmeEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  eventType: 'webinar' | 'workshop' | 'conference' | 'course';
  status: 'pending' | 'published' | 'changes_requested' | 'rejected' | 'cancelled' | 'archived';
  rejectionReason: string | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

/**
 * POST /api/academics/cme/events
 * Submits a new event. Backend forces status='pending' regardless of body.
 */
export function useSubmitCMEEvent() {
  const queryClient = useQueryClient();

  return useMutation<SubmitCMEEventResult, AcademicsApiError, SubmitCMEEventInput>({
    mutationFn: (input) =>
      apiFetch<SubmitCMEEventResult>('/api/academics/cme/events', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cme', 'my-events'] });
    },
  });
}
