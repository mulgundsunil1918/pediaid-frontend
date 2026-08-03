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
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAdminSession } from './hooks/useAdminSession';

interface AdminGuardProps {
  children: ReactNode;
  /** Optional permission required on top of being an admin. */
  permission?: string;
}

export function AdminGuard({ children, permission }: AdminGuardProps) {
  const { data: session, isLoading, isError } = useAdminSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-muted text-sm">
        <Loader2 size={18} className="animate-spin mr-2" />
        Checking access…
      </div>
    );
  }

  // 401/403, deactivated account, or no longer an admin — all mean "leave".
  if (isError || !session) {
    return (
      <Navigate
        to={`/academics/login?next=${encodeURIComponent(window.location.pathname)}`}
        replace
      />
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
