import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  reliabilityApi,
  type ReliabilityDashboard,
  type ReliabilityAttempt,
} from "@/lib/api-client";
import { useLivePortfolio } from "@/lib/live-data";

export const Route = createFileRoute("/app/reliability")({
  head: () => ({
    meta: [{ title: "Reliability · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: ReliabilityPage,
});

function formatRate(value: number | null | undefined) {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

function outcomeTone(outcome?: string | null) {
  switch (outcome) {
    case "pass":
      return "text-success";
    case "target_failure":
    case "worker_failed":
      return "text-destructive";
    case "environment_failure":
      return "text-warning";
    case "policy_blocked":
      return "text-warning";
    default:
      return "text-muted-foreground";
  }
}

function outcomeLabel(outcome?: string | null) {
  return String(outcome || "inconclusive").replaceAll("_", " ");
}

function ReliabilityPage() {
  const live = useLivePortfolio();
  const [dashboard, setDashboard] = useState<ReliabilityDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const project = live.activeProject;
  const workspace = live.activeWorkspace;

  useEffect(() => {
    if (!project || !workspace) {
      setDashboard(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    reliabilityApi
      .dashboard(project.id, workspace.id)
      .then((result) => {
        if (!cancelled) setDashboard(result);
      })
      .catch((cause) => {
        if (!cancelled)
          setError(cause instanceof Error ? cause.message : "Unable to load reliability history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project, workspace]);

  const rerun = async (attempt: ReliabilityAttempt) => {
    if (!project || !attempt.runId || rerunning) return;
    setRerunning(attempt.runId);
    setNotice(null);
    try {
      await reliabilityApi.rerun(
        project.id,
        attempt.runId,
        "Controlled reliability rerun requested from the reliability history.",
      );
      setNotice("Controlled rerun queued. Its attempt will appear here after the worker starts.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to queue controlled rerun.");
    } finally {
      setRerunning(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Reliability history · {workspace?.name ?? "Select a workspace"}
          </div>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Is this test trustworthy?
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Matrix QA keeps the original result, the controlled rerun, the environment, and the
            evidence quality visible together. A rerun explains uncertainty; it never erases a
            failure.
          </p>
        </div>
        {project && (
          <Link
            to="/app/runs"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Open Test Runs
          </Link>
        )}
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="mt-5 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
          {notice}
        </div>
      )}
      {!project || !workspace ? (
        <EmptyState message="Select a workspace and project to view reliability history." />
      ) : loading ? (
        <div className="mt-6 rounded-md border border-border p-10 text-center text-sm text-muted-foreground">
          Loading reliability history…
        </div>
      ) : dashboard ? (
        <DashboardView dashboard={dashboard} rerun={rerun} rerunning={rerunning} />
      ) : (
        <EmptyState message="No reliability history is available for this project yet." />
      )}
    </div>
  );
}

function DashboardView({
  dashboard,
  rerun,
  rerunning,
}: {
  dashboard: ReliabilityDashboard;
  rerun: (attempt: ReliabilityAttempt) => void;
  rerunning: string | null;
}) {
  const summary = dashboard.summary;
  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <Metric
          label="Comparable attempts"
          value={summary.comparableAttemptCount}
          icon={<Clock3 className="h-4 w-4" />}
        />
        <Metric
          label="Pass rate"
          value={formatRate(summary.passRate)}
          tone={
            summary.passRate == null
              ? undefined
              : summary.passRate >= 0.9
                ? "text-success"
                : "text-warning"
          }
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <Metric
          label="Flake rate"
          value={formatRate(summary.flakeRate)}
          tone={summary.flakeRate && summary.flakeRate > 0 ? "text-warning" : "text-success"}
          icon={<RefreshCw className="h-4 w-4" />}
        />
        <Metric
          label="Failures"
          value={summary.failureCount}
          tone={summary.failureCount > 0 ? "text-destructive" : "text-success"}
          icon={<XCircle className="h-4 w-4" />}
        />
        <Metric
          label="Environment"
          value={summary.environmentFailureCount}
          tone={summary.environmentFailureCount > 0 ? "text-warning" : undefined}
          icon={<ShieldAlert className="h-4 w-4" />}
        />
        <Metric
          label="Needs review"
          value={summary.inconclusiveCount}
          tone={summary.inconclusiveCount > 0 ? "text-warning" : undefined}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="surface-card overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h2 className="font-display text-sm font-semibold">Logical test reliability</h2>
              <p className="text-[11px] text-muted-foreground">
                Rolling window · {dashboard.window.days} days · source watermark is retained
              </p>
            </div>
            <Sparkles className="h-4 w-4 text-primary" />
          </header>
          <div className="divide-y divide-border">
            {dashboard.logicalTests.map((test) => {
              const snapshot = test.latestSnapshot;
              const rate = snapshot?.passRate ?? null;
              const flake = snapshot?.flakeRate ?? null;
              return (
                <div key={test.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{test.name}</div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {String(test.criticality || "medium")} criticality ·{" "}
                        {snapshot?.attemptCount ?? 0} attempts
                      </div>
                    </div>
                    <span
                      className={`font-mono text-xs font-semibold ${flake && flake > 0 ? "text-warning" : rate != null && rate >= 0.9 ? "text-success" : "text-muted-foreground"}`}
                    >
                      {snapshot?.trend?.replaceAll("_", " ") || "insufficient samples"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full ${flake && flake > 0 ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${Math.max(4, Math.round((rate ?? 0) * 100))}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">
                      {formatRate(rate)}
                    </span>
                  </div>
                </div>
              );
            })}
            {!dashboard.logicalTests.length && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Reliability records appear after the next V2 run.
              </div>
            )}
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <header className="border-b border-border px-5 py-3">
            <h2 className="font-display text-sm font-semibold">Quarantine and gate status</h2>
            <p className="text-[11px] text-muted-foreground">
              Warnings remain visible; a quarantine never rewrites the source attempt.
            </p>
          </header>
          <div className="divide-y divide-border">
            {dashboard.quarantines.slice(0, 8).map((row) => (
              <div key={row.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-warning">
                    {row.status}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    expires {new Date(row.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground">{row.reason}</p>
              </div>
            ))}
            {!dashboard.quarantines.length && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No active quarantine proposals.
              </div>
            )}
            {dashboard.releaseGateDecisions.slice(0, 3).map((decision) => (
              <div key={decision.id} className="border-t border-border px-5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Release gate</span>
                  <span
                    className={`font-mono text-[10px] uppercase ${decision.status === "TRUSTED" ? "text-success" : decision.status === "BLOCKED" ? "text-destructive" : "text-warning"}`}
                  >
                    {decision.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{decision.decisionReason}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface-card mt-4 overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Recent attempts</h2>
          <p className="text-[11px] text-muted-foreground">
            Each attempt is immutable history. Controlled reruns are linked to their parent in the
            backend.
          </p>
        </header>
        <div className="divide-y divide-border">
          {dashboard.attempts.slice(0, 30).map((attempt) => (
            <AttemptRow
              key={attempt.id}
              attempt={attempt}
              rerun={rerun}
              rerunning={rerunning === attempt.runId}
            />
          ))}
          {!dashboard.attempts.length && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No attempts in this window.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function AttemptRow({
  attempt,
  rerun,
  rerunning,
}: {
  attempt: ReliabilityAttempt;
  rerun: (attempt: ReliabilityAttempt) => void;
  rerunning: boolean;
}) {
  const canRerun = ["inconclusive", "target_failure", "environment_failure"].includes(
    String(attempt.outcome),
  );
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3">
      <div
        className={`h-2 w-2 rounded-full ${attempt.outcome === "pass" ? "bg-success" : attempt.outcome === "target_failure" || attempt.outcome === "worker_failed" ? "bg-destructive" : "bg-warning"}`}
      />
      <div className="min-w-[180px] flex-1">
        <div className="text-xs font-medium">{attempt.logicalTest?.name || "Logical test"}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          attempt {attempt.attemptNumber} · {attempt.status} ·{" "}
          {attempt.evidenceComplete ? "evidence complete" : "evidence incomplete"}
        </div>
      </div>
      <div className={`font-mono text-[11px] capitalize ${outcomeTone(attempt.outcome)}`}>
        {outcomeLabel(attempt.outcome)}
      </div>
      <div className="font-mono text-[10px] text-muted-foreground">
        {new Date(attempt.createdAt).toLocaleString()}
      </div>
      {attempt.runId && (
        <Link to="/app/runs" className="text-xs text-primary">
          Open runs
        </Link>
      )}
      {canRerun && (
        <button
          disabled={rerunning}
          onClick={() => rerun(attempt)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50"
        >
          {rerunning ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Controlled rerun
        </button>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <div className="surface-card px-4 py-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className={`mt-1 font-display text-2xl font-semibold ${tone || ""}`}>{value}</div>
    </div>
  );
}
function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-8 rounded-md border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
