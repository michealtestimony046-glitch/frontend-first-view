# Autonomous SEO/AEO Research and Implementation Record

## Scope

This record supports the autonomous public-site SEO/AEO work for Matrix QA on 25 August 2026. The approved public origin is `https://matrixqa.trlabs.tech`. The implementation must remain accurate to the current product and must not promise rankings, rich results, or AI citations.

## First-party findings

Google's generative AI search guidance says foundational SEO remains relevant because AI features retrieve from Google's Search index and use core ranking systems. It emphasizes unique, valuable, people-first content; clear organization; crawlability; semantic HTML; JavaScript SEO; page experience; and avoiding duplicate or scaled search-engine-first pages. It explicitly says that `llms.txt` and other special AI-only files are not needed for Google Search, that there is no ideal page length, and that structured data is not required for generative AI search.

Google's helpful-content guidance emphasizes original information, substantial coverage, descriptive headings, expertise, trust, first-hand experience, and the visitor's satisfaction. It warns against producing lots of pages mainly to attract search traffic, rewriting other sources without adding value, choosing topics without real expertise, and writing to a preferred word count.

Google's structured-data guidance says JSON-LD is supported and recommended, but markup must be crawlable, complete, relevant, accurate, up to date, and representative of visible page content. Structured data can make a page eligible for rich-result features but does not guarantee display or ranking.

Bing's AI Performance guidance measures total citations, average cited pages, grounding queries, page-level citation activity, and trends. It recommends strengthening subject depth and expertise, improving structure and clarity, supporting claims with evidence, keeping content fresh, and aligning text, images, and video. Citation counts are visibility measurements, not rankings.

## Implementation guardrails

The public topic cluster should be expanded only when a page serves a distinct audience or user question and has first-party product evidence. Direct-answer sections should be short, visible, and useful to visitors. FAQPage markup should use the same question-and-answer source that is visibly rendered on the page. Product capability claims must be limited to behavior shown in the frontend, backend, or worker code. Private app and auth routes must remain excluded from public discovery assets. No new AI-only file will be created solely for Google.

## Planned work

1. Audit current public routes, metadata, sitemap, robots, and internal-link graph.
2. Improve the highest-value gaps, prioritizing the homepage, pricing, sample report, and any route with weak direct answers or missing semantic context.
3. Avoid duplicating the existing topic-template pages when a new page would add only keyword variation.
4. Validate formatting, lint, build, SSR head and JSON-LD, live assets, mobile rendering, and representative public navigation.
5. Publish only validated code in a focused GitHub pull request. Do not merge the unrelated open PRs #176 or #177 as part of this work.

## References

1. [Google Search Central: Optimizing your website for generative AI features on Google Search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
2. [Google Search Central: Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
3. [Google Search Central: General Structured Data Guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
4. [Bing Webmaster Blog: Introducing AI Performance in Bing Webmaster Tools Public Preview](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)

## Search-intent observations

Current search results around automated browser testing cluster around several distinct intents: teams want to understand what a testing platform captures as evidence; developers want to compare framework execution with reporting and retention; buyers want to know whether tools support visual, accessibility, cross-browser, and CI workflows; and smaller teams want a low-setup path from a public URL to actionable findings.

The reviewed industry pages commonly lead with a direct definition, explain what is captured, show a workflow or comparison, and close with a product CTA. Their strongest differentiator is evidence context: screenshots or logs are more useful when tied to an action, expected result, timestamp, and outcome. Matrix QA can own that angle with first-party language already visible in its sample report and product pages, while avoiding claims about permanent retention, broad real-device coverage, CI gates, compliance certification, or arbitrary framework integrations unless those are confirmed in the implementation.

The resulting content direction is to strengthen existing high-value pages rather than create many keyword variants. `/pricing` should answer what is available during Preview and clearly separate directional roadmap pricing from current functionality. `/sample-report` should answer what a visitor can learn from the sample and what is deliberately not live. A new page is justified only if it serves a distinct user problem with first-party evidence, not merely a synonym for an existing topic page.

## Research references for search intent

5. [TestCollab: Playwright Testing Is Great — But It Doesn't Capture Test Evidence at Scale](https://testcollab.com/blog/playwright-testing-evidence-at-scale)
6. [Testsigma: Test Evidence — What It Is, Why, and How to Capture It](https://testsigma.com/blog/test-evidence/)
7. [ScreenshotEngine: Top Automated Website Testing Tools](https://www.screenshotengine.com/blog/automated-website-testing-tools)
8. [Chromatic: UI Review and Visual Testing Platform](https://www.chromatic.com/)

## Validated implementation outcome

The autonomous batch added a distinct `/about` page for entity context and product scope rather than another keyword variant. The page gives direct answers about what Matrix QA is, who operates it, what a browser report may contain, and what the product does not guarantee. It is linked from the homepage footer, included in the sitemap, and listed in `llm.txt` as an official source.

The existing `/pricing` page now separates current Public Preview availability from directional roadmap pricing with four visible, synchronized answer cards and matching FAQPage structured data. The existing `/sample-report` page now uses a more descriptive title and description and explains the fixed demonstration data, evidence package, and difference between the public sample and authenticated console. The `/faq` page title and description now reflect browser testing, evidence, Preview access, and safety intent. Homepage and pricing signup CTAs consistently use the canonical signup destination with `mode=signup` and `returnTo=/app`.

The new route and modified routes passed TypeScript, ESLint, production build, Prettier, and `git diff --check`. Local SSR validation found exactly one parseable JSON-LD graph per representative page, correct canonical URLs, FAQ counts that match visible questions, a 25-URL sitemap with `/about`, private-route exclusions, and the explicit OAI-SearchBot policy. The generated Nitro production preview served the built pages successfully. Narrow Chromium screenshots at 390×844 showed clean first-viewport rendering for the homepage, pricing, sample report, About, and FAQ routes without visible horizontal clipping or overlap. No unsupported ranking or answer-engine citation guarantee was added.
