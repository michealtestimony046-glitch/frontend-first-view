import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const FIRST_TEST_READY_KEY = "matrix_qa_first_test_ready";
import {
  Activity,
  AlertTriangle,
  
  Bell,
  Bug,
  CheckCircle2,
  ChevronRight,
  Download,
  HelpCircle,
  Play,
  RotateCw,
  XCircle,
  Eye,
  BarChart3,
  Chrome,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RunReport, RunStatus, TriggerRunResponse } from "@/lib/api-client";
import { V2RunPreflight } from "@/components/v2-run-preflight";
import { WorkerPoolHealth } from "@/components/worker-pool-health";
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

type DashboardState = "loading" | "error" | "empty" | "partial" | "ready";
type DashboardStatusKey = "passed" | "findings" | "failed" | "blocked" | "running" | "queued" | "partiallyTested";
type DashboardStatusTotals = Record<DashboardStatusKey, number>;

const trendSeries: Array<{ key: DashboardStatusKey; label: string; color: string }> = [
  { key: "passed", label: "Passed", color: "#79e6a0" },
  { key: "findings", label: "Findings", color: "#80aaff" },
  { key: "failed", label: "Failed", color: "#ff7070" },
  { key: "blocked", label: "Blocked", color: "#f0b24d" },
  { key: "queued", label: "Queued", color: "#a9b3c2" },
  { key: "partiallyTested", label: "Partial", color: "#d59bff" },
  { key: "running", label: "Running", color: "#9be7b6" },
];

