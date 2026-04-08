// =============================================================================
// academics/admin/pages/CMEAdminPage.tsx — Admin CME event management
// =============================================================================

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Award,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { AdminLayout } from '../AdminLayout';
import {
  useAdminCMEEvents,
  useCreateCMEEvent,
  useUpdateCMEEvent,
  useCancelCMEEvent,
  useIssueCertificates,
  type AdminCMEEvent,
  type CMEEventInput,
} from '../hooks/useAdmin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function toLocalDatetimeValue(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function eventTypeBadgeClass(type: AdminCMEEvent['eventType']): string {
  switch (type) {
    case 'webinar':
      return 'bg-blue-100 text-blue-700';
    case 'workshop':
      return 'bg-green-100 text-green-700';
    case 'conference':
      return 'bg-indigo-100 text-indigo-700';
    case 'course':
      return 'bg-purple-100 text-purple-700';
  }
}

function statusBadgeClass(status: AdminCMEEvent['status']): string {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-50 text-blue-600';
    case 'live':
      return 'bg-green-100 text-green-700 animate-pulse';
    case 'completed':
      return 'bg-gray-100 text-gray-600';
    case 'cancelled':
      return 'bg-red-100 text-red-600 line-through';
  }
}

// ---------------------------------------------------------------------------
// Event Form Modal (Create + Edit)
// ---------------------------------------------------------------------------

interface EventFormModalProps {
  event?: AdminCMEEvent;
  onClose: () => void;
}

const EMPTY_FORM: CMEEventInput = {
  title: '',
  eventType: 'webinar',
  startsAt: '',
  endsAt: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  onlineUrl: '',
  speakerName: '',
  speakerCredentials: '',
  description: '',
  creditHours: 1,
  maxAttendees: undefined,
  price: 0,
};

