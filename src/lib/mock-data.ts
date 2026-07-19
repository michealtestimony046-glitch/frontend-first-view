// Mock fixtures for the v1 frontend. No backend calls.

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
  t: number; // ms offset
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

export type Screenshot = {
  t: number;
  label: string;
  url: string;
};

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
  id: "prj_01",
  name: "Acme Cloud Console",
  url: "https://app.acme.dev",
  environment: "staging",
  lastRunAt: "2 min ago",
};

export const runs: RunSummary[] = [
  {
    id: "run_9f2c",
    projectId: "prj_01",
    targetUrl: "https://app.acme.dev",
    status: "failed",
    startedAt: "2 min ago",
    durationSec: 184,
    bugs: 3,
    scenarios: 12,
    passed: 9,
    failed: 3,
    triggeredBy: "manual",
  },
  {
    id: "run_9e4a",
    projectId: "prj_01",
    targetUrl: "https://app.acme.dev",
    status: "passed",
    startedAt: "1 hr ago",
    durationSec: 162,
    bugs: 0,
    scenarios: 12,
    passed: 12,
    failed: 0,
    triggeredBy: "manual",
  },
  {
    id: "run_9d17",
    projectId: "prj_01",
    targetUrl: "https://app.acme.dev/checkout",
    status: "failed",
    startedAt: "yesterday",
    durationSec: 213,
    bugs: 5,
    scenarios: 12,
    passed: 7,
    failed: 5,
    triggeredBy: "manual",
  },
  {
    id: "run_9c02",
    projectId: "prj_01",
    targetUrl: "https://app.acme.dev",
    status: "passed",
    startedAt: "2 days ago",
    durationSec: 155,
    bugs: 1,
    scenarios: 10,
    passed: 9,
    failed: 1,
    triggeredBy: "manual",
  },
];

export const runDetail: RunDetail = {
  ...runs[0],
  console: [
    { t: 420, level: "log", message: "[Auth] hydrating session…", source: "auth.ts:22" },
    { t: 812, level: "log", message: "GET /api/me 200", source: "network" },
    {
      t: 1240,
      level: "warn",
      message: "React key prop missing on <OrderRow />",
      source: "OrderList.tsx:88",
    },
    {
      t: 2611,
      level: "error",
      message:
        "Uncaught TypeError: Cannot read properties of undefined (reading 'total')",
      source: "CheckoutSummary.tsx:41",
    },
    {
      t: 2612,
      level: "error",
      message: "The above error occurred in the <CheckoutSummary> component.",
      source: "react-dom",
    },
    { t: 3120, level: "log", message: "Redirected to /checkout/error", source: "router" },
  ],
  network: [
    { t: 210, method: "GET", url: "/api/me", status: 200, ms: 84, size: "1.2 kB" },
    { t: 460, method: "GET", url: "/api/cart", status: 200, ms: 121, size: "4.8 kB" },
    {
      t: 1180,
      method: "POST",
      url: "/api/checkout/quote",
      status: 500,
      ms: 612,
      size: "0.3 kB",
    },
    {
      t: 2010,
      method: "POST",
      url: "/api/checkout/quote",
      status: 500,
      ms: 588,
      size: "0.3 kB",
    },
    { t: 3050, method: "GET", url: "/api/errors/log", status: 204, ms: 42, size: "0 B" },
  ],
  screenshots: [
    { t: 0, label: "Landing", url: "/screens/01-landing.svg" },
    { t: 1200, label: "Signed in", url: "/screens/02-dashboard.svg" },
    { t: 2400, label: "Checkout error", url: "/screens/03-error.svg" },
    { t: 3200, label: "Redirect", url: "/screens/04-redirect.svg" },
  ],
  bugs_list: [
    {
      id: "bug_a1",
      title: "Uncaught TypeError in <CheckoutSummary> when cart total is null",
      severity: "critical",
      scenario: "Guest checkout · desktop",
      evidence: "console + network 500",
      detectedAt: 2611,
    },
    {
      id: "bug_a2",
      title: "POST /api/checkout/quote returns HTTP 500",
      severity: "high",
      scenario: "Guest checkout · desktop",
      evidence: "network trace",
      detectedAt: 1180,
    },
    {
      id: "bug_a3",
      title: "Login form: submit button remains disabled after valid input",
      severity: "medium",
      scenario: "Login · mobile",
      evidence: "DOM assertion",
      detectedAt: 4520,
    },
  ],
  scenariosList: [
    { id: "s1", name: "Landing → Signup", status: "passed", steps: 6, durationSec: 12 },
    { id: "s2", name: "Login (valid)", status: "passed", steps: 4, durationSec: 8 },
    { id: "s3", name: "Login (invalid)", status: "passed", steps: 5, durationSec: 9 },
    { id: "s4", name: "Navigate primary menu", status: "passed", steps: 8, durationSec: 14 },
    { id: "s5", name: "Guest checkout", status: "failed", steps: 11, durationSec: 22 },
    { id: "s6", name: "Add to cart", status: "passed", steps: 5, durationSec: 10 },
    { id: "s7", name: "Search products", status: "passed", steps: 6, durationSec: 11 },
    { id: "s8", name: "Profile update form", status: "failed", steps: 9, durationSec: 18 },
    { id: "s9", name: "Password reset", status: "passed", steps: 7, durationSec: 15 },
    { id: "s10", name: "Contact form", status: "passed", steps: 4, durationSec: 7 },
    { id: "s11", name: "Newsletter signup", status: "passed", steps: 3, durationSec: 6 },
    { id: "s12", name: "Signout flow", status: "failed", steps: 3, durationSec: 5 },
  ],
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
  return { total: 12, passed: 7, failed: 3, warnings: 2, deltaTotalPct: 20 };
}

