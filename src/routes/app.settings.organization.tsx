import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, FolderKanban, Loader2, Plus, RefreshCw } from "lucide-react";
import {
  organizationsApi,
  workspacesApi,
  type Organization,
  type Workspace,
} from "@/lib/api-client";
import { Link, createFileRoute } from "@tanstack/react-router";

const ACTIVE_ORG_KEY = "matrix_qa_active_organization";
const ACTIVE_WORKSPACE_KEY = "matrix_qa_active_workspace";

export const Route = createFileRoute("/app/settings/organization")({
  head: () => ({
    meta: [{ title: "Organization & Workspaces · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [creatingOrganization, setCreatingOrganization] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOrganization = useMemo(
    () => organizations.find((organization) => organization.id === organizationId) ?? null,
    [organizations, organizationId],
  );

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

  const createOrganization = async (event: FormEvent) => {
    event.preventDefault();
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="surface-card overflow-hidden">
          <header className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="font-display text-base font-semibold">Organizations</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Select the organization whose workspaces you want to manage.</p>
          </header>
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
          <form onSubmit={createOrganization} className="border-t border-border p-4">
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
          </form>
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
                  <div key={workspace.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2/30 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{workspace.name}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{workspace.id.slice(0, 8)}…</div>
                    </div>
                    <Link to="/app/projects" className="shrink-0 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent">Open projects</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
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
    </div>
  );
}

function toMessage(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}
