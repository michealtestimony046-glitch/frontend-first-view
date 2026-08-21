import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileWarning,
  Globe,
  Loader2,
  Network,
  Pause,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  SkipForward,
  Square,
  Terminal,
  XCircle,
} from "lucide-react";
import { BrowserHandoffPanel } from "@/components/browser-handoff-panel";
import {
  runsApi,
  type BrowserHandoff,
  type RunError,
  type RunMessage,
  type RunReport,
  type V2PolicyDecision,
  type V2Scenario,
  type V2TestPlan,
} from "@/lib/api-client";

export const Route = createFileRoute("/app/runs/$runId")({
  head: ({ params }) => ({
    meta: [
      { title: `Run ${params.runId} · Matrix QA` },
      { name: "description", content: "Run report with real evidence." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RunDetailPage,
});

type Tab = "overview" | "console" | "network" | "screenshots" | "scenarios";

function msToClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function duration(sec?: number) {
  if (sec == null) return "—";
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

function reportSummary(r: RunReport) {
  const s = r.summary ?? {
    assertionsPassed: 0,
    assertionsFailed: 0,
    hardErrorCount: 0,
    bugCount: 0,
  };
  if (r.v2Plan) {
    const outcomes = r.v2Plan.scenarios.map((scenario) => scenario.caseStatus ?? scenario.status);
    return {
      passed: outcomes.filter((status) => status === "PASSED").length,
      failed: outcomes.filter((status) => status === "FAILED" || status === "BLOCKED").length,
      bugs: r.bugs ?? s.bugCount,
      scenarios: r.v2Plan.scenarios.length,
    };
  }
  return {
    passed: r.passed ?? s.assertionsPassed,
    failed: r.failed ?? s.assertionsFailed,
    bugs: r.bugs ?? s.bugCount,
    scenarios: r.scenarios ?? s.assertionsPassed + s.assertionsFailed,
  };
}

function RunDetailPage() {
  const { runId } = Route.useParams();
  const projectId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("projectId")
      : null;
  const [report, setReport] = useState<RunReport | null>(null);
  const [handoff, setHandoff] = useState<BrowserHandoff | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const markdown = useMemo(
    () => (report ? buildReportMarkdown(report, runId) : ""),
    [report, runId],
  );

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    setError(null);

    if (!projectId) {
      setReport(null);
      setError("Project ID is required to load this run report.");
      return () => {
        cancelled = true;
      };
    }

    const loadReport = async () => {
      try {
        const [data, currentHandoff] = await Promise.all([
          runsApi.getReport(projectId, runId),
          runsApi.getHandoff(projectId, runId).catch(() => null),
        ]);
        if (cancelled) return;
        setReport(data);
        setHandoff(currentHandoff);
        const terminalStatuses = ["COMPLETED", "PASSED_WITH_FINDINGS", "PARTIALLY_TESTED", "BLOCKED", "FAILED"];
        const activeStatuses = ["PENDING", "QUEUED", "RUNNING"];
        if (activeStatuses.includes(data.status) || (data.incomplete && !terminalStatuses.includes(data.status))) {
          timer = window.setTimeout(loadReport, 2500);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load run report.");
      }
    };

    void loadReport();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [projectId, runId]);

  if (error) return <ErrorState message={error} />;
  if (!report) return <LoadingState />;

  const s = reportSummary(report);
  const screenshots = report.screenshots ?? [];
  const selectedShot = screenshots[selected];
  const videoStatus = report.artifactStatus?.video?.status ?? (report.finalVideo || report.rawVideo ? "ready" : "not_available");
  const videoUrl = videoStatus === "ready"
    ? report.finalVideo ?? report.rawVideo ?? null
    : videoStatus === "raw_only"
      ? report.rawVideo ?? null
      : null;

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `matrixqa-run-${report.id ?? report.runId ?? runId}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  };

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Link
          to="/app"
          className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> back to runs
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                Run <span className="text-primary">{report.id ?? report.runId ?? runId}</span>
              </h1>
              <DetailStatusPill status={report.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
              {report.targetUrl && (
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {report.targetUrl}
                </span>
              )}
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                started {report.startedAt
                  ? new Date(report.startedAt).toLocaleString()
                  : "—"} · {duration(report.durationSec)}
              </span>
              {report.triggeredBy && (
                <>
                  <span className="text-border">·</span>
                  <span>
                    by{" "}
                    {typeof report.triggeredBy === "string"
                      ? report.triggeredBy
                      : (report.triggeredBy.name ?? report.triggeredBy.email ?? "user")}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyMarkdown}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-xs hover:bg-accent"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy markdown"}
            </button>
            <button
              type="button"
              onClick={downloadMarkdown}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-xs hover:bg-accent"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-xs hover:bg-accent"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open evidence video
              </a>
            )}
          </div>
        </div>

        {report.errorMessage && (
          <div className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <strong>Run diagnostic:</strong> {report.errorMessage}
          </div>
        )}
        {report.metadata?.queue && <QueueStateNotice queue={report.metadata.queue} />}
        {report.outcome && <OutcomeNotice report={report} />}
        {report.incomplete && (
          <div className="mt-5 rounded-md border border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground">
            This run is still processing. The report will refresh automatically when the worker reaches a terminal state.
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Scenarios"
            value={`${s.passed}/${s.scenarios}`}
            hint="passed"
            tone={s.failed > 0 ? "danger" : "success"}
          />
          <Stat
            label="Bugs captured"
            value={String(s.bugs)}
            hint={s.bugs ? "needs review" : "clean"}
            tone={s.bugs ? "danger" : "success"}
          />
          <Stat label="Screenshots" value={String(screenshots.length)} hint="artifacts" />
          <Stat
            label="Events"
            value={String(report.events?.length ?? 0)}
            hint={`${report.errors?.length ?? 0} errors`}
            tone={(report.errors?.length ?? 0) ? "danger" : undefined}
          />
        </div>

        {videoUrl ? <EvidenceVideo report={report} url={videoUrl} /> : <EvidenceStatus report={report} />}
        {projectId && <BrowserHandoffPanel projectId={projectId} runId={runId} handoff={handoff} onChange={setHandoff} />}
        <ExecutionStatusNotice report={report} />
        {report.v2Plan && <V2PlanResults plan={report.v2Plan} />}

        {report.aiOverview && <AiOverviewPanel report={report} final />}
        <div className="mt-8 -mx-4 overflow-x-auto border-b border-border md:mx-0">
          <div className="flex min-w-max items-center gap-1 px-4 md:min-w-0 md:px-0">
            {(
              [
                { id: "overview", label: "Overview", icon: CheckCircle2 },
                { id: "screenshots", label: "Screenshots", icon: Camera },
                { id: "console", label: "Console", icon: Terminal },
                { id: "network", label: "Events", icon: Network },
                { id: "scenarios", label: "Assertions", icon: FileWarning },
              ] as const
            ).map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative -mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          {tab === "overview" && <OverviewTab report={report} />}
          {tab === "screenshots" && (
            <ScreenshotsTab report={report} selected={selected} setSelected={setSelected} />
          )}
          {tab === "console" && projectId && <RunConsoleTab projectId={projectId} runId={runId} report={report} />}
          {tab === "network" && <EventsTab report={report} />}
          {tab === "scenarios" && <AssertionsTab report={report} />}
        </div>
      </div>
    </div>
  );
}

function QueueStateNotice({ queue }: { queue: NonNullable<RunReport["metadata"]>["queue"] }) {
  if (!queue) return null;
  const copy = queue.state === "WAITING_FOR_PROVIDER"
    ? "The AI provider is temporarily at capacity. Your test is protected — nothing is being charged."
    : queue.state === "WAITING_FOR_ORGANIZATION"
      ? "Another run is active for your organization. Your test is queued and will start automatically."
      : queue.state === "EXPIRED"
        ? "This run expired before provider admission. Nothing was charged. You can try again."
        : queue.state === "RUNNING"
          ? "The browser worker is running this test now."
          : queue.state === "ADMITTED"
            ? "Your test was admitted and is preparing to run."
            : "Your test is queued for automatic admission.";
  const retryAt = queue.retryAt && Number.isFinite(Date.parse(queue.retryAt))
    ? new Date(queue.retryAt).toLocaleString()
    : null;
  const tone = queue.state === "EXPIRED" ? "border-warning/40 bg-warning/10" : queue.state === "WAITING_FOR_PROVIDER" || queue.state === "WAITING_FOR_ORGANIZATION" ? "border-primary/30 bg-primary/5" : "border-border bg-surface-2/30";
  return (
    <div className={`mt-5 flex items-start gap-3 rounded-md border p-4 text-sm ${tone}`}>
      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 font-medium text-foreground">
          <span>{copy}</span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{queue.state.replaceAll("_", " ")}</span>
        </div>
        {queue.reason && <p className="mt-1 text-xs text-muted-foreground">{queue.reason}</p>}
        {retryAt && queue.state !== "EXPIRED" && <p className="mt-1 text-xs text-muted-foreground">Automatic retry or admission check: {retryAt}.</p>}
      </div>
    </div>
  );
}

function OutcomeNotice({ report }: { report: RunReport }) {
  const outcome = report.outcome;
  if (!outcome) return null;
  const tone = outcome.status === "COMPLETED" ? "success" : outcome.status === "PASSED_WITH_FINDINGS" ? "warning" : outcome.status === "PARTIALLY_TESTED" || outcome.status === "REVIEW_REQUIRED" || outcome.status === "AWAITING_PERMISSION" ? "warning" : outcome.status === "BLOCKED" ? "danger" : "danger";
  const classes = tone === "success" ? "border-success/30 bg-success/10" : tone === "danger" ? "border-destructive/40 bg-destructive/10" : "border-warning/40 bg-warning/10";
  const coverage = outcome.coverage;
  const findings = outcome.findings;
  const title = outcome.status === "AWAITING_PERMISSION" ? "Waiting for your decision" : outcome.status === "REVIEW_REQUIRED" ? "Review required" : outcome.status.replaceAll("_", " ");
  return <div className={`mt-5 rounded-md border p-4 text-sm ${classes}`}><div className="font-medium text-foreground">{title}</div><p className="mt-1 text-muted-foreground">{outcome.message || "All planned scenarios completed without recorded findings."}</p>{coverage && <p className="mt-2 text-xs text-muted-foreground">Coverage: {coverage.completed}/{coverage.planned} scenarios completed · {coverage.blocked} blocked · {coverage.needsReview} needs review{findings ? ` · ${findings.target} target finding${findings.target === 1 ? "" : "s"} · ${findings.evidence} evidence limitation${findings.evidence === 1 ? "" : "s"}` : ""}</p>}</div>;
}

function ExecutionStatusNotice({ report }: { report: RunReport }) {
  if (!report.v2Plan) return null;
  const videoStatus = report.artifactStatus?.video?.status ?? "not_available";
  const videoDisabled = report.artifactStatus?.video?.reason === "disabled by configuration";
  const message = report.incomplete
    ? "Execution in progress"
    : videoDisabled && report.status !== "RUNNING" && report.status !== "PENDING"
      ? "Execution complete; screenshots only"
      : report.status === "COMPLETED" && videoStatus !== "ready"
        ? "Execution complete; processing report"
      : report.status === "PASSED_WITH_FINDINGS"
        ? "Completed with findings"
        : report.status === "PARTIALLY_TESTED"
          ? "Partial coverage completed"
          : report.status === "BLOCKED"
            ? "Policy blocked a specific action"
            : report.status === "REVIEW_REQUIRED"
              ? "Review required; evidence preserved"
              : report.status === "AWAITING_PERMISSION"
                ? "Waiting for your decision"
                : report.status === "FAILED"
              ? "Execution failed; evidence preserved"
              : videoStatus === "failed"
                ? "Raw evidence preserved"
                : videoStatus !== "ready"
                  ? "Video processing"
                  : "Execution complete";
  const complete = !report.incomplete && report.status !== "RUNNING" && report.status !== "PENDING" && report.status !== "AWAITING_PERMISSION";
  return (
    <div className="mt-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${complete ? "bg-success" : "animate-pulse bg-primary"}`} />
      <span className={complete ? "text-success" : "text-muted-foreground"}>{message}</span>
      <span className="text-border">·</span>
      <span>AI browser test</span>
    </div>
  );
}

function V2PlanResults({ plan }: { plan: V2TestPlan }) {
  const allowed = plan.policyDecisions.filter((decision) => decision.status === "ALLOWED" || decision.status === "APPROVED").length;
  const blocked = plan.policyDecisions.filter((decision) => decision.status === "BLOCKED" || decision.status === "REJECTED").length;
  return (
    <section className="mt-8 surface-card overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-primary">Test plan</p>
            <h2 className="mt-1 font-display text-lg font-semibold">{plan.name}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
            <PlanBadge label={plan.mode.replaceAll("_", " ")} tone="neutral" />
            <PlanBadge label={plan.status} tone={plan.status === "COMPLETED" ? "success" : "neutral"} />
            {plan.estimatedUnits != null && <PlanBadge label={`${plan.estimatedUnits} units est.`} tone="neutral" />}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {plan.scenarios.length} planned scenario{plan.scenarios.length === 1 ? "" : "s"} · {allowed} policy decision{allowed === 1 ? "" : "s"} allowed · {blocked} blocked
        </p>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <h3 className="font-display text-sm font-semibold">Scenario outcomes</h3>
          <div className="mt-3 divide-y divide-border border-y border-border">
            {plan.scenarios.map((scenario) => <V2ScenarioRow key={scenario.id} scenario={scenario} />)}
          </div>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Policy decisions</h3>
          <div className="mt-3 divide-y divide-border border-y border-border">
            {plan.policyDecisions.length ? plan.policyDecisions.map((decision) => <V2PolicyRow key={decision.id} decision={decision} />) : (
              <p className="py-4 text-xs text-muted-foreground">No policy decisions were attached to this plan.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function V2ScenarioRow({ scenario }: { scenario: V2Scenario }) {
  const outcome = scenario.caseStatus ?? scenario.status;
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start gap-2">
        <OutcomeBadge value={outcome} />
        <span className="text-sm font-medium">{scenario.name}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">priority {scenario.priority}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground"><strong className="font-medium text-foreground/80">Intent:</strong> {scenario.intent}</p>
      <p className="mt-1 text-xs text-muted-foreground"><strong className="font-medium text-foreground/80">Expected:</strong> {scenario.expectedOutcome}</p>
      <p className="mt-1 text-xs text-muted-foreground"><strong className="font-medium text-foreground/80">Actual:</strong> {describeScenarioResult(scenario.result)}</p>
    </div>
  );
}

function V2PolicyRow({ decision }: { decision: V2PolicyDecision }) {
  const tone = decision.status === "ALLOWED" || decision.status === "APPROVED" ? "success" : decision.status === "BLOCKED" || decision.status === "REJECTED" ? "danger" : "neutral";
  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center gap-2">
        <PlanBadge label={decision.tier} tone="neutral" />
        <PlanBadge label={decision.status} tone={tone} />
        <span className="font-mono text-[10px] text-muted-foreground">{decision.actionKey}</span>
      </div>
      {decision.reason && <p className="mt-1 text-xs text-muted-foreground">{decision.reason}</p>}
    </div>
  );
}

function describeScenarioResult(result: unknown) {
  if (!result || typeof result !== "object") return "No scenario result was returned.";
  const record = result as Record<string, unknown>;
  if (typeof record.assertionNarrative === "string" && record.assertionNarrative.trim()) return record.assertionNarrative;
  if (typeof record.actual === "string" && record.actual.trim()) return record.actual;
  if (Array.isArray(record.assertions)) {
    const passed = record.assertions.slice().reverse().find((item) => item && typeof item === "object" && (item as Record<string, unknown>).status === "passed") as Record<string, unknown> | undefined;
    if (typeof passed?.actual === "string" && passed.actual.trim()) return passed.actual;
  }
  if (typeof record.message === "string" && record.message.trim()) return record.message;
  if (typeof record.url === "string" && record.url.trim()) return `Rendered ${record.url}`;
  return "No textual result was recorded for this scenario.";
}

function OutcomeBadge({ value }: { value: string }) {
  const tone = value === "PASSED" ? "success" : value === "FAILED" || value === "BLOCKED" ? "danger" : "neutral";
  return <PlanBadge label={value.replaceAll("_", " ")} tone={tone} />;
}

function PlanBadge({ label, tone }: { label: string; tone: "success" | "danger" | "neutral" }) {
  const classes = tone === "success" ? "bg-success/15 text-success" : tone === "danger" ? "bg-destructive/15 text-destructive" : "bg-surface-2 text-muted-foreground";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${classes}`}>{label}</span>;
}

function EvidenceStatus({ report }: { report: RunReport }) {
  const status = report.artifactStatus?.video?.status ?? "not_available";
  const videoDisabled = report.artifactStatus?.video?.reason === "disabled by configuration";
  const message = videoDisabled
    ? "Video capture is intentionally disabled for screenshot-first runs."
    : status === "failed"
      ? "Video evidence could not be prepared for this run."
      : status === "raw_only"
        ? "The raw browser recording is available, but the processed replay is not ready."
        : "No video artifact is available for this run.";
  return (
    <div className={`mt-8 flex items-start gap-3 rounded-md border p-4 text-sm ${videoDisabled ? "border-primary/30 bg-primary/5" : "border-warning/40 bg-warning/10"}`}>
      {videoDisabled ? <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-warning" />}
      <div>
        <div className="font-medium text-foreground">{videoDisabled ? "Screenshot-first evidence" : "Evidence video unavailable"}</div>
        <p className="mt-1 text-muted-foreground">{message} The browser run itself is {report.status === "COMPLETED" ? "complete" : report.status.toLowerCase()} and its screenshots, events, assertions, and report remain available.</p>
      </div>
    </div>
  );
}

function EvidenceVideo({ report, url }: { report: RunReport; url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const chapters = report.chapters ?? [];
  const [current, setCurrent] = useState(0);
  return (
    <div className="mt-8 surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold">Evidence replay</h2>
          <p className="font-mono text-[10px] text-muted-foreground">
            {report.finalVideo ? "cinematic evidence" : "raw browser recording"}
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" /> open
        </a>
      </div>
      <div className="bg-black">
        <video
          ref={videoRef}
          src={url}
          controls
          playsInline
          className="mx-auto aspect-video w-full max-h-[680px]"
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        />
      </div>
      {chapters.length > 0 && (
        <div className="border-t border-border p-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Chapters
          </div>
          <div className="flex flex-wrap gap-2">
            {chapters.map((c, i) => (
              <button
                key={`${c.title}-${i}`}
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = c.startTimestamp / 1000;
                }}
                className={`rounded border px-2 py-1 text-[11px] ${current * 1000 >= c.startTimestamp ? "border-primary/40 bg-primary/5" : "border-border hover:bg-accent"}`}
              >
                {msToClock(c.startTimestamp)} · {c.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatAiValue(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => formatAiValue(item, depth + 1)).filter(Boolean).join("; ");
  if (depth >= 3) return "[structured value]";
  return Object.entries(value as Record<string, unknown>)
    .slice(0, 24)
    .map(([key, item]) => `${key}: ${formatAiValue(item, depth + 1)}`)
    .filter((item) => !item.endsWith(": "))
    .join("; ");
}

function formatAiList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => formatAiValue(item)).filter(Boolean) : [];
}

function AiOverviewPanel({ report, final = false }: { report: RunReport; final?: boolean }) {
  const summary = final ? report.aiOverview : report.liveAiSummary;
  if (!summary) {
    return (
      <section className="mt-6 surface-card border border-warning/25 bg-warning/5 p-5">
        <div className="flex items-center gap-2 text-sm font-medium"><BrainCircuit className="h-4 w-4 text-warning" /> {final ? "Evidence review is still being prepared" : "The AI is preparing the next update"}</div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{final ? "The browser activity, screenshots, and evidence are preserved. Matrix QA will not invent a conclusion before the evidence can be verified." : "The worker is collecting browser evidence and will explain its next step here."}</p>
      </section>
    );
  }
  const narrative = final
    ? ("summary" in summary && typeof summary.summary === "string" && summary.summary.trim() ? summary.summary : summary.headline)
    : ("message" in summary && typeof summary.message === "string" && summary.message.trim() ? summary.message : summary.headline);
  return (
    <section className="mt-6 surface-card overflow-hidden border border-primary/25">
      <div className="border-b border-border bg-primary/5 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-primary"><BrainCircuit className="h-3.5 w-3.5" /> {final ? "Wow Report summary" : "AI progress update"}</div>
        <h2 className="mt-2 font-display text-lg font-semibold">{narrative}</h2>
        {!final && <p className="mt-2 text-sm text-muted-foreground">{summary.currentObjective}</p>}
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{final ? "What was tested" : "What changed"}</h3>
          <ul className="mt-3 space-y-2 text-sm text-foreground/85">{formatAiList(final ? summary.whatWasTested : summary.whatChanged).map((item, index) => <li key={index} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}</ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{final ? "Coverage" : "Next step"}</h3>
          <p className="mt-3 text-sm leading-6 text-foreground/85">{final ? formatAiValue(summary.coverage) || "Coverage summary unavailable." : summary.nextStep}</p>
          {(final ? summary.blockers : summary.blockers).length > 0 && <div className="mt-4"><h4 className="text-xs font-semibold uppercase tracking-wider text-warning">Blockers</h4><ul className="mt-2 space-y-1 text-xs text-muted-foreground">{summary.blockers.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
        </div>
      </div>
      {final && summary.findings.length > 0 && <div className="border-t border-border px-5 py-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Findings</h3><div className="mt-3 divide-y divide-border">{summary.findings.map((finding, index) => <div key={index} className="py-3 first:pt-0 last:pb-0"><div className="flex items-center gap-2"><PlanBadge label={finding.severity} tone={finding.severity.toLowerCase().includes("high") || finding.severity.toLowerCase().includes("critical") ? "danger" : "neutral"} /><span className="text-sm font-medium">{finding.title}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{finding.explanation}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">Evidence: {finding.evidence.map((evidence) => evidence.label).join(", ") || "none referenced"}</p></div>)}</div></div>}
      <div className="border-t border-border px-5 py-3 font-mono text-[10px] text-muted-foreground">Evidence-backed AI narrative · generated {new Date(summary.generatedAt).toLocaleTimeString()}</div>
    </section>
  );
}

function OverviewTab({ report }: { report: RunReport }) {
  const errors = report.errors ?? [];
  const assertions = report.assertions ?? [];
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-display text-sm font-semibold">Real findings</h3>
        </div>
        <div className="divide-y divide-border">
          {errors.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No hard errors captured"
              body="The backend reported no hard errors for this run."
              compact
            />
          ) : (
            errors.map((e, i) => <ErrorRow key={i} error={e} />)
          )}
        </div>
      </div>
      <div className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-display text-sm font-semibold">Execution timeline</h3>
        </div>
        <ol className="max-h-[480px] space-y-3 overflow-auto p-5">
          {(report.events ?? [])
            .slice()
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((e, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-12 shrink-0 font-mono text-[10px] text-muted-foreground">
                  {msToClock(e.timestamp)}
                </span>
                <span className="text-foreground/80">{eventLabel(e)}</span>
              </li>
            ))}
        </ol>
      </div>
      {assertions.length > 0 && (
        <div className="lg:col-span-2 surface-card overflow-hidden">
          <div className="border-b border-border px-5 py-3">
            <h3 className="font-display text-sm font-semibold">Assertions</h3>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {assertions.map((a, i) => (
              <div key={i} className="rounded border border-border p-3">
                <div className="flex items-center gap-2">
                  {a.status === "passed" ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm">{a.name}</span>
                  <span className="ml-auto flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    {a.source && <span className={a.source === "AI" ? "text-primary" : "text-warning"}>{a.source}</span>}
                    {msToClock(a.timestamp)}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  expected: {formatAiValue(a.expected)} · actual: {formatAiValue(a.actual)}
                </p>
                {(a.observationId || (a.evidenceRefs?.length ?? 0) > 0) && <p className="mt-1 font-mono text-[10px] text-muted-foreground">{a.observationId ? `observation ${a.observationId}` : ""}{a.evidenceRefs?.length ? `${a.observationId ? " · " : ""}evidence ${a.evidenceRefs.join(", ")}` : ""}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScreenshotsTab({
  report,
  selected,
  setSelected,
}: {
  report: RunReport;
  selected: number;
  setSelected: (n: number) => void;
}) {
  const shots = report.screenshots ?? [];
  if (!shots.length)
    return (
      <EmptyState
        icon={Camera}
        title="No screenshots captured"
        body="The backend did not return screenshot artifacts for this run."
      />
    );
  const shot = shots[selected] ?? shots[0];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-display text-sm font-semibold">{shot.label}</h3>
          <p className="font-mono text-[10px] text-muted-foreground">
            captured at {msToClock(shot.t ?? shot.timestamp)}
          </p>
        </div>
        {shot.url ? (
          <img
            src={shot.url}
            alt={shot.label}
            className="max-h-[680px] w-full object-contain bg-surface-2"
          />
        ) : (
          <EmptyState
            icon={Camera}
            title="Screenshot URL unavailable"
            body="The backend returned the artifact metadata but no signed URL."
            compact
          />
        )}
      </div>
      <div className="surface-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-semibold">All frames</h3>
        </div>
        <ul className="max-h-[560px] overflow-auto p-2">
          {shots.map((s, i) => (
            <li key={s.filename}>
              <button
                onClick={() => setSelected(i)}
                className={`flex w-full items-center gap-3 rounded-md border p-2 text-left ${selected === i ? "border-primary/40 bg-primary/5" : "border-transparent hover:bg-accent/40"}`}
              >
                <div className="h-12 w-20 shrink-0 overflow-hidden rounded border border-border bg-surface-2">
                  {s.url && <img src={s.url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs">{s.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {msToClock(s.t ?? s.timestamp)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ErrorsTab({ errors }: { errors: RunError[] }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border px-5 py-3">
        <h3 className="font-display text-sm font-semibold">Hard errors with real timestamps</h3>
      </div>
      {errors.length ? (
        <div className="divide-y divide-border">
          {errors.map((e, i) => (
            <ErrorRow key={i} error={e} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          title="No hard errors"
          body="No console, pageerror, or HTTP ≥ 400 hard errors were returned."
          compact
        />
      )}
    </div>
  );
}

const SUCCESSFUL_RUN_STATUSES = new Set(["COMPLETED", "PASSED_WITH_FINDINGS"]);
const ACTIVE_RUN_STATUSES = new Set(["PENDING", "QUEUED", "RUNNING", "AWAITING_PERMISSION"]);

type ConsoleAction = "PAUSE" | "RESUME" | "APPROVE" | "ALLOW_ACTION" | "ALLOW_SCENARIO" | "SKIP" | "STOP";

type ScopePermissionRequest = {
  requestId: string;
  action: string;
  target: string;
  route: string;
  risk: string;
  reason: string;
  expectedEffect: string;
  observedControl?: Record<string, unknown>;
};

function scopePermissionFromMessage(message: RunMessage): ScopePermissionRequest | null {
  const metadata = message.metadata;
  if (!metadata || metadata.type !== "ai-agent-scope-permission-requested") return null;
  const requestId = typeof metadata.requestId === "string" ? metadata.requestId : "";
  if (!requestId) return null;
  return {
    requestId,
    action: typeof metadata.action === "string" ? metadata.action : "browser action",
    target: typeof metadata.target === "string" ? metadata.target : "observed control",
    route: typeof metadata.route === "string" ? metadata.route : "/",
    risk: typeof metadata.risk === "string" ? metadata.risk : "UNKNOWN",
    reason: typeof metadata.reason === "string" ? metadata.reason : "This action is outside the current run scope.",
    expectedEffect: typeof metadata.expectedEffect === "string" ? metadata.expectedEffect : "The action may change the current browser state.",
    observedControl: metadata.observedControl && typeof metadata.observedControl === "object" ? metadata.observedControl as Record<string, unknown> : undefined,
  };
}

function RunConsoleTab({ projectId, runId, report }: { projectId: string; runId: string; report: RunReport }) {
  const [messages, setMessages] = useState<RunMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeAction, setActiveAction] = useState<ConsoleAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);
  const pendingScopeRequest = useMemo(() => {
    let pending: ScopePermissionRequest | null = null;
    let resolvedRequestId: string | null = null;
    for (const message of messages) {
      const request = scopePermissionFromMessage(message);
      if (request) { pending = request; resolvedRequestId = null; }
      const metadata = message.metadata;
      if (metadata?.type === "ai-agent-scope-permission-resolved" && typeof metadata.requestId === "string") {
        if (pending?.requestId === metadata.requestId) resolvedRequestId = metadata.requestId;
      }
    }
    return pending && pending.requestId !== resolvedRequestId ? pending : null;
  }, [messages]);
  const [expired, setExpired] = useState(false);
  const active = ACTIVE_RUN_STATUSES.has(report.status);
  const successful = SUCCESSFUL_RUN_STATUSES.has(report.status);
  const finishedAt = report.finishedAt ? new Date(report.finishedAt).getTime() : null;
  const pastRetention = successful && finishedAt != null && finishedAt + 60_000 <= Date.now();

  const loadMessages = async () => {
    try {
      const next = await runsApi.listMessages(projectId, runId);
      setMessages(next);
      setExpired(successful && pastRetention && next.length === 0);
      setError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to load the Run Console.";
      if (successful && (/expired|not found|transcript/i.test(message))) setExpired(true);
      else setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      await loadMessages();
    };
    void load();
    if (!active) return () => { cancelled = true; };
    const interval = window.setInterval(() => { void load(); }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [projectId, runId, active, report.status, report.finishedAt]);

  const submitMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending || expired) return;
    setSending(true);
    setError(null);
    try {
      const created = await runsApi.addMessage(projectId, runId, body);
      setMessages((current) => [...current.filter((message) => message.id !== created.id), created]);
      setDraft("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to send your message.";
      if (/expired|transcript/i.test(message)) setExpired(true);
      else setError(message);
    } finally {
      setSending(false);
    }
  };

  const continueWithAi = async () => {
    if (continuing || expired || !report.v2Plan) return;
    setContinuing(true);
    setError(null);
    try {
      const next = await runsApi.continue(projectId, runId, draft.trim() || undefined);
      window.location.href = `/app/runs/${encodeURIComponent(next.id)}?projectId=${encodeURIComponent(projectId)}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to continue this run.");
      setContinuing(false);
    }
  };

  const sendControl = async (action: ConsoleAction, metadata?: Record<string, unknown>) => {
    if (activeAction || expired) return;
    if (action === "STOP" && !window.confirm("Stop this run? The worker will preserve the evidence collected so far.")) return;
    setActiveAction(action);
    setError(null);
    try {
      const result = await runsApi.control(projectId, runId, action, undefined, metadata);
      if (result.message) setMessages((current) => [...current.filter((message) => message.id !== result.message?.id), result.message!]);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Unable to request ${action.toLowerCase()}.`);
    } finally {
      setActiveAction(null);
      void loadMessages();
    }
  };

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-semibold">Live Run Console</h3>
            {active && <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-primary"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> listening</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Guide the worker with a bounded instruction for its next decision, clarify scope, or approve a safe control request while this run is active.</p>
        </div>
        <button type="button" onClick={() => void loadMessages()} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent" aria-label="Refresh console">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && <div className="border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-xs text-destructive">{error}</div>}
      {expired ? (
        <div className="px-5 py-12 text-center">
          <ShieldCheck className="mx-auto h-7 w-7 text-muted-foreground" />
          <h4 className="mt-3 text-sm font-medium">Transcript expired</h4>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">Successful run transcripts are automatically deleted one minute after completion. The report, screenshots, and findings remain available.</p>
        </div>
      ) : (
        <>
          {(!active && !successful && !expired && report.v2Plan && (report.status === "BLOCKED" || report.status === "FAILED" || report.status === "PARTIALLY_TESTED" || report.status === "REVIEW_REQUIRED")) && (
            <div className="border-b border-primary/30 bg-primary/5 px-5 py-4" role="region" aria-label="Continue test run">
              <div className="flex items-start gap-3">
                <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold text-foreground">The test worker needs another instruction</p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">This run is closed, so the live worker cannot receive a message. Start a fresh continuation from the same test plan and tell the worker what to retry, inspect, or adapt. The original result remains unchanged for audit history.</p>
                  <textarea id="run-continuation-instruction" value={draft} onChange={(event) => setDraft(event.target.value)} disabled={continuing} rows={3} maxLength={4000} placeholder="Example: Re-open the Platform link, inspect the actual page heading, and adapt the assertion to the content you observe." className="mt-3 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-60" />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => void continueWithAi()} disabled={continuing} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{continuing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Continue test</button>
                    <span className="text-[11px] text-muted-foreground">A new run will be created from the same approved test plan.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <AiOverviewPanel report={report} />
          {pendingScopeRequest && active && (
            <div className="border-b border-warning/40 bg-warning/10 px-5 py-4" role="alert" aria-live="assertive">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold text-foreground">The AI wants to test something outside this run’s scope</p>
                  <p className="mt-1 text-sm leading-6 text-foreground/85">Target: <strong>{pendingScopeRequest.target}</strong></p>
                  <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div><dt className="font-mono uppercase tracking-wider">Why</dt><dd className="mt-0.5 text-foreground/75">{pendingScopeRequest.reason}</dd></div>
                    <div><dt className="font-mono uppercase tracking-wider">Expected effect</dt><dd className="mt-0.5 text-foreground/75">{pendingScopeRequest.expectedEffect}</dd></div>
                    <div><dt className="font-mono uppercase tracking-wider">Current route</dt><dd className="mt-0.5 font-mono text-foreground/75">{pendingScopeRequest.route}</dd></div>
                    <div><dt className="font-mono uppercase tracking-wider">Risk classification</dt><dd className="mt-0.5 text-foreground/75">{pendingScopeRequest.risk}</dd></div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={Boolean(activeAction)} onClick={() => void sendControl("ALLOW_ACTION", { requestId: pendingScopeRequest.requestId })} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Allow this action</button>
                    <button type="button" disabled={Boolean(activeAction)} onClick={() => void sendControl("ALLOW_SCENARIO", { requestId: pendingScopeRequest.requestId })} className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" /> Allow this scenario</button>
                    <button type="button" disabled={Boolean(activeAction)} onClick={() => void sendControl("SKIP", { requestId: pendingScopeRequest.requestId })} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"><SkipForward className="h-3.5 w-3.5" /> Continue without it</button>
                    <button type="button" disabled={Boolean(activeAction)} onClick={() => void sendControl("STOP", { requestId: pendingScopeRequest.requestId })} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"><Square className="h-3.5 w-3.5" /> Stop run</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="max-h-[520px] space-y-4 overflow-auto bg-surface-2/30 px-5 py-5">
            {loading && !messages.length ? (
              <div className="flex items-center gap-2 py-10 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading console transcript…</div>
            ) : messages.length ? messages.map((message) => <RunConsoleMessage key={message.id} message={message} />) : (
              <div className="py-10 text-center text-xs text-muted-foreground">No console messages yet. Worker updates and your instructions will appear here.</div>
            )}
          </div>
          <div className="border-t border-border px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <ConsoleButton action="PAUSE" icon={Pause} disabled={!active || Boolean(activeAction)} pending={activeAction === "PAUSE"} onClick={sendControl} />
              <ConsoleButton action="RESUME" icon={Play} disabled={!active || Boolean(activeAction)} pending={activeAction === "RESUME"} onClick={sendControl} />
              <ConsoleButton action="APPROVE" icon={ShieldCheck} disabled={!active || Boolean(activeAction)} pending={activeAction === "APPROVE"} onClick={sendControl} />
              <ConsoleButton action="SKIP" icon={SkipForward} disabled={!active || Boolean(activeAction)} pending={activeAction === "SKIP"} onClick={sendControl} />
              <ConsoleButton action="STOP" icon={Square} disabled={!active || Boolean(activeAction)} pending={activeAction === "STOP"} onClick={sendControl} danger />
            </div>
            <form onSubmit={submitMessage} className="mt-4 flex gap-2">
              <label className="sr-only" htmlFor="run-console-message">Message the Run Console</label>
              <input id="run-console-message" value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!active || sending} maxLength={4000} placeholder={active ? "Tell the worker what to inspect next…" : "Console input is available while the run is active"} className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" />
              <button type="submit" disabled={!active || !draft.trim() || sending || expired} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-3.5 w-3.5" /> Send</button>
            </form>
            <p className="mt-2 text-[11px] text-muted-foreground">Messages are added to the next AI decision. Stop preserves collected evidence and ends the active run; dangerous actions remain fail-closed.</p>
          </div>
        </>
      )}
    </section>
  );
}

function ConsoleButton({ action, icon: Icon, disabled, pending, onClick, danger = false }: { action: ConsoleAction; icon: typeof Pause; disabled: boolean; pending: boolean; onClick: (action: ConsoleAction) => void; danger?: boolean }) {
  return <button type="button" disabled={disabled} onClick={() => onClick(action)} className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-45 ${danger ? "border-destructive/40 text-destructive hover:bg-destructive/10" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
    {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />} {action}
  </button>;
}

function RunConsoleMessage({ message }: { message: RunMessage }) {
  const user = message.authorType === "USER";
  const summary = message.kind === "SUMMARY";
  const metadata = message.metadata && typeof message.metadata === "object" ? message.metadata : null;
  const rawSummary = metadata && "summary" in metadata && typeof metadata.summary === "object" && metadata.summary ? metadata.summary as Record<string, unknown> : null;
  const evidence = rawSummary && Array.isArray(rawSummary.evidenceRefs) ? rawSummary.evidenceRefs : [];
  const authorLabel = user ? "You" : "Matrix QA";
  const messageLabel = summary ? "AI update" : message.kind === "APPROVAL" ? "Permission" : "Progress";
  const safeObjective = rawSummary && typeof rawSummary.currentObjective === "string" ? rawSummary.currentObjective : null;
  const safeNextStep = rawSummary && typeof rawSummary.nextStep === "string" ? rawSummary.nextStep : null;
  return <article className={`flex ${user ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-[92%] rounded-md border px-4 py-3 ${summary ? "border-primary/35 bg-primary/5" : user ? "border-primary/25 bg-primary/5" : "border-border bg-background"}`}>
      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className={summary ? "text-primary" : user ? "text-primary" : "text-foreground/70"}>{authorLabel}</span>
        <span className="rounded-full bg-surface-2 px-1.5 py-0.5">{messageLabel}</span>
        <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/85">{message.body}</p>
      {safeObjective && <p className="mt-3 text-xs leading-5 text-muted-foreground">{safeObjective}</p>}
      {safeNextStep && <p className="mt-2 text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground/75">Next:</span> {safeNextStep}</p>}
      {evidence.length > 0 && <p className="mt-3 font-mono text-[10px] text-muted-foreground">Evidence: {evidence.map((item) => typeof item === "object" && item && "label" in item ? String(item.label) : String(item)).join(", ")}</p>}
    </div>
  </article>;
}

function EventsTab({ report }: { report: RunReport }) {
  const events = report.events ?? [];
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border px-5 py-3">
        <h3 className="font-display text-sm font-semibold">Browser events</h3>
      </div>
      <div className="max-h-[620px] overflow-auto">
        {events.map((e, i) => (
          <div
            key={i}
            className="grid gap-2 border-b border-border px-5 py-3 md:grid-cols-[80px_130px_1fr]"
          >
            <span className="font-mono text-[11px] text-muted-foreground">
              {msToClock(e.timestamp)}
            </span>
              <span className="font-mono text-[11px] text-primary">{eventTypeLabel(e.type)}</span>
            <span className="text-sm">
              {eventLabel(e)}
              {e.x != null && e.y != null && (
                <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                  ({Math.round(e.x)}, {Math.round(e.y)})
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssertionsTab({ report }: { report: RunReport }) {
  const assertions = report.assertions ?? [];
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border px-5 py-3">
        <h3 className="font-display text-sm font-semibold">Real assertions</h3>
      </div>
      {assertions.length ? (
        <div className="divide-y divide-border">
          {assertions.map((a, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-center gap-2">
                {a.status === "passed" ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span>{a.name}</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {msToClock(a.timestamp)}
                </span>
              </div>
              <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                <div className="rounded bg-surface-2 p-2">
                  <span className="text-muted-foreground">Expected</span>
                  <div className="mt-1 font-mono">{String(a.expected)}</div>
                </div>
                <div className="rounded bg-surface-2 p-2">
                  <span className="text-muted-foreground">Actual</span>
                  <div className="mt-1 font-mono">{String(a.actual)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileWarning}
          title="No assertions returned"
          body="The backend has not attached assertions to this run."
          compact
        />
      )}
    </div>
  );
}

function ErrorRow({ error }: { error: RunError }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2 font-mono text-[10px] text-muted-foreground">
          <span>{msToClock(error.timestamp)}</span>
          <span>·</span>
          <span>{error.subtype}</span>
          {error.status != null && (
            <>
              <span>·</span>
              <span>HTTP {error.status}</span>
            </>
          )}
        </div>
        <p className="mt-1 break-words text-sm">{error.message}</p>
        {error.target && (
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            target: {error.target}
            {error.x != null && error.y != null
              ? ` · (${Math.round(error.x)}, ${Math.round(error.y)})`
              : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailStatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const tone =
    normalized === "COMPLETED"
      ? "bg-success/15 text-success"
      : normalized === "PASSED_WITH_FINDINGS" || normalized === "PARTIALLY_TESTED" || normalized === "BLOCKED"
        ? "bg-warning/15 text-warning"
        : normalized === "FAILED"
          ? "bg-destructive/15 text-destructive"
          : normalized === "RUNNING"
            ? "bg-primary/15 text-primary"
            : "bg-surface-2 text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tone}`}
    >
      {(normalized === "RUNNING" || normalized === "PENDING") && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${normalized === "RUNNING" ? "animate-pulse bg-primary" : "bg-muted-foreground"}`}
        />
      )}
      {normalized}
    </span>
  );
}
function buildReportMarkdown(report: RunReport, runId: string) {
  const id = report.id ?? report.runId ?? runId;
  const summary = reportSummary(report);
  const ai = report.aiOverview;
  const lines = [
    `# Matrix QA run ${id}`,
    "",
    `- Status: ${report.status}`,
    `- Target URL: ${report.targetUrl ?? "—"}`,
    `- Test strategy: AI browser test`,
    `- Started: ${report.startedAt ? new Date(report.startedAt).toISOString() : "—"}`,
    `- Duration: ${duration(report.durationSec)}`,
    `- Scenarios: ${summary.passed}/${summary.scenarios} passed`,
    `- Bugs captured: ${summary.bugs}`,
    `- Screenshots: ${(report.screenshots ?? []).length}`,
    `- Events: ${(report.events ?? []).length}`,
    `- Evidence video: ${report.artifactStatus?.video?.status === "ready" ? "processed video available" : report.artifactStatus?.video?.status === "raw_only" ? "raw recording available; processed video unavailable" : "not available"}`,
  ];

  if (ai) {
    lines.push("", "## Test summary", "", `> ${ai.summary || ai.headline}`, "", `**Coverage:** ${String(ai.coverage)}`);
    if (ai.findings.length > 0) {
      lines.push("", "### AI findings");
      for (const finding of ai.findings) {
        lines.push("", `#### ${finding.title} (${finding.severity})`, "", finding.explanation);
      }
    }
  }

  if (report.errorMessage) {
    lines.push("", `> Diagnostic: ${report.errorMessage}`);
  }

  const errors = report.errors ?? [];
  lines.push("", "## Hard errors");
  if (!errors.length) {
    lines.push("", "No hard errors captured.");
  } else {
    for (const error of errors) {
      lines.push(``, `- [${msToClock(error.timestamp)}] ${error.subtype}: ${error.message}`);
    }
  }

  const assertions = report.assertions ?? [];
  lines.push("", "## Assertions");
  if (!assertions.length) {
    lines.push("", "No assertions returned.");
  } else {
    for (const assertion of assertions) {
      lines.push(
        ``,
        `- [${assertion.status}] ${assertion.name} (${msToClock(assertion.timestamp)})`,
        `  - Expected: ${String(assertion.expected)}`,
        `  - Actual: ${String(assertion.actual)}`,
      );
    }
  }

  return lines.join("\n");
}

function eventTypeLabel(type: string) {
  const labels: Record<string, string> = {
    "v2-final-test-completion": "Run completion",
    "ai-agent-decision": "AI decision",
    "ai-agent-action": "Browser action",
    "ai-agent-result": "Verified result",
    "ai-agent-captured-evidence": "Evidence captured",
    "ai-agent-assertion-passed": "Check passed",
    "ai-agent-assertion-failed": "Check needs review",
    "ai-agent-replan-required": "Test path adapted",
    "ai-agent-replanned": "Test path updated",
    "ai-agent-finished-scenario": "Scenario completed",
    "v2-scenario-completed": "Scenario completed",
    "v2-scenario-needs-review": "Scenario needs review",
    "v2-scenario-blocked": "Scenario paused",
    "run-outcome": "Run outcome recorded",
    "bug-intelligence": "Finding reviewed",
    "auth-completed": "Authentication checked",
    "auth-failed-needs-review": "Authentication needs review",
  };
  if (labels[type]) return labels[type];
  if (/^ai-agent-/i.test(type)) return "AI browser activity";
  if (/^v2-/i.test(type)) return "Scenario activity";
  return "Browser activity";
}

function eventLabel(e: {
  type: string;
  target?: string;
  label?: string;
  url?: string;
  message?: string;
}) {
  const isInternal = (value: unknown) => typeof value === "string" && /^(ai-agent-|v2-|run-outcome|bug-intelligence|auth-)/i.test(value.trim());
  return [e.target, e.label, e.message, e.url].find((value) => typeof value === "string" && value.trim() && !isInternal(value)) ?? eventTypeLabel(e.type);
}
function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "danger" | "success";
}) {
  return (
    <div className="surface-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div
        className={`mt-1 font-display text-2xl font-semibold ${tone === "danger" ? "text-destructive" : tone === "success" ? "text-primary" : ""}`}
      >
        {value}
      </div>
      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}
function LoadingState() {
  return (
    <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24 text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Loading real run evidence…
    </div>
  );
}
function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <div className="surface-card p-6">
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="h-5 w-5" />
          <h2 className="font-display font-semibold">Unable to load run</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
function EmptyState({
  icon: Icon,
  title,
  body,
  compact = false,
}: {
  icon: typeof Camera;
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "p-8" : "min-h-[280px] p-10"}`}
    >
      <Icon className="h-6 w-6 text-muted-foreground" />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
