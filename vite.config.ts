import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "tailwindcss";
import viteConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
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
