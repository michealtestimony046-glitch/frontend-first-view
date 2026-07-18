# Matrix QA v1 — Landing hook + Dashboard refinement + Logo

Two work streams, one design system. Keep the current dark developer palette (near-black bg, phosphor-mint primary, Space Grotesk / Inter / JetBrains Mono). Adopt the wireframe's **structure** (sidebar workspace shell, stat cards row, recent runs table, failure trend, top issues, run summary, mobile bottom nav) — not its light theme.

---

## 1. Logo — Matrix QA hex symbol

Replace the "M" tile in `src/components/logo.tsx` with a refined inline SVG of the uploaded hexagon-plus-3x3-grid mark.

- Rebuild as a crisp inline SVG (not an `<img>` of the raster upload) so it scales, inherits currentColor for the outer hex stroke, and stays sharp at 20/24/28px.
- Trim padding: the raster has ~15% dead space — the SVG viewBox will be tight to the hex.
- Use the app's phosphor-mint `--primary` for the hex stroke + center node, muted foreground for the outer grid dots, and background-tinted fill inside the hex so it reads on both dark surfaces and inside the sidebar's darker panel.
- Two size variants: 28px (nav / sidebar header) and 40px (hero, auth panel).
- Wordmark stays `Matrix` + `QA` accent, tightened kerning to sit flush with the new mark.

Used in: top nav (landing), auth page, sidebar header (dashboard), favicon (regenerate `/favicon.ico` from the same SVG).

---

## 2. Landing page — sharpen the hook to v1's real promise

Rewrite hero + supporting sections in `src/routes/index.tsx` so the first screen states what v1 actually delivers, not a generic tagline.

**Hero (new copy):**
- Eyebrow: `v1 · Autonomous QA Worker`
- Headline: `Proof your app works — every deploy.`
- Sub: `Matrix QA walks your critical user journeys — login, signup, navigation, forms — and streams screenshots, console logs, network activity, and timestamps into an evidence-grade report. Deterministic. Multi-tenant. Built for developers.`
- Primary CTA: `Run your first scan` → `/auth`. Secondary: `See a sample report` → `/app/runs/run_9f2c`.
- Right side: keep the live terminal simulation but retitle it "Evidence stream" and show the four real evidence types (screenshot captured · console error · network 500 · selector failed) instead of generic log lines.

**Value strip (replace current one) — four pillars from the v1 brief:**
1. Automates core journeys — login, signup, navigation, forms
2. Streams raw diagnostic evidence — screenshots, console, network, timestamps
3. Deterministic filter — only hard failures (uncaught JS, non-2xx/3xx, failed selectors)
4. Multi-tenant by design — workspace UUID guards from day one

**How it works** — keep the 3-step section but retitle steps to match v1 language (Enter URL → Worker walks journeys → Evidence-backed report).

**What v1 catches** (new section, replaces the vague "trust signals" block) — three tiles listing the exact failure classes v1 isolates, with a mono code snippet example each:
- Uncaught JS runtime exceptions
- Non-2xx / 3xx HTTP responses
- Failed selectors on critical paths

**Trust row** — condense to a single one-line strip: `Built with Playwright · Deterministic evidence · Workspace-isolated · No browser extensions`.

**Roadmap** — keep the v1-dominant "Available Now / Coming Next" split already in place; tighten copy so v1 items map 1:1 to the four pillars above.

---

## 3. Dashboard — restructure to match the wireframe

Rebuild `src/components/app-shell.tsx` and `src/routes/app.index.tsx` to mirror the wireframe layout, keeping our dark palette.

**Sidebar (`app-shell.tsx`):**
- Fixed 240px left rail on `md+`, collapses to hamburger drawer on mobile.
- Sections: logo header · Workspace switcher (`My Workspace ▾`) · nav (Overview, Projects, Test Runs, Issues, Audit Log, Reports, Settings) · user card pinned to bottom (avatar + name + role).
- Active item: subtle mint-tinted surface with left accent bar, not a full fill.

**Overview page (`app.index.tsx`) — sections top to bottom:**
1. Page header: `Overview` + welcome line + `+ New Test Run` primary button (opens the URL-entry modal — reuse the existing form) + bell + help icons.
2. **Stat cards row (4):** Total Test Runs · Passed · Failed · Warnings. Each shows count, % of total or vs-last-7-days delta, and a small icon in a tinted square. On mobile: 2×2 grid.
3. **Recent Test Runs table** (left, ~60%) + **Failure Trend chart** (right, ~40%). Table columns: Run ID, Project, Status pill, Browser, Started At, Duration, chevron → detail. Chart: 7-day line with filled area, Total Failures footer + delta. Use Recharts (already in a Vite React stack; add if missing). On mobile: stack, table collapses to the card list you already built.
4. **Top Issues (Last 7 days)** (left) + **Run #NNN Summary** (right). Top Issues: severity dot, title, severity pill, occurrences, first seen. Summary card: status pill, started, browser/duration/steps/issues mini-grid, Quick Actions (View Full Report, Download Report, Rerun Test).
5. Legend row under Top Issues: Critical · Functional · Warning · Info dots.

**Mobile behavior:**
- Sidebar → drawer behind hamburger in a sticky top bar showing logo + page title + bell.
- Bottom tab bar (fixed): Overview · Projects · Test Runs · Issues · More. Active tab uses mint accent.
- Stat cards 2×2, tables → stacked cards, Run Summary gets a full-width `View Full Report` button.

**Data:** extend `src/lib/mock-data.ts` with `getDashboardStats()`, `getFailureTrend()` (7 points), `getTopIssues()`, and a `getLatestRunSummary()` — all deterministic mock. No backend work.

**Run report page (`app.runs.$runId.tsx`):** keep as-is; only swap the header/back-nav to sit correctly under the new sidebar shell and match the new spacing scale.

---

## Technical notes

- No backend, no route changes, no new packages beyond `recharts` (if not present) for the failure trend.
- All new colors go through existing tokens in `src/styles.css`; if the sidebar needs a slightly deeper panel than `--surface`, add one `--sidebar` token rather than hardcoding.
- Keep the scanline / grid utilities on the landing hero only — the dashboard stays calm and information-dense per the wireframe.
- Verify at 375px, 768px, 1280px after build.

## Out of scope

- Any real auth, database, or worker execution (still frontend-only v1 mock).
- Redesigning the run report internals (already iterated last turn).
- v2+ features (application mapping, matrix simulation, repair packages).
