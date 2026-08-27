# Matrix QA Landing Page and ROADMAP Audit

**Audit date:** 27 August 2026  
**Approved origin:** `https://matrixqa.trlabs.tech`  
**Scope:** Complete public landing page, current pricing page, latest frontend `main`, and backend `origin/main` capability wiring.  
**Change boundary:** No website code, content, branch, pull request, or deployment was edited during this audit.

## Executive verdict

The landing page is visually coherent and the primary story is understandable: Matrix QA runs authorized browser journeys and returns evidence that a developer can review. The strongest area is the evidence showcase, because it makes the product’s differentiator concrete instead of describing generic “AI testing.” The page also has a sound heading hierarchy, valid primary CTAs, and no measured desktop horizontal overflow at the tested 1280px viewport.

The main issue is **not that the ROADMAP section looks bad**. It is that its status model is now behind the product. The landing page still presents a broad “Public build in progress” narrative and labels Application Mapping and Matrix Simulation as “Coming next,” while the current pricing page presents a live Free/Starter upgrade path with Quick Smoke, Standard Adaptive, Matrix Units, and governed collaboration. The frontend also exposes an authenticated discovery surface and the backend exposes scan, journey-graph, plan, approval, and run endpoints. The public page should therefore distinguish **what is available in the current product, what is available only in a particular tier or alpha surface, and what is genuinely planned**.

## Priority findings

| Priority | Finding | Evidence | Recommendation |
|---|---|---|---|
| P0 | ROADMAP status is stale relative to the current product | Landing page says `Public build in progress` and lists Application Mapping and Matrix Simulation under `Coming next`. Current pricing describes Free and Starter as available, including Standard Adaptive and governed collaboration. Frontend `app.discovery` exposes Quick Scan and a project map; backend `plans.controller.ts` exposes scans, journey graphs, plans, approval, and plan execution. | Restructure the section around **Current product**, **Tier/alpha availability**, and **Next frontier**. Do not leave Application Mapping or matrix coverage in one undifferentiated “Coming next” group. |
| P0 | Repair Packages is phrased as a shipped future capability without matching evidence | Landing copy says `Fix bundles routed to your coding agent`. The backend source supports deterministic bug intelligence and repair direction, while the current frontend report/issues surfaces expose Markdown repair notes and a copy action. That is not the same as a verified generated code bundle or coding-agent delivery workflow. | Change the card to something truthful such as **Repair notes and Markdown export — available in reports**, or keep it planned but say **Packaged repair guidance for coding agents — planned**. Only use “fix bundles routed to your coding agent” after an end-to-end workflow is demonstrably live. |
| P1 | Homepage and pricing page tell different maturity stories | Homepage uses `Public build in progress`; pricing is now a launch-pricing page with `$0 Free`, `$49 Starter`, `Standard Adaptive`, Matrix Units, and governed collaboration. | Use one shared status sentence across both pages. A safer homepage badge is **Public Preview · current capabilities vary by tier** or **Public Preview · start with a bounded browser signal**. Link the roadmap to `/pricing` and the relevant learning pages. |
| P1 | `Every deploy` implies an automatic deployment-triggered testing workflow | The hero headline is `Proof your app works. Every deploy.` It can be read as a promise that Matrix QA automatically runs on every deployment. The public landing page does not show a deployment-trigger setup, and the current product copy is centered on starting bounded runs and reviewing evidence. | Unless deployment triggers are live and user-configurable, replace the promise with **Proof your app works before you ship** or **Proof for every critical journey**. If automatic triggers are real, add a short qualification and link to the integration workflow. |
| P1 | “One URL is enough” omits authorization and access requirements | The hero says `no card · no install · one URL is enough`, while the product actually handles authorized targets, authentication boundaries, credentials, environments, preflight, and policy review. | Keep the low-friction message but qualify it: **No card · no install · start with one authorized URL**. Add a nearby sentence that staging targets may require approved credentials or an authentication handoff. |
| P1 | The page repeats the same proof model too many times before the roadmap | The hero value strip, Core Loop cards, Evidence showcase, three-step workflow, and What Matrix QA catches all repeat variants of sequential journeys, screenshots/logs/network evidence, deterministic filtering, and reports. This makes the page long before the visitor reaches the roadmap. | Keep each block’s job distinct: **definition**, **evidence**, **workflow**, and **failure classes**. Remove or compress one repeated block, preferably the four-card hero value strip or the separate catch-list. Use the freed space for current availability and a link to the sample report. |
| P2 | Evidence claims should use the same “when captured” qualification as the About and Sample Report pages | The landing page uses absolute language such as `Full console stream`, `Every finding ties ... to the exact millisecond`, and `indisputable evidence`. The About page correctly says evidence depends on the run and available storage. | Align landing copy with the more careful wording: **captured console and network signals when available**, **timestamps associated with recorded actions**, and **evidence-backed findings for the tested journey**. This improves trust and AEO consistency. |
| P2 | Roadmap cards are not useful discovery links | The three planned cards are static blocks. They do not help a visitor understand the current alternative or move to supporting evidence. | Make current capability cards link to `/pricing`, `/features`, `/sample-report`, `/automated-browser-testing`, or the relevant `/learn/*` guide. Planned cards should link only when a real public explanation exists; otherwise keep them clearly non-interactive. |
| P2 | Mobile header is usable at 390px but crowded | The 390px capture shows the logo, a compact Pricing link, and Launch console button in one row. No clipping was visible in the captured first viewport, but the arrangement leaves little room for longer labels or browser text scaling. | Test 320px, 360px, 390px, and 200% text scaling before the next design pass. Consider a compact menu or moving Pricing into the menu below the narrowest breakpoint. This is a responsive polish item, not a confirmed blocking defect. |
| P3 | The final `Open the console` CTA uses a raw `/app` destination while the header uses a session-aware control | The homepage final CTA links directly to `/app`; the header uses `LaunchConsoleLink`, which can present the appropriate sign-in/open-console state. | Use the same session-aware behavior or label the destination **Open console / sign in**. This avoids an avoidable surprise for anonymous visitors. Confirm the existing `/app` redirect behavior before changing it. |

