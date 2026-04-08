// =============================================================================
// moderation/components/ModerationHistory.tsx
// =============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, RotateCcw, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useModerationHistory, type HistoryFilters, type HistoryItem } from '../hooks/useModeration';

const ACTION_CONFIG = {
  approved: { label: 'Approved', icon: <CheckCircle2 size={16} />, color: 'text-success' },
  rejected: { label: 'Rejected', icon: <XCircle size={16} />, color: 'text-danger' },
  request_changes: { label: 'Changes Requested', icon: <RotateCcw size={16} />, color: 'text-warning' },
};

const PERIOD_OPTIONS: { value: HistoryFilters['period']; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];

function HistoryCard({ item }: { item: HistoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ACTION_CONFIG[item.action];

  return (
    <div className="border border-border rounded-card bg-white px-5 py-4">
      <div className="flex items-start gap-3">
        <span className={`shrink-0 mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <Link
              to={
                item.action === 'approved'
                  ? `/academics/c/${item.chapterSlug}`
                  : `/academics/moderator/review/${item.chapterId}`
              }
              className="font-semibold text-sm text-primary hover:underline"
            >
              {item.chapterTitle}
            </Link>
            <time className="text-xs text-ink-muted shrink-0">
              {new Date(item.performedAt).toLocaleString('en-IN', {
                dateStyle: 'medium', timeStyle: 'short',
              })}
            </time>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">by {item.authorName}</p>
          {item.notes && (
            <div className="mt-2">
              <p className={`text-xs text-ink-muted ${!expanded ? 'line-clamp-2' : ''}`}>
                {item.notes}
              </p>
              {item.notes.length > 100 && (
                <button type="button" onClick={() => setExpanded((v) => !v)}
                  className="text-xs text-accent hover:underline mt-0.5 flex items-center gap-0.5">
                  {expanded ? <><ChevronUp size={11} />Less</> : <><ChevronDown size={11} />More</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModerationHistory() {
  const [filters, setFilters] = useState<HistoryFilters>({ period: 'all', page: 1 });
  const { data, isLoading } = useModerationHistory(filters);

  const TAB_ACTIONS: { value: HistoryFilters['action'] | undefined; label: string }[] = [
    { value: undefined, label: 'All' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'request_changes', label: 'Changes' },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TAB_ACTIONS.map((tab) => (
            <button key={String(tab.value)} type="button"
              onClick={() => setFilters((f) => ({ ...f, action: tab.value, page: 1 }))}
              className={[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                filters.action === tab.value
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink',
              ].join(' ')}>
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={filters.period ?? 'all'}
          onChange={(e) => setFilters((f) => ({ ...f, period: e.target.value as HistoryFilters['period'], page: 1 }))}
          className="text-sm border border-border rounded-xl px-3 py-2 outline-none
                     focus:border-accent transition-colors bg-white text-ink"
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {isLoading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-card" />
          ))}
        </div>
      )}

      {!isLoading && data?.data.length === 0 && (
        <p className="text-sm text-ink-muted py-8 text-center">No moderation history yet.</p>
      )}

      <div className="space-y-3">
        {data?.data.map((item) => <HistoryCard key={item.id} item={item} />)}
      </div>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button type="button" onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            disabled={(filters.page ?? 1) <= 1}
            className="px-4 py-2 text-sm border border-border rounded-xl disabled:opacity-40">
            ← Prev
          </button>
          <button type="button" onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            disabled={(filters.page ?? 1) * 20 >= data.total}
            className="px-4 py-2 text-sm border border-border rounded-xl disabled:opacity-40">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
