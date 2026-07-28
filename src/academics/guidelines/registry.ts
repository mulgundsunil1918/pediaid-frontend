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
  /** Optional human-readable "last checked against source" date, e.g. "Jul 28, 2026". Shown as a pill on the tile. */
  lastUpdated?: string;
  /** Optional — gives the tile an accent border + tint, for sets that were just refreshed or need surfacing. */
  highlight?: boolean;
}

export const GUIDELINE_SETS: GuidelineSet[] = [
  {
    slug: 'iap-action-plan-2026',
    name: 'IAP Action Plan',
    fullName: 'IAP Action Plan 2026 — Practice Guidelines',
    publisher: 'Indian Academy of Pediatrics',
    year: '2026',
    description:
      "IAP's flagship 2026 action-plan practice guidelines — 198 chapters " +
      "across Allergy, Adolescent care, Nutrition, Computer/Telemedicine, " +
      "Genetics, Vaccinology, Environment, Community Paediatrics, " +
      "Neurodevelopment, Medicolegal, Haemato-Oncology, Child Rights, " +
      "Palliative Care, Growth & Behaviour, Emergency Guidelines and a " +
      "Quick-Reference Neonatology series. Each chapter opens the official " +
      "IAP PDF on iapindia.org.",
    color: '#ea580c',
    indexUrl: `${import.meta.env.BASE_URL.replace(/\/$/, '')}/data/iap-action-plan-2026-index.json`,
    status: 'live',
    lastUpdated: 'Updated Jul 28, 2026',
    highlight: true,
  },
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
    year: '2021',
    description:
      "Evidence-based clinical practice guidelines for neonatal care from " +
      "the National Neonatology Forum of India. Each chapter opens the " +
      "official NNF PDF on nnfi.org.",
    color: '#7c3aed',
    indexUrl: `${import.meta.env.BASE_URL.replace(/\/$/, '')}/data/nnf-cpg-index.json`,
    status: 'live',
  },
];

export function getGuidelineSet(slug: string): GuidelineSet | undefined {
  return GUIDELINE_SETS.find((g) => g.slug === slug);
}
