import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ExternalLink, Globe, X, Play, Activity } from "lucide-react";
import { getProjects, type ProjectCard } from "@/lib/mock-data";

export const Route = createFileRoute("/app/projects")({
  head: () => ({
    meta: [
      { title: "Projects · Matrix QA" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectCard[]>(getProjects());
  const [openDrawer, setOpenDrawer] = useState(false);

  const addProject = (p: ProjectCard) => setProjects((prev) => [p, ...prev]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Projects
            </h1>
            <span className="rounded-full border border-border bg-surface-2/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {projects.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Isolated targets for the browser worker. Each project scopes its
            own runs, evidence, and issues.
          </p>
        </div>
        <button
          onClick={() => setOpenDrawer(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground btn-primary-glow hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => (
          <ProjectGridCard key={p.id} project={p} />
        ))}
      </div>

      {openDrawer && (
        <NewProjectDrawer
          onClose={() => setOpenDrawer(false)}
          onCreate={(p) => {
            addProject(p);
            setOpenDrawer(false);
          }}
        />
      )}
    </div>
  );
}

function ProjectGridCard({ project: p }: { project: ProjectCard }) {
  const statusMap = {
    idle: { label: "Idle", tone: "text-muted-foreground bg-surface-2/60" },
    running: { label: "Running", tone: "text-primary bg-primary/15" },
    active: { label: "Active", tone: "text-success bg-success/15" },
  } as const;
  const s = statusMap[p.status];
  const healthColor =
    p.lastRunHealth >= 90
      ? "bg-success"
      : p.lastRunHealth >= 70
        ? "bg-warning"
        : "bg-destructive";

  return (
    <div className="surface-card group flex flex-col overflow-hidden">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-semibold">
            {p.name}
          </div>
          <a
            href={p.targetUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 truncate font-mono text-[11px] text-muted-foreground hover:text-primary"
          >
            <Globe className="h-3 w-3" /> {p.targetUrl}
            <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
          </a>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${s.tone}`}
        >
          {p.status === "running" && (
            <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          )}
          {s.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 py-3 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Matrix variants
          </div>
          <div className="mt-0.5 font-display text-xl font-semibold">
            {p.totalVariants}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Last run health
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-display text-xl font-semibold">
              {p.lastRunHealth.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full ${healthColor}`}
              style={{ width: `${p.lastRunHealth}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border bg-surface-2/40 px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {p.environment} · last tested {p.lastRunAt}
        </span>
        <Link
          to="/app/runs"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface/60 px-2.5 py-1 text-xs font-medium hover:bg-accent"
        >
          <Activity className="h-3.5 w-3.5" /> View runs
        </Link>
      </div>
    </div>
  );
}

function NewProjectDrawer({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: ProjectCard) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [env, setEnv] = useState<"staging" | "production" | "local">("staging");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    onCreate({
      id: `prj_${Math.random().toString(36).slice(2, 8)}`,
      workspaceId: "ws_acme_01",
      name,
      targetUrl: url,
      environment: env,
      status: "idle",
      totalVariants: 0,
      lastRunHealth: 0,
      lastRunAt: "never",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative flex w-full max-w-md flex-col border-l border-border bg-surface"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold">New Project</h2>
            <p className="text-xs text-muted-foreground">
              Name + URL. That's all v1 needs.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-foreground">
              Project name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Client Checkout Flow"
              className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-foreground">
              Target base URL
            </span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://staging.your-app.com"
              className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 font-mono text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-foreground">
              Environment
            </span>
            <select
              value={env}
              onChange={(e) => setEnv(e.target.value as typeof env)}
              className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="staging">Staging</option>
              <option value="production">Production</option>
              <option value="local">Local / Dev</option>
            </select>
          </label>

          <div className="rounded-md border border-border/60 bg-surface-2/30 p-3 text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-wider text-primary">
              v1 guardrail —
            </span>{" "}
            Repository authentication, tokens, and webhooks land in v2. Give it
            a name and URL and Matrix QA can walk it.
          </div>
        </div>
        <div className="border-t border-border bg-surface-2/40 px-5 py-3">
          <button
            type="submit"
            disabled={!name || !url}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground btn-primary-glow disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play className="h-4 w-4" /> Create project
          </button>
        </div>
      </form>
    </div>
  );
}
