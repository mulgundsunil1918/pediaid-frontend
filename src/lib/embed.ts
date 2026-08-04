// =============================================================================
// lib/embed.ts
//
// Is this page running inside the PediAid app's web view?
//
// The app opens the academics site in an InAppWebView that already has its own
// AppBar, back button and reload. The site's own header sat directly beneath
// it, so users saw two navigation bars stacked — and the second one offered a
// search box and a notification bell that duplicate what the app provides.
//
// The bell is the one that actually mattered: notifications shown inside a web
// view are notifications nobody sees. They belong to the app, which can badge
// and push them.
//
// Signalled by ?embed=1 rather than sniffing the user agent. The app controls
// the URL it loads, so the flag is explicit and testable in a normal browser;
// user-agent sniffing on a web view is guesswork that breaks silently when the
// platform changes.
//
// Sticky for the session: an in-app navigation that drops the query string
// must not make the duplicate header reappear halfway through.
// =============================================================================

const EMBED_KEY = 'pediaid_embed_mode';

function readFlag(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === '1') {
      try {
        sessionStorage.setItem(EMBED_KEY, '1');
      } catch {
        /* the in-memory fallback below still covers this session */
      }
      return true;
    }
    return sessionStorage.getItem(EMBED_KEY) === '1';
  } catch {
    return false;
  }
}

// Resolved once at module load: it cannot change within a session, and
// re-reading it per render would only invite inconsistency between components.
const embedded = readFlag();

/** True when the page is inside the app's web view. */
export function isEmbedded(): boolean {
  return embedded;
}
