// =============================================================================
// academics/cme/components/RegistrationCard.tsx — sticky registration panel
// =============================================================================

import { useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle,
  ExternalLink,
  Loader2,
  Users,
  XCircle,
} from 'lucide-react';
import type { CMEEvent } from '../hooks/useCME';
import { AddToCalendar } from './AddToCalendar';
import { safeFixed } from '../../../lib/safeNumber';
import { prettyUrl, toExternalUrl } from '../../../lib/externalUrl';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RegistrationCardProps {
  event: CMEEvent;
  onRegister: () => void;
  onCancel: () => void;
  isPending: boolean;
  /**
   * Why the last attempt failed, if it did.
   *
   * The mutation had no error surface at all: a 401 from an expired session
   * or a 409 for an already-registered account resolved into nothing on
   * screen, so pressing Register Now genuinely looked like it did nothing.
   */
  errorMessage?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RegistrationCard({
  event,
  onRegister,
  onCancel,
  isPending,
  errorMessage = null,
}: RegistrationCardProps) {
  const navigate = useNavigate();

  const isCompleted = event.status === 'completed';
  const isCancelled = event.status === 'cancelled';
  const isActiveEvent = !isCompleted && !isCancelled;

  // The organiser's own registration page. Normalised because it is typed by
  // hand into a free-text field — "forms.gle/abc" without a scheme would
  // resolve against the current route and go nowhere.
  const registrationUrl = toExternalUrl(event.registrationUrl);

  const capacity = event.maxAttendees;
  const capacityPercent =
    capacity != null && capacity > 0
      ? Math.min(100, Math.round((event.registeredCount / capacity) * 100))
      : null;

  const capacityBarColor =
    capacityPercent == null
      ? 'bg-accent'
      : capacityPercent >= 90
        ? 'bg-danger'
        : capacityPercent >= 70
          ? 'bg-warning'
          : 'bg-success';

  return (
    <div className="sticky top-6 bg-card border border-border rounded-card shadow-card p-5 flex flex-col gap-4">
      {/* No price display — events do not show pricing here at all. */}

      {/* Credit hours badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium w-fit">
        <Award size={14} />
        {safeFixed(event.creditHours)} {event.creditType} Credits
      </div>

      {/* Registered count */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-ink-muted">
            <Users size={14} />
            {/* ?? 0 — events reached from a saved-items link can arrive
                without a count, and .toLocaleString on undefined took the
                whole detail page down with it. */}
            {(event.registeredCount ?? 0).toLocaleString('en-IN')} registered
          </span>
          {capacity != null && (
            <span className="text-ink-muted">
              of {capacity.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {capacityPercent != null && (
          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${capacityBarColor}`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Registration state */}
      {event.isRegistered ? (
        /* ── Registered state ── */
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-success/10 border border-success/30 rounded-lg">
            <CheckCircle size={16} className="text-success shrink-0" />
            <span className="text-sm font-medium text-success">You're registered!</span>
          </div>

          <AddToCalendar event={event} />

          {isActiveEvent && (
            <button
              onClick={onCancel}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 text-sm text-danger hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              Cancel Registration
            </button>
          )}
        </div>
      ) : isCompleted && event.certificateAvailable ? (
        /* ── Completed + certificate available ── */
        <button
          onClick={() => navigate('/academics/cme/certificates')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-light transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <Award size={16} />
          Download Certificate
        </button>
      ) : isCompleted ? (
        /* ── Completed, no certificate ── */
        <p className="text-sm text-ink-muted text-center">This event has ended.</p>
      ) : isCancelled ? (
        /* ── Cancelled ── */
        <p className="text-sm text-danger text-center font-medium">Event cancelled</p>
      ) : registrationUrl !== null ? (
        /* ── Not registered, and the organiser gave us their own page ──
           A real anchor, not a button with window.open in a callback: popup
           blockers kill a window opened after an await, and an anchor also
           gives middle-click, "open in new tab" and a visible destination on
           hover. The internal registration still fires so the attendee count
           and the certificate flow keep working. */
        <a
          href={registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onRegister}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg font-semibold text-sm hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          Register Now
          <ExternalLink size={15} />
        </a>
      ) : (
        /* ── Not registered, event active, no external page ── */
        <button
          onClick={onRegister}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg font-semibold text-sm hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : null}
          Register Now
        </button>
      )}

      {errorMessage !== null && (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2"
        >
          <XCircle size={13} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </p>
      )}

      {/* The link itself, always visible when there is one — including after
          registering, so it can be reopened. Sunil: "the link should be
          visible to open, like click the link for more details". */}
      {registrationUrl !== null && isActiveEvent && (
        <a
          href={registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-1.5 text-xs text-accent hover:underline break-all"
        >
          <ExternalLink size={13} className="shrink-0 mt-0.5" />
          <span>Registration page — {prettyUrl(registrationUrl)}</span>
        </a>
      )}
    </div>
  );
}
