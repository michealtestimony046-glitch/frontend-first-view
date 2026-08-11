// Mock fixtures for the v1 frontend.
// Actual data removed to allow backend integration while preserving architecture.

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

export type ConsoleEntry = {
  t: number;
  level: "log" | "warn" | "error";
  message: string;
  source?: string;
};

export type NetworkEntry = {
  t: number;
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  status: number;
  ms: number;
  size: string;
};

export type Screenshot = { t: number; label: string; url: string };

export type Bug = {
  id: string;
  title: string;
  severity: Severity;
  scenario: string;
  evidence: string;
  detectedAt: number;
};

export type RunDetail = RunSummary & {
  console: ConsoleEntry[];
  network: NetworkEntry[];
  screenshots: Screenshot[];
  bugs_list: Bug[];
  scenariosList: {
    id: string;
    name: string;
    status: RunStatus;
    steps: number;
    durationSec: number;
  }[];
};

export const project: Project = {
  id: "",
  name: "New Project",
  url: "",
  environment: "production",
  lastRunAt: "Never",
};

export const runs: RunSummary[] = [];

export const runDetail: RunDetail = {
  id: "",
  projectId: "",
  targetUrl: "",
  status: "queued",
  startedAt: "",
  durationSec: 0,
  bugs: 0,
  scenarios: 0,
  passed: 0,
  failed: 0,
  triggeredBy: "",
  console: [],
  network: [],
  screenshots: [],
  bugs_list: [],
  scenariosList: [],
};

// ---- Dashboard fixtures ---------------------------------------------------

export type DashboardStats = {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  deltaTotalPct: number;
};

export type FailurePoint = { day: string; failures: number };

export type TopIssue = {
  id: string;
  title: string;
  severity: "critical" | "functional" | "warning" | "info";
  occurrences: number;
  firstSeen: string;
};

export type LatestSummary = {
  runId: string;
  status: RunStatus;
  startedAt: string;
  browser: string;
  duration: string;
  steps: number;
  issues: number;
};

export function getDashboardStats(): DashboardStats {
  return { total: 0, passed: 0, failed: 0, warnings: 0, deltaTotalPct: 0 };
}

export function getFailureTrend(): FailurePoint[] {
  return [];
}

export function getTopIssues(): TopIssue[] {
  return [];
}

export function getLatestSummary(): LatestSummary {
  return { runId: "", status: "queued", startedAt: "", browser: "", duration: "", steps: 0, issues: 0 };
}

// ---- Billing / Preview fixtures ------------------------------------------

export const PREVIEW_CAP = 250;
const USAGE_KEY = "matrix_qa_mock_usage";

export type BillingUsage = {
  used: number;
  cap: number;
  cycleLabel: string;
  atCap: boolean;
  pct: number;
};

export function getBillingUsage(): BillingUsage {
  let used = 0;
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(USAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed)) used = Math.max(0, Math.min(PREVIEW_CAP, parsed));
  }
  return {
    used,
    cap: PREVIEW_CAP,
    cycleLabel: "Usage",
    atCap: used >= PREVIEW_CAP,
    pct: Math.round((used / PREVIEW_CAP) * 100),
  };
}

export function setMockUsage(next: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USAGE_KEY, String(Math.max(0, Math.min(PREVIEW_CAP, next))));
}

export const PREVIEW_INCLUSIONS: string[] = [
  "Browser Worker",
  "Sequential Browser Automation",
  "Screenshot Evidence",
  "Console Logs",
  "Network Logs",
  "Execution Timeline",
  "Bug Reports",
];

export type RoadmapItem = { version: string; title: string; current?: boolean };

export const ROADMAP: RoadmapItem[] = [
  { version: "V1", title: "Core Engine", current: true },
];

// ---- Workspace / user (session mock) --------------------------------------

export type Workspace = {
  id: string;
  name: string;
  role: "Owner" | "Admin" | "Member";
  planTier: string;
  current?: boolean;
};

export const currentUser = {
  id: "",
  name: "User",
  email: "",
  systemRole: "Member",
  initials: "U",
};

export const workspaces: Workspace[] = [
  { id: "default", name: "Default Workspace", role: "Owner", planTier: "Free", current: true },
];

// ---- Projects list (v1) ---------------------------------------------------

export type ProjectCard = {
  id: string;
  workspaceId: string;
  name: string;
  targetUrl: string;
  environment: "production" | "staging" | "local";
  status: "idle" | "running" | "active";
  totalVariants: number;
  lastRunHealth: number;
  lastRunAt: string;
};

export function getProjects(): ProjectCard[] {
  return [];
}

// ---- Issues (grouped bugs) ------------------------------------------------

export type IssueGroup = {
  id: string;
  title: string;
  severity: Severity;
  occurrences: number;
  affectedRuns: string[];
  firstSeen: string;
  lastSeen: string;
  scope: string;
  category: "runtime" | "network" | "selector" | "assertion";
};

export function getIssues(): IssueGroup[] {
  return [];
}

// ---- Audit log (noise gate suppressions) ----------------------------------

export type AuditEntry = {
  id: string;
  runId: string;
  ts: string;
  category: "console_warning" | "network_noise" | "visual_shift";
  message: string;
  source?: string;
  reason: string;
};

export function getAuditLog(): AuditEntry[] {
  return [];
}

// ---- Settings & Reports stubs --------------------------------------------

export type FeatureScope = {
  id: string | number;
  name: string;
  paths: string[];
  enabled: boolean;
};

export function getFeatureScopes(): FeatureScope[] {
  return [];
}

export type Persona = {
  role: string;
  identity: string;
  target: string;
};

export function getPersonas(): Persona[] {
  return [];
}

export type Report = {
  id: string;
  generatedAt: string;
  runId: string;
  status: string;
  confidenceScore: number;
  metrics: {
    passed: number;
    failed: number;
    warnings: number;
    totalMatrixPermutations: number;
  };
  groupedBugs: {
    id: string;
    severity: Severity;
    title: string;
    affected: string;
    endpoint?: string;
    reproMd: string;
  }[];
};

export function getLatestReport(): Report {
  return {
    id: "",
    generatedAt: "",
    runId: "",
    status: "",
    confidenceScore: 0,
    metrics: {
      passed: 0,
      failed: 0,
      warnings: 0,
      totalMatrixPermutations: 0,
    },
    groupedBugs: [],
  };
}
