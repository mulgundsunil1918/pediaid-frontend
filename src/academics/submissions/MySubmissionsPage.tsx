// =============================================================================
// academics/submissions/MySubmissionsPage.tsx — /academics/submissions
//
// Global "everything I submitted" view across Never Again and CME (all 4
// event types), per the hybrid device_id + auth merge in
// GET /api/me/submissions. Reachable from the Profile menu when logged in,
// and directly from the Never Again feed/submit pages for anonymous
// submitters who have no account to log into.
// =============================================================================

import { useMemo, useState } from 'react';
import { Inbox, AlertTriangle } from 'lucide-react';
import { FilterTabs, type FilterTab } from '../../components/FilterTabs';
import { SubmissionStatusBadge } from './components/SubmissionStatusBadge';
import { SubmissionActionsMenu } from './components/SubmissionActionsMenu';
import { useMySubmissions } from './hooks/useMySubmissions';
import type { ModerationStatus, ModuleType, NormalizedSubmission } from './types';

const MODULE_LABELS: Record<ModuleType, string> = {
  never_again: 'Never Again',
  conference: 'Conference',
  webinar: 'Webinar',
  workshop: 'Workshop',
  course: 'Course',
};

type FilterValue = 'all' | ModerationStatus;

const TABS: FilterTab<FilterValue>[] = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'needs_edit', label: 'Needs Edit' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function SubmissionCard({ submission }: { submission: NormalizedSubmission }) {
  return (
    <div className="bg-card rounded-card shadow-card px-4 py-4">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="text-base font-semibold text-ink leading-snug">{submission.title}</p>
        <div className="flex items-center gap-2 shrink-0">
          <SubmissionStatusBadge status={submission.status} />
          <SubmissionActionsMenu submission={submission} />
        </div>
      </div>

      <p className="text-xs text-ink-muted mb-2">
        {MODULE_LABELS[submission.moduleType]} · Submitted {formatDate(submission.createdAt)}
      </p>

      {submission.adminFeedback && (submission.status === 'needs_edit' || submission.status === 'rejected') && (
        <p className="text-xs text-ink-muted italic mt-2 pt-2 border-t border-border line-clamp-2">
          "{submission.adminFeedback}"
        </p>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="bg-card rounded-card shadow-card p-4 animate-pulse space-y-2">
      <div className="flex items-center gap-3">
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-100 rounded-full ml-auto" />
      </div>
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
    </div>
  );
}

export function MySubmissionsPage() {
  const { submissions, isLoading, error } = useMySubmissions();
  const [filter, setFilter] = useState<FilterValue>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? submissions : submissions.filter((s) => s.status === filter)),
    [submissions, filter],
  );

  const counts = useMemo(() => {
    const c: Partial<Record<FilterValue, number>> = { all: submissions.length };
    for (const s of submissions) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  }, [submissions]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-primary">My Submissions</h1>
        <p className="text-sm text-ink-muted mt-1 mb-6">
          Everything you've submitted across Never Again and CME, in one place.
        </p>

        <FilterTabs
          tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))}
          active={filter}
          onChange={setFilter}
          className="mb-6"
        />

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-danger flex items-center gap-2">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-card shadow-card flex flex-col items-center justify-center py-14 px-6 text-center">
            <Inbox size={36} className="text-ink-muted mb-3" aria-hidden="true" />
            <p className="text-base font-semibold text-ink mb-1">
              {submissions.length === 0 ? 'No submissions yet' : 'Nothing in this filter'}
            </p>
            <p className="text-sm text-ink-muted">
              {submissions.length === 0
                ? 'Anything you submit to Never Again or CME will show up here.'
                : 'Try a different filter above.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <SubmissionCard key={s.submissionId} submission={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
