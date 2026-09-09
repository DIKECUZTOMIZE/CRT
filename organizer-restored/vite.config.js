import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    port: 4173,
  },
});
