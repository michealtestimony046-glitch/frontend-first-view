## Problem

The preview shows 404 for every URL. Root cause: `vite.config.ts` was edited and the TanStack Start Vite plugin was removed. Without it, Vite runs as a plain SPA dev server with no SSR handler mounted — but the app is a TanStack Start app (uses `src/server.ts`, `src/start.ts`, `shellComponent`), so nothing serves `/` and Vite responds 404.

Nothing about the Lovable-branding cleanup you did is the cause. All the `lovable-error-reporting.ts` / `LOVABLE_*` code paths are inert until the server actually renders. Your other edits (removing branding strings) are fine and I won't touch them.

## Fix

Update `vite.config.ts` only:

1. Add `import { tanstackStart } from "@tanstack/react-start/plugin/vite"`.
2. Replace the standalone `TanStackRouterVite()` plugin with `tanstackStart({ customViteReactPlugin: true })` — this plugin internally wires the router plugin plus the SSR entry (`src/server.ts`) and the client entry.
3. Keep `react()`, `viteConfigPaths()`, the Tailwind PostCSS block, and the `server` / `build` options as-is.
4. Leave `src/server.ts`, `src/start.ts`, `src/router.tsx`, and all route files untouched.

No package installs needed — `@tanstack/react-start` is already in `package.json`.

## Verification

After the edit I'll `curl http://localhost:8080/` and expect HTTP 200 with the landing page HTML, then confirm `/app` and `/pricing` also return 200.
