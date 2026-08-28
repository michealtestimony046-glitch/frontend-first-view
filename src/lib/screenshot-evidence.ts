import type { RunScreenshot } from "./api-client";

export type ScreenshotPresentationMode = "BUG_FOCUS_ANNOTATED" | "STANDARD" | "WITHHELD";

export interface ScreenshotPresentation {
  mode: ScreenshotPresentationMode;
  screenshot: RunScreenshot | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  hasPrivacySafeSource: boolean;
}

/**
 * Selects the safest useful screenshot for the per-run Overview.
 *
 * The annotated derivative is preferred only when the backend explicitly marks
 * it applied and returns its URL. Otherwise the original sanitized frame is
 * used. Metadata without a usable URL remains WITHHELD rather than becoming a
 * broken image or an invented visual result.
 */
export function selectOverviewScreenshot(
  screenshots: RunScreenshot[] = [],
): ScreenshotPresentation {
  const annotated = screenshots.find(
    (shot) =>
      shot.annotationStatus === "APPLIED" &&
      typeof shot.annotatedUrl === "string" &&
      shot.annotatedUrl,
  );
  if (annotated) {
    return {
      mode: "BUG_FOCUS_ANNOTATED",
      screenshot: annotated,
      imageUrl: annotated.annotatedUrl || null,
      sourceUrl: annotated.url || null,
      hasPrivacySafeSource: Boolean(annotated.url),
    };
  }

  const standard = screenshots.find((shot) => typeof shot.url === "string" && shot.url);
  if (standard) {
    return {
      mode: "STANDARD",
      screenshot: standard,
      imageUrl: standard.url || null,
      sourceUrl: standard.url || null,
      hasPrivacySafeSource: true,
    };
  }

  return {
    mode: "WITHHELD",
    screenshot: screenshots[0] || null,
    imageUrl: null,
    sourceUrl: null,
    hasPrivacySafeSource: false,
  };
}
