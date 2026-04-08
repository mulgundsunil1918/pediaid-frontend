// =============================================================================
// academics/cme/components/RegistrationCard.tsx — sticky registration panel
// =============================================================================

import { useNavigate } from 'react-router-dom';
import { Award, CheckCircle, Loader2, Users, XCircle } from 'lucide-react';
import type { CMEEvent } from '../hooks/useCME';
import { AddToCalendar } from './AddToCalendar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RegistrationCardProps {
  event: CMEEvent;
  onRegister: () => void;
  onCancel: () => void;
  isPending: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Free';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RegistrationCard({
  event,
  onRegister,
  onCancel,
  isPending,
}: RegistrationCardProps) {
  const navigate = useNavigate();

  const priceLabel = formatPrice(event.price, event.currency);
  const isCompleted = event.status === 'completed';
  const isCancelled = event.status === 'cancelled';
  const isActiveEvent = !isCompleted && !isCancelled;

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
      {/* Price */}
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-ink">
          {priceLabel}
        </span>
        {event.price > 0 && (
          <span className="text-xs text-ink-muted">{event.currency}</span>
        )}
      </div>

      {/* Credit hours badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium w-fit">
        <Award size={14} />
        {event.creditHours.toFixed(1)} {event.creditType} Credits
      </div>

      {/* Registered count */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-ink-muted">
            <Users size={14} />
            {event.registeredCount.toLocaleString('en-IN')} registered
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
      ) : (
        /* ── Not registered, event active ── */
        <button
          onClick={onRegister}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg font-semibold text-sm hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : null}
          {event.price === 0
            ? 'Register Now'
            : `Register — ${priceLabel}`}
        </button>
      )}
    </div>
  );
}