function AppDashboard() {
  const live = useLivePortfolio();
  const [runTargetUrl, setRunTargetUrl] = useState("");
  const [runMissionGoal, setRunMissionGoal] = useState("");
  const [autoStartFirstRun, setAutoStartFirstRun] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [utilityPanel, setUtilityPanel] = useState<"notifications" | "help" | null>(null);
  const [trendFilter, setTrendFilter] = useState<"all" | DashboardStatusKey>("all");
  const runs = live.runs;
  const issues = live.issues;
  const reports = live.reports;
  const latestRun = runs[0] ?? null;
  const latestReport = reportForRun(reports, latestRun?.id);
  const total = runs.length;
  const passed = runs.filter((run) => run.status === "COMPLETED").length;
  const failed = runs.filter((run) => run.status === "FAILED").length;
  const warnings = runs.reduce((sum, run) => {
    const outcomeWarning = ["PASSED_WITH_FINDINGS", "PARTIALLY_TESTED", "BLOCKED"].includes(run.status) ? 1 : 0;
    return sum + outcomeWarning + reportWarnings(reportForRun(reports, run.id));
  }, 0);
  const stats = { total, passed, failed, warnings };
  const statusTotals = buildStatusTotals(runs);
  const trend = buildOverallTrend(runs);
  const trendTotals = trend.reduce<DashboardStatusTotals>((totals, point) => {
    trendSeries.forEach((series) => {
      totals[series.key] += point[series.key];
    });
    return totals;
  }, { passed: 0, findings: 0, failed: 0, blocked: 0, running: 0, queued: 0, partiallyTested: 0 });
  const activeTrendSeries = trendSeries.filter(
    (series) =>
      trendTotals[series.key] > 0 &&
      (trendFilter === "all" || series.key === trendFilter),
  );
  const dashboardState: DashboardState = live.loading
    ? "loading"
    : live.error
      ? "error"
      : runs.length === 0
        ? "empty"
        : reports.length < Math.min(runs.length, 24)
          ? "partial"
          : "ready";
  const latest = {
    runId: latestRun?.id ?? "",
    status: statusFromApi(latestRun?.status),
    startedAt: latestRun ? formatLiveDate(latestRun.startedAt ?? latestRun.createdAt) : "—",
    duration: formatLiveDuration(durationForRun(latestRun, latestReport)),
    steps: reportStepCount(latestReport),
    issues: latestReport?.bugs ?? latestReport?.summary?.bugCount ?? latestReport?.errors?.length ?? 0,
  };
  const usage = { used: total, cap: Number.POSITIVE_INFINITY, atCap: false };
  const totalTrendRuns = Object.values(trendTotals).reduce((sum, count) => sum + count, 0);
  const trendFindings = trendTotals.findings;
  const visibleTrendRuns = trendFilter === "all" ? totalTrendRuns : trendTotals[trendFilter];
  const activeCount = statusTotals.running + statusTotals.queued;
  const attentionCount = statusTotals.failed + statusTotals.blocked + statusTotals.findings + statusTotals.partiallyTested;
  const lastUpdated = latestRun?.startedAt ?? latestRun?.createdAt ?? null;

  useEffect(() => {
    if (!live.activeProject || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(FIRST_TEST_READY_KEY);
      if (!raw) return;
      const pending = JSON.parse(raw) as { projectId?: string; targetUrl?: string; missionGoal?: string; autoStart?: boolean; targetAuthorizationConfirmed?: boolean };
      if (pending.projectId !== live.activeProject.id) return;
      setRunTargetUrl(pending.targetUrl || live.activeProject.defaultTargetUrl || live.activeProject.targetUrl || "");
      setRunMissionGoal(pending.missionGoal || "Test this website thoroughly.");
      setAutoStartFirstRun(Boolean(pending.autoStart && pending.targetAuthorizationConfirmed));
      setShowRunModal(true);
      localStorage.removeItem(FIRST_TEST_READY_KEY);
    } catch {
      localStorage.removeItem(FIRST_TEST_READY_KEY);
    }
  }, [live.activeProject]);

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

  const handleV2Started = (response: TriggerRunResponse & { planId?: string }) => {
    if (!live.activeProject) return;
    setShowRunModal(false);
    window.location.href = `/app/runs/${response.id}?projectId=${encodeURIComponent(live.activeProject.id)}`;
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
          <Link to="/app/notifications" aria-label="Notifications" className="relative inline-flex rounded-md border border-border bg-surface/60 p-2 text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">Live</span>
          </Link>
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
              <div className="font-medium text-foreground">Using Matrix QA</div>
              <p className="mt-1 leading-5 text-muted-foreground">Create a project, start a browser test, then review the evidence-backed report and findings. Screenshot evidence is available while video processing remains optional.</p>
              <Link to="/app/settings" className="mt-2 inline-flex text-primary hover:underline">Open Settings</Link>
            </div>}
          </div>
        </div>
      </div>

      <DashboardPulse
        state={dashboardState}
        workspaceName={live.activeWorkspace?.name}
        lastUpdated={lastUpdated}
        activeCount={activeCount}
        attentionCount={attentionCount}
        total={total}
        errorMessage={live.error}
        onRefresh={live.refresh}
      />

      {/* Stat cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:mt-5 lg:grid-cols-4">
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

      <div className="mt-6">
        <WorkerPoolHealth projectId={live.activeProject?.id} compact />
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
            {runs.length === 0 ? <RunListState state={dashboardState} /> : <ul className="max-h-[26rem] overflow-y-auto">
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
            </ul>}
          </div>

          {/* Mobile cards */}
          {runs.length === 0 ? <RunListState state={dashboardState} /> : <ul className="max-h-[26rem] divide-y divide-border overflow-y-auto md:hidden">
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
          </ul>}
        </section>

        {/* Overall run trend */}
        <section className="surface-card flex min-h-[390px] flex-col overflow-hidden">
          <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold">Overall Run Trend</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Last 7 days · all run statuses</p>
            </div>
            <label className="sr-only" htmlFor="trend-status-filter">Filter trend statuses</label>
            <select
              id="trend-status-filter"
              value={trendFilter}
              onChange={(event) => setTrendFilter(event.target.value as "all" | DashboardStatusKey)}
              className="h-8 shrink-0 rounded-md border border-border bg-surface-2/70 px-2.5 text-[11px] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <option value="all">All statuses</option>
              {trendSeries.map((series) => <option key={series.key} value={series.key}>{series.label}</option>)}
            </select>
          </header>
          <div className="h-[270px] px-2 pt-5 sm:h-[290px] sm:px-3" role="img" aria-label={`Seven-day run status trend with ${visibleTrendRuns} visible runs and ${trendFindings} findings captured.`}>
            {dashboardState === "loading" && !runs.length ? (
              <TrendState title="Loading run activity" detail="The chart will appear when current workspace data arrives." tone="info" loading />
            ) : dashboardState === "error" && !runs.length ? (
              <TrendState title="Run activity unavailable" detail={live.error || "Refresh to try the live data source again."} tone="error" />
            ) : visibleTrendRuns === 0 ? (
              <TrendState title={trendFilter === "all" ? "No run activity in the last 7 days" : `No ${trendFilterLabel(trendFilter).toLowerCase()} runs in the last 7 days`} detail="Start a test to create the first point in this workspace trend." tone="neutral" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 6, right: 10, left: -14, bottom: 14 }}>
                  <defs>
                    {trendSeries.map((series) => (
                      <linearGradient key={series.key} id={`trend-fill-${series.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={series.color} stopOpacity={series.key === "failed" ? 0.28 : 0.14} />
                        <stop offset="100%" stopColor={series.color} stopOpacity={0.01} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(152, 166, 190, 0.14)" strokeDasharray="2 5" />
                  <XAxis dataKey="day" tick={<TrendXAxisTick />} tickLine={false} axisLine={false} interval={0} height={36} />
                  <YAxis stroke="rgba(164, 177, 198, 0.75)" fontSize={10} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: "rgba(191, 205, 227, 0.28)", strokeDasharray: "4 4" }}
                    contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--foreground)" }}
                    labelStyle={{ color: "var(--muted-foreground)", marginBottom: 4 }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                  {activeTrendSeries.map((series) => (
                    <Area
                      key={series.key}
                      type="monotone"
                      dataKey={series.key}
                      name={series.label}
                      stroke={series.color}
                      strokeWidth={2}
                      fill={`url(#trend-fill-${series.key})`}
                      fillOpacity={1}
                      dot={{ r: 3, fill: series.color, stroke: "var(--surface)", strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: series.color, stroke: "var(--surface)", strokeWidth: 2 }}
                      connectNulls
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid min-h-12 grid-cols-2 gap-x-3 gap-y-2 border-t border-border px-5 py-3 text-[10px] text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
            {activeTrendSeries.length ? activeTrendSeries.map((series) => <span key={series.key} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: series.color }} />{series.label}<strong className="font-mono text-foreground">{trendTotals[series.key]}</strong></span>) : <span>No status series to display yet.</span>}
          </div>
          <div className="mt-auto flex items-end justify-between border-t border-border px-5 py-4">
            <div>
              <div className="text-[11px] text-muted-foreground">{trendFilter === "all" ? "Total runs in period" : `${trendFilterLabel(trendFilter)} runs in period`}</div>
              <div className="font-display text-2xl font-semibold">{visibleTrendRuns}</div>
            </div>
            <span className="font-mono text-[11px] text-primary">{trendFindings} findings captured</span>
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
            <ul className="max-h-[26rem] overflow-y-auto">
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
          <ul className="max-h-[26rem] divide-y divide-border overflow-y-auto md:hidden">
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
                  setRunTargetUrl(latestRun?.targetUrl ?? live.activeProject?.defaultTargetUrl ?? live.activeProject?.targetUrl ?? "");
                  setRunMissionGoal("Test this website thoroughly.");
                  setAutoStartFirstRun(false);
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
      {showRunModal && live.activeProject && <V2RunPreflight project={live.activeProject} initialTargetUrl={runTargetUrl} initialMissionGoal={runMissionGoal} autoStart={autoStartFirstRun} initialTargetAuthorizationConfirmed={autoStartFirstRun} onClose={() => { setShowRunModal(false); setAutoStartFirstRun(false); }} onStarted={handleV2Started} />}
    </div>
  );
}

function statusFromApi(value: string | undefined): RunStatus {
  const normalized = String(value ?? "PENDING").toLowerCase();
  if (normalized === "completed") return "passed";
  if (normalized === "passed_with_findings") return "passed_with_findings";
  if (normalized === "partially_tested") return "partially_tested";
  if (normalized === "blocked") return "blocked";
  if (normalized === "failed") return "failed";
  if (normalized === "running" || normalized === "executing") return "running";
  return "queued";
}

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function buildStatusTotals(runs: Array<{ status: string }>): DashboardStatusTotals {
  const totals: DashboardStatusTotals = { passed: 0, findings: 0, failed: 0, blocked: 0, running: 0, queued: 0, partiallyTested: 0 };
  runs.forEach((run) => {
    if (run.status === "COMPLETED") totals.passed += 1;
    else if (run.status === "PASSED_WITH_FINDINGS") totals.findings += 1;
    else if (run.status === "PARTIALLY_TESTED") totals.partiallyTested += 1;
    else if (run.status === "FAILED") totals.failed += 1;
    else if (run.status === "BLOCKED") totals.blocked += 1;
    else if (run.status === "RUNNING" || run.status === "EXECUTING") totals.running += 1;
    else totals.queued += 1;
  });
  return totals;
}

function buildOverallTrend(runs: Array<{ status: string; startedAt?: string | null; createdAt?: string }>) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  return days.map((date) => {
    const counts = { passed: 0, findings: 0, partiallyTested: 0, running: 0, blocked: 0, failed: 0, queued: 0 };
    runs.forEach((run) => {
      const started = run.startedAt ?? run.createdAt;
      const parsed = started ? new Date(started) : null;
      if (!parsed || parsed.toDateString() !== date.toDateString()) return;
      if (run.status === "COMPLETED") counts.passed += 1;
      else if (run.status === "PASSED_WITH_FINDINGS") counts.findings += 1;
      else if (run.status === "PARTIALLY_TESTED") counts.partiallyTested += 1;
      else if (run.status === "RUNNING") counts.running += 1;
      else if (run.status === "BLOCKED") counts.blocked += 1;
      else if (run.status === "FAILED") counts.failed += 1;
      else counts.queued += 1;
    });
    return {
      day: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
      ...counts,
    };
  });
}

function trendFilterLabel(filter: "all" | DashboardStatusKey) {
  if (filter === "all") return "All status";
  return trendSeries.find((series) => series.key === filter)?.label ?? "Selected status";
}

function TrendXAxisTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string; payload?: { weekday?: string } };
}) {
  if (typeof x !== "number" || typeof y !== "number") return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="rgba(164, 177, 198, 0.82)" fontSize={9}>{payload?.value}</text>
      <text x={0} y={0} dy={25} textAnchor="middle" fill="rgba(139, 151, 173, 0.68)" fontSize={8}>{payload?.payload?.weekday}</text>
    </g>
  );
}

