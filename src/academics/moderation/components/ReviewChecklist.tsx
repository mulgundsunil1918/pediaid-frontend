// =============================================================================
// moderation/components/ReviewChecklist.tsx — visual-only checklist
// =============================================================================

import { useState } from 'react';

const ITEMS = [
  'Content is clinically accurate',
  'Appropriate for the selected topic',
  'At least one valid reference provided',
  'All images have captions and alt text',
  'No plagiarism concerns',
  'Language is professional and clear',
  'No promotional or commercial content',
];

interface ReviewChecklistProps {
  onChecklistChange?: (completedCount: number) => void;
}

export function ReviewChecklist({ onChecklistChange }: ReviewChecklistProps) {
  const [checked, setChecked] = useState<boolean[]>(ITEMS.map(() => false));

  function toggle(i: number) {
    const next = checked.map((v, idx) => (idx === i ? !v : v));
    setChecked(next);
    const count = next.filter(Boolean).length;
    onChecklistChange?.(count);
  }

  const done = checked.filter(Boolean).length;

  return (
    <div>
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
        Review Checklist
        <span className="ml-2 font-normal normal-case text-ink-muted">
          ({done}/{ITEMS.length})
        </span>
      </p>
      <ul className="space-y-2">
        {ITEMS.map((item, i) => (
          <li key={i}>
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                className="mt-0.5 accent-accent cursor-pointer"
              />
              <span className={[
                'text-xs leading-relaxed transition-colors',
                checked[i] ? 'text-ink line-through text-ink-muted' : 'text-ink',
              ].join(' ')}>
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-muted/60 mt-3 italic">
        Visual guide only — your decision is final.
      </p>
    </div>
  );
}
