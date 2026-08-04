// =============================================================================
// academics/onboarding/ProfileNudge.tsx
//
// The follow-up for anyone who skipped the details step: a slim banner that
// links back to it, and can be dismissed for good.
//
// Deliberately quiet. It sits above the page rather than over it, has a real
// dismiss button, and never reappears once dismissed — a prompt that cannot
// be turned off stops being a reminder and becomes an irritation, and the
// people who skipped already told us their answer once.
// =============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, UserCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { isNudgeDismissed, dismissNudge } from './onboardingStorage';

export function ProfileNudge() {
  const user = useAuthStore((s) => s.user);
  const [hidden, setHidden] = useState(() => isNudgeDismissed());

  if (hidden || !user) return null;

  // "Incomplete" means the clinical fields, not the name — Google always
  // supplies a name, so keying off it would never show the banner to anyone.
  const p = user.profile;
  const complete = Boolean(p?.qualification?.trim() && p?.specialty?.trim());
  if (complete) return null;

  function handleDismiss() {
    dismissNudge();
    setHidden(true);
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <UserCircle2
          size={16}
          className="text-amber-700 flex-shrink-0"
          aria-hidden="true"
        />
        <p className="text-sm text-amber-900 flex-1 min-w-0">
          Add your qualification and specialty to get guidelines and CME that
          match your practice.{' '}
          <Link
            to="/academics/complete-profile"
            className="font-semibold underline underline-offset-2 hover:no-underline"
          >
            Add details
          </Link>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-amber-700 hover:text-amber-900 flex-shrink-0 p-1 -m-1"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
