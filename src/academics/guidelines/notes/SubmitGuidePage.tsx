// =============================================================================
// guidelines/notes/SubmitGuidePage.tsx — /academics/recent/submit
//
// Submit a recent guide. Identical contract to submitting a trial review:
// signed in, lands as pending, invisible until approved, credited to you.
// =============================================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, FileText, Info } from 'lucide-react';
import { useSubmitGuide, type GuideSpecialty } from './useGuidelineNotes';
import { useAuthStore } from '../../../store/authStore';

const input =
  'w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white ' +
  'focus:outline-none focus:border-accent';
const label = 'block text-xs font-semibold text-ink-muted mb-1';

const toLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

export function SubmitGuidePage() {
  const navigate = useNavigate();
  const isSignedIn = !!useAuthStore((s) => s.accessToken);
  const submit = useSubmitGuide();
  const [done, setDone] = useState(false);

  const [f, setF] = useState({
    kind: 'note' as 'note' | 'review',
    specialty: 'neonatology' as GuideSpecialty,
    title: '', subtitle: '', society: '', guidelineYear: '',
    originalAuthors: '', reviewAuthor: '',
    summary: '', whatChanged: '', body: '', takeaways: '',
    otherNotesLabel: '', otherNotes: '', externalUrl: '',
  });
  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-6">
        <FileText size={28} className="text-accent" />
        <p className="text-sm text-ink text-center max-w-sm">
          Submitting a guide needs an account, because it is published with
          your name on it.
        </p>
        <Link
          to={`/academics/login?next=${encodeURIComponent('/academics/recent/submit')}`}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white">
          Sign in to continue
        </Link>
        <Link to="/academics/recent" className="text-sm text-accent hover:underline">
          Back to Recent Guides
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
          <Check size={24} className="text-success" />
        </div>
        <h1 className="font-bold text-xl text-ink">Submitted for review</h1>
        <p className="text-sm text-ink-muted text-center max-w-sm">
          We will let you know once it has been looked at. Your PediAid ID no.
          is issued when it is approved, so numbers only go to published work.
        </p>
        <div className="flex gap-2">
          <Link to="/academics/submissions"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white">
            My Submissions
          </Link>
          <Link to="/academics/recent"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-muted
                       border border-border hover:text-ink">
            Back to guides
          </Link>
        </div>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return;
    submit.mutate(
      {
        kind: f.kind,
        specialty: f.specialty,
        title: f.title.trim(),
        subtitle: f.subtitle.trim(),
        society: f.society.trim(),
        guidelineYear: f.guidelineYear ? Number(f.guidelineYear) : undefined,
        originalAuthors: f.originalAuthors.trim(),
        reviewAuthor: f.reviewAuthor.trim(),
        summary: f.summary.trim(),
        whatChanged: toLines(f.whatChanged),
        body: toLines(f.body),
        takeaways: toLines(f.takeaways),
        otherNotesLabel: f.otherNotesLabel.trim(),
        otherNotes: f.otherNotes.trim(),
        externalUrl: f.externalUrl.trim(),
      },
      { onSuccess: () => setDone(true) },
    );
  }

  return (
    <div className="min-h-screen bg-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="border-b border-border" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <button onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white mb-4">
            <ArrowLeft size={13} /> Back
          </button>
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Submit a recent guide
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Reviewed before it is published. Only the title is required.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={label}>Kind *</label>
            <select className={input} value={f.kind} onChange={set('kind')}>
              <option value="note">Note — what changed, briefly</option>
              <option value="review">Review — a fuller read</option>
            </select>
          </div>
          <div>
            <label className={label}>Specialty *</label>
            <select className={input} value={f.specialty} onChange={set('specialty')}>
              <option value="neonatology">Neonatology</option>
              <option value="paediatrics">Paediatrics</option>
            </select>
          </div>
          <div>
            <label className={label}>Society / body</label>
            <input className={input} value={f.society} onChange={set('society')}
              placeholder="AAP, NNF, WHO, SCCM…" />
          </div>
        </div>

        <div>
          <label className={label}>Title *</label>
          <input className={input} value={f.title} onChange={set('title')}
            placeholder="e.g. NRP 9th edition — what changed" required />
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

        <div className="rounded-card border border-border bg-white p-4 space-y-3">
          <div className="flex items-start gap-2 text-xs text-ink-muted">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <p>
              The guideline's authors and the person writing this summary are
              credited separately, so a reader can tell whose conclusion they
              are reading.
            </p>
          </div>
          <div>
            <label className={label}>
              Original authors <span className="font-normal">(the guideline committee)</span>
            </label>
            <input className={input} value={f.originalAuthors} onChange={set('originalAuthors')}
              placeholder="AAP / AHA Neonatal Resuscitation Program Steering Committee" />
          </div>
          <div>
            <label className={label}>Review author <span className="font-normal">(you)</span></label>
            <input className={input} value={f.reviewAuthor} onChange={set('reviewAuthor')}
              placeholder="Dr A Nair, Dept of Neonatology, …" />
          </div>
        </div>

        <div>
          <label className={label}>Summary</label>
          <textarea className={input} rows={3} value={f.summary} onChange={set('summary')}
            placeholder="A short paragraph — this is what shows in the list." />
        </div>

        <div>
          <label className={label}>What changed</label>
          <textarea className={input} rows={4} value={f.whatChanged} onChange={set('whatChanged')} />
        </div>
        <div>
          <label className={label}>Key points</label>
          <textarea className={input} rows={4} value={f.body} onChange={set('body')} />
        </div>
        <div>
          <label className={label}>What to take away</label>
          <textarea className={input} rows={3} value={f.takeaways} onChange={set('takeaways')} />
        </div>

        <div className="rounded-card border border-border bg-white p-4 space-y-3">
          <p className="text-xs text-ink-muted">
            Your own section — anything the boxes above have no room for.
          </p>
          <div>
            <label className={label}>Section heading</label>
            <input className={input} value={f.otherNotesLabel} onChange={set('otherNotesLabel')}
              placeholder="e.g. How this changed our unit's practice" />
          </div>
          <div>
            <label className={label}>Your notes</label>
            <textarea className={input} rows={4} value={f.otherNotes} onChange={set('otherNotes')} />
          </div>
        </div>

        <div>
          <label className={label}>Link to the guideline</label>
          <input className={input} value={f.externalUrl} onChange={set('externalUrl')}
            placeholder="https://…" />
        </div>

        {submit.error && <p className="text-sm text-danger">{submit.error.message}</p>}

        <p className="text-xs text-ink-muted">
          Submitted guides are checked before publication. You can follow this
          one from Profile → My Submissions.
        </p>

        <div className="flex gap-2 justify-end">
          <Link to="/academics/recent"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-muted
                       border border-border hover:text-ink">
            Cancel
          </Link>
          <button type="submit" disabled={submit.isPending || !f.title.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white
                       disabled:opacity-60">
            {submit.isPending ? 'Submitting…' : 'Submit for review'}
          </button>
        </div>
      </form>
    </div>
  );
}
