import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  v2Api,
  type CustomerWorkerHealthAgent,
  type CustomerWorkerPoolHealth,
} from "@/lib/api-client";

const POLL_INTERVAL_MS = 30_000;

type Props = {
  projectId?: string | null;
  compact?: boolean;
};

const stateLabel = (health: CustomerWorkerHealthAgent["health"]) => {
  switch (health) {
    case "HEALTHY":
      return "Healthy";
    case "STALE":
      return "Stale heartbeat";
    case "DRAINING":
      return "Draining";
    case "UNREPORTED":
      return "Awaiting snapshot";
    case "DEGRADED":
      return "Degraded";
    default:
      return "Standby";
  }
};

const statusLabel = (status: CustomerWorkerPoolHealth["status"]) =>
  status === "HEALTHY" ? "Healthy" : status === "DEGRADED" ? "Degraded" : "No active worker run";
const statusTone = (status: CustomerWorkerPoolHealth["status"]) =>
  status === "HEALTHY"
    ? "text-success"
    : status === "DEGRADED"
      ? "text-warning"
      : "text-muted-foreground";
const formatUpdated = (value: string | null) =>
  value
    ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "not available";
const formatAge = (value: number | null) =>
  value === null
    ? "no heartbeat"
    : value < 60_000
      ? "under a minute ago"
      : `${Math.floor(value / 60_000)}m ago`;

export function WorkerPoolHealth({ projectId, compact = false }: Props) {
  const [health, setHealth] = useState<CustomerWorkerPoolHealth | null>(null);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    if (!projectId) {
      setHealth(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    const load = async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await v2Api.getWorkerPoolHealth(projectId);
        if (!cancelled) {
          setHealth(result);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled)
          setError(
            cause instanceof Error ? cause.message : "Worker health is temporarily unavailable.",
          );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    void load();
    const timer = window.setInterval(() => void load(true), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [projectId]);

  const heading = compact ? "Worker Pool Health" : "Matrix QA Worker Pool";
  return (
    <section className="surface-card overflow-hidden" aria-labelledby="worker-pool-health-title">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Users className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="worker-pool-health-title" className="font-display text-base font-semibold">
                {heading}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Customer-visible workforce capacity · refreshes every 30s
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {health && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-[11px] font-medium ${statusTone(health.status)}`}
              role="status"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {statusLabel(health.status)}
            </span>
          )}
          {projectId && (
            <button
              type="button"
              onClick={() => {
                if (!refreshing) {
                  setRefreshing(true);
                  void v2Api
                    .getWorkerPoolHealth(projectId)
                    .then(setHealth)
                    .catch((cause) =>
                      setError(
                        cause instanceof Error ? cause.message : "Unable to refresh worker health.",
                      ),
                    )
                    .finally(() => setRefreshing(false));
                }
              }}
              disabled={refreshing}
              aria-label="Refresh worker health"
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </header>

      {!projectId ? (
        <EmptyState
          title="Choose a project"
          detail="Worker health is scoped to the active project and its workspace."
        />
      ) : loading && !health ? (
        <div
          className="flex min-h-48 items-center justify-center gap-2 px-5 py-8 text-sm text-muted-foreground"
          role="status"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading live worker health…
        </div>
      ) : error && !health ? (
        <EmptyState title="Worker health unavailable" detail={error} tone="error" />
      ) : health ? (
        <>
          {error && (
            <p
              className="border-b border-warning/20 bg-warning/5 px-5 py-2 text-xs text-warning"
              role="alert"
            >
              Refresh issue: {error}. Showing the last successful snapshot.
            </p>
          )}
          <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
            <Metric
              label="Health"
              value={health.healthPercent === null ? "—" : `${health.healthPercent}%`}
              detail={
                health.healthPercent === null
                  ? "Not enough live data"
                  : `${health.workers.unavailable} unavailable or degraded`
              }
              icon={Activity}
              tone={
                health.status === "HEALTHY"
                  ? "success"
                  : health.status === "DEGRADED"
                    ? "warning"
                    : "neutral"
              }
            />
            <Metric
              label="Active Workers"
              value={`${health.workers.active} / ${health.workers.registered}`}
              detail="Named Matrix QA sub-agents"
              icon={Users}
              tone="neutral"
            />
            <Metric
              label="Idle / Busy"
              value={`${health.workers.idle} / ${health.workers.busy}`}
              detail="Current assignment state"
              icon={Zap}
              tone="neutral"
            />
            <Metric
              label="Capacity"
              value={`${health.capacity.activeSlots} / ${health.capacity.maxSlots}`}
              detail={`${health.capacity.utilizationPercent}% of reported slots`}
              icon={Clock3}
              tone="neutral"
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3 text-xs text-muted-foreground">
            <span>
              Run:{" "}
              <strong className="font-medium text-foreground">
                {health.run.mode?.replaceAll("_", " ") || "No active run"}
              </strong>
            </span>
            <span>
              Tasks:{" "}
              <strong className="font-medium text-foreground">
                {health.tasks.running} running
              </strong>{" "}
              · {health.tasks.queued} queued · {health.tasks.completed} completed
            </span>
            <span>
              MU reserved:{" "}
              <strong className="font-medium text-foreground">{health.tasks.muReserved}</strong>
            </span>
            <span className="ml-auto">
              Updated {formatUpdated(health.run.updatedAt || health.generatedAt)}
            </span>
          </div>
          {expanded && <AgentList agents={health.agents} />}
          <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <p className="max-w-2xl text-[11px] leading-5 text-muted-foreground">
              Logical worker assignments and capacity are shown from persisted workforce state. They
              do not represent uncontrolled parallel browser execution or grant additional
              permissions.
            </p>
            <div className="flex items-center gap-3">
              {compact && (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {expanded ? "Hide details" : "View worker details"}
                </button>
              )}
              <Link
                to="/app/workforce"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                View worker activity <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </footer>
        </>
      ) : null}
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  tone: "success" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="bg-surface px-4 py-4">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <div className={`mt-1 font-display text-xl font-semibold ${toneClass}`}>{value}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{detail}</div>
    </div>
  );
}

function AgentList({ agents }: { agents: CustomerWorkerHealthAgent[] }) {
  return (
    <div className="divide-y divide-border" aria-label="Worker agent details">
      <div className="flex items-center justify-between px-5 py-3">
        <h3 className="font-display text-sm font-semibold">Worker activity</h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Latest safe snapshot
        </span>
      </div>
      {agents.map((agent) => (
        <article
          key={agent.key}
          className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-medium text-foreground">{agent.name}</h4>
              <span
                className={`rounded-full border border-border px-2 py-0.5 text-[10px] ${agent.health === "HEALTHY" ? "text-success" : agent.activation === "STANDBY" ? "text-muted-foreground" : "text-warning"}`}
              >
                {stateLabel(agent.health)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {agent.activation === "ACTIVE" ? "Active" : "Standby"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{agent.role}</p>
            {agent.assignedCapabilities.length > 0 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Assigned: {agent.assignedCapabilities.join(" · ")}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">
                {agent.activeSlots} / {agent.maxSlots}
              </strong>{" "}
              slots
            </span>
            <span>
              <strong className="text-foreground">{agent.currentTaskCount}</strong> current tasks
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {formatAge(agent.heartbeatAgeMs)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  detail,
  tone = "neutral",
}: {
  title: string;
  detail: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-5 py-8 text-center">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${tone === "error" ? "bg-destructive/10 text-destructive" : "bg-surface-2 text-muted-foreground"}`}
      >
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-3 font-display text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}
