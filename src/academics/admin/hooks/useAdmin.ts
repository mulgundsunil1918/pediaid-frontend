// =============================================================================
// academics/admin/hooks/useAdmin.ts — React Query hooks for the Admin Panel
// =============================================================================

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { refreshAccessToken } from '../../auth/sessionRefresh';
import type { AcadUserRole } from '../../types';

// ---------------------------------------------------------------------------
// API base + fetch wrapper
//
// Keeps its own wrapper (rather than importing academics.api.ts) because
// admin calls use plain Error, not AcademicsApiError. Wires into the
// silent refresh loop so a stale access token doesn't kick admins to
// the login page mid-action, and logs every call + failure to the
// browser console so Render log correlation is straightforward.
// ---------------------------------------------------------------------------

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  _retried = false,
): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = {
    // Only claim a JSON body when one is actually being sent — Fastify's
    // default body parser rejects a JSON-content-typed request with an
    // empty body (e.g. PUT .../approve, which takes no body at all).
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  console.log('[admin.api] →', options.method ?? 'GET', path);
  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401 && !_retried) {
    // Try silent refresh once before giving up — this keeps admins
    // logged in across long idle periods.
    const ok = await refreshAccessToken();
    if (ok) return apiFetch<T>(path, options, true);
  }
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('acad:unauthorized'));
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    const msg = body.message ?? `Request failed: ${res.status}`;
    console.error('[admin.api] ✗', options.method ?? 'GET', path, res.status, msg);
    throw new Error(msg);
  }
  console.log('[admin.api] ✓', options.method ?? 'GET', path, res.status);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminTopic {
  id: string;
  systemId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  chapterCount: number;
}

export interface AdminSystem {
  id: string;
  subjectId: string;
  name: string;
  code: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  topics: AdminTopic[];
}

export interface AdminSubject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  systems: AdminSystem[];
  chapterCount: number;
}

export interface TaxonomyTree {
  subjects: AdminSubject[];
}

export interface AdminUser {
  id: string;
  email: string;
  // Every role acad_users.role can hold. This previously omitted
  // 'super_admin', so the type claimed a value the API really does return
  // could never appear.
  role: AcadUserRole;
  isActive: boolean;
  isVerified: boolean;
  fullName: string;
  qualification: string | null;
  specialty: string | null;
  institution: string | null;
  credentialsVerified: boolean;
  chaptersPublished: number;
  chaptersPending: number;
  memberSince: string;
}

