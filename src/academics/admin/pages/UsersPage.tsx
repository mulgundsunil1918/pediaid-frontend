// =============================================================================
// academics/admin/pages/UsersPage.tsx — Admin user management
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Users,
  BadgeCheck,
  ChevronDown,
  Check,
  X,
  Search,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { AdminLayout } from '../AdminLayout';
import {
  useAdminUsers,
  useChangeUserRole,
  useDeactivateUser,
  useReactivateUser,
  type AdminUser,
} from '../hooks/useAdmin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RoleFilter = 'all' | 'reader' | 'author' | 'moderator' | 'admin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function roleBadgeClass(role: AdminUser['role']): string {
  switch (role) {
    case 'reader':
      return 'bg-gray-100 text-gray-700';
    case 'author':
      return 'bg-blue-100 text-blue-700';
    case 'moderator':
      return 'bg-yellow-100 text-yellow-700';
    case 'admin':
      return 'bg-red-100 text-red-700';
  }
}

// ---------------------------------------------------------------------------
// Confirmation Modal
// ---------------------------------------------------------------------------

interface ConfirmModalProps {
  message: string;
  confirmLabel: string;
  confirmClassName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  message,
  confirmLabel,
  confirmClassName,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-card shadow-card max-w-sm w-full p-6">
        <p className="text-ink text-sm leading-relaxed mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-border text-ink-muted hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 ${confirmClassName}`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actions Popover
// ---------------------------------------------------------------------------

interface ActionsPopoverProps {
  user: AdminUser;
  onClose: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}

function ActionsPopover({ user, onClose, onDeactivate, onReactivate }: ActionsPopoverProps) {
  const changeRole = useChangeUserRole();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const roles: Array<{ value: AdminUser['role']; label: string }> = [
    { value: 'reader', label: 'Reader' },
    { value: 'author', label: 'Author' },
    { value: 'moderator', label: 'Moderator' },
  ];

  function handleRoleChange(role: AdminUser['role']) {
    changeRole.mutate(
      { id: user.id, role },
      {
        onSuccess: () => onClose(),
        onError: (e) => alert(`Error: ${e.message}`),
      }
    );
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-30 w-52 bg-white rounded-card shadow-card border border-border py-1"
    >
      {/* Change Role */}
      <div className="px-3 py-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">
        Change Role
      </div>
      {roles.map((r) => (
        <button
          key={r.value}
          onClick={() => handleRoleChange(r.value)}
          disabled={user.role === r.value || changeRole.isPending}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {user.role === r.value && <Check size={14} className="text-accent" />}
          {user.role !== r.value && <span className="w-3.5" />}
          {r.label}
        </button>
      ))}
      <div className="px-3 py-2 text-xs text-ink-muted italic border-t border-border mt-1">
        Admin role requires system configuration
      </div>

      {/* Deactivate / Reactivate */}
      <div className="border-t border-border mt-1 pt-1">
        {user.isActive ? (
          <button
            onClick={() => { onDeactivate(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-red-50"
          >
            <X size={14} />
            Deactivate User
          </button>
        ) : (
          <button
            onClick={() => { onReactivate(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-success hover:bg-green-50"
          >
            <Check size={14} />
            Reactivate User
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200" />
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-28" />
            <div className="h-3 bg-gray-200 rounded w-36" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-32" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-8 bg-gray-200 rounded w-20" /></td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// User Row
// ---------------------------------------------------------------------------

interface UserRowProps {
  user: AdminUser;
  activeActionsId: string | null;
  setActiveActionsId: (id: string | null) => void;
  onConfirmDeactivate: (user: AdminUser) => void;
  onConfirmReactivate: (user: AdminUser) => void;
}

function UserRow({
  user,
  activeActionsId,
  setActiveActionsId,
  onConfirmDeactivate,
  onConfirmReactivate,
}: UserRowProps) {
  const isOpen = activeActionsId === user.id;

  return (
    <tr className={`border-b border-border hover:bg-gray-50 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
      {/* Avatar + Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {getInitials(user.fullName || user.email)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-ink text-sm truncate">{user.fullName || '—'}</span>
              {!user.isActive && (
                <span className="text-xs font-bold text-danger bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                  INACTIVE
                </span>
              )}
            </div>
            <div className="text-xs text-ink-muted truncate">{user.email}</div>
          </div>
        </div>
      </td>

      {/* Role badge */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeClass(user.role)}`}
          >
            {user.role}
          </span>
          {user.credentialsVerified && (
            <BadgeCheck size={15} className="text-accent flex-shrink-0" aria-label="Credentials verified" />
          )}
        </div>
      </td>

      {/* Institution */}
      <td className="px-4 py-3 text-sm text-ink-muted max-w-[160px] truncate">
        {user.institution || '—'}
      </td>

      {/* Chapter stats */}
      <td className="px-4 py-3 text-sm text-ink-muted whitespace-nowrap">
        <span className="text-success font-medium">{user.chaptersPublished}</span>
        <span className="text-ink-muted"> pub · </span>
        <span className="text-warning font-medium">{user.chaptersPending}</span>
        <span className="text-ink-muted"> pend</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="relative inline-block">
          <button
            onClick={() => setActiveActionsId(isOpen ? null : user.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-gray-100 text-ink"
          >
            Actions
            <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && (
            <ActionsPopover
              user={user}
              onClose={() => setActiveActionsId(null)}
              onDeactivate={() => onConfirmDeactivate(user)}
              onReactivate={() => onConfirmReactivate(user)}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Mobile User Card
// ---------------------------------------------------------------------------

interface UserCardProps {
  user: AdminUser;
  onConfirmDeactivate: (user: AdminUser) => void;
  onConfirmReactivate: (user: AdminUser) => void;
}

function UserCard({ user, onConfirmDeactivate, onConfirmReactivate }: UserCardProps) {
  const changeRole = useChangeUserRole();
  const [showRoles, setShowRoles] = useState(false);

  return (
    <div
      className={`bg-white rounded-card shadow-card border border-border p-4 space-y-3 ${
        !user.isActive ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {getInitials(user.fullName || user.email)}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-ink text-sm">{user.fullName || '—'}</div>
            <div className="text-xs text-ink-muted truncate">{user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeClass(user.role)}`}
          >
            {user.role}
          </span>
          {user.credentialsVerified && <BadgeCheck size={14} className="text-accent" />}
          {!user.isActive && (
            <span className="text-xs font-bold text-danger">INACTIVE</span>
          )}
        </div>
      </div>

      {user.institution && (
        <p className="text-xs text-ink-muted">{user.institution}</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => setShowRoles(!showRoles)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-gray-50"
        >
          <Shield size={12} /> Change Role <ChevronDown size={12} />
        </button>
        {user.isActive ? (
          <button
            onClick={() => onConfirmDeactivate(user)}
            className="px-3 py-1.5 text-xs border border-red-200 text-danger rounded-lg hover:bg-red-50"
          >
            Deactivate
          </button>
        ) : (
          <button
            onClick={() => onConfirmReactivate(user)}
            className="px-3 py-1.5 text-xs border border-green-200 text-success rounded-lg hover:bg-green-50"
          >
            Reactivate
          </button>
        )}
      </div>

      {showRoles && (
        <div className="flex gap-2 flex-wrap pt-1">
          {(['reader', 'author', 'moderator'] as const).map((r) => (
            <button
              key={r}
              onClick={() =>
                changeRole.mutate(
                  { id: user.id, role: r },
                  {
                    onSuccess: () => setShowRoles(false),
                    onError: (e) => alert(`Error: ${e.message}`),
                  }
                )
              }
              disabled={user.role === r || changeRole.isPending}
              className={`px-3 py-1 text-xs rounded-full capitalize font-medium disabled:opacity-40 ${roleBadgeClass(r)}`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UsersPage
// ---------------------------------------------------------------------------

export function UsersPage() {
  // Auth guard
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('admin')) return <Navigate to="/academics" replace />;

  const [activeTab, setActiveTab] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState<AdminUser | null>(null);
  const [confirmingReactivate, setConfirmingReactivate] = useState<AdminUser | null>(null);

  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const filters = {
    role: activeTab === 'all' ? undefined : activeTab,
    search: debouncedSearch || undefined,
    page,
  };

  const { data, isLoading } = useAdminUsers(filters);
  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const tabs: Array<{ value: RoleFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'reader', label: 'Readers' },
    { value: 'author', label: 'Authors' },
    { value: 'moderator', label: 'Moderators' },
    { value: 'admin', label: 'Admins' },
  ];

  function handleTabChange(tab: RoleFilter) {
    setActiveTab(tab);
    setPage(1);
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-primary" />
          <div>
            <h2 className="text-lg font-bold text-primary">User Management</h2>
            <p className="text-xs text-ink-muted">{total} total users</p>
          </div>
        </div>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-primary shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-card shadow-card border border-border overflow-hidden mb-4">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Institution
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Chapters
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ink-muted text-sm">
                  No users found.
                </td>
              </tr>
            )}
            {!isLoading &&
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  activeActionsId={activeActionsId}
                  setActiveActionsId={setActiveActionsId}
                  onConfirmDeactivate={setConfirmingDeactivate}
                  onConfirmReactivate={setConfirmingReactivate}
                />
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3 mb-4">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-card border border-border p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-44" />
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-full" />
            </div>
          ))}
        {!isLoading && users.length === 0 && (
          <p className="text-center text-ink-muted text-sm py-12">No users found.</p>
        )}
        {!isLoading &&
          users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onConfirmDeactivate={setConfirmingDeactivate}
              onConfirmReactivate={setConfirmingReactivate}
            />
          ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>
          Page {page} of {totalPages} · {total} users
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border border-border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Deactivate confirmation */}
      {confirmingDeactivate && (
        <ConfirmModal
          message={`Deactivate ${confirmingDeactivate.fullName || confirmingDeactivate.email}? They will no longer be able to log in.`}
          confirmLabel="Deactivate"
          confirmClassName="bg-danger hover:bg-red-700"
          loading={deactivate.isPending}
          onConfirm={() =>
            deactivate.mutate(confirmingDeactivate.id, {
              onSuccess: () => setConfirmingDeactivate(null),
              onError: (e) => alert(`Error: ${e.message}`),
            })
          }
          onCancel={() => setConfirmingDeactivate(null)}
        />
      )}

      {/* Reactivate confirmation */}
      {confirmingReactivate && (
        <ConfirmModal
          message={`Reactivate ${confirmingReactivate.fullName || confirmingReactivate.email}? They will regain access to the platform.`}
          confirmLabel="Reactivate"
          confirmClassName="bg-success hover:bg-green-700"
          loading={reactivate.isPending}
          onConfirm={() =>
            reactivate.mutate(confirmingReactivate.id, {
              onSuccess: () => setConfirmingReactivate(null),
              onError: (e) => alert(`Error: ${e.message}`),
            })
          }
          onCancel={() => setConfirmingReactivate(null)}
        />
      )}
    </AdminLayout>
  );
}
