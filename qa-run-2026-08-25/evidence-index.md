# Evidence Index

| Evidence ID | Artifact | Route or scope | Viewport | What it supports | Integrity or limitation |
|---|---|---|---|---|---|
| DOM-0001 | `/tmp/seo-aeo-ssr/*.html` plus validator output | `/`, `/faq`, `/pricing`, `/sample-report`, `/about`, `/mia`, `/features`, sitemap, robots, llm.txt | SSR fetch | One JSON-LD graph per representative route; canonical URLs; FAQ counts matching visible questions; 25 sitemap URLs; private-route exclusions | Generated local artifacts; validator source is `/tmp/validate-seo-aeo.mjs` |
| SS-0001 | `/home/ubuntu/screenshots/127_0_0_1_2026-08-25_05-29-11_3852.webp` | `/` | 894×768 | Homepage hero, public CTAs, product sections, About footer link | Local development browser screenshot |
| SS-0002 | `/home/ubuntu/screenshots/127_0_0_1_2026-08-25_05-29-30_8730.webp` | `/about` | 894×768 | About entity definition, short-answer panel, visible internal links | Local development browser screenshot |
| SS-0003 | `/home/ubuntu/screenshots/127_0_0_1_2026-08-25_05-29-58_5797.webp` | `/sample-report` | 894×768 | Fixed demo disclosure, evidence metrics, direct-answer section | Local development browser screenshot |
| SS-0004 | `/home/ubuntu/screenshots/127_0_0_1_2026-08-25_05-30-14_8171.webp` | `/pricing` | 894×768 | Preview status, planned pricing separation, signup destination | Local development browser screenshot |
| SS-0005 | `/tmp/seo-aeo-mobile/about.png` | `/about` | 390×844 | Narrow layout reflow and readable first viewport | Local mobile Chromium screenshot |
| SS-0006 | `/tmp/seo-aeo-mobile/pricing.png` | `/pricing` | 390×844 | Narrow pricing hierarchy, pill wrapping, readable CTA | Local mobile Chromium screenshot |
| SS-0007 | `/home/ubuntu/screenshots/127_0_0_1_2026-08-25_05-31-14_6100.webp` | `/faq` | 894×768 | FAQ page title, eight-question structure, first answer expanded | Local development browser screenshot |
| SS-0008 | `/home/ubuntu/screenshots/127_0_0_1_2026-08-25_05-31-30_9777.webp` | `/faq` | 894×768 | Reversible second FAQ accordion interaction | Local development browser screenshot |
| CON-0001 | `/home/ubuntu/console_outputs/exec_result_2026-08-25_05-31-44_496.txt` | `/faq` | 894×768 | No page console errors observed in sanitized runtime inspection | Dev-server module entries with zero transfer size are not page failures |
| SS-0009 | `/tmp/seo-aeo-preview-mobile/about.png` | `/about` | 390×844 | Built Nitro preview mobile rendering | Local production-bundle screenshot |
| SS-0010 | `/tmp/seo-aeo-preview-mobile/sample.png` | `/sample-report` | 390×844 | Built Nitro preview sample-report mobile rendering | Local production-bundle screenshot |
