// =============================================================================
// academics/admin/pages/AllSubmissionsPage.tsx
// Route: /academics/admin/submissions
//
// Every moderated module in one filterable list, backed by the cross-module
// GET /api/academics/admin/submissions endpoint. The per-module pending
// queues stay where they are — this is the "show me everything, in any
// state" view they don't provide, including already-published and rejected
// items that drop out of those queues entirely.
// =============================================================================

import { useState } from 'react';
import { Inbox, Loader2, Search, ShieldAlert } from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import { useAdminSubmissions, type AdminSubmission } from '../hooks/useAdmin';
import { SubmissionStatusBadge } from '../../submissions/components/SubmissionStatusBadge';
import type { ModerationStatus } from '../../submissions/types';

const MODULE_OPTIONS = [
  { value: '', label: 'All modules' },
  { value: 'never_again', label: 'Never Again' },
  { value: 'conference', label: 'Conferences' },
  { value: 'webinar', label: 'Webinars' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'course', label: 'Courses' },
];

// Only the statuses either module can actually reach today. The shared
// vocabulary is wider (draft / under_review / approved), but nothing
// produces those yet, so offering them would be dead filters.
const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'needs_edit', label: 'Needs Edit' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];

const MODULE_LABELS: Record<AdminSubmission['moduleType'], string> = {
  never_again: 'Never Again',
  conference: 'Conference',
  webinar: 'Webinar',
  workshop: 'Workshop',
  course: 'Course',
};

const selectCls =
  'border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors bg-white';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SubmissionRow({ item }: { item: AdminSubmission }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-gray-50">
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-ink leading-snug">{item.title}</p>
        {item.adminFeedback && (
          <p className="text-xs text-ink-muted italic mt-1 line-clamp-1">
            "{item.adminFeedback}"
          </p>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs text-ink-muted">{MODULE_LABELS[item.moduleType]}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <SubmissionStatusBadge status={item.status as ModerationStatus} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-muted">
        {formatDate(item.createdAt)}
      </td>
    </tr>
  );
}

export function AllSubmissionsPage() {

  const [moduleType, setModuleType] = useState('');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error } = useAdminSubmissions({
    module_type: moduleType || undefined,
    status: status || undefined,
    search: search || undefined,
  });

  // Access is enforced by AdminGuard in AdminLayout, which asks the server
  // (GET /admin/me). The old check here read the role from localStorage —
  // untrustworthy, and it matched 'admin' exactly, so a super_admin was
  // redirected to login, which then bounced back here: an infinite loop
  // that rendered a blank page.

  const submissions = data ?? [];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-primary">All Submissions</h1>
          <p className="text-sm text-ink-muted mt-1">
            Every submission across Never Again and CME, in any state — including
            items that have already left the pending queues.
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <select
            className={selectCls}
            value={moduleType}
            onChange={(e) => setModuleType(e.target.value)}
            aria-label="Filter by module"
          >
            {MODULE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className={selectCls}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <form
            className="flex items-center gap-2 flex-1 min-w-[200px]"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
            }}
          >
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <input
                className={`${selectCls} w-full pl-8`}
                placeholder="Search title…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-ink-muted text-sm">
            <Loader2 size={18} className="animate-spin mr-2" />
            Loading submissions…
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger flex items-start gap-2">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error?.message ?? 'Could not load submissions.'}</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card border border-border flex flex-col items-center justify-center py-16 px-6 text-center">
            <Inbox size={36} className="text-ink-muted mb-3" aria-hidden="true" />
            <p className="text-base font-semibold text-ink mb-1">No submissions match</p>
            <p className="text-sm text-ink-muted">Try widening the filters above.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                      Title
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                      Module
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <SubmissionRow key={s.submissionId} item={s} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-border bg-gray-50">
              <p className="text-xs text-ink-muted">
                {submissions.length} submission{submissions.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
