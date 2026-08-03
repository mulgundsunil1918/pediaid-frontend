// =============================================================================
// academics/never-again/hooks/useNeverAgain.ts
//
// Web client for the "Never Again" anonymous peer-learning module. Mirrors
// flutter/lib/services/never_again_service.dart's device_id + endpoint
// shapes exactly, using the shared apiFetch wrapper (academics.api.ts) as
// its transport instead of a 4th bespoke fetch variant. All endpoints here
// are public — apiFetch attaches an auth header if one happens to be
// present, but none of these calls require it.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../api/academics.api';

// ---------------------------------------------------------------------------
// device_id — anonymous identity for posting + finding your own submissions.
// Web equivalent of the Flutter app's SharedPreferences-backed UUID.
// ---------------------------------------------------------------------------

const DEVICE_ID_KEY = 'pediaid_never_again_device_id';

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage blocked (private mode, etc.) — fall back to a
    // session-only id so the current submit/feed flow still works.
    return crypto.randomUUID();
  }
}

// ---------------------------------------------------------------------------
// Types — mirror never-again.routes.ts response shapes
// ---------------------------------------------------------------------------

export interface NeverAgainPost {
  id: number;
  whatHappened: string;
  whatWentWrong: string;
  theLesson: string;
  category: string;
  role: string | null;
  resonatedCount: number;
  createdAt: string;
}

interface RawPost {
  id: number;
  what_happened: string;
  what_went_wrong: string;
  the_lesson: string;
  category: string;
  role: string | null;
  resonated_count: number;
  created_at: string;
}

function fromRaw(p: RawPost): NeverAgainPost {
  return {
    id: p.id,
    whatHappened: p.what_happened,
    whatWentWrong: p.what_went_wrong,
    theLesson: p.the_lesson,
    category: p.category,
    role: p.role,
    resonatedCount: p.resonated_count,
    createdAt: p.created_at,
  };
}

export interface SubmitNeverAgainInput {
  whatHappened: string;
  whatWentWrong: string;
  theLesson: string;
  category: string;
  role?: string;
  email?: string;
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

export function useNeverAgainFeed(category: string | null) {
  const [posts, setPosts] = useState<NeverAgainPost[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (targetPage: number, append: boolean) => {
      append ? setIsLoadingMore(true) : setIsLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(targetPage), limit: '20' });
        if (category) params.set('category', category);
        const body = await apiFetch<{ posts: RawPost[]; total: number; hasMore: boolean }>(
          `/api/never-again?${params}`,
        );
        const mapped = body.posts.map(fromRaw);
        setPosts((prev) => (append ? [...prev, ...mapped] : mapped));
        setTotal(body.total);
        setHasMore(body.hasMore);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [category],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    load(page + 1, true);
  }, [hasMore, isLoadingMore, page, load]);

  return { posts, total, hasMore, isLoading, isLoadingMore, error, loadMore, refresh: () => load(1, false) };
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

export async function submitNeverAgainPost(input: SubmitNeverAgainInput): Promise<void> {
  await apiFetch('/api/never-again', {
    method: 'POST',
    body: JSON.stringify({
      what_happened: input.whatHappened,
      what_went_wrong: input.whatWentWrong,
      the_lesson: input.theLesson,
      category: input.category,
      role: input.role || null,
      device_id: getOrCreateDeviceId(),
      ...(input.email?.trim() ? { email: input.email.trim() } : {}),
    }),
  });
}