export interface PendingApplicant {
  id: string;
  email: string;
  role: 'pending_author' | 'pending_moderator';
  fullName: string | null;
  qualification: string | null;
  specialty: string | null;
  institution: string | null;
  bio: string | null;
  registrationReason: string | null;
  /** ISO timestamp */
  submittedAt: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminChapter {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  authorName: string;
  authorEmail: string;
  subjectName: string;
  topicName: string;
  viewCount: number;
  createdAt: string;
  submittedAt: string | null;
  publishedAt: string | null;
}

export interface AdminChaptersResponse {
  chapters: AdminChapter[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RecentActivityEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityTitle: string;
  createdAt: string;
}

export interface TopChapter {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  viewCount: number;
  publishedAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalChapters: number;
  chaptersByStatus: Record<string, number>;
  totalSubjects: number;
  totalSystems: number;
  totalTopics: number;
  totalViews: number;
  totalComments: number;
  totalCMEEvents: number;
  pendingRoleRequests: number;
  recentActivity: RecentActivityEntry[];
  topChapters: TopChapter[];
  pendingReview: number;
  avgModerationHours: number;
}

export interface AdminCMEEvent {
  id: string;
  slug: string;
  title: string;
  eventType: 'webinar' | 'workshop' | 'conference' | 'course';
  // The values acad_cme_events.status actually holds, per its CHECK
  // constraint. This previously declared 'scheduled' | 'live' | 'completed',
  // none of which the database can ever produce — so the admin list filtered
  // on statuses that do not exist and showed nothing at all.
  status: 'pending' | 'published' | 'rejected' | 'cancelled' | 'archived';
  startsAt: string;
  endsAt: string;
  registrationCount: number;
  creditHours: number;
  speakerName: string;
}

export interface PendingCredential {
  userId: string;
  email: string;
  fullName: string;
  qualification: string | null;
  specialty: string | null;
  institution: string | null;
  bio: string | null;
  orcid: string | null;
  // Nullable in the DB (JSONB, no NOT NULL) — the hook normalises it to []
  // but the raw shape is optional, so keep the type honest.
  verificationDocuments?: Array<{ name: string; url: string }> | null;
  createdAt: string;
}

export interface VerifiedCredential {
  userId: string;
  email: string;
  fullName: string;
  specialty: string | null;
  institution: string | null;
  // NULL for authors verified before credentials_verified_at existed (0016).
  verifiedAt: string | null;
}

export interface CMERegistration {
  userId: string;
  email: string;
  fullName: string;
  registeredAt: string;
  attended: boolean;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => ['admin', 'stats'] as const,
  taxonomy: () => ['admin', 'taxonomy'] as const,
  users: (filters: { role?: string; search?: string; page?: number }) =>
    ['admin', 'users', filters] as const,
  credentials: () => ['admin', 'credentials'] as const,
  credentialsPending: () => ['admin', 'credentials', 'pending'] as const,
  chapters: (filters: { status?: string; page?: number }) =>
    ['admin', 'chapters', filters] as const,
  cme: () => ['admin', 'cme'] as const,
  cmeRegistrations: (eventId: string) => ['admin', 'cme', eventId, 'registrations'] as const,
  submissions: (filters: AdminSubmissionFilters) => ['admin', 'submissions', filters] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Raw shape actually returned by GET /admin/stats.
 *
 * The backend groups by area (users / chapters / taxonomy); this hook's
 * PlatformStats is flat. They were written against each other's assumptions
 * and never matched, so every field the Overview page read was undefined —
 * which is why it crashed on `stats.avgModerationHours.toFixed(1)` as soon
 * as the query started succeeding.
 *
 * Mapped here rather than reshaping either side: the server grouping is
 * reasonable, the UI's flat access is reasonable, and this is the seam.
 */
interface RawPlatformStats {
  users: { total: number; byRole: Record<string, number> };
  chapters: {
    total: number;
    byStatus: Record<string, number>;
    totalViews: number;
    avgPublishingHours: number | null;
    top5ByViews: Array<{ id: string; title: string; slug: string; viewCount: number }>;
  };
  taxonomy: { totalSubjects: number; totalSystems: number; totalTopics: number };
  totalComments: number;
  totalCMEEvents: number;
  pendingRoleRequests: number;
  recentAuditLog: Array<{
    id: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    details: Record<string, unknown>;
    createdAt: string;
  }>;
}

function toPlatformStats(raw: RawPlatformStats): PlatformStats {
  return {
    totalUsers: raw.users?.total ?? 0,
    usersByRole: raw.users?.byRole ?? {},
    totalChapters: raw.chapters?.total ?? 0,
    chaptersByStatus: raw.chapters?.byStatus ?? {},
    totalSubjects: raw.taxonomy?.totalSubjects ?? 0,
    totalSystems: raw.taxonomy?.totalSystems ?? 0,
    totalTopics: raw.taxonomy?.totalTopics ?? 0,
    totalViews: raw.chapters?.totalViews ?? 0,
    totalComments: raw.totalComments ?? 0,
    totalCMEEvents: raw.totalCMEEvents ?? 0,
    pendingRoleRequests: raw.pendingRoleRequests ?? 0,
    // The server reports how long publishing takes; the card is labelled
    // moderation time. Same measurement, and null when nothing has been
    // published yet — which must not become NaN in the UI.
    avgModerationHours: raw.chapters?.avgPublishingHours ?? 0,
    pendingReview: raw.chapters?.byStatus?.pending ?? 0,
    topChapters: (raw.chapters?.top5ByViews ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      // Not returned by this endpoint; the card falls back to a dash.
      authorName: '',
      viewCount: c.viewCount ?? 0,
      publishedAt: '',
    })),
    recentActivity: (raw.recentAuditLog ?? []).map((a) => ({
      id: a.id,
      // The endpoint returns actor ids, not names — showing a raw UUID would
      // be worse than showing nothing.
      actorName: '',
      action: a.action,
      entityType: a.entityType ?? '',
      entityTitle: a.entityId ?? '',
      createdAt: String(a.createdAt ?? ''),
    })),
  };
}

export function usePlatformStats() {
  return useQuery<PlatformStats, Error>({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const raw = await apiFetch<RawPlatformStats>('/api/academics/admin/stats');
      return toPlatformStats(raw);
    },
    staleTime: 2 * 60 * 1_000,
    refetchInterval: 2 * 60 * 1_000,
  });
}

