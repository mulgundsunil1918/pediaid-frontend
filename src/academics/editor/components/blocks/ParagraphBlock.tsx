// =============================================================================
// blocks/ParagraphBlock.tsx — auto-resizing Georgia textarea
// =============================================================================

import { useEffect, useRef } from 'react';
import type { ParagraphBlock as IParagraphBlock } from '../../types/editor.types';

interface ParagraphBlockProps {
  block: IParagraphBlock;
  onUpdate: (updates: Partial<IParagraphBlock>) => void;
}

export function ParagraphBlock({ block, onUpdate }: ParagraphBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize on value change
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [block.text]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Tab → insert 4 spaces without losing focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const spaces = '    ';
      const newValue =
        block.text.slice(0, start) + spaces + block.text.slice(end);
      onUpdate({ text: newValue });
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + spaces.length;
      });
    }
    // Enter: do NOT create a new block — standard textarea behaviour
  }

  return (
    <textarea
      ref={textareaRef}
      value={block.text}
      onChange={(e) => onUpdate({ text: e.target.value })}
      onKeyDown={handleKeyDown}
      placeholder="Write paragraph…"
      rows={1}
      className="w-full bg-transparent border-0 outline-none p-0 resize-none
                 leading-[1.8] placeholder-gray-300 text-ink"
      style={{
        fontFamily: 'Georgia, Cambria, serif',
        fontSize: '1.0625rem',
        caretColor: '#3182ce',
        overflow: 'hidden',
      }}
      aria-label="Paragraph text"
    />
  );
}
