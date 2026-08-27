#!/usr/bin/env node

const baseUrl = String(process.env.SMOKE_BASE_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const checks = [
  {
    path: "/",
    markers: ["<title", "Matrix QA", "Run your first scan"],
    label: "public landing page",
  },
  {
    path: "/sample-report",
    markers: ["<title", "Sample report", "Journey timeline"],
    label: "public sample report",
  },
  {
    path: "/auth?mode=signin&returnTo=%2Fapp",
    markers: ["<title", "Sign in"],
    label: "authentication shell",
  },
  {
    path: "/pricing",
    markers: ["<title", "Matrix QA Pricing", "Standard Adaptive", "Upgrade to Starter"],
    label: "pricing page",
  },
  {
    path: "/learn/matrix-units",
    markers: ["<title", "Matrix Units", "Live balance movement"],
    label: "Matrix Units guide",
  },
  {
    path: "/learn/quick-smoke-testing",
    markers: ["<title", "Quick Smoke", "Bounded by design"],
    label: "Quick Smoke guide",
  },
  {
    path: "/learn/standard-adaptive-testing",
    markers: ["<title", "Standard Adaptive", "Multi-viewport perspective"],
    label: "Standard Adaptive guide",
  },
  {
    path: "/learn/five-worker-qa-collaboration",
    markers: ["<title", "Five-Worker QA Collaboration", "One Coordinator"],
    label: "five-worker collaboration guide",
  },
  {
    path: "/learn/matrix-unit-top-ups",
    markers: ["<title", "Matrix Unit Top-Ups", "No simulated checkout"],
    label: "top-up guide",
  },
  {
    path: "/learn/quick-scan",
    markers: ["<title", "Quick Scan Website Preflight", "Leads, not verdicts"],
    label: "Quick Scan guide",
  },
];

const failures = [];
for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  try {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15_000) });
    const body = await response.text();
    const lowerBody = body.toLowerCase();
    const missing = check.markers.filter((marker) => !lowerBody.includes(marker.toLowerCase()));
    if (!response.ok || missing.length > 0) {
      failures.push({ label: check.label, url, status: response.status, missing });
      continue;
    }
    console.log(`PASS ${check.label} (${response.status}) ${response.url}`);
  } catch (error) {
    failures.push({
      label: check.label,
      url,
      status: "NETWORK_ERROR",
      missing: [error instanceof Error ? error.message : String(error)],
    });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: "FAIL", baseUrl, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify({ status: "PASS", baseUrl, checked: checks.map((check) => check.label) }, null, 2),
);
