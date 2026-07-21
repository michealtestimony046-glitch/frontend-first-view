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
import {
  project,
  runs,
  type RunStatus,
  getDashboardStats,
  getFailureTrend,
  getTopIssues,
  getLatestSummary,
  getBillingUsage,
  type TopIssue,
} from "@/lib/mock-data";

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
  const [url, setUrl] = useState(project.url);
  const [showRunModal, setShowRunModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const stats = getDashboardStats();
  const trend = getFailureTrend();
  const issues = getTopIssues();
  const latest = getLatestSummary();
  const usage = getBillingUsage();

  const handleStartRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunError(null);
    setIsSubmitting(true);

    try {
      // For now, just close the modal and show success
      // Once backend is ready, this will call the actual API
      console.log('Starting run for URL:', url);
      setShowRunModal(false);
    } catch (error) {
      setRunError(
        error instanceof Error ? error.message : 'Failed to start run. Please try again.'
      );
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
            Welcome back, Michael. Here's what's happening with your projects.
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
          <button
            aria-label="Notifications"
            className="hidden rounded-md border border-border bg-surface/60 p-2 text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            aria-label="Help"
            className="hidden rounded-md border border-border bg-surface/60 p-2 text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Test Runs"
          value={stats.total}
          icon={BarChart3}
          tone="neutral"
          hint={`↑ ${stats.deltaTotalPct}% vs last 7 days`}
        />
        <StatCard
          label="Passed"
          value={stats.passed}
          icon={CheckCircle2}
          tone="success"
          hint={`${Math.round((stats.passed / stats.total) * 100)}% of total`}
        />
        <StatCard
          label="Failed"
          value={stats.failed}
          icon={XCircle}
          tone="danger"
          hint={`${Math.round((stats.failed / stats.total) * 100)}% of total`}
        />
        <StatCard
          label="Warnings"
          value={stats.warnings}
          icon={AlertTriangle}
          tone="warning"
          hint={`${Math.round((stats.warnings / stats.total) * 100)}% of total`}
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
              to="/app"
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
              {runs.map((r, i) => (
                <li key={r.id}>
                  <Link
                    to="/app/runs/$runId"
                    params={{ runId: r.id }}
                    className="group grid grid-cols-[60px_minmax(0,1fr)_92px_84px_74px_16px] items-center gap-3 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-accent/30 xl:grid-cols-[60px_minmax(0,1fr)_92px_100px_84px_74px_16px]"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      #{102 - i}
                    </span>
                    <span className="truncate text-sm text-foreground">
                      {project.name}
                    </span>
                    <StatusPill status={r.status} />
                    <span className="hidden items-center gap-1.5 text-xs text-muted-foreground xl:flex">
                      <Chrome className="h-3.5 w-3.5" /> Chromium
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {r.startedAt}
                    </span>
                    <span className="font-mono text-xs text-foreground">

                      {formatDuration(r.durationSec)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-border md:hidden">
            {runs.map((r, i) => (
              <li key={r.id}>
                <Link
                  to="/app/runs/$runId"
                  params={{ runId: r.id }}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{102 - i}
                      </span>
                      <span className="truncate text-sm text-foreground">
                        {project.name}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{r.startedAt}</span>
                      <span>·</span>
                      <span className="font-mono">
                        {formatDuration(r.durationSec)}
                      </span>
                    </div>
                  </div>
                  <StatusPill status={r.status} />
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
              to="/app"
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
              {issues.map((i) => (
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
            {issues.map((i) => (
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
            <LegendDot severity="functional" label="Functional" />
            <LegendDot severity="warning" label="Warning" />
            <LegendDot severity="info" label="Info" />
          </div>
        </section>

        {/* Run summary */}
        <section className="surface-card overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-base font-semibold">
              Run #{latest.runId.slice(-4).toUpperCase()} Summary
            </h2>
            <Link
              to="/app/runs/$runId"
              params={{ runId: latest.runId }}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:opacity-80"
            >
              View Details <ChevronRight className="h-3.5 w-3.5" />
            </Link>
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
                <Link
                  to="/app/runs/$runId"
                  params={{ runId: latest.runId }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground btn-primary-glow"
                >
                  <Eye className="h-4 w-4" />
                  View Full Report
                </Link>
                <button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
              <button className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
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
                    You've used {usage.used} / {usage.cap} runs. Request more allocation to keep scanning.
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
  TopIssue["severity"],
  { dot: string; pill: string; label: string }
> = {
  critical: {
    dot: "bg-destructive",
    pill: "bg-destructive/15 text-destructive border-destructive/30",
    label: "Critical",
  },
  functional: {
    dot: "bg-info",
    pill: "bg-info/15 text-info border-info/30",
    label: "Functional",
  },
  warning: {
    dot: "bg-warning",
    pill: "bg-warning/15 text-warning border-warning/30",
    label: "Warning",
  },
  info: {
    dot: "bg-muted-foreground",
    pill: "bg-muted text-muted-foreground border-border",
    label: "Info",
  },
};

function SeverityDot({
  severity,
  className = "",
}: {
  severity: TopIssue["severity"];
  className?: string;
}) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${severityMap[severity].dot} ${className}`}
    />
  );
}

function SeverityPill({ severity }: { severity: TopIssue["severity"] }) {
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
  severity: TopIssue["severity"];
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



