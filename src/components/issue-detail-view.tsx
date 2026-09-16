import { useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  CircleAlert,
  Code2,
  Copy,
  ExternalLink,
  FileJson,
  Gauge,
  Network,
  ShieldAlert,
  Terminal,
  X,
} from "lucide-react";
import type { ReportIssue, EvidenceTab } from "@/lib/report-model";
import { networkProfileDisplay } from "@/lib/network-profiles";

const severityTone: Record<ReportIssue["severity"], string> = {
  critical: "border-destructive/35 bg-destructive/12 text-destructive",
  high: "border-warning/35 bg-warning/12 text-warning",
  warning: "border-info/35 bg-info/12 text-info",
  info: "border-border bg-surface-2 text-muted-foreground",
};
const severityLabel: Record<ReportIssue["severity"], string> = {
  critical: "Critical",
  high: "High",
  warning: "Warning",
  info: "Info",
};
const tabs: Array<{ id: EvidenceTab; label: string; icon: typeof Terminal }> = [
  { id: "overview", label: "Overview", icon: CircleAlert },
  { id: "console", label: "Console", icon: Terminal },
  { id: "network", label: "Network", icon: Network },
  { id: "storage", label: "Storage", icon: ShieldAlert },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "dom", label: "DOM", icon: Code2 },
];

