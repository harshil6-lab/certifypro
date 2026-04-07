import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
  envDir: "..",
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      // Some existing pages call non-/api routes
      "/students": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/certificates": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/verify": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/user": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/dashboard": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
