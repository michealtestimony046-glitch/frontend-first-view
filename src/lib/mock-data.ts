// Legacy data-shape helpers retained only where older screens still import these types.
// No user, workspace, project, run, issue, audit, report, or billing records are mocked here.

export type RunStatus = "passed" | "failed" | "running" | "queued";
export type Severity = "critical" | "high" | "medium" | "low";

export type Project = {
  id: string;
  name: string;
  url: string;
  environment: "production" | "staging" | "local";
  lastRunAt: string;
};

export type RunSummary = {
  id: string;
  projectId: string;
  targetUrl: string;
  status: RunStatus;
  startedAt: string;
  durationSec: number;
  bugs: number;
  scenarios: number;
  passed: number;
  failed: number;
  triggeredBy: string;
};

export type ConsoleEntry = { t: number; level: "log" | "warn" | "error"; message: string; source?: string };
export type NetworkEntry = { t: number; method: "GET" | "POST" | "PUT" | "DELETE"; url: string; status: number; ms: number; size: string };
export type Screenshot = { t: number; label: string; url: string };
export type Bug = { id: string; title: string; severity: Severity; scenario: string; evidence: string; detectedAt: number };

export type RunDetail = RunSummary & {
  console: ConsoleEntry[];
  network: NetworkEntry[];
  screenshots: Screenshot[];
  bugs_list: Bug[];
  scenariosList: { id: string; name: string; status: RunStatus; steps: number; durationSec: number }[];
};

export const project: Project = { id: "", name: "", url: "", environment: "production", lastRunAt: "" };
export const runs: RunSummary[] = [];
export const runDetail: RunDetail = {
  id: "", projectId: "", targetUrl: "", status: "queued", startedAt: "", durationSec: 0,
  bugs: 0, scenarios: 0, passed: 0, failed: 0, triggeredBy: "",
  console: [], network: [], screenshots: [], bugs_list: [], scenariosList: [],
};

export type DashboardStats = { total: number; passed: number; failed: number; warnings: number; deltaTotalPct: number };
export type FailurePoint = { day: string; failures: number };
export type TopIssue = { id: string; title: string; severity: "critical" | "functional" | "warning" | "info"; occurrences: number; firstSeen: string };
export type LatestSummary = { runId: string; status: RunStatus; startedAt: string; browser: string; duration: string; steps: number; issues: number };

export function getDashboardStats(): DashboardStats { return { total: 0, passed: 0, failed: 0, warnings: 0, deltaTotalPct: 0 }; }
export function getFailureTrend(): FailurePoint[] { return []; }
export function getTopIssues(): TopIssue[] { return []; }
export function getLatestSummary(): LatestSummary { return { runId: "", status: "queued", startedAt: "", browser: "", duration: "", steps: 0, issues: 0 }; }

export const PREVIEW_CAP = 250;
export type BillingUsage = { used: number; cap: number; cycleLabel: string; atCap: boolean; pct: number };
export function getBillingUsage(): BillingUsage { return { used: 0, cap: PREVIEW_CAP, cycleLabel: "Usage", atCap: false, pct: 0 }; }
export function setMockUsage(_next: number) { /* legacy no-op */ }
export const PREVIEW_INCLUSIONS: string[] = [];
export type RoadmapItem = { version: string; title: string; current?: boolean };
export const ROADMAP: RoadmapItem[] = [];

// Kept only for compatibility with older imports. Real identity/workspaces come from the backend.
export type Workspace = { id: string; name: string; role: "Owner" | "Admin" | "Member"; planTier: string; current?: boolean };
export const currentUser = { id: "", name: "", email: "", systemRole: "", initials: "" };
export const workspaces: Workspace[] = [];

export type ProjectCard = {
  id: string; workspaceId: string; name: string; targetUrl: string;
  environment: "production" | "staging" | "local"; status: "idle" | "running" | "active";
  totalVariants: number; lastRunHealth: number; lastRunAt: string;
};
export function getProjects(): ProjectCard[] { return []; }

export type IssueGroup = { id: string; title: string; severity: Severity; occurrences: number; affectedRuns: string[]; firstSeen: string; lastSeen: string; scope: string; category: "runtime" | "network" | "selector" | "assertion" };
export function getIssues(): IssueGroup[] { return []; }
export type AuditEntry = { id: string; runId: string; ts: string; category: "console_warning" | "network_noise" | "visual_shift"; message: string; source?: string; reason: string };
export function getAuditLog(): AuditEntry[] { return []; }
export type FeatureScope = { id: string | number; name: string; paths: string[]; enabled: boolean };
export function getFeatureScopes(): FeatureScope[] { return []; }
export type Persona = { role: string; identity: string; target: string };
export function getPersonas(): Persona[] { return []; }
export type Report = { id: string; generatedAt: string; runId: string; status: string; confidenceScore: number; metrics: { passed: number; failed: number; warnings: number; totalMatrixPermutations: number }; groupedBugs: { id: string; severity: Severity; title: string; affected: string; endpoint?: string; reproMd: string }[] };
export function getLatestReport(): Report { return { id: "", generatedAt: "", runId: "", status: "", confidenceScore: 0, metrics: { passed: 0, failed: 0, warnings: 0, totalMatrixPermutations: 0 }, groupedBugs: [] }; }
