import type { RunError, RunEvent, RunReport, RunScreenshot } from "./api-client";
import type { LiveRun } from "./live-data";
import type { LiveIssue } from "./live-data";

export type IssueSeverity = "critical" | "high" | "warning" | "info";
export type EvidenceKind =
  "interaction" | "visual" | "network" | "storage" | "dom" | "performance" | "console" | "scenario";
export type EvidenceTab = "overview" | "console" | "network" | "storage" | "performance" | "dom";

export interface IssueContext {
  runId: string;
  projectId?: string;
  scenario?: string;
  role?: string;
  device?: string;
  browser?: string;
  route?: string;
  viewport?: string;
}

export interface ReportIssue {
  id: string;
  title: string;
  severity: IssueSeverity;
  category: string;
  kind: EvidenceKind;
  summary: string;
  scope: string;
  occurrences: number;
  context: IssueContext;
  timestamp?: number;
  screenshot?: RunScreenshot;
  error?: RunError;
  evidence: {
    console: RunEvent[];
    network: RunEvent[];
    storage: unknown;
    performance: unknown;
    dom: unknown;
    scenario: unknown;
  };
  defaultTab: EvidenceTab;
  remediation?: string;
}

export interface ReportSummaryModel {
  runId: string;
  status: string;
  targetUrl?: string;
  durationSec?: number;
  healthScore: number | null;
  scenarios: { total: number; passed: number; failed: number; blocked: number };
  counts: Record<IssueSeverity, number>;
}

export interface NormalizedReport {
  summary: ReportSummaryModel;
  issues: ReportIssue[];
}

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

export function normalizeSeverity(value: unknown, fallback: IssueSeverity = "info"): IssueSeverity {
  const normalized = text(value, "").toLowerCase();
  if (normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "warning" || normalized === "medium") return "warning";
  if (normalized === "low" || normalized === "info") return "info";
  return fallback;
}

function kindFor(item: Record<string, unknown>, category: string): EvidenceKind {
  const value = `${text(item.kind, "")} ${text(item.type, "")} ${category}`.toLowerCase();
  if (/storage|persist|auth.?residue|contamination/.test(value)) return "storage";
  if (/performance|latency|asset|ttfb|slow/.test(value)) return "performance";
  if (/dom|sri|iframe|password|semantic|security|quick.?scan/.test(value)) return "dom";
  if (/network|http|api|resource|request/.test(value)) return "network";
  if (/console|exception|runtime|pageerror/.test(value)) return "console";
  if (/visual|layout|image|render/.test(value)) return "visual";
  if (/scenario|step|assertion/.test(value)) return "scenario";
  return typeof item.x === "number" || typeof item.y === "number" ? "interaction" : "console";
}

function defaultTabFor(kind: EvidenceKind): EvidenceTab {
  if (kind === "network") return "network";
  if (kind === "storage") return "storage";
  if (kind === "performance") return "performance";
  if (kind === "dom") return "dom";
  return "console";
}

function severityFor(item: Record<string, unknown>, kind: EvidenceKind): IssueSeverity {
  const explicit = normalizeSeverity(item.severity, "info");
  if (item.severity !== undefined) return explicit;
  const status = Number(item.status);
  if (kind === "interaction" || kind === "console" || status >= 500) return "critical";
  if (kind === "network" || kind === "storage" || status >= 400) return "high";
  if (kind === "visual" || kind === "dom" || kind === "performance") return "warning";
  return explicit;
}

function screenshotFor(
  report: RunReport,
  item: Record<string, unknown>,
): RunScreenshot | undefined {
  const filename = text(item.filename ?? item.screenshot ?? item.evidenceRef, "");
  if (filename)
    return report.screenshots?.find(
      (shot) => shot.filename === filename || shot.annotatedFilename === filename,
    );
  if (typeof item.x === "number" || typeof item.y === "number")
    return (
      report.screenshots?.find((shot) => shot.annotationStatus === "APPLIED") ??
      report.screenshots?.[0]
    );
  return undefined;
}

