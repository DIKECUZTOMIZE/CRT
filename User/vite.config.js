import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'site.webmanifest',
      includeAssets: ['favicon.svg', 'og-image.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /^\/login\/?$/, /^\/register\/?$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/api\//.test(url.pathname),
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        id: 'crt-user',
        name: 'CRT',
        short_name: 'CRT',
        description: 'Discover events, competitions, and experiences on CRT.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#030712',
        background_color: '#030712',
        orientation: 'portrait',
        categories: ['lifestyle', 'entertainment', 'events'],
        icons: [
          {
            src: '/icons/crt-user-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/crt-user-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/crt-user-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any',
          },
        ],
      },
    }),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }

            if (
              id.includes('@tanstack') ||
              id.includes('@reduxjs') ||
              id.includes('framer-motion') ||
              id.includes('swiper') ||
              id.includes('socket.io-client')
            ) {
              return 'app-vendor';
            }

            if (id.includes('lucide-react') || id.includes('sonner')) {
              return 'ui-vendor';
            }
          }

          return undefined;
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'user',
      'crtcompete.com',
      'www.crtcompete.com',
      'crt-user-prod',
    ],
  },
});
