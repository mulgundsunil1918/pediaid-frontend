// =============================================================================
// academics/onboarding/onboardingStorage.ts
//
// Remembers what a visitor has already been shown, so the tutorial greets
// people once rather than every time they open the site.
//
// localStorage, not the user account: the tutorial runs BEFORE sign-in, so
// there is no account to hang it off yet. That means it's per-browser — a
// returning user on a new device sees it again, which is the right trade for
// not gating the intro behind the thing it's meant to introduce.
//
// Every access is wrapped: Safari private mode throws on localStorage rather
// than returning null, and an exception here would take down the first screen
// a new visitor ever sees.
// =============================================================================

const TUTORIAL_SEEN = 'pediaid_tutorial_seen';
const NUDGE_DISMISSED = 'pediaid_profile_nudge_dismissed';

/**
 * In-memory backstop for the "seen" flag.
 *
 * Reading and writing localStorage fail independently: Safari private mode and
 * a full quota both let getItem() succeed (returning null) while setItem()
 * throws. That split is what makes this dangerous — the login page redirects
 * to the tutorial because the flag reads as unset, the tutorial writes the
 * flag and sends the user back to login, the write silently failed, and the
 * two bounce forever. Verified with a simulation before shipping: without
 * this flag the loop does not terminate.
 *
 * Module scope survives client-side navigation, which is exactly the span the
 * loop would occur over. A real page reload clears it, and by then the write
 * may well succeed anyway — worst case the tutorial shows once more.
 */
let seenInThisSession = false;

export function hasSeenTutorial(): boolean {
  if (seenInThisSession) return true;
  try {
    return localStorage.getItem(TUTORIAL_SEEN) === '1';
  } catch {
    // Storage unavailable — treat as "seen" so a broken localStorage can't
    // trap someone on the tutorial every single navigation.
    return true;
  }
}

export function markTutorialSeen(): void {
  // Set first and unconditionally: this is the half that cannot fail, and it
  // is what breaks the loop when the persistent write does.
  seenInThisSession = true;
  try {
    localStorage.setItem(TUTORIAL_SEEN, '1');
  } catch {
    /* in-memory flag already covers this session */
  }
}

/** Used by the "Show tutorial again" menu entry. */
export function resetTutorial(): void {
  seenInThisSession = false;
  try {
    localStorage.removeItem(TUTORIAL_SEEN);
  } catch {
    /* ignore */
  }
}

export function isNudgeDismissed(): boolean {
  try {
    return localStorage.getItem(NUDGE_DISMISSED) === '1';
  } catch {
    return false;
  }
}

export function dismissNudge(): void {
  try {
    localStorage.setItem(NUDGE_DISMISSED, '1');
  } catch {
    /* ignore */
  }
}
