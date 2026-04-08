// =============================================================================
// blocks/ReferenceBlock.tsx
// =============================================================================

import { BookOpen } from 'lucide-react';
import type {
  ReferenceBlock as IReferenceBlock,
  ChapterReference,
} from '../../types/editor.types';

interface ReferenceBlockProps {
  block: IReferenceBlock;
  onUpdate: (updates: Partial<IReferenceBlock>) => void;
  allReferences: ChapterReference[];
}

export function ReferenceBlock({
  block,
  onUpdate,
  allReferences,
}: ReferenceBlockProps) {
  function toggleRef(refNum: number) {
    const next = block.refs.includes(refNum)
      ? block.refs.filter((n) => n !== refNum)
      : [...block.refs, refNum].sort((a, b) => a - b);
    onUpdate({ refs: next });
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={14} className="text-accent shrink-0" aria-hidden="true" />
        <span className="text-xs font-semibold text-accent uppercase tracking-wide">
          References cited here
        </span>
      </div>

      {allReferences.length === 0 ? (
        <p className="text-xs text-ink-muted">
          Add references in the References section below first.
        </p>
      ) : (
        <ul className="space-y-1.5" role="group" aria-label="Select references to cite">
          {allReferences.map((ref) => {
            const checked = block.refs.includes(ref.refNumber);
            const firstAuthor = ref.authors[0]?.split(' ')[0] ?? 'Unknown';
            const etAl = ref.authors.length > 1 ? ' et al.' : '';
            const label = `${ref.refNumber}. ${firstAuthor}${etAl}${ref.journal ? `, ${ref.journal}` : ''}${ref.year ? `, ${ref.year}` : ''}`;

            return (
              <li key={ref.refNumber}>
                <label className="flex items-start gap-2 cursor-pointer group/ref">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRef(ref.refNumber)}
                    className="mt-0.5 accent-accent cursor-pointer"
                    aria-label={label}
                  />
                  <span
                    className={[
                      'text-xs leading-relaxed transition-colors',
                      checked ? 'text-ink font-medium' : 'text-ink-muted',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
