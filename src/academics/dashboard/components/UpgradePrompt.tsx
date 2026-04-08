// =============================================================================
// academics/dashboard/components/UpgradePrompt.tsx
// Shown when the current user's role is 'reader' — invites them to become an author
// =============================================================================

import { GraduationCap, CheckCircle2, Loader2 } from 'lucide-react';
import { useUpgradeToAuthor } from '../hooks/useDashboard';

const BENEFITS = [
  'Write and publish chapters on paediatric & neonatal topics',
  'Receive structured peer-review feedback from moderators',
  'Earn CME/CPD credits for accepted contributions',
  'Be listed as a verified author on PediAid Academics',
  'Track views and reading time for your published work',
];

export function UpgradePrompt() {
  const { mutate, isPending, isSuccess, error } = useUpgradeToAuthor();

  return (
    <div className="bg-card rounded-card shadow-card p-6 max-w-xl mx-auto animate-fadeSlideIn">
      {/* Icon + heading */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <GraduationCap size={24} className="text-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">Become an Author</h2>
          <p className="text-sm text-ink-muted leading-snug">
            Share your expertise with the PediAid community
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-ink-muted mb-4 leading-relaxed">
        Contribute chapters to PediAid Academics and help build the most
        comprehensive paediatric &amp; neonatal clinical reference platform.
      </p>

      {/* Benefits list */}
      <ul className="space-y-2 mb-6">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-sm text-ink">
            <CheckCircle2
              size={16}
              className="text-success shrink-0 mt-0.5"
              aria-hidden="true"
            />
            {benefit}
          </li>
        ))}
      </ul>

      {/* Error message */}
      {error && (
        <p className="text-sm text-danger mb-3" role="alert">
          {error.message}
        </p>
      )}

      {/* Success message */}
      {isSuccess ? (
        <div
          className="
            flex items-center gap-2
            bg-green-50 border border-green-200
            rounded-xl px-4 py-3
            text-sm font-medium text-success
            animate-fadeSlideIn
          "
          role="status"
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          Request submitted! Our team will review your profile shortly.
        </div>
      ) : (
        <button
          onClick={() => mutate()}
          disabled={isPending}
          className="
            flex items-center justify-center gap-2
            w-full px-4 py-2.5
            rounded-xl bg-primary text-white text-sm font-semibold
            hover:bg-primary-light
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            'Request Author Access'
          )}
        </button>
      )}
    </div>
  );
}
