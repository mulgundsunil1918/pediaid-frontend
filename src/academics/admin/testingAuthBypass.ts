// =============================================================================
// academics/admin/testingAuthBypass.ts
//
// TEMPORARY, testing-phase-only switch. While true, every admin/moderator
// route guard skips its login check and renders directly — no sign-in
// required to reach the admin dashboard.
//
// To turn real admin login back on: set this back to `false` (matching
// change needed in backend/src/academics/auth/auth.middleware.ts, search
// for ADMIN_AUTH_DISABLED) and redeploy both.
// =============================================================================

export const ADMIN_AUTH_DISABLED = true;
