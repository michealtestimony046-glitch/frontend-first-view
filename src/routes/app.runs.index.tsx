import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Chrome, Loader2, Play, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  organizationsApi,
  projectsApi,
  runsApi,
  type Project,
  type RunListItem,
  type TriggerRunResponse,
} from "@/lib/api-client";
import { V2RunPreflight } from "@/components/v2-run-preflight";

const ACTIVE_ORG_KEY = "matrix_qa_active_organization";
const ACTIVE_PROJECT_KEY = "matrix_qa_active_project";

type Filter = "all" | "completed" | "failed" | "running" | "pending";

export const Route = createFileRoute("/app/runs/")({
  head: () => ({
    meta: [{ title: "Test Runs · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: RunsLayout,
});

function RunsLayout() {
  const [projectId, setProjectId] = useState<string | null>(
    () =>
      new URLSearchParams(window.location.search).get("projectId") ||
      localStorage.getItem(ACTIVE_PROJECT_KEY),
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRunDrawer, setShowRunDrawer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadProjects = async () => {
      try {
        const organizations = await organizationsApi.list();
        const activeOrgId = localStorage.getItem(ACTIVE_ORG_KEY) || organizations[0]?.id;
        if (!activeOrgId) return;
        const items = await projectsApi.list(activeOrgId);
        if (cancelled) return;
        setProjects(items);
        const selected =
          items.find((item) => item.id === projectId) ??
          items.find((item) => item.id === localStorage.getItem(ACTIVE_PROJECT_KEY)) ??
          items[0];
        setProjectId(selected?.id ?? null);
        if (selected) localStorage.setItem(ACTIVE_PROJECT_KEY, selected.id);
      } catch (cause) {
        if (!cancelled) setError(toMessage(cause, "Unable to load projects."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadProjects();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectId) {
      setRuns([]);
      return;
    }
    let cancelled = false;
    setLoadingRuns(true);
    runsApi
      .list(projectId)
      .then((items) => {
        if (!cancelled) setRuns(items);
      })
      .catch((cause) => {
        if (!cancelled) setError(toMessage(cause, "Unable to load test runs."));
      })
      .finally(() => {
        if (!cancelled) setLoadingRuns(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const selectedProject = projects.find((item) => item.id === projectId);
  const changeProject = (value: string) => {
    setProjectId(value || null);
    if (value) localStorage.setItem(ACTIVE_PROJECT_KEY, value);
    else localStorage.removeItem(ACTIVE_PROJECT_KEY);
    window.history.replaceState(
      {},
      "",
      value ? `/app/runs?projectId=${encodeURIComponent(value)}` : "/app/runs",
    );
  };

  const handleRunCreated = (response: TriggerRunResponse & { planId?: string }) => {
    setShowRunDrawer(false);
    if (projectId)
      window.location.assign(
        `/app/runs/${encodeURIComponent(response.id)}?projectId=${encodeURIComponent(projectId)}`,
      );
  };

  if (loading) return <CenteredState label="Loading live projects…" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Test Runs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real executions returned by the Matrix QA backend.
          </p>
        </div>
        <button
          onClick={() => setShowRunDrawer(true)}
          disabled={!selectedProject}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground btn-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="h-4 w-4" /> New Test Run
        </button>
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="min-w-[260px] flex-1 text-xs font-medium text-muted-foreground">
          Project
          <select
            value={projectId ?? ""}
            onChange={(event) => changeProject(event.target.value)}
            className="mt-1.5 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Select a project</option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="text-xs text-muted-foreground">
          {selectedProject?.defaultTargetUrl ||
            selectedProject?.targetUrl ||
            "Choose a project to see its runs."}
        </div>
      </div>
      {error && (
        <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {selectedProject && <RunsTable project={selectedProject} runs={runs} loading={loadingRuns} />}
      {!selectedProject && (
        <div className="mt-6 rounded-md border border-dashed border-border p-12 text-center">
          <p className="font-display text-base font-semibold">Choose a project first</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Runs are scoped by project so reports always have the correct backend context.
          </p>
        </div>
      )}
      {showRunDrawer && selectedProject && <V2RunPreflight project={selectedProject} onClose={() => setShowRunDrawer(false)} onStarted={handleRunCreated} />}
    </div>
  );
}

function RunsTable({
  project,
  runs,
  loading,
}: {
  project: Project;
  runs: RunListItem[];
  loading: boolean;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = useMemo(
    () =>
      runs.filter((run) => {
        if (filter !== "all" && !matchesFilter(run.status, filter)) return false;
        return !q || run.targetUrl.toLowerCase().includes(q.toLowerCase());
      }),
    [filter, q, runs],
  );

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface-2/40 px-3 py-1.5 md:max-w-md">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search by target URL…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-surface-2/40 p-1">
          {(["all", "completed", "failed", "running", "pending"] as Filter[]).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize ${filter === item ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <section className="surface-card mt-4 overflow-hidden">
        {loading ? (
          <CenteredState label="Loading runs…" />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No live runs match those filters.
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="grid grid-cols-[80px_minmax(0,1fr)_120px_120px_120px_16px] items-center gap-3 border-b border-border bg-surface-2/40 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Run</span>
                <span>Target</span>
                <span>Status</span>
                <span>Browser</span>
                <span>Started</span>
                <span />
              </div>
              <ul>
                {filtered.map((run, index) => (
                  <RunRow key={run.id} run={run} index={index} project={project} />
                ))}
              </ul>
            </div>
            <ul className="divide-y divide-border md:hidden">
              {filtered.map((run, index) => (
                <RunRow key={run.id} run={run} index={index} project={project} mobile />
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}

function RunRow({
  run,
  index,
  project,
  mobile = false,
}: {
  run: RunListItem;
  index: number;
  project: Project;
  mobile?: boolean;
}) {
  const href = `/app/runs/${encodeURIComponent(run.id)}?projectId=${encodeURIComponent(project.id)}`;
  const metadata = run.metadata && typeof run.metadata === "object" ? run.metadata : null;
  const isV2 = metadata?.v2 === true;
  const estimatedUnits = typeof metadata?.estimatedUnits === "number" ? metadata.estimatedUnits : null;
  if (mobile)
    return (
      <li>
        <a href={href} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">#{index + 1}</span>
              <StatusPill status={run.status} />
              {isV2 && <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">Estimate · {estimatedUnits ?? "—"} ⟐</span>}
            </div>
            <div className="mt-1 truncate font-mono text-xs text-foreground">{run.targetUrl}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {formatDate(run.createdAt || run.startedAt)} ·{" "}
              {run.errorMessage || "No run-level error"}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>
      </li>
    );
  return (
    <li>
      <a
        href={href}
        className="group grid grid-cols-[80px_minmax(0,1fr)_120px_120px_120px_16px] items-center gap-3 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-accent/30"
      >
        <span className="font-mono text-xs text-muted-foreground">#{index + 1}</span>
        <span className="truncate font-mono text-xs text-foreground">{run.targetUrl}</span>
        <div className="flex flex-wrap items-center gap-1.5"><StatusPill status={run.status} />{isV2 && <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">Estimate · {estimatedUnits ?? "—"} ⟐</span>}</div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Chrome className="h-3.5 w-3.5" /> Chromium
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {formatDate(run.createdAt || run.startedAt)}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </a>
    </li>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const style =
    normalized === "COMPLETED"
      ? "bg-success/15 text-success"
      : normalized === "FAILED"
        ? "bg-destructive/15 text-destructive"
        : normalized === "RUNNING"
          ? "bg-primary/15 text-primary"
          : "bg-surface-2 text-muted-foreground";
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${style}`}
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

function matchesFilter(status: string, filter: Filter) {
  const normalized = status.toLowerCase();
  return filter === "running"
    ? normalized === "running"
    : filter === "pending"
      ? normalized === "pending"
      : normalized === filter;
}
function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}
function toMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}
function CenteredState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
