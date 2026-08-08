// =============================================================================
// scripts/prerender.mjs — static HTML + sitemap for the public Academics pages
//
// Run after `vite build`. Fetches every published trial, guideline note and
// CME event, then writes a real HTML file per route into dist/.
//
// Why this and not a meta-tag component: Academics is a client-side app, so
// what a crawler receives is an empty shell — a few hundred bytes with no
// title, no description and no text. Google can run JavaScript, but it does
// so on a slower second pass and will not reliably index a page whose <head>
// is identical to every other page's. Writing the file at build time means
// the first byte already carries the title, the description and the actual
// prose.
//
// The generated files ALSO fix routing for these paths: GitHub Pages serves
// them directly instead of falling through to 404.html, so a shared link no
// longer bounces through the ?p= restore dance.
//
// The SEO body sits inside #root. React's createRoot().render() clears its
// container on mount, so a real visitor sees it for one frame and then the
// app; a crawler that never runs the script keeps the prose. Nothing is
// hidden from users that is shown to crawlers — the text is the same summary
// the page itself displays, which is what keeps this the honest kind of
// prerendering rather than cloaking.
// =============================================================================

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');
const API = process.env.VITE_API_URL || 'https://pediaid-backend.onrender.com';
const ORIGIN = 'https://pediaid.bridgr.co.in';
const BASE = '/academics';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Trim to a clean sentence boundary near the limit — Google shows ~160. */
function clamp(text, limit = 158) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= limit) return t;
  const cut = t.slice(0, limit);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(', '));
  return (stop > limit * 0.6 ? cut.slice(0, stop) : cut).trim() + '…';
}

async function getJson(path, key) {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) return [];
    const body = await res.json();
    const list = body?.[key];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn(`  ! ${path}: ${e.message}`);
    return [];
  }
}

// ── Collect the public library ───────────────────────────────────────────────

const [trials, notes, events] = await Promise.all([
  getJson('/api/academics/trials', 'trials'),
  getJson('/api/academics/guideline-notes', 'notes'),
  getJson('/api/academics/cme/events', 'data'),
]);

const list = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

const pages = [
  ...trials.map((t) => ({
    url: `${BASE}/trials/${t.specialty}/${t.slug}`,
    title: `${t.acronym ? `${t.acronym} trial — ` : ''}${t.title} | PediAid`,
    description: clamp(
      t.summary ||
        `${t.title}${t.journal ? `, ${t.journal}` : ''}${t.year ? ` ${t.year}` : ''}. Trial review on PediAid.`,
    ),
    heading: t.title,
    kicker: [t.acronym, t.journal, t.year].filter(Boolean).join(' · '),
    body: [
      t.summary,
      ...list(t.results),
      ...list(t.limitations),
      ...list(t.takeaways),
    ].filter(Boolean),
    changed: t.publishedAt || t.createdAt,
  })),
  ...notes.map((n) => ({
    url: `${BASE}/guideline-notes/${n.slug}`,
    title: `${n.title} | PediAid`,
    description: clamp(
      n.summary ||
        `${n.title}${n.society ? ` — ${n.society}` : ''}${n.guidelineYear ? ` ${n.guidelineYear}` : ''}. Guideline review on PediAid.`,
    ),
    heading: n.title,
    kicker: [n.society, n.guidelineYear].filter(Boolean).join(' · '),
    body: [
      n.summary,
      ...list(n.whatChanged),
      ...list(n.body),
      ...list(n.takeaways),
    ].filter(Boolean),
    changed: n.publishedAt || n.createdAt,
  })),
  ...events.map((e) => ({
    url: `${BASE}/cme/${e.slug}`,
    title: `${e.title} | PediAid CME`,
    description: clamp(
      e.description || `${e.title} — ${e.eventType} listed on PediAid.`,
    ),
    heading: e.title,
    kicker: [e.eventType, e.venue || 'Online'].filter(Boolean).join(' · '),
    body: [e.description, e.longDescription].filter(Boolean),
    changed: e.updatedAt || e.createdAt,
  })),
];

// Hubs — the entry points a crawler follows to reach everything above.
const hubs = [
  { url: `${BASE}`, title: 'PediAid Academics — paediatric trials, guidelines and CME',
    description: 'Landmark paediatric and neonatal trial reviews, guideline notes, standard treatment guidelines and CME events. Free, from PediAid.' },
  { url: `${BASE}/trials`, title: 'Landmark paediatric & neonatal trials | PediAid',
    description: 'The studies that changed paediatric and neonatal practice — what each asked, what it found, and where it is weak.' },
  { url: `${BASE}/recent`, title: 'Recent guideline reviews | PediAid',
    description: 'What changed in recent paediatric and neonatal guidelines, and what it means at the bedside.' },
  { url: `${BASE}/cme`, title: 'Paediatric CME, webinars and workshops | PediAid',
    description: 'Conferences, webinars, workshops and courses in paediatrics and neonatology.' },
];

// ── Write one HTML file per page ─────────────────────────────────────────────

const template = readFileSync(resolve(DIST, 'index.html'), 'utf8');

function render(page) {
  // Trailing slash: these are directory index.html files, so GitHub Pages
  // 301s the bare path to the slashed one. A canonical pointing at the URL
  // that redirects makes Google resolve a hop to reach the page it was just
  // told is canonical — so name the form actually served.
  const canonical = `${ORIGIN}${page.url}/`;
  const head = `
    <title>${esc(page.title)}</title>
    <meta name="description" content="${esc(page.description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${esc(page.title)}" />
    <meta property="og:description" content="${esc(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary_large_image" />`;

  let html = template
    .replace(/<title>[^<]*<\/title>/, '')
    .replace('</head>', `${head}\n  </head>`);

  if (page.heading) {
    // Inside #root: React clears the container when it mounts, so this is
    // what a crawler reads and what a visitor sees for a single frame.
    const paras = (page.body || [])
      .slice(0, 25)
      .map((p) => `<p>${esc(p)}</p>`)
      .join('\n        ');
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"><article>
        <h1>${esc(page.heading)}</h1>
        ${page.kicker ? `<p>${esc(page.kicker)}</p>` : ''}
        ${paras}
      </article></div>`,
    );
  }
  return html;
}

let written = 0;
for (const page of [...hubs, ...pages]) {
  const dir = resolve(DIST, page.url.replace(`${BASE}/`, '').replace(BASE, '') || '.');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), render(page), 'utf8');
  written++;
}

// ── Sitemap ──────────────────────────────────────────────────────────────────

const urls = [...hubs, ...pages]
  .map((p) => {
    const d = p.changed ? new Date(p.changed) : null;
    const lastmod =
      d && !Number.isNaN(d.getTime())
        ? `\n    <lastmod>${d.toISOString().slice(0, 10)}</lastmod>`
        : '';
    return `  <url>\n    <loc>${ORIGIN}${p.url}/</loc>${lastmod}\n  </url>`;
  })
  .join('\n');

writeFileSync(
  resolve(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  'utf8',
);

console.log(
  `  prerendered ${written} pages (${trials.length} trials, ${notes.length} guides, ${events.length} events) + sitemap.xml`,
);