## Recommended ROADMAP restructure

The existing three-versus-three card layout can be retained, but the categories should change from a simple “live versus coming next” split to a **capability maturity model**. This preserves the visual design while making the product status accurate.

### Suggested section heading

> **A clear path from one browser signal to broader coverage.**

Suggested supporting copy:

> **Public Preview is live. Start with a bounded journey, review the evidence, and expand coverage when the product surface and workspace tier support the question.**

### Suggested groups

| Group | Suggested cards | Status language |
|---|---|---|
| Available in Preview | **Quick Smoke** — one bounded browser journey with a clear evidence question; **Evidence and reports** — screenshots, runtime signals, timestamps, findings, and report output when captured; **Free workspace access** — current Preview entry point with the limits shown on Pricing | `Available now` |
| Available by tier or alpha surface | **Standard Adaptive** — reviewed journey expansion across supported viewport profiles; **Application Mapping / Quick Scan** — project map, observed routes, actions, features, and journey graph for review; **Governed collaboration** — named worker coordination, capacity, handoffs, and evidence visibility where enabled | `Available in current product` or `Available to eligible workspaces` |
| Next frontier | **Broader matrix coverage** — additional roles, devices, data states, and environments beyond the current supported profiles; **Agent-ready repair packages** — packaged repair guidance only when the end-to-end export/delivery workflow is actually live; **CI and integration expansion** — only if a specific integration has a public, working path | `Planned` |

This recommendation deliberately avoids claiming that every capability is available to every workspace. The backend has authenticated endpoints for scanning, journey graphs, plan creation, policy decisions, and approved-plan execution, but the landing page should use tier or alpha qualification until general availability is confirmed. The frontend already exposes discovery and report/repair-note concepts, so the public wording should not present all of them as distant future work.

## Landing-page content changes I would approve next

1. Replace the current roadmap status badge and heading with a current-product maturity statement.
2. Move Application Mapping out of the generic future bucket and qualify it as current authenticated or alpha capability if that is the intended availability boundary.
3. Split Matrix Simulation into the current **Standard Adaptive / supported viewport matrix** and a genuinely future **broader matrix** concept.
4. Correct Repair Packages so it describes the current Markdown repair-note surface or explicitly labels packaged agent delivery as planned.
5. Replace or qualify `Every deploy` unless automatic deployment-triggered runs are confirmed in production.
6. Qualify `one URL is enough` with `authorized` and align all evidence language with the About and Sample Report pages.
7. Reduce one repeated evidence block and use that space for a direct “What is live today?” answer with a Pricing or Sample Report link.
8. Make the roadmap cards or their adjacent status labels useful internal-link entry points without creating thin SEO pages.

## What is already good and should remain

The dark technical visual system is distinctive and consistent. The hero communicates the core value quickly, the sample report link is visible before the roadmap, and the Evidence section uses a concrete checkout failure rather than generic marketing language. The heading hierarchy is structurally sound: one H1 followed by section H2s and card H3s. At the tested 1280px production viewport, the document had equal client and scroll widths, so no desktop horizontal overflow was measured. The 390px mobile first viewport also showed clean stacking for the hero and value cards; broader threshold testing is still recommended.

## Approval boundary

No edits were made. No new branch, pull request, commit, or deployment was created for this audit. The next implementation should begin only after approving the ROADMAP status model and deciding whether `Every deploy` is a literal supported integration promise or a marketing shorthand to replace.

