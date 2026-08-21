// =============================================================================
// academics/trials/TrialsPage.tsx
//
//   /academics/trials                  — two specialty cards
//   /academics/trials/:specialty       — flat list + a system filter
//
// Systems filter the list; they do not nest it. A trial that spans two systems
// should not have to pick a folder, and nobody should click twice to see
// anything. So one list, one filter above it, narrow as needed.
// =============================================================================

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Baby, ChevronDown, FlaskConical, Heart, Loader2, Plus, Search,
  SlidersHorizontal, Stethoscope } from 'lucide-react';
import {
  useTrials, useTrialSystems, type Specialty,
} from './useTrials';
import { SaveButton } from '../bookmarks/SaveButton';

const SPECIALTIES = [
  {
    slug: 'paediatrics' as const,
    label: 'Paediatrics',
    blurb: 'Trials that shaped paediatric practice',
    icon: Stethoscope,
    from: '#1e3a5f',
    to: '#2563eb',
  },
  {
    slug: 'neonatology' as const,
    label: 'Neonatology',
    blurb: 'Trials that shaped newborn care',
    icon: Baby,
    from: '#0f766e',
    to: '#0e7490',
  },
];

// ── Landing: two cards ───────────────────────────────────────────────────────

export function TrialsHomePage() {
  return (
    <div className="min-h-screen bg-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="border-b border-border" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link to="/academics"
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white mb-4">
            <ArrowLeft size={13} /> All modules
          </Link>
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white"
                 style={{ background: 'linear-gradient(135deg,#0ea5e9 0%,#1e3a5f 100%)' }}>
              <FlaskConical size={20} />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white leading-tight tracking-tight">
                Landmark Trials
              </h1>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                The studies that changed how we practise
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SPECIALTIES.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.slug} to={`/academics/trials/${s.slug}`}
                className="group rounded-2xl overflow-hidden border border-border bg-white
                           hover:shadow-lg transition-shadow">
                <div className="h-24 flex items-center px-6"
                     style={{ background: `linear-gradient(135deg, ${s.from} 0%, ${s.to} 100%)` }}>
                  <Icon size={30} className="text-white" />
                </div>
                <div className="p-5">
                  <h2 className="font-bold text-lg text-ink">{s.label}</h2>
                  <p className="text-sm text-ink-muted mt-1">{s.blurb}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Anyone can contribute a review. Placed after the cards rather than
            in the header — reading is the main job here, submitting is the
            occasional one. */}
        <Link to="/academics/trials/submit"
          className="group flex items-center gap-3 mt-5 p-4 rounded-2xl text-white
                     transition hover:brightness-95"
          style={{ backgroundColor: '#e53e3e' }}>
          <div className="shrink-0 w-9 h-9 rounded-xl bg-white/20 flex items-center
                          justify-center text-white">
            <Plus size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm">Submit a trial review</p>
            <p className="text-xs text-white/80 mt-0.5">
              Reviewed before publication, credited to you
            </p>
          </div>
        </Link>
      </main>
    </div>
  );
}

// ── List for one specialty ───────────────────────────────────────────────────

