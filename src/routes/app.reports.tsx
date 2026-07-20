import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Download, ExternalLink, ImageOff } from "lucide-react";
import { getLatestReport, type Report } from "@/lib/mock-data";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [{ title: "Reports · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const report = getLatestReport();
  const [activeBug, setActiveBug] = useState(report.groupedBugs[0]?.id);
  const [target, setTarget] = useState<"Cursor" | "Claude Code" | "GitHub" | "Raw">(
    "Cursor",
  );
  const bug = report.groupedBugs.find((b) => b.id === activeBug) ?? report.groupedBugs[0];

  const scoreTone =
    report.confidenceScore >= 90
      ? "text-success"
      : report.confidenceScore >= 75
        ? "text-warning"
        : "text-destructive";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>{report.id}</span>
            <span>·</span>
            <span>Generated {report.generatedAt}</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Deployment Readiness Report
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Evidence-backed summary for run{" "}
            <Link
              to="/app/runs/$runId"
              params={{ runId: report.runId }}
              className="text-primary hover:underline"
            >
              #{report.runId.slice(-4)}
            </Link>
            . Copy the repair package or hand it to your coding agent.
          </p>
        </div>
        <div className="rounded-md border border-border bg-surface/60 px-5 py-3 text-right">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Confidence score
          </div>
          <div className={`font-display text-4xl font-semibold ${scoreTone}`}>
            {report.confidenceScore}
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-mono text-[10px] uppercase text-warning">
            {report.status.replace("_", " ")}
          </div>
        </div>
      </div>

      {/* Metric strip */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Passed" value={report.metrics.passed} tone="text-success" />
        <Metric label="Failed" value={report.metrics.failed} tone="text-destructive" />
        <Metric label="Warnings" value={report.metrics.warnings} tone="text-warning" />
        <Metric
          label="Matrix permutations"
          value={report.metrics.totalMatrixPermutations}
        />
      </div>

      {/* Two-column split */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Bug list */}
        <section className="surface-card overflow-hidden">
          <header className="border-b border-border px-5 py-3">
            <h2 className="font-display text-sm font-semibold">Active Bug Reports</h2>
            <p className="text-[11px] text-muted-foreground">
              Grouped by root cause · click to inspect
            </p>
          </header>
          <ul className="divide-y divide-border">
            {report.groupedBugs.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => setActiveBug(b.id)}
                  className={`block w-full px-5 py-4 text-left transition-colors ${
                    activeBug === b.id ? "bg-accent/40" : "hover:bg-accent/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={b.severity} />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {b.id}
                    </span>
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-foreground">
                    {b.title}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Affected: {b.affected}
                    {b.endpoint && (
                      <>
                        {" · "}
                        <span className="font-mono text-foreground">{b.endpoint}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-16 w-24 items-center justify-center rounded border border-border bg-background/60 text-muted-foreground">
                      <ImageOff className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Failure screenshot →
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Repair package */}
        <section className="surface-card sticky top-4 flex h-fit flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h2 className="font-display text-sm font-semibold">Repair Package</h2>
              <p className="text-[11px] text-muted-foreground">
                Pre-formatted for the agent of your choice
              </p>
            </div>
          </header>

          {/* target selector */}
          <div className="flex gap-1 border-b border-border bg-surface-2/40 p-1">
            {(["Cursor", "Claude Code", "GitHub", "Raw"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className={`flex-1 rounded px-2 py-1 text-xs font-medium ${
                  target === t
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {bug && (
            <>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap px-5 py-4 font-mono text-[11px] leading-relaxed text-foreground">
                {bug.reproMd}
              </pre>
              <div className="flex items-center gap-2 border-t border-border bg-surface-2/40 px-5 py-3">
                <button
                  onClick={() => navigator.clipboard?.writeText(bug.reproMd)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground btn-primary-glow hover:opacity-90"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy markdown
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-xs hover:bg-accent">
                  <Download className="h-3.5 w-3.5" /> .md
                </button>
                <Link
                  to="/app/runs/$runId"
                  params={{ runId: report.runId }}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open run <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </>
          )}
        </section>
      </div>

      <p className="mt-6 max-w-2xl text-[11px] text-muted-foreground">
        <span className="font-mono uppercase tracking-wider text-primary">v1 —</span>{" "}
        PDF export, executive summaries, and white-label client links land in v2+.
      </p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="surface-card px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 font-display text-2xl font-semibold ${tone ?? ""}`}>
        {value}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Report["groupedBugs"][number]["severity"] }) {
  const tone: Record<string, string> = {
    critical: "bg-destructive/15 text-destructive border-destructive/30",
    high: "bg-warning/15 text-warning border-warning/30",
    medium: "bg-info/15 text-info border-info/30",
    low: "bg-surface-2 text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tone[severity]}`}
    >
      {severity}
    </span>
  );
}
