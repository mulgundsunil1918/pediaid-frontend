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
  Share2,
  Tag,
} from 'lucide-react';
import {
  useCMEEvent,
  useRegisterForEvent,
  useCancelRegistration,
  type CMEEvent,
} from './hooks/useCME';
import { CountdownTimer } from './components/CountdownTimer';
import { SpeakerCard } from './components/SpeakerCard';
import { AddToCalendar } from './components/AddToCalendar';
import { SaveButton } from '../bookmarks/SaveButton';
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

// One gradient per event type, matching the chip colours the lists already
// use — so a webinar is blue everywhere, a workshop purple, a conference
// amber, a course teal. The header wears it; the body stays neutral.
const EVENT_TYPE_THEME: Record<string, { from: string; to: string; tint: string; border: string }> = {
  webinar:    { from: '#3B82F6', to: '#1E40AF', tint: '#EFF6FF', border: '#BFDBFE' },
  workshop:   { from: '#8B5CF6', to: '#5B21B6', tint: '#F5F3FF', border: '#DDD6FE' },
  conference: { from: '#F59E0B', to: '#B45309', tint: '#FFFBEB', border: '#FDE68A' },
  course:     { from: '#14B8A6', to: '#0F766E', tint: '#F0FDFA', border: '#99F6E4' },
};
const DEFAULT_THEME = { from: '#475569', to: '#1E293B', tint: '#F8FAFC', border: '#E2E8F0' };

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


/**
 * Shares an event with everything the page shows, including its PediAid ID.
 *
 * Uses the Web Share API where the browser has one (every mobile browser), and
 * falls back to the clipboard elsewhere — desktop Firefox and Safari have no
 * share sheet, and a button that silently does nothing there is worse than one
 * that copies.
 */
async function shareEvent(event: CMEEvent) {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const fmtDate = start.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

  const lines = [
    event.title,
    `${event.eventType.charAt(0).toUpperCase()}${event.eventType.slice(1)} \u00b7 PediAid`,
    '',
    `${fmtDate}, ${fmtTime(start)} \u2013 ${fmtTime(end)}`,
  ];
  if (event.venue) lines.push(`Venue: ${event.venue}`);
  if (event.creditHours) lines.push(`${event.creditHours} CME credits`);
  if (event.onlineUrl) lines.push(`Join: ${event.onlineUrl}`);
  if (event.referenceCode) {
    lines.push('', `PediAid ID no.: ${event.referenceCode}`);
  }
  // No URL. Academics is kept off public surfaces, and the PediAid ID above
  // is what identifies the event to anyone who needs to look it up.

  const text = lines.join('\n').trim();
  try {
    if (navigator.share) {
      await navigator.share({ title: event.title, text });
      return;
    }
    await navigator.clipboard.writeText(text);
  } catch {
    /* user dismissed the share sheet, or clipboard denied — nothing to do */
  }
}

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

  const theme = EVENT_TYPE_THEME[event.eventType] ?? DEFAULT_THEME;

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

            {/* Header band in the event type's colour — chips, title and the
                when/where all live on the gradient, so a webinar reads blue
                and a conference amber before a single word is read. */}
            <div
              className="rounded-2xl p-5 sm:p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
              }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-white/20 text-white">
                  {event.eventType}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-black/20 text-white/90">
                  {event.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-4">
                {event.title}
              </h1>

              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 text-sm text-white/90">
                  <Calendar size={15} className="mt-0.5 shrink-0 text-white/75" />
                  <div>
                    <span>{formatDateTime(event.startsAt, event.timezone)}</span>
                    <span className="mx-2 text-white/50">—</span>
                    <span>{formatDateTime(event.endsAt, event.timezone)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-white/90">
                  <Clock size={15} className="shrink-0 text-white/75" />
                  <span>{event.timezone}</span>
                </div>

                {event.venue ? (
                  <div className="flex items-start gap-2 text-sm text-white/90">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-white/75" />
                    <span>{event.venue}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <Globe size={15} className="shrink-0 text-white/75" />
                    <span>
                      {event.isRegistered && event.onlineUrl ? (
                        <a
                          href={event.onlineUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white underline underline-offset-2"
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
            </div>

            {/* Countdown, tinted in the type colour */}
            {isCountdownVisible && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl border w-fit"
                style={{ backgroundColor: theme.tint, borderColor: theme.border }}
              >
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
              <section
                className="rounded-2xl border p-4 sm:p-5"
                style={{ backgroundColor: theme.tint, borderColor: theme.border }}
              >
                <h2 className="text-[13px] font-bold uppercase tracking-wide mb-3"
                    style={{ color: theme.to }}>
                  About this event
                </h2>
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
            {/* Optional-chained: the API does not return a `speakers` array
                at all — it sends speakerName/speakerBio/speakerCredentials as
                separate fields — so this read threw on every event and took
                the whole detail page down with it. That made every shared
                link a dead end. */}
            {(event.speakers?.length ?? 0) > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-ink mb-4">Speakers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers!.map((speaker) => (
                    <SpeakerCard key={speaker.id} speaker={speaker} />
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            {(event.tags?.length ?? 0) > 0 && (
              <section>
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag size={14} className="text-ink-muted shrink-0" />
                  {event.tags!.map((tag) => (
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
                <SaveButton itemType="cme" itemId={event.id} withLabel />
              </div>
            )}

            {/* PediAid ID + share.
                The id is what anyone quotes when referring to this listing, so
                it is selectable and travels with the share text — a link alone
                leaves the recipient unable to say which event they mean. */}
            {event.referenceCode && (
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <span className="text-xs text-ink-muted">PediAid ID no.</span>
                <code className="text-xs font-mono text-ink select-all">
                  {event.referenceCode}
                </code>
                <button
                  type="button"
                  onClick={() => shareEvent(event)}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-ink-muted hover:text-ink hover:bg-surface-alt"
                >
                  <Share2 size={14} />
                  Share
                </button>
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
