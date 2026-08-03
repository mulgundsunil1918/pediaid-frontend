// =============================================================================
// lib/chunkRecovery.ts
//
// Recovers from a stale cached index.html.
//
// Every deploy emits a new hashed bundle and removes the previous one. A
// browser still holding an older index.html asks for a script that no longer
// exists, the dynamic import rejects, and the app renders nothing — a blank
// white page with no visible error.
//
// The cache-control meta tags in index.html stop this happening again, but
// only once a browser has fetched the new HTML at least once. Anyone already
// holding a stale copy would stay broken until they manually hard-refreshed,
// which ordinary users will never think to do. So: detect the failure and
// reload once, bypassing cache.
//
// Guarded by sessionStorage — if the reload doesn't fix it, the problem is
// something else and looping would make it strictly worse.
// =============================================================================

const RELOAD_FLAG = 'pediaid_chunk_reload_attempted';

/** Errors that mean "the JS file I asked for isn't there any more". */
function isStaleChunkError(message: string): boolean {
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /ChunkLoadError/i.test(message) ||
    /Loading chunk \d+ failed/i.test(message)
  );
}

function recover(message: string): void {
  if (!isStaleChunkError(message)) return;

  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) {
      // Already tried. Reloading again would loop forever on a genuine bug.
      console.error('[chunk-recovery] Reload already attempted; not retrying.', message);
      return;
    }
    sessionStorage.setItem(RELOAD_FLAG, '1');
  } catch {
    // sessionStorage unavailable — without a guard a reload could loop, so
    // do nothing rather than risk it.
    return;
  }

  console.warn('[chunk-recovery] Stale bundle detected, reloading once.', message);
  window.location.reload();
}

export function initChunkRecovery(): void {
  // A failed dynamic import surfaces as an unhandled rejection.
  window.addEventListener('unhandledrejection', (e) => {
    recover(String((e.reason as Error | undefined)?.message ?? e.reason ?? ''));
  });

  // Script/preload tags that 404 surface as error events instead.
  window.addEventListener('error', (e) => {
    recover(String(e.message ?? ''));
  });

  // A successful render means whatever we have is coherent — clear the flag
  // so a future stale deploy can be recovered from too.
  window.addEventListener('load', () => {
    try {
      sessionStorage.removeItem(RELOAD_FLAG);
    } catch {
      /* ignore */
    }
  });
}