export function getFailureTrend(): FailurePoint[] {
  return [
    { day: "May 12", failures: 4 },
    { day: "May 13", failures: 6 },
    { day: "May 14", failures: 3 },
    { day: "May 15", failures: 2 },
    { day: "May 16", failures: 5 },
    { day: "May 17", failures: 6 },
    { day: "May 18", failures: 3 },
  ];
}

export function getTopIssues(): TopIssue[] {
  return [
    {
      id: "iss_01",
      title: "Login button not responding",
      severity: "critical",
      occurrences: 5,
      firstSeen: "May 12, 10:24 AM",
    },
    {
      id: "iss_02",
      title: "500 Internal Server Error on /api/checkout",
      severity: "critical",
      occurrences: 3,
      firstSeen: "May 13, 09:15 AM",
    },
    {
      id: "iss_03",
      title: "Selector failed: [data-cta='signup']",
      severity: "functional",
      occurrences: 4,
      firstSeen: "May 14, 11:42 AM",
    },
    {
      id: "iss_04",
      title: "Console warning: Deprecated API usage",
      severity: "warning",
      occurrences: 6,
      firstSeen: "May 15, 02:31 PM",
    },
    {
      id: "iss_05",
      title: "Font not loaded from CDN",
      severity: "info",
      occurrences: 2,
      firstSeen: "May 16, 04:22 PM",
    },
  ];
}

export function getLatestSummary(): LatestSummary {
  return {
    runId: "run_9f2c",
    status: "failed",
    startedAt: "May 18, 2026 10:24 AM",
    browser: "Chromium 128",
    duration: "3m 24s",
    steps: 12,
    issues: 2,
  };
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

/**
 * Mock usage counter. Reads an optional override from localStorage
 * (`matrix_qa_mock_usage`) so the frontend team can test the 250-run
 * lock-out state without a backend. Default: 87.
 */
export function getBillingUsage(): BillingUsage {
  let used = 87;
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(USAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed)) used = Math.max(0, Math.min(PREVIEW_CAP, parsed));
  }
  return {
    used,
    cap: PREVIEW_CAP,
    cycleLabel: "Preview pool",
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
  "Login Testing",
  "Signup Testing",
  "Navigation Testing",
  "Form Testing",
  "Screenshot Evidence",
  "Console Logs",
  "Network Logs",
  "Execution Timeline",
  "Bug Reports",
  "One Workspace",
  "One Project",
  "Community Support",
];

export type RoadmapItem = {
  version: string;
  title: string;
  current?: boolean;
};

export const ROADMAP: RoadmapItem[] = [
  { version: "V1", title: "Core Engine", current: true },
  { version: "V2", title: "Application Mapping" },
  { version: "V3", title: "Matrix Simulation" },
  { version: "V4", title: "Repair Packages" },
  { version: "V5", title: "SaaS Platform" },
  { version: "V6", title: "CLI" },
  { version: "V7", title: "GitHub" },
  { version: "V8", title: "AI Integrations" },
  { version: "V9", title: "Intelligent Quality" },
  { version: "V10", title: "Enterprise" },
];


