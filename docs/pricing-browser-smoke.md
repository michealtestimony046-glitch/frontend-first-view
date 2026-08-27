# Pricing browser smoke observation

- Route: `http://localhost:4173/pricing`
- Title: `Matrix QA Pricing | Free and Starter Browser QA Plans`
- Default sandbox viewport observed: approximately 884×768
- Public page rendered successfully.
- Visible content included Free at $0/month, Starter at $49/month, Pro marked Coming soon, visible locked Free features with `Upgrade to Starter` labels, six descriptive learning links, and four display-only top-up packages.
- Authenticated plan banner was not shown because the local browser had no Matrix QA auth token; the page displayed the public state.
- The local dev server emitted only expected route-content warnings for non-route registry files; no page runtime error was observed during navigation.

The canonical `/learn/matrix-units` route also rendered successfully at the default sandbox viewport. Its title, hero, live Matrix Unit explanation, failed-run policy, plan allowance section, descriptive internal links, FAQ disclosure elements, and legal/support footer links were visible in extracted page content. No page runtime error was observed during navigation.

The `/learn/quick-smoke-testing` and `/learn/standard-adaptive-testing` routes both rendered successfully at the default sandbox viewport. Their title and primary headings were present, descriptive internal links resolved in extracted content, and FAQ disclosures were keyboard-addressable native `details`/`summary` elements. Standard Adaptive copy correctly qualifies five logical slots versus actual browser concurrency and states that Free sees an upgrade path. No runtime errors were observed on either route.

The `/learn/five-worker-qa-collaboration` and `/learn/matrix-unit-top-ups` routes rendered successfully at the default sandbox viewport. The collaboration page showed Coordinator, worker roles, console dialogue, task leases, and the distinction between logical slots and physical sessions. The top-up page showed the four direct-value packages and explicitly stated that checkout is disabled. Internal links and native FAQ disclosures were present; no runtime errors were observed.

The `/learn/quick-scan` route rendered successfully. Its title and heading described Quick Scan as a preflight whose leads require verification. A rendered-document inspection confirmed one `main` landmark, the expected H1, and canonical URL `https://matrixqa.trlabs.tech/learn/quick-scan`; the page exposed descriptive related-guide links. No runtime error was observed.

A rendered-document check on `/pricing` at the browser’s 1280×1100 CSS viewport found document width 1265px and body width 1265px, with no page-level horizontal overflow beyond the scrollbar gutter. The page had one H1, one main landmark, an ordered H1/H2/H3 heading structure for the primary sections, and three `Learn why` links associated with locked features. The public page displayed the expected plan and upgrade content.
