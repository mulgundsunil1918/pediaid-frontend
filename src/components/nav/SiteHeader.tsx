// =============================================================================
// components/nav/SiteHeader.tsx — persistent top navigation
//
// Replaces the dead NavSidebar (which rendered null). A real header this
// time, not a sidebar — brand, primary links, search, notifications, and
// either a ProfileMenu (signed in) or a Sign in link (signed out).
// =============================================================================

import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Library, CalendarDays, AlertTriangle, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { GlobalSearchBar } from '../../academics/search/GlobalSearchBar';
import { NotificationBell } from '../NotificationBell';
import { ProfileMenu } from './ProfileMenu';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  end?: boolean;
  showWhen?: () => boolean;
}

function useNavItems(): NavItem[] {
  const canAuthor = useAuthStore((s) => s.canAuthor);

  return [
    {
      label: 'Academics',
      href: '/academics',
      icon: <GraduationCap size={16} aria-hidden="true" />,
      end: true,
    },
    {
      label: 'Guidelines',
      href: '/academics/guidelines',
      icon: <Library size={16} aria-hidden="true" />,
    },
    {
      label: 'CME',
      href: '/academics/cme',
      icon: <CalendarDays size={16} aria-hidden="true" />,
    },
    {
      label: 'Never Again',
      href: '/academics/never-again',
      icon: <AlertTriangle size={16} aria-hidden="true" />,
    },
    {
      label: 'Dashboard',
      href: '/academics/dashboard',
      icon: <BookOpen size={16} aria-hidden="true" />,
      showWhen: () => canAuthor(),
    },
  ];
}

function NavLinkItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.href}
      end={item.end}
      className={({ isActive }) =>
        [
          'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
          'transition-colors duration-150',
          isActive ? 'bg-white/15 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      {item.icon}
      {item.label}
    </NavLink>
  );
}

export function SiteHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = useNavItems().filter((item) => !item.showWhen || item.showWhen());

  return (
    <header style={{ backgroundColor: '#1e3a5f' }} className="sticky top-0 z-30 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link to="/academics" className="flex items-center gap-2 shrink-0">
          <BookOpen size={20} className="text-white" aria-hidden="true" />
          <span className="font-bold text-white text-base font-sans">PediAid</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0">
          {navItems.map((item) => (
            <NavLinkItem key={item.href} item={item} />
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <GlobalSearchBar />
          <NotificationBell variant="dark" />
          {isAuthenticated ? (
            <ProfileMenu />
          ) : (
            <Link
              to="/academics/login"
              className="ml-1 px-3.5 py-1.5 rounded-xl text-sm font-semibold text-white border border-white/25 hover:bg-white/10 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-1">
          <NotificationBell variant="dark" />
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="text-white p-1.5"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav
          className="md:hidden px-3 pb-3 pt-1 space-y-1 shadow-xl"
          style={{ backgroundColor: '#1e3a5f' }}
          aria-label="Mobile navigation"
          onClick={() => setMobileOpen(false)}
        >
          {navItems.map((item) => (
            <NavLinkItem key={item.href} item={item} />
          ))}
          <div className="px-1 pt-2">
            <GlobalSearchBar />
          </div>
          <div className="px-1 pt-2 border-t border-white/10 mt-2">
            {isAuthenticated ? (
              <Link
                to="/academics/submissions"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white"
              >
                My Submissions
              </Link>
            ) : (
              <Link
                to="/academics/login"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
