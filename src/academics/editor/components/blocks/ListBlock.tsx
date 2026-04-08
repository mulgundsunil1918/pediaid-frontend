// =============================================================================
// blocks/ListBlock.tsx
// =============================================================================

import { useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import type { ListBlock as IListBlock } from '../../types/editor.types';

interface ListBlockProps {
  block: IListBlock;
  onUpdate: (updates: Partial<IListBlock>) => void;
}

export function ListBlock({ block, onUpdate }: ListBlockProps) {
  const { addListItem, updateListItem, deleteListItem } = useEditorStore();
  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  function focusItem(index: number) {
    requestAnimationFrame(() => itemRefs.current[index]?.focus());
  }

  function handleItemKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addListItem(block.id, index);
      focusItem(index + 1);
    }
    if (e.key === 'Backspace' && block.items[index] === '' && block.items.length > 1) {
      e.preventDefault();
      deleteListItem(block.id, index);
      focusItem(Math.max(0, index - 1));
    }
  }

  return (
    <div className="py-1">
      {/* Style toggle */}
      <div className="flex gap-1 mb-2" role="group" aria-label="List style">
        {(['bullet', 'numbered'] as const).map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => onUpdate({ style })}
            className={[
              'px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
              block.style === style
                ? 'bg-accent text-white border-accent'
                : 'text-ink-muted border-border hover:border-accent hover:text-accent',
            ].join(' ')}
          >
            {style === 'bullet' ? '• Bullet' : '1. Numbered'}
          </button>
        ))}
      </div>

      {/* Items */}
      <ul className="space-y-1" aria-label="List items">
        {block.items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2 group/item">
            {/* Prefix */}
            <span
              className="text-ink-muted shrink-0 w-5 text-sm font-medium select-none"
              aria-hidden="true"
            >
              {block.style === 'bullet' ? '•' : `${idx + 1}.`}
            </span>

            {/* Input */}
            <input
              ref={(el) => { itemRefs.current[idx] = el; }}
              type="text"
              value={item}
              onChange={(e) => updateListItem(block.id, idx, e.target.value)}
              onKeyDown={(e) => handleItemKeyDown(e, idx)}
              placeholder={idx === 0 ? 'List item…' : ''}
              className="flex-1 bg-transparent border-0 outline-none p-0 text-ink
                         placeholder-gray-300 leading-relaxed"
              style={{
                fontFamily: 'Georgia, Cambria, serif',
                fontSize: '1.0625rem',
                caretColor: '#3182ce',
              }}
              aria-label={`Item ${idx + 1}`}
            />

            {/* Delete item */}
            {block.items.length > 1 && (
              <button
                type="button"
                onClick={() => deleteListItem(block.id, idx)}
                className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded
                           text-gray-300 hover:text-danger transition-all shrink-0"
                aria-label={`Delete item ${idx + 1}`}
              >
                <X size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Add item */}
      <button
        type="button"
        onClick={() => {
          addListItem(block.id);
          focusItem(block.items.length);
        }}
        className="mt-2 inline-flex items-center gap-1 text-xs text-ink-muted
                   hover:text-accent transition-colors"
      >
        <Plus size={12} aria-hidden="true" />
        Add item
      </button>
    </div>
  );
}
