import { useState, type FormEvent } from "react";
import { Activity, Check, CircleAlert, Clock3, GitBranch, Layers3, RefreshCw, ShieldCheck, Users, X } from "lucide-react";
import type { AdminWorkforceAgent, AdminWorkforceSnapshot } from "@/lib/api-client";

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : "—");
const shortId = (value?: string | null) => (value ? value.slice(0, 12) : "—");

const statusClass = (status: string) => {
  if (["COMPLETED", "APPROVED", "HEALTHY"].includes(status)) return "text-success";
  if (["FAILED", "BLOCKED", "REJECTED", "STOPPED"].includes(status)) return "text-destructive";
  if (["PROPOSED", "QUEUED", "ACCEPTED", "RUNNING", "CLAIMED"].includes(status)) return "text-warning";
  return "text-muted-foreground";
};

const latestCapacityFor = (snapshot: AdminWorkforceSnapshot | null, agentKey: string) =>
  snapshot?.capacitySnapshots.find((item) => item.agentKey === agentKey) || null;

export function AdminWorkforceTab({
  agents,
  snapshot,
  loading,
  onLoadRun,
  onApprove,
  onReject,
  busyId,
}: {
  agents: AdminWorkforceAgent[];
  snapshot: AdminWorkforceSnapshot | null;
  loading: boolean;
  onLoadRun: (runId: string) => Promise<void>;
  onApprove: (messageId: string) => Promise<void>;
  onReject: (messageId: string) => Promise<void>;
  busyId: string | null;
}) {
  const [runId, setRunId] = useState("");

  const submitRunLookup = async (event: FormEvent) => {
    event.preventDefault();
    if (!runId.trim()) return;
    await onLoadRun(runId.trim());
  };

  const activeWorkers = snapshot?.activeAgentKeys.length ?? 0;
  const pendingDelegations = snapshot?.messages.filter((message) => message.messageType === "TASK_DELEGATION_REQUEST" && message.status === "PROPOSED") ?? [];
  const latestCapacities = snapshot ? snapshot.agents.map((agent) => ({ agent, capacity: latestCapacityFor(snapshot, agent.key) })) : [];

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Operations / bounded workforce</div>
        <h2 className="mt-2 font-display text-xl font-semibold">Collaborative QA workforce</h2>
        <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
          Staff-only orchestration for <strong className="text-foreground">SK-coordinator</strong> and the five explicitly named workers. Each assignment is durable, scope-limited, evidence-linked, and Coordinator-approved; the current browser runner still executes scenarios sequentially rather than launching five uncontrolled browsers.
        </p>
      </div>

      <section className="surface-card overflow-hidden">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <h3 className="font-display text-base font-semibold">Named agent registry</h3>
              <p className="mt-1 text-xs text-muted-foreground">Mode activation is Coordinator-controlled: Quick Smoke uses 0–1 logical workers, Standard uses SK1–SK3, and Deep uses all five.</p>
            </div>
          </div>
          {snapshot && <div className="text-right font-mono text-[10px] text-muted-foreground">{snapshot.mode} · {snapshot.status}</div>}
        </header>
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const capacity = latestCapacities.find((item) => item.agent.key === agent.key)?.capacity;
            const isActive = snapshot?.activeAgentKeys.includes(agent.key) ?? false;
            return (
              <article key={agent.key} className="bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm font-semibold text-foreground">{agent.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{agent.role}</div>
                  </div>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${isActive ? "text-success" : "text-muted-foreground"}`}>{snapshot ? (isActive ? "active" : "standby") : "registered"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {agent.capabilities.map((capability) => <span key={capability} className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{capability}</span>)}
                </div>
                {snapshot && (
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px]">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className={`font-mono ${capacity && capacity.availableSlots > 0 && !capacity.draining ? "text-success" : "text-warning"}`}>{capacity ? `${capacity.availableSlots}/${capacity.maxSlots} available` : "not reported"}</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <GitBranch className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <h3 className="font-display text-base font-semibold">Inspect a workforce run</h3>
              <p className="mt-1 text-xs text-muted-foreground">Paste a Matrix QA run ID to inspect its mission, leases, coverage ledger, capacity snapshots, and typed handoffs.</p>
            </div>
          </div>
          <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={submitRunLookup}>
            <label className="sr-only" htmlFor="workforce-run-id">Run ID</label>
            <input id="workforce-run-id" value={runId} onChange={(event) => setRunId(event.target.value)} placeholder="Run UUID" className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-3 py-2.5 font-mono text-xs text-foreground outline-none focus:border-primary" />
            <button type="submit" disabled={loading || !runId.trim()} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Load workforce run</button>
          </form>
        </header>
        {!snapshot ? (
          <div className="p-6 text-sm text-muted-foreground">No workforce run selected. The registry above remains visible so staff can verify the stable identities before inspecting an execution.</div>
        ) : (
          <div className="space-y-5 p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Mode" value={snapshot.mode} />
              <Metric label="Workers active" value={`${activeWorkers}/5`} />
              <Metric label="Tasks" value={snapshot.tasks.length} />
              <Metric label="Coverage claims" value={snapshot.coverageClaims.length} />
              <Metric label="Pending decisions" value={pendingDelegations.length} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-border py-3 font-mono text-[10px] text-muted-foreground">
              <span>run {shortId(snapshot.runId)}</span><span>workspace {shortId(snapshot.workspaceId)}</span><span>created {formatDate(snapshot.createdAt)}</span><span>updated {formatDate(snapshot.updatedAt)}</span><span className={statusClass(snapshot.status)}>{snapshot.status}</span>
            </div>
          </div>
        )}
      </section>

      {snapshot && <>
        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="surface-card overflow-hidden">
            <header className="flex items-start gap-3 border-b border-border px-5 py-4"><Layers3 className="mt-0.5 h-4 w-4 text-primary" /><div><h3 className="font-display text-base font-semibold">Task leases</h3><p className="mt-1 text-xs text-muted-foreground">Every logical assignment carries an owner, requester, capability, bounded deadline, and evidence references.</p></div></header>
            <div className="divide-y divide-border">
              {snapshot.tasks.map((task) => <article key={task.id} className="px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><span className={`font-mono text-[10px] uppercase tracking-wider ${statusClass(task.status)}`}>{task.status}</span><span className="font-mono text-[10px] text-muted-foreground">{task.agentKey}</span></div><span className="font-mono text-[10px] text-muted-foreground">deadline {formatDate(task.deadlineAt)}</span></div><div className="mt-2 text-sm font-medium text-foreground">{task.objective}</div><div className="mt-1 text-xs text-muted-foreground">{task.capability} · priority {task.priority} · budget {task.budgetUnits} MU · requested by {task.requestedByAgentKey}</div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground"><span>task {shortId(task.id)}</span><span>coverage {task.coverageKeys.length || 0}</span><span>evidence {task.evidenceRefs.length || 0}</span>{task.failureReason && <span className="text-warning">{task.failureReason}</span>}</div></article>)}
              {!snapshot.tasks.length && <p className="p-5 text-sm text-muted-foreground">No task leases were created for this run.</p>}
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <header className="flex items-start gap-3 border-b border-border px-5 py-4"><Activity className="mt-0.5 h-4 w-4 text-primary" /><div><h3 className="font-display text-base font-semibold">Capacity and heartbeat</h3><p className="mt-1 text-xs text-muted-foreground">Latest durable snapshot per agent; active slots are reservations, not claims of parallel browser execution.</p></div></header>
            <div className="divide-y divide-border">{latestCapacities.map(({ agent, capacity }) => <div key={agent.key} className="px-5 py-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs font-semibold text-foreground">{agent.name}</span><span className={`font-mono text-[10px] uppercase ${statusClass(capacity?.health || "UNKNOWN")}`}>{capacity?.health || "UNKNOWN"}</span></div><div className="mt-1 flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground"><span>{capacity ? `${capacity.activeSlots} active / ${capacity.maxSlots} max · ${capacity.availableSlots} available` : "No snapshot"}</span><span>heartbeat {formatDate(capacity?.lastHeartbeatAt)}</span></div>{capacity?.currentTaskIds.length ? <div className="mt-1 font-mono text-[10px] text-muted-foreground">leases {capacity.currentTaskIds.map(shortId).join(", ")}</div> : null}</div>)}</div>
          </section>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="surface-card overflow-hidden">
            <header className="flex items-start gap-3 border-b border-border px-5 py-4"><Users className="mt-0.5 h-4 w-4 text-primary" /><div><h3 className="font-display text-base font-semibold">Coverage ledger</h3><p className="mt-1 text-xs text-muted-foreground">Uniqueness conflicts are durable and visible before the same area is re-tested.</p></div></header>
            <div className="divide-y divide-border">{snapshot.coverageClaims.map((claim) => <div key={claim.id} className="px-5 py-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs text-foreground">{claim.coverageKey}</span><span className={`font-mono text-[10px] uppercase ${statusClass(claim.status)}`}>{claim.status}</span></div><div className="mt-1 text-[11px] text-muted-foreground">{claim.dimension} · {claim.agentKey} · claimed {formatDate(claim.claimedAt)}</div>{claim.evidenceRefs.length > 0 && <div className="mt-1 font-mono text-[10px] text-muted-foreground">evidence: {claim.evidenceRefs.join(", ")}</div>}{claim.conflictReason && <div className="mt-1 text-[11px] text-warning">{claim.conflictReason}</div>}</div>)}{!snapshot.coverageClaims.length && <p className="p-5 text-sm text-muted-foreground">No coverage claims have been recorded.</p>}</div>
          </section>

          <section className="surface-card overflow-hidden">
            <header className="flex items-start gap-3 border-b border-border px-5 py-4"><CircleAlert className="mt-0.5 h-4 w-4 text-primary" /><div><h3 className="font-display text-base font-semibold">Typed messages and approvals</h3><p className="mt-1 text-xs text-muted-foreground">Machine-actionable envelopes are the source of truth; summaries exclude credentials, raw page dumps, and secret payloads.</p></div></header>
            <div className="divide-y divide-border">{snapshot.messages.map((message) => { const canDecide = message.messageType === "TASK_DELEGATION_REQUEST" && message.status === "PROPOSED"; return <article key={message.id} className="px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><span className={`font-mono text-[10px] uppercase tracking-wider ${statusClass(message.status)}`}>{message.status}</span><span className="font-mono text-[10px] text-primary">{message.messageType}</span></div><span className="font-mono text-[10px] text-muted-foreground">{formatDate(message.createdAt)}</span></div><p className="mt-2 text-sm text-foreground">{message.summary}</p><div className="mt-1 text-[11px] text-muted-foreground">{message.fromAgentKey} → {message.toAgentKey || "broadcast"}{message.capability ? ` · ${message.capability}` : ""}{message.evidenceRefs.length ? ` · evidence ${message.evidenceRefs.join(", ")}` : ""}</div>{canDecide && <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busyId === `approve-${message.id}`} onClick={() => void onApprove(message.id)} className="inline-flex items-center gap-1.5 rounded-md border border-success/30 px-2.5 py-1.5 text-[11px] font-medium text-success hover:bg-success/10 disabled:opacity-40"><Check className="h-3.5 w-3.5" />Approve</button><button type="button" disabled={busyId === `reject-${message.id}`} onClick={() => void onReject(message.id)} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-2.5 py-1.5 text-[11px] font-medium text-destructive hover:bg-destructive/10 disabled:opacity-40"><X className="h-3.5 w-3.5" />Reject</button></div>}</article>; })}{!snapshot.messages.length && <p className="p-5 text-sm text-muted-foreground">No typed workforce messages have been recorded.</p>}</div>
          </section>
        </section>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />The workforce view is observational and staff-only. It does not create a new run, expand target scope, or approve dangerous actions.</div>
      </>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="border border-border bg-surface-2/30 p-3"><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold text-foreground">{value}</div></div>;
}
