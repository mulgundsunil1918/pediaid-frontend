// =============================================================================
// academics/search/guidelineSearch.ts
//
// Searches the guideline sets — IAP Action Plan, IAP STG, NNF CPG.
//
// The academics search box promised "chapters, topics, or authors" and queried
// acad_chapters in Postgres. Guidelines do not live there: they are static
// JSON indexes fetched by the browser. So the one body of content people
// actually came to search was the one thing the search could never find, and
// with no chapters authored yet the box returned nothing at all, for anything.
//
// Done client-side deliberately. The indexes are already downloaded to render
// the guideline pages, they total a couple of hundred kilobytes, and they
// change only when a guideline is republished. Ingesting them into Postgres
// would duplicate content that is already served as files, and buy nothing
// until someone needs full-text search INSIDE the linked PDFs — which this
// cannot do, and which is a much larger job.
//
// Results link to the existing per-chapter route, so nothing new has to be
// built to display them.
// =============================================================================

import { GUIDELINE_SETS } from '../guidelines/registry';

export interface GuidelineHit {
  /** Stable key for React lists. */
  id: string;
  title: string;
  /** e.g. "Neonatology" — the guideline's own grouping. */
  section: string | null;
  /** Which set it came from, for the badge. */
  setSlug: string;
  setLabel: string;
  /** Route to the chapter page. */
  href: string;
  /** Higher is better; see scoreOf. */
  score: number;
}

interface RawChapter {
  no?: string;
  title?: string;
  section?: string | null;
  slug?: string;
}

interface RawIndex {
  chapters?: RawChapter[];
}

// Fetched once per session. These files are static and identical for everyone,
// so re-fetching them per keystroke would be pure waste.
let cache: Promise<GuidelineHit[]> | null = null;

async function loadOne(set: (typeof GUIDELINE_SETS)[number]): Promise<GuidelineHit[]> {
  try {
    const res = await fetch(set.indexUrl);
    if (!res.ok) return [];
    const body = (await res.json()) as RawIndex;
    return (body.chapters ?? [])
      .filter((c) => c.title && c.no)
      .map((c) => ({
        id: `${set.slug}:${c.no}`,
        title: c.title!,
        section: c.section ?? null,
        setSlug: set.slug,
        setLabel: set.name,
        href: `/academics/guidelines/${set.slug}/c/${c.no}`,
        score: 0,
      }));
  } catch {
    // One unreachable set must not take out the whole search — the STG index
    // is hosted on a different origin and can fail independently.
    return [];
  }
}

/** Every chapter across every live guideline set, loaded once. */
export function loadGuidelineIndex(): Promise<GuidelineHit[]> {
  if (!cache) {
    cache = Promise.all(
      GUIDELINE_SETS.filter((s) => s.status === 'live').map(loadOne),
    ).then((lists) => lists.flat());
  }
  return cache;
}

/**
 * Relevance, highest first.
 *
 * Deliberately simple and explainable rather than clever: an exact title, then
 * a title that starts with the query, then a title containing it, then a
 * section match. Someone typing "sepsis" wants the chapter called Sepsis above
 * one that mentions sepsis in its section heading, and nothing subtler than
 * that is worth the unpredictability.
 */
function scoreOf(hit: GuidelineHit, q: string): number {
  const title = hit.title.toLowerCase();
  const section = (hit.section ?? '').toLowerCase();

  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  // Word-boundary match beats a match buried mid-word ("sep" in "asepsis").
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(title)) return 60;
  if (title.includes(q)) return 40;
  if (section.includes(q)) return 20;
  return 0;
}

/** Ranked guideline matches for `query`. Empty for a blank or 1-char query. */
export async function searchGuidelines(
  query: string,
  limit = 20,
): Promise<GuidelineHit[]> {
  const q = query.trim().toLowerCase();
  // A single character matches almost everything and is never a real search.
  if (q.length < 2) return [];

  const all = await loadGuidelineIndex();
  return all
    .map((h) => ({ ...h, score: scoreOf(h, q) }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
