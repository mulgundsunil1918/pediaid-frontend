// =============================================================================
// admin/pages/GuidelineNotesAdminPage.tsx — /academics/admin/guideline-notes
//
// Post a note or a review about a published guideline. Same two-step rhythm as
// the trials dashboard: Publish makes it visible, Announce pushes it to every
// device — and Announce asks first, because it cannot be undone.
//
// Only Title and Kind are required. A half-written note is more useful stored
// than refused, and the reader-facing page hides every empty section anyway.
// =============================================================================

import { useState } from 'react';
import {
  Bell, Eye, EyeOff, FileText, Loader2, Pencil, Plus, Trash2, X,
} from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import {
  useAdminGuidelineNotes, useCreateGuidelineNote, useDeleteGuidelineNote,
  usePublishGuidelineNote, useUpdateGuidelineNote,
  type AdminGuidelineNote,
} from '../hooks/useAdmin';

const input =
  'w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white ' +
  'focus:outline-none focus:border-accent';
const label = 'block text-xs font-semibold text-ink-muted mb-1';

/** One per line in the textarea; blanks dropped. */
const toLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function safeDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

function NoteForm({
  initial, onClose,
}: { initial?: AdminGuidelineNote; onClose: () => void }) {
  const create = useCreateGuidelineNote();
  const update = useUpdateGuidelineNote();
  const [f, setF] = useState({
    kind: initial?.kind ?? 'note',
    title: initial?.title ?? '',
    subtitle: initial?.subtitle ?? '',
    society: initial?.society ?? '',
    guidelineYear: initial?.guidelineYear?.toString() ?? '',
    summary: initial?.summary ?? '',
    whatChanged: (initial?.whatChanged ?? []).join('\n'),
    body: (initial?.body ?? []).join('\n'),
    takeaways: (initial?.takeaways ?? []).join('\n'),
    externalUrl: initial?.externalUrl ?? '',
  });
  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));

  const pending = create.isPending || update.isPending;
  const err = create.error ?? update.error;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return;
    const payload = {
      kind: f.kind,
      title: f.title.trim(),
      subtitle: f.subtitle.trim(),
      society: f.society.trim(),
      guidelineYear: f.guidelineYear ? Number(f.guidelineYear) : undefined,
      summary: f.summary.trim(),
      whatChanged: toLines(f.whatChanged),
      body: toLines(f.body),
      takeaways: toLines(f.takeaways),
      externalUrl: f.externalUrl.trim(),
    };
    const done = { onSuccess: onClose };
    if (initial) update.mutate({ id: initial.id, body: payload }, done);
    else create.mutate(payload, done);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center
                    overflow-y-auto p-4">
      <form onSubmit={submit}
        className="bg-white rounded-card w-full max-w-2xl my-8 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">
            {initial ? 'Edit' : 'New note or review'}
          </h2>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:bg-gray-50">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={label}>Kind *</label>
            <select className={input} value={f.kind} onChange={set('kind')}>
              <option value="note">Note — what changed, briefly</option>
              <option value="review">Review — a fuller read</option>
            </select>
          </div>
          <div>
            <label className={label}>Society / body</label>
            <input className={input} value={f.society} onChange={set('society')}
              placeholder="IAP, NNF, WHO…" />
          </div>
        </div>

        <div>
          <label className={label}>Title *</label>
          <input className={input} value={f.title} onChange={set('title')}
            placeholder="e.g. Neonatal hypoglycaemia — 2026 update" required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className={label}>Subtitle</label>
            <input className={input} value={f.subtitle} onChange={set('subtitle')} />
          </div>
          <div>
            <label className={label}>Guideline year</label>
            <input className={input} type="number" value={f.guidelineYear}
              onChange={set('guidelineYear')} placeholder="2026" />
          </div>
        </div>

        <div>
          <label className={label}>Summary</label>
          <textarea className={input} rows={3} value={f.summary} onChange={set('summary')}
            placeholder="A short paragraph — this is what shows in the list." />
        </div>

        <div>
          <label className={label}>What changed <span className="font-normal">(one per line)</span></label>
          <textarea className={input} rows={4} value={f.whatChanged} onChange={set('whatChanged')} />
        </div>
        <div>
          <label className={label}>Key points <span className="font-normal">(one per line)</span></label>
          <textarea className={input} rows={4} value={f.body} onChange={set('body')} />
        </div>
        <div>
          <label className={label}>What to take away <span className="font-normal">(one per line)</span></label>
          <textarea className={input} rows={3} value={f.takeaways} onChange={set('takeaways')} />
        </div>

        <div>
          <label className={label}>Link to the guideline</label>
          <input className={input} value={f.externalUrl} onChange={set('externalUrl')}
            placeholder="https://…" />
        </div>

        {err && (
          <p className="text-sm text-danger">{err.message}</p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-muted
                       border border-border hover:text-ink">
            Cancel
          </button>
          <button type="submit" disabled={pending || !f.title.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white
                       disabled:opacity-60">
            {pending ? 'Saving…' : initial ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

function NoteRow({ n }: { n: AdminGuidelineNote }) {
  const publish = usePublishGuidelineNote();
  const del = useDeleteGuidelineNote();
  const [editing, setEditing] = useState(false);

  function announce() {
    // Confirm first: this reaches every device and cannot be recalled.
    const ok = window.confirm(
      `Send a notification about "${n.title}" to every PediAid user?\n\n` +
        'This cannot be undone.',
    );
    if (ok) publish.mutate({ id: n.id, publish: true, notify: true });
  }

  return (
    <>
      {editing && <NoteForm initial={n} onClose={() => setEditing(false)} />}
      <div className="bg-white border border-border rounded-card p-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
              n.kind === 'review' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
              {n.kind === 'review' ? 'Review' : 'Note'}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
              n.isPublished ? 'bg-success/10 text-success' : 'bg-gray-100 text-ink-muted'}`}>
              {n.isPublished ? 'Published' : 'Draft'}
            </span>
            {n.likeCount > 0 && (
              <span className="text-xs text-ink-muted">♥ {n.likeCount}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-ink">{n.title}</p>
          {n.subtitle && <p className="text-xs text-ink-muted mt-0.5">{n.subtitle}</p>}
          <p className="text-[11px] text-ink-muted mt-1">
            {n.society ? `${n.society} ` : ''}{n.guidelineYear ?? ''} · added {safeDate(n.createdAt)}
          </p>
          {n.referenceCode && (
            <p className="text-[11px] text-ink-muted mt-0.5 font-mono">{n.referenceCode}</p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setEditing(true)} title="Edit"
            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-50">
            <Pencil size={15} />
          </button>
          <button
            onClick={() => publish.mutate({ id: n.id, publish: !n.isPublished })}
            disabled={publish.isPending}
            title={n.isPublished ? 'Unpublish' : 'Publish'}
            className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-50">
            {n.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button onClick={announce} disabled={!n.isPublished || publish.isPending}
            title={n.isPublished ? 'Announce to everyone' : 'Publish first'}
            className="p-2 rounded-lg text-ink-muted hover:text-accent hover:bg-gray-50
                       disabled:opacity-40 disabled:hover:text-ink-muted">
            <Bell size={15} />
          </button>
          <button
            onClick={() =>
              window.confirm(`Delete "${n.title}"? This cannot be undone.`) &&
              del.mutate(n.id)
            }
            disabled={del.isPending} title="Delete"
            className="p-2 rounded-lg text-ink-muted hover:text-danger hover:bg-gray-50">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

export function GuidelineNotesAdminPage() {
  const { data: notes = [], isLoading, isError, error } = useAdminGuidelineNotes();
  const [creating, setCreating] = useState(false);

  return (
    <AdminLayout>
    <div className="p-6 max-w-4xl">
      {creating && <NoteForm onClose={() => setCreating(false)} />}

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="font-bold text-xl text-ink flex items-center gap-2">
            <FileText size={20} /> Guideline Notes &amp; Reviews
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Publish makes it visible. Announce pushes it to every device —
            that one cannot be undone.
          </p>
        </div>
        <button onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm
                     font-semibold bg-primary text-white flex-shrink-0">
          <Plus size={15} /> Add
        </button>
      </div>

      {isError && (
        <div className="mb-4 p-4 bg-danger/10 border border-danger/30 rounded-card
                        text-danger text-sm">
          {error?.message ?? 'Could not load notes.'}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-ink-muted text-sm">
          <Loader2 size={18} className="animate-spin inline mr-2" /> Loading…
        </div>
      ) : notes.length === 0 ? (
        <div className="py-16 text-center text-ink-muted text-sm">
          Nothing here yet. Add your first note or review.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => <NoteRow key={n.id} n={n} />)}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
