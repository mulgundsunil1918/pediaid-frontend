// =============================================================================
// editor/components/BlockToolbar.tsx — sticky toolbar to add new blocks
// =============================================================================

import { useState } from 'react';
import {
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Image,
  BookOpen,
} from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import type { BlockType } from '../types/editor.types';

interface ToolbarButton {
  type: BlockType;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
}

const BUTTONS: ToolbarButton[] = [
  {
    type: 'heading',
    label: 'H2',
    tooltip: 'Section heading (H2)',
    icon: <Heading2 size={15} aria-hidden="true" />,
  },
  {
    type: 'heading',
    label: 'H3',
    tooltip: 'Subsection heading (H3)',
    icon: <Heading3 size={15} aria-hidden="true" />,
  },
  {
    type: 'paragraph',
    label: '¶',
    tooltip: 'Paragraph text (Georgia serif)',
    icon: <Pilcrow size={15} aria-hidden="true" />,
  },
  {
    type: 'list',
    label: '• List',
    tooltip: 'Bullet list',
    icon: <List size={15} aria-hidden="true" />,
  },
  {
    type: 'list',
    label: '1. List',
    tooltip: 'Numbered list',
    icon: <ListOrdered size={15} aria-hidden="true" />,
  },
  {
    type: 'image',
    label: 'Image',
    tooltip: 'Image block (upload or URL)',
    icon: <Image size={15} aria-hidden="true" />,
  },
  {
    type: 'reference_block',
    label: 'References',
    tooltip: 'Cite references from the references list below',
    icon: <BookOpen size={15} aria-hidden="true" />,
  },
];

interface ToolbarBtnProps extends ToolbarButton {
  onClick: () => void;
}

function ToolBtn({ label, tooltip, icon, onClick }: ToolbarBtnProps) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                   font-medium text-ink-muted border border-border bg-white
                   hover:bg-gray-50 hover:text-ink hover:border-gray-300
                   active:bg-gray-100 transition-colors whitespace-nowrap"
      >
        {icon}
        {label}
      </button>

      {showTip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                     whitespace-nowrap bg-primary text-white text-xs rounded-md
                     px-2 py-1 shadow-lg z-20 pointer-events-none"
        >
          {tooltip}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4
                       border-transparent border-t-primary"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlockToolbar
// ---------------------------------------------------------------------------

export function BlockToolbar() {
  const addBlock = useEditorStore((s) => s.addBlock);

  function handleAdd(btn: ToolbarButton) {
    if (btn.type === 'heading') {
      // H2 = index 0, H3 = index 1 in BUTTONS
      const level = btn.label === 'H2' ? 2 : 3;
      addBlock('heading');
      // Update the just-added block's level via a follow-up action
      // (editorStore.addBlock creates a default H2; we correct if H3)
      if (level === 3) {
        const store = useEditorStore.getState();
        const last = store.draft.blocks[store.draft.blocks.length - 1];
        if (last?.type === 'heading') {
          store.updateBlock(last.id, { level: 3 });
        }
      }
    } else if (btn.type === 'list' && btn.label === '1. List') {
      addBlock('list');
      const store = useEditorStore.getState();
      const last = store.draft.blocks[store.draft.blocks.length - 1];
      if (last?.type === 'list') {
        store.updateBlock(last.id, { style: 'numbered' });
      }
    } else {
      addBlock(btn.type);
    }
    // Scroll to bottom to show new block
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
  }

  return (
    <div className="sticky top-14 z-20 bg-white border-b border-border shadow-sm">
      <div className="max-w-reading mx-auto px-4 sm:px-6 py-2">
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1
                     scrollbar-thin scrollbar-thumb-border"
          role="toolbar"
          aria-label="Add content block"
        >
          <span className="text-xs text-ink-muted font-medium shrink-0 mr-1">
            Add:
          </span>
          {BUTTONS.map((btn, i) => (
            <ToolBtn key={i} {...btn} onClick={() => handleAdd(btn)} />
          ))}
        </div>
      </div>
    </div>
  );
}
