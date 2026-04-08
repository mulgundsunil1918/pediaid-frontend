// =============================================================================
// editor/types/editor.types.ts — block-based chapter editor types
// Block `id` fields are local-only (crypto.randomUUID) and stripped before API.
// =============================================================================

// ---------------------------------------------------------------------------
// Content blocks
// ---------------------------------------------------------------------------

export interface HeadingBlock {
  id: string;
  type: 'heading';
  level: 2 | 3 | 4;
  text: string;
}

export interface ParagraphBlock {
  id: string;
  type: 'paragraph';
  text: string;
}

export interface ListBlock {
  id: string;
  type: 'list';
  style: 'bullet' | 'numbered';
  items: string[];
}

export interface ImageBlock {
  id: string;
  type: 'image';
  src: string;
  alt: string;
  caption: string;
}

export interface ReferenceBlock {
  id: string;
  type: 'reference_block';
  /** Indices into ChapterDraft.references (1-based ref numbers) */
  refs: number[];
}

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | ImageBlock
  | ReferenceBlock;

export type BlockType = ContentBlock['type'];

// ---------------------------------------------------------------------------
// References (citations)
// ---------------------------------------------------------------------------

export interface ChapterReference {
  /** 1-based sequential number, auto-assigned */
  refNumber: number;
  title: string;
  authors: string[];
  journal: string;
  year: number | null;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Chapter draft (in-editor working copy)
// ---------------------------------------------------------------------------

export interface ChapterDraft {
  title: string;
  topicId: string;
  blocks: ContentBlock[];
  references: ChapterReference[];
  featuredImageUrl: string;
}

// ---------------------------------------------------------------------------
// Editor state
// ---------------------------------------------------------------------------

export interface EditorState {
  draft: ChapterDraft;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  validationErrors: string[];
}

// ---------------------------------------------------------------------------
// API shape sent to backend — blocks stripped of local id
// ---------------------------------------------------------------------------

export type ApiBlock =
  | Omit<HeadingBlock, 'id'>
  | Omit<ParagraphBlock, 'id'>
  | Omit<ListBlock, 'id'>
  | Omit<ImageBlock, 'id'>
  | Omit<ReferenceBlock, 'id'>;

export interface ChapterPayload {
  title: string;
  topicId: string;
  content: { blocks: ApiBlock[] };
  references: Omit<ChapterReference, 'refNumber'>[];
  featuredImageUrl: string;
}

// ---------------------------------------------------------------------------
// ChapterDetail — shape returned by GET /api/academics/chapters/:id
// (subset needed for loading into the editor)
// ---------------------------------------------------------------------------

export interface ChapterDetail {
  id: string;
  title: string;
  topicId: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  authorId: string;
  content: { blocks: ApiBlock[] };
  chapterReferences: ChapterReference[];
  featuredImageUrl: string;
  subject: { id: string; name: string; code: string };
  system: { id: string; name: string };
  topic: { id: string; name: string };
}
