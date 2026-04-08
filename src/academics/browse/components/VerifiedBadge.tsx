// =============================================================================
// components/VerifiedBadge.tsx
// =============================================================================

import { BadgeCheck } from 'lucide-react';
import { useState } from 'react';

interface VerifiedBadgeProps {
  credentialsVerified: boolean;
  className?: string;
}

/**
 * Renders a small "Verified" badge only when credentialsVerified is true.
 * Shows a tooltip on hover explaining what verified means.
 */
export function VerifiedBadge({
  credentialsVerified,
  className = '',
}: VerifiedBadgeProps) {
  const [showTip, setShowTip] = useState(false);

  if (!credentialsVerified) return null;

  return (
    <span
      className={['relative inline-flex items-center gap-0.5', className].join(' ')}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      onFocus={() => setShowTip(true)}
      onBlur={() => setShowTip(false)}
    >
      <BadgeCheck
        size={14}
        className="text-accent shrink-0"
        aria-hidden="true"
      />
      <span className="text-xs font-medium text-accent">Verified</span>

      {showTip && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                     whitespace-nowrap bg-primary text-white text-xs rounded-md
                     px-2.5 py-1.5 shadow-lg z-10 pointer-events-none"
        >
          Credentials verified by PediAid Academics admin
          {/* Tooltip arrow */}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4
                       border-transparent border-t-primary"
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}
