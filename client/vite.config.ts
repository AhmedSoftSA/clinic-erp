import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const clientRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: clientRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: fileURLToPath(new URL("../dist/client", import.meta.url)),
    emptyOutDir: true,
  },
});
