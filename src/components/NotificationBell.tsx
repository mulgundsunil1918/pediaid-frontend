// =============================================================================
// components/NotificationBell.tsx
//
// Sidebar / top-bar notification bell for authenticated academics users.
// Shows unread count as a red badge, opens a dropdown with the notification
// list on click, supports "Mark all as read", marks a row read on click,
// and navigates to the row's linkPath when set.
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  UserX,
  AlertCircle,
  X as XIcon,
  CheckCheck,
} from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type Notification,
} from '../academics/notifications/hooks/useNotifications';
import { useAuthStore } from '../store/authStore';

// ---------------------------------------------------------------------------
// Per-type icon + accent
// ---------------------------------------------------------------------------

const ICON_CONFIG: Record<
  Notification['type'],
  { Icon: typeof Bell; accent: string; bg: string }
> = {
  chapter_approved: {
    Icon: CheckCircle2,
    accent: 'text-success',
    bg: 'bg-green-50',
  },
  chapter_rejected: {
    Icon: XCircle,
    accent: 'text-danger',
    bg: 'bg-red-50',
  },
  chapter_changes_requested: {
    Icon: RotateCcw,
    accent: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  role_approved: {
    Icon: UserCheck,
    accent: 'text-success',
    bg: 'bg-green-50',
  },
  role_rejected: {
    Icon: UserX,
    accent: 'text-danger',
    bg: 'bg-red-50',
  },
  chapter_submitted_author_ack: {
    Icon: AlertCircle,
    accent: 'text-accent',
    bg: 'bg-blue-50',
  },
  system: {
    Icon: Bell,
    accent: 'text-ink-muted',
    bg: 'bg-gray-50',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

// ---------------------------------------------------------------------------
// Bell
// ---------------------------------------------------------------------------

export function NotificationBell({
  variant = 'dark',
}: {
  /** Colour of the bell icon. 'dark' = navbar on dark background (white icon),
   * 'light' = on a light background (dark icon). */
  variant?: 'dark' | 'light';
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Hide entirely for anonymous visitors
  if (!isAuthenticated()) return null;

  function handleRowClick(n: Notification) {
    if (!n.isRead) {
      markReadMutation.mutate(n.id);
    }
    setOpen(false);
    if (n.linkPath) {
      navigate(n.linkPath);
    }
  }

  function handleMarkAll() {
    if (unreadCount === 0) return;
    markAllMutation.mutate();
  }

  const iconColour =
    variant === 'dark' ? 'text-white' : 'text-ink';

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'relative inline-flex items-center justify-center',
          'w-10 h-10 rounded-xl transition-colors',
          variant === 'dark'
            ? 'hover:bg-white/10'
            : 'hover:bg-gray-100',
        ].join(' ')}
        aria-label={`Notifications${
          unreadCount > 0 ? ` (${unreadCount} unread)` : ''
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={18} className={iconColour} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="
              absolute top-1 right-1
              min-w-[18px] h-[18px] px-1
              rounded-full bg-danger text-white
              text-[10px] font-bold
              flex items-center justify-center
              ring-2 ring-primary
            "
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="
            absolute z-50
            right-0 mt-2
            w-[340px] sm:w-[380px]
            bg-white rounded-2xl shadow-card-hover border border-border
            overflow-hidden
            animate-fadeSlideIn
          "
          style={{ maxHeight: '70vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-gray-50">
            <p className="text-sm font-semibold text-ink">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 text-xs font-medium text-ink-muted">
                  ({unreadCount} unread)
                </span>
              )}
            </p>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={markAllMutation.isPending}
                  className="
                    inline-flex items-center gap-1
                    px-2 py-1 rounded-md
                    text-xs font-medium text-accent
                    hover:bg-blue-50 transition-colors
                    disabled:opacity-50
                  "
                >
                  <CheckCheck size={13} aria-hidden="true" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-gray-100 transition-colors"
                aria-label="Close notifications"
              >
                <XIcon size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 52px)' }}>
            {isLoading && (
              <div className="px-4 py-10 text-center text-sm text-ink-muted">
                Loading…
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Bell
                  size={32}
                  className="mx-auto text-border mb-3"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold text-ink mb-1">
                  You're all caught up
                </p>
                <p className="text-xs text-ink-muted">
                  We'll let you know when something needs your attention.
                </p>
              </div>
            )}

            {!isLoading && notifications.length > 0 && (
              <ul className="list-none p-0 m-0 divide-y divide-border">
                {notifications.map((n) => {
                  const cfg = ICON_CONFIG[n.type] ?? ICON_CONFIG.system;
                  const { Icon } = cfg;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleRowClick(n)}
                        className={[
                          'w-full text-left flex items-start gap-3 px-4 py-3',
                          'hover:bg-gray-50 transition-colors',
                          !n.isRead
                            ? 'bg-blue-50/40 border-l-2 border-accent'
                            : 'border-l-2 border-transparent',
                        ].join(' ')}
                      >
                        <div
                          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${cfg.bg}`}
                          aria-hidden="true"
                        >
                          <Icon size={15} className={cfg.accent} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={[
                              'text-sm leading-snug',
                              n.isRead ? 'font-medium text-ink-muted' : 'font-semibold text-ink',
                            ].join(' ')}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[11px] text-ink-muted/70 mt-1">
                            {relativeTime(n.createdAt)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
