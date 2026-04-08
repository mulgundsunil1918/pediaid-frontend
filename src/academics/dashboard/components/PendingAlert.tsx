// =============================================================================
// academics/dashboard/components/PendingAlert.tsx — Banner for pending chapters
// =============================================================================

import { Clock, ChevronRight } from 'lucide-react';

interface PendingAlertProps {
  pendingCount: number;
  onViewPending: () => void;
}

export function PendingAlert({ pendingCount, onViewPending }: PendingAlertProps) {
  if (pendingCount <= 0) return null;

  return (
    <div
      className="
        flex items-start gap-3
        bg-yellow-50 border border-yellow-200
        rounded-card px-4 py-3
        animate-fadeSlideIn
      "
      role="alert"
    >
      <Clock
        size={18}
        className="text-warning shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-yellow-800">
          {pendingCount === 1
            ? '1 chapter awaiting review'
            : `${pendingCount} chapters awaiting review`}
        </p>
        <p className="text-xs text-yellow-700 mt-0.5">
          Chapters typically take 24–48 hours to review.
        </p>
      </div>
      <button
        onClick={onViewPending}
        className="
          flex items-center gap-1 text-xs font-medium
          text-yellow-800 hover:text-yellow-900
          underline underline-offset-2
          shrink-0 mt-0.5
          transition-colors
        "
        aria-label="View pending chapters"
      >
        View
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
