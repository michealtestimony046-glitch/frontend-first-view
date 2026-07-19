My Adds on make the FAQ 8 base on what you understand 

Yes, this is strictly a frontend addition. Your frontend developer does not need a backend engineer, a custom server, or a database to execute this.

Right now, your spec tells the frontend to swallow the user's input and do nothing. That is a dead end.

Here is exactly what you change in the frontend scope for the /app/settings/billing route:

 * **The Action:** Instead of the form doing nothing, instruct the frontend developer to add a basic fetch() or HTTP post request to the "Submit request" button.

 * **The Destination:** They will point that request directly to a [Make.com](http://Make.com) or n8n webhook URL.

 * **The Result:** The frontend fires the JSON payload (email + workload details) to that webhook. Your low-code automation catches it and drops the data directly into Nath's lead collection workflow for immediate follow-up.

It takes a competent frontend developer less than ten minutes to wire a form to an external webhook. It costs zero backend engineering hours, and it immediately secures your early sales pipeline.

Now, look at the reality of building a frontend entirely detached from the backend right now. If the dashboard is relying completely on hardcoded mock data to display "87 runs used," how exactly is your frontend team testing the UI lock-out states for when a user actually hits the 250-run limit and needs to be blocked from initiating a new scan?

&nbsp;

# Matrix QA v1 — Pricing page + Billing settings

Two new routes, both frontend-only mock, styled with the existing dark/phosphor-mint system. No payment gateway, no checkout. Copy stays honest to v1: one Preview plan, everything else is a dated roadmap card.

---

## 1. New route: `/pricing` (`src/routes/pricing.tsx`)

Public marketing page, uses the same top nav + footer as the landing page. Route `head()` gets its own title/description/og.

**Section A — Preview hero**

- Eyebrow: `v1 · Public Preview`
- Headline: `Matrix QA is free during Preview.`
- Sub: `We're validating the Core Engine with early developers. No credit card. No checkout. Just run scans and help us harden the worker.`
- Chip row: `Browser Worker · Evidence Capture · Bug Reports · Dashboard`
- Primary CTA: `Request early access` → `/auth`. Secondary: `See a sample report` → `/app/runs/run_9f2c`.

**Section B — Available today (single featured card)**
One large card, mint-glow border, not a 4-up grid.

- Label: `Preview` + small `Current` pill
- Price: `$0` / `while in v1`
- Line: `Perfect for evaluating the Matrix QA Core Engine.`
- Two-column checklist of the 14 v1 inclusions from the brief (Browser Worker, Sequential Automation, Login/Signup/Navigation/Form testing, Screenshot Evidence, Console Logs, Network Logs, Execution Timeline, Bug Reports, 1 Workspace, 1 Project, Community Support).
- CTA button: `Join Preview` → `/auth`.
- Fine print: `During Preview, usage limits may change as we improve the platform.`

**Section C — Coming next (roadmap cards, not pricing cards)**
Header: `Coming next` + sub `Prices and features shown are directional. Availability tracks the roadmap below.`
Four cards in a responsive grid (1 / 2 / 4 cols). Each card is visually **de-emphasized** vs the Preview card: muted border, no glow, `Launching in Vx` badge top-right, disabled-styled button.

- **Starter** — `$49/mo` · Launching in **V2** · solo devs & indie builders · Multiple Projects, Project Scanner, Journey Graph, Test Planner, Better Dashboard, Better Evidence, Worker Stability · button `Coming in V2` (disabled).
- **Pro** — `$129/mo` · Launching in **V3** · teams building production software · Everything in Starter + Matrix Simulation, Parallel Workers, Browser×Device×Role, More Credits, Faster Execution · button `Coming in V3` (disabled).
- **Business** — price shown as `—` · Launching in **V5** · startups & agencies · Organizations, Multiple Workspaces, Team Members, Permissions, Shared Credits, Higher Concurrency · button `Coming in V5` (disabled).
- **Enterprise** — price `Custom` · Launching in **V10** · larger eng orgs · Private Workers, Dedicated Infra, SSO, Audit Logs, Enterprise Security, SLA · button `Contact sales (coming in V10)` (disabled).

**Section D — Full roadmap strip**
Horizontal timeline (stacks vertically on mobile). Ten pills V1–V10 with a check on V1 (`Core Engine · Current`, mint) and arrow icons on V2–V10 (muted). Labels: Application Mapping, Matrix Simulation, Repair Packages, SaaS Platform, CLI, GitHub, AI Integrations, Intelligent Quality, Enterprise.

**Section E — FAQ (short, 4 items)**

- Is Preview really free? (yes, no card)
- What happens when v2 ships? (Preview stays available as a limited free tier)
- Are there usage limits? (soft 250-run pool per workspace, may change)
- How do I get more allocation? (link to billing page's request form)

**Nav wiring**
Add `Pricing` link to the landing top nav (`src/routes/index.tsx`) between existing items. No footer changes needed beyond adding the pricing link if a footer nav list exists.

---

## 2. New route: `/app/settings/billing` (`src/routes/app.settings.billing.tsx`)

Lives inside the authenticated `/app` shell so it inherits the sidebar and mobile bottom nav. Per the brief: static, functional, no gateway.

**Layout inside `AppShell` (title="Billing"):**

1. **Page header** — `Billing` + sub `Matrix QA is in Preview. Billing is disabled while we validate the Core Engine.`
2. **Current plan card** (mint-tinted, glow border)
  - Label row: `Matrix QA Preview` · price `$0 / mo` · status pill `Active · Free Access` (mint dot).
  - Small copy: `Included while Matrix QA is in v1 Public Preview.`
3. **Usage card**
  - Label: `Test runs this cycle`
  - Big number: `<used> / 250`  (mock `used = 87` from mock-data helper `getBillingUsage()`)
  - Progress bar (existing token colors, mint fill, muted track). Turns amber ≥80%, red ≥95%.
  - Sub line: `Pool resets when v2 introduces per-plan quotas. Limits may change during Preview.`
  - Primary button: `Request more allocation` → opens a simple in-page modal with a textarea (`Tell us about your workload`) + email field + `Submit request` button that just closes the modal and shows a success toast. No network call. Secondary link: `Or reach us in the community` (href `#`, `target="_blank"` placeholder).
4. **What's included** — condensed 2-col checklist mirroring the Preview card on `/pricing` (fewer items, no duplicate of the whole list).
5. **Coming next** — small strip: `Paid plans launch with v2 (Starter · $49) and v3 (Pro · $129).` + link `See roadmap → /pricing#roadmap`.
6. **Invoices / Payment method** — an empty-state card with muted icon: `No billing history` · `You'll see invoices here once paid plans launch.` No "Add payment method" CTA.

**Sidebar nav**
Add a `Billing` entry under Settings in `src/components/app-shell.tsx` (or repoint the existing Settings item to `/app/settings/billing` for v1 since Settings has no page yet). Prefer: keep `Settings` pointing at `/app` for now and add a dedicated `Billing` nav item so the route is reachable from the sidebar and mobile drawer.

---

## 3. Mock data

Extend `src/lib/mock-data.ts` with:

- `getBillingUsage()` → `{ used: 87, cap: 250, cycleLabel: "Preview pool" }`
- `PREVIEW_INCLUSIONS: string[]` — the 14-item list, reused by `/pricing` and `/app/settings/billing`.
- `ROADMAP: { version: "V1".."V10", title: string, current?: boolean }[]` — reused by pricing roadmap strip and (optionally) landing.

---

## 4. Copy tone

Follow the user's "Preview, not Trial" framing throughout — Linear/Vercel/Supabase voice. No "free trial", no "upgrade now", no fake urgency. Roadmap cards say `Launching in Vx`, never `Buy` or `Subscribe`.

---

## Out of scope

- Any real Stripe / Paddle / checkout — explicitly not wired.
- Editing the existing landing hero/roadmap sections beyond adding the `Pricing` nav link.
- Settings pages other than Billing.
- Backend, auth gating, or real usage counters.