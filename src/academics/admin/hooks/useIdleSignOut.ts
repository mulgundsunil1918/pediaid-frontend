// =============================================================================
// academics/admin/hooks/useIdleSignOut.ts
//
// Signs an administrator out after a stretch with no activity.
//
// An admin session is powerful and long-lived: the access token lasts days and
// is silently renewed, so a laptop left open on this panel stays signed in
// indefinitely. Closing that gap is cheap - after 30 idle minutes the panel
// warns for a minute and then signs out.
//
// "Activity" is any pointer, key, scroll or touch event, in ANY open tab of the
// panel (the last-activity time is shared through localStorage), so working in
// one tab never signs out another. If storage is unavailable it falls back to
// this tab alone.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';

export const IDLE_LIMIT_MS = 30 * 60_000;
export const IDLE_WARN_MS = 60_000;

const KEY = 'pediaid_admin_last_activity';

export type IdleStatus =
  | { state: 'active' }
  | { state: 'warning'; secondsLeft: number }
  | { state: 'expired' };

/** Pure, so the thresholds can be checked without a browser or a clock. */
export function idleStatus(
  now: number,
  lastActivity: number,
  limitMs = IDLE_LIMIT_MS,
  warnMs = IDLE_WARN_MS,
): IdleStatus {
  const idle = Math.max(0, now - lastActivity);
  if (idle >= limitMs) return { state: 'expired' };
  if (idle >= limitMs - warnMs) {
    return { state: 'warning', secondsLeft: Math.ceil((limitMs - idle) / 1000) };
  }
  return { state: 'active' };
}

function readShared(): number {
  try {
    const v = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

function writeShared(t: number): void {
  try {
    window.localStorage.setItem(KEY, String(t));
  } catch {
    // Private mode / blocked storage: this tab still tracks its own activity.
  }
}

const EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel', 'mousemove'] as const;

/**
 * Returns the current idle status and a `stay()` that counts as activity.
 * `onExpire` is called once when the limit passes.
 */
export function useIdleSignOut(onExpire: () => void) {
  const [status, setStatus] = useState<IdleStatus>({ state: 'active' });
  const last = useRef(Date.now());
  const done = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const touch = useCallback(() => {
    if (done.current) return;
    const now = Date.now();
    // mousemove fires hundreds of times a second; once a second is plenty.
    if (now - last.current < 1_000) return;
    last.current = now;
    writeShared(now);
  }, []);

  const check = useCallback(() => {
    if (done.current) return;
    const lastAny = Math.max(last.current, readShared());
    const next = idleStatus(Date.now(), lastAny);
    if (next.state === 'expired') {
      done.current = true;
      setStatus(next);
      onExpireRef.current();
      return;
    }
    setStatus((prev) =>
      prev.state === next.state &&
      (prev.state !== 'warning' || (next.state === 'warning' && prev.secondsLeft === next.secondsLeft))
        ? prev
        : next,
    );
  }, []);

  useEffect(() => {
    // The clock starts when the panel is opened. A visit that follows recent
    // activity (another tab, or a reload) carries on from it; a stale value from
    // an earlier day must not sign someone out the instant they arrive.
    const shared = readShared();
    last.current = shared && Date.now() - shared < IDLE_LIMIT_MS ? shared : Date.now();
    writeShared(last.current);

    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = window.setInterval(check, 1_000);
    // A tab that slept (laptop lid, background tab) has no timers firing; check
    // the moment it wakes rather than waiting for the next tick.
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [touch, check]);

  const stay = useCallback(() => {
    const now = Date.now();
    last.current = now;
    writeShared(now);
    setStatus({ state: 'active' });
  }, []);

  return { status, stay };
}
