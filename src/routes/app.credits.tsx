import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Loader2, RefreshCw, Send } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { creditsApi, organizationsApi, workspacesApi, type AllocationExtensionRequest, type CreditsSummary, type Organization, type Workspace } from "@/lib/api-client";

const ACTIVE_ORG_KEY = "matrix_qa_active_organization";
const ACTIVE_WORKSPACE_KEY = "matrix_qa_active_workspace";

export const Route = createFileRoute("/app/credits")({
  head: () => ({ meta: [{ title: "Test capacity · Matrix QA" }, { name: "robots", content: "noindex" }] }),
  component: CreditsPage,
});

function CreditsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [summary, setSummary] = useState<CreditsSummary | null>(null);
  const [requests, setRequests] = useState<AllocationExtensionRequest[]>([]);
  const [requestedUnits, setRequestedUnits] = useState("60");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedOrganization = useMemo(() => organizations.find((item) => item.id === organizationId) ?? null, [organizations, organizationId]);

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
      const [summaryData, requestData, workspaceData] = await Promise.all([
        creditsApi.getSummary(org.id),
        creditsApi.getRequests(org.id),
        workspacesApi.list(org.id),
      ]);
      setSummary(summaryData);
      setRequests(requestData);
      setWorkspaces(workspaceData);
      const storedWorkspace = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
      const workspace = workspaceData.find((item) => item.id === storedWorkspace) ?? workspaceData[0] ?? null;
      setWorkspaceId(workspace?.id ?? null);
      if (workspace) localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspace.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load test capacity.");
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
      setError(cause instanceof Error ? cause.message : "Unable to submit the capacity request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading test capacity…</div>;

  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs font-mono uppercase tracking-widest text-primary">Organization capacity</div><h1 className="mt-2 font-display text-2xl font-semibold">Test capacity</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{selectedOrganization ? `Capacity for ${selectedOrganization.name}.` : "Choose an organization to view capacity."} Matrix QA manages provider usage and run limits automatically so you can focus on the evidence-backed report.</p></div><button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div>{error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}{message && <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</div>}{summary && <section className="surface-card p-5"><div className="flex items-start gap-3"><div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${summary.warningLevel >= 100 ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}><AlertTriangle className="h-4 w-4" /></div><div><h2 className="font-display text-base font-semibold">{summary.warningLevel >= 100 ? "Your organization has reached its current alpha capacity" : "Your organization has active alpha capacity"}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{summary.warningLevel >= 100 ? "New tests may wait until capacity becomes available or a Matrix QA staff member approves an extension request." : "Start a browser test from the Run Console. If shared provider capacity is temporarily full, Matrix QA will queue and retry the run automatically."}</p></div></div></section>}{!summary && <section className="surface-card p-6"><p className="text-sm text-muted-foreground">No organization capacity is available. Create one in <Link to="/app/settings/organization" className="text-primary hover:underline">Organization settings</Link>.</p></section>}{summary && <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,1fr)]"><section className="surface-card p-5"><h2 className="font-display text-base font-semibold">Request more test capacity</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">If your team needs additional alpha testing, send a request to Matrix QA staff. Choose the workspace that needs it and explain the workload.</p><form onSubmit={submitRequest} className="mt-4 space-y-3"><label className="block text-xs font-medium">Workspace<select value={workspaceId ?? ""} onChange={(event) => setWorkspaceId(event.target.value)} required className="mt-1.5 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm"><option value="" disabled>Select a workspace</option>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label><label className="block text-xs font-medium">Request size<select value={requestedUnits} onChange={(event) => setRequestedUnits(event.target.value)} required className="mt-1.5 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm"><option value="30">Small extension</option><option value="60">Standard extension</option><option value="120">Large extension</option></select></label><label className="block text-xs font-medium">Reason<textarea minLength={10} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain the additional alpha workload…" required className="mt-1.5 min-h-24 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /></label><button disabled={submitting || !workspaceId || reason.trim().length < 10} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send request</button></form></section><section className="surface-card p-5"><div className="flex items-center justify-between"><h2 className="font-display text-base font-semibold">Requests</h2><Link to="/app/settings/organization" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Manage workspace <ArrowUpRight className="h-3 w-3" /></Link></div><div className="mt-3 max-h-[20rem] space-y-2 overflow-y-auto">{requests.length === 0 ? <p className="text-xs text-muted-foreground">No capacity requests yet.</p> : requests.slice(0, 5).map((request) => <div key={request.id} className="rounded-md border border-border/60 bg-surface-2/30 px-3 py-2"><div className="flex items-center justify-between gap-3"><div className="truncate text-xs font-medium">Capacity extension request</div><span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">{request.status}</span></div><div className="mt-1 truncate text-[11px] text-muted-foreground">{request.reason}</div></div>)}</div></section></div>}{summary && <p className="max-w-3xl text-xs leading-5 text-muted-foreground">{summary.warningLevel >= 100 ? "When capacity is restored or a staff extension is approved, queued work can continue automatically." : "Capacity is managed at the organization level. Workspace runs are queued fairly and provider cost details remain internal to Matrix QA operations."}</p>}</div>;
}