function EventFormModal({ event, onClose }: EventFormModalProps) {
  const isEditing = !!event;

  const [form, setForm] = useState<CMEEventInput>(() =>
    event
      ? {
          title: event.title,
          eventType: event.eventType,
          startsAt: toLocalDatetimeValue(event.startsAt),
          endsAt: toLocalDatetimeValue(event.endsAt),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          speakerName: event.speakerName ?? '',
          speakerCredentials: '',
          description: '',
          creditHours: event.creditHours,
          price: 0,
          onlineUrl: '',
        }
      : EMPTY_FORM
  );

  const createMutation = useCreateCMEEvent();
  const updateMutation = useUpdateCMEEvent();
  const isPending = createMutation.isPending || updateMutation.isPending;

  function set<K extends keyof CMEEventInput>(key: K, value: CMEEventInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: CMEEventInput = {
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };

    if (isEditing && event) {
      updateMutation.mutate(
        { ...payload, id: event.id },
        {
          onSuccess: () => onClose(),
          onError: (e) => alert(`Error: ${e.message}`),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => onClose(),
        onError: (e) => alert(`Error: ${e.message}`),
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-card shadow-card max-w-2xl w-full my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-primary text-base">
            {isEditing ? 'Edit CME Event' : 'Create CME Event'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Event title…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {/* Event type */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Event Type</label>
            <select
              value={form.eventType}
              onChange={(e) =>
                set('eventType', e.target.value as CMEEventInput['eventType'])
              }
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white"
            >
              <option value="webinar">Webinar</option>
              <option value="workshop">Workshop</option>
              <option value="conference">Conference</option>
              <option value="course">Course</option>
            </select>
          </div>

          {/* Start / End datetime */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Starts At <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={form.startsAt}
                onChange={(e) => set('startsAt', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Ends At <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={form.endsAt}
                onChange={(e) => set('endsAt', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          {/* Online URL */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Online URL</label>
            <input
              type="url"
              value={form.onlineUrl ?? ''}
              onChange={(e) => set('onlineUrl', e.target.value)}
              placeholder="https://meet.example.com/…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {/* Speaker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Speaker Name</label>
              <input
                type="text"
                value={form.speakerName ?? ''}
                onChange={(e) => set('speakerName', e.target.value)}
                placeholder="Dr. …"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Speaker Credentials
              </label>
              <input
                type="text"
                value={form.speakerCredentials ?? ''}
                onChange={(e) => set('speakerCredentials', e.target.value)}
                placeholder="MBBS, MD, DNB…"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Brief description of the event…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
          </div>

          {/* Credit hours + Max attendees + Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Credit Hours <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                required
                min={0.5}
                step={0.5}
                value={form.creditHours}
                onChange={(e) => set('creditHours', parseFloat(e.target.value))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Max Attendees
              </label>
              <input
                type="number"
                min={1}
                value={form.maxAttendees ?? ''}
                onChange={(e) =>
                  set(
                    'maxAttendees',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="Unlimited"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Price (₹), 0 = free
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm border border-border rounded-lg text-ink-muted hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm bg-accent text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: '#3182ce' }}
            >
              {isPending && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cancel Confirmation
// ---------------------------------------------------------------------------

interface CancelModalProps {
  event: AdminCMEEvent;
  onClose: () => void;
}

function CancelModal({ event, onClose }: CancelModalProps) {
  const cancelMutation = useCancelCMEEvent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-card shadow-card max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-ink">Cancel Event?</h3>
            <p className="text-sm text-ink-muted mt-1">{event.title}</p>
          </div>
        </div>
        <p className="text-sm text-ink-muted mb-6">
          Registrants will be notified that the event has been cancelled.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={cancelMutation.isPending}
            className="px-4 py-2 text-sm border border-border rounded-lg text-ink-muted hover:bg-gray-50 disabled:opacity-50"
          >
            Keep Event
          </button>
          <button
            onClick={() =>
              cancelMutation.mutate(event.id, {
                onSuccess: () => onClose(),
                onError: (e) => alert(`Error: ${e.message}`),
              })
            }
            disabled={cancelMutation.isPending}
            className="px-4 py-2 text-sm bg-danger text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {cancelMutation.isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Cancel Event
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Issue Certificates Confirmation
// ---------------------------------------------------------------------------

interface IssueCertsModalProps {
  event: AdminCMEEvent;
  onClose: () => void;
}

function IssueCertsModal({ event, onClose }: IssueCertsModalProps) {
  const issueMutation = useIssueCertificates();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-card shadow-card max-w-sm w-full p-6">
        <h3 className="font-bold text-ink mb-2">Issue Certificates?</h3>
        <p className="text-sm text-ink-muted mb-6">
          Issue CME certificates to{' '}
          <span className="font-semibold text-ink">{event.registrationCount} attendees</span>{' '}
          for <span className="font-semibold text-ink">{event.title}</span>? This action cannot
          be reversed.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={issueMutation.isPending}
            className="px-4 py-2 text-sm border border-border rounded-lg text-ink-muted hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              issueMutation.mutate(
                { id: event.id, attendees: [] },
                {
                  onSuccess: () => onClose(),
                  onError: (e) => alert(`Error: ${e.message}`),
                }
              )
            }
            disabled={issueMutation.isPending}
            className="px-4 py-2 text-sm bg-success text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {issueMutation.isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <Check size={14} />
            Issue Certificates
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event Admin Card
// ---------------------------------------------------------------------------

interface EventAdminCardProps {
  event: AdminCMEEvent;
}

function EventAdminCard({ event }: EventAdminCardProps) {
  const [editingEvent, setEditingEvent] = useState<AdminCMEEvent | null>(null);
  const [cancellingEvent, setCancellingEvent] = useState<AdminCMEEvent | null>(null);
  const [issuingCerts, setIssuingCerts] = useState<AdminCMEEvent | null>(null);

  const isCancellable = event.status === 'scheduled' || event.status === 'live';
  const isCompleted = event.status === 'completed';

  return (
    <>
      <div className="bg-white rounded-card shadow-card border border-border p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-ink text-base">{event.title}</h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${eventTypeBadgeClass(
                  event.eventType
                )}`}
              >
                {event.eventType}
              </span>
            </div>
            <p className="text-sm text-ink-muted">
              {formatDateTime(event.startsAt)} – {formatDateTime(event.endsAt)}
            </p>
            {event.speakerName && (
              <p className="text-sm text-ink-muted mt-0.5">Speaker: {event.speakerName}</p>
            )}
          </div>
          <span
            className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(
              event.status
            )}`}
          >
            {event.status}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
            <span className="font-medium text-ink">{event.registrationCount}</span> registered
          </span>
          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            {event.creditHours} CME credit{event.creditHours !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEditingEvent(event)}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-gray-50 text-ink"
          >
            Edit
          </button>
          {isCancellable && (
            <button
              onClick={() => setCancellingEvent(event)}
              className="px-3 py-1.5 text-sm border border-red-200 text-danger rounded-lg hover:bg-red-50"
            >
              Cancel
            </button>
          )}
          {isCompleted && (
            <button
              onClick={() => setIssuingCerts(event)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-success text-white rounded-lg hover:bg-green-700"
            >
              <Award size={14} />
              Issue Certificates
            </button>
          )}
        </div>
      </div>

      {editingEvent && (
        <EventFormModal event={editingEvent} onClose={() => setEditingEvent(null)} />
      )}
      {cancellingEvent && (
        <CancelModal event={cancellingEvent} onClose={() => setCancellingEvent(null)} />
      )}
      {issuingCerts && (
        <IssueCertsModal event={issuingCerts} onClose={() => setIssuingCerts(null)} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// CMEAdminPage
// ---------------------------------------------------------------------------

export function CMEAdminPage() {
  // Auth guard
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('admin')) return <Navigate to="/academics" replace />;

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: events = [], isLoading } = useAdminCMEEvents();

  const upcomingEvents = events.filter(
    (e) => e.status === 'scheduled' || e.status === 'live'
  );
  const pastEvents = events.filter(
    (e) => e.status === 'completed' || e.status === 'cancelled'
  );

  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Award size={22} className="text-primary" />
          <div>
            <h2 className="text-lg font-bold text-primary">CME Events</h2>
            <p className="text-xs text-ink-muted">Manage continuing medical education events</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-colors"
          style={{ backgroundColor: '#3182ce' }}
        >
          + Create Event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-white text-primary shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Upcoming &amp; Live
          {upcomingEvents.length > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-accent text-white flex items-center justify-center">
              {upcomingEvents.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
            activeTab === 'past'
              ? 'bg-white text-primary shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Past Events
        </button>
      </div>

      {/* Event list */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-card border border-border p-5 animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="space-y-2 flex-1 mr-4">
                  <div className="h-4 bg-gray-200 rounded w-56" />
                  <div className="h-3 bg-gray-200 rounded w-44" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-20" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-16" />
                <div className="h-8 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && displayedEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Award size={40} className="text-ink-muted mb-3" />
          <p className="text-ink-muted text-sm">
            {activeTab === 'upcoming'
              ? 'No upcoming or live events. Create one to get started.'
              : 'No past events found.'}
          </p>
        </div>
      )}

      {!isLoading && displayedEvents.length > 0 && (
        <div className="space-y-4">
          {displayedEvents.map((event) => (
            <EventAdminCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <EventFormModal onClose={() => setShowCreateModal(false)} />
      )}
    </AdminLayout>
  );
}
