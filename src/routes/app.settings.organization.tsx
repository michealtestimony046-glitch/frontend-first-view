import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, FolderKanban, Loader2, RefreshCw, Pencil, ShieldCheck, Trash2, Plus } from "lucide-react";
import {
  organizationsApi,
  workspacesApi,
  workspaceConsentApi,
  targetComplaintsApi,
  type Organization,
  type Workspace,
  type WorkspaceMemoryConsent,
  type TargetComplaint,
} from "@/lib/api-client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

const ACTIVE_ORG_KEY = "matrix_qa_active_organization";
const ACTIVE_WORKSPACE_KEY = "matrix_qa_active_workspace";

export const Route = createFileRoute("/app/settings/organization")({
  head: () => ({
    meta: [{ title: "Organization & Workspaces · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [complaintTargetUrl, setComplaintTargetUrl] = useState("");
  const [complaintReason, setComplaintReason] = useState("");
  const [complaints, setComplaints] = useState<TargetComplaint[]>([]);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintMessage, setComplaintMessage] = useState<string | null>(null);
  const [creatingOrganization, setCreatingOrganization] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingOrganization, setEditingOrganization] = useState(false);
  const [organizationEditName, setOrganizationEditName] = useState("");
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [workspaceEditName, setWorkspaceEditName] = useState("");
  const [consents, setConsents] = useState<Record<string, WorkspaceMemoryConsent>>({});
  const [consentErrors, setConsentErrors] = useState<Record<string, boolean>>({});
  const [loadingConsentFor, setLoadingConsentFor] = useState<string | null>(null);
  const [savingConsentFor, setSavingConsentFor] = useState<string | null>(null);
  const [consentMessage, setConsentMessage] = useState<string | null>(null);
  const [deletingWorkspaceDataId, setDeletingWorkspaceDataId] = useState<string | null>(null);
  const [dataDeletionMessage, setDataDeletionMessage] = useState<string | null>(null);

  const activeOrganization = useMemo(
    () => organizations.find((organization) => organization.id === organizationId) ?? null,
    [organizations, organizationId],
  );
  const ownsOrganization = organizations.some((organization) => organization.ownerId === user?.id);
  const canManageConsent = Boolean(activeOrganization && (activeOrganization.ownerId === user?.id || activeOrganization.members?.some((member) => member.userId === user?.id && ["OWNER", "ADMIN"].includes(member.role.toUpperCase()))));
  const canManageWorkspace = canManageConsent;

  const loadOrganizations = async () => {
    setLoadingOrganizations(true);
    setError(null);
    try {
      const items = await organizationsApi.list();
      setOrganizations(items);
      const stored = localStorage.getItem(ACTIVE_ORG_KEY);
      const selected = items.find((item) => item.id === stored) ?? items[0] ?? null;
      setOrganizationId(selected?.id ?? null);
      if (selected) localStorage.setItem(ACTIVE_ORG_KEY, selected.id);
    } catch (cause) {
      setError(toMessage(cause, "Unable to load organizations."));
    } finally {
      setLoadingOrganizations(false);
    }
  };

  useEffect(() => {
    void loadOrganizations();
    targetComplaintsApi.list().then(setComplaints).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!organizationId) {
      setWorkspaces([]);
      return;
    }
    let cancelled = false;
    setLoadingWorkspaces(true);
    setError(null);
    workspacesApi
      .list(organizationId)
      .then((items) => {
        if (cancelled) return;
        setWorkspaces(items);
        const stored = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
        const selected = items.find((item) => item.id === stored) ?? items[0] ?? null;
        if (selected) localStorage.setItem(ACTIVE_WORKSPACE_KEY, selected.id);
      })
      .catch((cause) => {
        if (!cancelled) setError(toMessage(cause, "Unable to load workspaces."));
      })
      .finally(() => {
        if (!cancelled) setLoadingWorkspaces(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  useEffect(() => {
    if (workspaces.length === 0) {
      setConsents({});
      setConsentErrors({});
      return;
    }
    let cancelled = false;
    setLoadingConsentFor("all");
    Promise.all(workspaces.map(async (workspace) => {
      try {
        return { consent: await workspaceConsentApi.get(workspace.id), error: false, workspaceId: workspace.id };
      } catch {
        return { consent: null, error: true, workspaceId: workspace.id };
      }
    })).then((items) => {
      if (cancelled) return;
      setConsents(Object.fromEntries(items.flatMap((item) => item.consent ? [[item.consent.workspaceId, item.consent] as const] : [])));
      setConsentErrors(Object.fromEntries(items.flatMap((item) => item.error && item.workspaceId ? [[item.workspaceId, true] as const] : [])));
    }).finally(() => {
      if (!cancelled) setLoadingConsentFor(null);
    });
    return () => {
      cancelled = true;
    };
  }, [workspaces]);

  const updateConsent = async (workspaceId: string, enabled: boolean) => {
    if (!canManageConsent) return;
    setSavingConsentFor(workspaceId);
    setConsentMessage(null);
    try {
      const updated = await workspaceConsentApi.update(workspaceId, enabled);
      setConsents((current) => ({ ...current, [workspaceId]: updated }));
      setConsentMessage(`${enabled ? "Anonymized pattern sharing enabled" : "Anonymized pattern sharing disabled"}.`);
    } catch (cause) {
      setConsentMessage(toMessage(cause, "Unable to update the workspace data-sharing preference."));
    } finally {
      setSavingConsentFor(null);
    }
  };

  const createOrganization = async (event: FormEvent) => {
    event.preventDefault();
    if (ownsOrganization) {
      setError("Alpha accounts currently support one organization. Use your existing organization for now.");
      return;
    }
    const name = organizationName.trim();
    if (!name) return;
    setCreatingOrganization(true);
    setError(null);
    try {
      const created = await organizationsApi.create({ name });
      setOrganizations((current) => [created, ...current]);
      setOrganizationId(created.id);
      localStorage.setItem(ACTIVE_ORG_KEY, created.id);
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      setOrganizationName("");
    } catch (cause) {
      setError(toMessage(cause, "Unable to create organization."));
    } finally {
      setCreatingOrganization(false);
    }
  };

  const renameOrganization = async (event: FormEvent) => {
    event.preventDefault();
    if (!organizationId || !organizationEditName.trim()) return;
    try {
      const updated = await organizationsApi.rename(organizationId, organizationEditName.trim());
      setOrganizations((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditingOrganization(false);
    } catch (cause) {
      setError(toMessage(cause, "Unable to rename organization."));
    }
  };

  const deleteOrganization = async () => {
    if (!organizationId || !window.confirm("Delete this organization and its workspaces? This cannot be undone.")) return;
    try {
      await organizationsApi.remove(organizationId);
      localStorage.removeItem(ACTIVE_ORG_KEY);
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      await loadOrganizations();
    } catch (cause) {
      setError(toMessage(cause, "Unable to delete organization."));
    }
  };

  const renameWorkspace = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingWorkspaceId || !workspaceEditName.trim()) return;
    try {
      const updated = await workspacesApi.rename(editingWorkspaceId, workspaceEditName.trim());
      setWorkspaces((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditingWorkspaceId(null);
    } catch (cause) {
      setError(toMessage(cause, "Unable to rename workspace."));
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    if (!window.confirm("Delete this workspace and its projects? This cannot be undone.")) return;
    try {
      await workspacesApi.remove(workspaceId);
      if (localStorage.getItem(ACTIVE_WORKSPACE_KEY) === workspaceId) localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      setWorkspaces((current) => current.filter((item) => item.id !== workspaceId));
    } catch (cause) {
      setError(toMessage(cause, "Unable to delete workspace."));
    }
  };

  const deleteWorkspaceData = async (workspaceId: string, workspaceName: string) => {
    if (deletingWorkspaceDataId || !window.confirm(`Delete all test runs, findings, screenshots, videos, reasoning logs, and workspace memory for “${workspaceName}”? This cannot be undone. The workspace itself will remain.`)) return;
    setDeletingWorkspaceDataId(workspaceId);
    setDataDeletionMessage(null);
    setError(null);
    try {
      const result = await workspacesApi.deleteData(workspaceId);
      setDataDeletionMessage(`Deleted ${result.deletedRuns} run(s), ${result.r2ObjectsDeleted} stored object(s), and ${result.databaseRecordsDeleted} database record(s). Preserved ${result.preservedCreditLedgerEntries} immutable credit-ledger record(s).`);
    } catch (cause) {
      setError(toMessage(cause, "Unable to delete workspace test data."));
    } finally {
      setDeletingWorkspaceDataId(null);
    }
  };

  const createWorkspace = async (event: FormEvent) => {
    event.preventDefault();
    const name = workspaceName.trim();
    if (!organizationId || !name) return;
    setCreatingWorkspace(true);
    setError(null);
    try {
      const created = await workspacesApi.create({ organizationId, name });
      setWorkspaces((current) => [created, ...current]);
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, created.id);
      setWorkspaceName("");
    } catch (cause) {
      setError(toMessage(cause, "Unable to create workspace."));
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const submitComplaint = async (event: FormEvent) => {
    event.preventDefault();
    const targetUrl = complaintTargetUrl.trim();
    const reason = complaintReason.trim();
    if (!targetUrl || reason.length < 10) return;
    setSubmittingComplaint(true);
    setComplaintMessage(null);
    try {
      const created = await targetComplaintsApi.create({ targetUrl, reason });
      setComplaints((current) => [created, ...current]);
      setComplaintTargetUrl("");
      setComplaintReason("");
      setComplaintMessage("Your target report was sent to the Matrix QA operations team.");
    } catch (cause) {
      setComplaintMessage(toMessage(cause, "Unable to submit the target report."));
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Organization & workspaces</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Organizations own workspaces; workspaces contain projects and runs. These records are loaded from the live backend.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOrganizations()}
          disabled={loadingOrganizations}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/60 px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingOrganizations ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {dataDeletionMessage && <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary" role="status">{dataDeletionMessage}</div>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="surface-card overflow-hidden">
          <header className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="font-display text-base font-semibold">Organizations</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Select the organization whose workspaces you want to manage.</p>
          </header>
          {activeOrganization && <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><div className="text-sm font-medium">{activeOrganization.name}</div><div className="text-[11px] text-muted-foreground">{activeOrganization.members?.length ?? 0} member record(s)</div></div><div className="flex gap-1.5"><button type="button" onClick={() => { setOrganizationEditName(activeOrganization.name); setEditingOrganization((current) => !current); }} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent" aria-label="Rename organization"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => void deleteOrganization()} className="rounded-md border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete organization"><Trash2 className="h-3.5 w-3.5" /></button></div></div>}
          {editingOrganization && <form onSubmit={renameOrganization} className="flex gap-2 border-b border-border p-4"><input value={organizationEditName} onChange={(event) => setOrganizationEditName(event.target.value)} className="min-w-0 flex-1 rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><button className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Save</button></form>}
          <div className="space-y-2 p-4">
            {loadingOrganizations ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading organizations…</div>
            ) : organizations.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No organizations yet.</p>
            ) : (
              organizations.map((organization) => (
                <button
                  key={organization.id}
                  type="button"
                  onClick={() => {
                    setOrganizationId(organization.id);
                    localStorage.setItem(ACTIVE_ORG_KEY, organization.id);
                    localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
                  }}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm ${organization.id === organizationId ? "border-primary/50 bg-primary/10" : "border-border bg-surface-2/30 hover:bg-accent"}`}
                >
                  <span className="min-w-0 truncate">{organization.name}</span>
                  <span className="ml-3 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">{organization.id === organizationId ? "Active" : "Select"}</span>
                </button>
              ))
            )}
          </div>
          {ownsOrganization ? <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted-foreground">The private alpha currently supports one organization per account. Use the existing organization for now.</p> : <form onSubmit={createOrganization} className="border-t border-border p-4">
            <label className="block text-xs font-medium text-muted-foreground">Create organization</label>
            <div className="mt-1.5 flex gap-2">
              <input
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Acme QA Organization"
                className="min-w-0 flex-1 rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button type="submit" disabled={creatingOrganization || !organizationName.trim()} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">
                {creatingOrganization ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Create
              </button>
            </div>
          </form>}
        </section>

        <section className="surface-card overflow-hidden">
          <header className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" />
              <h3 className="font-display text-base font-semibold">Workspaces</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{activeOrganization ? `Workspaces in ${activeOrganization.name}` : "Choose an organization first."}</p>
          </header>
          <div className="p-4">
            {loadingWorkspaces ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading workspaces…</div>
            ) : !organizationId ? (
              <p className="py-4 text-sm text-muted-foreground">No organization selected.</p>
            ) : workspaces.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No workspaces yet. Create the first one below.</p>
            ) : (
              <div className="space-y-2">
                {workspaces.map((workspace) => (
                    <div key={workspace.id} className="rounded-md border border-border bg-surface-2/30 px-3 py-2.5">
                      {editingWorkspaceId === workspace.id ? <form onSubmit={renameWorkspace} className="flex gap-2"><input value={workspaceEditName} onChange={(event) => setWorkspaceEditName(event.target.value)} className="min-w-0 flex-1 rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><button className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Save</button></form> : <div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-medium">{workspace.name}</div><div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{workspace.id.slice(0, 8)}… · {workspace.projects?.length ?? 0} project(s)</div></div><div className="flex shrink-0 items-center gap-1.5"><Link to="/app/projects" className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent">Open projects</Link>{canManageWorkspace && <button type="button" onClick={() => void deleteWorkspaceData(workspace.id, workspace.name)} disabled={deletingWorkspaceDataId === workspace.id} className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:cursor-wait disabled:opacity-60" aria-label={`Delete test data from ${workspace.name}`}>{deletingWorkspaceDataId === workspace.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Delete data</button>}<button type="button" onClick={() => { setEditingWorkspaceId(workspace.id); setWorkspaceEditName(workspace.name); }} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent" aria-label={`Rename ${workspace.name}`}><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => void deleteWorkspace(workspace.id)} className="rounded-md border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/10" aria-label={`Delete ${workspace.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div>}
                    </div>
                ))}
              </div>
            )}
          </div>
          {workspaces.length > 0 && <div className="border-t border-border p-4">
            <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><h4 className="text-sm font-semibold">Privacy and improvement</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">Your workspace data is private by default. This optional preference controls whether anonymized patterns may contribute to Matrix QA’s aggregate improvement memory; it never shares your site data, screenshots, or findings.</p></div></div>
            <div className="mt-3 space-y-2">
              {workspaces.map((workspace) => {
                const consent = consents[workspace.id];
                const consentUnavailable = consentErrors[workspace.id] === true;
                const enabled = consent?.globalAggregateOptIn === true;
                const isLoading = loadingConsentFor === "all" && !consent && !consentUnavailable;
                const isSaving = savingConsentFor === workspace.id;
                return <label key={`consent-${workspace.id}`} className={`flex items-start gap-3 rounded-md border px-3 py-3 text-sm ${canManageConsent && !consentUnavailable ? "cursor-pointer" : "cursor-not-allowed opacity-80"}`}><input type="checkbox" checked={enabled} onChange={(event) => void updateConsent(workspace.id, event.target.checked)} disabled={!canManageConsent || isLoading || isSaving || consentUnavailable} className="mt-0.5 accent-primary" /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 font-medium text-foreground"><span className="truncate">{workspace.name}</span><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{isLoading ? "Loading" : consentUnavailable ? "Unavailable" : enabled ? "Opted in" : "Off by default"}</span></span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{consentUnavailable ? "The workspace preference could not be loaded. Refresh before changing it." : "Allow anonymized patterns from this workspace’s test runs to help improve Matrix QA for everyone."}</span></span>{isSaving && <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />}</label>;
              })}
            </div>
            {consentMessage && <p className="mt-3 text-xs text-muted-foreground" role="status">{consentMessage}</p>}
            {!canManageConsent && <p className="mt-3 text-[11px] leading-5 text-muted-foreground">Only the organization owner or an organization admin can change this preference.</p>}
          </div>}
          <form onSubmit={createWorkspace} className="border-t border-border p-4">
            <label className="block text-xs font-medium text-muted-foreground">Create workspace in {activeOrganization?.name ?? "the selected organization"}</label>
            <div className="mt-1.5 flex gap-2">
              <input
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="Acme QA Workspace"
                disabled={!organizationId}
                className="min-w-0 flex-1 rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
              <button type="submit" disabled={creatingWorkspace || !organizationId || !workspaceName.trim()} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">
                {creatingWorkspace ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Create
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-4">
          <h3 className="font-display text-base font-semibold">Report a target concern</h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Tell us if a target is unsafe, belongs to someone else, or is producing unexpected behavior. The report is reviewed by Matrix QA staff and does not start a test.</p>
        </header>
        <form onSubmit={submitComplaint} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-end">
          <label className="block"><span className="mb-1.5 block text-xs font-medium">Target URL</span><input type="url" required value={complaintTargetUrl} onChange={(event) => setComplaintTargetUrl(event.target.value)} placeholder="https://example.com" className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium">What should staff review?</span><textarea required minLength={10} maxLength={2000} value={complaintReason} onChange={(event) => setComplaintReason(event.target.value)} placeholder="Describe the concern or unexpected target behavior…" className="min-h-10 w-full resize-y rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <button type="submit" disabled={submittingComplaint || !complaintTargetUrl.trim() || complaintReason.trim().length < 10} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">{submittingComplaint && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Send report</button>
        </form>
        {complaintMessage && <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">{complaintMessage}</p>}
        <div className="max-h-64 divide-y divide-border overflow-y-auto border-t border-border">{complaints.length === 0 ? <p className="p-5 text-xs text-muted-foreground">No target reports submitted from this account.</p> : complaints.map((complaint) => <div key={complaint.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs"><div className="min-w-0"><div className="truncate font-mono text-primary">{complaint.targetUrl}</div><div className="mt-1 truncate text-muted-foreground">{complaint.reason}</div></div><span className="shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{complaint.status.replaceAll("_", " ")}</span></div>)}</div>
      </section>
    </div>
  );
}

function toMessage(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}
