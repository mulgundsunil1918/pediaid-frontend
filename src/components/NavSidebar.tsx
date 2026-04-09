// =============================================================================
// components/NavSidebar.tsx — main navigation sidebar / top bar
// Minimal shell — add it to your existing nav if one exists.
// =============================================================================

import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { useState } from 'react';
import { GlobalSearchBar } from '../academics/search/GlobalSearchBar';
import { useAuthStore } from '../store/authStore';
import { NotificationBell } from './NotificationBell';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** If true, the link is only active on an exact URL match (passed to NavLink's `end`). */
  end?: boolean;
  /** Roles permitted to see this nav entry; omit for public. */
  showWhen?: () => boolean;
}

function useNavItems(): NavItem[] {
  const canAuthor = useAuthStore((s) => s.canAuthor);

  return [
    {
      label: 'Academics',
      href: '/academics',
      icon: <GraduationCap size={18} aria-hidden="true" />,
      // Browse root — must be exact, otherwise it highlights on every /academics/* URL
      end: true,
    },
    {
      label: 'Dashboard',
      href: '/academics/dashboard',
      icon: <LayoutDashboard size={18} aria-hidden="true" />,
      // Hidden from readers and from users whose role request is still
      // pending admin approval — they cannot open the dashboard anyway.
      showWhen: () => canAuthor(),
    },
    // The "About" entry was removed — the detailed About Me lives in the
    // Flutter main app only. The academics surface is content-focused.
  ];
}

function NavItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.href}
      end={item.end}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium',
          'transition-colors duration-150',
          isActive
            ? 'bg-white/15 text-white'
            : 'text-blue-200 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      {item.icon}
      {item.label}
    </NavLink>
  );
}

// ---------------------------------------------------------------------------
// Mobile top bar (hamburger)
// ---------------------------------------------------------------------------

function MobileNav({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const navItems = useNavItems().filter((item) => !item.showWhen || item.showWhen());
  return (
    <>
      {/* Top bar */}
      <header
        className="sm:hidden fixed top-0 left-0 right-0 z-40 h-14 flex
                   items-center justify-between px-4 shadow-md"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-white" aria-hidden="true" />
          <span className="font-bold text-white text-base font-sans">
            PediAid
          </span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell variant="dark" />
          <button
            onClick={onToggle}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="text-white p-1"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Dropdown drawer */}
      {open && (
        <nav
          className="sm:hidden fixed top-14 left-0 right-0 z-30 py-3 px-3 shadow-xl"
          style={{ backgroundColor: '#1e3a5f' }}
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Desktop sidebar
// ---------------------------------------------------------------------------

function DesktopSidebar() {
  const navItems = useNavItems().filter((item) => !item.showWhen || item.showWhen());
  return (
    <aside
      className="hidden sm:flex flex-col w-56 shrink-0 min-h-screen
                 fixed top-0 left-0 z-20"
      style={{ backgroundColor: '#1e3a5f' }}
      aria-label="Main navigation"
    >
      {/* Logo + bell */}
      <div className="flex items-center justify-between gap-2 px-4 py-5 mb-2">
        <div className="flex items-center gap-2.5">
          <BookOpen size={22} className="text-white" aria-hidden="true" />
          <span className="font-bold text-white text-lg font-sans">PediAid</span>
        </div>
        <NotificationBell variant="dark" />
      </div>

      <nav className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Global search trigger */}
      <div className="px-2 pb-2">
        <GlobalSearchBar />
      </div>

      {/* Version footer */}
      <div className="px-4 py-3">
        <p className="text-blue-300/60 text-xs">PediAid Academics v0.1</p>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

// The blue sidebar / mobile top bar was removed per product decision — the
// academics surface is now pure content with no chrome. MobileNav and
// DesktopSidebar are kept in the file as dead code in case we ever want to
// bring them back, but NavSidebar itself renders nothing.
export function NavSidebar() {
  // Keep the state hook + unused references so lint/TS don't complain about
  // orphaned internal components.
  const [mobileOpen, setMobileOpen] = useState(false);
  void mobileOpen;
  void setMobileOpen;
  void MobileNav;
  void DesktopSidebar;
  return null;
}

/** Empty — academics page uses full width now that the sidebar is gone. */
export const SIDEBAR_WIDTH = '';
