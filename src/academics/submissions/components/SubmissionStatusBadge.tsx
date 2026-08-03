// =============================================================================
// academics/submissions/components/SubmissionStatusBadge.tsx
//
// Same visual pattern as browse/components/StatusBadge.tsx, extended to the
// full 8-value shared moderation vocabulary. Chapters keep using their own
// StatusBadge — this one is for the cross-module submissions surface.
// =============================================================================

import type { ModerationStatus } from '../types';

interface SubmissionStatusBadgeProps {
  status: ModerationStatus;
  className?: string;
}

const CONFIG: Record<ModerationStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-600',
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-yellow-50 text-warning',
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-blue-50 text-blue-700',
  },
  needs_edit: {
    label: 'Needs Edit',
    className: 'bg-orange-50 text-orange-600',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-50 text-success',
  },
  published: {
    label: 'Published',
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

export function SubmissionStatusBadge({ status, className = '' }: SubmissionStatusBadgeProps) {
  const config = CONFIG[status] ?? {
    label: String(status),
    className: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={['acad-badge', config.className, className].join(' ')}>
      {config.label}
    </span>
  );
}