export function useTaxonomyTree() {
  return useQuery<TaxonomyTree, Error>({
    queryKey: adminKeys.taxonomy(),
    queryFn: () => apiFetch<TaxonomyTree>('/api/academics/admin/subjects'),
    staleTime: 30 * 1_000,
  });
}

export function useAdminUsers(filters: { role?: string; search?: string; page?: number }) {
  const params = new URLSearchParams();
  if (filters.role) params.set('role', filters.role);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  const qs = params.toString();

  return useQuery<AdminUsersResponse, Error>({
    queryKey: adminKeys.users(filters),
    queryFn: () =>
      apiFetch<AdminUsersResponse>(`/api/academics/admin/users${qs ? `?${qs}` : ''}`),
    staleTime: 30 * 1_000,
    placeholderData: keepPreviousData,
  });
}

export function usePendingCredentials() {
  return useQuery<PendingCredential[], Error>({
    queryKey: adminKeys.credentialsPending(),
    // acad_profiles.verification_documents is a nullable JSONB column, so rows
    // predating the field — or rows where it was cleared — come back with the
    // key absent. The type above claims it is always an array; it isn't, and
    // CredentialsPage crashed the whole screen on `.length`. Normalise here
    // rather than at each use site so every consumer is safe by construction.
    queryFn: async () => {
      const rows = await apiFetch<PendingCredential[]>('/api/academics/admin/credentials/pending');
      return (rows ?? []).map((row) => ({
        ...row,
        verificationDocuments: Array.isArray(row.verificationDocuments)
          ? row.verificationDocuments
          : [],
      }));
    },
    staleTime: 30 * 1_000,
  });
}

export function useVerifiedCredentials() {
  return useQuery<VerifiedCredential[], Error>({
    queryKey: adminKeys.credentials(),
    queryFn: () => apiFetch<VerifiedCredential[]>('/api/academics/admin/credentials/verified'),
    staleTime: 30 * 1_000,
  });
}

