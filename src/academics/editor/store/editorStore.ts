// =============================================================================
// editor/store/editorStore.ts — Zustand editor state
// =============================================================================

import { create } from 'zustand';
import type {
  EditorState,
  ContentBlock,
  BlockType,
  HeadingBlock,
  ListBlock,
  ChapterReference,
  ChapterDetail,
  ApiBlock,
} from '../types/editor.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return crypto.randomUUID();
}

function emptyBlock(type: BlockType): ContentBlock {
  switch (type) {
    case 'heading':
      return { id: uid(), type: 'heading', level: 2, text: '' };
    case 'paragraph':
      return { id: uid(), type: 'paragraph', text: '' };
    case 'list':
      return { id: uid(), type: 'list', style: 'bullet', items: [''] };
    case 'image':
      return { id: uid(), type: 'image', src: '', alt: '', caption: '' };
    case 'reference_block':
      return { id: uid(), type: 'reference_block', refs: [] };
  }
}

function addLocalIds(blocks: ApiBlock[]): ContentBlock[] {
  return blocks.map((b) => ({ ...b, id: uid() } as ContentBlock));
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_DRAFT = {
  title: '',
  topicId: '',
  blocks: [{ id: uid(), type: 'paragraph' as const, text: '' }],
  references: [],
  featuredImageUrl: '',
};

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface EditorActions {
  // Draft fields
  setTitle: (title: string) => void;
  setTopic: (topicId: string) => void;
  setFeaturedImage: (url: string) => void;

  // Block operations
  addBlock: (type: BlockType, afterIndex?: number) => void;
  updateBlock: (id: string, updates: Partial<ContentBlock>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, direction: 'up' | 'down') => void;

  // List item operations
  addListItem: (blockId: string, afterIndex?: number) => void;
  updateListItem: (blockId: string, index: number, value: string) => void;
  deleteListItem: (blockId: string, index: number) => void;

  // References
  addReference: (ref: Omit<ChapterReference, 'refNumber'>) => void;
  updateReference: (refNumber: number, updates: Partial<ChapterReference>) => void;
  deleteReference: (refNumber: number) => void;

  // Load / persist
  loadDraft: (chapter: ChapterDetail) => void;
  markSaved: () => void;
  markDirty: () => void;
  setIsSaving: (saving: boolean) => void;
  setValidationErrors: (errors: string[]) => void;
  resetEditor: () => void;
}

type EditorStore = EditorState & EditorActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEditorStore = create<EditorStore>((set, get) => ({
  // --- initial state ---
  draft: { ...INITIAL_DRAFT, blocks: [...INITIAL_DRAFT.blocks] },
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  validationErrors: [],

  // ---------------------------------------------------------------------------
  // Draft field setters
  // ---------------------------------------------------------------------------

  setTitle: (title) =>
    set((s) => ({ draft: { ...s.draft, title }, isDirty: true })),

  setTopic: (topicId) =>
    set((s) => ({ draft: { ...s.draft, topicId }, isDirty: true })),

  setFeaturedImage: (url) =>
    set((s) => ({ draft: { ...s.draft, featuredImageUrl: url }, isDirty: true })),

  // ---------------------------------------------------------------------------
  // Block operations
  // ---------------------------------------------------------------------------

  addBlock: (type, afterIndex) => {
    const newBlock = emptyBlock(type);
    set((s) => {
      const blocks = [...s.draft.blocks];
      const insertAt =
        afterIndex !== undefined ? afterIndex + 1 : blocks.length;
      blocks.splice(insertAt, 0, newBlock);
      return { draft: { ...s.draft, blocks }, isDirty: true };
    });
  },

  updateBlock: (id, updates) =>
    set((s) => ({
      draft: {
        ...s.draft,
        blocks: s.draft.blocks.map((b) =>
          b.id === id ? ({ ...b, ...updates } as ContentBlock) : b,
        ),
      },
      isDirty: true,
    })),

  deleteBlock: (id) =>
    set((s) => {
      const blocks = s.draft.blocks.filter((b) => b.id !== id);
      // Minimum 1 block must remain
      if (blocks.length === 0) return {};
      return { draft: { ...s.draft, blocks }, isDirty: true };
    }),

  moveBlock: (id, direction) =>
    set((s) => {
      const blocks = [...s.draft.blocks];
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx === -1) return {};
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= blocks.length) return {};
      // Swap
      [blocks[idx], blocks[targetIdx]] = [blocks[targetIdx]!, blocks[idx]!];
      return { draft: { ...s.draft, blocks }, isDirty: true };
    }),

  // ---------------------------------------------------------------------------
  // List item operations
  // ---------------------------------------------------------------------------

  addListItem: (blockId, afterIndex) =>
    set((s) => ({
      draft: {
        ...s.draft,
        blocks: s.draft.blocks.map((b) => {
          if (b.id !== blockId || b.type !== 'list') return b;
          const items = [...b.items];
          const insertAt =
            afterIndex !== undefined ? afterIndex + 1 : items.length;
          items.splice(insertAt, 0, '');
          return { ...b, items } as ListBlock;
        }),
      },
      isDirty: true,
    })),

  updateListItem: (blockId, index, value) =>
    set((s) => ({
      draft: {
        ...s.draft,
        blocks: s.draft.blocks.map((b) => {
          if (b.id !== blockId || b.type !== 'list') return b;
          const items = [...b.items];
          items[index] = value;
          return { ...b, items } as ListBlock;
        }),
      },
      isDirty: true,
    })),

  deleteListItem: (blockId, index) =>
    set((s) => ({
      draft: {
        ...s.draft,
        blocks: s.draft.blocks.map((b) => {
          if (b.id !== blockId || b.type !== 'list') return b;
          if (b.items.length <= 1) return b; // minimum 1 item
          const items = b.items.filter((_, i) => i !== index);
          return { ...b, items } as ListBlock;
        }),
      },
      isDirty: true,
    })),

  // ---------------------------------------------------------------------------
  // References
  // ---------------------------------------------------------------------------

  addReference: (ref) =>
    set((s) => {
      const nextNum =
        s.draft.references.length > 0
          ? Math.max(...s.draft.references.map((r) => r.refNumber)) + 1
          : 1;
      const newRef: ChapterReference = { ...ref, refNumber: nextNum };
      return {
        draft: {
          ...s.draft,
          references: [...s.draft.references, newRef],
        },
        isDirty: true,
      };
    }),

  updateReference: (refNumber, updates) =>
    set((s) => ({
      draft: {
        ...s.draft,
        references: s.draft.references.map((r) =>
          r.refNumber === refNumber ? { ...r, ...updates } : r,
        ),
      },
      isDirty: true,
    })),

  deleteReference: (refNumber) =>
    set((s) => {
      // Check no ReferenceBlock cites this ref
      const cited = s.draft.blocks.some(
        (b) => b.type === 'reference_block' && b.refs.includes(refNumber),
      );
      if (cited) return {}; // Block the deletion silently (UI should prevent)

      // Remove and renumber
      const filtered = s.draft.references.filter(
        (r) => r.refNumber !== refNumber,
      );
      const renumbered = filtered.map((r, i) => ({ ...r, refNumber: i + 1 }));

      // Update any ReferenceBlocks that cite higher numbers
      const blocks = s.draft.blocks.map((b) => {
        if (b.type !== 'reference_block') return b;
        const updatedRefs = b.refs
          .filter((n) => n !== refNumber)
          .map((n) => (n > refNumber ? n - 1 : n));
        return { ...b, refs: updatedRefs };
      });

      return {
        draft: { ...s.draft, references: renumbered, blocks },
        isDirty: true,
      };
    }),

  // ---------------------------------------------------------------------------
  // Load / persist
  // ---------------------------------------------------------------------------

  loadDraft: (chapter) => {
    set({
      draft: {
        title: chapter.title,
        topicId: chapter.topicId,
        blocks: addLocalIds(chapter.content.blocks),
        references: chapter.chapterReferences,
        featuredImageUrl: chapter.featuredImageUrl,
      },
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
      validationErrors: [],
    });
  },

  markSaved: () =>
    set({ isDirty: false, isSaving: false, lastSavedAt: new Date() }),

  markDirty: () => set({ isDirty: true }),

  setIsSaving: (saving) => set({ isSaving: saving }),

  setValidationErrors: (errors) => set({ validationErrors: errors }),

  resetEditor: () =>
    set({
      draft: {
        ...INITIAL_DRAFT,
        blocks: [{ id: uid(), type: 'paragraph', text: '' }],
      },
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
      validationErrors: [],
    }),
}));

// ---------------------------------------------------------------------------
// Selector: build the API payload (strips local ids from blocks)
// ---------------------------------------------------------------------------

export function buildPayload(store: EditorStore) {
  const { draft } = store;
  const apiBlocks = draft.blocks.map(({ id: _id, ...rest }) => rest as ApiBlock);
  return {
    title: draft.title,
    topicId: draft.topicId,
    content: { blocks: apiBlocks },
    references: draft.references,
    featuredImageUrl: draft.featuredImageUrl,
  };
}
