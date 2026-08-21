// =============================================================================
// academics/admin/pages/AdminOverviewPage.tsx — Admin dashboard overview
// Route: /academics/admin
// =============================================================================

import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Clock,
  Eye,
  BadgeCheck,
  CheckCircle,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import { usePlatformStats } from '../hooks/useAdmin';
import type { RecentActivityEntry, TopChapter } from '../hooks/useAdmin';
import { safeFixed, safeCompact } from '../../../lib/safeNumber';
import { SignupGrowthChart } from '../components/SignupGrowthChart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtNumber(n: number | null | undefined): string {
  return safeCompact(n);
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function StatSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card p-5 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatTile
// ---------------------------------------------------------------------------

interface StatTileProps {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  onClick?: () => void;
  urgent?: boolean;
}

function StatTile({ label, value, sub, color, icon, onClick, urgent }: StatTileProps) {
  const urgentClass = urgent && typeof value === 'number' && value > 0
    ? 'ring-2 ring-warning ring-offset-1'
    : '';

  return (
    <div
      className={[
        'bg-white rounded-card shadow-card p-5 transition-all',
        onClick ? 'cursor-pointer hover:shadow-card-hover' : '',
        urgentClass,
      ].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</p>
        <span className={`p-2 rounded-lg ${color}`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-ink mb-1">
        {typeof value === 'number' ? fmtNumber(value) : value}
      </p>
      {sub && <p className="text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

function RoleBadge({ role, count }: { role: string; count: number }) {
  const colors: Record<string, string> = {
    reader: 'bg-gray-100 text-gray-700',
    author: 'bg-blue-100 text-accent',
    moderator: 'bg-purple-100 text-purple-700',
    admin: 'bg-red-100 text-danger',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors[role] ?? 'bg-gray-100 text-gray-700'}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
      <span className="font-bold">{count}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status, count }: { status: string; count: number }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-warning',
    approved: 'bg-green-100 text-success',
    rejected: 'bg-red-100 text-danger',
    archived: 'bg-gray-200 text-gray-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
      <span className="font-bold">{count}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Activity icon
// ---------------------------------------------------------------------------

function ActivityIcon({ action }: { action: string }) {
  const lower = action.toLowerCase();
  if (lower.includes('approv') || lower.includes('publish')) {
    return <CheckCircle size={15} className="text-success" />;
  }
  if (lower.includes('verif')) {
    return <UserCheck size={15} className="text-accent" />;
  }
  if (lower.includes('reject') || lower.includes('delete')) {
    return <AlertTriangle size={15} className="text-danger" />;
  }
  return <TrendingUp size={15} className="text-ink-muted" />;
}

// ---------------------------------------------------------------------------
// ActivityFeed
// ---------------------------------------------------------------------------

function ActivityFeed({ items }: { items: RecentActivityEntry[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted py-4 text-center">No recent activity.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3">
          <span className="mt-0.5 flex-shrink-0">
            <ActivityIcon action={entry.action} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink leading-snug">
              <span className="font-semibold">{entry.actorName}</span>
              {' → '}
              <span className="text-accent">{entry.action}</span>
              {' → '}
              <span className="italic truncate">{entry.entityTitle}</span>
            </p>
            <p className="text-xs text-ink-muted mt-0.5">{relativeTime(entry.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// TopChaptersTable
// ---------------------------------------------------------------------------

function TopChaptersTable({ chapters }: { chapters: TopChapter[] }) {
  if (chapters.length === 0) {
    return <p className="text-sm text-ink-muted py-4 text-center">No published chapters yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">Title</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">Author</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">Views</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden sm:table-cell">Published</th>
          </tr>
        </thead>
        <tbody>
          {chapters.map((ch) => (
            <tr key={ch.id} className="border-b border-border/50 hover:bg-gray-50">
              <td className="py-2.5 px-3">
                <a
                  href={`/academics/c/${ch.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline font-medium flex items-center gap-1 max-w-xs"
                >
                  <span className="truncate">{ch.title}</span>
                  <ExternalLink size={11} className="flex-shrink-0" />
                </a>
              </td>
              <td className="py-2.5 px-3 text-ink-muted">{ch.authorName}</td>
              <td className="py-2.5 px-3 text-right font-mono text-ink">{fmtNumber(ch.viewCount)}</td>
              <td className="py-2.5 px-3 text-ink-muted hidden sm:table-cell">
                {new Date(ch.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminOverviewPage
// ---------------------------------------------------------------------------

export function AdminOverviewPage() {
  // Access is enforced by AdminGuard in AdminLayout, which asks the server
  // (GET /admin/me). The old check here read the role from localStorage —
  // untrustworthy, and it matched 'admin' exactly, so a super_admin was
  // redirected to login, which then bounced back here: an infinite loop
  // that rendered a blank page.

  const navigate = useNavigate();
  const { data: stats, isLoading, isError, error } = usePlatformStats();

  if (isError) {
    return (
      <AdminLayout>
        <div>
          <h2 className="text-xl font-bold text-primary mb-6">Overview</h2>
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger">
            Couldn't load dashboard stats — {error instanceof Error ? error.message : 'unknown error.'}
          </div>
          <p className="text-xs text-ink-muted mt-3">
            The rest of the sidebar isn't affected by this specific call — Never Again,
            CME Events, Users, System Status etc. fetch their own data independently.
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading || !stats) {
    return (
      <AdminLayout>
        <div>
          <h2 className="text-xl font-bold text-primary mb-6">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="space-y-6 animate-fadeSlideIn">
      <h2 className="text-xl font-bold text-primary">Overview</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatTile
          label="Total Users"
          value={stats.totalUsers}
          sub="Across all roles"
          color="bg-blue-50"
          icon={<Users size={18} className="text-accent" />}
        />
        <StatTile
          label="Published Chapters"
          value={stats.chaptersByStatus?.['approved'] ?? 0}
          sub={`${stats.totalChapters} total chapters`}
          color="bg-green-50"
          icon={<BookOpen size={18} className="text-success" />}
        />
        <StatTile
          label="Pending Review"
          value={stats.pendingReview}
          sub="Awaiting moderation"
          color={stats.pendingReview > 10 ? 'bg-red-50' : 'bg-yellow-50'}
          icon={<Clock size={18} className={stats.pendingReview > 10 ? 'text-danger' : 'text-warning'} />}
          onClick={() => navigate('/academics/admin/content?status=pending')}
          urgent={stats.pendingReview > 0}
        />
        <StatTile
          label="Pending Credentials"
          value={stats.usersByRole?.['pending_credentials'] ?? 0}
          sub="Author verifications"
          color="bg-yellow-50"
          icon={<BadgeCheck size={18} className="text-warning" />}
          onClick={() => navigate('/academics/admin/credentials')}
          urgent={(stats.usersByRole?.['pending_credentials'] ?? 0) > 0}
        />
        <StatTile
          label="Total Views"
          value={stats.totalViews}
          sub={`${stats.totalCMEEvents} CME events`}
          color="bg-blue-50"
          icon={<Eye size={18} className="text-accent" />}
        />
        <StatTile
          label="Avg Review Time"
          value={`${safeFixed(stats.avgModerationHours)}h`}
          sub="Moderation turnaround"
          color="bg-gray-50"
          icon={<Clock size={18} className="text-ink-muted" />}
        />
      </div>

      {/* Signup growth — directly under the tiles, because "how many users"
          is the first question the tiles raise and the only one they cannot
          answer on their own. */}
      <SignupGrowthChart points={stats.signupsByDay} />

      {/* Role + Status breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-card shadow-card p-5">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Users by Role</p>
          <div className="flex flex-wrap gap-2">
            {(['reader', 'author', 'moderator', 'admin'] as const).map((role) => (
              <RoleBadge key={role} role={role} count={stats.usersByRole?.[role] ?? 0} />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-card shadow-card p-5">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Chapters by Status</p>
          <div className="flex flex-wrap gap-2">
            {(['draft', 'pending', 'approved', 'rejected', 'archived'] as const).map((s) => (
              <StatusBadge key={s} status={s} count={stats.chaptersByStatus?.[s] ?? 0} />
            ))}
          </div>
        </div>
      </div>

      {/* Activity + Top chapters */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white rounded-card shadow-card p-5">
          <p className="text-sm font-semibold text-primary mb-4">Recent Activity</p>
          <ActivityFeed items={stats.recentActivity ?? []} />
        </div>

        {/* Top chapters */}
        <div className="lg:col-span-3 bg-white rounded-card shadow-card p-5">
          <p className="text-sm font-semibold text-primary mb-4">Top Chapters by Views</p>
          <TopChaptersTable chapters={(stats.topChapters ?? []).slice(0, 5)} />
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
