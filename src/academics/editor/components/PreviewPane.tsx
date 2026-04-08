// =============================================================================
// editor/components/PreviewPane.tsx — slide-in read-only preview
// =============================================================================

import { X, Eye } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import type { ContentBlock } from '../types/editor.types';

// ---------------------------------------------------------------------------
// Minimal chapter renderer (standalone — not importing a separate ChapterRenderer
// to keep the editor self-contained; full renderer will be built in Reader UI)
// ---------------------------------------------------------------------------

function BlockPreview({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as 'h2' | 'h3' | 'h4';
      const cls = {
        h2: 'text-2xl font-bold mt-8 mb-3',
        h3: 'text-xl font-bold mt-6 mb-2',
        h4: 'text-lg font-semibold mt-5 mb-2',
      }[Tag];
      return <Tag className={`${cls} text-primary font-sans`}>{block.text || <span className="text-gray-300 italic">Empty heading</span>}</Tag>;
    }

    case 'paragraph':
      return (
        <p
          className="mb-5 leading-[1.8] text-ink"
          style={{ fontFamily: 'Georgia, serif', fontSize: '1.0625rem' }}
        >
          {block.text || <span className="text-gray-300 italic">Empty paragraph</span>}
        </p>
      );

    case 'list': {
      const Tag = block.style === 'bullet' ? 'ul' : 'ol';
      return (
        <Tag
          className={`mb-5 pl-6 space-y-1 ${block.style === 'bullet' ? 'list-disc' : 'list-decimal'}`}
          style={{ fontFamily: 'Georgia, serif', fontSize: '1.0625rem' }}
        >
          {block.items.map((item, i) => (
            <li key={i} className="text-ink leading-relaxed">{item}</li>
          ))}
        </Tag>
      );
    }

    case 'image':
      return block.src ? (
        <figure className="my-6">
          <img
            src={block.src}
            alt={block.alt}
            className="w-full rounded-xl object-contain max-h-[400px]"
          />
          {block.caption && (
            <figcaption className="text-center text-sm text-ink-muted mt-2 italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      ) : null;

    case 'reference_block':
      return block.refs.length > 0 ? (
        <div className="my-4 text-xs text-ink-muted">
          [References: {block.refs.map((n) => `[${n}]`).join(' ')}]
        </div>
      ) : null;

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// PreviewPane
// ---------------------------------------------------------------------------

interface PreviewPaneProps {
  onClose: () => void;
}

export function PreviewPane({ onClose }: PreviewPaneProps) {
  const { draft } = useEditorStore();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-50
                   w-full sm:w-1/2 bg-white shadow-2xl
                   flex flex-col overflow-hidden
                   animate-[slideInRight_250ms_ease-out]"
        role="complementary"
        aria-label="Chapter preview"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-3
                        border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-ink-muted" aria-hidden="true" />
            <span className="font-semibold text-sm text-ink">Preview</span>
            <span className="text-xs text-warning bg-yellow-50 border border-yellow-200
                             px-2 py-0.5 rounded-full font-medium">
              Not published
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink
                       hover:bg-gray-100 transition-colors"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-reading mx-auto">
            {/* Title */}
            <h1 className="font-sans font-bold text-3xl text-primary mb-6 leading-tight">
              {draft.title || (
                <span className="text-gray-300 italic">No title yet</span>
              )}
            </h1>

            {/* Blocks */}
            {draft.blocks.map((block) => (
              <BlockPreview key={block.id} block={block} />
            ))}

            {/* References list */}
            {draft.references.length > 0 && (
              <section className="mt-10 pt-6 border-t border-border">
                <h2 className="font-sans font-bold text-lg text-ink mb-4">
                  References
                </h2>
                <ol className="space-y-2">
                  {draft.references.map((ref) => (
                    <li
                      key={ref.refNumber}
                      className="flex gap-2 text-sm text-ink-muted"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      <span className="shrink-0 font-semibold text-ink">
                        {ref.refNumber}.
                      </span>
                      <span>
                        {ref.authors.join(', ')}
                        {ref.authors.length > 0 ? '. ' : ''}
                        {ref.title}
                        {ref.journal ? `. ${ref.journal}` : ''}
                        {ref.year ? `. ${ref.year}` : ''}
                        {ref.volume ? `;${ref.volume}` : ''}
                        {ref.issue ? `(${ref.issue})` : ''}
                        {ref.pages ? `:${ref.pages}` : ''}
                        {ref.doi ? (
                          <>
                            {'. '}
                            <a
                              href={`https://doi.org/${ref.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              doi:{ref.doi}
                            </a>
                          </>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
