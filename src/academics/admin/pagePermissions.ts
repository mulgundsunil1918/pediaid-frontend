// =============================================================================
// academics/admin/pagePermissions.ts
//
// Which permission each admin page needs - one table, used for BOTH the sidebar
// (hide what you cannot open) and the page guard (refuse it if you type the
// URL anyway). Two lists would drift: a page could be hidden from the menu and
// still open, or shown in the menu and then refuse.
//
// The server is what actually enforces these (backend admin-access.ts); this
// only decides what the screen offers.
// =============================================================================

const BASE = '/academics/admin';

/** `null` = any administrator. */
const EXACT: Record<string, string | null> = {
  [BASE]: null,
  [`${BASE}/status`]: 'settings.read',
  [`${BASE}/trials`]: 'content.read',
  [`${BASE}/guideline-notes`]: 'content.read',
  // The page is for CHANGING the lever (reading it is public).
  [`${BASE}/app-control`]: 'settings.write',
  [`${BASE}/taxonomy`]: 'taxonomy.read',
  [`${BASE}/users`]: 'users.read',
  [`${BASE}/analytics`]: 'reports.read',
  [`${BASE}/pending-applications`]: 'users.read',
  [`${BASE}/credentials`]: 'credentials.read',
  [`${BASE}/content`]: 'content.read',
  [`${BASE}/submissions`]: 'content.read',
  [`${BASE}/never-again`]: 'content.read',
  [`${BASE}/never-again/pending`]: 'content.read',
  [`${BASE}/role-requests`]: 'users.read',
  [`${BASE}/notify`]: 'notifications.write',
  [`${BASE}/cme`]: 'conferences.read',
  // Security: super admins only (never grantable).
  [`${BASE}/admins`]: 'admins.manage',
  [`${BASE}/activity`]: 'admins.manage',
};

/**
 * The permission needed to open `pathname`, or `null` when any administrator
 * may. Unknown paths need nothing here (the router 404s them).
 */
export function permissionForPath(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path in EXACT) return EXACT[path] ?? null;

  // /academics/admin/cme/:eventType[/pending] - workshops are their own module;
  // conferences, webinars and courses share one (mirrors the server's rule).
  const cme = /^\/academics\/admin\/cme\/([^/]+)(?:\/pending)?$/.exec(path);
  if (cme) return cme[1] === 'workshop' ? 'workshops.read' : 'conferences.read';

  return null;
}
