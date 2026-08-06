// =============================================================================
// browse/RecentPage.tsx — /academics/recent
//
// Recent Guides. Real guideline updates — NRP, Surviving Sepsis, and whatever
// contributors send in — split by specialty and filtered by kind.
//
// This page used to render three hardcoded example cards (CAP, NeOProM,
// ADEPT) badged "IN DEVELOPMENT", with invented like counts and an invented
// author handle. Those are landmark trials, not guidelines, and they now live
// in the Landmark Trials module with real data behind them. A page of fake
// content carrying fake engagement numbers is worse than an empty one: it
// tells the reader that nothing here is real.
//
// The list is the guideline-notes module — same data, same detail page as
// /academics/guideline-notes, because they were always one feature described
// twice.
// =============================================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Heart, Loader2, Plus, Search } from 'lucide-react';
import {
  useGuidelineNotes, type GuideSpecialty,
} from '../guidelines/notes/useGuidelineNotes';
import { SaveButton } from '../bookmarks/SaveButton';

const SPECIALTIES: { slug: GuideSpecialty; label: string }[] = [
  { slug: 'neonatology', label: 'Neonatology' },
  { slug: 'paediatrics', label: 'Paediatrics' },
];

const KINDS = [
  { value: 'all', label: 'All' },
  { value: 'note', label: 'Notes' },
  { value: 'review', label: 'Reviews' },
];

export function RecentPage() {
  const navigate = useNavigate();
  const [specialty, setSpecialty] = useState<GuideSpecialty>('neonatology');
  const [kind, setKind] = useState('all');
  const [q, setQ] = useState('');

  const { data: notes = [], isLoading, isError, error } =
    useGuidelineNotes(kind, q, specialty);

  return (
    <div
      className="min-h-screen bg-bg"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="border-b border-border" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link
            to="/academics"
            className="inline-flex items-center gap-1.5 text-xs text-white/70
                       hover:text-white mb-4"
          >
            <ArrowLeft size={13} /> All modules
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 w-11 h-11 rounded-2xl flex items-center
                         justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #1e3a5f 100%)' }}
            >
              <Flame size={20} />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl
                             text-white leading-tight tracking-tight">
                Recent Guides
              </h1>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                What changed in a recent guideline, and what it means in practice
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 flex-wrap mb-4">
          {SPECIALTIES.map((s) => (
            <button key={s.slug} onClick={() => setSpecialty(s.slug)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border ${
                specialty === s.slug ? 'bg-primary text-white border-primary'
                                     : 'bg-white text-ink-muted border-border hover:text-ink'}`}>
              {s.label}
            </button>
          ))}
        </div>

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
          <div className="mb-4 p-4 bg-danger/10 border border-danger/30 rounded-card
                          text-danger text-sm">
            {error?.message ?? 'Could not load guides.'}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-ink-muted text-sm">
            <Loader2 size={18} className="animate-spin inline mr-2" /> Loading…
          </div>
        ) : notes.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-ink-muted text-sm">
              {q || kind !== 'all'
                ? 'Nothing matches this filter.'
                : 'No guides published here yet.'}
            </p>
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
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        n.kind === 'review' ? 'bg-accent/10 text-accent'
                                            : 'bg-primary/10 text-primary'}`}>
                        {n.kind === 'review' ? 'Review' : 'Note'}
                      </span>
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
                    {n.reviewAuthor && (
                      <p className="text-[11px] text-ink-muted mt-1">
                        Review by {n.reviewAuthor}
                      </p>
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

        <Link to="/academics/recent/submit"
          className="group flex items-center gap-3 mt-5 p-4 rounded-2xl border
                     border-dashed border-border bg-white hover:border-accent
                     transition-colors">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-accent/10 flex items-center
                          justify-center text-accent">
            <Plus size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink text-sm">Submit a recent guide</p>
            <p className="text-xs text-ink-muted mt-0.5">
              Reviewed before publication, credited to you
            </p>
          </div>
        </Link>
      </main>
    </div>
  );
}
