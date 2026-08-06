// =============================================================================
// academics/bookmarks/useBookmarks.ts
// =============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/academics.api';
import { useAuthStore } from '../../store/authStore';

export type ItemType = 'trial' | 'guide' | 'cme' | 'chapter' | 'stg';

export const ITEM_LABELS: Record<ItemType, string> = {
  trial: 'Trial',
  guide: 'Guide',
  cme: 'Event',
  chapter: 'Chapter',
  stg: 'Guideline',
};

export interface Bookmark {
  itemType: ItemType;
  itemId: string;
  tag: string | null;
  createdAt: string;
  title: string;
  subtitle: string | null;
  linkPath: string | null;
}

export const bookmarkKeys = {
  list: ['bookmarks'] as const,
  ids: ['bookmarks', 'ids'] as const,
};

export function useBookmarks() {
  const signedIn = !!useAuthStore((s) => s.accessToken);
  return useQuery<{ bookmarks: Bookmark[]; tags: string[] }, Error>({
    queryKey: bookmarkKeys.list,
    queryFn: () =>
      apiFetch<{ bookmarks: Bookmark[]; tags: string[] }>('/api/academics/bookmarks'),
    enabled: signedIn,
  });
}

/**
 * The set of saved items, as "type:id" strings.
 *
 * One request drives every save icon on a page instead of one per card. Not
 * fetched at all when signed out — the icon renders unsaved and the tap
 * routes to sign-in, so there is nothing to ask the server.
 */
export function useBookmarkIds() {
  const signedIn = !!useAuthStore((s) => s.accessToken);
  return useQuery<Set<string>, Error>({
    queryKey: bookmarkKeys.ids,
    queryFn: async () => {
      const { ids } = await apiFetch<{ ids: string[] }>('/api/academics/bookmarks/ids');
      return new Set(ids);
    },
    enabled: signedIn,
    staleTime: 60_000,
  });
}

/** Optimistic toggle, rolled back on failure so the icon cannot lie. */
export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation<
    { saved: boolean },
    Error,
    { itemType: ItemType; itemId: string },
    { previous?: Set<string> }
  >({
    mutationFn: (body) =>
      apiFetch<{ saved: boolean }>('/api/academics/bookmarks/toggle', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onMutate: async ({ itemType, itemId }) => {
      await qc.cancelQueries({ queryKey: bookmarkKeys.ids });
      const previous = qc.getQueryData<Set<string>>(bookmarkKeys.ids);
      if (previous) {
        const next = new Set(previous);
        const k = `${itemType}:${itemId}`;
        if (next.has(k)) next.delete(k);
        else next.add(k);
        qc.setQueryData(bookmarkKeys.ids, next);
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(bookmarkKeys.ids, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: bookmarkKeys.ids });
      void qc.invalidateQueries({ queryKey: bookmarkKeys.list });
    },
  });
}

/**
 * Explicit removal from the Saved page.
 *
 * Separate from the toggle so pressing it twice, or on a stale list, removes
 * and stays removed rather than putting the item back.
 */
export function useRemoveBookmark() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, { itemType: ItemType; itemId: string }>({
    mutationFn: ({ itemType, itemId }) =>
      apiFetch<{ success: boolean }>(
        `/api/academics/bookmarks/${itemType}/${encodeURIComponent(itemId)}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookmarkKeys.list });
      void qc.invalidateQueries({ queryKey: bookmarkKeys.ids });
    },
  });
}

export function useRetagBookmark() {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean },
    Error,
    { itemType: ItemType; itemId: string; tag: string | null }
  >({
    mutationFn: ({ itemType, itemId, tag }) =>
      apiFetch<{ success: boolean }>(
        `/api/academics/bookmarks/${itemType}/${encodeURIComponent(itemId)}`,
        { method: 'PATCH', body: JSON.stringify({ tag }) },
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: bookmarkKeys.list }),
  });
}
