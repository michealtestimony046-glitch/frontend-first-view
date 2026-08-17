import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, CircleDollarSign, Loader2, RefreshCw, Send } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { creditsApi, organizationsApi, workspacesApi, type AllocationExtensionRequest, type CreditsLedgerEntry, type CreditsSummary, type Organization, type Workspace } from "@/lib/api-client";

const ACTIVE_ORG_KEY = "matrix_qa_active_organization";
const ACTIVE_WORKSPACE_KEY = "matrix_qa_active_workspace";

export const Route = createFileRoute("/app/credits")({
  head: () => ({ meta: [{ title: "Credits · Matrix QA" }, { name: "robots", content: "noindex" }] }),
  component: CreditsPage,
});

function CreditsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [summary, setSummary] = useState<CreditsSummary | null>(null);
  const [ledger, setLedger] = useState<CreditsLedgerEntry[]>([]);
  const [requests, setRequests] = useState<AllocationExtensionRequest[]>([]);
  const [requestedUnits, setRequestedUnits] = useState("30");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedOrganization = useMemo(() => organizations.find((item) => item.id === organizationId) ?? null, [organizations, organizationId]);
  const selectedWorkspace = useMemo(() => workspaces.find((item) => item.id === workspaceId) ?? null, [workspaces, workspaceId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const orgs = await organizationsApi.list();
      setOrganizations(orgs);
      const storedOrg = localStorage.getItem(ACTIVE_ORG_KEY);
      const org = orgs.find((item) => item.id === storedOrg) ?? orgs[0] ?? null;
      setOrganizationId(org?.id ?? null);
      if (!org) return;
      localStorage.setItem(ACTIVE_ORG_KEY, org.id);
      const [summaryData, ledgerData, requestData, workspaceData] = await Promise.all([
        creditsApi.getSummary(org.id),
        creditsApi.getLedger(org.id),
        creditsApi.getRequests(org.id),
        workspacesApi.list(org.id),
      ]);
      setSummary(summaryData);
      setLedger(ledgerData);
      setRequests(requestData);
      setWorkspaces(workspaceData);
      const storedWorkspace = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
      const workspace = workspaceData.find((item) => item.id === storedWorkspace) ?? workspaceData[0] ?? null;
      setWorkspaceId(workspace?.id ?? null);
      if (workspace) localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspace.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load Matrix Units.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organizationId || !workspaceId) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await creditsApi.requestExtension(organizationId, workspaceId, { requestedUnits: Number(requestedUnits), reason });
      setReason("");
      setMessage("Your request was sent to the Matrix QA staff queue.");
      const updated = await creditsApi.getRequests(organizationId);
      setRequests(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit the allocation request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading Matrix Units…</div>;

  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary"><CircleDollarSign className="h-4 w-4" /> Matrix Units</div><h1 className="mt-2 font-display text-2xl font-semibold">Usage and alpha allocation</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{selectedOrganization ? `Usage for ${selectedOrganization.name}.` : "Choose an organization to view usage."} Six Matrix Units equal one internal compute credit.</p></div><button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div>{error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}{message && <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</div>}
    {summary ? <><div className="grid gap-3 md:grid-cols-3"><Metric label="Available" value={`${summary.availableUnits} ${summary.symbol}`} detail={`of ${summary.monthlyCeilingUnits} regular units`} /><Metric label="Used" value={`${summary.usedUnits} ${summary.symbol}`} detail={`${summary.usagePercent}% of this period`} /><Metric label="Reserved" value={`${summary.reservedUnits} ${summary.symbol}`} detail="Queued or running work" /></div>{summary.warningLevel > 0 && <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /><div><div className="font-medium">{summary.warningLevel === 100 ? "Your Matrix Unit allowance is used for this period" : `You have used ${summary.warningLevel}% of this period's allowance`}</div><p className="mt-1 text-xs text-muted-foreground">New runs pause at 100%. Request an alpha extension below if your team needs more capacity.</p></div></div>}<div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]"><section className="surface-card overflow-hidden"><header className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-display text-base font-semibold">Ledger</h2><p className="mt-1 text-xs text-muted-foreground">Allocated, reserved, settled, and refunded usage</p></div><span className="text-xs text-muted-foreground">Resets {new Date(summary.periodEnd).toLocaleDateString()}</span></header><div className="divide-y divide-border">{ledger.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No usage entries yet. Your monthly allocation will appear here.</p> : ledger.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3"><div className="min-w-0"><div className="truncate text-sm font-medium">{entry.reason}</div><div className="mt-0.5 text-[11px] text-muted-foreground">{entry.entryType} · {new Date(entry.createdAt).toLocaleString()}{entry.expiresAt ? ` · expires ${new Date(entry.expiresAt).toLocaleDateString()}` : ""}</div></div><div className={`shrink-0 font-mono text-sm ${entry.entryType === "REFUND" || entry.entryType === "ALLOCATION" || entry.entryType === "BONUS" ? "text-success" : "text-foreground"}`}>{entry.entryType === "RESERVATION" || entry.entryType === "SETTLEMENT" ? "−" : "+"}{entry.units} {summary.symbol}</div></div>)}</div></section><div className="space-y-4"><section className="surface-card p-5"><h2 className="font-display text-base font-semibold">Request more alpha allocation</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Requests are tracked for Matrix QA staff review. Choose the workspace that needs the extension.</p><form onSubmit={submitRequest} className="mt-4 space-y-3"><label className="block text-xs font-medium">Workspace<select value={workspaceId ?? ""} onChange={(event) => setWorkspaceId(event.target.value)} required className="mt-1.5 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm"><option value="" disabled>Select a workspace</option>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label><label className="block text-xs font-medium">Requested Matrix Units<input type="number" min={6} max={600} step={6} value={requestedUnits} onChange={(event) => setRequestedUnits(event.target.value)} required className="mt-1.5 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /></label><label className="block text-xs font-medium">Reason<textarea minLength={10} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain the additional alpha workload…" required className="mt-1.5 min-h-24 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /></label><button disabled={submitting || !workspaceId || reason.trim().length < 10} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send request</button></form></section><section className="surface-card p-5"><div className="flex items-center justify-between"><h2 className="font-display text-base font-semibold">Requests</h2><Link to="/app/settings/organization" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Manage workspace <ArrowUpRight className="h-3 w-3" /></Link></div><div className="mt-3 space-y-2">{requests.length === 0 ? <p className="text-xs text-muted-foreground">No extension requests yet.</p> : requests.slice(0, 5).map((request) => <div key={request.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-surface-2/30 px-3 py-2"><div className="min-w-0"><div className="truncate text-xs font-medium">{request.requestedUnits} {summary.symbol}</div><div className="truncate text-[11px] text-muted-foreground">{request.reason}</div></div><span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">{request.status}</span></div>)}</div></section></div></div></> : <div className="surface-card p-6"><p className="text-sm text-muted-foreground">No organization is available. Create one in <Link to="/app/settings/organization" className="text-primary hover:underline">Organization settings</Link>.</p></div>}
    <p className="max-w-3xl text-xs leading-5 text-muted-foreground">{summary?.message} Regular units expire at the monthly reset with no rollover. Staff-granted bonus units remain valid for 30 days and are shown with their expiry date.</p></div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="surface-card p-5"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-2 font-display text-2xl font-semibold">{value}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></div>; }
