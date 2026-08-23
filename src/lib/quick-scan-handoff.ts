import type { OnboardingQuickScanResult, QuickScanHandoff } from "@/lib/api-client";

/**
 * Convert a completed structural Quick Scan into bounded browser-agent context.
 * The browser worker remains authoritative: every imported finding starts as an
 * unverified lead and can only be reconciled from evidence captured in the run.
 */
export function toQuickScanHandoff(
  result: OnboardingQuickScanResult | null | undefined,
): QuickScanHandoff | undefined {
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
      status: "UNVERIFIED_LEAD",
    })),
  };
}
