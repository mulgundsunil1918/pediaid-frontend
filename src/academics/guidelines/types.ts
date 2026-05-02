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
  /** Optional — number of pages in the chapter PDF. Omitted for externally hosted entries. */
  pages?: number;
  /** Optional — chapter file size in KB. Omitted for externally hosted entries. */
  size_kb?: number;
  keywords: string[];
  /** Optional — the chapter number from the source publication's TOC. */
  orig_chapter_no?: string;
  /**
   * If true, the chapter PDF is hosted on a third-party site (e.g. NNF's
   * official server) and the row should open the URL directly in a new
   * tab instead of routing to the in-app PDF viewer. Many third-party
   * sites also block iframe embedding via X-Frame-Options.
   */
  external?: boolean;
  /** Optional human-readable version label, e.g. "Dec 2021" or "Ver.3". */
  version_label?: string;
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
