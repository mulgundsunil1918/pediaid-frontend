// =============================================================================
// academics/admin/hooks/useAdminSession.ts
//
// The authoritative answer to "is this person an admin, and what may they do".
//
// Every admin page previously gated on `hasRole('admin')` from the zustand
// auth store, which persists to localStorage — a value the user can edit to
// make the admin UI appear. The backend refused every action regardless, so
// nothing leaked, but the gate itself proved nothing. This asks the server.
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { apiFetch, AcademicsApiError } from '../../api/academics.api';

export interface AdminSession {
  userId: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  mustResetCredentials: boolean;
  /** Already-resolved permission keys, e.g. "users.write". */
  permissions: string[];
}

export const adminSessionKey = ['admin', 'session'] as const;

export function useAdminSession() {
  return useQuery<AdminSession, Error>({
    queryKey: adminSessionKey,
    queryFn: () => apiFetch<AdminSession>('/api/academics/admin/me'),
    // Short-lived: a revoked permission or deactivated account should take
    // effect without a full reload.
    staleTime: 30 * 1_000,
    // Retry TRANSIENT failures (network blip, 5xx, serverless DB cold-start
    // after a long idle session) so a single hiccup doesn't wrongly boot an
    // admin. Never retry a genuine 401/403 — those won't change on repeat.
    //
    // Our Neon Postgres scales to zero when idle, so the FIRST admin/me after
    // a quiet spell can 5xx for several seconds while the DB (and a cold
    // backend) wake up. Three quick retries (~5s) gave up before the wake
    // finished and flashed "Couldn't verify your access". Retry patiently over
    // ~25s so the gate resolves silently on a cold-start; the "Checking
    // access…" spinner just lingers a beat instead of showing a false error.
    retry: (failureCount, err) => {
      const status = err instanceof AcademicsApiError ? err.statusCode : 0;
      if (status === 401 || status === 403) return false;
      return failureCount < 7;
    },
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 5_000),
  });
}

/** Convenience check against a loaded session. */
export function can(session: AdminSession | undefined, permission: string): boolean {
  return Boolean(session?.permissions.includes(permission));
}
