import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /pediaid-frontend/ — use root base in dev
  base: isProd ? '/pediaid-frontend/' : '/',
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
