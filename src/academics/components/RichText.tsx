// =============================================================================
// academics/components/RichText.tsx
//
// Renders rich-text field content. Sanitises first (so nothing hostile is ever
// injected) and preserves newlines for LEGACY plain-text values — a value saved
// before the editor existed is plain text with real line breaks, which we keep
// readable via `white-space: pre-wrap` without turning HTML markup into literal
// characters.
// =============================================================================

import { sanitizeRichHtml } from './sanitizeRichHtml';

interface RichTextProps {
  html: string;
  className?: string;
}

export function RichText({ html, className }: RichTextProps) {
  const clean = sanitizeRichHtml(html || '');
  return (
    <div
      className={`rich-text whitespace-pre-wrap ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
