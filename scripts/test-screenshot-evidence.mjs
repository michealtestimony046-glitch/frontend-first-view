import assert from "node:assert/strict";
import { selectOverviewScreenshot } from "../src/lib/screenshot-evidence.ts";

const base = {
  filename: "frame-1.png",
  timestamp: 1200,
  label: "after login attempt",
};

const annotated = selectOverviewScreenshot([
  {
    ...base,
    url: "https://assets.example/full-sanitized.png",
    annotatedUrl: "https://assets.example/bug-focus.png",
    annotationStatus: "APPLIED",
    annotationBox: { x: 120, y: 220, width: 180, height: 48 },
    redactionStatus: "REDACTED",
  },
]);
assert.equal(annotated.mode, "BUG_FOCUS_ANNOTATED");
assert.equal(annotated.imageUrl, "https://assets.example/bug-focus.png");
assert.equal(annotated.sourceUrl, "https://assets.example/full-sanitized.png");
assert.equal(annotated.hasPrivacySafeSource, true);

const skippedAnnotation = selectOverviewScreenshot([
  {
    ...base,
    url: "https://assets.example/full-sanitized.png",
    annotatedUrl: "https://assets.example/stale-derivative.png",
    annotationStatus: "SKIPPED",
  },
]);
assert.equal(skippedAnnotation.mode, "STANDARD");
assert.equal(skippedAnnotation.imageUrl, "https://assets.example/full-sanitized.png");
assert.equal(skippedAnnotation.sourceUrl, "https://assets.example/full-sanitized.png");

const standard = selectOverviewScreenshot([
  {
    ...base,
    url: "https://assets.example/full-sanitized.png",
    redactionStatus: "SAFE",
  },
]);
assert.equal(standard.mode, "STANDARD");
assert.equal(standard.imageUrl, "https://assets.example/full-sanitized.png");
assert.equal(standard.hasPrivacySafeSource, true);

const withheld = selectOverviewScreenshot([
  {
    ...base,
    redactionStatus: "WITHHELD",
  },
]);
assert.equal(withheld.mode, "WITHHELD");
assert.equal(withheld.imageUrl, null);
assert.equal(withheld.hasPrivacySafeSource, false);

const empty = selectOverviewScreenshot([]);
assert.equal(empty.mode, "WITHHELD");
assert.equal(empty.screenshot, null);

console.log("screenshot evidence selector: 5 cases passed");
