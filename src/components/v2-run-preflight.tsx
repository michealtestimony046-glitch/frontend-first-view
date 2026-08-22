import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, Loader2, Play, Radar, RefreshCw, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import {
  v2Api,
  type Project,
  type ProviderCapacityDecision,
  type TriggerRunResponse,
  type V2ApplicationScan,
  type V2Environment,
  type V2MissionAccessMode,
  normalizeV2PlannerMode,
  type V2PlannerMode,
  type V2TestPlan,
} from "@/lib/api-client";

type Phase = "idle" | "scanning" | "planning" | "ready" | "starting";

type Props = {
  project: Project;
  initialTargetUrl?: string;
  onClose: () => void;
  onStarted: (response: TriggerRunResponse & { planId?: string }) => void;
};

const sleep = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function normalizeTargetUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function V2RunPreflight({ project, initialTargetUrl, onClose, onStarted }: Props) {
  const [targetUrl, setTargetUrl] = useState(() => normalizeTargetUrl(initialTargetUrl || project.defaultTargetUrl || project.targetUrl || ""));
  const [missionGoal, setMissionGoal] = useState("Test this website thoroughly.");
  const [accessMode] = useState<V2MissionAccessMode>("ANONYMOUS");
  const [environments, setEnvironments] = useState<V2Environment[]>([]);
  const [environmentId, setEnvironmentId] = useState("");
  const [mode, setMode] = useState<V2PlannerMode>("QUICK_SMOKE");
  const [planName, setPlanName] = useState("Fresh adaptive smoke plan");
  const [enableVision, setEnableVision] = useState(false);
  const [enableRecovery, setEnableRecovery] = useState(false);
  const [targetAuthorizationConfirmed, setTargetAuthorizationConfirmed] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [scan, setScan] = useState<V2ApplicationScan | null>(null);
  const [plan, setPlan] = useState<V2TestPlan | null>(null);
  const [capacityStatus, setCapacityStatus] = useState<ProviderCapacityDecision | null>(null);
  const [queuedResponse, setQueuedResponse] = useState<TriggerRunResponse & { planId?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    v2Api.listEnvironments(project.id).then((items) => {
      if (!cancelled) setEnvironments(items);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [project.id]);

  const blockedPolicies = useMemo(
    () => plan?.policyDecisions.filter((decision) => decision.status !== "ALLOWED" && decision.status !== "APPROVED") ?? [],
    [plan],
  );
  const aiPlan = plan?.projectMap?.aiPlan;
  const readyToStart = Boolean(plan && plan.status !== "FAILED" && plan.scenarios.length > 0 && blockedPolicies.length === 0 && targetAuthorizationConfirmed);
  const waitingForProvider = capacityStatus?.status === "WAITING" && Boolean(queuedResponse);

  const prepare = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedTargetUrl = normalizeTargetUrl(targetUrl);
    if (!normalizedTargetUrl && !environmentId) {
      setError("Enter a target URL or choose an environment before starting fresh discovery.");
      return;
    }
    setError(null);
    setPlan(null);
    setScan(null);
    setCapacityStatus(null);
    setQueuedResponse(null);
    setPhase("scanning");
    try {
      const createdScan = await v2Api.startScan(project.id, {
        ...(environmentId ? { environmentId } : { targetUrl: normalizedTargetUrl }),
        missionGoal: missionGoal.trim() || "Test this website thoroughly.",
        accessMode,
      });
      setScan(createdScan);
      let current = createdScan;
      while (current.status === "PENDING" || current.status === "RUNNING") {
        await sleep(1800);
        current = await v2Api.getScan(current.id);
        setScan(current);
      }
      if (current.status !== "COMPLETED") throw new Error(current.errorMessage || "Fresh discovery could not complete.");
      setPhase("planning");
      const createdPlan = await v2Api.createPlanFromScan(current.id, {
        name: planName.trim() || "Fresh adaptive smoke plan",
        mode,
        missionGoal: missionGoal.trim() || "Test this website thoroughly.",
        accessMode,
      });
      setPlan(createdPlan);
      setPhase("ready");
    } catch (cause) {
      setPhase("idle");
      setError(cause instanceof Error ? cause.message : "Unable to prepare the browser test.");
    }
  };

  const start = async () => {
    if (!plan || !readyToStart) return;
    setError(null);
    setPhase("starting");
    try {
      const approved = plan.status === "APPROVED" ? plan : await v2Api.approvePlan(plan.id);
      const response = await v2Api.runPlan(approved.id, { targetUrl: normalizeTargetUrl(targetUrl) || undefined, accessMode, enableVision, enableRecovery, targetAuthorizationConfirmed });
      const providerCapacity = response.metadata?.providerCapacity;
      if (providerCapacity?.status === "WAITING") {
        setCapacityStatus(providerCapacity);
        setQueuedResponse(response);
        setPhase("ready");
        return;
      }
      onStarted(response);
    } catch (cause) {
      setPhase("ready");
      setError(cause instanceof Error ? cause.message : "Unable to start the browser test. Capacity is managed automatically; please try again when the current provider window is available.");
    }
  };

  const busy = phase === "scanning" || phase === "planning" || phase === "starting";

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center">
    <div className="surface-card max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto sm:max-h-[calc(100vh-3rem)]">
      <header className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary"><Radar className="h-5 w-5" /></span><div><h2 className="font-display text-lg font-semibold">Prepare a browser test</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Every run maps the current product and creates a fresh plan before browser execution. Capacity and usage are managed automatically.</p></div></div>
        <button type="button" onClick={onClose} disabled={busy} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-40" aria-label="Close"><XCircle className="h-4 w-4" /></button>
      </header>
      <form onSubmit={(event) => { void prepare(event); }} className="space-y-4 p-5">
        <label className="block"><span className="mb-1.5 block text-xs font-medium">What should Matrix QA investigate?</span><textarea value={missionGoal} onChange={(event) => setMissionGoal(event.target.value)} disabled={busy} rows={3} maxLength={2_000} className="w-full resize-y rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-sm leading-5 outline-none focus:border-primary disabled:opacity-60" placeholder="Test this website thoroughly." /><span className="mt-1 block text-[11px] text-muted-foreground">Describe the goal in your own words. Matrix QA will decide the safe coverage plan from live observations.</span></label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium">Target URL</span><input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} disabled={busy || Boolean(environmentId)} placeholder="https://your-app.com" className="w-full rounded-md border border-border bg-surface-2/60 px-3 py-2.5 font-mono text-sm outline-none focus:border-primary disabled:opacity-60" />{targetUrl.trim() && !/^https?:\/\//i.test(targetUrl.trim()) && <span className="mt-1 block text-[11px] text-muted-foreground">A protocol is missing; Matrix QA will use <code>https://</code> for this host.</span>}</label>
        {environments.length > 0 && <label className="block"><span className="mb-1.5 block text-xs font-medium">Environment <span className="font-normal text-muted-foreground">(optional)</span></span><select value={environmentId} onChange={(event) => setEnvironmentId(event.target.value)} disabled={busy} className="w-full rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-sm outline-none focus:border-primary"><option value="">Use the project target</option>{environments.map((environment) => <option key={environment.id} value={environment.id}>{environment.name} · {environment.kind}</option>)}</select></label>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-medium">Plan mode</span><select value={mode} onChange={(event) => setMode(normalizeV2PlannerMode(event.target.value))} disabled={busy} className="w-full rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-sm outline-none focus:border-primary"><option value="QUICK_SMOKE">Quick smoke</option><option value="STANDARD_ADAPTIVE">Standard adaptive</option><option value="DEEP_MATRIX">Deep matrix</option></select></label><label className="block"><span className="mb-1.5 block text-xs font-medium">Plan name</span><input value={planName} onChange={(event) => setPlanName(event.target.value)} disabled={busy} className="w-full rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-sm outline-none focus:border-primary" /></label></div>
        {phase === "idle" && <p className="rounded-md border border-border/60 bg-surface-2/30 p-3 text-xs leading-5 text-muted-foreground">Click <strong className="text-foreground">Prepare test</strong> to create a fresh map and a run-specific plan. This does not start the browser.</p>}
        {waitingForProvider && capacityStatus && <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong className="font-semibold">Shared test capacity is queued.</strong> {capacityStatus.reason || "The run is waiting for the next available test capacity window."} {capacityStatus.retryAt ? <> It will be retried automatically after <strong>{new Date(capacityStatus.retryAt).toLocaleString()}</strong>.</> : null}</span></div>}
        {phase === "ready" && plan && <div className="grid gap-2 rounded-md border border-border/70 bg-surface-2/30 p-3 text-xs"><div className="font-medium text-foreground">Optional run capabilities</div><label className="flex cursor-pointer items-start gap-2"><input type="checkbox" checked={enableVision} onChange={(event) => setEnableVision(event.target.checked)} disabled={busy} className="mt-0.5 accent-primary" /><span><span className="flex items-center gap-1.5 font-medium"><Eye className="h-3.5 w-3.5 text-primary" />Enable vision checks</span><span className="mt-0.5 block text-muted-foreground">Off by default. Lets the worker request visual screenshot analysis when text evidence is insufficient.</span></span></label><label className="flex cursor-pointer items-start gap-2"><input type="checkbox" checked={enableRecovery} onChange={(event) => setEnableRecovery(event.target.checked)} disabled={busy} className="mt-0.5 accent-primary" /><span><span className="flex items-center gap-1.5 font-medium"><RefreshCw className="h-3.5 w-3.5 text-primary" />Enable recovery attempts</span><span className="mt-0.5 block text-muted-foreground">Off by default. Lets the worker try approved equivalent locators when the primary locator is not actionable.</span></span></label><label className="flex cursor-pointer items-start gap-2 border-t border-border/60 pt-3"><input type="checkbox" checked={targetAuthorizationConfirmed} onChange={(event) => setTargetAuthorizationConfirmed(event.target.checked)} disabled={busy} className="mt-0.5 accent-primary" /><span><span className="flex items-center gap-1.5 font-medium"><ShieldCheck className="h-3.5 w-3.5 text-primary" />I own or am authorized to test this target</span><span className="mt-0.5 block text-muted-foreground">Matrix QA will use the target only for this authorized QA run. This confirmation is saved with the run audit record.</span></span></label><p className="text-[11px] text-muted-foreground">Capacity handling is managed automatically, and any provider wait is retried without requiring another submission.</p></div>}
        {(phase === "scanning" || phase === "planning") && <div className="rounded-md border border-primary/30 bg-primary/5 p-4"><div className="flex items-center gap-2 text-sm font-medium text-primary"><Loader2 className="h-4 w-4 animate-spin" />{phase === "scanning" ? "Mapping the current application…" : "Building the run-specific plan…"}</div><div className="mt-3 grid gap-2 text-xs text-muted-foreground"><span className={scan?.status === "COMPLETED" ? "text-success" : ""}>01 · Fresh read-only discovery {scan?.status === "COMPLETED" ? "complete" : "in progress"}</span><span className={plan ? "text-success" : ""}>02 · Test planning {plan ? "complete" : "waiting"}</span><span>03 · Policy review waiting</span></div></div>}
        {phase === "ready" && plan && <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-semibold text-primary"><CheckCircle2 className="h-4 w-4" /> Fresh test plan ready</div><p className="mt-1 text-xs text-muted-foreground">{plan.scenarios.length} test scenarios · {plan.mode.replaceAll("_", " ")}</p><p className="mt-2 max-w-md text-xs leading-5 text-foreground/80">Mission: {aiPlan?.missionSummary ?? plan.projectMap?.mission?.goal ?? missionGoal}</p>{plan.projectMap?.coverageFrontier?.counts && <p className="mt-1 text-xs text-muted-foreground">Coverage frontier: {plan.projectMap.coverageFrontier.counts.total} discovered items · {plan.projectMap.coverageFrontier.counts.untested} untested · {plan.projectMap.coverageFrontier.counts.blocked} blocked</p>}</div><div className="text-right"><div className="font-display text-lg font-semibold text-success">Ready</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">fresh plan prepared</div></div></div><div className="rounded-md border border-primary/20 bg-background/30 p-3 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-foreground">Plan rationale</strong></div><p className="mt-1 leading-5 text-muted-foreground">{plan.plannerRationale ?? aiPlan?.planningRationale ?? "The plan selected these scenarios from the fresh discovery evidence."}</p>{aiPlan?.uncoveredAreas?.length ? <p className="mt-2 leading-5 text-warning">Needs review later: {aiPlan.uncoveredAreas.join(" · ")}</p> : null}</div><div className="border-t border-primary/20 pt-3 text-xs text-muted-foreground">The browser worker will run this fresh plan within your organization’s available capacity. Unused capacity is handled automatically after settlement.</div>{blockedPolicies.length > 0 && <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{blockedPolicies.length} policy decision{blockedPolicies.length === 1 ? "" : "s"} require review before this plan can run. Open the advanced Discovery review to resolve them.</span></div>}</div>}
        {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
        <footer className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-40">Cancel</button>{phase === "idle" || phase === "ready" ? <button type={phase === "idle" ? "submit" : "button"} onClick={phase === "ready" ? () => { if (waitingForProvider && queuedResponse) onStarted(queuedResponse); else void start(); } : undefined} disabled={phase === "idle" ? busy || !targetUrl.trim() && !environmentId : busy || (!waitingForProvider && !readyToStart)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">{phase === "idle" ? <><Radar className="h-4 w-4" /> Prepare test</> : waitingForProvider ? <><Play className="h-4 w-4" /> Open queued run</> : <><Play className="h-4 w-4" /> Start browser test</>}</button> : <span className="inline-flex items-center gap-2 rounded-md bg-primary/15 px-4 py-2 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin" />{phase === "starting" ? "Reserving and starting…" : "Preparing…"}</span>}</footer>
      </form>
    </div>
  </div>;
}
