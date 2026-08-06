// =============================================================================
// components/nav/ProfileMenu.tsx — account dropdown, shown when signed in
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Bookmark, ClipboardList, LogOut, ChevronDown, PlayCircle } from 'lucide-react';
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

  const label = user.profile?.fullName || user.email;
  const initial = label[0]?.toUpperCase() ?? '?';

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
        {/* The name, not just an initial. A lone "S" does not tell anyone
            which account they are on — and when the app and this site could be
            signed in as different people, that ambiguity is the whole problem.
            Hidden on the narrowest screens where there is no room; the
            dropdown still carries the full name and email. */}
        <span className="hidden sm:block max-w-[140px] truncate text-sm font-medium text-white">
          {label}
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
            to="/academics/saved"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink hover:bg-gray-50"
          >
            <Bookmark size={15} aria-hidden="true" />
            Saved
          </Link>

          <Link
            to="/academics/submissions"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink hover:bg-gray-50"
          >
            <ClipboardList size={15} aria-hidden="true" />
            My Submissions
          </Link>

          <Link
            to="/academics/welcome?replay=1"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink hover:bg-gray-50"
          >
            <PlayCircle size={15} aria-hidden="true" />
            Show tutorial again
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
