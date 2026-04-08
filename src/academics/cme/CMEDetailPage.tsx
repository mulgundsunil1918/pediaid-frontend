// =============================================================================
// academics/cme/CMEDetailPage.tsx — /academics/cme/:slug route
// =============================================================================

import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Loader2,
  MapPin,
  Tag,
} from 'lucide-react';
import {
  useCMEEvent,
  useRegisterForEvent,
  useCancelRegistration,
} from './hooks/useCME';
import { CountdownTimer } from './components/CountdownTimer';
import { SpeakerCard } from './components/SpeakerCard';
import { AddToCalendar } from './components/AddToCalendar';
import { RegistrationCard } from './components/RegistrationCard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string, timezone: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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

const EVENT_TYPE_STYLES: Record<string, string> = {
  webinar: 'bg-blue-100 text-blue-700',
  workshop: 'bg-purple-100 text-purple-700',
  conference: 'bg-amber-100 text-amber-700',
  course: 'bg-teal-100 text-teal-700',
};

const STATUS_STYLES: Record<string, string> = {
  upcoming: 'bg-accent/15 text-accent',
  ongoing: 'bg-success/15 text-success',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-danger/10 text-danger',
};

// ---------------------------------------------------------------------------
// Markdown-lite renderer — splits on blank lines to form paragraphs
// ---------------------------------------------------------------------------

function SimpleMarkdown({ content }: { content: string }) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  return (
    <div className="flex flex-col gap-4">
      {paragraphs.map((para, i) => (
        <p key={i} className="text-ink leading-relaxed whitespace-pre-line">
          {para}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CMEDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading, isError, error } = useCMEEvent(slug);

  const registerMutation = useRegisterForEvent();
  const cancelMutation = useCancelRegistration();

  const isPending = registerMutation.isPending || cancelMutation.isPending;

  function handleRegister() {
    if (!event) return;
    registerMutation.mutate(event.id);
  }

  function handleCancel() {
    if (!event) return;
    cancelMutation.mutate(event.id);
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  // ── Error ──
  if (isError || !event) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <p className="text-danger font-medium">
          {error?.message ?? 'Event not found.'}
        </p>
        <button
          onClick={() => navigate('/academics/cme')}
          className="text-sm text-accent hover:underline"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const isCountdownVisible =
    event.status === 'upcoming' || event.status === 'ongoing';

  return (
    <div className="min-h-screen bg-bg">

      {/* Cover image banner */}
      {event.coverImageUrl && (
        <div className="w-full h-64 lg:h-80 overflow-hidden">
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate('/academics/cme')}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to CME Events
        </button>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Left: content column ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Type + status badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${EVENT_TYPE_STYLES[event.eventType] ?? 'bg-gray-100 text-gray-600'}`}>
                {event.eventType}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[event.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {event.status}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-primary leading-snug">
              {event.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-col gap-2.5">
              {/* Date/time */}
              <div className="flex items-start gap-2 text-sm text-ink-muted">
                <Calendar size={15} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <span>{formatDateTime(event.startsAt, event.timezone)}</span>
                  <span className="mx-2 text-border">—</span>
                  <span>{formatDateTime(event.endsAt, event.timezone)}</span>
                </div>
              </div>

              {/* Timezone */}
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Clock size={15} className="shrink-0 text-accent" />
                <span>{event.timezone}</span>
              </div>

              {/* Location */}
              {event.venue ? (
                <div className="flex items-start gap-2 text-sm text-ink-muted">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-accent" />
                  <span>{event.venue}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <Globe size={15} className="shrink-0 text-accent" />
                  <span>
                    {event.isRegistered && event.onlineUrl ? (
                      <a
                        href={event.onlineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        {event.onlineUrl}
                      </a>
                    ) : (
                      'Online — link shown after registration'
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Countdown */}
            {isCountdownVisible && (
              <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg w-fit">
                <span className="text-sm text-ink-muted font-medium">
                  {event.status === 'upcoming' ? 'Starts in:' : 'Status:'}
                </span>
                <CountdownTimer
                  targetDate={
                    event.status === 'upcoming' ? event.startsAt : event.endsAt
                  }
                />
              </div>
            )}

            {/* Long description */}
            {event.longDescription && (
              <section>
                <h2 className="text-lg font-semibold text-ink mb-3">About this event</h2>
                <SimpleMarkdown content={event.longDescription} />
              </section>
            )}

            {/* Short description fallback */}
            {!event.longDescription && event.description && (
              <section>
                <h2 className="text-lg font-semibold text-ink mb-3">About this event</h2>
                <p className="text-ink leading-relaxed">{event.description}</p>
              </section>
            )}

            {/* Speakers */}
            {event.speakers.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-ink mb-4">Speakers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers.map((speaker) => (
                    <SpeakerCard key={speaker.id} speaker={speaker} />
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            {event.tags.length > 0 && (
              <section>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag size={14} className="text-ink-muted shrink-0" />
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 bg-card border border-border rounded-full text-xs text-ink-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Add to Calendar (if registered) */}
            {event.isRegistered && (
              <div>
                <AddToCalendar event={event} />
              </div>
            )}

          </div>

          {/* ── Right: sticky registration card ── */}
          <div className="w-full lg:w-80 shrink-0">
            <RegistrationCard
              event={event}
              onRegister={handleRegister}
              onCancel={handleCancel}
              isPending={isPending}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
