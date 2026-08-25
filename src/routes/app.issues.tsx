import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bug, CheckCircle2, Download, ExternalLink, Loader2, Search, X } from "lucide-react";
import { useLivePortfolio, type LiveIssue } from "@/lib/live-data";
import { v2Api, type V2FindingWorkflow, type V2FindingWorkflowStatus } from "@/lib/api-client";

export const Route = createFileRoute("/app/issues")({
  head: () => ({ meta: [{ title: "Issues · Matrix QA" }, { name: "robots", content: "noindex" }] }),
  component: IssuesPage,
});

const sevTone: Record<LiveIssue["severity"], string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-info/15 text-info border-info/30",
  low: "bg-surface-2 text-muted-foreground border-border",
};
const workflowTone: Record<V2FindingWorkflowStatus, string> = {
  OPEN: "text-warning",
  IN_PROGRESS: "text-info",
  FIXED_PENDING_RETEST: "text-warning",
  VERIFIED_FIXED: "text-success",
  REOPENED: "text-destructive",
  WONT_FIX: "text-muted-foreground",
};

function IssuesPage() {
  const live = useLivePortfolio();
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<"all" | LiveIssue["severity"]>("all");
  const [selected, setSelected] = useState<LiveIssue | null>(null);
  const [workflows, setWorkflows] = useState<V2FindingWorkflow[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const list = live.issues.filter(
    (issue) =>
      (sev === "all" || issue.severity === sev) &&
      (!q ||
        `${issue.title} ${issue.category} ${issue.scope}`.toLowerCase().includes(q.toLowerCase())),
  );

  const loadWorkflows = useCallback(async () => {
    if (!live.activeProject?.id) {
      setWorkflows([]);
      return;
    }

    setWorkflowLoading(true);
    setWorkflowError(null);
    try {
      setWorkflows(await v2Api.listFindingWorkflows(live.activeProject.id));
    } catch (cause) {
      setWorkflowError(
        cause instanceof Error ? cause.message : "Unable to load finding workflows.",
      );
    } finally {
      setWorkflowLoading(false);
    }
  }, [live.activeProject?.id]);
  useEffect(() => {
    void loadWorkflows();
  }, [loadWorkflows]);

  const updateWorkflow = async (workflowId: string, status: V2FindingWorkflowStatus) => {
    if (!live.activeProject?.id) return;
    try {
      const updated = await v2Api.updateFindingWorkflow(live.activeProject.id, workflowId, {
        status,
      });
      setWorkflows((current) =>
        current.map((item) => (item.id === workflowId ? { ...item, ...updated } : item)),
      );
    } catch (cause) {
      setWorkflowError(
        cause instanceof Error ? cause.message : "Unable to update finding workflow.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Issues</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Observed findings become durable workflows only when you choose to track them. Fixes are
        verified against terminal Matrix QA runs.
      </p>
      {live.error && (
        <div className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {live.error}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface-2/40 px-3 py-1.5 md:max-w-md">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search issues…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-surface-2/40 p-1">
          {(["all", "critical", "high", "medium", "low"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setSev(item)}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize ${sev === item ? "bg-primary/15 text-foreground" : "text-muted-foreground"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <section className="surface-card mt-4 overflow-hidden">
        <ul className="divide-y divide-border">
          {list.map((issue) => (
            <li key={issue.id}>
              <button
                onClick={() => setSelected(issue)}
                className="grid w-full grid-cols-[1fr_auto] items-start gap-3 px-4 py-3.5 text-left hover:bg-accent/30 md:grid-cols-[1fr_120px_100px_120px_16px]"
              >
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <Bug className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {issue.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span
                          className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${sevTone[issue.severity]}`}
                        >
                          {issue.severity}
                        </span>
                        <span>{issue.scope}</span>
                        <span>·</span>
                        <span className="font-mono">{issue.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="hidden text-sm text-foreground md:block">
                  {issue.occurrences}×
                </span>
                <span className="hidden text-xs text-muted-foreground md:block">
                  {issue.affectedRuns.length} runs
                </span>
                <span className="hidden text-xs text-muted-foreground md:block">
                  {issue.lastSeen}
                </span>
                <ExternalLink className="hidden h-4 w-4 shrink-0 text-muted-foreground md:block" />
              </button>
            </li>
          ))}
          {!live.loading && !list.length && (
            <li className="p-8 text-center text-sm text-muted-foreground">
              No live findings match those filters.
            </li>
          )}
          {live.loading && (
            <li className="p-8 text-center text-sm text-muted-foreground">
              Loading live findings…
            </li>
          )}
        </ul>
      </section>
      <section className="surface-card mt-6 overflow-hidden">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Finding workflows</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {live.activeProject
                ? `Durable repair state for ${live.activeProject.name}`
                : "Select a project to view repair state."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadWorkflows()}
            disabled={workflowLoading || !live.activeProject}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
          >
            {workflowLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Refresh
          </button>
        </header>
        {workflowError && (
          <div className="m-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {workflowError}
          </div>
        )}
        <div className="divide-y divide-border">
          {workflows.map((workflow) => (
            <WorkflowRow
              key={workflow.id}
              workflow={workflow}
              projectId={live.activeProject?.id}
              onStatus={(status) => void updateWorkflow(workflow.id, status)}
              onRetested={loadWorkflows}
              onError={setWorkflowError}
            />
          ))}
          {!workflowLoading && !workflows.length && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No tracked workflows for this project. Open an observed finding and choose “Track
              finding”.
            </div>
          )}
        </div>
      </section>
      {selected && (
        <IssueDrawer issue={selected} onClose={() => setSelected(null)} onTracked={loadWorkflows} />
      )}
    </div>
  );
}

function WorkflowRow({
  workflow,
  projectId,
  onStatus,
  onRetested,
  onError,
}: {
  workflow: V2FindingWorkflow;
  projectId?: string;
  onStatus: (status: V2FindingWorkflowStatus) => void;
  onRetested: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [runId, setRunId] = useState("");
  const [busy, setBusy] = useState(false);
  const retest = async () => {
    if (!projectId || !runId.trim()) return;
    setBusy(true);
    onError("");
    try {
      await v2Api.createFindingRetest(projectId, workflow.id, runId.trim());
      await onRetested();
      setRunId("");
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Unable to record retest.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold ${workflowTone[workflow.status]}`}>
              {workflow.status.replaceAll("_", " ")}
            </span>
            <span className="text-sm font-medium">{workflow.title}</span>
            {workflow.issueKey && (
              <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px]">
                {workflow.issueKey}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {workflow.retests?.length ?? 0} retest(s) · updated{" "}
            {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleString() : "—"}
          </div>
        </div>
        <select
          aria-label={`Update status for ${workflow.title}`}
          value={workflow.status}
          onChange={(event) => onStatus(event.target.value as V2FindingWorkflowStatus)}
          className="rounded-md border border-border bg-surface-2/40 px-2 py-1.5 text-xs"
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="FIXED_PENDING_RETEST">Fixed, pending retest</option>
          <option value="WONT_FIX">Won't fix</option>
        </select>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={runId}
          onChange={(event) => setRunId(event.target.value)}
          placeholder="Terminal run ID for retest"
          className="min-w-[220px] flex-1 rounded-md border border-border bg-transparent px-2.5 py-1.5 text-xs"
        />
        <button
          type="button"
          onClick={() => void retest()}
          disabled={busy || !runId.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}{" "}
          Verify retest
        </button>
        {workflow.issueUrl && (
          <a
            href={workflow.issueUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary"
          >
            Open ticket <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function IssueDrawer({
  issue,
  onClose,
  onTracked,
}: {
  issue: LiveIssue;
  onClose: () => void;
  onTracked: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [tracked, setTracked] = useState(false);
  const repro = `### ${issue.title}\n\n**Severity:** ${issue.severity.toUpperCase()}\n**Scope:** ${issue.scope}\n**Category:** ${issue.category}\n**Occurrences:** ${issue.occurrences}\n**Affected runs:** ${issue.affectedRuns.join(", ")}\n\n### Evidence\n${issue.message}\n`;
  const track = async () => {
    setBusy(true);
    try {
      await v2Api.createFindingWorkflow(issue.projectId, {
        title: issue.title,
        actualBehavior: issue.message,
        remediationNote: `Review evidence from run ${issue.reportId}.`,
      });
      setTracked(true);
      await onTracked();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative flex w-full max-w-xl flex-col border-l border-border bg-surface">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div
              className={`inline-flex rounded-full border px-1.5 py-0.5 font-mono text-[10px] uppercase ${sevTone[issue.severity]}`}
            >
              {issue.severity}
            </div>
            <h2 className="mt-2 font-display text-base font-semibold">{issue.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Meta label="Occurrences" value={`${issue.occurrences}`} />
            <Meta label="Runs affected" value={`${issue.affectedRuns.length}`} />
            <Meta label="First seen" value={issue.firstSeen} />
            <Meta label="Last seen" value={issue.lastSeen} />
          </div>
          <button
            type="button"
            onClick={() => void track()}
            disabled={busy || tracked}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bug className="h-3.5 w-3.5" />
            )}{" "}
            {tracked ? "Tracked" : "Track finding"}
          </button>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Repair package · Markdown
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(repro)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2/60 px-2 py-1 text-xs hover:bg-accent"
              >
                <Download className="h-3 w-3" /> Copy
              </button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-foreground">
              {repro}
            </pre>
          </div>
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Affected run
            </div>
            <a
              href={`/app/runs/${issue.reportId}?projectId=${issue.projectId}`}
              className="inline-flex items-center gap-1 text-xs text-primary"
            >
              Open run <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
