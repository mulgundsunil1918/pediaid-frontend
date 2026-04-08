// =============================================================================
// components/StatusBadge.tsx
// =============================================================================

import type { ChapterStatus } from '../../types';

interface StatusBadgeProps {
  status: ChapterStatus;
  className?: string;
}

const CONFIG: Record<
  ChapterStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-600',
  },
  pending: {
    label: 'Pending',
    className: 'bg-yellow-50 text-warning',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-50 text-success',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-danger',
  },
  // Distinct from rejected — the moderator has asked for revisions and the
  // author can re-submit after fixing. Amber/orange to sit visually between
  // yellow "pending" and red "rejected".
  changes_requested: {
    label: 'Changes Requested',
    className: 'bg-orange-50 text-orange-600',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-500 italic',
  },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  // Defensive default for any unknown status string that might arrive from
  // an older backend build — render a neutral badge rather than crashing.
  const config = CONFIG[status] ?? {
    label: String(status),
    className: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={[
        'acad-badge',
        config.className,
        className,
      ].join(' ')}
    >
      {config.label}
    </span>
  );
}
