import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Eye, ExternalLink, Globe2, Loader2, Play, Radar, RefreshCw, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { v2Api, type ProviderCapacityDecision, type V2ApplicationScan, type V2Environment, type V2PlanStatus, type V2PlannerMode, type V2PolicyDecision, type V2TestPlan, type V2WebPrecheck } from "@/lib/api-client";
import { useLivePortfolio } from "@/lib/live-data";

function normalizeTargetUrl(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).toString();
  } catch {
    return "";
  }
}

function discoveryProgressLabel(phase: string | undefined) {
  switch (phase) {
    case "PRECHECK": return "Checking target reachability";
    case "BROWSER_START": return "Starting isolated browser";
    case "MAPPING": return "Mapping same-origin pages";
    case "AI_ENRICHMENT": return "Summarizing discovery evidence";
    case "FINALIZING": return "Saving the fresh map";
    case "COMPLETED": return "Discovery complete";
    case "FAILED": return "Discovery stopped";
    default: return "Waiting for discovery progress";
  }
}

export const Route = createFileRoute("/app/discovery")({
  head: () => ({
    meta: [
      { title: "Discovery · Matrix QA" },
      { name: "description", content: "Map an application, review the proposed QA plan, and start a safe adaptive run." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DiscoveryPage,
});

function DiscoveryPage() {
  const live = useLivePortfolio();
  const [environments, setEnvironments] = useState<V2Environment[]>([]);
  const [scans, setScans] = useState<V2ApplicationScan[]>([]);
  const [selectedScan, setSelectedScan] = useState<V2ApplicationScan | null>(null);
  const [plan, setPlan] = useState<V2TestPlan | null>(null);
  const [environmentId, setEnvironmentId] = useState("");
  const [planName, setPlanName] = useState("Adaptive smoke plan");
  const [mode, setMode] = useState<V2PlannerMode>("QUICK_SMOKE");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [enableVision, setEnableVision] = useState(false);
  const [enableRecovery, setEnableRecovery] = useState(false);
  const [capacityStatus, setCapacityStatus] = useState<ProviderCapacityDecision | null>(null);
  const [queuedRunId, setQueuedRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const project = live.activeProject;
  const organization = live.activeOrganization;
  const workspace = live.activeWorkspace;

  useEffect(() => {
    if (!project) {
      setEnvironments([]);
      setScans([]);
      setSelectedScan(null);
      setPlan(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([v2Api.listEnvironments(project.id), v2Api.listScans(project.id)])
      .then(([loadedEnvironments, loadedScans]) => {
        if (cancelled) return;
        setEnvironments(loadedEnvironments);
        setScans(loadedScans);
        setSelectedScan(loadedScans.find((scan) => scan.status === "RUNNING" || scan.status === "PENDING") ?? loadedScans[0] ?? null);
      })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load discovery data."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [project?.id]);

  useEffect(() => {
    if (!selectedScan || !["PENDING", "RUNNING"].includes(selectedScan.status)) {
      setScanning(false);
      return;
    }
    let cancelled = false;
    let timer: number | undefined;
    const poll = async () => {
      try {
        const refreshed = await v2Api.getScan(selectedScan.id);
        if (cancelled) return;
        setSelectedScan(refreshed);
        setScans((current) => current.map((scan) => scan.id === refreshed.id ? refreshed : scan));
        if (["PENDING", "RUNNING"].includes(refreshed.status)) {
          timer = window.setTimeout(poll, 2500);
        } else {
          setScanning(false);
        }
      } catch (cause) {
        if (!cancelled) {
          setScanning(false);
          setError(cause instanceof Error ? cause.message : "Unable to refresh scan status.");
        }
      }
    };
    setScanning(true);
    timer = window.setTimeout(poll, 1800);
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, [selectedScan?.id]);

  const startScan = async () => {
    if (!project) return;
    setError(null);
    setScanning(true);
    setPlan(null);
    try {
      const created = await v2Api.startScan(project.id, environmentId ? { environmentId } : {});
      setSelectedScan(created);
      setScans((current) => [created, ...current.filter((scan) => scan.id !== created.id)]);
    } catch (cause) {
      setScanning(false);
      setError(cause instanceof Error ? cause.message : "Unable to start application discovery.");
    }
  };

  const generatePlan = async () => {
    if (!selectedScan || selectedScan.status !== "COMPLETED") return;
    setPlanning(true);
    setError(null);
    try {
      const created = await v2Api.createPlanFromScan(selectedScan.id, { name: planName.trim() || "Adaptive smoke plan", mode });
      setPlan(created);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to generate a plan from this scan.");
    } finally {
      setPlanning(false);
    }
  };

  const reloadPlan = async () => {
    if (!plan) return;
    try { setPlan(await v2Api.getPlan(plan.id)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to refresh plan."); }
  };

  const approvePlan = async () => {
    if (!plan) return;
    setPlanning(true);
    try { setPlan(await v2Api.approvePlan(plan.id)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to approve this plan."); } finally { setPlanning(false); }
  };

  const approveDecision = async (decision: V2PolicyDecision) => {
    if (!plan) return;
    setPlanning(true);
    try { await v2Api.approvePolicy(plan.id, decision.id); await reloadPlan(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to approve this policy decision."); } finally { setPlanning(false); }
  };

  const rejectDecision = async (decision: V2PolicyDecision) => {
    if (!plan) return;
    setPlanning(true);
    try { await v2Api.rejectPolicy(plan.id, decision.id); await reloadPlan(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to reject this policy decision."); } finally { setPlanning(false); }
  };

  const runPlan = async () => {
    if (!plan) return;
    setRunning(true);
    setError(null);
    try {
      const response = await v2Api.runPlan(plan.id, { targetUrl: normalizeTargetUrl(selectedScan?.targetUrl) || undefined, enableVision, enableRecovery });
      const providerCapacity = response.metadata?.providerCapacity;
      if (providerCapacity?.status === "WAITING") {
        setCapacityStatus(providerCapacity);
        setQueuedRunId(response.id);
        setRunning(false);
        return;
      }
      window.location.href = `/app/runs/${response.id}?projectId=${encodeURIComponent(plan.projectId)}`;
    } catch (cause) {
      setRunning(false);
      setError(cause instanceof Error ? cause.message : "Unable to start the adaptive run.");
    }
  };

  const map = selectedScan?.projectMap;
  const safeToExecute = Boolean(plan && plan.status === "APPROVED" && plan.policyDecisions.length > 0 && plan.policyDecisions.every((decision) =>
    (decision.tier === "SAFE" && decision.status === "ALLOWED") ||
    (decision.tier === "CAUTION" && decision.status === "APPROVED")
  ));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary"><Radar className="h-3.5 w-3.5" /> Application discovery</div>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Map first. Test what matters.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Matrix QA observes your selected application, proposes an intent-based smoke plan, and shows the safety decisions before any adaptive run can start.</p>
        </div>
        {project && <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="rounded-md border border-border bg-surface-2/60 px-2.5 py-1.5">{organization?.name ?? "Organization"}</span><span>/</span><span>{workspace?.name ?? "Workspace"}</span><span>/</span><span className="font-medium text-foreground">{project.name}</span></div>}
      </header>

      {!project ? (
        <EmptyState />
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <section className="space-y-5">
            <div className="surface-card p-5">
              <SectionEyebrow step="01" label="Observe" />
              <h2 className="mt-3 font-display text-xl font-semibold">Discover this application</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Read-only discovery follows same-origin routes and records controls, forms, auth signals, HTTP errors, and locator candidates. It never submits an unknown form.</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-md border border-border bg-surface-2/50 px-3 py-2.5"><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Project target</div><div className="mt-1 flex items-center gap-2 text-sm"><Globe2 className="h-4 w-4 text-primary" /><span className="truncate">{project.defaultTargetUrl || "No default target configured"}</span></div></div>
                <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Environment <span className="font-normal">(optional)</span></span><select value={environmentId} onChange={(event) => setEnvironmentId(event.target.value)} className="w-full rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"><option value="">Use project target</option>{environments.map((environment) => <option key={environment.id} value={environment.id}>{environment.name} · {environment.kind}</option>)}</select></label>
                <button type="button" onClick={startScan} disabled={scanning || loading || !project.defaultTargetUrl && !environmentId} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow disabled:cursor-not-allowed disabled:opacity-45">{scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}{scanning ? "Mapping application…" : "Start read-only discovery"}</button>
                {!project.defaultTargetUrl && !environmentId && <p className="text-xs text-warning">Add a project target or create an environment before scanning.</p>}
              </div>
            </div>

            <div className="surface-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-display text-base font-semibold">Discovery history</h2><p className="text-[11px] text-muted-foreground">Only scans for this project are shown.</p></div><button type="button" onClick={() => live.refresh()} className="rounded-md border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Refresh project data"><RefreshCw className="h-3.5 w-3.5" /></button></div>
              {loading ? <div className="flex items-center gap-2 px-5 py-8 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading scans…</div> : scans.length === 0 ? <div className="px-5 py-8 text-sm text-muted-foreground">No discovery has run for this project yet.</div> : <ul className="max-h-[26rem] divide-y divide-border overflow-y-auto">{scans.slice(0, 8).map((scan) => <li key={scan.id}><button type="button" onClick={() => { setSelectedScan(scan); setPlan(null); }} className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-accent/40 ${selectedScan?.id === scan.id ? "bg-primary/5" : ""}`}><span className="min-w-0"><span className="block truncate font-mono text-xs text-foreground">{scan.targetUrl}</span><span className="mt-1 block text-[11px] text-muted-foreground">{scan.createdAt ? new Date(scan.createdAt).toLocaleString() : "Recent"}</span></span><ScanStatus status={scan.status} /></button></li>)}</ul>}
            </div>
          </section>

          <section className="space-y-5">
            {!selectedScan ? <div className="surface-card flex min-h-[420px] items-center justify-center p-8 text-center"><div><Radar className="mx-auto h-10 w-10 text-primary/50" /><h2 className="mt-4 font-display text-xl font-semibold">Your project map will appear here</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Start discovery to see routes, features, controls, and risk signals before creating a test plan.</p></div></div> : <>
              <MapSummary scan={selectedScan} map={map} />
              {selectedScan.status === "COMPLETED" && <PlanReview plan={plan} planName={planName} setPlanName={setPlanName} mode={mode} setMode={setMode} planning={planning} generatePlan={generatePlan} approvePlan={approvePlan} approveDecision={approveDecision} rejectDecision={rejectDecision} reloadPlan={reloadPlan} runPlan={runPlan} running={running} safeToExecute={safeToExecute} enableVision={enableVision} enableRecovery={enableRecovery} setEnableVision={setEnableVision} setEnableRecovery={setEnableRecovery} capacityStatus={capacityStatus} queuedRunId={queuedRunId} />}
            </>}
          </section>
        </div>
      )}
      {error && <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-xl" role="alert">{error}</div>}
    </div>
  );
}

function EmptyState() {
  return <div className="mt-8 surface-card flex min-h-[420px] items-center justify-center p-8 text-center"><div className="max-w-md"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary"><Radar className="h-7 w-7" /></div><h2 className="mt-5 font-display text-2xl font-semibold">Choose a project before discovery</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Discovery is always project-scoped. Create or select a project first so Matrix QA never scans a target from another account.</p><Link to="/app/projects" className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Open projects <ArrowRight className="h-4 w-4" /></Link></div></div>;
}

function SectionEyebrow({ step, label }: { step: string; label: string }) {
  return <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[9px]">{step}</span>{label}</div>;
}

function ScanStatus({ status }: { status: V2ApplicationScan["status"] }) {
  const config = status === "COMPLETED" ? { label: "Mapped", className: "bg-success/15 text-success border-success/30" } : status === "FAILED" ? { label: "Failed", className: "bg-destructive/15 text-destructive border-destructive/30" } : { label: status === "RUNNING" ? "Mapping" : "Queued", className: "bg-primary/15 text-primary border-primary/30" };
  return <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${config.className}`}>{config.label}</span>;
}

function PrecheckSummary({ precheck }: { precheck?: V2WebPrecheck | null }) {
  if (!precheck) return null;
  const passed = precheck.status === "PASS" && precheck.reachable && precheck.httpStatusOk;
  return <div className={`mt-5 rounded-md border p-4 text-xs ${passed ? "border-success/30 bg-success/5" : "border-destructive/40 bg-destructive/10"}`}><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className={`h-4 w-4 ${passed ? "text-success" : "text-destructive"}`} /> Web precheck</div><span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${passed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{passed ? "Ready to map" : "Needs attention"}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><span><strong className="font-medium text-foreground">Reachability:</strong> {precheck.reachable ? "reachable" : "unreachable"}</span><span><strong className="font-medium text-foreground">HTTP:</strong> {precheck.httpStatus ?? "no response"}</span><span><strong className="font-medium text-foreground">Public routes:</strong> {precheck.publicRouteCount}</span><span><strong className="font-medium text-foreground">Redirects:</strong> {precheck.redirectCount}</span></div><div className="mt-2 text-muted-foreground">robots.txt: {precheck.robots.checked ? precheck.robots.status ?? "unavailable" : "not checked"} · sitemap: {precheck.sitemap.checked ? `${precheck.sitemap.routeCount} routes` : "not checked"}</div>{precheck.errors.length > 0 && <ul className="mt-2 space-y-1 text-destructive">{precheck.errors.map((item, index) => <li key={index}>{item}</li>)}</ul>}</div>;
}

function MapSummary({ scan, map }: { scan: V2ApplicationScan; map: V2ApplicationScan["projectMap"] }) {
  if (scan.status !== "COMPLETED") {
    const progress = scan.summary?.progress;
    const pagesScanned = progress?.pagesScanned;
    const maxPages = progress?.maxPages ?? 8;
    const queuedUrls = progress?.queuedUrls;
    return <div><PrecheckSummary precheck={scan.projectMap?.precheck ?? scan.summary?.precheck} /><div aria-live="polite" className="surface-card mt-5 flex min-h-[420px] items-center justify-center p-8 text-center"><div className="w-full max-w-md"><Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" /><h2 className="mt-4 font-display text-xl font-semibold">{scan.status === "FAILED" ? "Discovery could not finish" : "Mapping the application"}</h2><p className="mt-2 max-w-sm mx-auto text-sm leading-6 text-muted-foreground">{scan.errorMessage || "The scanner is observing same-origin pages and waiting for a terminal result."}</p>{scan.status === "RUNNING" && <div className="mt-5 rounded-md border border-primary/20 bg-primary/5 p-4 text-left text-xs"><div className="font-medium text-foreground">{discoveryProgressLabel(progress?.phase)}</div>{typeof pagesScanned === "number" && <div className="mt-2 text-muted-foreground">{pagesScanned}/{maxPages} pages captured{typeof queuedUrls === "number" ? ` · ${queuedUrls} queued` : ""}</div>}{progress?.lastRoute && <div className="mt-1 truncate text-muted-foreground">Last route: {progress.lastRoute}</div>}</div>}</div></div></div>;
  }
  const pages = map?.scannedPages ?? [];
  const actions = map?.actions ?? [];
  const features = map?.features ?? [];
  const risk = map?.riskSummary ?? { safe: 0, caution: 0, dangerous: 0 };
  const ai = map?.aiEnrichment;
  const aiLabel = !ai || !ai.enabled ? "Off" : ai.degraded ? "Fallback" : "Enriched";
  return <div><PrecheckSummary precheck={scan.projectMap?.precheck ?? scan.summary?.precheck} /><div className="surface-card mt-5 overflow-hidden"><div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5"><div><div className="flex items-center gap-2 text-xs font-medium text-success"><CheckCircle2 className="h-4 w-4" /> Discovery complete</div><h2 className="mt-2 font-display text-xl font-semibold">Project map ready for review</h2><p className="mt-1 text-sm text-muted-foreground">{map?.targetOrigin || scan.targetUrl}</p></div><a href={scan.targetUrl} target="_blank" rel="noreferrer" className="rounded-md border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open target"><ExternalLink className="h-4 w-4" /></a></div><div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4 lg:grid-cols-5"><Metric label="Pages" value={pages.length} /><Metric label="Actions" value={actions.length} /><Metric label="Features" value={features.length} /><Metric label="HTTP errors" value={map?.httpErrors?.length ?? 0} /><Metric label="Map enrichment" value={aiLabel} /></div><div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_180px]"><div><div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Detected features</div><div className="mt-2 flex flex-wrap gap-1.5">{features.length ? features.map((feature) => <span key={feature} className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground">{feature}</span>) : <span className="text-sm text-muted-foreground">No named features detected yet.</span>}</div><div className="mt-5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Routes observed</div><ul className="mt-2 max-h-[22rem] space-y-2 overflow-y-auto">{pages.slice(0, 8).map((page) => <li key={page.url} className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2/40 px-3 py-2"><span className="min-w-0 truncate font-mono text-xs text-foreground">{page.route}</span><span className="shrink-0 text-[11px] text-muted-foreground">{page.title || "Untitled"}</span></li>)}</ul></div><div><div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Safety mix</div><div className="mt-3 space-y-2"><RiskRow icon={ShieldCheck} label="Safe" value={risk.safe} tone="text-success" /><RiskRow icon={AlertTriangle} label="Caution" value={risk.caution} tone="text-warning" /><RiskRow icon={ShieldAlert} label="Dangerous" value={risk.dangerous} tone="text-destructive" /></div><p className="mt-4 text-[11px] leading-5 text-muted-foreground">Caution and dangerous controls remain blocked until reviewed by policy.</p></div></div></div></div>;
}

function PlanReview({ plan, planName, setPlanName, mode, setMode, planning, generatePlan, approvePlan, approveDecision, rejectDecision, reloadPlan, runPlan, running, safeToExecute, enableVision, enableRecovery, setEnableVision, setEnableRecovery, capacityStatus, queuedRunId }: { plan: V2TestPlan | null; planName: string; setPlanName: (value: string) => void; mode: V2PlannerMode; setMode: (value: V2PlannerMode) => void; planning: boolean; generatePlan: () => void; approvePlan: () => void; approveDecision: (decision: V2PolicyDecision) => void; rejectDecision: (decision: V2PolicyDecision) => void; reloadPlan: () => void; runPlan: () => void; running: boolean; safeToExecute: boolean; enableVision: boolean; enableRecovery: boolean; setEnableVision: (value: boolean) => void; setEnableRecovery: (value: boolean) => void; capacityStatus: ProviderCapacityDecision | null; queuedRunId: string | null }) {
  const aiPlan = plan?.projectMap?.aiPlan;
  if (!plan) return <div className="surface-card mt-5 p-5"><SectionEyebrow step="02" label="Plan" /><h2 className="mt-3 font-display text-xl font-semibold">Turn the map into a test plan</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">The planner will propose scenarios from observed routes and features. Review them before execution.</p><div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]"><input value={planName} onChange={(event) => setPlanName(event.target.value)} placeholder="Plan name" className="rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50" /><select value={mode} onChange={(event) => setMode(event.target.value as V2PlannerMode)} className="rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-sm outline-none focus:border-primary/50"><option value="QUICK_SMOKE">Quick smoke</option><option value="STANDARD_ADAPTIVE">Standard adaptive</option><option value="DEEP_MATRIX">Deep matrix</option></select></div><button type="button" onClick={generatePlan} disabled={planning} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{planning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}Generate review plan</button></div>;
  const blocked = plan.policyDecisions.filter((decision) => decision.status === "BLOCKED" || decision.status === "NEEDS_HUMAN_REVIEW" || decision.status === "PENDING");
  const approved = plan.policyDecisions.filter((decision) => decision.status === "ALLOWED" || decision.status === "APPROVED").length;
  return <div className="surface-card overflow-hidden"><div className="flex items-start justify-between gap-3 border-b border-border px-5 py-5"><div><SectionEyebrow step="02" label="Review" /><h2 className="mt-3 font-display text-xl font-semibold">{plan.name}</h2><p className="mt-1 text-sm text-muted-foreground">{plan.mode.replaceAll("_", " ")} · {plan.plannerSource === "AI" ? "Plan generated from current application evidence" : "Plan generation unavailable"}</p><div className="mt-3 max-w-2xl rounded-md border border-primary/20 bg-primary/5 p-3 text-xs"><div className="font-mono text-[10px] uppercase tracking-wider text-primary">Plan rationale</div><p className="mt-1 leading-5 text-muted-foreground">{plan.plannerRationale ?? aiPlan?.planningRationale ?? "No Plan rationale was persisted."}</p>{aiPlan?.uncoveredAreas?.length ? <p className="mt-2 leading-5 text-warning">Uncovered areas: {aiPlan.uncoveredAreas.join(" · ")}</p> : null}</div></div><PlanStatus status={plan.status} /></div><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/30 px-5 py-3 text-xs"><span className="text-muted-foreground">{plan.scenarios.length} scenarios · {approved}/{plan.policyDecisions.length} policy decisions clear</span><button type="button" onClick={reloadPlan} className="inline-flex items-center gap-1.5 text-primary hover:underline"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div><div className="max-h-[30rem] divide-y divide-border overflow-y-auto">{plan.scenarios.map((scenario) => { const decision = plan.policyDecisions.find((item) => item.scenarioId === scenario.id); return <div key={scenario.id} className="px-5 py-4"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Globe2 className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{scenario.name}</h3>{decision && <DecisionPill decision={decision} />}</div><p className="mt-1 text-sm text-muted-foreground">{scenario.intent}</p><p className="mt-2 text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">Expected:</span> {scenario.expectedOutcome}</p>{decision && (decision.status === "BLOCKED" || decision.status === "NEEDS_HUMAN_REVIEW" || decision.status === "PENDING") && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-[11px] text-warning">{decision.reason || "This action needs policy review."}</span><button type="button" onClick={() => approveDecision(decision)} disabled={planning} className="rounded-md border border-success/30 px-2.5 py-1 text-[11px] font-medium text-success hover:bg-success/10 disabled:opacity-50">Approve</button><button type="button" onClick={() => rejectDecision(decision)} disabled={planning} className="rounded-md border border-destructive/30 px-2.5 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50">Reject</button></div>}</div></div></div>; })}</div>{plan.status === "APPROVED" && <div className="grid gap-2 border-t border-border px-5 py-4 text-xs"><div className="font-medium">Optional run capabilities</div><label className="flex items-start gap-2"><input type="checkbox" checked={enableVision} onChange={(event) => setEnableVision(event.target.checked)} disabled={running} className="mt-0.5 accent-primary" /><span><span className="flex items-center gap-1.5 font-medium"><Eye className="h-3.5 w-3.5 text-primary" />Enable vision checks</span><span className="block text-muted-foreground">Off by default; lets the worker request visual screenshot analysis when text evidence is insufficient.</span></span></label><label className="flex items-start gap-2"><input type="checkbox" checked={enableRecovery} onChange={(event) => setEnableRecovery(event.target.checked)} disabled={running} className="mt-0.5 accent-primary" /><span><span className="flex items-center gap-1.5 font-medium"><RefreshCw className="h-3.5 w-3.5 text-primary" />Enable recovery attempts</span><span className="block text-muted-foreground">Off by default; lets the agent try approved equivalent locators.</span></span></label></div>}{capacityStatus?.status === "WAITING" && <div className="flex items-start gap-2 border-t border-warning/30 bg-warning/10 px-5 py-4 text-xs text-warning"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Shared test capacity is queued.</strong> {capacityStatus.reason || "The run is waiting for the next available test capacity window."} {capacityStatus.retryAt ? <> It will retry after <strong>{new Date(capacityStatus.retryAt).toLocaleString()}</strong>.</> : null}</span></div>}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-2/30 px-5 py-4">{plan.status !== "APPROVED" && <button type="button" onClick={approvePlan} disabled={planning || blocked.length > 0 || plan.scenarios.length === 0} className="inline-flex items-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-45">{planning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Approve plan</button>}{plan.status === "APPROVED" && <span className="inline-flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Plan approved</span>}{plan.status === "APPROVED" && <button type="button" onClick={() => { if (capacityStatus?.status === "WAITING" && queuedRunId) window.location.href = `/app/runs/${queuedRunId}?projectId=${encodeURIComponent(plan.projectId)}`; else runPlan(); }} disabled={running || (!capacityStatus && !safeToExecute)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45">{running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{capacityStatus?.status === "WAITING" ? "Open queued run" : "Start adaptive run"}</button>}</div></div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="bg-surface px-4 py-3"><div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 font-display text-xl font-semibold">{value}</div></div>; }
function RiskRow({ icon: Icon, label, value, tone }: { icon: typeof ShieldCheck; label: string; value: number; tone: string }) { return <div className="flex items-center justify-between text-xs"><span className={`flex items-center gap-1.5 ${tone}`}><Icon className="h-3.5 w-3.5" />{label}</span><span className="font-mono text-foreground">{value}</span></div>; }
function PlanStatus({ status }: { status: V2PlanStatus }) { const styles: Record<V2PlanStatus, string> = { DRAFT: "bg-muted text-muted-foreground border-border", READY: "bg-primary/10 text-primary border-primary/20", AWAITING_APPROVAL: "bg-warning/15 text-warning border-warning/30", APPROVED: "bg-success/15 text-success border-success/30", RUNNING: "bg-primary/15 text-primary border-primary/30", COMPLETED: "bg-success/15 text-success border-success/30", FAILED: "bg-destructive/15 text-destructive border-destructive/30", CANCELLED: "bg-muted text-muted-foreground border-border" }; return <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${styles[status]}`}>{status.replaceAll("_", " ")}</span>; }
function DecisionPill({ decision }: { decision: V2PolicyDecision }) { const safe = (decision.tier === "SAFE" && decision.status === "ALLOWED") || (decision.tier === "CAUTION" && decision.status === "APPROVED"); const blocked = decision.status === "BLOCKED" || decision.status === "NEEDS_HUMAN_REVIEW" || decision.status === "PENDING"; return <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${safe ? "border-success/30 bg-success/10 text-success" : blocked ? "border-warning/30 bg-warning/10 text-warning" : "border-primary/30 bg-primary/10 text-primary"}`}>{decision.tier} · {decision.status.replaceAll("_", " ")}</span>; }
