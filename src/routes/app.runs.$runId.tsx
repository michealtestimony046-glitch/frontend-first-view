import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Bug,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileQuestion,
  Globe,
  Loader2,
  Network,
  Terminal,
  XCircle,
} from "lucide-react";

import { StatusPill } from "./app.index";
import { BrowserFrame } from "@/components/browser-frame";
import { runDetail, type Severity } from "@/lib/mock-data";

export const Route = createFileRoute("/app/runs/$runId")({
  head: ({ params }) => ({
    meta: [
      { title: `Run ${params.runId} · Matrix QA` },
      { name: "description", content: "Run report with evidence." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RunDetailPage,
});

type Tab = "overview" | "console" | "network" | "screenshots" | "scenarios";

function RunDetailPage() {
  const { runId } = Route.useParams();
  const r = runDetail;
  const [tab, setTab] = useState<Tab>("overview");
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Breadcrumb */}
        <Link
          to="/app"
          className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          back to runs
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                Run <span className="text-primary">{runId}</span>
              </h1>
              <StatusPill status={r.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {r.targetUrl}
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                started {r.startedAt} · {formatDuration(r.durationSec)}
              </span>
              <span className="text-border">·</span>
              <span>chromium 128 · desktop 1440×900</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-xs hover:bg-accent">
              <Copy className="h-3.5 w-3.5" /> Copy link
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-xs hover:bg-accent">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Scenarios"
            value={`${r.passed}/${r.scenarios}`}
            hint="passed"
            tone={r.failed > 0 ? "danger" : "success"}
          />
          <Stat
            label="Bugs captured"
            value={String(r.bugs)}
            hint={r.bugs > 0 ? "needs review" : "clean"}
            tone={r.bugs > 0 ? "danger" : "success"}
          />
          <Stat
            label="Screenshots"
            value={String(r.screenshots.length)}
            hint="artifacts"
          />
          <Stat
            label="Network calls"
            value={String(r.network.length)}
            hint={`${r.network.filter((n) => n.status >= 500).length} × 5xx`}
            tone={r.network.some((n) => n.status >= 500) ? "danger" : undefined}
          />
        </div>

        {/* Tabs — horizontally scrollable on mobile */}
        <div className="mt-8 -mx-4 overflow-x-auto border-b border-border md:mx-0">
          <div className="flex min-w-max items-center gap-1 px-4 md:min-w-0 md:px-0">
            {(
              [
                { id: "overview", label: "Overview", icon: CheckCircle2 },
                { id: "screenshots", label: "Screenshots", icon: Camera },
                { id: "console", label: "Console", icon: Terminal },
                { id: "network", label: "Network", icon: Network },
                { id: "scenarios", label: "Scenarios", icon: Bug },
              ] as const
            ).map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative -mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          {tab === "overview" && <OverviewTab />}
          {tab === "screenshots" && (
            <ScreenshotsTab selected={selected} setSelected={setSelected} />
          )}
          {tab === "console" && <ConsoleTab />}
          {tab === "network" && <NetworkTab />}
          {tab === "scenarios" && <ScenariosTab />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  const r = runDetail;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Bugs */}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-display text-sm font-semibold">Bugs captured</h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            {r.bugs_list.length} findings
          </span>
        </div>
        <ul>
          {r.bugs_list.map((b) => (
            <li
              key={b.id}
              className="group flex items-start gap-3 border-b border-border px-5 py-4 last:border-b-0 hover:bg-accent/30"
            >
              <SeverityDot severity={b.severity} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {b.severity}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {b.scenario}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground">{b.title}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  evidence: {b.evidence} · captured at{" "}
                  {formatMs(b.detectedAt)}
                </p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </li>
          ))}
        </ul>
      </div>

      {/* Timeline */}
      <div className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-display text-sm font-semibold">Execution timeline</h3>
        </div>
        <div className="p-5">
          <ol className="relative space-y-4 border-l border-border pl-4">
            {[
              { t: "00:00", label: "Worker boot · chromium 128", tone: "muted" },
              { t: "00:00", label: "Navigate to target URL", tone: "muted" },
              { t: "00:04", label: "GET / · 200 (84ms)", tone: "muted" },
              { t: "00:06", label: "Click \"Sign up\"", tone: "muted" },
              { t: "00:11", label: "Warn: key prop missing", tone: "warning" },
              {
                t: "00:14",
                label: "POST /api/checkout/quote · 500",
                tone: "danger",
              },
              {
                t: "00:15",
                label: "Bug captured · TypeError in CheckoutSummary",
                tone: "danger",
              },
              { t: "03:04", label: "Run finished · 12 scenarios", tone: "muted" },
            ].map((s, i) => (
              <li key={i} className="relative">
                <span
                  className={`absolute -left-[21px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-background ${
                    s.tone === "danger"
                      ? "bg-destructive"
                      : s.tone === "warning"
                        ? "bg-warning"
                        : "bg-muted-foreground/60"
                  }`}
                />
                <div className="flex items-baseline gap-3">
                  <span className="w-10 shrink-0 font-mono text-[11px] text-muted-foreground">
                    {s.t}
                  </span>
                  <span
                    className={`text-sm ${
                      s.tone === "danger"
                        ? "text-destructive"
                        : s.tone === "warning"
                          ? "text-warning"
                          : "text-foreground/80"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function ScreenshotsTab({
  selected,
  setSelected,
}: {
  selected: number;
  setSelected: (n: number) => void;
}) {
  const r = runDetail;
  const shot = r.screenshots[selected];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <BrowserFrame url={r.targetUrl}>
        <FakeShot variant={selected} />
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-md border border-border bg-background/80 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
          <Camera className="h-3 w-3 text-primary" />
          {shot.label} · captured at {formatMs(shot.t)}
        </div>
      </BrowserFrame>

      <div className="surface-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-semibold">All frames</h3>
        </div>
        <ul className="max-h-[520px] overflow-auto p-2">
          {r.screenshots.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => setSelected(i)}
                className={`flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors ${
                  selected === i
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:bg-accent/40"
                }`}
              >
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded border border-border bg-surface-2">
                  <FakeShot variant={i} thumbnail />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground">{s.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {formatMs(s.t)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ConsoleTab() {
  const r = runDetail;
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-surface-2/40 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Time</span>
        <span className="ml-4 flex-1">Message</span>
        <span>Source</span>
      </div>
      <ul className="max-h-[560px] divide-y divide-border overflow-auto font-mono text-[12px]">
        {r.console.map((c, i) => (
          <li key={i} className="grid grid-cols-[70px_60px_1fr_180px] items-start gap-3 px-4 py-2 hover:bg-accent/30">
            <span className="text-muted-foreground">{formatMs(c.t)}</span>
            <span
              className={`inline-flex w-14 justify-center rounded px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                c.level === "error"
                  ? "bg-destructive/15 text-destructive"
                  : c.level === "warn"
                    ? "bg-warning/15 text-warning"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {c.level}
            </span>
            <span
              className={
                c.level === "error"
                  ? "text-destructive"
                  : c.level === "warn"
                    ? "text-warning"
                    : "text-foreground/90"
              }
            >
              {c.message}
            </span>
            <span className="truncate text-muted-foreground">{c.source}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NetworkTab() {
  const r = runDetail;
  return (
    <div className="surface-card overflow-hidden">
      <div className="grid grid-cols-[70px_60px_1fr_80px_80px_80px] border-b border-border bg-surface-2/40 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Time</span>
        <span>Method</span>
        <span>URL</span>
        <span>Status</span>
        <span>Latency</span>
        <span className="text-right">Size</span>
      </div>
      <ul className="max-h-[560px] divide-y divide-border overflow-auto font-mono text-[12px]">
        {r.network.map((n, i) => (
          <li
            key={i}
            className="grid grid-cols-[70px_60px_1fr_80px_80px_80px] items-center gap-2 px-4 py-2 hover:bg-accent/30"
          >
            <span className="text-muted-foreground">{formatMs(n.t)}</span>
            <span className="text-foreground/80">{n.method}</span>
            <span className="truncate text-foreground">{n.url}</span>
            <span
              className={
                n.status >= 500
                  ? "text-destructive"
                  : n.status >= 400
                    ? "text-warning"
                    : "text-success"
              }
            >
              {n.status}
            </span>
            <span className="text-muted-foreground">{n.ms}ms</span>
            <span className="text-right text-muted-foreground">{n.size}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScenariosTab() {
  const r = runDetail;
  return (
    <div className="surface-card overflow-hidden">
      <ul className="divide-y divide-border">
        {r.scenariosList.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-4 px-5 py-3 hover:bg-accent/30"
          >
            {s.status === "passed" ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <div className="flex-1">
              <p className="text-sm text-foreground">{s.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {s.steps} steps · {s.durationSec}s
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="surface-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-2xl font-semibold">{value}</span>
        <span
          className={`font-mono text-[11px] ${
            tone === "danger"
              ? "text-destructive"
              : tone === "success"
                ? "text-success"
                : "text-muted-foreground"
          }`}
        >
          {hint}
        </span>
      </div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: Severity }) {
  const tone =
    severity === "critical"
      ? "bg-destructive shadow-[0_0_12px] shadow-destructive/50"
      : severity === "high"
        ? "bg-destructive/70"
        : severity === "medium"
          ? "bg-warning"
          : "bg-muted-foreground";
  return <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${tone}`} />;
}

function FakeShot({ variant, thumbnail }: { variant: number; thumbnail?: boolean }) {
  // Four visually distinct fake app screens
  const base = thumbnail ? "p-1.5" : "p-6";
  const gap = thumbnail ? "gap-1" : "gap-3";
  const barH = thumbnail ? "h-1" : "h-3";

  if (variant === 2) {
    return (
      <div className={`absolute inset-0 flex bg-background ${base}`}>
        <div className="flex-1 pr-4">
          <div className={`${barH} w-1/3 rounded bg-foreground/60`} />
          <div className={`mt-2 ${barH} w-1/2 rounded bg-foreground/30`} />
          <div
            className={`mt-4 rounded-lg border border-destructive/40 bg-destructive/10 ${thumbnail ? "p-1" : "p-4"}`}
          >
            <div
              className={`${barH} w-1/2 rounded bg-destructive`}
            />
            <div
              className={`mt-1.5 ${barH} w-3/4 rounded bg-destructive/50`}
            />
          </div>
        </div>
        <div className={`w-1/3 space-y-1 rounded border border-border bg-surface ${thumbnail ? "p-1" : "p-3"}`}>
          <div className={`${barH} w-2/3 rounded bg-foreground/60`} />
          <div className={`${barH} w-full rounded bg-foreground/20`} />
          <div className={`${barH} w-full rounded bg-foreground/20`} />
        </div>
      </div>
    );
  }
  if (variant === 3) {
    return (
      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-background ${base}`}>
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <div className={`mt-3 ${barH} w-1/3 rounded bg-foreground/40`} />
      </div>
    );
  }
  return (
    <div className={`absolute inset-0 flex flex-col bg-background ${base}`}>
      <div className={`flex items-center justify-between ${gap}`}>
        <div className={`${barH} w-16 rounded bg-foreground/70`} />
        <div className={`${barH} w-20 rounded bg-primary/80`} />
      </div>
      <div className={`mt-4 ${barH} w-2/3 rounded bg-foreground/60`} />
      <div className={`mt-2 ${barH} w-1/2 rounded bg-foreground/30`} />
      {variant === 0 ? (
        <div className={`mt-4 grid flex-1 grid-cols-3 ${gap}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded border border-border bg-surface" />
          ))}
        </div>
      ) : (
        <div className={`mt-4 grid flex-1 grid-cols-2 ${gap}`}>
          <div className={`space-y-${thumbnail ? "1" : "2"}`}>
            <div className={`${barH} w-1/2 rounded bg-foreground/40`} />
            <div className={`${thumbnail ? "h-2" : "h-6"} rounded border border-border bg-surface`} />
            <div className={`${thumbnail ? "h-2" : "h-6"} rounded border border-border bg-surface`} />
          </div>
          <div className="rounded-lg border border-border bg-surface" />
        </div>
      )}
    </div>
  );
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r.toString().padStart(2, "0")}s`;
}
function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const rem = ms % 1000;
  return `${s.toString().padStart(2, "0")}.${rem.toString().padStart(3, "0")}`;
}
