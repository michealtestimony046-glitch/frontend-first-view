# Matrix QA AEO research notes

## Google Search Central: generative AI features

Source: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

Google’s guidance treats generative AI search as part of Search rather than a separate optimization system. Foundational SEO still matters: crawlability, indexable content, useful page experience, clear organization, and helpful people-first content. Google specifically recommends non-commodity content with unique expert or experienced insight, clear paragraphs and headings, and relevant high-quality images or video where they help the user.

Google warns against creating pages for every conceivable query variation simply to manipulate rankings or generative responses. Quantity is not a substitute for quality, and scaled content created mainly for ranking can fall under spam policies. There is no special “AI search” markup that guarantees inclusion.

AEO implication for Matrix QA: write direct answers for real product questions, retain detailed supporting explanations, publish first-party product boundaries, use visible evidence and screenshots where available, and avoid pretending `llm.txt` or schema guarantees AI citations.

## Google Search Central: structured data

Source: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data

Structured data provides explicit clues about the meaning of visible page content and can help search engines understand entities and page classifications. Google recommends JSON-LD as the easiest format to maintain. Structured data must describe content visible on the page; blank pages or hidden claims should not be marked up. Complete and accurate properties are more valuable than a large amount of incomplete or inaccurate markup.

AEO implication for Matrix QA: add a small, accurate JSON-LD graph to public pages using only visible facts, such as Organization, WebSite, WebPage, BreadcrumbList, and FAQPage where the FAQ content is visible. Use `sameAs` only for real official profiles. Treat schema as a semantic aid, not an AI-citation mechanism.

## Research boundaries

The public `llm.txt` file can be maintained as a helpful discovery and source-preference document, but it is not a guarantee of indexing or answer-engine citation. The implementation should prioritize crawlable HTML, clear answer sections, visible facts, consistent entity naming, canonical URLs, internal links, and measurable search-console outcomes.

## Bing Webmaster Tools: AI Performance

Source: https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview

Bing’s AI Performance preview reports total citations, average cited pages, grounding queries, page-level citation activity, and trends across supported AI experiences. Bing explicitly says citation counts do not indicate ranking, authority, or placement. It recommends improving depth, structure, clarity, evidence, freshness, and consistency across text, images, and video. Bing also says it respects robots.txt and other content-owner controls, and presents IndexNow as a way to notify participating engines about updates.

AEO implication for Matrix QA: create pages that answer specific questions in visible HTML, keep claims and visuals consistent, refresh route metadata and sitemap dates when content changes, and measure citations rather than assuming them.

## OpenAI crawler controls

Source: https://developers.openai.com/api/docs/bots

OpenAI documents OAI-SearchBot as the crawler used to surface websites in ChatGPT search features. It is independent from GPTBot, which relates to training use. OpenAI says sites that disallow OAI-SearchBot will not be shown in ChatGPT search answers, although they may still appear as navigational links. Robots.txt changes may take approximately 24 hours to adjust.

AEO implication for Matrix QA: robots.txt should intentionally allow OAI-SearchBot if the business wants search visibility, while keeping private application routes disallowed. Any GPTBot policy should be a deliberate legal and product decision rather than a guessed AEO tactic. The current implementation must not claim that allowing a crawler guarantees citation.

## Evidence-based implementation plan

1. Keep the public guide cluster crawlable and link every public guide from at least one hub or related-guide block.
2. Add accurate JSON-LD for Organization, WebSite, WebPage, BreadcrumbList, and visible FAQPage content where applicable.
3. Use stable entity naming: Matrix QA is the product, Tr Labs is the operating entity, and Mia is the authenticated product guide.
4. Improve direct-answer blocks and visible “what it is / what it is not” sections rather than adding pages for keyword variations alone.
5. Review robots.txt for Googlebot, Bingbot, OAI-SearchBot, and GPTBot policy explicitly; do not block search crawlers by accident.
6. Maintain sitemap freshness and use Search Console/Bing Webmaster Tools to measure impressions and citations after deployment.

## Google: AI Features and Your Website

Source: https://developers.google.com/search/docs/appearance/ai-features

Google states that there are no additional technical requirements or special optimizations needed to appear in AI Overviews or AI Mode beyond the normal requirements for inclusion in Google Search. Google specifically says sites do not need to create new machine-readable files, AI text files, or special schema.org markup for these features. Its guidance points back to foundational SEO, Search technical requirements, helpful content, images, internal links, and Search Console measurement.

AEO implication for Matrix QA: `llm.txt` should be treated as an optional supplemental discovery document, not a ranking mechanism. The highest-value implementation is crawlable, human-readable, accurate public HTML with clear entities, direct answers, strong internal links, and measurable performance. Do not add speculative AI-only markup.

## Google: general structured-data policies

Source: https://developers.google.com/search/docs/appearance/structured-data/sd-policies

Structured data must be representative of the page’s main content, not hidden from users, relevant to the page, complete, and accurate. Google’s guidelines distinguish valid markup from eligibility for a rich-result feature; structured data does not guarantee a special search appearance. JSON-LD is the maintainable format recommended by Google’s structured-data introduction.

AEO implication for Matrix QA: add JSON-LD only for entities and content visibly present on each page. FAQPage markup must match visible FAQ answers exactly. Avoid marking up unsupported reviews, ratings, products, offers, or organizational facts that are not shown in the rendered page.

## Implementation completed on 25 August 2026

The public site now emits one SSR JSON-LD graph per public page through `seoHead`. The graph identifies Tr Labs, Matrix QA, the website, the current page, and the page breadcrumb. FAQPage markup is added only where the page visibly renders the same FAQ questions and answers: `/faq`, `/features`, `/how-it-works`, `/automated-browser-testing`, all six original topic guides, the three special-topic guides, the four final topic guides, and `/mia`. Route-level configuration reuses the same arrays rendered in the page so structured data cannot silently drift from visible copy.

The homepage metadata now states the product’s actual browser-journey and evidence workflow in a concise title and description. The public guide shell exposes links to the full topic cluster, including the final four pages. `robots.txt` explicitly allows `OAI-SearchBot` while preserving `/app` and `/auth` exclusions. `llm.txt` now labels itself as a supplemental discovery and source-preference document and expressly disclaims any guarantee of indexing, ranking, or citation. No speculative `ai.txt` file or GPTBot policy was added.

Validation covered formatting, ESLint, production build, whitespace, local SSR fetches, JSON parsing of the rendered JSON-LD, canonical URLs, title and description tags, FAQ-to-visible-content alignment, sitemap coverage, private-route exclusion, robots directives, and the llm.txt disclaimer. Production search performance and answer-engine citations still require measurement after deployment through Google Search Console, Bing Webmaster Tools AI Performance, and the relevant answer-engine experiences.

## References

[1]: https://developers.google.com/search/docs/appearance/ai-features "Google Search Central: AI Features and Your Website"
[2]: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide "Google Search Central: Optimizing Your Content for Generative AI Features"
[3]: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data "Google Search Central: Introduction to Structured Data Markup"
[4]: https://developers.google.com/search/docs/appearance/structured-data/sd-policies "Google Search Central: General Structured Data Guidelines"
[5]: https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview "Bing Webmaster Blog: Introducing AI Performance in Bing Webmaster Tools"
[6]: https://developers.openai.com/api/docs/bots "OpenAI: Overview of OpenAI Crawlers"
