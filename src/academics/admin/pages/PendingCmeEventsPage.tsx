// =============================================================================
// academics/admin/pages/PendingCmeEventsPage.tsx
//
// Admin-only moderation queue for user-posted CMEs, webinars, workshops, and
// conferences. Shows every row in acad_cme_events with status='pending',
// joined with the posting user's name + email so the admin has context. Each
// card supports Approve (publishes immediately, sends branded email +
// in-app notification) and Reject (requires a reason in a modal, stores it,
// emails the user so they can edit and resubmit).
//
// Mirrors the structure of PendingApplicationsPage.tsx that I wrote earlier.
// =============================================================================

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Calendar,
  Check,
  X,
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
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { AdminLayout } from '../AdminLayout';
import {
  useAdminPendingCmeEvents,
  useApproveCmeEvent,
  useRejectCmeEvent,
  type PendingCmeEvent,
} from '../hooks/useAdmin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay =
    start.toDateString() === end.toDateString();
  const dateFmt: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const timeFmt: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  };
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

function eventTypeBadge(type: PendingCmeEvent['event_type']): {
  label: string;
  cls: string;
} {
  switch (type) {
    case 'conference':
      return { label: 'Conference', cls: 'bg-blue-100 text-blue-800' };
    case 'webinar':
      return { label: 'Webinar', cls: 'bg-teal-100 text-teal-800' };
    case 'workshop':
      return { label: 'Workshop', cls: 'bg-purple-100 text-purple-800' };
    case 'course':
      return { label: 'Course', cls: 'bg-amber-100 text-amber-800' };
  }
}

// ---------------------------------------------------------------------------
// Reject modal
// ---------------------------------------------------------------------------

function RejectModal({
  event,
  onCancel,
  onConfirm,
  isPending,
}: {
  event: PendingCmeEvent;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-cme-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-danger px-6 py-4">
          <h2
            id="reject-cme-modal-title"
            className="font-bold text-white text-lg flex items-center gap-2"
          >
            <X size={20} /> Reject event
          </h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-ink leading-relaxed">
            Rejecting <strong>{event.title}</strong>. The poster will be
            emailed with the reason below and will be able to edit and
            resubmit the event from their "My posts" tab.
          </p>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Reason (required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 1000))}
              rows={4}
              placeholder="e.g. Please add a venue address and a valid registration link."
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-danger transition-colors resize-y"
              autoFocus
            />
            <p className="text-xs text-ink-muted mt-1">
              {reason.length}/1000 — minimum 5 characters
            </p>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-ink border border-border rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={!valid || isPending}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-danger disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isPending ? 'Rejecting…' : 'Confirm reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event card
// ---------------------------------------------------------------------------

