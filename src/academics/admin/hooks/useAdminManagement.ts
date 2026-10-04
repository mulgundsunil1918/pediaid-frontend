// =============================================================================
// academics/admin/hooks/useAdminManagement.ts
//
// React Query hooks for Admin Management: who is an administrator, what they
// may touch, who signed in, and what has been done. Every endpoint here is
// super-admin-only on the server (the `admins.manage` permission).
// =============================================================================

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiFetch } from '../../api/academics.api';

const BASE = '/api/academics/admin';

// ---------------------------------------------------------------------------
// Shapes (mirror backend admins.service.ts / login-history.ts / audit.ts)
// ---------------------------------------------------------------------------

export interface AdminModule {
  key: string;
  label: string;
  description: string;
}

export type AdminTier = 'admin' | 'super_admin';

export interface AdminAccount {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminTier;
  isActive: boolean;
  /** What was recorded. `null` = never restricted (a legacy admin: everything). */
  permissions: string[] | null;
  /** What the account can actually do, already resolved by the server. */
  effectivePermissions: string[];
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export interface AdminsResponse {
  admins: AdminAccount[];
  modules: AdminModule[];
  /** The caller's own user id, so the UI can mark "you". */
  you: string;
}

export interface LoginEntry {
  id: string;
  at: string;
  userId: string | null;
  email: string | null;
  succeeded: boolean;
  failureReason: string | null;
  ip: string | null;
  userAgent: string | null;
  device: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
}

export interface Paged<T> {
  entries: T[];
  total: number;
}

export const adminMgmtKeys = {
  admins: ['admin', 'admins'] as const,
  logins: ['admin', 'login-history'] as const,
  audit: ['admin', 'audit-log'] as const,
};

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    u.set(k, v === true ? '1' : String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
};

// ---------------------------------------------------------------------------
// Administrators
// ---------------------------------------------------------------------------

export function useAdmins() {
  return useQuery<AdminsResponse, Error>({
    queryKey: adminMgmtKeys.admins,
    queryFn: () => apiFetch<AdminsResponse>(`${BASE}/admins`),
    staleTime: 10_000,
  });
}

/** Everything that shows administrators or what they did is stale after a change. */
function useInvalidateAfterChange() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: adminMgmtKeys.admins });
    void qc.invalidateQueries({ queryKey: adminMgmtKeys.audit });
    void qc.invalidateQueries({ queryKey: adminMgmtKeys.logins });
    // The caller's own permissions can change (a super admin editing a peer
    // never changes their own, but this is cheap and keeps the menu honest).
    void qc.invalidateQueries({ queryKey: ['admin', 'session'] });
  };
}

export interface GrantInput {
  email: string;
  role: AdminTier;
  permissions?: string[];
}

export function useGrantAdmin() {
  const done = useInvalidateAfterChange();
  return useMutation<AdminAccount, Error, GrantInput>({
    mutationFn: (body) =>
      apiFetch<AdminAccount>(`${BASE}/admins`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: done,
  });
}

export interface UpdateInput {
  id: string;
  role?: AdminTier;
  permissions?: string[];
}

export function useUpdateAdmin() {
  const done = useInvalidateAfterChange();
  return useMutation<AdminAccount, Error, UpdateInput>({
    mutationFn: ({ id, ...body }) =>
      apiFetch<AdminAccount>(`${BASE}/admins/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: done,
  });
}

export function useSetAdminActive() {
  const done = useInvalidateAfterChange();
  return useMutation<AdminAccount, Error, { id: string; isActive: boolean }>({
    mutationFn: ({ id, isActive }) =>
      apiFetch<AdminAccount>(`${BASE}/admins/${id}/active`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: done,
  });
}

export function useRemoveAdmin() {
  const done = useInvalidateAfterChange();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => apiFetch<void>(`${BASE}/admins/${id}`, { method: 'DELETE' }),
    onSuccess: done,
  });
}

// ---------------------------------------------------------------------------
// Sign-in history
// ---------------------------------------------------------------------------

export function useAdminLoginHistory(id: string | null) {
  return useQuery<LoginEntry[], Error>({
    queryKey: [...adminMgmtKeys.logins, 'one', id],
    enabled: Boolean(id),
    queryFn: async () =>
      (await apiFetch<{ entries: LoginEntry[] }>(`${BASE}/admins/${id}/login-history?limit=50`))
        .entries,
  });
}

export function useLoginHistory(opts: { failuresOnly: boolean; page: number; pageSize: number }) {
  return useQuery<Paged<LoginEntry>, Error>({
    queryKey: [...adminMgmtKeys.logins, 'all', opts],
    placeholderData: keepPreviousData,
    queryFn: () =>
      apiFetch<Paged<LoginEntry>>(
        `${BASE}/login-history${qs({
          failures: opts.failuresOnly,
          limit: opts.pageSize,
          offset: opts.page * opts.pageSize,
        })}`,
      ),
  });
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export interface AuditFilters {
  action: string;
  actor: string;
  /** yyyy-mm-dd from a date input, or ''. */
  from: string;
  to: string;
}

export function useAuditLog(filters: AuditFilters, page: number, pageSize: number) {
  return useQuery<Paged<AuditEntry>, Error>({
    queryKey: [...adminMgmtKeys.audit, 'list', filters, page, pageSize],
    placeholderData: keepPreviousData,
    queryFn: () =>
      apiFetch<Paged<AuditEntry>>(
        `${BASE}/audit-log${qs({
          action: filters.action,
          actor: filters.actor,
          // A date input gives a day; the server wants a moment. The range is
          // inclusive of the whole "to" day.
          from: filters.from ? new Date(`${filters.from}T00:00:00`).toISOString() : '',
          to: filters.to
            ? new Date(new Date(`${filters.to}T00:00:00`).getTime() + 864e5).toISOString()
            : '',
          limit: pageSize,
          offset: page * pageSize,
        })}`,
      ),
  });
}

export function useAuditActions() {
  return useQuery<string[], Error>({
    queryKey: [...adminMgmtKeys.audit, 'actions'],
    queryFn: async () => (await apiFetch<{ actions: string[] }>(`${BASE}/audit-log/actions`)).actions,
    staleTime: 60_000,
  });
}
