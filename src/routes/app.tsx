import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bug,
  CheckCircle2,
  Clock,
  Filter,
  Globe,
  Play,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { project, runs, type RunStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Runs · Matrix QA" },
      { name: "description", content: "Run history and live workers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppDashboard,
});

function AppDashboard() {
  const [url, setUrl] = useState(project.url);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span>Workspace</span>
              <span className="text-border">/</span>
              <span className="text-foreground">{project.name}</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Runs
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sequential browser worker · evidence captured to every artifact.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-2.5 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              {project.environment}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-2.5 py-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> last run {project.lastRunAt}
            </span>
          </div>
        </div>

        {/* Metric strip */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Activity} label="Total runs (7d)" value="24" delta="+8" />
          <Metric
            icon={Bug}
            label="Open bugs"
            value="3"
            delta="critical"
            tone="danger"
          />
          <Metric
            icon={CheckCircle2}
            label="Scenarios passing"
            value="83%"
            delta="+4%"
            tone="success"
          />
          <Metric icon={Clock} label="Avg duration" value="2m 58s" delta="-12s" />
        </div>

        {/* Trigger card */}
        <div className="surface-card mt-6 overflow-hidden">
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Play className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold">
                  Trigger a new run
                </h2>
                <p className="text-xs text-muted-foreground">
                  Sequential login, signup, navigation, and form scenarios.
                </p>
              </div>
            </div>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="grid gap-3 p-5 md:grid-cols-[1fr_auto]"
          >
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-app.com"
                className="w-full rounded-md border border-border bg-surface-2/60 py-2.5 pl-9 pr-3 font-mono text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow">
              <Play className="h-4 w-4" />
              Run now
            </button>
          </form>
          <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-2/40 px-5 py-3 font-mono text-[11px] text-muted-foreground">
            <span className="uppercase tracking-wider">scenarios</span>
            {["login", "signup", "navigation", "forms"].map((s) => (
              <span
                key={s}
                className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-foreground/80"
              >
                {s}
              </span>
            ))}
            <span className="ml-auto text-muted-foreground">
              est. ~ 3 min · desktop viewport · chromium 128
            </span>
          </div>
        </div>

        {/* Runs table */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent runs</h2>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Filter className="h-3.5 w-3.5" /> Filter
            </button>
          </div>

          <div className="surface-card overflow-hidden">
            <div className="hidden grid-cols-[110px_1fr_120px_100px_100px_100px_40px] items-center gap-4 border-b border-border bg-surface-2/40 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:grid">
              <span>Status</span>
              <span>Target URL</span>
              <span>Started</span>
              <span>Duration</span>
              <span>Scenarios</span>
              <span>Bugs</span>
              <span />
            </div>
            <ul>
              {runs.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/app/runs/$runId"
                    params={{ runId: r.id }}
                    className="group grid grid-cols-[110px_1fr_100px_40px] items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 transition-colors hover:bg-accent/40 md:grid-cols-[110px_1fr_120px_100px_100px_100px_40px]"
                  >
                    <StatusPill status={r.status} />
                    <div className="min-w-0">
                      <div className="truncate font-mono text-sm text-foreground">
                        {r.targetUrl}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                        {r.id} · triggered {r.triggeredBy}
                      </div>
                    </div>
                    <div className="hidden text-sm text-muted-foreground md:block">
                      {r.startedAt}
                    </div>
                    <div className="hidden font-mono text-sm text-foreground md:block">
                      {formatDuration(r.durationSec)}
                    </div>
                    <div className="hidden text-sm md:block">
                      <span className="text-success">{r.passed}</span>
                      <span className="text-muted-foreground"> / {r.scenarios}</span>
                    </div>
                    <div className="hidden md:block">
                      {r.bugs > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-0.5 font-mono text-xs text-destructive">
                          <Bug className="h-3 w-3" /> {r.bugs}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  delta,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  delta: string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-2xl font-semibold tracking-tight">
          {value}
        </span>
        <span
          className={`font-mono text-[11px] ${
            tone === "danger"
              ? "text-destructive"
              : tone === "success"
                ? "text-success"
                : "text-muted-foreground"
          }`}
        >
          {delta}
        </span>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: RunStatus }) {
  const map = {
    passed: {
      cls: "bg-success/15 text-success border-success/20",
      icon: CheckCircle2,
      label: "Passed",
    },
    failed: {
      cls: "bg-destructive/15 text-destructive border-destructive/20",
      icon: XCircle,
      label: "Failed",
    },
    running: {
      cls: "bg-primary/15 text-primary border-primary/30",
      icon: Activity,
      label: "Running",
    },
    queued: {
      cls: "bg-muted text-muted-foreground border-border",
      icon: Clock,
      label: "Queued",
    },
  } as const;
  const { cls, icon: Icon, label } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] ${cls}`}
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
