// =============================================================================
// academics/never-again/SubmitNeverAgainPage.tsx — /academics/never-again/submit
//
// Web port of the Flutter app's "Share a Mistake" bottom sheet
// (_SubmitSheet in never_again_screen.dart) — same fields, same category
// and role lists, same disclaimer text, posting to the same public,
// anonymous POST /api/never-again endpoint.
// =============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Info } from 'lucide-react';
import { AcademicsApiError } from '../api/academics.api';
import { submitNeverAgainPost, type SubmitNeverAgainInput } from './hooks/useNeverAgain';

// Original 9 stay verbatim so existing posts keep their category labels;
// mirrors _kCategories in never_again_screen.dart exactly (minus "All").
const CATEGORIES = [
  'Neonatology',
  'Fluids & Electrolytes',
  'Jaundice',
  'Sepsis & Infection',
  'Medications & Dosing',
  'Procedures',
  'Resuscitation',
  'Nutrition',
  'Cardiology',
  'Respiratory & Asthma',
  'Gastroenterology & Hepatology',
  'Nephrology / RTA',
  'Endocrinology / Diabetes',
  'Haematology / Oncology',
  'Neurology / Seizures',
  'Critical Care / PICU',
  'Emergency / Triage',
  'Burns & Trauma',
  'Toxicology',
  'Envenomation',
  'Allergy / Anaphylaxis',
  'Genetics / Metabolic',
  'Vaccines & Immunisation',
  'Growth & Development',
  'Adolescent / Mental Health',
  'Diagnostics / Imaging',
  'Surgery / Peri-operative',
  'Child Protection / NAI',
  'Communication / Ethics',
  'Education / Teaching',
  'Other',
];

const ROLES = ['Resident', 'Fellow', 'Senior Resident', 'Consultant', 'Nurse', 'Other', 'Prefer not to say'];

const inputCls =
  'w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors';
const labelCls = 'block text-sm font-semibold text-ink mb-1.5';

export function SubmitNeverAgainPage() {
  const [category, setCategory] = useState('');
  const [role, setRole] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [theLesson, setTheLesson] = useState('');
  const [email, setEmail] = useState('');
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    category !== '' &&
    whatHappened.trim() !== '' &&
    whatWentWrong.trim() !== '' &&
    theLesson.trim() !== '' &&
    disclaimerChecked &&
    !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      const input: SubmitNeverAgainInput = {
        whatHappened: whatHappened.trim(),
        whatWentWrong: whatWentWrong.trim(),
        theLesson: theLesson.trim(),
        category,
        role: role || undefined,
        email: email.trim() || undefined,
      };
      await submitNeverAgainPost(input);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof AcademicsApiError && err.statusCode === 429) {
        setFormError("You've reached today's posting limit. Please try again tomorrow.");
      } else {
        setFormError(err instanceof Error ? err.message : 'Could not submit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-card border border-border rounded-2xl shadow-card p-10">
          <CheckCircle2 size={56} className="mx-auto text-success mb-4" />
          <h1 className="text-xl font-bold text-ink mb-2">Thank you for sharing</h1>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            Your post is awaiting admin review before it goes live. Since posts are anonymous,
            you can track its status from My Submissions.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/academics/submissions"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              Track my submissions
            </Link>
            <Link
              to="/academics/never-again"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-ink-muted hover:text-ink"
            >
              Back to Never Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-primary">Share a Mistake</h1>
        <p className="text-sm text-ink-muted mt-1 mb-6 italic">
          Your post is fully anonymous. No identifying information is stored. Help
          colleagues learn from what you experienced.
        </p>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl shadow-card p-6 sm:p-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category *</label>
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="" disabled>Choose a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Role (optional)</label>
              <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Prefer not to say</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>What happened? *</label>
            <textarea
              className={inputCls}
              rows={4}
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              placeholder="Briefly describe the clinical scenario…"
            />
          </div>

          <div>
            <label className={labelCls}>What went wrong? *</label>
            <textarea
              className={inputCls}
              rows={4}
              value={whatWentWrong}
              onChange={(e) => setWhatWentWrong(e.target.value)}
              placeholder="What was the root cause or missed step?"
            />
          </div>

          <div>
            <label className={labelCls}>The lesson *</label>
            <textarea
              className={inputCls}
              rows={3}
              value={theLesson}
              onChange={(e) => setTheLesson(e.target.value)}
              placeholder="What would you do differently? What should others know?"
            />
          </div>

          <div>
            <label className={labelCls}>Your email (optional)</label>
            <input
              className={inputCls}
              type="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Only if you want us to reach you about this post"
            />
            <p className="text-xs text-ink-muted mt-1">
              Never shown publicly or to other users — only visible to admins, and only if
              a revision is needed before publishing.
            </p>
          </div>

          <label className="flex items-start gap-2.5 select-none cursor-pointer rounded-xl border border-amber-200 bg-amber-50 p-3">
            <input
              type="checkbox"
              checked={disclaimerChecked}
              onChange={(e) => setDisclaimerChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent/30 cursor-pointer"
            />
            <span className="text-sm text-ink">
              I confirm this post contains no patient identifiers, no staff names, and no
              hospital names.
            </span>
          </label>

          <div className="flex items-start gap-2 text-xs text-ink-muted bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3">
            <Info size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Submitted content is reviewed before publication. You can track all
              submissions from Profile → My Submissions.
            </span>
          </div>

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#e53e3e' }}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {isSubmitting ? 'Submitting…' : 'Submit anonymously'}
          </button>
        </form>
      </div>
    </div>
  );
}
