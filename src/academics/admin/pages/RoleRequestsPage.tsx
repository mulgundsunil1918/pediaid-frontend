// =============================================================================
// academics/admin/pages/RoleRequestsPage.tsx — Admin role-request management
// =============================================================================

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, Inbox, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { AdminLayout } from '../AdminLayout';
import {
  useRoleRequests,
  useApproveRoleRequest,
  useRejectRoleRequest,
  type RoleRequest,
  type RoleRequestStatus,
} from '../hooks/useAdmin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TabKey = RoleRequestStatus | 'all';

const TABS: { key: TabKey; label: string; statusParam: string }[] = [
  { key: 'pending',  label: 'Pending',  statusParam: 'pending'  },
  { key: 'approved', label: 'Approved', statusParam: 'approved' },
  { key: 'rejected', label: 'Rejected', statusParam: 'rejected' },
  { key: 'all',      label: 'All',      statusParam: 'all'      },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

const ROLE_COLOURS: Record<string, string> = {
  author:    'bg-blue-100 text-blue-700',
  moderator: 'bg-purple-100 text-purple-700',
  admin:     'bg-red-100 text-red-700',
};

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'xs';
}

function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const colour = ROLE_COLOURS[role] ?? 'bg-gray-100 text-gray-600';
  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full font-medium capitalize ${colour} ${padding}`}>
      {role}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_COLOURS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: string }) {
  const colour = STATUS_COLOURS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colour}`}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Inline action panel (approve / reject)
// ---------------------------------------------------------------------------

interface ActionPanelProps {
  request: RoleRequest;
  action: 'approve' | 'reject';
  onCancel: () => void;
}

function ActionPanel({ request, action, onCancel }: ActionPanelProps) {
  const [note, setNote] = useState('');
  const approveMutation = useApproveRoleRequest();
  const rejectMutation  = useRejectRoleRequest();
  const mutation = action === 'approve' ? approveMutation : rejectMutation;

  function handleConfirm() {
    mutation.mutate(
      { id: request.id, note: note.trim() || undefined },
      { onSuccess: () => onCancel(), onError: (e) => alert(`Error: ${e.message}`) }
    );
  }

  const isApprove = action === 'approve';
  const confirmClass = isApprove
    ? 'bg-green-600 hover:bg-green-700 text-white'
    : 'bg-red-600 hover:bg-red-700 text-white';
  const confirmLabel = isApprove ? 'Approve' : 'Reject';

  return (
    <div className={`mt-3 rounded-lg border p-3 ${isApprove ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <p className="text-xs font-semibold text-ink mb-2">
        {isApprove ? 'Approve' : 'Reject'} role request — add an optional note:
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Optional note to the user…"
        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none bg-white"
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          disabled={mutation.isPending}
          className="px-3 py-1.5 text-xs border border-border rounded-lg text-ink-muted hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={mutation.isPending}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium disabled:opacity-50 flex items-center gap-1.5 ${confirmClass}`}
        >
          {mutation.isPending && (
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          Confirm {confirmLabel}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Request card
// ---------------------------------------------------------------------------

interface RequestCardProps {
  request: RoleRequest;
  showActions: boolean;
}

function RequestCard({ request, showActions }: RequestCardProps) {
  const [reasonExpanded, setReasonExpanded] = useState(false);
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | null>(null);

  const isLongReason = request.reason.length > 160;

  function handleActionClick(action: 'approve' | 'reject') {
    setActiveAction((prev) => (prev === action ? null : action));
  }

  return (
    <div className="bg-white rounded-card shadow-card border border-border p-5 space-y-3">
      {/* Header row */}
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          {getInitials(request.user_name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink text-sm">{request.user_name}</span>
            {request.status !== 'pending' && <StatusBadge status={request.status} />}
          </div>
          <p className="text-xs text-ink-muted">{request.user_email}</p>
          {(request.qualification || request.institution) && (
            <p className="text-xs text-ink-muted mt-0.5">
              {[request.qualification, request.institution].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 text-xs text-ink-muted text-right">
          {formatDate(request.created_at)}
        </div>
      </div>

      {/* Role row */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <span>Current:</span>
        <RoleBadge role={request.current_role} size="xs" />
        <span className="mx-1">→</span>
        <span>Requested:</span>
        <RoleBadge role={request.requested_role} />
      </div>

      {/* Reason */}
      <div>
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Reason</p>
        <p className={`text-sm text-ink leading-relaxed ${!reasonExpanded && isLongReason ? 'line-clamp-2' : ''}`}>
          {request.reason}
        </p>
        {isLongReason && (
          <button
            onClick={() => setReasonExpanded(!reasonExpanded)}
            className="text-xs text-accent hover:underline mt-1 flex items-center gap-0.5"
          >
            {reasonExpanded ? (
              <><ChevronUp size={12} /> Show less</>
            ) : (
              <><ChevronDown size={12} /> Show more</>
            )}
          </button>
        )}
      </div>

      {/* Review note (for decided requests) */}
      {request.review_note && (
        <div className="rounded-lg bg-gray-50 border border-border px-3 py-2">
          <p className="text-xs font-semibold text-ink-muted mb-0.5">Review note</p>
          <p className="text-sm text-ink">{request.review_note}</p>
          {request.reviewer_email && (
            <p className="text-xs text-ink-muted mt-1">by {request.reviewer_email}</p>
          )}
        </div>
      )}

      {/* Actions (pending only) */}
      {showActions && (
        <div className="pt-1">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleActionClick('approve')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeAction === 'approve'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              }`}
            >
              <Check size={14} />
              Approve
            </button>
            <button
              onClick={() => handleActionClick('reject')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeAction === 'reject'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              <X size={14} />
              Reject
            </button>
          </div>

          {activeAction !== null && (
            <ActionPanel
              request={request}
              action={activeAction}
              onCancel={() => setActiveAction(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function RequestsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-card border border-border p-5 animate-pulse space-y-3"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-36" />
              <div className="h-3 bg-gray-200 rounded w-52" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-48" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab panel — fetches its own status
// ---------------------------------------------------------------------------

interface TabPanelProps {
  statusParam: string;
}

function TabPanel({ statusParam }: TabPanelProps) {
  const { data = [], isLoading, error } = useRoleRequests(statusParam);
  const showActions = statusParam === 'pending';

  if (isLoading) return <RequestsSkeleton />;

  if (error) {
    return (
      <div className="py-16 text-center text-danger text-sm">
        Failed to load requests: {error.message}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Inbox size={40} className="text-ink-muted mb-3 opacity-40" />
        <p className="text-ink-muted font-medium">No requests</p>
        <p className="text-xs text-ink-muted mt-1 opacity-70">
          {statusParam === 'pending'
            ? 'No pending role requests at the moment.'
            : `No ${statusParam} requests found.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((req) => (
        <RequestCard key={req.id} request={req} showActions={showActions} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RoleRequestsPage
// ---------------------------------------------------------------------------

export function RoleRequestsPage() {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('admin')) return <Navigate to="/academics" replace />;

  const [activeTab, setActiveTab] = useState<TabKey>('pending');

  const currentTab = TABS.find((t) => t.key === activeTab) ?? TABS[0];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck size={22} className="text-primary" />
        <div>
          <h2 className="text-lg font-bold text-primary">Role Requests</h2>
          <p className="text-xs text-ink-muted">Review and action user role elevation requests</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-primary shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel — key forces remount on tab switch so queries re-fire correctly */}
      <TabPanel key={currentTab!.statusParam} statusParam={currentTab!.statusParam} />
    </AdminLayout>
  );
}
