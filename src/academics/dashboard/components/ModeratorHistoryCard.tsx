// =============================================================================
// academics/dashboard/components/ModeratorHistoryCard.tsx
//
// Dashboard card shown only to moderators and admins. Lists the latest
// moderation actions the current user has performed — chapter title, author
// name, action taken, date — with a link to the full moderation history.
// =============================================================================

import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  History,
  ChevronRight,
} from 'lucide-react';
import { useModerationHistory } from '../../moderation/hooks/useModeration';
import type { HistoryItem } from '../../moderation/hooks/useModeration';

// ---------------------------------------------------------------------------
// Per-action theming
// ---------------------------------------------------------------------------

const ACTION_CONFIG: Record<
  HistoryItem['action'],
  { label: string; Icon: typeof CheckCircle2; color: string }
> = {
  approved: {
    label: 'Approved',
    Icon: CheckCircle2,
    color: 'text-success',
  },
  rejected: {
    label: 'Rejected',
    Icon: XCircle,
    color: 'text-danger',
  },
  request_changes: {
    label: 'Changes requested',
    Icon: RotateCcw,
    color: 'text-orange-600',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function ModeratorHistoryCard() {
  const { data, isLoading } = useModerationHistory({ period: 'all', page: 1 });
  const entries = data?.data ?? [];
  const recent = entries.slice(0, 8);

  return (
    <section
      aria-labelledby="moderation-history-heading"
      className="bg-card rounded-card shadow-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          id="moderation-history-heading"
          className="text-base font-semibold text-ink flex items-center gap-2"
        >
          <History size={16} className="text-ink-muted" aria-hidden="true" />
          Moderation History
        </h2>
        <Link
          to="/academics/moderator/history"
          className="text-sm font-medium text-accent hover:underline underline-offset-2"
        >
          View all
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-gray-100 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {!isLoading && recent.length === 0 && (
        <p className="text-sm text-ink-muted py-4 text-center">
          You haven't reviewed any chapters yet. Open the{' '}
          <Link
            to="/academics/moderator/queue"
            className="font-medium text-accent hover:underline"
          >
            moderation queue
          </Link>{' '}
          to get started.
        </p>
      )}

      {!isLoading && recent.length > 0 && (
        <ul className="list-none p-0 m-0 divide-y divide-border">
          {recent.map((entry) => {
            const cfg = ACTION_CONFIG[entry.action];
            const { Icon } = cfg;
            return (
              <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  to={`/academics/moderator/review/${entry.chapterId}`}
                  className="group flex items-center gap-3 hover:bg-gray-50 rounded-lg -mx-2 px-2 py-1 transition-colors"
                >
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 ${cfg.color}`}
                  >
                    <Icon size={14} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {entry.chapterTitle}
                    </p>
                    <p className="text-xs text-ink-muted truncate">
                      <span className={`font-semibold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {' · '}
                      <span>by {entry.authorName}</span>
                      {' · '}
                      <span>{formatDate(entry.performedAt)}</span>
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-ink-muted shrink-0 group-hover:translate-x-0.5 transition-transform"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
