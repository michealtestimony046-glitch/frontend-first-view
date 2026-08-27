# Launch positioning validation checkpoint

## Local SSR browser observations

- `http://127.0.0.1:4178/` rendered the updated `Matrix QA launch · Autonomous QA Worker` badge, `Before you ship.` hero line, authorized URL language, and the new `Product path` groups: `Available in launch`, `Available by plan or alpha`, and `Next frontier`.
- The homepage retained the requested evidence wording: `indisputable evidence`, `Full console stream`, and `exact millisecond`.
- The anonymous header rendered `Checking session…`; the session-aware header component was not edited.
- The homepage rendered all four Product path links and no visible Preview branding.
- `/faq` rendered launch-state plan and usage questions, the `Get started` CTA, and no visible Preview branding. The first FAQ answer was visible in the browser.
- `/about` rendered launch status and plan-qualified access wording, current-scope limitations, and no visible Preview branding.
- The browser pages loaded without visible horizontal clipping at the desktop viewport used by the sandbox browser.

## Additional local SSR observations

- `/pricing` rendered `Launch pricing`, Free and Starter plans, Matrix Unit language, qualified Pro and checkout limitations, and launch-safe CTAs. The anonymous header still rendered `Checking session…`; no Preview branding was visible.
- `/learn/quick-smoke-testing` rendered a valid title, canonical-ready public content, authorized/staging language, truthful bounded-scope caveats, working internal links to the new Product path destinations, and no Preview branding.

## Mobile visual checkpoint

The 390×844 homepage capture showed the launch badge, hero CTA stack, authorized-URL note, and first feature cards without visible horizontal clipping. The 390×844 FAQ capture showed a readable single-column accordion and reachable top navigation/CTA without horizontal clipping; the first answer remained legible within the viewport.

The 390×844 About capture reflowed the hero into one column with readable typography, stacked CTAs, and a bounded evidence card entering below the fold. The Quick Smoke capture also reflowed without clipping; its longer header CTA wraps to two lines but remains fully visible and usable, while the hero, primary CTA, and first feature card stay within the viewport.

## Interaction smoke results

The homepage Product path `Quick Smoke` link navigated safely to `/learn/quick-smoke-testing` without opening authentication or changing data. On `/faq`, the `What does Starter unlock?` accordion expanded successfully and rendered the launch-state answer describing $49/month, 980 Matrix Units, Standard Adaptive, and governed collaboration. No unsafe or mutating action was taken.
