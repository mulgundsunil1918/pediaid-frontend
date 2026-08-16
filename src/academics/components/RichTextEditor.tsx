// =============================================================================
// academics/components/RichTextEditor.tsx
//
// A minimal rich-text field: Bold / Italic / Underline / Highlight, storing
// clean HTML (sanitised on every change). Pasting from ChatGPT/Gemini/Word runs
// a "smart clean" that strips raw LaTeX ($…$, \text{}, \frac{}{}) and markdown
// markers into readable text — so a pasted dose regimen no longer shows the
// literal "$0.075\text{ mg/kg}$".
// =============================================================================

import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Highlighter } from 'lucide-react';
import { sanitizeRichHtml } from './sanitizeRichHtml';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

/** Turn pasted AI/Word content into clean readable text. */
export function cleanPastedText(text: string): string {
  return text
    // LaTeX delimiters → inner content
    .replace(/\$\$?([\s\S]*?)\$\$?/g, '$1')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    // \text{x} / \mathrm{x} / \textbf{x} … → x
    .replace(/\\(?:text|mathrm|mathbf|mathit|textbf|textit|textrm|operatorname)\s*\{([^}]*)\}/g, '$1')
    // \frac{a}{b} → a/b
    .replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '$1/$2')
    // common symbols
    .replace(/\\times/g, '×').replace(/\\cdot/g, '·').replace(/\\pm/g, '±')
    .replace(/\\leq?\b/g, '≤').replace(/\\geq?\b/g, '≥')
    .replace(/\\mu\b/g, 'µ').replace(/\\degree/g, '°')
    .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\rightarrow/g, '→')
    // any remaining \command → drop it
    .replace(/\\[a-zA-Z]+/g, '')
    // stray math braces
    .replace(/[{}]/g, '')
    // markdown emphasis markers (formatting is done with the toolbar instead)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    // leading markdown heading/list markers
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-•]\s+/gm, '• ')
    .trimEnd();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 90,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Initialise once; contenteditable is uncontrolled so re-setting innerHTML on
  // every render would fight the cursor.
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = sanitizeRichHtml(value || '');
    // Prefer real tags over inline styles for bold/italic/underline.
    try {
      document.execCommand('styleWithCSS', false, 'false');
    } catch {
      /* not supported — fine */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    if (ref.current) onChange(sanitizeRichHtml(ref.current.innerHTML));
  };

  const exec = (command: string) => {
    ref.current?.focus();
    document.execCommand(command, false);
    emit();
  };

  const highlight = () => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const mark = document.createElement('mark');
    try {
      range.surroundContents(mark);
    } catch {
      mark.appendChild(range.extractContents());
      range.insertNode(mark);
    }
    sel.removeAllRanges();
    emit();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const cleaned = escapeHtml(cleanPastedText(text)).replace(/\n/g, '<br>');
    document.execCommand('insertHTML', false, cleaned);
    emit();
  };

  const btn =
    'w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-muted ' +
    'hover:bg-gray-100 hover:text-ink transition-colors';

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white focus-within:border-accent transition-colors">
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-gray-50">
        <button type="button" className={btn} title="Bold" onMouseDown={(e) => { e.preventDefault(); exec('bold'); }}>
          <Bold size={15} />
        </button>
        <button type="button" className={btn} title="Italic" onMouseDown={(e) => { e.preventDefault(); exec('italic'); }}>
          <Italic size={15} />
        </button>
        <button type="button" className={btn} title="Underline" onMouseDown={(e) => { e.preventDefault(); exec('underline'); }}>
          <Underline size={15} />
        </button>
        <button type="button" className={btn} title="Highlight" onMouseDown={(e) => { e.preventDefault(); highlight(); }}>
          <Highlighter size={15} />
        </button>
        <span className="ml-auto text-[10px] text-ink-muted pr-1">Paste from ChatGPT/Gemini is auto-cleaned</span>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onPaste={onPaste}
        data-placeholder={placeholder ?? ''}
        className="rich-editor px-3 py-2 text-sm text-ink outline-none leading-relaxed"
        style={{ minHeight }}
      />
    </div>
  );
}
