// =============================================================================
// lib/chunkRecovery.ts
//
// Recovers from a stale cached index.html.
//
// Every deploy emits a new hashed bundle and removes the previous one. A
// browser still holding an older index.html asks for a script that no longer
// exists, the dynamic import rejects, and the route renders nothing.
//
// Why a plain reload() is not enough (this took three attempts to get right):
//
//   GitHub Pages serves index.html with `Cache-Control: max-age=600` and gives
//   us no way to change that. On a deep link like /academics/admin/content,
//   GitHub has no such file, so it serves 404.html — which immediately
//   location.replace()s to '/?p=<path>'. That replace is an ORDINARY
//   navigation, so it hits the HTTP cache and hands back the very same stale
//   index.html that caused the problem. The reload's cache-bypass applies only
//   to the URL being reloaded; the redirect launders it away.
//
//   So the reload has to go to a URL the cache has never seen. Adding a
//   throwaway `_cb` timestamp guarantees a cache miss and a genuinely fresh
//   index.html. We navigate straight to '/?p=...' ourselves rather than
//   bouncing through 404.html, and index.html's own restore script (which
//   matches `p=([^&]*)`) rewrites the address bar back to the clean path,
//   dropping `_cb` along the way.
//
// The retry guard is time-boxed rather than once-per-session. Each lazy route
// is its own chunk: hitting a dead chunk on Credentials must not permanently
// disable recovery for Content. A short window is enough to stop a genuine
// bug from looping while still letting a later, unrelated route heal itself.
// =============================================================================

const RELOAD_STAMP = 'pediaid_chunk_reload_at';
const RETRY_WINDOW_MS = 30_000;

/** Errors that mean "the JS file I asked for isn't there any more". */
export function isStaleChunkError(message: string): boolean {
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /ChunkLoadError/i.test(message) ||
    /Loading chunk \d+ failed/i.test(message)
  );
}

/** True if we already reloaded very recently — another one would be a loop. */
function reloadedRecently(): boolean {
  try {
    const at = Number(sessionStorage.getItem(RELOAD_STAMP) ?? 0);
    return at > 0 && Date.now() - at < RETRY_WINDOW_MS;
  } catch {
    // No sessionStorage means no loop protection, and an unguarded reload
    // loop is worse than an error card. Treat it as "already tried".
    return true;
  }
}

function markReloaded(): void {
  try {
    sessionStorage.setItem(RELOAD_STAMP, String(Date.now()));
  } catch {
    /* handled by reloadedRecently */
  }
}

export function recoverFromStaleChunk(message: string): void {
  if (!isStaleChunkError(message)) return;

  if (reloadedRecently()) {
    console.error('[chunk-recovery] Reloaded moments ago; not retrying.', message);
    return;
  }
  markReloaded();

  console.warn('[chunk-recovery] Stale bundle detected, fetching a fresh one.', message);

  const go = () => {
    const { pathname, search, hash } = window.location;
    // Strip any previous cache-buster so it can't accumulate.
    const cleanSearch = search.replace(/[?&]_cb=\d+/g, '').replace(/^&/, '?');
    // Base-relative, NOT the origin root. On the old subdomain '/' was this
    // app; on the shared origin '/' is the main PediAid app — so this line
    // used to teleport a stale Academics tab into the app's login screen,
    // nested inside the Academics screen of the app itself. The path after
    // the base is what index.html's ?p= restore expects.
    const base = import.meta.env.BASE_URL; // '/academics/'
    const rest = pathname.startsWith(base)
      ? pathname.slice(base.length)
      : pathname.replace(/^\//, '');
    const encoded = encodeURIComponent(rest + cleanSearch);
    window.location.replace(`${base}?p=${encoded}&_cb=${Date.now()}${hash}`);
  };

  // A stale Cache Storage entry would survive the cache-busted URL, so clear
  // it first. Best effort, and never let it block the navigation.
  if ('caches' in window) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => undefined)
      .finally(go);
  } else {
    go();
  }
}

export function initChunkRecovery(): void {
  // A failed dynamic import surfaces as an unhandled rejection...
  window.addEventListener('unhandledrejection', (e) => {
    recoverFromStaleChunk(String((e.reason as Error | undefined)?.message ?? e.reason ?? ''));
  });

  // ...and script/preload tags that 404 surface as error events instead.
  window.addEventListener('error', (e) => {
    recoverFromStaleChunk(String(e.message ?? ''));
  });
}
