// =============================================================================
// moderation/ModerationQueuePage.tsx
// =============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, BookOpen, RefreshCw, BadgeCheck } from 'lucide-react';
import { useModerationQueue, useModerationStats } from './hooks/useModeration';
import { QueueStatsBar } from './components/QueueStatsBar';
import type { QueueItem } from './hooks/useModeration';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function urgencyBorder(hoursInQueue: number): string {
  if (hoursInQueue >= 48) return 'border-l-4 border-l-danger';
  if (hoursInQueue >= 24) return 'border-l-4 border-l-warning';
  return 'border-l-4 border-l-transparent';
}

function hoursLabel(h: number): string {
  if (h < 1) return 'Just submitted';
  if (h < 24) return `${Math.floor(h)}h in queue`;
  return `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h in queue`;
}

function UrgencyBadge({ hours }: { hours: number }) {
  if (hours >= 48) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                       text-xs font-semibold bg-red-100 text-danger">
        <AlertTriangle size={11} /> Overdue
      </span>
    );
  }
  if (hours >= 24) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                       text-xs font-semibold bg-yellow-100 text-warning">
        <Clock size={11} /> Waiting long
      </span>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// QueueCard
// ---------------------------------------------------------------------------

function QueueCard({ item, onReview }: { item: QueueItem; onReview: () => void }) {
  return (
    <div
      className={[
        'bg-white rounded-card shadow-card hover:shadow-card-hover transition-all',
        'cursor-pointer group',
        urgencyBorder(item.hoursInQueue),
      ].join(' ')}
      onClick={onReview}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onReview(); }}
    >
      <div className="px-5 py-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-primary group-hover:text-accent
                         transition-colors line-clamp-2 leading-snug">
              {item.title}
            </p>
            <p className="text-xs text-ink-muted mt-0.5">
              {item.subjectCode} · {item.systemName} · {item.topicName}
            </p>
          </div>
          <UrgencyBadge hours={item.hoursInQueue} />
        </div>

        {/* Author row */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center
                          text-xs font-bold text-primary shrink-0">
            {item.authorFullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-medium text-ink">{item.authorFullName}</span>
              {item.authorCredentialsVerified && (
                <BadgeCheck size={13} className="text-accent shrink-0" aria-label="Credentials verified" />
              )}
              {item.authorQualification && (
                <span className="text-xs text-ink-muted">· {item.authorQualification}</span>
              )}
            </div>
            {item.authorInstitution && (
              <p className="text-xs text-ink-muted truncate">{item.authorInstitution}</p>
            )}
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span className="flex items-center gap-1">
              <Clock size={11} /> {hoursLabel(item.hoursInQueue)}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={11} /> {item.readingTimeMinutes} min read
            </span>
          </div>
          <span className="text-xs font-semibold text-accent opacity-0 group-hover:opacity-100
                          transition-opacity">
            Review →
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModerationQueuePage
// ---------------------------------------------------------------------------

export function ModerationQueuePage() {
  const navigate = useNavigate();
  const { data: queue, isLoading, isFetching, dataUpdatedAt, refetch } = useModerationQueue();
  const { data: stats } = useModerationStats();
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Track how long since last update
  useEffect(() => {
    const interval = setInterval(() => {
      if (dataUpdatedAt) {
        setSecondsAgo(Math.floor((Date.now() - dataUpdatedAt) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  function lastUpdatedLabel() {
    if (secondsAgo < 5) return 'just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    return `${Math.floor(secondsAgo / 60)}m ago`;
  }

  const sortedQueue = queue?.slice().sort((a, b) => b.hoursInQueue - a.hoursInQueue) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Moderation Queue</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Review and approve chapters submitted by authors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">
            Updated {lastUpdatedLabel()}
          </span>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl border border-border text-ink-muted hover:text-ink
                       hover:bg-gray-50 transition-colors disabled:opacity-40"
            title="Refresh queue"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="mb-6">
          <QueueStatsBar
            pending={stats.pending}
            reviewedToday={stats.reviewedToday}
            avgHoursInQueue={stats.avgHoursInQueue}
          />
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-card" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sortedQueue.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <BadgeCheck size={32} className="text-success" />
          </div>
          <h2 className="text-lg font-semibold text-ink mb-1">Queue is clear!</h2>
          <p className="text-sm text-ink-muted max-w-xs">
            No chapters pending review. Check back later or explore the history.
          </p>
          <button
            type="button"
            onClick={() => navigate('/academics/moderator/history')}
            className="mt-5 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-primary
                       hover:bg-primary/90 transition-colors"
          >
            View History
          </button>
        </div>
      )}

      {/* Queue list */}
      {sortedQueue.length > 0 && (
        <>
          <p className="text-xs text-ink-muted mb-3">
            {sortedQueue.length} chapter{sortedQueue.length !== 1 ? 's' : ''} pending · sorted by wait time
          </p>
          <div className="space-y-3">
            {sortedQueue.map((item, index) => (
              <QueueCard
                key={item.id}
                item={item}
                onReview={() => {
                  // Pass next chapter id via state so ReviewPage can navigate forward
                  const nextId = sortedQueue[index + 1]?.id;
                  navigate(`/academics/moderator/review/${item.id}`, {
                    state: { nextChapterId: nextId, queueLength: sortedQueue.length - index - 1 },
                  });
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
