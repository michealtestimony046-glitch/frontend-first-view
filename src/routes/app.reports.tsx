import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Download, ExternalLink, FileWarning } from "lucide-react";
import { formatLiveDate, formatLiveDuration, reportForRun, runNumber, useLivePortfolio } from "@/lib/live-data";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports · Matrix QA" }, { name: "robots", content: "noindex" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const live = useLivePortfolio();
  const terminalRuns = live.runs.filter((run) => run.status === "COMPLETED" || run.status === "FAILED");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [target, setTarget] = useState<"Cursor" | "Claude Code" | "GitHub" | "Raw">("Raw");
  const selectedRun = terminalRuns.find((run) => run.id === selectedRunId) ?? terminalRuns[0] ?? null;
  const report = reportForRun(live.reports, selectedRun?.id);
  const confidenceScore = Number((report as Record<string, unknown> | null)?.confidenceScore ?? 0);
  const findings = useMemo(() => {
    if (!selectedRun) return [];
    return live.issues.filter((issue) => issue.reportId === selectedRun.id);
  }, [live.issues, selectedRun]);
  const repairMarkdown = report && selectedRun
    ? `# Matrix QA report ${runNumber(live.runs, selectedRun.id)}\n\nStatus: ${report.status}\nTarget: ${selectedRun.targetUrl}\nStarted: ${formatLiveDate(selectedRun.startedAt ?? selectedRun.createdAt)}\nDuration: ${formatLiveDuration(report.durationSec)}\n\n## Findings\n${findings.length ? findings.map((issue) => `- [${issue.severity.toUpperCase()}] ${issue.title} (${issue.category})`).join("\n") : "No hard findings were returned by the backend."}\n\n## Backend diagnostic\n${report.errorMessage ?? "None"}\n`
    : "No terminal report is available yet.";
  const scoreTone = confidenceScore >= 90 ? "text-success" : confidenceScore >= 75 ? "text-warning" : "text-destructive";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Live backend reports · {terminalRuns.length} terminal runs</div>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">Deployment Readiness Reports</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Evidence-backed summaries assembled from the selected project runs returned by the Matrix QA backend.</p>
        </div>
        {selectedRun && (
          <div className="rounded-md border border-border bg-surface/60 px-5 py-3 text-right">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Confidence score</div>
            <div className={`font-display text-4xl font-semibold ${scoreTone}`}>{confidenceScore || "—"}<span className="text-lg text-muted-foreground">{confidenceScore ? "/100" : ""}</span></div>
            <div className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{report?.status ?? "No report"}</div>
          </div>
        )}
      </div>

      {live.error && <div className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{live.error}</div>}
      {live.loading && <div className="mt-6 rounded-md border border-border p-8 text-center text-sm text-muted-foreground">Loading live reports…</div>}
      {!live.loading && !terminalRuns.length && (
        <div className="mt-6 rounded-md border border-dashed border-border p-12 text-center"><FileWarning className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-display text-base font-semibold">No terminal reports yet</p><p className="mt-1 text-sm text-muted-foreground">Queue a run from the live Test Runs page; in-progress reports intentionally remain incomplete.</p><Link to="/app/runs" className="mt-4 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Open Test Runs</Link></div>
      )}
      {!live.loading && terminalRuns.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {terminalRuns.map((run) => (
              <button key={run.id} onClick={() => setSelectedRunId(run.id)} className={`rounded-md border px-3 py-2 text-left ${selectedRun?.id === run.id ? "border-primary/50 bg-primary/10" : "border-border bg-surface/40"}`}>
                <div className="font-mono text-[10px] text-muted-foreground">{runNumber(live.runs, run.id)}</div>
                <div className="mt-1 text-xs font-medium">{run.status} · {run.targetUrl}</div>
              </button>
            ))}
          </div>
          {selectedRun && report && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="Passed" value={report.passed ?? report.summary?.assertionsPassed ?? 0} tone="text-success" />
                <Metric label="Failed" value={report.failed ?? report.summary?.assertionsFailed ?? 0} tone="text-destructive" />
                <Metric label="Warnings" value={Array.isArray((report as Record<string, unknown>).auditLog) ? ((report as Record<string, unknown>).auditLog as unknown[]).length : 0} tone="text-warning" />
                <Metric label="Evidence events" value={Array.isArray(report.events) ? report.events.length : 0} />
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <section className="surface-card overflow-hidden">
                  <header className="border-b border-border px-5 py-3"><h2 className="font-display text-sm font-semibold">Backend findings</h2><p className="text-[11px] text-muted-foreground">Real hard-error findings grouped from this run</p></header>
                  <ul className="divide-y divide-border">
                    {findings.map((issue) => <li key={issue.id} className="px-5 py-4"><div className="flex items-center gap-2"><SeverityBadge severity={issue.severity} /><span className="font-mono text-[10px] text-muted-foreground">{issue.category}</span></div><div className="mt-1.5 text-sm font-medium">{issue.title}</div><div className="mt-1 text-[11px] text-muted-foreground">{issue.scope} · {issue.occurrences} occurrence(s)</div></li>)}
                    {!findings.length && <li className="p-8 text-center text-sm text-muted-foreground">No hard findings returned for this report.</li>}
                  </ul>
                </section>
                <section className="surface-card sticky top-4 flex h-fit flex-col overflow-hidden">
                  <header className="border-b border-border px-5 py-3"><h2 className="font-display text-sm font-semibold">Evidence package</h2><p className="text-[11px] text-muted-foreground">Live backend artifact links and repair notes</p></header>
                  <div className="flex gap-1 border-b border-border bg-surface-2/40 p-1">{(["Cursor", "Claude Code", "GitHub", "Raw"] as const).map((item) => <button key={item} onClick={() => setTarget(item)} className={`flex-1 rounded px-2 py-1 text-xs font-medium ${target === item ? "bg-primary/15 text-foreground" : "text-muted-foreground"}`}>{item}</button>)}</div>
                  <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap px-5 py-4 font-mono text-[11px] leading-relaxed">{repairMarkdown}</pre>
                  <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-2/40 px-5 py-3">
                    <button onClick={() => navigator.clipboard?.writeText(repairMarkdown)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"><Copy className="h-3.5 w-3.5" /> Copy markdown</button>
                    {report.finalVideo && <a href={report.finalVideo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary"><ExternalLink className="h-3 w-3" /> Evidence video</a>}
                    {report.reportUrl && <a href={String(report.reportUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary"><Download className="h-3 w-3" /> report.md</a>}
                    <Link to="/app/runs/$runId" params={{ runId: selectedRun.id }} search={{ projectId: selectedRun.projectId }} className="ml-auto text-xs text-primary">Open run</Link>
                  </div>
                </section>
              </div>
            </>
          )}
        </>
      )}
      <p className="mt-6 text-[11px] text-muted-foreground"><span className="font-mono uppercase tracking-wider text-primary">v1 —</span> This page now reads live run/report data; export automation remains a later product capability.</p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: string }) { return <div className="surface-card px-4 py-3"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div><div className={`mt-0.5 font-display text-2xl font-semibold ${tone ?? ""}`}>{value}</div></div>; }
function SeverityBadge({ severity }: { severity: "critical" | "high" | "medium" | "low" }) { const tone = { critical: "bg-destructive/15 text-destructive border-destructive/30", high: "bg-warning/15 text-warning border-warning/30", medium: "bg-info/15 text-info border-info/30", low: "bg-surface-2 text-muted-foreground border-border" }[severity]; return <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tone}`}>{severity}</span>; }
EOF
