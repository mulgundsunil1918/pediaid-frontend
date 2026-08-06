// =============================================================================
// academics/auth/ssoHandoff.ts
//
// Picks up a session handed over from the PediAid app.
//
// The app and Academics are separate origins and cannot share a session, so
// signing into one never signed you into the other — and neither surface said
// so, which is how a bookmark could save "successfully" into a list you were
// not looking at. The app mints a one-time code, opens Academics with
// ?sso=<code>, and this trades it for the same account's session here.
//
// The code is single-use and expires in 60 seconds, so the copy left behind in
// browser history is dead almost immediately. It is still stripped from the URL
// on arrival — a spent code is not a secret, but leaving it in the address bar
// invites someone to copy the link and wonder why it does not work.
// =============================================================================

import { API_BASE } from '../../lib/apiBase';
import { useAuthStore } from '../../store/authStore';
import type { AuthResponse } from '../types';

const PARAM = 'sso';

/** Removes the code from the address bar without adding a history entry. */
function stripParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PARAM)) return;
  url.searchParams.delete(PARAM);
  window.history.replaceState(null, '', url.toString());
}

/**
 * Runs once at start-up, before the app renders anything that depends on auth.
 *
 * Resolves either way — a failed handoff must never block the page. Academics
 * still works signed out, which is exactly what it did before this existed.
 */
export async function consumeSsoHandoff(): Promise<void> {
  const code = new URLSearchParams(window.location.search).get(PARAM);
  if (!code) return;

  // Strip first. If the exchange throws, the dead code should not survive in
  // the URL to be retried on every refresh.
  stripParam();

  // Already signed in as somebody on this origin: replace that session rather
  // than keeping it. The app is the surface the user just came from, so its
  // account is the one they mean — and silently keeping a different one is the
  // exact confusion this feature exists to end.
  try {
    const res = await fetch(`${API_BASE}/api/academics/auth/sso-exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) return;
    const auth = (await res.json()) as AuthResponse;
    if (!auth?.accessToken) return;
    useAuthStore.getState().setAuth(auth);
  } catch {
    // Network failure during handoff. Nothing to report — the page loads
    // signed out and the user can sign in normally.
  }
}
