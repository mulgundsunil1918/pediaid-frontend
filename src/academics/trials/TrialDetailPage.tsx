// =============================================================================
// academics/trials/TrialDetailPage.tsx — /academics/trials/:specialty/:slug
//
// One trial, read top to bottom: what it asked, what it found, where it is
// weak, what to do differently. Like and Share sit at the end rather than the
// top — they are what you do once you have read it.
// =============================================================================

import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Heart, Loader2, Share2 } from 'lucide-react';
import { useTrial, useToggleTrialLike } from './useTrials';
import { useAuthStore } from '../../store/authStore';

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="mb-6">
      <h2 className="text-sm font-bold text-ink mb-2">{title}</h2>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink leading-relaxed">
            <span className="text-accent mt-1.5 w-1 h-1 rounded-full bg-accent flex-shrink-0" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TrialDetailPage() {
  const { specialty = '', slug = '' } = useParams();
  const { data: t, isLoading, isError, error } = useTrial(slug);
  const like = useToggleTrialLike(slug);
  const isSignedIn = !!useAuthStore((s) => s.accessToken);

  async function share() {
    if (!t) return;
    // Deliberately no URL: Academics is kept off public surfaces, so the text
    // carries what identifies the trial rather than a link to an unlisted site.
    const lines = [
      t.acronym ? `${t.acronym} — ${t.title}` : t.title,
      t.subtitle ?? '',
      '',
      t.journal || t.year ? `${t.journal ?? ''} ${t.year ?? ''}`.trim() : '',
      t.summary ?? '',
      '',
      'via PediAid — Landmark Trials',
    ].filter(Boolean);
    const text = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: t.title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
    } catch {
      /* dismissed, or clipboard denied — nothing useful to say */
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }
  if (isError || !t) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3">
        <p className="text-danger text-sm">{error?.message ?? 'Trial not found.'}</p>
        <Link to="/academics/trials" className="text-sm text-accent hover:underline">
          Back to Landmark Trials
        </Link>
      </div>
    );
  }

  const picot = [
    ['Population', t.picot.population],
    ['Intervention', t.picot.intervention],
    ['Comparator', t.picot.comparator],
    ['Outcome', t.picot.outcome],
    ['Timeframe', t.picot.timeframe],
  ].filter(([, v]) => !!v) as [string, string][];

  return (
    <div className="min-h-screen bg-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="border-b border-border" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link to={`/academics/trials/${specialty}`}
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white mb-4">
            <ArrowLeft size={13} /> Back
          </Link>
          {t.acronym && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-white/15 text-white
                             text-[11px] font-bold mb-2">{t.acronym}</span>
          )}
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white tracking-tight">
            {t.title}
          </h1>
          {t.subtitle && <p className="text-white/75 text-sm mt-1">{t.subtitle}</p>}
          {(t.journal || t.year) && (
            <p className="text-white/55 text-xs mt-2">
              {t.journal} {t.year}
            </p>
          )}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {t.summary && (
          <p className="text-sm text-ink leading-relaxed mb-6">{t.summary}</p>
        )}

        {picot.length > 0 && (
          <section className="mb-6 rounded-card border border-border bg-white p-4">
            <h2 className="text-sm font-bold text-ink mb-3">The question</h2>
            <dl className="space-y-2">
              {picot.map(([k, v]) => (
                <div key={k} className="flex gap-3 text-sm">
                  <dt className="w-24 flex-shrink-0 font-semibold text-ink-muted">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <Section title="What it found" items={t.results} />
        <Section title="Where it is weak" items={t.limitations} />
        <Section title="What to take away" items={t.takeaways} />
        <Section title="Further reading" items={t.furtherReading} />

        {t.externalUrl && (
          <a href={t.externalUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline mb-6">
            Read the paper <ExternalLink size={14} />
          </a>
        )}

        <div className="flex items-center gap-3 pt-5 border-t border-border">
          {/* Signing in is required to like, because a like is per-account —
              that is what stops one person counting twice. Anonymous readers
              still see the count; the button just tells them why it is off. */}
          <button
            onClick={() => isSignedIn && like.mutate(t.id)}
            disabled={!isSignedIn || like.isPending}
            title={isSignedIn ? undefined : 'Sign in to like'}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                        font-semibold border transition-colors disabled:opacity-60 ${
              t.likedByMe
                ? 'bg-danger/10 text-danger border-danger/40'
                : 'bg-white text-ink-muted border-border hover:text-ink'}`}>
            <Heart size={15} className={t.likedByMe ? 'fill-danger' : ''} />
            {t.likeCount > 0 ? t.likeCount : 'Like'}
          </button>

          <button onClick={share}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                       font-semibold bg-white text-ink-muted border border-border hover:text-ink">
            <Share2 size={15} /> Share
          </button>
        </div>
      </main>
    </div>
  );
}
