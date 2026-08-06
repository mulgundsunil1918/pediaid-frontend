// =============================================================================
// guidelines/notes/GuidelineNotesPage.tsx
//
//   /academics/guideline-notes        — list, filtered by kind
//   /academics/guideline-notes/:slug  — one note or review
//
// Public, no sign-in. The guideline-set registry holds the PDFs; this holds
// what someone wrote *about* them.
// =============================================================================

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Check, ExternalLink, FileText, Heart, Loader2, Search, Share2,
} from 'lucide-react';
import {
  useGuidelineNote, useGuidelineNotes, useToggleNoteLike,
} from './useGuidelineNotes';
import { useAuthStore } from '../../../store/authStore';
import { SaveButton } from '../../bookmarks/SaveButton';

const KINDS = [
  { value: 'all', label: 'All' },
  { value: 'note', label: 'Notes' },
  { value: 'review', label: 'Reviews' },
];

function KindBadge({ kind }: { kind: string }) {
  const isReview = kind === 'review';
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
      isReview ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
      {isReview ? 'Review' : 'Note'}
    </span>
  );
}

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

// ── List ─────────────────────────────────────────────────────────────────────

export function GuidelineNotesPage() {
  const navigate = useNavigate();
  const [kind, setKind] = useState('all');
  const [q, setQ] = useState('');
  const { data: notes = [], isLoading, isError, error } = useGuidelineNotes(kind, q);

  return (
    <div className="min-h-screen bg-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="border-b border-border" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link to="/academics/guidelines"
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white mb-4">
            <ArrowLeft size={13} /> Guidelines
          </Link>
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white"
                 style={{ background: 'linear-gradient(135deg,#0ea5e9 0%,#1e3a5f 100%)' }}>
              <FileText size={20} />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white leading-tight tracking-tight">
                Guideline Notes &amp; Reviews
              </h1>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                What changed, and what it means in practice
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative mb-4 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, society or topic…"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border text-sm
                       text-ink bg-white focus:outline-none focus:border-accent" />
        </div>

        <div className="flex gap-2 flex-wrap mb-5">
          {KINDS.map((k) => (
            <button key={k.value} onClick={() => setKind(k.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border ${
                kind === k.value ? 'bg-primary text-white border-primary'
                                 : 'bg-white text-ink-muted border-border hover:text-ink'}`}>
              {k.label}
            </button>
          ))}
        </div>

        {isError && (
          <div className="mb-4 p-4 bg-danger/10 border border-danger/30 rounded-card text-danger text-sm">
            {error?.message ?? 'Could not load notes.'}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-ink-muted text-sm">
            <Loader2 size={18} className="animate-spin inline mr-2" /> Loading…
          </div>
        ) : notes.length === 0 ? (
          <div className="py-16 text-center text-ink-muted text-sm">
            {q || kind !== 'all'
              ? 'Nothing matches this filter.'
              : 'No notes published yet.'}
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id}
                className="bg-white border border-border rounded-card p-4
                           hover:border-accent transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => navigate(`/academics/guideline-notes/${n.slug}`)}
                    className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <KindBadge kind={n.kind} />
                      {n.society && (
                        <span className="text-[11px] text-ink-muted">{n.society}</span>
                      )}
                      {n.guidelineYear && (
                        <span className="text-[11px] text-ink-muted">· {n.guidelineYear}</span>
                      )}
                    </div>
                    <p className="font-semibold text-ink text-sm">{n.title}</p>
                    {n.subtitle && (
                      <p className="text-xs text-ink-muted mt-0.5">{n.subtitle}</p>
                    )}
                  </button>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {n.likeCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                        <Heart size={12} className={n.likedByMe ? 'fill-danger text-danger' : ''} />
                        {n.likeCount}
                      </span>
                    )}
                    <SaveButton itemType="guide" itemId={n.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Detail ───────────────────────────────────────────────────────────────────

export function GuidelineNoteDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { data: n, isLoading, isError, error } = useGuidelineNote(slug);
  const like = useToggleNoteLike(slug);
  const isSignedIn = !!useAuthStore((s) => s.accessToken);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const publicUrl = `${window.location.origin}/academics/guideline-notes/${slug}`;
  const loginHref = `/academics/login?next=${encodeURIComponent(
    `/academics/guideline-notes/${slug}`)}`;

  async function share() {
    if (!n) return;
    const label = n.kind === 'review' ? 'Guideline review' : 'Guideline note';
    const lines = [
      n.title,
      `${label} by PediAid`,
      '',
      n.society || n.guidelineYear
        ? `${n.society ?? ''} ${n.guidelineYear ?? ''}`.trim()
        : '',
      n.summary ?? '',
      '',
      n.referenceCode ? `PediAid ID no. ${n.referenceCode}` : '',
      publicUrl,
    ].filter(Boolean);
    const text = lines.join('\n');

    // Same fallback chain as trials: navigator.share throws rather than
    // returning false when unavailable, and a bare catch made a failed share
    // indistinguishable from a successful one. A cancelled share is the user's
    // choice, not a failure, so AbortError exits quietly.
    if (navigator.share) {
      try {
        await navigator.share({ title: n.title, text, url: publicUrl });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
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
  if (isError || !n) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3">
        <p className="text-danger text-sm">{error?.message ?? 'Not found.'}</p>
        <Link to="/academics/guideline-notes" className="text-sm text-accent hover:underline">
          Back to Guideline Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="border-b border-border" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link to="/academics/guideline-notes"
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white mb-4">
            <ArrowLeft size={13} /> Back
          </Link>
          <span className="inline-block px-2 py-0.5 rounded-md bg-white/15 text-white
                           text-[11px] font-bold mb-2">
            {n.kind === 'review' ? 'Guideline review' : 'Guideline note'}
          </span>
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white tracking-tight">
            {n.title}
          </h1>
          {n.subtitle && <p className="text-white/75 text-sm mt-1">{n.subtitle}</p>}
          {(n.society || n.guidelineYear) && (
            <p className="text-white/55 text-xs mt-2">
              {n.society} {n.guidelineYear}
            </p>
          )}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {n.summary && (
          <p className="text-sm text-ink leading-relaxed mb-6">{n.summary}</p>
        )}

        <Section title="What changed" items={n.whatChanged} />
        <Section title="Key points" items={n.body} />
        <Section title="What to take away" items={n.takeaways} />

        {n.externalUrl && (
          <a href={n.externalUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline mb-6">
            Read the guideline <ExternalLink size={14} />
          </a>
        )}

        <div className="pt-5 border-t border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (isSignedIn ? like.mutate(n.id) : navigate(loginHref))}
              disabled={like.isPending}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                          font-semibold border transition-colors disabled:opacity-60 ${
                n.likedByMe
                  ? 'bg-danger/10 text-danger border-danger/40'
                  : 'bg-white text-ink-muted border-border hover:text-ink'}`}>
              <Heart size={15} className={n.likedByMe ? 'fill-danger' : ''} />
              {n.likeCount > 0 ? n.likeCount : 'Like'}
            </button>

            <button onClick={share}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                         font-semibold bg-white text-ink-muted border border-border hover:text-ink">
              {copied ? <Check size={15} className="text-success" /> : <Share2 size={15} />}
              {copied ? 'Link copied' : 'Share'}
            </button>

            <SaveButton itemType="guide" itemId={n.id} withLabel />
          </div>

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
              <Link to={loginHref} className="text-accent font-semibold hover:underline">
                Sign in
              </Link>{' '}
              to like this — the same PediAid account you use in the app.
              Sharing needs no account.
            </p>
          )}

          {n.referenceCode && (
            <p className="text-[11px] text-ink-muted mt-3 font-mono">
              PediAid ID no. {n.referenceCode}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
