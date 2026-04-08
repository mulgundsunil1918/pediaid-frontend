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
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-500 italic',
  },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = CONFIG[status];
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
