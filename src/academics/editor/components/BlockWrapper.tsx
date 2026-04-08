// =============================================================================
// editor/components/BlockWrapper.tsx
// Wraps every block: hover controls, focus accent, drag handle, fade-in mount.
// =============================================================================

import { useState, useRef, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, Trash2, GripVertical } from 'lucide-react';

interface BlockWrapperProps {
  children: ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
  /** If true, only shows delete (not move) — used for reference blocks */
  deleteOnly?: boolean;
}

export function BlockWrapper({
  children,
  onMoveUp,
  onDelete,
  onMoveDown,
  isFirst,
  isLast,
  deleteOnly = false,
}: BlockWrapperProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const showAccent = hovered || focused;

  return (
    <div
      ref={wrapperRef}
      className="group relative flex gap-2 py-1
                 animate-[fadeSlideIn_150ms_ease-out_both]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
          setFocused(false);
        }
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Left gutter: drag handle (visual only) + accent border             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col items-center pt-2 w-6 shrink-0">
        {/* Drag handle */}
        <div
          className={[
            'transition-opacity duration-150 cursor-grab text-gray-300',
            hovered ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          aria-hidden="true"
          title="Drag to reorder (coming soon)"
        >
          <GripVertical size={14} />
        </div>

        {/* Accent line */}
        <div
          className={[
            'flex-1 w-0.5 rounded-full mt-1 transition-all duration-150',
            showAccent ? 'bg-accent opacity-100' : 'opacity-0',
          ].join(' ')}
          aria-hidden="true"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Block content                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 min-w-0">{children}</div>

      {/* ------------------------------------------------------------------ */}
      {/* Right controls: appear on hover                                     */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={[
          'flex flex-col items-center gap-0.5 pt-1.5 shrink-0',
          'transition-opacity duration-200',
          hovered ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-hidden={!hovered}
      >
        {!deleteOnly && (
          <>
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              title="Move up"
              className="p-1 rounded text-gray-400 hover:text-ink hover:bg-gray-100
                         disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              title="Move down"
              className="p-1 rounded text-gray-400 hover:text-ink hover:bg-gray-100
                         disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown size={14} />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onDelete}
          title="Delete block"
          className="p-1 rounded text-gray-400 hover:text-danger hover:bg-red-50
                     transition-colors mt-0.5"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