function PendingEventCard({ event }: { event: PendingCmeEvent }) {
  const approveMutation = useApproveCmeEvent();
  const rejectMutation = useRejectCmeEvent();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState('');

  const isSubmitting = approveMutation.isPending || rejectMutation.isPending;
  const typeBadge = eventTypeBadge(event.event_type);

  async function handleApprove() {
    setError('');
    try {
      await approveMutation.mutateAsync(event.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed.');
    }
  }

  async function handleReject(reason: string) {
    setError('');
    try {
      await rejectMutation.mutateAsync({ id: event.id, reason });
      setRejectOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed.');
    }
  }

  return (
    <article className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
      {/* Cover image (if any) */}
      {event.cover_image_url && (
        <div className="h-36 bg-gray-100 overflow-hidden">
          <img
            src={event.cover_image_url}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="p-6">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${typeBadge.cls}`}
              >
                {typeBadge.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                <Clock size={10} /> Submitted {daysAgo(event.created_at)}
              </span>
            </div>
            <h3 className="font-sans font-bold text-xl text-primary leading-tight">
              {event.title}
            </h3>
            {event.subtitle && (
              <p className="text-sm text-ink-muted mt-0.5">{event.subtitle}</p>
            )}
          </div>
        </div>

        {/* Posted-by strip */}
        <div className="flex items-center gap-2 text-xs text-ink-muted mt-2 mb-4 pb-3 border-b border-border">
          <User2 size={12} />
          Posted by{' '}
          <span className="font-semibold text-ink">
            {event.poster_name ?? event.poster_email ?? 'Unknown user'}
          </span>
          {event.poster_email && (
            <span className="text-ink-muted/80">· {event.poster_email}</span>
          )}
          {event.poster_role && (
            <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-semibold uppercase">
              {event.poster_role}
            </span>
          )}
        </div>

        {/* When / where grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-start gap-2">
            <Calendar
              size={14}
              className="text-ink-muted mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-[10px] font-semibold text-ink-muted uppercase mb-0.5">
                When
              </p>
              <p className="text-ink">
                {formatDateRange(event.starts_at, event.ends_at)}
              </p>
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
              <p className="text-[10px] font-semibold text-ink-muted uppercase mb-0.5">
                Where
              </p>
              {event.online_url ? (
                <>
                  <p className="text-ink">Online</p>
                  <a
                    href={event.online_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline truncate block"
                  >
                    {event.online_url}
                  </a>
                </>
              ) : (
                <>
                  <p className="text-ink">{event.venue ?? '—'}</p>
                  {(event.address || event.city) && (
                    <p className="text-xs text-ink-muted">
                      {[event.address, event.city, event.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Organised by */}
        {event.organised_by && (
          <div className="flex items-start gap-2 text-sm mb-3">
            <Users
              size={14}
              className="text-ink-muted mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-[10px] font-semibold text-ink-muted uppercase mb-0.5">
                Organised by
              </p>
              <p className="text-ink">{event.organised_by}</p>
            </div>
          </div>
        )}

        {/* Speaker (mostly webinars) */}
        {event.speaker_name && (
          <div className="flex items-start gap-2 text-sm mb-3">
            <Mic
              size={14}
              className="text-ink-muted mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-[10px] font-semibold text-ink-muted uppercase mb-0.5">
                Speaker
              </p>
              <p className="text-ink font-medium">{event.speaker_name}</p>
              {event.speaker_credentials && (
                <p className="text-xs text-ink-muted">
                  {event.speaker_credentials}
                </p>
              )}
              {event.speaker_bio && (
                <p className="text-xs text-ink-muted">{event.speaker_bio}</p>
              )}
            </div>
          </div>
        )}

        {/* About */}
        {event.description && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-ink-muted uppercase mb-1">
              About
            </p>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {event.tags.map((t) => (
              <span
                key={t}
                className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Coordinators */}
        {event.coordinators && event.coordinators.length > 0 && (
          <div className="rounded-xl bg-gray-50 border border-border px-4 py-3 mb-3">
            <p className="text-[10px] font-semibold text-ink-muted uppercase mb-2">
              Event coordinators
            </p>
            <ul className="space-y-2 text-sm">
              {event.coordinators.map((c, i) => (
                <li key={i} className="text-ink">
                  {c.name && <strong>{c.name}</strong>}
                  {c.email && (
                    <span className="block text-xs text-ink-muted">
                      {c.email}
                    </span>
                  )}
                  {c.phone && (
                    <span className="block text-xs text-ink-muted">
                      {c.phone}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Links */}
        {(event.brochure_url || event.registration_url) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {event.brochure_url && (
              <a
                href={event.brochure_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-ink hover:bg-gray-50"
              >
                <FileText size={12} /> Brochure
              </a>
            )}
            {event.registration_url && (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-ink hover:bg-gray-50"
              >
                <LinkIcon size={12} /> Registration
              </a>
            )}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#38a169' }}
          >
            {approveMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Approve
          </button>
          <button
            type="button"
            onClick={() => setRejectOpen(true)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-danger border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <X size={14} />
            Reject
          </button>
        </div>
      </div>

      {rejectOpen && (
        <RejectModal
          event={event}
          onCancel={() => setRejectOpen(false)}
          onConfirm={handleReject}
          isPending={rejectMutation.isPending}
        />
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function PendingCmeEventsPage() {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('admin')) {
    return <Navigate to="/academics" replace />;
  }

  const { data, isLoading, isError, error } = useAdminPendingCmeEvents();
  const events = data ?? [];

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <Sparkles size={22} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl text-ink leading-tight">
                Pending events
              </h1>
              <p className="text-sm text-ink-muted mt-0.5">
                CMEs, webinars, workshops, and conferences posted by PediAid
                users — approve or reject each one below.
              </p>
            </div>
          </div>
        </header>

        {/* States */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-ink-muted text-sm">
            <Loader2 size={18} className="animate-spin mr-2" />
            Loading submissions…
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-danger">
            {error instanceof Error
              ? error.message
              : 'Failed to load pending events.'}
          </div>
        )}

        {!isLoading && !isError && events.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card border border-border py-16 px-6 text-center">
            <Inbox
              size={48}
              className="mx-auto text-ink-muted mb-4"
              aria-hidden="true"
            />
            <p className="text-ink font-semibold text-lg mb-1">
              No events waiting
            </p>
            <p className="text-sm text-ink-muted max-w-sm mx-auto">
              When someone posts a CME or webinar from the Flutter app, it'll
              appear here for your review.
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
