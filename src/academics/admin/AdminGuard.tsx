// =============================================================================
// academics/admin/AdminGuard.tsx
//
// Blocks admin content until the SERVER confirms admin access.
//
// The old per-page check read the role from localStorage, so editing that
// value revealed the admin shell (every action still 403'd, but the shell
// shouldn't render at all). This renders nothing until GET /admin/me
// succeeds, so a forged local role produces a redirect rather than a UI.
// =============================================================================

import type { ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAdminSession } from './hooks/useAdminSession';
import { AcademicsApiError } from '../api/academics.api';
import { useAuthStore } from '../../store/authStore';

interface AdminGuardProps {
  children: ReactNode;
  /** Optional permission required on top of being an admin. */
  permission?: string;
}

export function AdminGuard({ children, permission }: AdminGuardProps) {
  const { data: session, isLoading, isError, error, refetch, isFetching } =
    useAdminSession();
  const signedInUser = useAuthStore((s) => s.user);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-muted text-sm">
        <Loader2 size={18} className="animate-spin mr-2" />
        Checking access…
      </div>
    );
  }

  if (isError || !session) {
    const status = error instanceof AcademicsApiError ? error.statusCode : undefined;

    // Signed in, but this account isn't an admin (or was deactivated).
    // Sending them to a login form would be nonsense — they ARE logged in,
    // and logging in again as the same person changes nothing. Say what's
    // actually wrong and name the account, since the usual cause is being
    // signed in as a personal account rather than the admin one.
    // GENUINE "not an admin" — only a 403 reliably means the account lacks
    // admin. Sending them to a login form would be nonsense — they ARE logged
    // in, and re-logging as the same person changes nothing.
    if (status === 403) {
      return (
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <ShieldAlert size={36} className="mx-auto text-ink-muted mb-3" aria-hidden="true" />
          <h1 className="text-lg font-bold text-ink mb-1">This account isn't an admin</h1>
          <p className="text-sm text-ink-muted mb-5">
            You're signed in as{' '}
            <strong className="text-ink">{signedInUser?.email}</strong>, which doesn't have
            admin access. Sign out and sign back in with your admin account.
          </p>
          <Link
            to="/academics"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            Back to Academics
          </Link>
        </div>
      );
    }

    // Genuinely not authenticated — the login page is the right destination.
    if (status === 401) {
      return (
        <Navigate
          to={`/academics/login?next=${encodeURIComponent(window.location.pathname)}`}
          replace
        />
      );
    }

    // Anything else — a network blip, a 5xx, or the serverless DB cold-starting
    // after the tab sat idle a long time — is NOT proof the account lost admin.
    // This used to fall through to "isn't an admin": the exact false alarm an
    // admin hits after leaving a session open. Offer a retry instead of booting.
    console.warn(
      '[AdminGuard] admin/me failed transiently — offering retry. status=%s error=%s',
      status,
      error?.message,
    );
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShieldAlert size={36} className="mx-auto text-ink-muted mb-3" aria-hidden="true" />
        <h1 className="text-lg font-bold text-ink mb-1">Couldn't verify your access</h1>
        <p className="text-sm text-ink-muted mb-5">
          The server didn't respond just now — this can happen after the app has
          been idle for a while. Your admin access is fine; just try again.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          {isFetching ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    );
  }

  // Authenticated admin, but lacking the specific grant for this page. Told
  // plainly rather than redirected, so it doesn't look like a login failure.
  if (permission && !session.permissions.includes(permission)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShieldAlert size={36} className="mx-auto text-ink-muted mb-3" aria-hidden="true" />
        <h1 className="text-lg font-bold text-ink mb-1">You don't have access to this</h1>
        <p className="text-sm text-ink-muted">
          Your account doesn't include the{' '}
          <code className="px-1 py-0.5 rounded bg-gray-100 text-xs">{permission}</code>{' '}
          permission. Ask a super admin if you need it.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
