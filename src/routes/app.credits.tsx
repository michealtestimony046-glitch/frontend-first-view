import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Loader2, RefreshCw, Send } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  creditsApi,
  organizationsApi,
  plansApi,
  workspacesApi,
  type AllocationExtensionRequest,
  type CreditsSummary,
  type EffectivePlanResponse,
  type Organization,
  type Workspace,
} from "@/lib/api-client";
import { subscribeToCustomerBalanceUpdates } from "@/lib/balance-events";

const ACTIVE_ORG_KEY = "matrix_qa_active_organization";
const ACTIVE_WORKSPACE_KEY = "matrix_qa_active_workspace";

export const Route = createFileRoute("/app/credits")({
  head: () => ({
    meta: [{ title: "Test capacity · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: CreditsPage,
});

function formatUnits(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.max(0, value));
}

function CreditsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [summary, setSummary] = useState<CreditsSummary | null>(null);
  const [effectivePlan, setEffectivePlan] = useState<EffectivePlanResponse | null>(null);
  const [requests, setRequests] = useState<AllocationExtensionRequest[]>([]);
  const [requestedUnits, setRequestedUnits] = useState("60");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedOrganization = useMemo(
    () => organizations.find((item) => item.id === organizationId) ?? null,
    [organizations, organizationId],
  );
  const hasActiveAlphaAccess =
    effectivePlan?.accessSource === "ALPHA" && effectivePlan.alphaRewardActive;
  const usedPercent = summary ? Math.min(100, Math.max(0, summary.usagePercent)) : 0;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const orgs = await organizationsApi.list();
      setOrganizations(orgs);
      const storedOrg = localStorage.getItem(ACTIVE_ORG_KEY);
      const org = orgs.find((item) => item.id === storedOrg) ?? orgs[0] ?? null;
      setOrganizationId(org?.id ?? null);
      setEffectivePlan(null);
      if (!org) {
        setSummary(null);
        setRequests([]);
        setWorkspaces([]);
        setWorkspaceId(null);
        return;
      }
      localStorage.setItem(ACTIVE_ORG_KEY, org.id);
      const [summaryData, requestData, workspaceData, planData] = await Promise.all([
        creditsApi.getSummary(org.id),
        creditsApi.getRequests(org.id),
        workspacesApi.list(org.id),
        plansApi.effective(org.id).catch(() => null),
      ]);
      setSummary(summaryData);
      setRequests(requestData);
      setWorkspaces(workspaceData);
      setEffectivePlan(planData);
      const storedWorkspace = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
      const workspace =
        workspaceData.find((item) => item.id === storedWorkspace) ?? workspaceData[0] ?? null;
      setWorkspaceId(workspace?.id ?? null);
      if (workspace) localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspace.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load test capacity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    const refreshSummary = () => {
      void creditsApi.getSummary(organizationId)
        .then((nextSummary) => {
          if (!cancelled) setSummary(nextSummary);
        })
        .catch(() => undefined);
    };
    return subscribeToCustomerBalanceUpdates(refreshSummary);
  }, [organizationId]);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organizationId || !workspaceId || !hasActiveAlphaAccess) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await creditsApi.requestExtension(organizationId, workspaceId, {
        requestedUnits: Number(requestedUnits),
        reason,
      });
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading test capacity…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-primary">
            Organization capacity
          </div>
          <h1 className="mt-2 font-display text-2xl font-semibold">Test capacity</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {selectedOrganization
              ? `Capacity for ${selectedOrganization.name}.`
              : "Choose an organization to view capacity."}{" "}
            Your Matrix Unit balance and run capacity are shown below.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          {message}
        </div>
      )}

      {summary ? (
        <section className="surface-card p-5" aria-labelledby="matrix-unit-balance-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-primary">
                Matrix Unit balance
              </div>
              <h2
                id="matrix-unit-balance-title"
                className="mt-1 font-display text-lg font-semibold"
              >
                Live organization balance
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                Your available balance is updated from recorded run usage. Unused reservations are
                returned automatically.
              </p>
            </div>
            <div className="rounded-full border border-border bg-surface-2/50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {effectivePlan ? `${effectivePlan.plan} plan` : "Current plan"}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-primary/25 bg-primary/10 p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary">
                Available now
              </div>
              <div className="mt-2 font-display text-3xl font-semibold tracking-tight">
                {formatUnits(summary.availableUnits)}{" "}
                <span className="text-base text-primary">{summary.symbol}</span>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-2/35 p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Used this period
              </div>
              <div className="mt-2 font-display text-2xl font-semibold tracking-tight">
                {formatUnits(summary.usedUnits)}{" "}
                <span className="text-base text-muted-foreground">{summary.symbol}</span>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-2/35 p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Reserved for active runs
              </div>
              <div className="mt-2 font-display text-2xl font-semibold tracking-tight">
                {formatUnits(summary.reservedUnits)}{" "}
                <span className="text-base text-muted-foreground">{summary.symbol}</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Monthly allocation used</span>
              <span className="font-mono text-foreground">{Math.round(usedPercent)}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-label="Monthly Matrix Unit usage"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(usedPercent)}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${usedPercent}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>
                {formatUnits(summary.monthlyCeilingUnits)} {summary.symbol} regular monthly
                allocation
              </span>
              <Link
                to="/app/settings/billing"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                View billing &amp; usage <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="surface-card p-6">
          <p className="text-sm text-muted-foreground">
            No organization balance is available. Create one in{" "}
            <Link to="/app/settings/organization" className="text-primary hover:underline">
              Organization settings
            </Link>
            .
          </p>
        </section>
      )}

      {hasActiveAlphaAccess && summary ? (
        <section className="surface-card p-5">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${summary.warningLevel >= 100 ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold">
                {summary.warningLevel >= 100
                  ? "Your invited Alpha capacity is currently full"
                  : "Invited Alpha capacity is active"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                This private Alpha access is available to your invited organization. Start a browser
                test from the Run Console; if shared provider capacity is temporarily full, Matrix
                QA will queue and retry the run automatically.
              </p>
            </div>
          </div>
        </section>
      ) : summary ? (
        <section className="surface-card border-primary/20 bg-primary/5 p-5">
          <h2 className="font-display text-base font-semibold">Standard customer capacity</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Your Matrix Unit balance above is the customer-facing usage limit for this organization.
            Run costs are settled from recorded usage, and unused holds are returned automatically.
          </p>
        </section>
      ) : null}

      {hasActiveAlphaAccess && summary && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,1fr)]">
          <section className="surface-card p-5">
            <h2 className="font-display text-base font-semibold">Request more Alpha capacity</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Invited Alpha teams can request additional test capacity from Matrix QA staff. Choose
              the workspace that needs it and explain the workload.
            </p>
            <form onSubmit={submitRequest} className="mt-4 space-y-3">
              <label className="block text-xs font-medium">
                Workspace
                <select
                  value={workspaceId ?? ""}
                  onChange={(event) => setWorkspaceId(event.target.value)}
                  required
                  className="mt-1.5 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Select a workspace
                  </option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium">
                Request size
                <select
                  value={requestedUnits}
                  onChange={(event) => setRequestedUnits(event.target.value)}
                  required
                  className="mt-1.5 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm"
                >
                  <option value="30">Small extension</option>
                  <option value="60">Standard extension</option>
                  <option value="120">Large extension</option>
                </select>
              </label>
              <label className="block text-xs font-medium">
                Reason
                <textarea
                  minLength={10}
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain the additional Alpha workload…"
                  required
                  className="mt-1.5 min-h-24 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm"
                />
              </label>
              <button
                disabled={submitting || !workspaceId || reason.trim().length < 10}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}{" "}
                Send request
              </button>
            </form>
          </section>

          <section className="surface-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Alpha capacity requests</h2>
              <Link
                to="/app/settings/organization"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Manage workspace <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-3 max-h-[20rem] space-y-2 overflow-y-auto">
              {requests.length === 0 ? (
                <p className="text-xs text-muted-foreground">No Alpha capacity requests yet.</p>
              ) : (
                requests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="rounded-md border border-border/60 bg-surface-2/30 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-xs font-medium">Capacity extension request</div>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {request.status}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[11px] text-muted-foreground">
                      {request.reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {summary && (
        <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
          {hasActiveAlphaAccess
            ? "Invited Alpha capacity is managed at the organization level. Workspace runs are queued fairly, and provider cost details remain internal to Matrix QA operations."
            : "Capacity is managed at the organization level. Workspace runs are queued fairly, and provider cost details remain internal to Matrix QA operations."}
        </p>
      )}
    </div>
  );
}
