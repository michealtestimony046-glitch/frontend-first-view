# Logo contrast bug verification

The original screenshot showed the pale `/qa-for-startups` header rendering the icon and green `QA` while the `MATRIX` wordmark was effectively invisible. The cause was the shared Logo component always applying the dark-theme `text-foreground` class to `MATRIX`, while the light page inherited a pale background.

The fix adds a `tone` prop to `Logo` with `dark` and `light` values. The special-topic header passes `tone="light"` for the `field-manual` and `launch-desk` variants, causing `MATRIX` to use the dark `#17201b` color while preserving the gradient `QA` mark.

Local browser verification on `http://127.0.0.1:8092/qa-for-startups` shows the full readable `MATRIX QA` wordmark in the pale header. The page still renders its launch-desk hero, CTA, and long-form content.

Local browser verification on `http://127.0.0.1:8092/web-application-testing` shows the same full readable `MATRIX QA` wordmark on the second pale light-theme page. The field-manual hero, test map, CTA, and long-form content continue to render.

Validation also passed with Prettier, ESLint, `pnpm build`, and `git diff --check`.