function durationForRun(run: { startedAt?: string | null; finishedAt?: string | null; createdAt?: string } | null, report?: RunReport | null) {
  if (typeof report?.durationSec === "number" && Number.isFinite(report.durationSec)) return report.durationSec;
  const started = run?.startedAt ?? run?.createdAt;
  const finished = run?.finishedAt;
  if (!started || !finished) return undefined;
  const value = (new Date(finished).getTime() - new Date(started).getTime()) / 1000;
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function reportStepCount(report?: RunReport | null) {
  if (!report) return 0;
  if (Array.isArray(report.steps)) return report.steps.length;
  if (Array.isArray(report.events)) return report.events.length;
  if (Array.isArray(report.assertions)) return report.assertions.length;
  return 0;
}

function RunListState({ state }: { state: DashboardState }) {
  const content = state === "loading"
    ? { title: "Loading recent runs", detail: "Fetching the latest workspace activity." }
    : state === "error"
      ? { title: "Recent runs unavailable", detail: "Refresh the dashboard to try again." }
      : { title: "No runs yet", detail: "Start a test to see its status and evidence here." };
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-1.5 px-5 text-center">
      {state === "loading" ? <Loader2 className="mb-1 h-5 w-5 animate-spin text-info" /> : <Activity className={`mb-1 h-5 w-5 ${state === "error" ? "text-destructive" : "text-muted-foreground"}`} />}
      <strong className="text-xs text-foreground">{content.title}</strong>
      <span className="text-[11px] leading-5 text-muted-foreground">{content.detail}</span>
    </div>
  );
}

