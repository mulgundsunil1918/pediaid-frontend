// =============================================================================
// reader/components/ChapterMeta.tsx
// =============================================================================

import { Clock, Calendar, GitBranch } from 'lucide-react';
import { StatusBadge } from '../../browse/components/StatusBadge';
import { useAuthStore } from '../../../store/authStore';
import type { ChapterStatus } from '../../types';

interface ChapterMetaProps {
  readingTimeMinutes: number;
  publishedAt: string | null;
  version: number;
  status: ChapterStatus;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ChapterMeta({
  readingTimeMinutes,
  publishedAt,
  version,
  status,
}: ChapterMetaProps) {
  const { hasRole } = useAuthStore();
  const isElevated = hasRole('author', 'moderator', 'admin');

  const items: React.ReactNode[] = [];

  items.push(
    <span key="read" className="inline-flex items-center gap-1">
      <Clock size={13} aria-hidden="true" />
      {readingTimeMinutes} min read
    </span>,
  );

  if (publishedAt) {
    items.push(
      <span key="date" className="inline-flex items-center gap-1">
        <Calendar size={13} aria-hidden="true" />
        Published {formatDate(publishedAt)}
      </span>,
    );
  }

  if (version > 1) {
    items.push(
      <span key="ver" className="inline-flex items-center gap-1">
        <GitBranch size={13} aria-hidden="true" />
        Version {version}
      </span>,
    );
  }

  if (isElevated && status !== 'approved') {
    items.push(<StatusBadge key="status" status={status} />);
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted"
      aria-label="Chapter metadata"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-3">
          {i > 0 && <span aria-hidden="true" className="text-border">·</span>}
          {item}
        </span>
      ))}
    </div>
  );
}
