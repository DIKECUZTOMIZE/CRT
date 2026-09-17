import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifestFilename: "site.webmanifest",
      includeAssets: ["favicon.svg", "og-image.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /^\/organizer\/login\/?$/, /^\/organizer\/register\/?$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/api\//.test(url.pathname),
            handler: "NetworkOnly",
          },
        ],
      },
      manifest: {
        id: "crt-organizer",
        name: "CRT Organizer",
        short_name: "CRT Organizer",
        description: "Manage events and operations on CRT Organizer.",
        start_url: "/organizer/login",
        scope: "/",
        display: "standalone",
        theme_color: "#030712",
        background_color: "#030712",
        orientation: "portrait",
        categories: ["productivity", "events", "management"],
        icons: [
          {
            src: "/icons/crt-organizer-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/crt-organizer-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/crt-organizer-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any",
          },
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5175,
    strictPort: true,
    hmr: {
      host: "localhost",
      port: 5175,
      protocol: "ws",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4175,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "organizer",
      "organizer.crtcompete.com",
      "crt-organizer-prod",
    ],
  },
});
