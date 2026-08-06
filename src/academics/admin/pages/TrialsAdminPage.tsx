// =============================================================================
// academics/admin/pages/TrialsAdminPage.tsx
//
// Upload and manage Landmark Trials.
//
// The form is long because a trial genuinely has many parts, so the work is in
// making that length bearable: only Title, Specialty and System are required —
// everything else can be filled in later by editing. That matters because
// trials arrive from colleagues in whatever shape they arrive, and a form that
// demands the DOI before it will save anything is a form that gets abandoned
// with the summary still in someone's inbox.
//
// Publishing and announcing are deliberately two separate actions. Publish
// makes a trial visible; Announce pushes it to every device and cannot be
// undone. The usual rhythm is to publish several and announce once, so the
// destructive one is never a side effect of the routine one.
// =============================================================================

import { useState } from 'react';
import {
  Loader2, Plus, Trash2, Send, Eye, EyeOff, Pencil, X, Heart,
} from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import {
  useAdminTrials, useTrialSystems, useCreateTrial, useUpdateTrial,
  useDeleteTrial, usePublishTrial, useModerateTrial, type AdminTrial,
} from '../hooks/useAdmin';
import { safeDate } from '../../../lib/safeDate';

const SPECIALTIES = [
  { value: 'paediatrics', label: 'Paediatrics' },
  { value: 'neonatology', label: 'Neonatology' },
] as const;

const input =
  'w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white ' +
  'focus:outline-none focus:border-accent';

/** Multi-line text where each line becomes one array entry. */
function linesToArray(v: string): string[] {
  return v.split('\n').map((s) => s.trim()).filter(Boolean);
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-muted mt-1">{hint}</p>}
    </div>
  );
}

