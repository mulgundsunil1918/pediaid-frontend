// =============================================================================
// academics/components/sanitizeRichHtml.ts
//
// A tiny allow-list sanitizer for the rich-text editor. The editor only ever
// produces bold / italic / underline / <mark> / <br> / paragraphs, so we keep
// exactly those tags, strip every attribute, and unwrap anything else. Using
// the browser's own parser also re-escapes plain text correctly, so LEGACY
// plain-text content (e.g. "dose < 5 & rising") renders safely too.
// =============================================================================

const ALLOWED = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'MARK', 'BR', 'P', 'DIV', 'SPAN', 'UL', 'OL', 'LI',
]);

/** Node/SSR fallback (prerender has no DOM): regex allow-list, no attributes. */
function ssrSanitize(input: string): string {
  return input.replace(
    /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g,
    (_m, slash: string, tag: string) =>
      ALLOWED.has(tag.toUpperCase()) ? `<${slash}${tag.toLowerCase()}>` : '',
  );
}

export function sanitizeRichHtml(input: string): string {
  if (!input) return '';
  if (typeof document === 'undefined') return ssrSanitize(input);
  const tpl = document.createElement('template');
  tpl.innerHTML = input;

  const walk = (node: Node) => {
    // Snapshot: we mutate the tree as we go.
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        if (ALLOWED.has(el.tagName)) {
          Array.from(el.attributes).forEach((a) => el.removeAttribute(a.name));
          walk(el);
        } else {
          // Unwrap: keep the text/children, drop the tag (also neutralises
          // <script>/<style> — their contents become inert escaped text).
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
          }
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
      }
    });
  };

  walk(tpl.content);
  return tpl.innerHTML;
}

/** True when the value contains no meaningful text (empty / whitespace / bare tags). */
export function isRichTextEmpty(html: string): boolean {
  if (!html) return true;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  return (tpl.content.textContent ?? '').trim().length === 0;
}
