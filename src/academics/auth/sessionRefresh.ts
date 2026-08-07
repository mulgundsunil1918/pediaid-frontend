// =============================================================================
// academics/auth/sessionRefresh.ts
//
// Silent access-token refresh loop. On app boot we try once to rotate the
// token pair using whatever refresh token is in localStorage (via the
// auth store), and then schedule a periodic refresh every REFRESH_INTERVAL
// so the access token never expires while the tab is open.
//
// This file also exports `refreshAccessToken()` as a standalone helper so
// the API client can call it on a 401 to recover in-flight requests
// without kicking the user to the login page.
//
// IMPORTANT: the only place that should call clearAuth() is an explicit
// logout button OR a refresh failure (refresh token is itself expired
// or revoked). A 401 on a normal request does NOT imply logout — it
// just means the access token expired and we need to rotate.
// =============================================================================

import { useAuthStore } from '../../store/authStore';
import { API_BASE } from '../../lib/apiBase';
import type { AuthResponse } from '../types';

/**
 * How often to proactively rotate the access token while the tab is open.
 *
 * With a 7-day access token TTL on the backend, we rotate every 6 days so
 * any still-mounted tab continuously refreshes its credentials before the
 * current token expires. Users who keep a tab open for weeks at a time
 * will never see a login page.
 */
const REFRESH_INTERVAL_MS = 6 * 24 * 60 * 60 * 1000; // 6 days

let refreshTimer: ReturnType<typeof setInterval> | null = null;
// De-duplicate concurrent refresh attempts — if several 401s land at once
// we only want one network call and they all wait on the same promise.
let inflight: Promise<boolean> | null = null;

/**
 * Rotate the access + refresh token pair using the refresh token currently
 * in the store. Returns true on success, false if the refresh token is
 * missing or rejected by the server. On failure we clear auth so the
 * _AuthGate / protected routes redirect to login. On success the new
 * tokens are written back to the store.
 *
 * Concurrent callers share the same promise.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (inflight) return inflight;

  inflight = (async () => {
    const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
    if (!refreshToken) {
      return false;
    }

    try {
      const res = await fetch(`${API_BASE}/api/academics/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // The refresh token is dead — expired, revoked, or rotated out by
        // another surface. Drop ONLY the refresh token.
        //
        // This used to clearAuth(), and that was the engine of the "Save
        // keeps asking me to sign in" loop inside the app. Refresh tokens
        // here are single-use: the backend revokes one the moment it is
        // spent. The app hands its session to this web view, this app
        // rotates the pair on boot — revoking the app's copy — and the next
        // time the web view opened, the app re-injected that now-revoked
        // token over our good one. Boot rotation then failed, landed here,
        // and clearAuth() threw away a perfectly valid access token along
        // with the dead refresh token. Result: signed out on arrival, every
        // Save and Like bouncing to Google, intermittently, for days.
        //
        // A dead refresh token says nothing about the access token, which
        // has a 7-day TTL of its own. Keep it. If it is genuinely expired,
        // the next real API call 401s, the retry finds no refresh token,
        // and THAT path signs the user out — the only place that should.
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
          useAuthStore.setState({ refreshToken: null });
        } else {
          clearAuth();
        }
        return false;
      }

      const data = (await res.json()) as AuthResponse;
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return true;
    } catch {
      // Network error — keep existing tokens and try again later. The
      // user's tab is probably offline; we don't want a flaky connection
      // to log them out.
      return false;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/**
 * Call once from App.tsx on mount. Attempts an initial refresh so a stale
 * access token gets rotated before the first API call fires, then schedules
 * a background refresh every 50 minutes.
 *
 * Safe to call multiple times — the timer is idempotent.
 */
export function initSessionRefresh(): void {
  // Kick off an initial rotation if we have a refresh token in storage.
  // This covers the "user reopens tab after a few hours" case where the
  // persisted access token is expired but the refresh token is still
  // valid.
  const { refreshToken } = useAuthStore.getState();
  if (refreshToken) {
    void refreshAccessToken();
  }

  // Idempotent timer reset
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    const current = useAuthStore.getState();
    if (current.refreshToken) {
      void refreshAccessToken();
    }
  }, REFRESH_INTERVAL_MS);
}

/**
 * Stops the background refresh timer. Called by logout flow so a
 * spurious timer doesn't re-authenticate after manual logout.
 */
export function stopSessionRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
