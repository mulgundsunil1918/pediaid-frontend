// =============================================================================
// academics/trials/TrialDetailPage.tsx — /academics/trials/:specialty/:slug
//
// One trial, read top to bottom: what it asked, what it found, where it is
// weak, what to do differently. Like and Share sit at the end rather than the
// top — they are what you do once you have read it.
// =============================================================================

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ExternalLink, Heart, Loader2, Share2 } from 'lucide-react';
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
  const navigate = useNavigate();
  const { data: t, isLoading, isError, error } = useTrial(slug);
  const like = useToggleTrialLike(slug);
  const isSignedIn = !!useAuthStore((s) => s.accessToken);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Trial pages are deliberately public — no sign-in, no gate — so the link is
  // the point of sharing. Built from the live origin rather than a constant so
  // it stays right on the deployed domain and on a local build.
  const publicUrl = `${window.location.origin}/academics/trials/${specialty}/${slug}`;

  /**
   * Share, with an actual fallback chain.
   *
   * navigator.share only exists on some browsers, only in a secure context,
   * and throws rather than returning false when it is unavailable to this
   * page. The clipboard can be denied outright. The previous version swallowed
   * every one of those in a bare catch, so a failed share looked identical to
   * a successful one: nothing happened either way.
   *
   * A cancelled share is not a failure — the user chose that — so AbortError
   * exits quietly. Everything else falls through to the clipboard, and if that
   * fails too the text is put on screen to copy by hand.
   */
  async function share() {
    if (!t) return;
    setShareError(null);

    const lines = [
      t.acronym ? `${t.acronym} — ${t.title}` : t.title,
      'Trial review by PediAid',
      '',
      t.journal || t.year ? `${t.journal ?? ''} ${t.year ?? ''}`.trim() : '',
      t.summary ?? '',
      '',
      t.referenceCode ? `PediAid ID no. ${t.referenceCode}` : '',
      publicUrl,
    ].filter(Boolean);
    const text = lines.join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: t.title, text, url: publicUrl });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return; // user cancelled
        // Anything else: fall through to the clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError(text);
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
        {/* Attribution before the content, not buried at the bottom. A reader
            deciding how much weight to give the takeaways needs to know whose
            reading they are — the paper's authors or the reviewer's. */}
        {(t.originalAuthors || t.reviewAuthor) && (
          <div className="mb-6 rounded-card border border-border bg-white p-4 space-y-1.5">
            {t.originalAuthors && (
              <p className="text-xs text-ink">
                <span className="font-semibold text-ink-muted">Original authors </span>
                {t.originalAuthors}
              </p>
            )}
            {t.reviewAuthor && (
              <p className="text-xs text-ink">
                <span className="font-semibold text-ink-muted">Review by </span>
                {t.reviewAuthor}
              </p>
            )}
            <p className="text-[11px] text-ink-muted pt-1">
              Summary and takeaways are the reviewer's, not the authors'.
              Always read the source before acting on it.
            </p>
          </div>
        )}

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

        <div className="pt-5 border-t border-border">
          <div className="flex items-center gap-3">
            {/* Liking is per-account — that is what stops one person counting
                twice. Signed out, the button is not dead: it sends them to
                sign in and brings them straight back to this trial. */}
            <button
              onClick={() =>
                isSignedIn
                  ? like.mutate(t.id)
                  : navigate(`/academics/login?next=${encodeURIComponent(
                      `/academics/trials/${specialty}/${slug}`)}`)
              }
              disabled={like.isPending}
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
              {copied ? <Check size={15} className="text-success" /> : <Share2 size={15} />}
              {copied ? 'Link copied' : 'Share'}
            </button>
          </div>

          {/* A failed like used to roll back silently, so a expired session or
              a dropped request looked exactly like a button that does nothing. */}
          {like.isError && (
            <p className="text-xs text-danger mt-2.5">
              Could not save your like: {like.error?.message ?? 'please try again.'}
            </p>
          )}

          {shareError && (
            <div className="mt-2.5">
              <p className="text-xs text-ink-muted mb-1">
                Sharing is not available here — copy this instead:
              </p>
              <textarea readOnly value={shareError} rows={4}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full text-xs p-2 rounded-lg border border-border
                           bg-white text-ink font-mono" />
            </div>
          )}

          {!isSignedIn && (
            <p className="text-xs text-ink-muted mt-2.5">
              <Link
                to={`/academics/login?next=${encodeURIComponent(
                  `/academics/trials/${specialty}/${slug}`)}`}
                className="text-accent font-semibold hover:underline">
                Sign in
              </Link>{' '}
              to like this trial — the same PediAid account you use in the app.
              Sharing needs no account.
            </p>
          )}

          {t.referenceCode && (
            <p className="text-[11px] text-ink-muted mt-3 font-mono">
              PediAid ID no. {t.referenceCode}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