export function TrialsListPage() {
  const { specialty = 'neonatology' } = useParams<{ specialty: string }>();
  const navigate = useNavigate();
  const [system, setSystem] = useState('all');
  const [q, setQ] = useState('');

  const meta = SPECIALTIES.find((s) => s.slug === specialty) ?? SPECIALTIES[1]!;
  const { data: systems = [] } = useTrialSystems();
  const { data: trials = [], isLoading, isError, error } =
    useTrials(specialty as Specialty, system, q);

  // Every system is offered, so the reader sees the full shape of what is
  // planned rather than only what exists today. Systems with nothing published
  // are disabled and labelled "coming soon" — an option that leads to an empty
  // list reads as a bug, a labelled one reads as a plan. Counted from the
  // unfiltered list so the options do not change as you type.
  const { data: all = [] } = useTrials(specialty as Specialty, 'all', '');
  const present = new Set(all.map((t) => t.system));

  return (
    <div className="min-h-screen bg-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="border-b border-border"
           style={{ background: `linear-gradient(135deg, ${meta.from} 0%, ${meta.to} 100%)` }}>
        <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/academics/trials"
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white mb-4">
            <ArrowLeft size={13} /> Landmark Trials
          </Link>
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-white tracking-tight">
            {meta.label}
          </h1>
          <p className="text-white/70 text-xs sm:text-sm mt-0.5">{meta.blurb}</p>
        </div>
      </div>

      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative mb-4 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, acronym or topic…"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border text-sm
                       text-ink bg-white focus:outline-none focus:border-accent" />
        </div>

        {/* A dropdown, not a row of chips.
            Fifteen systems wrapped to five or six lines on a phone and pushed
            the trials themselves off the screen — the reader arrived at a
            filter and had to scroll to find any content. A select collapses
            that to one line and opens the platform's own picker on mobile.
            Systems with nothing published are disabled and labelled, so the
            full shape is still visible without being clickable. */}
        {systems.length > 0 && (
          <div className="mb-5 flex items-center gap-2">
            <label htmlFor="system-filter" className="sr-only">
              Filter by system
            </label>
            <div className="relative w-full max-w-md">
              <SlidersHorizontal
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted
                           pointer-events-none"
              />
              <select
                id="system-filter"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                className="w-full appearance-none pl-10 pr-9 py-2.5 rounded-xl border
                           border-border bg-white text-sm font-medium text-ink
                           focus:outline-none focus:border-accent"
              >
                <option value="all">All systems</option>
                {systems.map((s) => {
                  const ready = present.has(s.slug);
                  return (
                    <option key={s.slug} value={s.slug} disabled={!ready}>
                      {s.label}{ready ? '' : ' — coming soon'}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted
                           pointer-events-none"
              />
            </div>

            {system !== 'all' && (
              <button
                onClick={() => setSystem('all')}
                className="text-xs font-semibold text-accent hover:underline flex-shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {isError && (
          <div className="mb-4 p-4 bg-danger/10 border border-danger/30 rounded-card text-danger text-sm">
            {error?.message ?? 'Could not load trials.'}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-ink-muted text-sm">
            <Loader2 size={18} className="animate-spin inline mr-2" /> Loading…
          </div>
        ) : trials.length === 0 ? (
          <div className="py-16 text-center text-ink-muted text-sm">
            {q || system !== 'all'
              ? 'No trials match this filter.'
              : 'No trials published here yet.'}
          </div>
        ) : (
          /* The card is a div, not a button: the save control is itself a
             button, and nesting one inside another is invalid HTML with
             unpredictable click behaviour. Content and save sit as siblings. */
          <div className="space-y-3">
            {trials.map((t) => (
              <div key={t.id}
                className="bg-white border border-border rounded-card p-4
                           hover:border-accent transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => navigate(`/academics/trials/${specialty}/${t.slug}`)}
                    className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {t.acronym && (
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary
                                         text-[11px] font-bold">{t.acronym}</span>
                      )}
                      <span className="text-[11px] text-ink-muted">
                        {systems.find((s) => s.slug === t.system)?.label ?? t.system}
                      </span>
                      {t.year && <span className="text-[11px] text-ink-muted">· {t.year}</span>}
                    </div>
                    <p className="font-semibold text-ink text-sm">{t.title}</p>
                    {t.subtitle && (
                      <p className="text-xs text-ink-muted mt-0.5">{t.subtitle}</p>
                    )}
                  </button>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {t.likeCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                        <Heart size={12} className={t.likedByMe ? 'fill-danger text-danger' : ''} />
                        {t.likeCount}
                      </span>
                    )}
                    <SaveButton itemType="trial" itemId={t.id} />
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