export function IssueDetailView({
  issue,
  onClose,
  compact = false,
  actions,
}: {
  issue: ReportIssue;
  onClose: () => void;
  compact?: boolean;
  actions?: ReactNode;
}) {
  const [tab, setTab] = useState<EvidenceTab>(
    issue.defaultTab === "network" ||
      issue.defaultTab === "storage" ||
      issue.defaultTab === "performance" ||
      issue.defaultTab === "dom"
      ? issue.defaultTab
      : "overview",
  );
  const [copied, setCopied] = useState(false);
  const activeTab = tab;
  const copy = async () => {
    const payload = `${issue.title}\n\nSeverity: ${severityLabel[issue.severity]}\nCategory: ${issue.category}\n\n${issue.summary}`;
    await navigator.clipboard?.writeText(payload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  };
  return (
    <div
      className={
        compact
          ? "relative flex h-full flex-col bg-surface"
          : "fixed inset-0 z-50 flex justify-end bg-background/75 backdrop-blur-sm"
      }
    >
      {!compact && (
        <button
          type="button"
          aria-label="Close issue detail"
          onClick={onClose}
          className="absolute inset-0 cursor-default"
        />
      )}
      <section
        className={
          compact
            ? "flex h-full flex-col"
            : "relative flex h-full w-full max-w-6xl flex-col border-l border-border bg-background shadow-2xl lg:w-[min(92vw,1180px)]"
        }
        aria-label="Issue details"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-surface px-5 py-4 md:px-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${severityTone[issue.severity]}`}
              >
                {severityLabel[issue.severity]}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {issue.category}
              </span>
            </div>
            <h2 className="mt-2 truncate font-display text-xl font-semibold tracking-tight md:text-2xl">
              {issue.title}
            </h2>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
              <span>Run {issue.context.runId}</span>
              <span>· {issue.context.device || "Desktop"}</span>
              <span>· {issue.context.role || "Admin"}</span>
              {issue.context.networkProfile && (
                <span title={networkProfileDisplay(issue.context.networkProfile).tooltip}>
                  · {networkProfileDisplay(issue.context.networkProfile).label} (
                  {networkProfileDisplay(issue.context.networkProfile).tooltip})
                </span>
              )}
              <span>
                · {issue.occurrences} occurrence{issue.occurrences === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <nav
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-surface/80 px-5 md:px-7"
          aria-label="Issue evidence tabs"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium ${activeTab === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-7">
          {activeTab === "overview" && <Overview issue={issue} />}
          {activeTab === "console" && (
            <LogPanel
              title="Console Errors"
              icon={<Terminal className="h-4 w-4" />}
              values={issue.evidence.console.map(
                (entry) => entry.message || entry.label || entry.type,
              )}
              empty="No console evidence was attached to this finding."
            />
          )}
          {activeTab === "network" && <NetworkPanel issue={issue} />}
          {activeTab === "storage" && (
            <JsonPanel
              title="Storage Snapshot Diff"
              value={issue.evidence.storage}
              empty="No storage snapshot was attached to this finding."
            />
          )}
          {activeTab === "performance" && (
            <JsonPanel
              title="Performance Waterfall"
              value={issue.evidence.performance}
              empty="No performance metrics were attached to this finding."
            />
          )}
          {activeTab === "dom" && <DomPanel issue={issue} />}
        </div>
      </section>
    </div>
  );
}

function Overview({ issue }: { issue: ReportIssue }) {
  const screenshot = issue.screenshot;
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
      <div className="space-y-5">
        <section className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Summary</h3>
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
            {issue.summary}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-xs sm:grid-cols-3">
            <Meta label="Severity" value={severityLabel[issue.severity]} />
            <Meta label="Category" value={issue.category} />
            <Meta label="Confidence" value="Evidence-backed" />
            <Meta
              label="First occurred"
              value={
                issue.timestamp !== undefined
                  ? `${Math.round(issue.timestamp)}ms`
                  : "Recorded in run"
              }
            />
            <Meta label="Scope" value={issue.scope} />
            <Meta label="Status" value={issue.severity === "critical" ? "Open" : "Needs review"} />
          </div>
        </section>
        {issue.remediation && (
          <section className="surface-card p-5">
            <h3 className="font-display text-sm font-semibold">Suggested fix</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{issue.remediation}</p>
          </section>
        )}
      </div>
      <section className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-display text-sm font-semibold">
            {screenshot ? "Visual Evidence" : "Diagnostic Evidence"}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {screenshot
              ? "Captured at the failure point"
              : "Visual artifact not required for this issue type"}
          </p>
        </div>
        {screenshot?.url ? (
          <div className="relative bg-surface-2/40 p-5">
            <div className="relative overflow-hidden rounded-md border border-border bg-white">
              <img
                src={screenshot.annotatedUrl || screenshot.url}
                alt={screenshot.label || issue.title}
                className="block max-h-[420px] w-full object-contain"
              />
              {issue.kind === "interaction" && screenshot.annotationStatus !== "APPLIED" && (
                <span
                  className="pointer-events-none absolute left-[58%] top-[72%] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-destructive/80 shadow-[0_0_0_4px_rgba(239,68,68,0.28)]"
                  aria-label="Failed interaction marker"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center bg-surface-2/30 p-8 text-center">
            <FileJson className="h-8 w-8 text-info" />
            <p className="mt-3 text-sm font-medium">Structured evidence</p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
              Open the {issue.defaultTab} tab to inspect the measured diagnostic payload.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function NetworkPanel({ issue }: { issue: ReportIssue }) {
  const values = issue.evidence.network.map((entry) =>
    `${entry.type} ${entry.url || ""} ${entry.status ?? ""} ${entry.message || ""}`.trim(),
  );
  return (
    <LogPanel
      title="Network Trace"
      icon={<Network className="h-4 w-4" />}
      values={values}
      empty={
        issue.error?.target
          ? `${issue.error.subtype.toUpperCase()} ${issue.error.target} ${issue.error.status ?? "failed"}`
          : "No network evidence was attached to this finding."
      }
    />
  );
}
function DomPanel({ issue }: { issue: ReportIssue }) {
  const value = issue.evidence.dom;
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
        <Code2 className="h-4 w-4 text-info" />
        DOM / Policy Diagnostic
      </h3>
      {value ? (
        <pre className="overflow-auto rounded-md border border-border bg-surface-2/50 p-4 font-mono text-xs leading-6 text-muted-foreground">
          {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <Empty text="No DOM diagnostic was attached to this finding." />
      )}
    </div>
  );
}
function JsonPanel({ title, value, empty }: { title: string; value: unknown; empty: string }) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
        <FileJson className="h-4 w-4 text-info" />
        {title}
      </h3>
      {value && (typeof value !== "object" || Object.keys(value as object).length > 0) ? (
        <pre className="overflow-auto rounded-md border border-border bg-surface-2/50 p-4 font-mono text-xs leading-6 text-muted-foreground">
          {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <Empty text={empty} />
      )}
    </div>
  );
}
function LogPanel({
  title,
  icon,
  values,
  empty,
}: {
  title: string;
  icon: ReactNode;
  values: string[];
  empty: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
        {icon}
        {title}{" "}
        {values.length > 0 && (
          <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 font-mono text-[10px] text-destructive">
            {values.length}
          </span>
        )}
      </h3>
      {values.length ? (
        <div className="space-y-2">
          {values.map((value, index) => (
            <div
              key={`${value}-${index}`}
              className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 font-mono text-xs leading-5 text-muted-foreground"
            >
              <span className="mr-2 text-destructive">⊙</span>
              {value}
            </div>
          ))}
        </div>
      ) : (
        <Empty text={empty} />
      )}
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-xs text-foreground">{value}</div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}
