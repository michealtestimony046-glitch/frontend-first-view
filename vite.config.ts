import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "tailwindcss";
import viteConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      customViteReactPlugin: true,
      server: { entry: "./src/server.ts" },
    }),
    react(),
    viteConfigPaths(),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  server: {
    middlewareMode: false,
  },
  build: {
    commonjsOptions: {
      esmExternals: true,
    },
  },
});
