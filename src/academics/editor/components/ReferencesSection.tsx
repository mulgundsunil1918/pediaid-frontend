// =============================================================================
// editor/components/ReferencesSection.tsx
// =============================================================================

import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, X, ExternalLink } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import type { ChapterReference } from '../types/editor.types';

// ---------------------------------------------------------------------------
// Empty reference template
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
// Single reference entry
// ---------------------------------------------------------------------------

function RefEntry({
  ref,
  isCited,
}: {
  ref: ChapterReference;
  isCited: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const { updateReference, deleteReference } = useEditorStore();

  function update(field: keyof ChapterReference, value: string | number | null | string[]) {
    updateReference(ref.refNumber, { [field]: value });
  }

  function handleAuthorsChange(raw: string) {
    const authors = raw
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    update('authors', authors);
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-border">
        <span className="text-xs font-bold text-ink-muted w-6 shrink-0 text-center">
          [{ref.refNumber}]
        </span>
        <span className="flex-1 text-sm font-medium text-ink truncate min-w-0">
          {ref.title || (
            <span className="text-gray-300 italic">Untitled reference</span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {isCited && (
            <span className="text-xs text-accent font-medium px-2 py-0.5
                             bg-blue-50 rounded-full border border-blue-100">
              Cited
            </span>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded text-ink-muted hover:text-ink transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={() => deleteReference(ref.refNumber)}
            disabled={isCited}
            title={isCited ? 'Remove from all reference blocks first' : 'Delete reference'}
            className="p-1 rounded text-ink-muted hover:text-danger
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-colors"
            aria-label="Delete reference"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Fields */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Title */}
          <Field label="Title" required>
            <input
              type="text"
              value={ref.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Article or book title"
              className="field-input"
            />
          </Field>

          {/* Authors */}
          <Field label="Authors" hint="Last FM, Last FM — comma-separated">
            <input
              type="text"
              value={ref.authors.join(', ')}
              onChange={(e) => handleAuthorsChange(e.target.value)}
              placeholder="Smith J, Jones A"
              className="field-input"
            />
          </Field>

          {/* Journal */}
          <Field label="Journal">
            <input
              type="text"
              value={ref.journal}
              onChange={(e) => update('journal', e.target.value)}
              placeholder="e.g. Pediatrics"
              className="field-input"
            />
          </Field>

          {/* Year */}
          <Field label="Year">
            <input
              type="number"
              value={ref.year ?? ''}
              onChange={(e) =>
                update('year', e.target.value ? parseInt(e.target.value) : null)
              }
              min={1900}
              max={2030}
              placeholder="2024"
              className="field-input w-28"
            />
          </Field>

          {/* Volume / Issue / Pages */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Volume">
              <input
                type="text"
                value={ref.volume}
                onChange={(e) => update('volume', e.target.value)}
                placeholder="12"
                className="field-input"
              />
            </Field>
            <Field label="Issue">
              <input
                type="text"
                value={ref.issue}
                onChange={(e) => update('issue', e.target.value)}
                placeholder="3"
                className="field-input"
              />
            </Field>
            <Field label="Pages">
              <input
                type="text"
                value={ref.pages}
                onChange={(e) => update('pages', e.target.value)}
                placeholder="45–52"
                className="field-input"
              />
            </Field>
          </div>

          {/* DOI */}
          <Field label="DOI">
            <div className="flex gap-2">
              <input
                type="text"
                value={ref.doi}
                onChange={(e) => update('doi', e.target.value)}
                placeholder="10.1234/example"
                className="field-input flex-1"
              />
              {ref.doi && (
                <a
                  href={`https://doi.org/${ref.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-accent
                             border border-border rounded-lg hover:bg-blue-50
                             transition-colors shrink-0"
                  aria-label="Open DOI link"
                >
                  <ExternalLink size={11} aria-hidden="true" />
                  Open
                </a>
              )}
            </div>
          </Field>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field wrapper helper
// ---------------------------------------------------------------------------

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted mb-1">
        {label}
        {required && (
          <span className="text-danger ml-0.5" aria-label="required">
            *
          </span>
        )}
        {hint && <span className="font-normal text-gray-400 ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ReferencesSection
// ---------------------------------------------------------------------------

export function ReferencesSection() {
  const { draft, addReference } = useEditorStore();
  const { references, blocks } = draft;

  // Compute which ref numbers are currently cited
  const citedNums = new Set<number>(
    blocks
      .filter((b) => b.type === 'reference_block')
      .flatMap((b) => (b.type === 'reference_block' ? b.refs : [])),
  );

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
          📚 References
          {references.length > 0 && (
            <span className="text-sm font-medium text-ink-muted">
              ({references.length})
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={() => addReference({ ...EMPTY_REF })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
                     text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <Plus size={14} aria-hidden="true" />
          Add Reference
        </button>
      </div>

      {references.length === 0 ? (
        <p className="text-sm text-ink-muted py-4">
          No references yet. Click "Add Reference" to cite your sources.
        </p>
      ) : (
        <div className="space-y-3">
          {references.map((ref) => (
            <RefEntry
              key={ref.refNumber}
              ref={ref}
              isCited={citedNums.has(ref.refNumber)}
            />
          ))}
        </div>
      )}

      {/* Shared field input style injected as global via Tailwind @layer */}
      <style>{`
        .field-input {
          width: 100%;
          font-size: 0.875rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 0.375rem 0.75rem;
          outline: none;
          transition: border-color 0.15s;
          color: #2d3748;
          background: white;
        }
        .field-input:focus {
          border-color: #3182ce;
        }
        .field-input::placeholder {
          color: #cbd5e0;
        }
      `}</style>
    </section>
  );
}
