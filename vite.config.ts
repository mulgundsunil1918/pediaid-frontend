import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// One id per build, compiled into the bundle AND written to dist/version.json.
// The app fetches that file with cache: 'no-store' — a request the HTTP cache
// cannot answer — so it can tell within seconds that a new build exists,
// instead of waiting out GitHub Pages' fixed ten-minute max-age on index.html.
const BUILD_ID = new Date().toISOString();

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
  base: '/',
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