## References

[1]: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide "Google Search Central: Optimizing your website for generative AI features on Google Search"
[2]: https://developers.google.com/search/docs/fundamentals/creating-helpful-content "Google Search Central: Creating helpful, reliable, people-first content"
[3]: https://developers.google.com/search/docs/appearance/structured-data/sd-policies "Google Search Central: General Structured Data Guidelines"
[4]: https://github.com/michealtestimony046-glitch/frontend-first-view/blob/main/src/routes/pricing.tsx "Matrix QA frontend main: pricing page"
[5]: https://github.com/michealtestimony046-glitch/frontend-first-view/blob/main/src/routes/app.discovery.tsx "Matrix QA frontend main: authenticated discovery page"
[6]: https://github.com/matrixQA-backened/Matrix-qa-backend/blob/main/src/plans/plans.controller.ts "Matrix QA backend main: plans, scans, journey graphs, approvals, and execution endpoints"
[7]: https://github.com/michealtestimony046-glitch/frontend-first-view/blob/main/src/routes/index.tsx "Matrix QA frontend main: current landing page source"


## Implementation and validation addendum — 27 August 2026

The approved launch-positioning work is now implemented locally on `fix/live-launch-positioning`. The homepage no longer presents Matrix QA as a public preview program. Its hero now uses `Matrix QA launch · Autonomous QA Worker`, the release-oriented line `Before you ship.`, and authorized-URL wording. The former roadmap was replaced by a **Product path** with three explicit groups: **Available in launch**, **Available by plan or alpha**, and **Next frontier**. The new Product path links to the existing Quick Smoke, Standard Adaptive, Quick Scan/Application Mapping, governed collaboration, sample report, and pricing routes. Planned work remains clearly marked, including broader matrix coverage, agent-ready repair packages, and CLI/integration expansion.

The launch wording sweep covered the public homepage, FAQ, About, Features, Terms, supplemental `llm.txt`, shared public shells, final-four content, SEO topic content, and special-topic content. Remaining `preview` identifiers or private implementation semantics were not changed where they are not visitor-facing; the public route/source scan and representative SSR scan returned no remaining public Preview tokens. The authenticated billing route remains a separate noindex surface with older Preview-era copy and was not silently represented as public launch copy; it should be handled in a separate authenticated billing cleanup if desired.

The explicit exclusions were preserved. The homepage still contains `indisputable evidence`, `Full console stream`, and `exact millisecond`, and `src/components/launch-console-link.tsx` was not changed. The anonymous header was observed rendering `Checking session…` during local SSR browser inspection, and the session-aware CTA behavior was deliberately left intact.

### Validation evidence

| Check | Result | Evidence or note |
|---|---|---|
| Targeted Prettier | Passed | All changed TypeScript/TSX content files checked; unsupported `public/llm.txt` was intentionally excluded from parser-based formatting. |
| Targeted ESLint | Passed | All changed route/component/content files passed after formatting one existing violation in `special-topic-page.tsx`. |
| TypeScript | Passed | `pnpm exec tsc --noEmit` returned zero errors. |
| Production build | Passed | `pnpm build` completed successfully. |
| Diff whitespace | Passed | `git diff --check` returned zero errors. |
| Brand verification | Passed | Supplied Matrix QA favicon verification passed. |
| Public smoke suite | Passed | Ten local public routes returned HTTP 200 and expected markers. |
| SSR metadata | Passed | Representative routes returned production canonicals, titles, descriptions, and JSON-LD; FAQ schema and visible source phrase were present. |
| Browser interaction smoke | Passed | Homepage Quick Smoke link navigated safely; FAQ Starter accordion expanded; no signup, payment, or data mutation occurred. |
| Mobile visual QA | Passed with observation | 390×844 Chromium captures for home, FAQ, About, Quick Smoke, and staging guide showed readable stacking and no visible horizontal clipping. Quick Smoke's longer header CTA wrapped to two lines but remained fully visible and usable. |

The whole-repository `pnpm lint` command remains red because the repository contains 2,180 pre-existing Prettier errors and 18 warnings outside this focused change set. Targeted lint for the modified files passed, so this baseline debt is reported rather than mass-formatted unrelated files.

The local validation artifacts are preserved in `qa-run-2026-08-25/reports/mobile-launch-qa-2026-08-27/`, with the resumable checkpoint at `qa-run-2026-08-25/reports/launch-validation-checkpoint-2026-08-27.md` and the append-only ledger event `EVT-0022`. These tests cover the anonymous public launch surface and representative route families only; they do not establish universal browser/device compatibility, authenticated entitlement correctness, payment behavior, or production deployment success.
