// =============================================================================
// academics/notifications/hooks/useNotifications.ts
//
// React Query hooks for the notification bell. Polls every 60s like the
// moderation hooks already do (useModeration.ts:137), and is only enabled
// when a user is signed in — the bell is hidden for anonymous visitors.
// =============================================================================

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { API_BASE } from '../../../lib/apiBase';
import type { Notification, NotificationListResponse } from '../types';

// ---------------------------------------------------------------------------
// Internal fetch wrapper — mirrors other hook files (academics.api.ts style)
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
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.dispatchEvent(new CustomEvent('acad:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => ['notifications', 'list'] as const,
};

// ---------------------------------------------------------------------------
// useNotifications — list + unread count, 60s polling
// ---------------------------------------------------------------------------

export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const enabled = isAuthenticated();

  return useQuery<NotificationListResponse, Error>({
    queryKey: notificationKeys.list(),
    queryFn: () =>
      apiFetch<NotificationListResponse>('/api/academics/notifications'),
    enabled,
    // Poll every 60s, but React Query pauses polling while the tab is hidden
    // by default — no extra work needed.
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// useMarkNotificationRead — single row
// ---------------------------------------------------------------------------

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/api/academics/notifications/${id}/read`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// useMarkAllNotificationsRead
// ---------------------------------------------------------------------------

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () =>
      apiFetch<void>('/api/academics/notifications/read-all', {
        method: 'PUT',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Re-export the Notification type for convenience
export type { Notification };