function TrendState({ title, detail, tone, loading = false }: { title: string; detail: string; tone: "info" | "error" | "neutral"; loading?: boolean }) {
  const Icon = loading ? Loader2 : tone === "error" ? AlertTriangle : Clock3;
  const toneClass = tone === "error" ? "text-destructive" : tone === "info" ? "text-info" : "text-muted-foreground";
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-2/20 px-5 text-center">
      <Icon className={`h-5 w-5 ${toneClass} ${loading ? "animate-spin" : ""}`} />
      <strong className="text-xs text-foreground">{title}</strong>
      <span className="max-w-xs text-[11px] leading-5 text-muted-foreground">{detail}</span>
    </div>
  );
}

function DashboardPulse({
  state,
  workspaceName,
  lastUpdated,
  activeCount,
  attentionCount,
  total,
  errorMessage,
  onRefresh,
}: {
  state: DashboardState;
  workspaceName?: string | null;
  lastUpdated?: string | null;
  activeCount: number;
  attentionCount: number;
  total: number;
  errorMessage: string | null;
  onRefresh: () => void;
}) {
  const copy = {
    loading: { label: "Syncing workspace data", detail: "Loading current runs and report signals.", tone: "text-info", Icon: Loader2 },
    error: { label: "Dashboard sync interrupted", detail: errorMessage || "Some live data could not be loaded.", tone: "text-destructive", Icon: AlertTriangle },
    empty: { label: "Ready for your first test", detail: "Run a test to start building this workspace’s operating history.", tone: "text-primary", Icon: Play },
    partial: { label: "Updating report data", detail: "Run activity is live; some report details are still arriving.", tone: "text-warning", Icon: Clock3 },
    ready: { label: "Monitoring live workspace activity", detail: "Run status and report signals are current for this workspace.", tone: "text-success", Icon: ShieldCheck },
  }[state];
  const Icon = copy.Icon;
  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-border bg-surface/70 shadow-[0_14px_40px_-28px_rgba(0,0,0,0.9)]" aria-label="Workspace operational pulse" role="status" aria-live="polite">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-current/10 ${copy.tone}`}>
            <Icon className={`h-4 w-4 ${state === "loading" ? "animate-spin" : ""}`} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate text-sm font-semibold text-foreground">{workspaceName || "Selected workspace"}</span>
              <span className={`font-mono text-[10px] uppercase tracking-[0.16em] ${copy.tone}`}>{copy.label}</span>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{copy.detail}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          <div className="grid grid-cols-3 gap-3 font-mono text-[10px] text-muted-foreground sm:flex sm:items-center sm:gap-4">
            <span><strong className="block text-sm text-foreground">{activeCount}</strong>active</span>
            <span><strong className="block text-sm text-foreground">{attentionCount}</strong>attention</span>
            <span><strong className="block text-sm text-foreground">{total}</strong>runs</span>
          </div>
          <button type="button" onClick={onRefresh} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2/50 text-muted-foreground hover:text-foreground" aria-label="Refresh dashboard data" title="Refresh dashboard data">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border bg-surface-2/25 px-4 py-2.5 font-mono text-[10px] text-muted-foreground sm:px-5">
        <span className={`h-1.5 w-1.5 rounded-full ${state === "error" ? "bg-destructive" : state === "loading" ? "bg-info" : "bg-success"}`} />
        <span>{lastUpdated ? `Last activity ${formatLiveDate(lastUpdated)}` : "No activity recorded yet"}</span>
        {state === "partial" && <span className="text-warning">· report details pending</span>}
      </div>
    </section>
  );
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
    passed_with_findings: {
      cls: "bg-warning/15 text-warning border-warning/30",
      icon: AlertTriangle,
      label: "Passed with findings",
    },
    partially_tested: {
      cls: "bg-warning/15 text-warning border-warning/30",
      icon: AlertTriangle,
      label: "Partially tested",
    },
    blocked: {
      cls: "bg-warning/15 text-warning border-warning/30",
      icon: XCircle,
      label: "Blocked",
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



