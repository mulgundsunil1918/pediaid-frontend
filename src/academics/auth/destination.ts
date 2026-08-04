// =============================================================================
// academics/auth/destination.ts
//
// Where a signed-in user belongs, by role.
//
// Extracted because two screens now need it. It used to live only inside
// LoginPage, so when the onboarding flow started sending people onward it had
// no way to ask — and an admin who skipped the details step was dropped on the
// public Academics page instead of their dashboard.
// =============================================================================

import type { AcadUserRole } from '../types';

/** The screen this role should land on after signing in. */
export function defaultDestinationFor(role: AcadUserRole | string | undefined): string {
  if (role === 'admin' || role === 'super_admin') return '/academics/admin';
  if (role === 'author' || role === 'moderator') return '/academics/dashboard';
  return '/academics';
}

/**
 * Whether to offer the post-sign-in details step.
 *
 * Two conditions, both necessary:
 *
 *  - The clinical fields are genuinely empty. Google gives us a name and an
 *    email and nothing else, so a fresh account always qualifies.
 *  - The user isn't staff. Onboarding exists to profile new readers; diverting
 *    an admin or moderator away from the work screen they signed in to reach
 *    is friction with no payoff, and their profile completeness is not what
 *    the platform uses their account for.
 */
export function needsProfileDetails(
  role: AcadUserRole | string | undefined,
  profile: { qualification?: string | null; specialty?: string | null } | null | undefined,
): boolean {
  if (role === 'admin' || role === 'super_admin' || role === 'moderator') return false;
  if (!profile) return true;
  return !profile.qualification?.trim() && !profile.specialty?.trim();
}
