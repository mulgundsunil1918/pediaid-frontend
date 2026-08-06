// =============================================================================
// academics/trials/SubmitTrialPage.tsx — /academics/trials/submit
//
// Anyone signed in can submit a trial review. It lands as pending and is
// invisible until an admin approves it — same rhythm as posting a CME event.
//
// Sign-in is required, unlike Never Again: a trial review carries a byline,
// so it cannot be anonymous. Someone arriving signed out is sent to log in
// and returned here rather than being shown a form they cannot submit.
//
// Only Title, Specialty and System are required. Everything else is optional
// because a half-complete review is worth reviewing — the admin can fill gaps
// before publishing, and the reader-facing page hides every empty section.
// =============================================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, FlaskConical, Info } from 'lucide-react';
import { useSubmitTrial, useTrialSystems, type Specialty } from './useTrials';
import { useAuthStore } from '../../store/authStore';

const input =
  'w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white ' +
  'focus:outline-none focus:border-accent';
const label = 'block text-xs font-semibold text-ink-muted mb-1';

const toLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

export function SubmitTrialPage() {
  const navigate = useNavigate();
  const isSignedIn = !!useAuthStore((s) => s.accessToken);
  const { data: systems = [] } = useTrialSystems();
  const submit = useSubmitTrial();
  const [done, setDone] = useState<{ code: string | null } | null>(null);

  const [f, setF] = useState({
    title: '', acronym: '', subtitle: '',
    specialty: 'neonatology' as Specialty, system: '',
    journal: '', year: '', doi: '', externalUrl: '',
    originalAuthors: '', reviewAuthor: '',
    population: '', intervention: '', comparator: '', outcome: '', timeframe: '',
    summary: '', results: '', limitations: '', takeaways: '', furtherReading: '',
  });
  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-6">
        <FlaskConical size={28} className="text-accent" />
        <p className="text-sm text-ink text-center max-w-sm">
          Submitting a trial review needs an account, because the review is
          published with your name on it.
        </p>
        <Link
          to={`/academics/login?next=${encodeURIComponent('/academics/trials/submit')}`}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white">
          Sign in to continue
        </Link>
        <Link to="/academics/trials" className="text-sm text-accent hover:underline">
          Back to Landmark Trials
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
          We will let you know once it has been looked at. You can follow it in
          My Submissions.
        </p>
        {done.code && (
          <p className="text-sm text-ink font-mono">PediAid ID no. {done.code}</p>
        )}
        <div className="flex gap-2">
          <Link to="/academics/submissions"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white">
            My Submissions
          </Link>
          <Link to="/academics/trials"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-muted
                       border border-border hover:text-ink">
            Back to trials
          </Link>
        </div>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim() || !f.system) return;
    submit.mutate(
      {
        title: f.title.trim(),
        specialty: f.specialty,
        system: f.system,
        subtitle: f.subtitle.trim(),
        acronym: f.acronym.trim(),
        journal: f.journal.trim(),
        year: f.year ? Number(f.year) : undefined,
        doi: f.doi.trim(),
        externalUrl: f.externalUrl.trim(),
        originalAuthors: f.originalAuthors.trim(),
        reviewAuthor: f.reviewAuthor.trim(),
        population: f.population.trim(),
        intervention: f.intervention.trim(),
        comparator: f.comparator.trim(),
        outcome: f.outcome.trim(),
        timeframe: f.timeframe.trim(),
        summary: f.summary.trim(),
        results: toLines(f.results),
        limitations: toLines(f.limitations),
        takeaways: toLines(f.takeaways),
        furtherReading: toLines(f.furtherReading),
      },
      { onSuccess: (t) => setDone({ code: t.referenceCode }) },
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
            Submit a trial review
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Reviewed before it is published. Only the first three fields are required.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className={label}>Title *</label>
            <input className={input} value={f.title} onChange={set('title')}
              placeholder="e.g. Caffeine for Apnea of Prematurity" required />
          </div>
          <div>
            <label className={label}>Acronym</label>
            <input className={input} value={f.acronym} onChange={set('acronym')}
              placeholder="CAP" />
          </div>
        </div>

        <div>
          <label className={label}>Subtitle</label>
          <input className={input} value={f.subtitle} onChange={set('subtitle')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={label}>Specialty *</label>
            <select className={input} value={f.specialty} onChange={set('specialty')}>
              <option value="neonatology">Neonatology</option>
              <option value="paediatrics">Paediatrics</option>
            </select>
          </div>
          <div>
            <label className={label}>System *</label>
            <select className={input} value={f.system} onChange={set('system')} required>
              <option value="">Choose…</option>
              {systems.map((s) => (
                <option key={s.slug} value={s.slug}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Attribution. Two different people, kept apart on purpose — see the
            note shown to the submitter below. */}
        <div className="rounded-card border border-border bg-white p-4 space-y-3">
          <div className="flex items-start gap-2 text-xs text-ink-muted">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <p>
              The paper's authors and the person writing this summary are
              credited separately, so a reader can tell whose conclusion they
              are reading.
            </p>
          </div>
          <div>
            <label className={label}>Original authors <span className="font-normal">(of the paper)</span></label>
            <input className={input} value={f.originalAuthors} onChange={set('originalAuthors')}
              placeholder="Schmidt B, Roberts RS, Davis P, et al." />
          </div>
          <div>
            <label className={label}>Review author <span className="font-normal">(you)</span></label>
            <input className={input} value={f.reviewAuthor} onChange={set('reviewAuthor')}
              placeholder="Dr A Nair, Dept of Neonatology, …" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={label}>Journal</label>
            <input className={input} value={f.journal} onChange={set('journal')} placeholder="NEJM" />
          </div>
          <div>
            <label className={label}>Year</label>
            <input className={input} type="number" value={f.year} onChange={set('year')} placeholder="2006" />
          </div>
          <div>
            <label className={label}>DOI</label>
            <input className={input} value={f.doi} onChange={set('doi')} />
          </div>
        </div>

        <div>
          <label className={label}>Link to paper</label>
          <input className={input} value={f.externalUrl} onChange={set('externalUrl')}
            placeholder="https://…" />
        </div>

        <div className="rounded-card border border-border bg-white p-4 space-y-3">
          <h2 className="text-sm font-bold text-ink">The question (PICO)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Population</label>
              <input className={input} value={f.population} onChange={set('population')}
                placeholder="Infants 500–1250 g" />
            </div>
            <div>
              <label className={label}>Intervention</label>
              <input className={input} value={f.intervention} onChange={set('intervention')}
                placeholder="Caffeine citrate" />
            </div>
            <div>
              <label className={label}>Comparator</label>
              <input className={input} value={f.comparator} onChange={set('comparator')}
                placeholder="Placebo" />
            </div>
            <div>
              <label className={label}>Outcome</label>
              <input className={input} value={f.outcome} onChange={set('outcome')}
                placeholder="BPD, death or disability" />
            </div>
          </div>
          <div>
            <label className={label}>Timeframe</label>
            <input className={input} value={f.timeframe} onChange={set('timeframe')} />
          </div>
        </div>

        <div>
          <label className={label}>Summary</label>
          <textarea className={input} rows={3} value={f.summary} onChange={set('summary')}
            placeholder="A short paragraph — this is what shows in the list." />
        </div>

        <div>
          <label className={label}>What it found <span className="font-normal">(one per line)</span></label>
          <textarea className={input} rows={4} value={f.results} onChange={set('results')} />
        </div>
        <div>
          <label className={label}>Where it is weak <span className="font-normal">(one per line)</span></label>
          <textarea className={input} rows={3} value={f.limitations} onChange={set('limitations')} />
        </div>
        <div>
          <label className={label}>What to take away <span className="font-normal">(one per line)</span></label>
          <textarea className={input} rows={3} value={f.takeaways} onChange={set('takeaways')} />
        </div>
        <div>
          <label className={label}>Further reading <span className="font-normal">(one per line)</span></label>
          <textarea className={input} rows={2} value={f.furtherReading} onChange={set('furtherReading')} />
        </div>

        {submit.error && (
          <p className="text-sm text-danger">{submit.error.message}</p>
        )}

        <p className="text-xs text-ink-muted">
          Submitted reviews are checked before publication. You can follow this
          one from Profile → My Submissions.
        </p>

        <div className="flex gap-2 justify-end">
          <Link to="/academics/trials"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-muted
                       border border-border hover:text-ink">
            Cancel
          </Link>
          <button type="submit" disabled={submit.isPending || !f.title.trim() || !f.system}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white
                       disabled:opacity-60">
            {submit.isPending ? 'Submitting…' : 'Submit for review'}
          </button>
        </div>
      </form>
    </div>
  );
}
