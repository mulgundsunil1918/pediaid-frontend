// =============================================================================
// academics/cme/SubmitCMEEventPage.tsx
// Route: /academics/cme/submit/:eventType
//
// One dedicated submission entry point per event type (Conference/Webinar/
// Workshop/Course) — the type is locked from the URL, no picker shown,
// matching the same pattern as the Flutter app's per-tab "+" button.
// Mirrors flutter/lib/screens/cme/post_event_screen.dart's field set.
// =============================================================================

import { useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { CheckCircle2, Plus, Trash2, Loader2, Info } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import {
  useSubmitCMEEvent,
  type CmeCoordinatorInput,
  type SubmitCMEEventInput,
} from './hooks/useCME';

const VALID_TYPES = ['conference', 'webinar', 'workshop', 'course'] as const;
type CmeType = (typeof VALID_TYPES)[number];

const TYPE_META: Record<CmeType, { label: string; article: string }> = {
  conference: { label: 'Conference', article: 'a' },
  webinar: { label: 'Webinar', article: 'a' },
  workshop: { label: 'Workshop', article: 'a' },
  course: { label: 'Course', article: 'a' },
};

const inputCls =
  'w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors';
const labelCls = 'block text-sm font-semibold text-ink mb-1.5';
const sectionCls = 'text-xs font-bold uppercase tracking-wide text-ink-muted mb-3 mt-8';

export function SubmitCMEEventPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const { eventType } = useParams<{ eventType: string }>();
  const type = (VALID_TYPES as readonly string[]).includes(eventType ?? '')
    ? (eventType as CmeType)
    : null;

  if (!type) return <Navigate to="/academics/cme" replace />;
  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/academics/login?next=${encodeURIComponent(window.location.pathname)}`}
        replace
      />
    );
  }

  const meta = TYPE_META[type];
  const isInPerson = type === 'conference' || type === 'workshop';
  const submitMutation = useSubmitCMEEvent();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');
  const [organisedBy, setOrganisedBy] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [speakerCredentials, setSpeakerCredentials] = useState('');
  const [speakerBio, setSpeakerBio] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coordinators, setCoordinators] = useState<CmeCoordinatorInput[]>([
    { name: '', email: '', phone: '' },
  ]);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [brochureUrl, setBrochureUrl] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [creditHours, setCreditHours] = useState('');
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }

  function updateCoordinator(i: number, field: keyof CmeCoordinatorInput, value: string) {
    setCoordinators((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (title.trim().length < 5) return setFormError('Title must be at least 5 characters.');
    if (description.trim().length < 20) return setFormError('Description must be at least 20 characters.');
    if (!startsAt || !endsAt) return setFormError('Please pick start and end times.');
    if (new Date(endsAt) <= new Date(startsAt)) return setFormError('End time must be after start time.');
    const validCoordinators = coordinators.filter((c) => c.name.trim());
    if (validCoordinators.length === 0) return setFormError('Add at least one coordinator with a name.');

    const input: SubmitCMEEventInput = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      // Non-null: the component returns early above (Navigate) whenever
      // `type` is null, so by the time this closure can run it's always
      // set — TS just can't see that narrowing across the closure boundary.
      eventType: type!,
      description: description.trim(),
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      venue: isInPerson ? venue.trim() || undefined : undefined,
      address: isInPerson ? address.trim() || undefined : undefined,
      city: isInPerson ? city.trim() || undefined : undefined,
      onlineUrl: !isInPerson ? onlineUrl.trim() || undefined : undefined,
      organisedBy: organisedBy.trim() || undefined,
      speakerName: type === 'webinar' ? speakerName.trim() || undefined : undefined,
      speakerCredentials: type === 'webinar' ? speakerCredentials.trim() || undefined : undefined,
      speakerBio: type === 'webinar' ? speakerBio.trim() || undefined : undefined,
      creditHours: creditHours ? Number(creditHours) : undefined,
      tags,
      coordinators: validCoordinators,
      coverImageUrl: coverImageUrl.trim() || undefined,
      brochureUrl: brochureUrl.trim() || undefined,
      registrationUrl: registrationUrl.trim() || undefined,
    };

    try {
      await submitMutation.mutateAsync(input);
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not submit. Please try again.');
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-card border border-border rounded-2xl shadow-card p-10">
          <CheckCircle2 size={56} className="mx-auto text-success mb-4" />
          <h1 className="text-xl font-bold text-ink mb-2">Thank you for posting!</h1>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            Your {meta.label.toLowerCase()} is awaiting admin review. You'll be notified
            once it's approved, and it'll show up in the public CME list.
          </p>
          <Link
            to="/academics/cme"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            Back to CME &amp; Webinars
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-primary">Submit {meta.article} {meta.label}</h1>
        <p className="text-sm text-ink-muted mt-1 mb-6">
          An admin will review your submission before it goes live.
        </p>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl shadow-card p-6 sm:p-8">
          <p className={sectionCls.replace('mt-8', '')}>Basics</p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. ${meta.label} name`} />
            </div>
            <div>
              <label className={labelCls}>Subtitle</label>
              <input className={inputCls} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>About the event *</label>
              <textarea className={inputCls} rows={4} value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the event in a few sentences…" />
            </div>
          </div>

          <p className={sectionCls}>When</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Starts *</label>
              <input type="datetime-local" className={inputCls} value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Ends *</label>
              <input type="datetime-local" className={inputCls} value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>

          <p className={sectionCls}>Where</p>
          {isInPerson ? (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Venue</label>
                <input className={inputCls} value={venue} onChange={(e) => setVenue(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
          ) : (
            <div>
              <label className={labelCls}>Online URL</label>
              <input className={inputCls} value={onlineUrl} onChange={(e) => setOnlineUrl(e.target.value)}
                placeholder="Zoom / Google Meet / Teams link" />
            </div>
          )}

          <p className={sectionCls}>Organiser</p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Organised by</label>
              <input className={inputCls} value={organisedBy} onChange={(e) => setOrganisedBy(e.target.value)} />
            </div>
            {type === 'webinar' && (
              <>
                <div>
                  <label className={labelCls}>Speaker name</label>
                  <input className={inputCls} value={speakerName} onChange={(e) => setSpeakerName(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Speaker credentials</label>
                  <input className={inputCls} value={speakerCredentials}
                    onChange={(e) => setSpeakerCredentials(e.target.value)} placeholder="e.g. MD, DM (Neonatology)" />
                </div>
                <div>
                  <label className={labelCls}>Speaker bio</label>
                  <textarea className={inputCls} rows={2} value={speakerBio}
                    onChange={(e) => setSpeakerBio(e.target.value)} />
                </div>
              </>
            )}
          </div>

          <p className={sectionCls}>Tags</p>
          <div className="flex gap-2 mb-2">
            <input
              className={inputCls}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addTag(); }
              }}
              placeholder="Press enter to add"
            />
            <button type="button" onClick={addTag}
              className="px-4 rounded-xl border border-border text-ink hover:bg-gray-50 shrink-0">
              <Plus size={16} />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-blue-900">×</button>
                </span>
              ))}
            </div>
          )}

          <p className={sectionCls}>Coordinators</p>
          <p className="text-xs text-ink-muted mb-3">At least one coordinator with a name is required.</p>
          <div className="space-y-3">
            {coordinators.map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    className={`${inputCls} bg-white`}
                    placeholder={`Name${i === 0 ? ' *' : ''}`}
                    value={c.name}
                    onChange={(e) => updateCoordinator(i, 'name', e.target.value)}
                  />
                  {coordinators.length > 1 && (
                    <button type="button"
                      onClick={() => setCoordinators(coordinators.filter((_, idx) => idx !== i))}
                      className="p-2 text-danger hover:bg-red-50 rounded-lg shrink-0">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={`${inputCls} bg-white`} placeholder="Email" value={c.email ?? ''}
                    onChange={(e) => updateCoordinator(i, 'email', e.target.value)} />
                  <input className={`${inputCls} bg-white`} placeholder="Phone" value={c.phone ?? ''}
                    onChange={(e) => updateCoordinator(i, 'phone', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCoordinators([...coordinators, { name: '', email: '', phone: '' }])}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            <Plus size={14} /> Add another coordinator
          </button>

          <p className={sectionCls}>Links</p>
          <p className="text-xs text-ink-muted mb-3">
            Upload your PDF or image to Google Drive → Share → Anyone with the link → paste it here.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Cover image URL</label>
              <input className={inputCls} value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className={labelCls}>Brochure (Google Drive link)</label>
              <input className={inputCls} value={brochureUrl} onChange={(e) => setBrochureUrl(e.target.value)} placeholder="https://drive.google.com/…" />
            </div>
            <div>
              <label className={labelCls}>Registration URL</label>
              <input className={inputCls} value={registrationUrl} onChange={(e) => setRegistrationUrl(e.target.value)} placeholder="Google Form, event page, etc." />
            </div>
          </div>

          <p className={sectionCls}>CME credits (optional)</p>
          <input type="number" step="0.5" className={inputCls} value={creditHours}
            onChange={(e) => setCreditHours(e.target.value)} placeholder="e.g. 2" />

          <div className="mt-6 flex items-start gap-2 text-xs text-ink-muted bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3">
            <Info size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Submitted content is reviewed before publication. You can track all
              submissions from Profile → My Submissions.
            </span>
          </div>

          {formError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="mt-8 w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#e53e3e' }}
          >
            {submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitMutation.isPending ? 'Submitting…' : 'Submit for review'}
          </button>
        </form>
      </div>
    </div>
  );
}
