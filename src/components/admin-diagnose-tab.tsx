import { useState } from "react";
import { AlertTriangle, CreditCard, Database, FileSearch, Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import type { AdminRunDiagnosis } from "@/lib/api-client";

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="max-h-96 overflow-auto rounded-xl border border-border bg-background/70 p-3 text-xs leading-5 text-muted-foreground">{JSON.stringify(value, null, 2)}</pre>;
}

export function AdminDiagnoseTab({
  diagnosis,
  loading,
  onLoad,
  onRefund,
  onMessage,
}: {
  diagnosis: AdminRunDiagnosis | null;
  loading: boolean;
  onLoad: (runId: string) => void;
  onRefund: (reason: string) => void;
  onMessage: (input: { recipientUserIds: string[]; title: string; message: string }) => void;
}) {
  const [runId, setRunId] = useState("");
  const [refundReason, setRefundReason] = useState("Run failed due to platform execution issues");
  const [title, setTitle] = useState("An update about your Matrix QA run");
  const [message, setMessage] = useState("");

  return <div className="space-y-6">
    <section className="surface-card p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <label className="flex-1 text-sm text-muted-foreground">Run ID<input value={runId} onChange={(event) => setRunId(event.target.value)} placeholder="Paste a run ID" className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-primary" /></label>
        <button disabled={!runId.trim() || loading} onClick={() => onLoad(runId.trim())} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"><FileSearch className="h-4 w-4" />{loading ? "Loading…" : "Diagnose run"}</button>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Admin-only full operational diagnosis. Secrets and credentials remain protected.</p>
    </section>

    {!diagnosis ? <div className="surface-card p-10 text-center text-sm text-muted-foreground">Enter a run ID to inspect execution, logs, evidence, provider activity, credits, and customer impact.</div> : <>
      <section className="surface-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Run diagnosis</p><h2 className="mt-2 text-2xl font-semibold">{diagnosis.run.projectName}</h2><p className="mt-1 font-mono text-xs text-muted-foreground">{diagnosis.run.id}</p></div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{diagnosis.run.status}</span>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Created", diagnosis.run.createdAt], ["Started", diagnosis.run.startedAt || "—"], ["Finished", diagnosis.run.finishedAt || "—"], ["Hard errors", String(diagnosis.run.hardErrorCount)]].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-background/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>)}</div>
        {diagnosis.run.errorMessage && <div className="mt-4 flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{diagnosis.run.errorMessage}</div>}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-5"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /><h3 className="font-semibold">Credits and Matrix Units</h3></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm">{Object.entries(diagnosis.credit).map(([key, value]) => <div key={key} className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{key}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div><input value={refundReason} onChange={(event) => setRefundReason(event.target.value)} className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" /><button disabled={!diagnosis.credit.refundableUnits || !refundReason.trim()} onClick={() => onRefund(refundReason)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/40 px-3 py-2 text-sm font-semibold text-primary disabled:opacity-40"><RefreshCw className="h-4 w-4" />Refund {diagnosis.credit.refundableUnits} units</button></div>
        <div className="surface-card p-5"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><h3 className="font-semibold">Contact customer</h3></div><input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" /><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write an apology or explanation…" rows={5} className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" /><button disabled={!message.trim() || !diagnosis.run.triggeredBy?.id} onClick={() => onMessage({ recipientUserIds: [diagnosis.run.triggeredBy!.id], title, message })} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"><Mail className="h-4 w-4" />Send apology and notification</button></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">{[["Execution timeline", diagnosis.executionEvents], ["Steps", diagnosis.steps], ["Console logs", diagnosis.consoleMessages], ["Evidence", diagnosis.evidence], ["AI/provider usage", diagnosis.aiUsage], ["Credit ledger", diagnosis.creditLedger], ["Action history", diagnosis.audit]].map(([label, value]) => <div key={String(label)} className="surface-card p-5"><h3 className="mb-3 font-semibold">{String(label)}</h3><JsonBlock value={value} /></div>)}</section>
      <div className="surface-card p-5"><h3 className="mb-3 flex items-center gap-2 font-semibold"><Database className="h-4 w-4 text-primary" />Telemetry and worker state</h3><JsonBlock value={{ telemetry: diagnosis.telemetry, browserHandoff: diagnosis.browserHandoff, workforce: diagnosis.workforce, reports: diagnosis.reports }} /></div>
    </>}
  </div>;
}
