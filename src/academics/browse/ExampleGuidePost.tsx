// =============================================================================
// browse/ExampleGuidePost.tsx — /academics/example/:slug
// Illustrative example of a published guide, styled as a social post (like,
// comment, share) to preview the upcoming Academics feed. Not backed by real
// data — author, likes, and comments below are all fake/illustrative.
// =============================================================================

import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Construction,
} from 'lucide-react';
import { getExampleTrial, type ExampleComment, type ExampleTrial } from './exampleTrials';

function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold font-sans shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.34, backgroundColor: color }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2">
      <p className="text-white font-bold text-sm">{value}</p>
      <p className="text-white/65 text-[10px]">{label}</p>
    </div>
  );
}

function CaptionSection({
  title,
  children,
  last = false,
}: {
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? 'mb-0' : 'mb-3'}>
      <p className="font-bold font-sans mb-1">{title}</p>
      {children}
    </div>
  );
}

export function ExampleGuidePost() {
  const { slug } = useParams<{ slug: string }>();
  const trial = getExampleTrial(slug);

  if (!trial) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="max-w-reading mx-auto px-4 sm:px-6 py-8">
          <Link
            to="/academics/recent"
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft size={13} /> Recent Guides
          </Link>
          <p className="text-sm text-ink-muted">Example guide not found.</p>
        </div>
      </div>
    );
  }

  // Keyed by slug so switching between example posts resets local UI state.
  return <ExampleGuidePostView key={trial.slug} trial={trial} />;
}

function ExampleGuidePostView({ trial }: { trial: ExampleTrial }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(trial.likeCount);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<ExampleComment[]>(trial.comments);
  const [draft, setDraft] = useState('');

  function toggleLike() {
    setLiked((prev) => {
      setLikeCount((c) => c + (prev ? -1 : 1));
      return !prev;
    });
  }

  function postComment() {
    const text = draft.trim();
    if (!text) return;
    setComments((prev) => [
      ...prev,
      { id: `you-${Date.now()}`, name: 'You', initials: 'Y', color: '#1e3a5f', text, time: 'now', likes: 0 },
    ]);
    setDraft('');
  }

  function bumpCommentLike(id: string) {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c)));
  }

  async function share() {
    const shareData = {
      title: `${trial.title}: ${trial.subtitle}`,
      text: `A PediAid Academics example breakdown of ${trial.title}.`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled the native share sheet
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      window.alert('Link copied to clipboard');
    }
  }

  const [gradFrom, gradMid, gradTo] = trial.gradient;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-reading mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/academics/recent"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={13} /> Recent Guides
        </Link>

        {/* In-development banner */}
        <div className="flex items-start gap-3 rounded-card border border-warning/40 bg-warning/10 px-4 py-3 mb-6">
          <Construction size={18} className="text-warning shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs sm:text-sm text-warning font-medium leading-relaxed">
            Example preview — the PediAid Academics social feed is in development. The post, author,
            and comments below are illustrative, not real.
          </p>
        </div>

        <article className="acad-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
              style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #7c3aed 100%)' }}
              aria-hidden="true"
            >
              XYZ
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">{trial.authorHandle}</p>
              <p className="text-xs text-ink-muted">{trial.authorSubtitle}</p>
            </div>
            <MoreHorizontal size={18} className="text-ink-muted" aria-hidden="true" />
          </div>

          {/* Hero infographic */}
          <div
            className="aspect-square w-full flex flex-col justify-center px-6 sm:px-10"
            style={{ background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradMid} 55%, ${gradTo} 100%)` }}
          >
            <span className="self-start acad-badge text-white bg-white/15 mb-4">{trial.badge}</span>
            <h1 className="font-sans font-extrabold text-white text-3xl sm:text-4xl leading-tight">
              {trial.title}
            </h1>
            <p className="text-white/85 text-base sm:text-lg font-semibold mb-5">{trial.subtitle}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {trial.stats.map((s) => (
                <StatChip key={s.label} value={s.value} label={s.label} />
              ))}
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-1 px-3 pt-3">
            <button
              type="button"
              onClick={toggleLike}
              className="p-2 rounded-full hover:bg-gray-50 transition-colors"
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <Heart size={22} className={liked ? 'fill-danger text-danger' : 'text-ink'} />
            </button>
            <a
              href="#comments"
              className="p-2 rounded-full hover:bg-gray-50 transition-colors"
              aria-label="Jump to comments"
            >
              <MessageCircle size={22} className="text-ink" />
            </a>
            <button
              type="button"
              onClick={share}
              className="p-2 rounded-full hover:bg-gray-50 transition-colors"
              aria-label="Share"
            >
              <Share2 size={20} className="text-ink" />
            </button>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => setSaved((v) => !v)}
              className="p-2 rounded-full hover:bg-gray-50 transition-colors"
              aria-label={saved ? 'Remove from saved' : 'Save'}
            >
              <Bookmark size={20} className={saved ? 'fill-ink text-ink' : 'text-ink'} />
            </button>
          </div>

          <p className="px-4 text-sm font-bold text-ink">{likeCount.toLocaleString()} likes</p>

          {/* Caption */}
          <div className="px-4 pt-2 text-sm text-ink leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            <p className="mb-3">
              <span className="font-bold font-sans">{trial.authorHandle} </span>
              {trial.intro}
            </p>

            <CaptionSection title="📋 PICOT">
              {trial.picot.map((line) => (
                <p key={line.label}>
                  <strong>{line.label}</strong> — {line.text}
                </p>
              ))}
            </CaptionSection>

            <CaptionSection title="📊 Results">
              <ul className="list-disc pl-5 space-y-1">
                {trial.results.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </CaptionSection>

            <CaptionSection title="⚠️ Limitations">
              <ul className="list-disc pl-5 space-y-1">
                {trial.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </CaptionSection>

            <CaptionSection title="✅ Take-home Messages">
              <ul className="list-disc pl-5 space-y-1">
                {trial.takeaways.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </CaptionSection>

            <CaptionSection title="🔬 Further Studies" last>
              <ul className="list-disc pl-5 space-y-1">
                {trial.furtherStudies.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </CaptionSection>

            <p className="text-accent font-semibold mt-3">{trial.hashtags}</p>
          </div>

          <p className="px-4 pt-3 text-[10px] uppercase tracking-wide text-ink-muted/70">
            {trial.postedAgo.toUpperCase()}
          </p>

          <hr className="border-border mt-4" />

          {/* Comments */}
          <div id="comments" className="px-4 py-4">
            <p className="text-xs font-bold text-ink-muted mb-3">Comments ({comments.length})</p>
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar initials={c.initials} color={c.color} size={30} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink leading-snug">
                      <span className="font-bold">{c.name} </span>
                      {c.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted/80 font-medium">
                      <span>{c.time}</span>
                      <span>{c.likes} likes</span>
                      <button type="button" className="font-bold hover:text-ink transition-colors">
                        Reply
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => bumpCommentLike(c.id)}
                    aria-label="Like comment"
                    className="text-ink-muted/50 hover:text-danger shrink-0 mt-1 transition-colors"
                  >
                    <Heart size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-border" />

          {/* Add comment */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar initials="Y" color="#1e3a5f" size={30} />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') postComment();
              }}
              placeholder="Add a comment…"
              className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
            />
            <button
              type="button"
              onClick={postComment}
              disabled={!draft.trim()}
              className="text-sm font-bold text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              Post
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
