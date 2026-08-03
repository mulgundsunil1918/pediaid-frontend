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
import { apiFetch } from '../../api/academics.api';

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
    retry: false,
  });
}

/** Convenience check against a loaded session. */
export function can(session: AdminSession | undefined, permission: string): boolean {
  return Boolean(session?.permissions.includes(permission));
}
