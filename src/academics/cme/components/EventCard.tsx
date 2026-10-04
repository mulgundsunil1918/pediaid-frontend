// =============================================================================
// academics/cme/components/EventCard.tsx — card for the CME event list view
// =============================================================================

import { Link } from 'react-router-dom';
import { SaveButton } from '../../bookmarks/SaveButton';
import { Award, Calendar, CheckCircle, MapPin, Users, X } from 'lucide-react';
import type { CMEEvent } from '../hooks/useCME';
import { safeFixed } from '../../../lib/safeNumber';
import { endedLabel, eventPhase, type EventPhase } from '../lib/phase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventCardProps {
  event: CMEEvent;
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

const EVENT_TYPE_STYLES: Record<CMEEvent['eventType'], string> = {
  webinar: 'bg-blue-100 text-blue-700',
  workshop: 'bg-purple-100 text-purple-700',
  conference: 'bg-amber-100 text-amber-700',
  course: 'bg-teal-100 text-teal-700',
};

const EVENT_TYPE_LABELS: Record<CMEEvent['eventType'], string> = {
  webinar: 'Webinar',
  workshop: 'Workshop',
  conference: 'Conference',
  course: 'Course',
};

// Gradient fallbacks by event type (when no cover image)
const FALLBACK_GRADIENTS: Record<CMEEvent['eventType'], string> = {
  webinar: 'from-blue-600 to-blue-400',
  workshop: 'from-purple-600 to-purple-400',
  conference: 'from-amber-600 to-amber-400',
  course: 'from-teal-600 to-teal-400',
};

function StatusBadge({ phase }: { phase: EventPhase }) {
  switch (phase) {
    case 'upcoming':
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/90 text-accent">
          Upcoming
        </span>
      );
    case 'ongoing':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/90 text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live now
        </span>
      );
    case 'finished':
      // The cross itself is the stamp over the cover; no second badge needed.
      return null;
  }
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

function formatEventDate(iso: string, timezone: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventCard({ event }: EventCardProps) {
  const phase = eventPhase(event);
  const finished = phase === 'finished';
  const typeBadgeClass = EVENT_TYPE_STYLES[event.eventType];
  const typeLabel = EVENT_TYPE_LABELS[event.eventType];
  const fallbackGradient = FALLBACK_GRADIENTS[event.eventType];

  const firstSpeaker = event.speakers?.[0];
  const speakerLabel =
    // Optional-chained: the API sends no `speakers` array, so an unguarded
    // read here crashed the list the same way it crashed the detail page.
    (event.speakers?.length ?? 0) === 0
      ? null
      : event.speakers!.length === 1 && firstSpeaker
        ? firstSpeaker.name
        : `${event.speakers!.length} speakers`;

  return (
    <Link
      to={`/academics/cme/${event.slug}`}
      className="group flex flex-col bg-card border border-border rounded-card shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      aria-label={finished ? `${event.title} - event finished` : undefined}
    >
      {/* Cover image / gradient banner */}
      <div className="relative h-40 overflow-hidden">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${finished ? 'grayscale opacity-70' : ''}`}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${
              finished ? 'from-slate-600 to-slate-400' : fallbackGradient
            } opacity-90`}
          />
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeBadgeClass}`}>
            {typeLabel}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <StatusBadge phase={phase} />
        </div>

        {/* The cross: a finished event cannot be mistaken for one you can still
            go to. A strip across the foot of the cover, not a colour tweak. */}
        {finished && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-white/95 border-t-2 border-danger px-3 py-2">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger text-white"
              aria-hidden="true"
            >
              <X size={13} strokeWidth={3} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-extrabold tracking-wide text-danger">
                EVENT FINISHED
              </span>
              <span className="block text-[11px] font-medium text-slate-600 truncate">
                {endedLabel(event)} · no longer active
              </span>
            </span>
          </div>
        )}

        {/* Registered badge */}
        {event.isRegistered && !finished && (
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success text-white shadow">
              <CheckCircle size={11} />
              Registered
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        {/* Title */}
        <h3 className="font-semibold text-ink leading-snug line-clamp-2 group-hover:text-accent transition-colors">
          {event.title}
        </h3>

        {/* Date */}
        <div className="flex items-start gap-1.5 text-xs text-ink-muted">
          <Calendar size={13} className="mt-0.5 shrink-0" />
          <span>{formatEventDate(event.startsAt, event.timezone)}</span>
        </div>

        {/* Location */}
        {(event.venue || event.onlineUrl) && (
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{event.venue ?? 'Online'}</span>
          </div>
        )}

        {/* Speakers */}
        {speakerLabel && (
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Users size={13} className="shrink-0" />
            <span className="truncate">{speakerLabel}</span>
          </div>
        )}

        {/* Footer row */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          {/* Credit hours pill */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
            <Award size={11} />
            {safeFixed(event.creditHours)} {event.creditType}
          </span>

          {/* Save only — no price label. Sunil's call: events do not show
              pricing anywhere, paid or free. The whole card is a Link, so
              SaveButton stops the click from propagating. */}
          <div className="flex items-center gap-1">
            <SaveButton itemType="cme" itemId={event.id} />
          </div>
        </div>
      </div>
    </Link>
  );
}
