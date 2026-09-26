// =============================================================================
// lib/externalUrl.ts
//
// Turning a URL somebody typed into a form into one a browser can open.
//
// Event organisers paste registration links by hand — "forms.gle/abc123",
// "www.iapkarnataka.org/register", sometimes with a stray space. A bare
// <a href="forms.gle/abc"> is a RELATIVE path: React Router resolves it
// against the current route and the user lands on a 404 inside the SPA, or
// nothing happens at all. There is no error and nothing in the console, so
// the button simply looks broken — which is exactly how the CME registration
// link was reported.
//
// So every externally-supplied URL goes through here before it reaches an
// href. Anything that is not plausibly a web address returns null, and the
// caller renders nothing rather than a dead link.
// =============================================================================

/** Schemes we are willing to put in an href. */
const ALLOWED = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Normalises a user-supplied URL for use in an href.
 *
 * Adds https:// when no scheme is present, and rejects anything that is not
 * a parseable http(s)/mailto/tel address — notably `javascript:` and `data:`,
 * which must never reach an href from a field strangers can submit.
 *
 * @returns the absolute URL, or null when there is nothing safe to open
 */
export function toExternalUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  // "//example.com" is protocol-relative and resolves against the page's
  // scheme, which is fine, but be explicit about it.
  const candidate = trimmed.startsWith('//')
    ? `https:${trimmed}`
    : /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (!ALLOWED.includes(url.protocol)) return null;
  // A scheme alone ("https://") parses but has no host to reach.
  if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname === '') {
    return null;
  }
  return url.toString();
}

/**
 * A short, readable form of a URL for link text — host plus path, without the
 * scheme or a trailing slash.
 *
 * Full URLs overflow their container on a phone and read as noise; the host is
 * what tells a doctor whether a link is worth tapping.
 */
export function prettyUrl(raw: string | null | undefined): string {
  const normalised = toExternalUrl(raw);
  if (normalised === null) return '';
  try {
    const url = new URL(normalised);
    if (url.protocol === 'mailto:' || url.protocol === 'tel:') {
      return decodeURIComponent(url.pathname);
    }
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return `${url.host}${path}${url.search}`;
  } catch {
    return normalised;
  }
}
