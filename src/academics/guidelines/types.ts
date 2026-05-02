// =============================================================================
// academics/guidelines/types.ts
// =============================================================================

/** Single chapter entry inside a guideline-set index JSON. */
export interface GuidelineChapter {
  no: string;
  title: string;
  section: string;
  slug: string;
  file: string;
  url: string;
  pages: number;
  size_kb: number;
  keywords: string[];
  /** Optional — the chapter number from the source publication's TOC. */
  orig_chapter_no?: string;
}

/** Top-level shape of the guideline index JSON. */
export interface GuidelineIndex {
  source: string;
  version: string;
  base_url: string;
  generated_at: string | null;
  total_chapters: number;
  chapters: GuidelineChapter[];
}
