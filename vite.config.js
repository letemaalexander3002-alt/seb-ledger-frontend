import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// SEB-Ledger frontend — Vite configuration
// Proxies /api requests to the running Express/Supabase backend core during
// local development so the dashboard can be built against the live API
// without CORS friction. seb-ledger-core defaults to PORT=3000; override
// VITE_BACKEND_URL if your backend runs elsewhere.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
