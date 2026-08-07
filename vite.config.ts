import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// One id per COMMIT, compiled into the bundle AND written to dist/version.json.
// The app fetches that file with cache: 'no-store' — a request the HTTP cache
// cannot answer — so it can tell within seconds that a new build exists,
// instead of waiting out GitHub Pages' fixed ten-minute max-age on index.html.
//
// This used to be `new Date().toISOString()`, which made every build unique
// and therefore every build's OUTPUT unique. `define` inlines the value, so
// the entry chunk's content changed on each run; Rollup's hashes cascade
// through import statements, so all ~200 lazy chunks were renamed too. Three
// consequences, all bad: a deploy rewrote 232 files instead of the handful
// that actually changed, returning visitors re-downloaded the entire 1.4MB
// bundle, and any already-open tab that lazily imported a chunk hit a 404 —
// the "Failed to fetch dynamically imported module" error this project keeps
// running into.
//
// Keying on the commit fixes all three: identical source now produces
// identical filenames, so unchanged chunks keep their names and stay cached,
// while a real code change still yields a new id and still triggers the
// update check.
function buildId(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    // No git (a tarball, a bare CI image). Fall back to the old behaviour
    // rather than failing the build — non-reproducible output beats no output.
    return new Date().toISOString();
  }
}

const BUILD_ID = buildId();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'emit-version-json',
      apply: 'build',
      closeBundle() {
        const dir = resolve(__dirname, 'dist');
        mkdirSync(dir, { recursive: true });
        writeFileSync(
          resolve(dir, 'version.json'),
          JSON.stringify({ buildId: BUILD_ID }),
        );
      },
    },
  ],
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  // Custom domain pediaid.bridgr.co.in — always serve from root
  // Served from a folder on the main origin now, not its own subdomain, so
  // that Academics and the app share one browser session. Assets resolve
  // under /academics/; the router still matches full paths — see App.tsx.
  base: '/academics/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});
