// =============================================================================
// lib/versionCheck.ts
//
// Notices when a new build has been deployed, without waiting for a cache to
// expire.
//
// GitHub Pages serves index.html with Cache-Control: max-age=600 and gives us
// no way to change that, so a browser can keep serving a ten-minute-old page —
// which means a deploy looks like it did nothing, and the only advice is
// "wait, or hard-refresh". That is not an acceptable answer for real users.
//
// The way out is a request the HTTP cache cannot answer. `cache: 'no-store'`
// bypasses it entirely, so a tiny version.json can be checked at any time and
// always reflects what is actually on the server. Compare it to the version
// compiled into this bundle and, if they differ, a new build exists.
//
// It only ever RELOADS, never silently swaps code, and it reloads through
// chunkRecovery's cache-busting path so the fresh HTML genuinely arrives
// rather than being served from cache again.
//
// Guarded so it cannot loop: one reload per detected version, remembered in
// sessionStorage. If the reload somehow lands on the old build again, it
// stops rather than cycling forever.
// =============================================================================

const LAST_RELOADED_FOR = 'pediaid_version_reloaded_for';

/** Injected at build time; see vite.config.ts define. */
declare const __BUILD_ID__: string;

function currentBuildId(): string {
  try {
    return typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : '';
  } catch {
    return '';
  }
}

async function fetchDeployedBuildId(): Promise<string | null> {
  try {
    // no-store, not no-cache: no-cache still revalidates through the HTTP
    // cache, while no-store refuses to involve it at all. That distinction is
    // the entire point of this file.
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const body = (await res.json()) as { buildId?: string };
    return typeof body.buildId === 'string' ? body.buildId : null;
  } catch {
    // Offline, or version.json not deployed yet. Staying quiet is right:
    // this is an enhancement, and it must never break a working page.
    return null;
  }
}

async function checkOnce(): Promise<void> {
  const mine = currentBuildId();
  if (!mine) return;

  const deployed = await fetchDeployedBuildId();
  if (!deployed || deployed === mine) return;

  try {
    if (sessionStorage.getItem(LAST_RELOADED_FOR) === deployed) {
      // Already reloaded for this version and still on the old bundle —
      // something is wrong upstream and looping would only make it worse.
      console.warn('[version] Newer build %s seen, but a reload already happened.', deployed);
      return;
    }
    sessionStorage.setItem(LAST_RELOADED_FOR, deployed);
  } catch {
    // No sessionStorage means no loop guard, and an unguarded reload loop is
    // worse than a stale page.
    return;
  }

  console.info('[version] New build %s deployed (running %s) — reloading.', deployed, mine);

  // Straight to a URL the cache has never seen, for the reason documented in
  // chunkRecovery: reload() on a deep path is laundered through 404.html into
  // an ordinary, cacheable navigation.
  const { pathname, search, hash } = window.location;
  const cleanSearch = search.replace(/[?&]_cb=\d+/g, '').replace(/^&/, '?');
  const encoded = encodeURIComponent(pathname.slice(1) + cleanSearch);
  window.location.replace(`/?p=${encoded}&_cb=${Date.now()}${hash}`);
}

/**
 * Checks on load, whenever the tab regains focus, and every 5 minutes.
 *
 * Focus is the one that matters in practice: someone leaves a tab open, comes
 * back after a deploy, and gets the current build without knowing any of this
 * happened. The interval is a backstop for a tab that never loses focus.
 */
export function initVersionCheck(): void {
  void checkOnce();

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkOnce();
  });

  window.setInterval(() => void checkOnce(), 5 * 60 * 1000);
}
