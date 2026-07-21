import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "tailwindcss";
import viteConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      start: { entry: "./server.ts" },
    }),
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
