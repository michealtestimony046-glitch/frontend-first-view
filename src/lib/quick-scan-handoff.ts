import type { OnboardingQuickScanResult, QuickScanHandoffRequest } from "@/lib/api-client";

/**
 * Convert a completed structural Quick Scan into bounded run context.
 * Deterministic findings are authoritative for the DOM property measured by
 * Quick Scan; the browser worker remains authoritative for interactive behavior,
 * mutations, visual layout, and real-user behavior.
 */
export function toQuickScanHandoff(
  result: OnboardingQuickScanResult | null | undefined,
): QuickScanHandoffRequest | undefined {
  if (!result || result.status !== "COMPLETED") return undefined;

  return {
    source: "ONBOARDING_QUICK_SCAN",
    targetUrl: result.targetUrl,
    finalUrl: result.finalUrl,
    targetOrigin: result.targetOrigin,
    httpStatus: result.httpStatus,
    checkedAt: result.checkedAt,
    summary: result.summary,
    summaryStatus: result.summaryStatus,
    findings: result.findings.slice(0, 20).map((finding, index) => ({
      id: `quick-scan:${finding.code}:${index + 1}`,
      category: finding.category,
      code: finding.code,
      title: finding.title,
      evidence: finding.evidence,
    })),
  };
}
