// =============================================================================
// reader/components/ChapterRenderer.tsx — read-only block renderer
// =============================================================================

import { useState, useCallback } from 'react';
import { ImageLightbox } from './ImageLightbox';
import type {
  ApiBlock,
  ChapterReference,
} from '../../editor/types/editor.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert heading text to a URL-safe anchor id */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/** Linkify plain text — wraps URLs in <a> tags */
function Linkified({ text }: { text: string }) {
  const URL_RE = /(https?:\/\/[^\s<>"]+)/g;
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        URL_RE.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Individual block renderers
// ---------------------------------------------------------------------------

function HeadingRenderer({ block }: { block: Extract<ApiBlock, { type: 'heading' }> }) {
  const id = slugify(block.text);
  const baseClass = 'font-sans scroll-mt-20';

  if (block.level === 2) {
    return (
      <h2 id={id} className={`${baseClass} text-[1.75rem] font-bold text-primary mt-8 mb-3`}>
        {block.text}
      </h2>
    );
  }
  if (block.level === 3) {
    return (
      <h3 id={id} className={`${baseClass} text-[1.375rem] font-semibold mt-6 mb-2`}
        style={{ color: '#2c5282' }}>
        {block.text}
      </h3>
    );
  }
  return (
    <h4 id={id} className={`${baseClass} text-[1.125rem] font-semibold text-ink mt-5 mb-2`}>
      {block.text}
    </h4>
  );
}

function ParagraphRenderer({ block }: { block: Extract<ApiBlock, { type: 'paragraph' }> }) {
  return (
    <p
      className="mb-[1.25rem] text-ink"
      style={{ fontFamily: 'Georgia, Cambria, serif', fontSize: '1.125rem', lineHeight: '1.8' }}
    >
      <Linkified text={block.text} />
    </p>
  );
}

function ListRenderer({ block }: { block: Extract<ApiBlock, { type: 'list' }> }) {
  const sharedItemStyle: React.CSSProperties = {
    fontFamily: 'Georgia, Cambria, serif',
    fontSize: '1.125rem',
    lineHeight: '1.7',
    marginBottom: '0.35rem',
  };

  if (block.style === 'bullet') {
    return (
      <ul className="mb-[1.25rem] pl-6 space-y-0">
        {block.items.map((item, i) => (
          <li key={i} className="relative text-ink" style={sharedItemStyle}>
            {/* Custom square blue bullet */}
            <span
              className="absolute -left-4 top-[0.6em] w-1.5 h-1.5 bg-accent"
              aria-hidden="true"
            />
            <Linkified text={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ol className="mb-[1.25rem] pl-6 list-none space-y-0" style={{ counterReset: 'item' }}>
      {block.items.map((item, i) => (
        <li key={i} className="relative text-ink" style={sharedItemStyle}>
          <span
            className="absolute -left-6 font-bold text-primary select-none"
            aria-hidden="true"
          >
            {i + 1}.
          </span>
          <Linkified text={item} />
        </li>
      ))}
    </ol>
  );
}

function ImageRenderer({
  block,
  onOpenLightbox,
}: {
  block: Extract<ApiBlock, { type: 'image' }>;
  onOpenLightbox: (b: Extract<ApiBlock, { type: 'image' }>) => void;
}) {
  if (!block.src) return null;

  return (
    <figure className="my-[1.25rem] flex flex-col items-center">
      <button
        type="button"
        onClick={() => onOpenLightbox(block)}
        className="w-full rounded-lg overflow-hidden border border-border
                   hover:opacity-95 transition-opacity cursor-zoom-in"
        aria-label={`View full size: ${block.alt}`}
      >
        <img
          src={block.src}
          alt={block.alt}
          loading="lazy"
          className="w-full object-contain"
          style={{ maxHeight: '500px' }}
        />
      </button>
      {block.caption && (
        <figcaption
          className="mt-2 text-center italic text-ink-muted"
          style={{ fontSize: '0.875rem' }}
        >
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function ReferenceBlockRenderer({
  block,
  references,
}: {
  block: Extract<ApiBlock, { type: 'reference_block' }>;
  references: ChapterReference[];
}) {
  if (block.refs.length === 0) return null;

  return (
    <span className="text-sm text-ink-muted ml-1">
      {block.refs.map((num) => {
        const ref = references.find((r) => r.refNumber === num);
        return (
          <sup key={num}>
            <a
              href={`#ref-${num}`}
              className="text-accent hover:underline font-medium mx-0.5"
              title={ref?.title ?? `Reference ${num}`}
            >
              [{num}]
            </a>
          </sup>
        );
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ChapterRenderer
// ---------------------------------------------------------------------------

interface ChapterRendererProps {
  blocks: ApiBlock[];
  references: ChapterReference[];
}

export function ChapterRenderer({ blocks, references }: ChapterRendererProps) {
  const [lightboxBlock, setLightboxBlock] = useState<Extract<ApiBlock, { type: 'image' }> | null>(null);

  const openLightbox = useCallback((b: Extract<ApiBlock, { type: 'image' }>) => {
    setLightboxBlock(b);
  }, []);

  return (
    <div className="chapter-content">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return <HeadingRenderer key={i} block={block} />;
          case 'paragraph':
            return <ParagraphRenderer key={i} block={block} />;
          case 'list':
            return <ListRenderer key={i} block={block} />;
          case 'image':
            return <ImageRenderer key={i} block={block} onOpenLightbox={openLightbox} />;
          case 'reference_block':
            return <ReferenceBlockRenderer key={i} block={block} references={references} />;
          default:
            return null;
        }
      })}

      {lightboxBlock && (
        <ImageLightbox
          src={lightboxBlock.src}
          alt={lightboxBlock.alt}
          caption={lightboxBlock.caption}
          onClose={() => setLightboxBlock(null)}
        />
      )}
    </div>
  );
}