function issueFrom(
  run: LiveRun,
  report: RunReport,
  raw: unknown,
  index: number,
  source: string,
): ReportIssue {
  const item = record(raw);
  const category = text(item.category ?? item.subtype ?? item.type, source);
  const kind = kindFor(item, category);
  const title = text(item.title ?? item.message ?? item.error ?? item.code, "Unlabelled finding");
  const error = source === "errors" ? (raw as RunError) : undefined;
  const id = text(
    item.id ?? item.fingerprint,
    `${run.id}-${source}-${index}-${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 48)}`,
  );
  const screenshot = screenshotFor(report, item);
  const event = (report.events ?? []).filter((entry) => {
    const haystack = `${entry.type} ${entry.message ?? ""} ${entry.url ?? ""}`.toLowerCase();
    return (
      haystack.includes(title.toLowerCase().slice(0, 24)) ||
      haystack.includes(category.toLowerCase())
    );
  });
  const persistence = record(report.metadata?.persistence);
  const performance = record(report.metadata?.performance);
  const defaultTab = defaultTabFor(kind);
  return {
    id,
    title,
    severity: severityFor(item, kind),
    category,
    kind,
    summary: text(
      item.explanation ?? item.evidence ?? item.message,
      "Evidence-backed finding recorded during the run.",
    ),
    scope: text(item.target ?? item.url ?? item.scope, run.targetUrl),
    occurrences: Math.max(1, Number(item.occurrences ?? item.count ?? 1)),
    context: {
      runId: run.id,
      projectId: run.projectId,
      scenario: text(item.scenario ?? item.scenarioName, "") || undefined,
      role: text(item.role, "") || undefined,
      device: text(item.device, "") || undefined,
      browser: text(item.browser, "") || undefined,
      route: text(item.route, "") || undefined,
      viewport: text(item.viewport, "") || undefined,
    },
    timestamp: typeof item.timestamp === "number" ? item.timestamp : undefined,
    screenshot,
    error,
    evidence: {
      console: event,
      network: event,
      storage: item.storage ?? persistence,
      performance: item.performance ?? performance,
      dom: item.dom ?? item.snippet,
      scenario: item.scenarioResult ?? item.steps,
    },
    defaultTab,
    remediation: text(item.remediation ?? item.remediationNote, "") || undefined,
  };
}

export function normalizeReport(run: LiveRun, report: RunReport): NormalizedReport {
  const raw: Array<{ value: unknown; source: string }> = [];
  (report.errors ?? []).forEach((value) => raw.push({ value, source: "errors" }));
  const reportRecord = report as Record<string, unknown>;
  if (Array.isArray(reportRecord.issues))
    (reportRecord.issues as unknown[]).forEach((value) => raw.push({ value, source: "issues" }));
  const persistence = record(report.metadata?.persistence);
  if (Array.isArray(persistence.findings))
    (persistence.findings as unknown[]).forEach((value) =>
      raw.push({ value, source: "persistence" }),
    );
  const performance = record(report.metadata?.performance);
  if (Array.isArray(performance.findings))
    (performance.findings as unknown[]).forEach((value) =>
      raw.push({ value, source: "performance" }),
    );
  const issues = raw.map(({ value, source }, index) =>
    issueFrom(run, report, value, index, source),
  );
  const unique = [...new Map(issues.map((issue) => [issue.id, issue])).values()];
  const scenarios = report.v2Plan?.scenarios ?? [];
  const counts = unique.reduce(
    (acc, issue) => ({ ...acc, [issue.severity]: acc[issue.severity] + 1 }),
    { critical: 0, high: 0, warning: 0, info: 0 },
  );
  const health = (report as Record<string, unknown>).confidenceScore;
  return {
    summary: {
      runId: run.id,
      status: report.status,
      targetUrl: run.targetUrl,
      durationSec: report.durationSec,
      healthScore: typeof health === "number" ? health : null,
      scenarios: {
        total: scenarios.length || report.scenarios || 0,
        passed:
          scenarios.filter(
            (scenario) => scenario.caseStatus === "PASSED" || scenario.status === "PASSED",
          ).length ||
          report.passed ||
          0,
        failed:
          scenarios.filter(
            (scenario) => scenario.caseStatus === "FAILED" || scenario.status === "FAILED",
          ).length ||
          report.failed ||
          0,
        blocked: scenarios.filter(
          (scenario) => scenario.caseStatus === "BLOCKED" || scenario.status === "BLOCKED",
        ).length,
      },
      counts,
    },
    issues: unique.sort(
      (a, b) =>
        ({ critical: 0, high: 1, warning: 2, info: 3 })[a.severity] -
          { critical: 0, high: 1, warning: 2, info: 3 }[b.severity] ||
        a.title.localeCompare(b.title),
    ),
  };
}

export function issuesForReports(runs: LiveRun[], reports: RunReport[]): ReportIssue[] {
  return reports.flatMap((report) => {
    const run = runs.find((item) => item.id === (report.runId ?? report.id));
    return run ? normalizeReport(run, report).issues : [];
  });
}

export function normalizeStandaloneReport(
  report: RunReport,
  runId: string,
  projectId?: string,
): NormalizedReport {
  const run = {
    id: runId,
    projectId: projectId ?? report.projectId ?? "",
    targetUrl: report.targetUrl ?? "",
    status: report.status,
    createdAt: report.startedAt ?? new Date().toISOString(),
  } as LiveRun;
  return normalizeReport(run, report);
}

export function normalizeLiveIssue(issue: LiveIssue): ReportIssue {
  const kind = kindFor({ category: issue.category, message: issue.message }, issue.category);
  return {
    id: issue.id,
    title: issue.title,
    severity: normalizeSeverity(issue.severity),
    category: issue.category,
    kind,
    summary: issue.message,
    scope: issue.scope,
    occurrences: issue.occurrences,
    context: { runId: issue.reportId, projectId: issue.projectId },
    evidence: {
      console: [],
      network: [],
      storage: undefined,
      performance: undefined,
      dom: undefined,
      scenario: undefined,
    },
    defaultTab: defaultTabFor(kind),
  };
}
