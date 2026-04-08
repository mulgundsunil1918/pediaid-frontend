// =============================================================================
// blocks/HeadingBlock.tsx
// =============================================================================

import { useRef, useState } from 'react';
import type { HeadingBlock as IHeadingBlock } from '../../types/editor.types';

interface HeadingBlockProps {
  block: IHeadingBlock;
  onUpdate: (updates: Partial<IHeadingBlock>) => void;
}

const LEVEL_STYLES: Record<2 | 3 | 4, string> = {
  2: 'text-[1.75rem] font-bold',
  3: 'text-[1.375rem] font-bold',
  4: 'text-[1.125rem] font-semibold',
};

export function HeadingBlock({ block, onUpdate }: HeadingBlockProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="py-1">
      {/* Level picker — shown on focus */}
      <div
        className={[
          'flex gap-1 mb-1.5 transition-all duration-150',
          focused ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden',
        ].join(' ')}
        aria-label="Heading level"
      >
        {([2, 3, 4] as const).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // keep input focused
              onUpdate({ level: lvl });
            }}
            className={[
              'px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors',
              block.level === lvl
                ? 'bg-accent text-white border-accent'
                : 'text-ink-muted border-border hover:border-accent hover:text-accent',
            ].join(' ')}
          >
            H{lvl}
          </button>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={block.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Section heading…"
        className={[
          'w-full bg-transparent border-0 outline-none p-0 leading-tight',
          'placeholder-gray-300 text-ink font-sans',
          LEVEL_STYLES[block.level],
        ].join(' ')}
        style={{ caretColor: '#3182ce' }}
        aria-label={`Heading level ${block.level}`}
      />
    </div>
  );
}