function TrialForm({
  initial, onDone,
}: { initial?: AdminTrial; onDone: () => void }) {
  const { data: systems = [] } = useTrialSystems();
  const create = useCreateTrial();
  const update = useUpdateTrial();
  const [error, setError] = useState('');

  const [f, setF] = useState({
    title: initial?.title ?? '',
    acronym: initial?.acronym ?? '',
    subtitle: initial?.subtitle ?? '',
    specialty: initial?.specialty ?? 'neonatology',
    system: initial?.system ?? 'respiratory',
    journal: initial?.journal ?? '',
    year: initial?.year ? String(initial.year) : '',
    doi: initial?.doi ?? '',
    externalUrl: initial?.externalUrl ?? '',
    population: initial?.picot.population ?? '',
    intervention: initial?.picot.intervention ?? '',
    comparator: initial?.picot.comparator ?? '',
    outcome: initial?.picot.outcome ?? '',
    summary: initial?.summary ?? '',
    results: (initial?.results ?? []).join('\n'),
    limitations: (initial?.limitations ?? []).join('\n'),
    takeaways: (initial?.takeaways ?? []).join('\n'),
    furtherReading: (initial?.furtherReading ?? []).join('\n'),
  });
  const set = (k: keyof typeof f) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setF({ ...f, [k]: e.target.value });

  const busy = create.isPending || update.isPending;

  async function save() {
    setError('');
    if (!f.title.trim()) return setError('Title is required.');
    const body = {
      ...f,
      year: f.year ? Number(f.year) : undefined,
      results: linesToArray(f.results),
      limitations: linesToArray(f.limitations),
      takeaways: linesToArray(f.takeaways),
      furtherReading: linesToArray(f.furtherReading),
    };
    try {
      if (initial) await update.mutateAsync({ id: initial.id, body });
      else await create.mutateAsync(body);
      onDone();
    } catch (e) {
      // Show what the server said — it names the actual problem (a duplicate
      // URL, an unknown system) and the fix is usually one field away.
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  }

  return (
    <div className="bg-white border border-border rounded-card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ink">
          {initial ? 'Edit trial' : 'Add a trial'}
        </h2>
        <button onClick={onDone} className="text-ink-muted hover:text-ink">
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Title *">
          <input className={input} value={f.title} onChange={set('title')}
                 placeholder="The CAP Trial" />
        </Field>
        <Field label="Acronym" hint="Shown on the card and matched first in search.">
          <input className={input} value={f.acronym} onChange={set('acronym')}
                 placeholder="CAP" />
        </Field>
        <Field label="Subtitle">
          <input className={input} value={f.subtitle} onChange={set('subtitle')}
                 placeholder="Caffeine for Apnea of Prematurity" />
        </Field>
        <Field label="Specialty *">
          <select className={input} value={f.specialty} onChange={set('specialty')}>
            {SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="System *" hint="What the reader filters by.">
          <select className={input} value={f.system} onChange={set('system')}>
            {systems.map((s) => (
              <option key={s.slug} value={s.slug}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Journal">
          <input className={input} value={f.journal} onChange={set('journal')}
                 placeholder="NEJM" />
        </Field>
        <Field label="Year">
          <input className={input} value={f.year} onChange={set('year')}
                 placeholder="2006" inputMode="numeric" />
        </Field>
        <Field label="DOI">
          <input className={input} value={f.doi} onChange={set('doi')} />
        </Field>
        <Field label="Link to paper">
          <input className={input} value={f.externalUrl} onChange={set('externalUrl')}
                 placeholder="https://…" />
        </Field>
      </div>

      <p className="text-xs font-semibold text-ink-muted mt-5 mb-2 uppercase tracking-wide">
        PICO
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Population">
          <input className={input} value={f.population} onChange={set('population')}
                 placeholder="Infants 500–1250 g" />
        </Field>
        <Field label="Intervention">
          <input className={input} value={f.intervention} onChange={set('intervention')}
                 placeholder="Caffeine citrate" />
        </Field>
        <Field label="Comparator">
          <input className={input} value={f.comparator} onChange={set('comparator')}
                 placeholder="Placebo" />
        </Field>
        <Field label="Outcome">
          <input className={input} value={f.outcome} onChange={set('outcome')}
                 placeholder="BPD, death or disability" />
        </Field>
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Summary">
          <textarea className={`${input} min-h-[80px]`} value={f.summary}
                    onChange={set('summary')} />
        </Field>
        {/* One line per point: paste from notes and it becomes a list, with no
            bullet syntax to learn or get wrong. */}
        <Field label="Key results" hint="One per line.">
          <textarea className={`${input} min-h-[80px]`} value={f.results}
                    onChange={set('results')}
                    placeholder={'BPD 36.3% vs 46.9%\nDeath or disability 40.2% vs 46.2%'} />
        </Field>
        <Field label="Limitations" hint="One per line.">
          <textarea className={`${input} min-h-[60px]`} value={f.limitations}
                    onChange={set('limitations')} />
        </Field>
        <Field label="Takeaways" hint="One per line.">
          <textarea className={`${input} min-h-[60px]`} value={f.takeaways}
                    onChange={set('takeaways')} />
        </Field>
        <Field label="Further reading" hint="One per line.">
          <textarea className={`${input} min-h-[60px]`} value={f.furtherReading}
                    onChange={set('furtherReading')} />
        </Field>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button type="button" onClick={save} disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm
                     font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#1e3a5f' }}>
          {busy && <Loader2 size={15} className="animate-spin" />}
          {initial ? 'Save changes' : 'Save as draft'}
        </button>
        <p className="text-xs text-ink-muted">
          Saved as a draft — publish it from the list below when it is ready.
        </p>
      </div>
    </div>
  );
}

function TrialRow({ t }: { t: AdminTrial }) {
  const publish = usePublishTrial();
  const del = useDeleteTrial();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmNotify, setConfirmNotify] = useState(false);

  if (editing) return <TrialForm initial={t} onDone={() => setEditing(false)} />;

  return (
    <article className="bg-white border border-border rounded-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              t.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {t.isPublished ? 'LIVE' : 'DRAFT'}
            </span>
            <span className="text-xs text-ink-muted capitalize">{t.specialty}</span>
            <span className="text-xs text-ink-muted">· {t.system}</span>
            {t.likeCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                <Heart size={11} /> {t.likeCount}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-ink">
            {t.acronym ? `${t.acronym} — ` : ''}{t.title}
          </p>
          {t.subtitle && (
            <p className="text-xs text-ink-muted mt-0.5">{t.subtitle}</p>
          )}
          <p className="text-[11px] text-ink-muted mt-1">
            {t.journal ? `${t.journal} ` : ''}{t.year ?? ''} · added {safeDate(t.createdAt)}
          </p>
          {t.referenceCode && (
            <p className="text-[11px] text-ink-muted mt-0.5 font-mono">
              {t.referenceCode}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setEditing(true)} title="Edit"
            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-50">
            <Pencil size={15} />
          </button>
          <button
            onClick={() => publish.mutate({ id: t.id, publish: !t.isPublished })}
            disabled={publish.isPending}
            title={t.isPublished ? 'Unpublish' : 'Publish'}
            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-50">
            {t.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          {confirmDelete ? (
            <>
              <button onClick={() => del.mutate(t.id)} disabled={del.isPending}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-danger">
                Delete?
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="px-2 py-1.5 text-xs text-ink-muted">No</button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete"
              className="p-2 rounded-lg text-ink-muted hover:text-danger hover:bg-red-50">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Announce is separate from publish, and confirmed, because it reaches
          every device at once and cannot be taken back. */}
      {t.isPublished && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
          {confirmNotify ? (
            <>
              <button
                onClick={() => {
                  publish.mutate({ id: t.id, publish: true, notify: true });
                  setConfirmNotify(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           text-xs font-semibold text-white bg-danger">
                <Send size={13} /> Yes, notify everyone
              </button>
              <button onClick={() => setConfirmNotify(false)}
                className="text-xs text-ink-muted">Cancel</button>
            </>
          ) : (
            <button onClick={() => setConfirmNotify(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         text-xs font-semibold text-accent hover:bg-blue-50">
              <Send size={13} /> Announce to all users
            </button>
          )}
          <span className="text-[11px] text-ink-muted">
            Sends a push and an in-app notification. Cannot be undone.
          </span>
        </div>
      )}
    </article>
  );
}

/**
 * A reader submission awaiting a decision.
 *
 * Approve / Reject / Request changes, with the reason box appearing only for
 * the two that need one. Deliberately not the same row as a published trial:
 * the useful actions are different, and showing Publish/Announce next to
 * something nobody has read yet invites announcing an unreviewed submission.
 */
function SubmissionRow({ t }: { t: AdminTrial }) {
  const moderate = useModerateTrial();
  const [mode, setMode] = useState<'reject' | 'request_changes' | null>(null);
  const [reason, setReason] = useState('');

  function send(action: 'approve' | 'reject' | 'request_changes') {
    if (action === 'approve') {
      moderate.mutate({ id: t.id, action });
      return;
    }
    if (!reason.trim()) return;
    moderate.mutate(
      { id: t.id, action, reason: reason.trim() },
      { onSuccess: () => { setMode(null); setReason(''); } },
    );
  }

  return (
    <div className="bg-white border border-warning/40 rounded-card p-4">
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="px-2 py-0.5 rounded-md bg-warning/15 text-warning
                         text-[11px] font-bold">Awaiting review</span>
        <span className="text-[11px] text-ink-muted capitalize">{t.specialty}</span>
        {t.referenceCode && (
          <span className="text-[11px] text-ink-muted font-mono">{t.referenceCode}</span>
        )}
      </div>

      <p className="text-sm font-semibold text-ink">
        {t.acronym ? `${t.acronym} — ` : ''}{t.title}
      </p>
      {t.subtitle && <p className="text-xs text-ink-muted mt-0.5">{t.subtitle}</p>}
      {t.summary && (
        <p className="text-xs text-ink mt-2 leading-relaxed">{t.summary}</p>
      )}

      {(t.originalAuthors || t.reviewAuthor) && (
        <div className="mt-2 text-[11px] text-ink-muted space-y-0.5">
          {t.originalAuthors && <p>Original authors: {t.originalAuthors}</p>}
          {t.reviewAuthor && <p>Review by: {t.reviewAuthor}</p>}
        </div>
      )}

      {mode && (
        <div className="mt-3">
          <label className="block text-xs font-semibold text-ink-muted mb-1">
            {mode === 'reject'
              ? 'Why is this not being accepted?'
              : 'What needs to change?'}
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-border text-sm
                       text-ink bg-white focus:outline-none focus:border-accent"
            rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="This is sent to the submitter." />
        </div>
      )}

      {moderate.error && (
        <p className="text-xs text-danger mt-2">{moderate.error.message}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {mode === null ? (
          <>
            <button onClick={() => send('approve')} disabled={moderate.isPending}
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-success
                         text-white disabled:opacity-60">
              Approve &amp; publish
            </button>
            <button onClick={() => setMode('request_changes')}
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-ink-muted
                         border border-border hover:text-ink">
              Request changes
            </button>
            <button onClick={() => setMode('reject')}
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-danger
                         border border-danger/40 hover:bg-danger/5">
              Reject
            </button>
          </>
        ) : (
          <>
            <button onClick={() => send(mode)}
              disabled={moderate.isPending || !reason.trim()}
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-primary
                         text-white disabled:opacity-60">
              {moderate.isPending ? 'Sending…' : 'Send to submitter'}
            </button>
            <button onClick={() => { setMode(null); setReason(''); }}
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-ink-muted
                         border border-border hover:text-ink">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function TrialsAdminPage() {
  const { data: trials = [], isLoading, isError, error } = useAdminTrials();
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<'all' | 'paediatrics' | 'neonatology'>('all');

  const visible = tab === 'all' ? trials : trials.filter((t) => t.specialty === tab);
  const drafts = visible.filter((t) => !t.isPublished).length;

  // Reader submissions awaiting a decision, pulled to the top and out of the
  // main list. They are the only rows that are time-sensitive — somebody is
  // waiting on an answer — so burying them in a list sorted by created_at is
  // how they get forgotten.
  const pending = visible.filter((t) => t.status === 'pending');
  const reviewed = visible.filter((t) => t.status !== 'pending');

  return (
    <AdminLayout>
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Landmark Trials</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Add trials, publish them, and announce to every user when you are ready.
          </p>
        </div>
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                     font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: '#1e3a5f' }}>
          <Plus size={16} /> Add trial
        </button>
      </div>

      {adding && <TrialForm onDone={() => setAdding(false)} />}

      <div className="flex gap-2 mb-4">
        {(['all', 'paediatrics', 'neonatology'] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border capitalize ${
              tab === k ? 'bg-white text-ink border-accent'
                        : 'bg-transparent text-ink-muted border-border hover:text-ink'
            }`}>
            {k}
          </button>
        ))}
      </div>

      {isError && (
        <div className="mb-4 p-4 bg-danger/10 border border-danger/30 rounded-card text-danger text-sm">
          {error?.message ?? 'Failed to load trials.'}
        </div>
      )}

      {pending.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-ink mb-2">
            Awaiting review
            <span className="ml-2 px-2 py-0.5 rounded-full bg-warning/15 text-warning
                             text-[11px] font-bold">{pending.length}</span>
          </h2>
          <div className="space-y-3">
            {pending.map((t) => <SubmissionRow key={t.id} t={t} />)}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-ink-muted text-sm">
          <Loader2 size={18} className="animate-spin inline mr-2" /> Loading…
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-ink-muted text-sm">
          No trials yet. Add the first one.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            {visible.length} {visible.length === 1 ? 'trial' : 'trials'}
            {drafts > 0 && ` · ${drafts} draft${drafts === 1 ? '' : 's'}`}
          </p>
          {reviewed.map((t) => <TrialRow key={t.id} t={t} />)}
        </div>
      )}
    </AdminLayout>
  );
}
