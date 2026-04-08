// =============================================================================
// reader/components/ReferencesDisplay.tsx
// =============================================================================

import { ExternalLink } from 'lucide-react';
import type { ChapterReference } from '../../editor/types/editor.types';

interface ReferencesDisplayProps {
  references: ChapterReference[];
}

function formatVancouver(ref: ChapterReference): React.ReactNode {
  const authors =
    ref.authors.length <= 3
      ? ref.authors.join(', ')
      : ref.authors.slice(0, 3).join(', ') + ' et al.';

  const parts: React.ReactNode[] = [];

  if (authors) parts.push(<span key="authors">{authors}. </span>);

  parts.push(
    <span key="title" className="font-medium text-ink">
      {ref.title}.{' '}
    </span>,
  );

  if (ref.journal) {
    parts.push(<em key="journal">{ref.journal}. </em>);
  }

  const volIssue = [
    ref.year ? String(ref.year) : null,
    ref.volume ? `;${ref.volume}` : null,
    ref.issue ? `(${ref.issue})` : null,
    ref.pages ? `:${ref.pages}` : null,
  ]
    .filter(Boolean)
    .join('');

  if (volIssue) parts.push(<span key="vol">{volIssue}. </span>);

  if (ref.doi) {
    parts.push(
      <a
        key="doi"
        href={`https://doi.org/${ref.doi}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:underline inline-flex items-center gap-0.5"
      >
        doi:{ref.doi}
        <ExternalLink size={10} aria-hidden="true" />
      </a>,
    );
  }

  return parts;
}

export function ReferencesDisplay({ references }: ReferencesDisplayProps) {
  if (references.length === 0) return null;

  return (
    <section
      className="mt-10 pt-8 border-t border-border"
      aria-labelledby="references-heading"
    >
      <h2
        id="references-heading"
        className="font-sans font-bold text-xl text-ink mb-5"
      >
        References
      </h2>

      <ol className="space-y-3" aria-label="Chapter references">
        {references.map((ref) => (
          <li
            key={ref.refNumber}
            id={`ref-${ref.refNumber}`}
            className="flex gap-3 scroll-mt-20"
          >
            <span
              className="shrink-0 font-bold text-primary font-sans text-sm pt-0.5"
              aria-label={`Reference ${ref.refNumber}`}
            >
              [{ref.refNumber}]
            </span>
            <span
              className="text-ink-muted leading-[1.6]"
              style={{ fontFamily: 'Georgia, Cambria, serif', fontSize: '0.9rem' }}
            >
              {formatVancouver(ref)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
