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

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Academics',
    href: '/academics',
    icon: <GraduationCap size={18} aria-hidden="true" />,
  },
  {
    label: 'Dashboard',
    href: '/academics/dashboard',
    icon: <LayoutDashboard size={18} aria-hidden="true" />,
  },
];

function NavItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.href}
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
        <button
          onClick={onToggle}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="text-white p-1"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Dropdown drawer */}
      {open && (
        <nav
          className="sm:hidden fixed top-14 left-0 right-0 z-30 py-3 px-3 shadow-xl"
          style={{ backgroundColor: '#1e3a5f' }}
          aria-label="Mobile navigation"
        >
          {NAV_ITEMS.map((item) => (
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
  return (
    <aside
      className="hidden sm:flex flex-col w-56 shrink-0 min-h-screen
                 fixed top-0 left-0 z-20"
      style={{ backgroundColor: '#1e3a5f' }}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 mb-2">
        <BookOpen size={22} className="text-white" aria-hidden="true" />
        <span className="font-bold text-white text-lg font-sans">PediAid</span>
      </div>

      <nav className="flex flex-col gap-1 px-2 flex-1">
        {NAV_ITEMS.map((item) => (
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

export function NavSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <MobileNav
        open={mobileOpen}
        onToggle={() => setMobileOpen((v) => !v)}
      />
      <DesktopSidebar />
    </>
  );
}

/** Width of the desktop sidebar — use as left padding on the page wrapper */
export const SIDEBAR_WIDTH = 'sm:pl-56';
