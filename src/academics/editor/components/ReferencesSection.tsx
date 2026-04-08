// =============================================================================
// editor/components/ReferencesSection.tsx
//
// Simple plain-text references section rendered at the bottom of the chapter
// editor. Authors type a free-form citation per line (e.g. a Vancouver-style
// entry, a DOI URL, or an AMA citation — whatever convention they use) and
// add more with the "Add Reference" button. Each entry can be edited or
// deleted in place.
//
// Storage note: the backend's ChapterReference shape is preserved (title,
// authors, journal, year, etc.) so that previously-structured references
// still load without migration. We simply store the plain text in the
// `title` field and leave the rest empty. When a chapter that was authored
// with the old structured form is re-opened, its `title` field still holds
// the article title, so it renders naturally as plain text here.
// =============================================================================

import { Plus, X } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import type { ChapterReference } from '../types/editor.types';

// ---------------------------------------------------------------------------
// Empty reference template — all structured fields blank, plain text in title
// ---------------------------------------------------------------------------

const EMPTY_REF: Omit<ChapterReference, 'refNumber'> = {
  title: '',
  authors: [],
  journal: '',
  year: null,
  volume: '',
  issue: '',
  pages: '',
  doi: '',
  url: '',
};

// ---------------------------------------------------------------------------
// Single plain-text reference row
// ---------------------------------------------------------------------------

function ReferenceRow({ refEntry }: { refEntry: ChapterReference }) {
  const { updateReference, deleteReference } = useEditorStore();

  return (
    <div className="flex items-start gap-3">
      {/* Number */}
      <span
        className="
          shrink-0 w-8 h-9
          flex items-center justify-center
          text-xs font-semibold text-ink-muted
        "
        aria-hidden="true"
      >
        [{refEntry.refNumber}]
      </span>

      {/* Text input */}
      <textarea
        value={refEntry.title}
        onChange={(e) => updateReference(refEntry.refNumber, { title: e.target.value })}
        placeholder="Type a reference — authors, title, journal, year, DOI, or any format you use"
        rows={2}
        className="
          flex-1 min-w-0
          text-sm text-ink
          border border-border rounded-xl
          px-3 py-2
          outline-none focus:border-accent
          resize-y
          transition-colors
        "
        aria-label={`Reference ${refEntry.refNumber}`}
      />

      {/* Delete */}
      <button
        type="button"
        onClick={() => deleteReference(refEntry.refNumber)}
        className="
          shrink-0 w-8 h-9
          flex items-center justify-center
          rounded-lg
          text-ink-muted hover:text-danger hover:bg-red-50
          transition-colors
        "
        aria-label={`Delete reference ${refEntry.refNumber}`}
        title="Delete reference"
      >
        <X size={15} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReferencesSection
// ---------------------------------------------------------------------------

export function ReferencesSection() {
  const { draft, addReference } = useEditorStore();
  const { references } = draft;

  return (
    <section
      className="mt-10 pt-8 border-t border-border"
      aria-labelledby="references-heading"
    >
      <div className="flex items-center justify-between mb-5">
        <h2
          id="references-heading"
          className="font-sans font-bold text-lg text-ink flex items-center gap-2"
        >
          References
          {references.length > 0 && (
            <span className="text-sm font-medium text-ink-muted">
              ({references.length})
            </span>
          )}
        </h2>
      </div>

      {references.length === 0 ? (
        <p className="text-sm text-ink-muted mb-4">
          No references yet. Click "Add Reference" below to start citing your sources.
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          {references.map((ref) => (
            <ReferenceRow key={ref.refNumber} refEntry={ref} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => addReference({ ...EMPTY_REF })}
        className="
          inline-flex items-center gap-1.5
          px-4 py-2 rounded-xl
          text-sm font-semibold text-white
          transition-colors
        "
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <Plus size={14} aria-hidden="true" />
        Add Reference
      </button>
    </section>
  );
}