export function useAdminChapters(filters: { status?: string; subject?: string; author?: string; page?: number }) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.subject) params.set('subject', filters.subject);
  if (filters.author) params.set('author', filters.author);
  if (filters.page) params.set('page', String(filters.page));
  const qs = params.toString();

  return useQuery<AdminChaptersResponse, Error>({
    queryKey: adminKeys.chapters(filters),
    queryFn: () =>
      apiFetch<AdminChaptersResponse>(`/api/academics/admin/chapters${qs ? `?${qs}` : ''}`),
    staleTime: 30 * 1_000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminCMEEvents() {
  return useQuery<AdminCMEEvent[], Error>({
    queryKey: adminKeys.cme(),
    queryFn: () => apiFetch<AdminCMEEvent[]>('/api/academics/admin/cme'),
  });
}

export function useAdminCMEEventRegistrations(eventId: string) {
  return useQuery<CMERegistration[], Error>({
    queryKey: adminKeys.cmeRegistrations(eventId),
    queryFn: () =>
      apiFetch<CMERegistration[]>(`/api/academics/admin/cme/${eventId}/registrations`),
    staleTime: 30 * 1_000,
    enabled: !!eventId,
  });
}

// ---------------------------------------------------------------------------
// Subject mutations
// ---------------------------------------------------------------------------

interface SubjectInput {
  name: string;
  code: string;
  description?: string;
  displayOrder?: number;
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation<AdminSubject, Error, SubjectInput>({
    mutationFn: (data) =>
      apiFetch<AdminSubject>('/api/academics/admin/subjects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation<AdminSubject, Error, SubjectInput & { id: string }>({
    mutationFn: ({ id, ...data }) =>
      apiFetch<AdminSubject>(`/api/academics/admin/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useDeactivateSubject() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/subjects/${id}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

// ---------------------------------------------------------------------------
// System mutations
// ---------------------------------------------------------------------------

interface SystemInput {
  name: string;
  code?: string;
  description?: string;
  displayOrder?: number;
}

export function useCreateSystem() {
  const qc = useQueryClient();
  return useMutation<AdminSystem, Error, SystemInput & { subjectId: string }>({
    mutationFn: ({ subjectId, ...data }) =>
      apiFetch<AdminSystem>(`/api/academics/admin/subjects/${subjectId}/systems`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useUpdateSystem() {
  const qc = useQueryClient();
  return useMutation<AdminSystem, Error, SystemInput & { id: string }>({
    mutationFn: ({ id, ...data }) =>
      apiFetch<AdminSystem>(`/api/academics/admin/systems/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useDeactivateSystem() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/systems/${id}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

// ---------------------------------------------------------------------------
// Topic mutations
// ---------------------------------------------------------------------------

interface TopicInput {
  name: string;
  description?: string;
  displayOrder?: number;
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation<AdminTopic, Error, TopicInput & { systemId: string }>({
    mutationFn: ({ systemId, ...data }) =>
      apiFetch<AdminTopic>(`/api/academics/admin/systems/${systemId}/topics`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useUpdateTopic() {
  const qc = useQueryClient();
  return useMutation<AdminTopic, Error, TopicInput & { id: string }>({
    mutationFn: ({ id, ...data }) =>
      apiFetch<AdminTopic>(`/api/academics/admin/topics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useDeactivateTopic() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/topics/${id}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

// ---------------------------------------------------------------------------
// User mutations
// ---------------------------------------------------------------------------

export function useChangeUserRole() {
  const qc = useQueryClient();
  // The route replies { success: true }, not the updated user. Declaring
  // AdminUser here was harmless only because onSuccess ignores the value —
  // the first caller to read a field off it would have got undefined.
  return useMutation<void, Error, { id: string; role: string }>({
    mutationFn: ({ id, role }) =>
      apiFetch<void>(`/api/academics/admin/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

// ---------------------------------------------------------------------------
// Pending role applications — list + approve + reject
// ---------------------------------------------------------------------------

/** GET /admin/users/pending — everyone awaiting author/moderator approval */
export function useAdminPendingApplicants() {
  return useQuery<PendingApplicant[], Error>({
    queryKey: ['admin', 'pending-applicants'],
    queryFn: async () => {
      const res = await apiFetch<{ data: PendingApplicant[] }>(
        '/api/academics/admin/users/pending',
      );
      return res.data;
    },
    staleTime: 30_000,
  });
}

/** PUT /admin/users/:id/approve-role — promote pending_* + send welcome email */
export function useApprovePendingApplicant() {
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: string; role: 'author' | 'moderator' }
  >({
    mutationFn: ({ id, role }) =>
      apiFetch<void>(`/api/academics/admin/users/${id}/approve-role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

// ---------------------------------------------------------------------------
// CME event moderation — user-posted events awaiting admin approval
// ---------------------------------------------------------------------------

export interface PendingCmeEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  event_type: 'webinar' | 'workshop' | 'conference' | 'course';
  status: string;
  description: string | null;
  long_description: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  venue: string | null;
  address: string | null;
  city: string | null;
  country: string;
  online_url: string | null;
  organised_by: string | null;
  speaker_name: string | null;
  speaker_credentials: string | null;
  speaker_bio: string | null;
  credit_hours: string | number | null;
  credit_type: string | null;
  price: string | number;
  currency: string;
  cover_image_url: string | null;
  brochure_url: string | null;
  registration_url: string | null;
  tags: string[] | null;
  coordinators: Array<{ name?: string; email?: string; phone?: string }> | null;
  created_at: string;
  poster_email: string | null;
  poster_name: string | null;
  poster_role: string | null;
}

/** GET /admin/cme/pending — every pending user-posted event */
export function useAdminPendingCmeEvents() {
  return useQuery<PendingCmeEvent[], Error>({
    queryKey: ['admin', 'cme-pending'],
    queryFn: async () => {
      const res = await apiFetch<{ data: PendingCmeEvent[] }>(
        '/api/academics/admin/cme/pending',
      );
      return res.data;
    },
    staleTime: 30_000,
  });
}

/** PUT /admin/cme/:id/approve — publish + send approval email */
export function useApproveCmeEvent() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/cme/${id}/approve`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'cme-pending'] });
    },
  });
}

/** PUT /admin/cme/:id/reject — body: { reason } — rejects + sends email */
export function useRejectCmeEvent() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) =>
      apiFetch<void>(`/api/academics/admin/cme/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'cme-pending'] });
    },
  });
}

/** PUT /admin/cme/:id/request-changes — body: { reason } — sends back for revision + emails */
export function useRequestCmeEventChanges() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) =>
      apiFetch<void>(`/api/academics/admin/cme/${id}/request-changes`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'cme-pending'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Never Again moderation
// ---------------------------------------------------------------------------

export interface PendingNeverAgainPost {
  id: number;
  what_happened: string;
  what_went_wrong: string;
  the_lesson: string;
  category: string;
  role: string | null;
  status: string;
  rejection_reason: string | null;
  submitter_email: string | null;
  created_at: string;
}

export interface NeverAgainPost extends PendingNeverAgainPost {
  reference_code: string | null;
  resonated_count: number;
  is_flagged: boolean;
}

/**
 * GET /admin/never-again — every post, whatever its status.
 *
 * The panel previously only listed the pending queue, so an approved post
 * disappeared from the dashboard entirely and a fake that slipped through
 * could not be reached, even though the delete route existed.
 */
export interface AppConfig {
  minVersion: string | null;
  disabledTools: string[];
  notice: string | null;
  noticeUrl: string | null;
  updatedAt: string | null;
}

/** GET /api/app-config — public, but the admin page reads it to prefill. */
export function useAppConfig() {
  return useQuery<AppConfig, Error>({
    queryKey: ['app-config'],
    queryFn: () => apiFetch<AppConfig>('/api/app-config'),
    staleTime: 0,
  });
}

/** PUT /admin/app-config — the emergency lever. Admin only, audited. */
export function useUpdateAppConfig() {
  const qc = useQueryClient();
  return useMutation<AppConfig, Error, Partial<AppConfig>>({
    mutationFn: (body) =>
      apiFetch<AppConfig>('/api/academics/admin/app-config', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      // Write the response straight into the cache rather than invalidating:
      // after changing something this consequential the page must show what
      // the server actually stored, not an optimistic guess.
      qc.setQueryData(['app-config'], data);
    },
  });
}

export function useAllNeverAgainPosts(status: string) {
  return useQuery<NeverAgainPost[], Error>({
    queryKey: ['admin', 'never-again-all', status],
    queryFn: () =>
      apiFetch<NeverAgainPost[]>(
        `/api/academics/admin/never-again${status !== 'all' ? `?status=${status}` : ''}`,
      ),
  });
}

/** GET /admin/never-again/pending — every pending anonymous post */
export function useAdminPendingNeverAgainPosts() {
  return useQuery<PendingNeverAgainPost[], Error>({
    queryKey: ['admin', 'never-again-pending'],
    queryFn: async () => {
      const res = await apiFetch<{ data: PendingNeverAgainPost[] }>(
        '/api/academics/admin/never-again/pending',
      );
      return res.data;
    },
    staleTime: 30_000,
  });
}

/** PUT /admin/never-again/:id/approve — publishes the post */
/**
 * DELETE /admin/never-again/:id — permanent.
 *
 * Distinct from reject: a rejected post still exists and still has to be dealt
 * with later. This is for spam and obvious fakes, where there is nothing to
 * keep. The server records what was deleted in the audit log first, since the
 * post is anonymous and nothing else would remember it.
 */
export function useDeleteNeverAgainPost() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/never-again/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'never-again-pending'] });
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

/** DELETE /admin/cme/:id — permanent. Same purpose as the above. */
export function useDeleteCmeEvent() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/cme/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useApproveNeverAgainPost() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/never-again/${id}/approve`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'never-again-pending'] });
    },
  });
}

/** PUT /admin/never-again/:id/reject — body: { reason } */
export function useRejectNeverAgainPost() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: number; reason: string }>({
    mutationFn: ({ id, reason }) =>
      apiFetch<void>(`/api/academics/admin/never-again/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'never-again-pending'] });
    },
  });
}

/** PUT /admin/never-again/:id/request-changes — body: { reason } */
export function useRequestNeverAgainChanges() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: number; reason: string }>({
    mutationFn: ({ id, reason }) =>
      apiFetch<void>(`/api/academics/admin/never-again/${id}/request-changes`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'never-again-pending'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Broadcast notification (push to every device)
// ---------------------------------------------------------------------------

/** POST /api/push/broadcast — the logged-in admin's JWT is enough, no key needed */
export function useSendBroadcast() {
  return useMutation<
    { ok: boolean; messageId: string },
    Error,
    { title: string; body: string; linkPath?: string }
  >({
    mutationFn: (payload) =>
      apiFetch('/api/push/broadcast', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });
}

/** PUT /admin/users/:id/reject-role — demote pending_* back to reader */
export function useRejectPendingApplicant() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/users/${id}/reject-role`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/users/${id}/deactivate`, { method: 'PUT' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/users/${id}/activate`, { method: 'PUT' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

// ---------------------------------------------------------------------------
// Credential mutations
// ---------------------------------------------------------------------------

export function useVerifyCredentials() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (userId) =>
      apiFetch<void>(`/api/academics/admin/credentials/${userId}/verify`, { method: 'PUT' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useRejectCredentials() {
  const qc = useQueryClient();
  return useMutation<void, Error, { userId: string; reason: string }>({
    mutationFn: ({ userId, reason }) =>
      apiFetch<void>(`/api/academics/admin/credentials/${userId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

// ---------------------------------------------------------------------------
// Chapter mutations
// ---------------------------------------------------------------------------

export function useArchiveChapter() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/chapters/${id}/archive`, { method: 'PUT' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useHardDeleteChapter() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/chapters/${id}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

// ---------------------------------------------------------------------------
// CME Event mutations
// ---------------------------------------------------------------------------

export interface CMEEventInput {
  title: string;
  eventType: 'webinar' | 'workshop' | 'conference' | 'course';
  startsAt: string;
  endsAt: string;
  timezone: string;
  venue?: string;
  onlineUrl?: string;
  description?: string;
  speakerName?: string;
  speakerCredentials?: string;
  speakerBio?: string;
  creditHours: number;
  creditType?: string;
  maxAttendees?: number;
  price: number;
}

export function useCreateCMEEvent() {
  const qc = useQueryClient();
  return useMutation<AdminCMEEvent, Error, CMEEventInput>({
    mutationFn: (data) =>
      apiFetch<AdminCMEEvent>('/api/academics/admin/cme', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useUpdateCMEEvent() {
  const qc = useQueryClient();
  return useMutation<AdminCMEEvent, Error, CMEEventInput & { id: string }>({
    mutationFn: ({ id, ...data }) =>
      apiFetch<AdminCMEEvent>(`/api/academics/admin/cme/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useCancelCMEEvent() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/admin/cme/${id}/cancel`, { method: 'PUT' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; attendees: string[] }>({
    mutationFn: ({ id, attendees }) =>
      apiFetch<void>(`/api/academics/admin/cme/${id}/attendance`, {
        method: 'PUT',
        body: JSON.stringify({ attendees }),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

export function useIssueCertificates() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; attendees: string[] }>({
    mutationFn: ({ id, attendees }) =>
      apiFetch<void>(`/api/academics/admin/cme/${id}/certificates`, {
        method: 'POST',
        body: JSON.stringify({ attendees }),
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: adminKeys.all }); },
  });
}

// ---------------------------------------------------------------------------
// Role Requests types
// ---------------------------------------------------------------------------

export type RoleRequestStatus = 'pending' | 'approved' | 'rejected';

export interface RoleRequest {
  id: string;
  requested_role: 'author' | 'moderator' | 'admin';
  reason: string;
  status: RoleRequestStatus;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  user_email: string;
  user_name: string;
  qualification: string | null;
  institution: string | null;
  current_role: string;
  reviewer_email: string | null;
}

// ---------------------------------------------------------------------------
// Role Requests query key
// ---------------------------------------------------------------------------

// Extend adminKeys inline so tree-shaking still works for the rest of the file.
export const roleRequestKeys = {
  list: (status: string) => ['admin', 'role-requests', status] as const,
};

// ---------------------------------------------------------------------------
// Role Requests — queries & mutations
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Cross-module submissions — every moderated module in one filterable view
// ---------------------------------------------------------------------------

export interface AdminSubmissionFilters {
  module_type?: string;
  status?: string;
  author?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface AdminSubmission {
  submissionId: string;
  moduleType: 'never_again' | 'conference' | 'webinar' | 'workshop' | 'course';
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  adminFeedback: string | null;
  slug: string | null;
}

export function useAdminSubmissions(filters: AdminSubmissionFilters) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();

  return useQuery<AdminSubmission[], Error>({
    queryKey: adminKeys.submissions(filters),
    queryFn: async () => {
      const body = await apiFetch<{ submissions: AdminSubmission[] }>(
        `/api/academics/admin/submissions${qs ? `?${qs}` : ''}`,
      );
      return body.submissions;
    },
    staleTime: 30 * 1_000,
    placeholderData: keepPreviousData,
  });
}

export function useRoleRequests(status = 'pending') {
  return useQuery<RoleRequest[], Error>({
    queryKey: roleRequestKeys.list(status),
    queryFn: () =>
      apiFetch<RoleRequest[]>(`/api/academics/admin/role-requests?status=${encodeURIComponent(status)}`),
    staleTime: 30 * 1_000,
  });
}

export function useApproveRoleRequest() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; note?: string }>({
    mutationFn: ({ id, note }) =>
      apiFetch<void>(`/api/academics/admin/role-requests/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'role-requests'] });
    },
  });
}

export function useRejectRoleRequest() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; note?: string }>({
    mutationFn: ({ id, note }) =>
      apiFetch<void>(`/api/academics/admin/role-requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'role-requests'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Landmark Trials
// ---------------------------------------------------------------------------

export interface TrialSystem {
  slug: string;
  label: string;
}

export interface AdminTrial {
  id: string;
  slug: string;
  status: string;
  originalAuthors: string | null;
  reviewAuthor: string | null;
  submittedBy: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  /** PediAid ID no., e.g. PA-TRIAL-00001. Assigned on create, never changes. */
  referenceCode: string | null;
  specialty: 'paediatrics' | 'neonatology';
  system: string;
  title: string;
  subtitle: string | null;
  acronym: string | null;
  journal: string | null;
  year: number | null;
  doi: string | null;
  pubmedId: string | null;
  externalUrl: string | null;
  picot: {
    population: string | null;
    intervention: string | null;
    comparator: string | null;
    outcome: string | null;
    timeframe: string | null;
  };
  summary: string | null;
  results: string[];
  limitations: string[];
  takeaways: string[];
  furtherReading: string[];
  isPublished: boolean;
  publishedAt: string | null;
  likeCount: number;
  createdAt: string;
}

export const trialKeys = {
  all: ['admin', 'trials'] as const,
  systems: ['admin', 'trial-systems'] as const,
};

export function useTrialSystems() {
  return useQuery<TrialSystem[], Error>({
    queryKey: trialKeys.systems,
    queryFn: async () =>
      (await apiFetch<{ systems: TrialSystem[] }>(
        '/api/academics/trials/systems',
      )).systems,
    // The list changes only when a row is added to acad_trial_systems, which
    // is a deliberate act — no point re-fetching it on every focus.
    staleTime: 60 * 60 * 1000,
  });
}

export function useAdminTrials() {
  return useQuery<AdminTrial[], Error>({
    queryKey: trialKeys.all,
    queryFn: async () =>
      (await apiFetch<{ trials: AdminTrial[] }>('/api/academics/admin/trials'))
        .trials,
  });
}

export function useCreateTrial() {
  const qc = useQueryClient();
  return useMutation<AdminTrial, Error, Record<string, unknown>>({
    mutationFn: async (body) =>
      (await apiFetch<{ trial: AdminTrial }>('/api/academics/admin/trials', {
        method: 'POST',
        body: JSON.stringify(body),
      })).trial,
    onSuccess: () => void qc.invalidateQueries({ queryKey: trialKeys.all }),
  });
}

export function useUpdateTrial() {
  const qc = useQueryClient();
  return useMutation<AdminTrial, Error, { id: string; body: Record<string, unknown> }>({
    mutationFn: async ({ id, body }) =>
      (await apiFetch<{ trial: AdminTrial }>(`/api/academics/admin/trials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })).trial,
    onSuccess: () => void qc.invalidateQueries({ queryKey: trialKeys.all }),
  });
}

/**
 * Approve / reject / request changes on a submitted trial.
 *
 * Approve publishes it; the other two leave it invisible and hand the reason
 * back to the submitter. The reason is required for those two — nobody should
 * be told "no" without being told why.
 */
export function useModerateTrial() {
  const qc = useQueryClient();
  return useMutation<
    { trial: AdminTrial },
    Error,
    { id: string; action: 'approve' | 'reject' | 'request_changes'; reason?: string }
  >({
    mutationFn: ({ id, action, reason }) =>
      apiFetch<{ trial: AdminTrial }>(
        `/api/academics/admin/trials/${id}/moderate`,
        { method: 'POST', body: JSON.stringify({ action, reason }) },
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: trialKeys.all }),
  });
}

export function useDeleteTrial() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) =>
      apiFetch<void>(`/api/academics/admin/trials/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: trialKeys.all }),
  });
}

/**
 * Publish or unpublish, optionally announcing to every user.
 *
 * `notify` is passed explicitly rather than implied by publishing: a push
 * cannot be recalled, and the usual rhythm is to publish several trials then
 * announce once.
 */
export function usePublishTrial() {
  const qc = useQueryClient();
  return useMutation<
    { trial: AdminTrial; notified: boolean },
    Error,
    { id: string; publish: boolean; notify?: boolean }
  >({
    mutationFn: ({ id, publish, notify }) =>
      apiFetch<{ trial: AdminTrial; notified: boolean }>(
        `/api/academics/admin/trials/${id}/publish`,
        { method: 'POST', body: JSON.stringify({ publish, notify: !!notify }) },
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: trialKeys.all }),
  });
}

// ---------------------------------------------------------------------------
// Guideline notes & reviews
// ---------------------------------------------------------------------------

export interface AdminGuidelineNote {
  id: string;
  slug: string;
  /** PediAid ID no., e.g. PA-NOTE-00001. Assigned on create, never changes. */
  referenceCode: string | null;
  kind: 'note' | 'review';
  title: string;
  subtitle: string | null;
  society: string | null;
  guidelineYear: number | null;
  summary: string | null;
  body: string[];
  whatChanged: string[];
  takeaways: string[];
  externalUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  likeCount: number;
  createdAt: string;
}

const NOTES_KEY = ['admin', 'guideline-notes'] as const;

export function useAdminGuidelineNotes() {
  return useQuery<AdminGuidelineNote[], Error>({
    queryKey: NOTES_KEY,
    queryFn: async () =>
      (await apiFetch<{ notes: AdminGuidelineNote[] }>(
        '/api/academics/admin/guideline-notes',
      )).notes,
  });
}

export function useCreateGuidelineNote() {
  const qc = useQueryClient();
  return useMutation<AdminGuidelineNote, Error, Record<string, unknown>>({
    mutationFn: async (body) =>
      (await apiFetch<{ note: AdminGuidelineNote }>(
        '/api/academics/admin/guideline-notes',
        { method: 'POST', body: JSON.stringify(body) },
      )).note,
    onSuccess: () => void qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

export function useUpdateGuidelineNote() {
  const qc = useQueryClient();
  return useMutation<
    AdminGuidelineNote,
    Error,
    { id: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ id, body }) =>
      (await apiFetch<{ note: AdminGuidelineNote }>(
        `/api/academics/admin/guideline-notes/${id}`,
        { method: 'PATCH', body: JSON.stringify(body) },
      )).note,
    onSuccess: () => void qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

export function useDeleteGuidelineNote() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) =>
      apiFetch<{ success: boolean }>(
        `/api/academics/admin/guideline-notes/${id}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

/** Publish/unpublish. `notify` is opt-in — a push cannot be recalled. */
export function usePublishGuidelineNote() {
  const qc = useQueryClient();
  return useMutation<
    { note: AdminGuidelineNote; notified: boolean },
    Error,
    { id: string; publish: boolean; notify?: boolean }
  >({
    mutationFn: ({ id, publish, notify }) =>
      apiFetch<{ note: AdminGuidelineNote; notified: boolean }>(
        `/api/academics/admin/guideline-notes/${id}/publish`,
        { method: 'POST', body: JSON.stringify({ publish, notify }) },
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}
