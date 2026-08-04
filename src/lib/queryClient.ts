// =============================================================================
// lib/queryClient.ts
//
// The app's single React Query client, in a module so non-React code can
// reach it.
//
// It used to be a const inside App.tsx, which meant only components could
// touch it — and the two places that most needed to (sign-in and sign-out,
// both plain async functions in firebaseAuth.ts) could not. So the cache was
// never cleared by anything, ever.
//
// That is how one account ended up seeing another's details. Query keys here
// carry no user id — the profile lives at ['dashboard','profile'], full stop —
// so after signing out and back in as someone else, every cached entry still
// answered for the previous person until it happened to refetch. Names,
// qualifications and institutions from account A were served to account B.
//
// Clearing on BOTH sign-in and sign-out is deliberate, not belt-and-braces:
//   - on sign-out, so nothing personal is left in memory for the next person
//     at the same browser;
//   - on sign-in, because a session can begin without a sign-out ever
//     happening (an expired token, a restored tab, a second Google account),
//     and that path would otherwise inherit the whole stale cache.
// =============================================================================

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Drops every cached query and any in-flight result.
 *
 * `clear()` rather than `invalidateQueries()`: invalidation marks data stale
 * but KEEPS serving it while the refetch runs, so the previous account's name
 * would still paint on screen for a moment. For a cache crossing an identity
 * boundary, showing it briefly is the bug.
 */
export function resetQueryCache(): void {
  queryClient.clear();
}
