// =============================================================================
// academics/guidelines/registry.ts
// Central registry of every published-guideline set surfaced inside PediAid
// Academics. Add a new entry here and it shows up automatically on the
// /academics/guidelines hub.
// =============================================================================

export interface GuidelineSet {
  /** URL slug — used in routes and chapter URLs. */
  slug: string;
  /** Short display name (badges, tiles). */
  name: string;
  /** Full publication title. */
  fullName: string;
  /** Publishing body. */
  publisher: string;
  /** Year / version label shown next to the name. */
  year: string;
  /** Short, plain-English description of what's inside. */
  description: string;
  /** Primary brand colour for the tile + header chrome. */
  color: string;
  /**
   * URL of the JSON index for this guideline set.
   * Loaded by GuidelineBrowserPage. Schema must match the IAP-STG shape:
   *   { source, version, base_url, total_chapters, chapters: [{...}] }
   */
  indexUrl: string;
  /**
   * Status:
   *  - 'live'         — fully usable, indexUrl is reachable, chapters load
   *  - 'coming-soon'  — visible but disabled tile, no link
   */
  status: 'live' | 'coming-soon';
}

export const GUIDELINE_SETS: GuidelineSet[] = [
  {
    slug: 'iap-stg-2022',
    name: 'IAP STG',
    fullName: 'IAP Standard Treatment Guidelines 2022',
    publisher: 'Indian Academy of Pediatrics',
    year: '2022',
    description:
      "Indian Academy of Pediatrics' consensus-based standard treatment " +
      "guidelines covering 149 paediatric and neonatal topics — definitions, " +
      "evaluation, management flowcharts and follow-up.",
    color: '#1e3a5f',
    indexUrl: 'https://mulgundsunil1918.github.io/pediaid-stg/stg_index.json',
    status: 'live',
  },
  {
    slug: 'nnf-cpg',
    name: 'NNF CPG',
    fullName: 'NNF Clinical Practice Guidelines',
    publisher: 'National Neonatology Forum (India)',
    year: '',
    description:
      "Evidence-based clinical practice guidelines for neonatal care from " +
      "the National Neonatology Forum of India. Coming soon.",
    color: '#7c3aed',
    indexUrl: '',
    status: 'coming-soon',
  },
];

export function getGuidelineSet(slug: string): GuidelineSet | undefined {
  return GUIDELINE_SETS.find((g) => g.slug === slug);
}
