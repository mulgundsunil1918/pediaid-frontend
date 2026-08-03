// =============================================================================
// academics/admin/pages/CmeTypeAdminPage.tsx
//
// One page per CME event type (Conference/Webinar/Workshop/Course), replacing
// the old combined "CME Events" + "Pending Events" sidebar items. Route:
// /academics/admin/cme/:eventType/pending
//
// Shows the pending-moderation queue for just that type — Approve, Request
// changes (new — sends the poster a specific note + email, status goes to
// changes_requested), or Reject. A link at the top jumps to the general
// "manage all {type} events" view (CMEAdminPage, filtered by type).
//
// Moderation controls come from the shared ModerationActions component, which
// this page and PendingNeverAgainPage both use.
// =============================================================================

import { Navigate, useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  User2,
  Link as LinkIcon,
  FileText,
  Inbox,
  Mic,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { AdminLayout } from '../AdminLayout';
import {
  useAdminPendingCmeEvents,
  useApproveCmeEvent,
  useRejectCmeEvent,
  useRequestCmeEventChanges,
  type PendingCmeEvent,
} from '../hooks/useAdmin';
import { ModerationActions, type ModerationCopy } from '../components/ModerationActions';

// ---------------------------------------------------------------------------
// Type metadata
// ---------------------------------------------------------------------------

const VALID_TYPES = ['conference', 'webinar', 'workshop', 'course'] as const;
type CmeType = (typeof VALID_TYPES)[number];

const TYPE_META: Record<CmeType, { label: string; plural: string; cls: string }> = {
  conference: { label: 'Conference', plural: 'Conferences', cls: 'bg-blue-100 text-blue-800' },
  webinar: { label: 'Webinar', plural: 'Webinars', cls: 'bg-teal-100 text-teal-800' },
  workshop: { label: 'Workshop', plural: 'Workshops', cls: 'bg-purple-100 text-purple-800' },
  course: { label: 'Course', plural: 'Courses', cls: 'bg-amber-100 text-amber-800' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  const dateFmt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const timeFmt: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  if (sameDay) {
    return `${start.toLocaleDateString('en-IN', dateFmt)}, ${start.toLocaleTimeString('en-IN', timeFmt)} – ${end.toLocaleTimeString('en-IN', timeFmt)}`;
  }
  return `${start.toLocaleDateString('en-IN', dateFmt)} – ${end.toLocaleDateString('en-IN', dateFmt)}`;
}

function daysAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

// ---------------------------------------------------------------------------
// Event card
// ---------------------------------------------------------------------------

function PendingEventCard({ event }: { event: PendingCmeEvent }) {
  const approveMutation = useApproveCmeEvent();
  const rejectMutation = useRejectCmeEvent();
  const changesMutation = useRequestCmeEventChanges();

  const moderationCopy: ModerationCopy = {
    rejectTitle: 'Reject event',
    rejectDescription: (
      <>
        Rejecting <strong>{event.title}</strong>. The poster will be emailed with the
        reason below and can edit and resubmit the event from My Submissions.
      </>
    ),
    rejectPlaceholder:
      "e.g. This isn't a CME-accredited event and doesn't fit this section.",
    changesTitle: 'Request changes',
    changesDescription: (
      <>
        <strong>{event.title}</strong> goes back to the poster with your note below —
        they'll get an email and can edit + resubmit without losing their place in the
        queue.
      </>
    ),
    changesPlaceholder:
      'e.g. Please add a registration link and confirm the CME credit hours.',
  };

  return (
    <article className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
      {event.cover_image_url && (
        <div className="h-36 bg-gray-100 overflow-hidden">
          <img
            src={event.cover_image_url}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                <Clock size={10} /> Submitted {daysAgo(event.created_at)}
              </span>
            </div>
            <h3 className="font-sans font-bold text-xl text-primary leading-tight">{event.title}</h3>
            {event.subtitle && <p className="text-sm text-ink-muted mt-0.5">{event.subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-muted mt-2 mb-4 pb-3 border-b border-border">
          <User2 size={12} />
          Posted by{' '}
          <span className="font-semibold text-ink">{event.poster_name ?? event.poster_email ?? 'Unknown user'}</span>
          {event.poster_email && <span className="text-ink-muted/80">· {event.poster_email}</span>}
          {event.poster_role && (
            <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-semibold uppercase">
              {event.poster_role}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-start gap-2">
            <Calendar size={14} className="text-ink-muted mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-semibold text-ink-muted uppercase mb-0.5">When</p>
              <p className="text-ink">{formatDateRange(event.starts_at, event.ends_at)}</p>
              <p className="text-xs text-ink-muted">{event.timezone}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            {event.online_url ? (
              <Globe size={14} className="text-ink-muted mt-0.5 shrink-0" />
            ) : (
              <MapPin size={14} className="text-ink-muted mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-[10px] font-semibold text-ink-muted uppercase mb-0.5">Where</p>
              {event.online_url ? (
                <>
                  <p className="text-ink">Online</p>
                  <a href={event.online_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline truncate block">
                    {event.online_url}
                  </a>
                </>
              ) : (
                <>
                  <p className="text-ink">{event.venue ?? '—'}</p>
                  {(event.address || event.city) && (
                    <p className="text-xs text-ink-muted">
                      {[event.address, event.city, event.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {event.organised_by && (
          <div className="flex items-start gap-2 text-sm mb-3">
            <Users size={14} className="text-ink-muted mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-semibold text-ink-muted uppercase mb-0.5">Organised by</p>
              <p className="text-ink">{event.organised_by}</p>
            </div>
          </div>
        )}

        {event.speaker_name && (
          <div className="flex items-start gap-2 text-sm mb-3">
            <Mic size={14} className="text-ink-muted mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-semibold text-ink-muted uppercase mb-0.5">Speaker</p>
              <p className="text-ink font-medium">{event.speaker_name}</p>
              {event.speaker_credentials && <p className="text-xs text-ink-muted">{event.speaker_credentials}</p>}
              {event.speaker_bio && <p className="text-xs text-ink-muted">{event.speaker_bio}</p>}
            </div>
          </div>
        )}

        {event.description && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-ink-muted uppercase mb-1">About</p>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {event.tags.map((t) => (
              <span key={t} className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                {t}
              </span>
            ))}
          </div>
        )}

        {event.coordinators && event.coordinators.length > 0 && (
          <div className="rounded-xl bg-gray-50 border border-border px-4 py-3 mb-3">
            <p className="text-[10px] font-semibold text-ink-muted uppercase mb-2">Event coordinators</p>
            <ul className="space-y-2 text-sm">
              {event.coordinators.map((c, i) => (
                <li key={i} className="text-ink">
                  {c.name && <strong>{c.name}</strong>}
                  {c.email && <span className="block text-xs text-ink-muted">{c.email}</span>}
                  {c.phone && <span className="block text-xs text-ink-muted">{c.phone}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(event.brochure_url || event.registration_url) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {event.brochure_url && (
              <a href={event.brochure_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-ink hover:bg-gray-50">
                <FileText size={12} /> Brochure
              </a>
            )}
            {event.registration_url && (
              <a href={event.registration_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-ink hover:bg-gray-50">
                <LinkIcon size={12} /> Registration
              </a>
            )}
          </div>
        )}

        <ModerationActions
          copy={moderationCopy}
          onApprove={() => approveMutation.mutateAsync(event.id).then(() => undefined)}
          onReject={(reason) =>
            rejectMutation.mutateAsync({ id: event.id, reason }).then(() => undefined)
          }
          onRequestChanges={(reason) =>
            changesMutation.mutateAsync({ id: event.id, reason }).then(() => undefined)
          }
          isApproving={approveMutation.isPending}
          isRejecting={rejectMutation.isPending}
          isRequestingChanges={changesMutation.isPending}
        />
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function CmeTypeAdminPage() {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('admin')) {
    return <Navigate to={`/academics/login?next=${encodeURIComponent(window.location.pathname)}`} replace />;
  }

  const { eventType } = useParams<{ eventType: string }>();
  const type = (VALID_TYPES as readonly string[]).includes(eventType ?? '')
    ? (eventType as CmeType)
    : null;

  const { data, isLoading, isError, error } = useAdminPendingCmeEvents();

  if (!type) {
    return <Navigate to="/academics/admin" replace />;
  }

  const meta = TYPE_META[type];
  const events = (data ?? []).filter((e) => e.event_type === type);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#1e3a5f' }}>
              <Sparkles size={22} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl text-ink leading-tight">
                Pending {meta.plural}
              </h1>
              <p className="text-sm text-ink-muted mt-0.5">
                {meta.plural} posted by PediAid users — approve, request changes, or reject each one below.
              </p>
            </div>
          </div>
          <Link
            to={`/academics/admin/cme/${type}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            Manage all {meta.plural.toLowerCase()} (published, cancelled, past) <ArrowRight size={14} />
          </Link>
        </header>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-ink-muted text-sm">
            <Loader2 size={18} className="animate-spin mr-2" />
            Loading submissions…
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger">
            {error instanceof Error ? error.message : `Failed to load pending ${meta.plural.toLowerCase()}.`}
          </div>
        )}

        {!isLoading && !isError && events.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card border border-border py-16 px-6 text-center">
            <Inbox size={48} className="mx-auto text-ink-muted mb-4" aria-hidden="true" />
            <p className="text-ink font-semibold text-lg mb-1">No {meta.plural.toLowerCase()} waiting</p>
            <p className="text-sm text-ink-muted max-w-sm mx-auto">
              When someone posts a {meta.label.toLowerCase()} from the Flutter app, it'll appear here for your review.
            </p>
          </div>
        )}

        {!isLoading && !isError && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <PendingEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
