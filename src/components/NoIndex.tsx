// =============================================================================
// components/NoIndex.tsx
//
// Marks a route as "never index this" for search engines.
//
// robots.txt already asks crawlers not to fetch the admin paths, but that is
// only a request and doesn't cover a URL that leaks via a referrer or a
// pasted link. A meta robots tag is the instruction that actually keeps a
// page out of results once it HAS been fetched, so both are used together.
//
// Neither is a security control — authentication is. This is about the admin
// panel never surfacing in search results or being casually discoverable.
// =============================================================================

import { useEffect } from 'react';

const TAG_ID = 'pediaid-noindex';

export function NoIndex() {
  useEffect(() => {
    // Reuse a single tag: React 18 StrictMode double-invokes effects in dev,
    // and nested usages would otherwise stack duplicates.
    let tag = document.getElementById(TAG_ID) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.id = TAG_ID;
      tag.name = 'robots';
      document.head.appendChild(tag);
    }
    tag.content = 'noindex, nofollow, noarchive';

    return () => {
      // Navigating away from an admin route must not leave the whole SPA
      // marked noindex — the content pages depend on being indexed.
      document.getElementById(TAG_ID)?.remove();
    };
  }, []);

  return null;
}
