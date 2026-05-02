// =============================================================================
// academics/guidelines/GuidelineBrowserPage.tsx
// /academics/guidelines/:slug
//
// Loads a guideline-set's stg_index.json, exposes a fast local search ranked
// by title -> keywords -> section, and groups results by clinical section.
// Tap a chapter -> /academics/guidelines/:slug/c/:chapterNo
// =============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { getGuidelineSet } from './registry';
import type { GuidelineChapter, GuidelineIndex } from './types';

// ---------------------------------------------------------------------------
// Search scoring — same shape as the standalone HTML index
// ---------------------------------------------------------------------------

function scoreChapter(c: GuidelineChapter, q: string): number {
  const t = c.title.toLowerCase();
  const s = (c.section || '').toLowerCase();
  const ks = (c.keywords || []).map((k) => k.toLowerCase()).join(' | ');
  let n = 0;
  if (t.includes(q)) n += 10;
  if (ks.includes(q)) n += 5;
  if (s.includes(q)) n += 2;
  if (t.startsWith(q)) n += 5;
  return n;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function GuidelineBrowserPage() {
  const { slug } = useParams<{ slug: string }>();
  const guideline = slug ? getGuidelineSet(slug) : undefined;

  const [data, setData] = useState<GuidelineIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!guideline) return;
    setLoading(true);
    setError(null);
    fetch(guideline.indexUrl)
      .then((r) => {
        if (!r.ok) throw new Error('Index not reachable');
        return r.json();
      })
      .then((json: GuidelineIndex) => {
        setData(json);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError((e as Error).message || 'Failed to load index');
        setLoading(false);
      });
  }, [guideline]);

  const q = query.trim().toLowerCase();

  // Ranked + grouped results
  const grouped = useMemo(() => {
    if (!data) return [] as { section: string; chapters: GuidelineChapter[] }[];
    let chapters = data.chapters;
    if (q) {
      chapters = chapters
        .map((c) => ({ c, n: scoreChapter(c, q) }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n)
        .map((x) => x.c);
    }
    const map = new Map<string, GuidelineChapter[]>();
    for (const c of chapters) {
      const sec = c.section || 'Uncategorised';
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(c);
    }
    // When searching, preserve rank order (no per-section re-sort).
    // Browsing: sort sections alphabetically, chapters by chapter number.
    if (!q) {
      for (const arr of map.values()) {
        arr.sort((a, b) => a.no.localeCompare(b.no));
      }
    }
    const sections = Array.from(map.entries()).map(([section, chapters]) => ({
      section,
      chapters,
    }));
    if (!q) sections.sort((a, b) => a.section.localeCompare(b.section));
    return sections;
  }, [data, q]);

  if (!guideline) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary mb-2">Guideline not found</p>
          <Link
            to="/academics/guidelines"
            className="text-accent text-sm font-semibold hover:underline"
          >
            ← Back to Guidelines
          </Link>
        </div>
      </div>
    );
  }

  const totalShown = grouped.reduce((a, s) => a + s.chapters.length, 0);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-browse mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          to="/academics/guidelines"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted
                     hover:text-primary mb-6"
        >
          <ArrowLeft size={14} /> All guidelines
        </Link>

        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div
            className="shrink-0 w-12 h-12 rounded-xl flex items-center
                       justify-center text-white"
            style={{ backgroundColor: guideline.color }}
          >
            <BookOpen size={22} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary
                           leading-tight tracking-tight">
              {guideline.fullName}
            </h1>
            <p className="text-xs text-ink-muted font-medium mt-1">
              {guideline.publisher}
              {data?.total_chapters != null && (
                <> · {data.total_chapters} chapters</>
              )}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, abbreviation, synonym or section…"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border
                       border-border text-sm text-ink
                       focus:outline-none focus:ring-2 focus:ring-accent/30
                       focus:border-accent"
          />
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-ink-muted">
            <Loader2 size={18} className="animate-spin mr-2" />
            Loading index…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl bg-danger/8 border border-danger/30
                          p-4 text-sm text-danger flex items-start gap-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-0.5">Couldn't load this guideline</p>
              <p className="text-danger/80">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <p className="text-xs text-ink-muted mb-3">
              {q
                ? `${totalShown} result${totalShown === 1 ? '' : 's'}`
                : `${totalShown} chapters across ${grouped.length} sections`}
            </p>

            {totalShown === 0 && q && (
              <div className="rounded-xl bg-card border border-border
                              p-8 text-center text-ink-muted text-sm">
                No chapters match "{query}". Try a synonym or abbreviation.
              </div>
            )}

            {grouped.map((sec) => (
              <div key={sec.section} className="mb-5">
                <h3 className="px-4 py-2 text-[11px] font-bold tracking-wider
                               uppercase text-ink-muted">
                  {sec.section}
                </h3>
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  {sec.chapters.map((c) => (
                    <Link
                      key={c.no}
                      to={`/academics/guidelines/${guideline.slug}/c/${c.no}`}
                      className="flex items-center gap-3 px-4 py-3
                                 border-b border-border last:border-0
                                 hover:bg-bg transition-colors group"
                    >
                      <span
                        className="shrink-0 w-9 h-9 rounded-lg flex items-center
                                   justify-center text-white text-[11px] font-bold"
                        style={{ backgroundColor: guideline.color }}
                      >
                        {c.no}
                      </span>
                      <span className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink leading-snug">
                          {c.title}
                        </p>
                        {c.keywords && c.keywords.length > 0 && q && (
                          <p className="text-[11px] text-ink-muted mt-0.5
                                        leading-snug">
                            {c.keywords.slice(0, 4).join(' · ')}
                          </p>
                        )}
                      </span>
                      <span className="shrink-0 text-[11px] text-ink-muted
                                       hidden sm:block">
                        {c.pages} pp · {(c.size_kb / 1024).toFixed(1)} MB
                      </span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-ink-muted
                                   group-hover:text-primary transition-colors"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
