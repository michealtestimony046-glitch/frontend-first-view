import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  
  Bell,
  Bug,
  CheckCircle2,
  ChevronRight,
  Download,
  Globe,
  HelpCircle,
  Play,
  RotateCw,
  XCircle,
  Eye,
  BarChart3,
  Chrome,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { runsApi, type RunReport, type RunStatus } from "@/lib/api-client";
import {
  formatLiveDate,
  formatLiveDuration,
  reportForRun,
  reportWarnings,
  runNumber,
  useLivePortfolio,
  type LiveIssue,
} from "@/lib/live-data";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Overview · Matrix QA" },
      { name: "description", content: "Test run overview and evidence." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppDashboard,
});

function AppDashboard() {
  const live = useLivePortfolio();
  const [url, setUrl] = useState(live.activeProject?.defaultTargetUrl ?? live.activeProject?.targetUrl ?? "https://portal.trlabs.tech/");
  const [showRunModal, setShowRunModal] = useState(false);
  const [utilityPanel, setUtilityPanel] = useState<"notifications" | "help" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const runs = live.runs;
  const issues = live.issues;
  const reports = live.reports;
  const latestRun = runs[0] ?? null;
  const latestReport = reportForRun(reports, latestRun?.id);
  const total = runs.length;
  const passed = runs.filter((run) => run.status === "COMPLETED").length;
  const failed = runs.filter((run) => run.status === "FAILED").length;
  const warnings = runs.reduce((sum, run) => sum + reportWarnings(reportForRun(reports, run.id)), 0);
  const stats = { total, passed, failed, warnings };
  const trend = buildFailureTrend(runs);
  const latest = {
    runId: latestRun?.id ?? "",
    status: statusFromApi(latestRun?.status),
    startedAt: latestRun ? formatLiveDate(latestRun.startedAt ?? latestRun.createdAt) : "—",
    duration: formatLiveDuration(latestReport?.durationSec),
    steps: Array.isArray(latestReport?.steps) ? latestReport.steps.length : 0,
    issues: latestReport?.bugs ?? latestReport?.summary?.bugCount ?? 0,
  };
  const usage = { used: total, cap: Number.POSITIVE_INFINITY, atCap: false };

  const downloadLatestReport = () => {
    if (!latestRun) return;
    const report = latestReport as RunReport | undefined;
    const lines = [
      `# Matrix QA run ${latestRun.id}`,
      "",
      `- Status: ${latestRun.status}`,
      `- Target URL: ${latestRun.targetUrl ?? "—"}`,
      `- Started: ${latestRun.startedAt ?? latestRun.createdAt ?? "—"}`,
      `- Duration: ${formatLiveDuration(report?.durationSec)}`,
      `- Bugs captured: ${report?.bugs ?? report?.summary?.bugCount ?? 0}`,
      `- Screenshots: ${(report?.screenshots ?? []).length}`,
      `- Events: ${(report?.events ?? []).length}`,
    ];
    if (latestRun.errorMessage || report?.errorMessage) {
      lines.push("", `> Diagnostic: ${latestRun.errorMessage ?? report?.errorMessage}`);
    }
    const errors = report?.errors ?? [];
    lines.push("", "## Hard errors");
    if (!errors.length) {
      lines.push("", "No hard errors captured.");
    } else {
      for (const error of errors) {
        lines.push("", `- ${error.subtype}: ${error.message}`);
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `matrixqa-dashboard-run-${latestRun.id}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  };

  const handleStartRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunError(null);
    if (!live.activeProject) {
      setRunError("Choose or create a project before starting a run.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await runsApi.triggerRun(live.activeProject.id, { targetUrl: url.trim() });
      setShowRunModal(false);
      window.location.href = `/app/runs/${response.id}?projectId=${encodeURIComponent(live.activeProject.id)}`;
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Failed to start run. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      {/* Page header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Here's what's happening with your projects.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setShowRunModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground btn-primary-glow transition-opacity hover:opacity-90"
          >
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Test Run</span>
            <span className="sm:hidden">New Run</span>
          </button>
          <div className="relative hidden sm:block">
            <button
              aria-label="Notifications"
              aria-expanded={utilityPanel === "notifications"}
              onClick={() => setUtilityPanel((current) => current === "notifications" ? null : "notifications")}
              className="inline-flex rounded-md border border-border bg-surface/60 p-2 text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
            </button>
            {utilityPanel === "notifications" && <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-md border border-border bg-popover p-3 text-xs shadow-2xl">
              <div className="font-medium text-foreground">No new notifications</div>
              <p className="mt-1 leading-5 text-muted-foreground">Run status and report changes appear here when the backend has new activity.</p>
            </div>}
          </div>
          <div className="relative hidden sm:block">
            <button
              aria-label="Help"
              aria-expanded={utilityPanel === "help"}
              onClick={() => setUtilityPanel((current) => current === "help" ? null : "help")}
              className="inline-flex rounded-md border border-border bg-surface/60 p-2 text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            {utilityPanel === "help" && <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-md border border-border bg-popover p-3 text-xs shadow-2xl">
              <div className="font-medium text-foreground">Matrix QA v1 help</div>
              <p className="mt-1 leading-5 text-muted-foreground">Create a project, queue a browser run, then review terminal evidence in Reports. Video processing is still being stabilized.</p>
              <Link to="/app/settings" className="mt-2 inline-flex text-primary hover:underline">Open Settings</Link>
            </div>}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Test Runs"
          value={stats.total}
          icon={BarChart3}
          tone="neutral"
          hint="Live backend total"
        />
        <StatCard
          label="Passed"
          value={stats.passed}
          icon={CheckCircle2}
          tone="success"
          hint={`${percent(stats.passed, stats.total)}% of total`}
        />
        <StatCard
          label="Failed"
          value={stats.failed}
          icon={XCircle}
          tone="danger"
          hint={`${percent(stats.failed, stats.total)}% of total`}
        />
        <StatCard
          label="Warnings"
          value={stats.warnings}
          icon={AlertTriangle}
          tone="warning"
          hint={`${stats.warnings} retained events`}
        />
      </div>

      {/* Recent runs + Failure trend */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Recent test runs */}
        <section className="surface-card overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-base font-semibold">
              Recent Test Runs
            </h2>
            <Link
              to="/app/runs"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:opacity-80"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </header>

          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="grid grid-cols-[60px_minmax(0,1fr)_92px_84px_74px_16px] items-center gap-3 border-b border-border bg-surface-2/40 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground xl:grid-cols-[60px_minmax(0,1fr)_92px_100px_84px_74px_16px]">
              <span>Run</span>
              <span>Project</span>
              <span>Status</span>
              <span className="hidden xl:block">Browser</span>
              <span>Started</span>
              <span>Duration</span>
              <span />
            </div>
            <ul>
              {runs.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Link
                    to="/app/runs/$runId"
                    params={{ runId: r.id }}
                    search={{ projectId: r.projectId }}
                    className="group grid grid-cols-[60px_minmax(0,1fr)_92px_84px_74px_16px] items-center gap-3 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-accent/30 xl:grid-cols-[60px_minmax(0,1fr)_92px_100px_84px_74px_16px]"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{runNumber(runs, r.id)}</span>
                    <span className="truncate text-sm text-foreground">{r.project.name}</span>
                    <StatusPill status={statusFromApi(r.status)} />
                    <span className="hidden items-center gap-1.5 text-xs text-muted-foreground xl:flex">
                      <Chrome className="h-3.5 w-3.5" /> Chromium
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{formatLiveDate(r.startedAt ?? r.createdAt)}</span>
                    <span className="font-mono text-xs text-foreground">{formatLiveDuration(reportForRun(reports, r.id)?.durationSec)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-border md:hidden">
            {runs.slice(0, 6).map((r) => (
              <li key={r.id}>
                <Link
                  to="/app/runs/$runId"
                  params={{ runId: r.id }}
                  search={{ projectId: r.projectId }}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{runNumber(runs, r.id)}</span>
                      <span className="truncate text-sm text-foreground">{r.project.name}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{formatLiveDate(r.startedAt ?? r.createdAt)}</span>
                      <span>·</span>
                      <span className="font-mono">{formatLiveDuration(reportForRun(reports, r.id)?.durationSec)}</span>
                    </div>
                  </div>
                  <StatusPill status={statusFromApi(r.status)} />
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Failure trend */}
        <section className="surface-card flex flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold">
                Failure Trend
              </h2>
              <p className="text-[11px] text-muted-foreground">Last 7 days</p>
            </div>
          </header>
          <div className="h-[200px] px-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.68 0.22 22)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.68 0.22 22)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="oklch(0.68 0.02 250)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.68 0.02 250)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={24}
                />
                <Tooltip
                  cursor={{ stroke: "oklch(1 0 0 / 0.1)" }}
                  contentStyle={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                />
                <Area
                  type="monotone"
                  dataKey="failures"
                  stroke="oklch(0.68 0.22 22)"
                  strokeWidth={2}
                  fill="url(#failGrad)"
                  dot={{ r: 3, fill: "oklch(0.68 0.22 22)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto flex items-end justify-between border-t border-border px-5 py-4">
            <div>
              <div className="text-[11px] text-muted-foreground">
                Total Failures
              </div>
              <div className="font-display text-2xl font-semibold">
                {trend.reduce((a, p) => a + p.failures, 0)}
              </div>
            </div>
            <span className="font-mono text-[11px] text-success">
              ↑ 33% vs last 7 days
            </span>
          </div>
        </section>
      </div>

      {/* Top issues + Run summary */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="surface-card overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold">
                Top Issues
              </h2>
              <p className="text-[11px] text-muted-foreground">Last 7 days</p>
            </div>
            <Link
              to="/app/issues"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:opacity-80"
            >
              View all Issues <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </header>

          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="grid grid-cols-[minmax(0,1fr)_110px_100px_140px] items-center gap-3 border-b border-border bg-surface-2/40 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Issue</span>
              <span>Severity</span>
              <span>Occurrences</span>
              <span>First Seen</span>
            </div>
            <ul>
              {issues.slice(0, 6).map((i) => (
                <li
                  key={i.id}
                  className="grid grid-cols-[minmax(0,1fr)_110px_100px_140px] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <SeverityDot severity={i.severity} />
                    <span className="truncate text-sm text-foreground">
                      {i.title}
                    </span>
                  </div>
                  <SeverityPill severity={i.severity} />
                  <span className="text-sm text-foreground">
                    {i.occurrences}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {i.firstSeen}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-border md:hidden">
            {issues.slice(0, 6).map((i) => (
              <li key={i.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <SeverityDot severity={i.severity} className="mt-1" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground">{i.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <SeverityPill severity={i.severity} />
                      <span>{i.occurrences} occurrences</span>
                      <span>·</span>
                      <span>{i.firstSeen}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border bg-surface-2/40 px-5 py-2.5 text-[11px] text-muted-foreground">
            <LegendDot severity="critical" label="Critical" />
            <LegendDot severity="high" label="High" />
            <LegendDot severity="medium" label="Medium" />
            <LegendDot severity="low" label="Low" />
          </div>
        </section>

        {/* Run summary */}
        <section className="surface-card overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-base font-semibold">
              {latest.runId ? `Run ${latest.runId.slice(-4).toUpperCase()} Summary` : "Latest Run Summary"}
            </h2>
            {latest.runId ? (
              <Link
                to="/app/runs/$runId"
                params={{ runId: latest.runId }}
                search={{ projectId: latestRun?.projectId ?? "" }}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:opacity-80"
              >
                View Details <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </header>
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Status
                </div>
                <div className="mt-1.5">
                  <StatusPill status={latest.status} />
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Started
                </div>
                <div className="mt-1.5 text-sm text-foreground">
                  {latest.startedAt}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Browser" value="Chromium" icon={Chrome} />
              <MiniStat label="Duration" value={latest.duration} />
              <MiniStat label="Steps" value={String(latest.steps)} />
              <MiniStat label="Issues" value={String(latest.issues)} />
            </div>

            <div>
              <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {latest.runId ? (
                  <Link
                    to="/app/runs/$runId"
                    params={{ runId: latest.runId }}
                    search={{ projectId: latestRun?.projectId ?? "" }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground btn-primary-glow"
                  >
                    <Eye className="h-4 w-4" />
                    View Full Report
                  </Link>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">No runs yet</span>
                )}
                <button
                  type="button"
                  onClick={downloadLatestReport}
                  disabled={!latestRun || !latestReport}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRunError(null);
                  setUrl(latestRun?.targetUrl ?? live.activeProject?.defaultTargetUrl ?? live.activeProject?.targetUrl ?? "https://portal.trlabs.tech/");
                  setShowRunModal(true);
                }}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                <RotateCw className="h-4 w-4" />
                Rerun Test
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* New Run modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="surface-card w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Play className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">
                    New Test Run
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Sequential login, signup, navigation, forms.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRunModal(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={handleStartRun}
              className="space-y-3 p-5"
            >
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Target URL
                </span>
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-app.com"
                    className="w-full rounded-md border border-border bg-surface-2/60 py-2.5 pl-9 pr-3 font-mono text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </label>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {["login", "signup", "navigation", "forms"].map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-foreground/80"
                  >
                    {s}
                  </span>
                ))}
              </div>
              {runError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {runError}
                </div>
              )}
              {usage.atCap ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  <div className="font-semibold">Preview pool exhausted</div>
                  <div className="mt-0.5 text-destructive/80">
                    You've used {usage.used} / {usage.cap} runs. Contact the Matrix QA team through your agreed internal channel to review additional Preview capacity.
                  </div>
                  <Link
                    to="/app/settings/billing"
                    onClick={() => setShowRunModal(false)}
                    className="mt-2 inline-flex items-center gap-1 font-medium text-destructive underline"
                  >
                    Go to Billing →
                  </Link>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground">
                  {usage.used} / {usage.cap} runs used in this Preview pool.
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  disabled={isSubmitting}
                  className="rounded-md border border-border bg-surface/60 px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={usage.atCap || isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground btn-primary-glow disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <Play className="h-3.5 w-3.5" /> Start run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function statusFromApi(value: string | undefined): RunStatus {
  const normalized = String(value ?? "PENDING").toLowerCase();
  if (normalized === "completed") return "passed";
  if (normalized === "failed") return "failed";
  if (normalized === "running") return "running";
  return "queued";
}

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function buildFailureTrend(runs: Array<{ status: string; startedAt?: string | null; createdAt?: string }>) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  return days.map((date) => {
    const day = date.toLocaleDateString(undefined, { weekday: "short" });
    const failures = runs.filter((run) => {
      if (run.status !== "FAILED") return false;
      const started = run.startedAt ?? run.createdAt;
      const parsed = started ? new Date(started) : null;
      return parsed && parsed.toDateString() === date.toDateString();
    }).length;
    return { day, failures };
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  hint,
}: {
  label: string;
  value: number | string;
  icon: typeof Activity;
  tone: "neutral" | "success" | "danger" | "warning";
  hint?: string;
}) {
  const toneMap = {
    neutral: "bg-info/15 text-info",
    success: "bg-success/15 text-success",
    danger: "bg-destructive/15 text-destructive",
    warning: "bg-warning/15 text-warning",
  } as const;
  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tracking-tight">
        {value}
      </div>
      {hint && (
        <div
          className={`mt-1 font-mono text-[11px] ${
            tone === "success"
              ? "text-success"
              : tone === "danger"
                ? "text-destructive"
                : tone === "warning"
                  ? "text-warning"
                  : "text-muted-foreground"
          }`}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Activity;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-2/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value}
      </div>
    </div>
  );
}

const severityMap: Record<
  LiveIssue["severity"],
  { dot: string; pill: string; label: string }
> = {
  critical: {
    dot: "bg-destructive",
    pill: "bg-destructive/15 text-destructive border-destructive/30",
    label: "Critical",
  },
  high: {
    dot: "bg-warning",
    pill: "bg-warning/15 text-warning border-warning/30",
    label: "High",
  },
  medium: {
    dot: "bg-info",
    pill: "bg-info/15 text-info border-info/30",
    label: "Medium",
  },
  low: {
    dot: "bg-muted-foreground",
    pill: "bg-muted text-muted-foreground border-border",
    label: "Low",
  },
};

function SeverityDot({
  severity,
  className = "",
}: {
  severity: LiveIssue["severity"];
  className?: string;
}) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${severityMap[severity].dot} ${className}`}
    />
  );
}

function SeverityPill({ severity }: { severity: LiveIssue["severity"] }) {
  const s = severityMap[severity];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${s.pill}`}
    >
      {s.label}
    </span>
  );
}

function LegendDot({
  severity,
  label,
}: {
  severity: LiveIssue["severity"];
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${severityMap[severity].dot}`} />
      {label}
    </span>
  );
}

export function StatusPill({ status }: { status: RunStatus }) {
  const map = {
    passed: {
      cls: "bg-success/15 text-success border-success/30",
      icon: CheckCircle2,
      label: "Passed",
    },
    failed: {
      cls: "bg-destructive/15 text-destructive border-destructive/30",
      icon: XCircle,
      label: "Failed",
    },
    running: {
      cls: "bg-primary/15 text-primary border-primary/40",
      icon: Activity,
      label: "Running",
    },
    queued: {
      cls: "bg-muted text-muted-foreground border-border",
      icon: Bug,
      label: "Queued",
    },
  } as const;
  const { cls, icon: Icon, label } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}
    >
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r.toString().padStart(2, "0")}s`;
}



