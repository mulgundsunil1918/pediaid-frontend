// =============================================================================
// components/nav/ProfileMenu.tsx — account dropdown, shown when signed in
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ClipboardList, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { signOutFirebase } from '../../lib/firebaseAuth';

export function ProfileMenu() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!user) return null;

  async function handleSignOut() {
    setOpen(false);
    try {
      await signOutFirebase();
    } catch {
      // Firebase sign-out failing shouldn't block ending the local session.
    }
    clearAuth();
    navigate('/academics/login', { replace: true });
  }

  const initial = (user.profile?.fullName || user.email)[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          {initial}
        </span>
        <ChevronDown size={14} className="text-blue-200" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-card-hover py-1.5 z-30">
          <div className="px-3.5 py-2 border-b border-border mb-1">
            <p className="text-sm font-semibold text-ink truncate">
              {user.profile?.fullName || user.email}
            </p>
            <p className="text-xs text-ink-muted truncate">{user.email}</p>
          </div>

          <Link
            to="/academics/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink hover:bg-gray-50"
          >
            <User size={15} aria-hidden="true" />
            Account
          </Link>
          <Link
            to="/academics/submissions"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink hover:bg-gray-50"
          >
            <ClipboardList size={15} aria-hidden="true" />
            My Submissions
          </Link>

          <div className="border-t border-border mt-1 pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-danger hover:bg-red-50 text-left"
            >
              <LogOut size={15} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
