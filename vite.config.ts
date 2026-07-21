import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    viteConfigPaths(),
    tailwindcss(),
  ],
  server: {
    middlewareMode: false,
  },
  build: {
    commonjsOptions: {
      esmExternals: true,
    },
  },
});
