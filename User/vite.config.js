import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
});
