// =============================================================================
// academics/admin/AdminLayout.tsx — sidebar layout for the Admin Panel
// =============================================================================

import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Settings,
  LayoutDashboard,
  TreePine,
  Users,
  BadgeCheck,
  FileText,
  Award,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePlatformStats } from './hooks/useAdmin';

// ---------------------------------------------------------------------------
// Badge pill
// ---------------------------------------------------------------------------

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const cls =
    count > 10
      ? 'bg-danger text-white'
      : 'bg-warning text-white';
  return (
    <span
      className={`ml-auto min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold
                  flex items-center justify-center ${cls}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Nav item
// ---------------------------------------------------------------------------

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ to, icon, label, badge = 0, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={to === '/academics/admin'}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium',
          'transition-colors duration-150',
          isActive
            ? 'bg-white/20 text-white'
            : 'text-blue-100 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge > 0 && <NavBadge count={badge} />}
    </NavLink>
  );
}

// ---------------------------------------------------------------------------
// Sidebar content
// ---------------------------------------------------------------------------

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { data: stats } = usePlatformStats();

  const pendingCredentials = stats?.usersByRole
    ? (stats.usersByRole['pending_credentials'] ?? 0)
    : 0;
  const pendingChapters = stats?.chaptersByStatus?.['pending'] ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Logo / title */}
      <div className="px-4 py-5 border-b border-white/20">
        <div className="flex items-center gap-2">
          <Settings size={22} className="text-blue-200" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Admin Panel</p>
            <p className="text-blue-300 text-xs">PediAid Academics</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem
          to="/academics/admin"
          icon={<LayoutDashboard size={17} />}
          label="Overview"
          onClick={onNavClick}
        />
        <NavItem
          to="/academics/admin/taxonomy"
          icon={<TreePine size={17} />}
          label="Taxonomy"
          onClick={onNavClick}
        />
        <NavItem
          to="/academics/admin/users"
          icon={<Users size={17} />}
          label="Users"
          onClick={onNavClick}
        />
        <NavItem
          to="/academics/admin/credentials"
          icon={<BadgeCheck size={17} />}
          label="Credentials"
          badge={pendingCredentials}
          onClick={onNavClick}
        />
        <NavItem
          to="/academics/admin/content"
          icon={<FileText size={17} />}
          label="Content"
          badge={pendingChapters}
          onClick={onNavClick}
        />
        <NavItem
          to="/academics/admin/cme"
          icon={<Award size={17} />}
          label="CME Events"
          onClick={onNavClick}
        />
        <NavItem
          to="/academics/admin/role-requests"
          icon={<ShieldCheck size={17} />}
          label="Role Requests"
          badge={stats?.pendingRoleRequests ?? 0}
          onClick={onNavClick}
        />
      </nav>

      {/* Back to Academics */}
      <div className="px-3 py-4 border-t border-white/20">
        <Link
          to="/academics"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm
                     text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
          onClick={onNavClick}
        >
          <ArrowLeft size={17} />
          <span>Back to Academics</span>
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminLayout
// ---------------------------------------------------------------------------

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg flex">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 z-30"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay sidebar ──────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="relative w-64 flex flex-col h-full animate-slideInRight"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-60 min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white border-b border-border shadow-sm px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile only) */}
            <button
              className="md:hidden p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-semibold text-primary hidden sm:block">
              Admin Panel — PediAid Academics
            </h1>
            <h1 className="text-sm font-semibold text-primary sm:hidden">
              Admin Panel
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: '#1e3a5f' }}
              >
                {user.profile?.fullName
                  ? user.profile.fullName.slice(0, 2).toUpperCase()
                  : user.email.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm text-ink font-medium hidden sm:block">
                {user.profile?.fullName ?? user.email}
              </span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
