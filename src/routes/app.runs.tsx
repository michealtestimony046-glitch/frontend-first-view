import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { ChevronRight, Chrome, Search, Play } from "lucide-react";
import { useState } from "react";
import { runs } from "@/lib/mock-data";

export const Route = createFileRoute("/app/runs")({
  head: () => ({
    meta: [
      { title: "Test Runs · Matrix QA" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RunsLayout,
});

function RunsLayout() {
  const matches = useMatches();
  // If a child route matched (e.g. /app/runs/$runId), render only the child.
  const isChild = matches.some((m) => m.routeId === "/app/runs/$runId");
  if (isChild) return <Outlet />;
  return <RunsList />;
}

function RunsList() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "failed" | "passed" | "running">(
    "all",
  );
  const filtered = runs.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (q && !r.targetUrl.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Test Runs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every execution of the browser worker, oldest to most recent.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground btn-primary-glow hover:opacity-90">
          <Play className="h-4 w-4" /> New Test Run
        </button>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface-2/40 px-3 py-1.5 md:max-w-md">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by target URL…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-surface-2/40 p-1">
          {(["all", "passed", "failed", "running"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize ${
                filter === f
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <section className="surface-card mt-4 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="grid grid-cols-[80px_minmax(0,1fr)_100px_120px_120px_100px_16px] items-center gap-3 border-b border-border bg-surface-2/40 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Run</span>
            <span>Target</span>
            <span>Status</span>
            <span>Browser</span>
            <span>Started</span>
            <span>Duration</span>
            <span />
          </div>
          <ul>
            {filtered.map((r, i) => (
              <li key={r.id}>
                <Link
                  to="/app/runs/$runId"
                  params={{ runId: r.id }}
                  className="group grid grid-cols-[80px_minmax(0,1fr)_100px_120px_120px_100px_16px] items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-accent/30"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    #{1002 - i}
                  </span>
                  <span className="truncate font-mono text-xs text-foreground">
                    {r.targetUrl}
                  </span>
                  <StatusPill status={r.status} />
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Chrome className="h-3.5 w-3.5" /> Chromium
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {r.startedAt}
                  </span>
                  <span className="font-mono text-xs text-foreground">
                    {fmt(r.durationSec)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-border md:hidden">
          {filtered.map((r, i) => (
            <li key={r.id}>
              <Link
                to="/app/runs/$runId"
                params={{ runId: r.id }}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{1002 - i}
                    </span>
                    <StatusPill status={r.status} />
                  </div>
                  <div className="mt-1 truncate font-mono text-xs text-foreground">
                    {r.targetUrl}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {r.startedAt} · {fmt(r.durationSec)} · {r.failed} failed
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No runs match those filters.
          </div>
        )}
      </section>
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function StatusPill({ status }: { status: (typeof runs)[number]["status"] }) {
  const map = {
    passed: { l: "Passed", c: "bg-success/15 text-success" },
    failed: { l: "Failed", c: "bg-destructive/15 text-destructive" },
    running: { l: "Running", c: "bg-primary/15 text-primary" },
    queued: { l: "Queued", c: "bg-surface-2 text-muted-foreground" },
  } as const;
  const s = map[status];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${s.c}`}
    >
      {status === "running" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      )}
      {s.l}
    </span>
  );
}
