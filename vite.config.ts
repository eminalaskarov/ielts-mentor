import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base so the build works on GitHub Pages sub-paths and Netlify alike.
export default defineConfig({
  base: './',
  // Content banks are bundled on purpose (fully offline); the main chunk is ~700 kB / ~220 kB gzip.
  build: { chunkSizeWarningLimit: 1200 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: './',
        name: 'IELTS Mentor',
        short_name: 'IELTS Mentor',
        description: 'Your daily guide from B1 to IELTS Academic 7.0+. Works offline.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#F2F2F7',
        background_color: '#F2F2F7',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
});
