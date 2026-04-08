// =============================================================================
// academics/admin/hooks/useAdmin.ts — React Query hooks for the Admin Panel
// =============================================================================

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';

// ---------------------------------------------------------------------------
// API base + fetch wrapper
// ---------------------------------------------------------------------------

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
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
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
  role:
    | 'reader'
    | 'author'
    | 'moderator'
    | 'admin'
    | 'pending_author'
    | 'pending_moderator';
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
  title: string;
  eventType: 'webinar' | 'workshop' | 'conference' | 'course';
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
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
  verificationDocuments: Array<{ name: string; url: string }>;
  createdAt: string;
}

export interface VerifiedCredential {
  userId: string;
  email: string;
  fullName: string;
  specialty: string | null;
  institution: string | null;
  verifiedAt: string;
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
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function usePlatformStats() {
  return useQuery<PlatformStats, Error>({
    queryKey: adminKeys.stats(),
    queryFn: () => apiFetch<PlatformStats>('/api/academics/admin/stats'),
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
    queryFn: () => apiFetch<PendingCredential[]>('/api/academics/admin/credentials/pending'),
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
  return useMutation<AdminUser, Error, { id: string; role: string }>({
    mutationFn: ({ id, role }) =>
      apiFetch<AdminUser>(`/api/academics/admin/users/${id}/role`, {
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
