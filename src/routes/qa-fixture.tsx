import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Filter,
  ListChecks,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/qa-fixture")({
  head: () => ({
    meta: [
      { title: "QA fixture · Matrix QA" },
      {
        name: "description",
        content: "Safe, same-origin action-rich fixture for Matrix QA browser-agent validation.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QaFixturePage,
});

type FixtureTab = "overview" | "settings";

const tasks = [
  {
    id: "MK-104",
    title: "Review onboarding checklist",
    owner: "Maya",
    status: "In review",
    priority: "High",
  },
  {
    id: "MK-105",
    title: "Validate workspace navigation",
    owner: "Andre",
    status: "Ready",
    priority: "Medium",
  },
  {
    id: "MK-106",
    title: "Confirm notification copy",
    owner: "Lina",
    status: "Complete",
    priority: "Low",
  },
  {
    id: "MK-107",
    title: "Check account preferences",
    owner: "Maya",
    status: "Ready",
    priority: "Medium",
  },
];

function QaFixturePage() {
  const [tab, setTab] = useState<FixtureTab>("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [selectedTask, setSelectedTask] = useState(tasks[0].id);
  const [saved, setSaved] = useState(false);
  const [compact, setCompact] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [timezone, setTimezone] = useState("Europe/London");

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesQuery = `${task.id} ${task.title} ${task.owner}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStatus = statusFilter === "All statuses" || task.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [query, statusFilter],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold">Matrix QA fixture</div>
              <div className="text-[11px] text-muted-foreground">
                Safe same-origin interaction lab
              </div>
            </div>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            Back to Matrix QA
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                QA-PLAYGROUND / NOINDEX
              </div>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">
                Action-rich journey fixture.
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                This public-safe page is intentionally designed for Matrix QA to observe, navigate,
                click, filter, select, and validate visible application state without credentials,
                payments, deletion, or external redirects.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 px-4 py-3 text-xs">
              <div className="font-mono uppercase tracking-widest text-muted-foreground">
                Fixture state
              </div>
              <div className="mt-2 flex items-center gap-2 text-success">
                <span className="h-2 w-2 rounded-full bg-success" /> Ready for safe testing
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-border">
          <button
            type="button"
            aria-pressed={tab === "overview"}
            onClick={() => setTab("overview")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${tab === "overview" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <ListChecks className="h-4 w-4" /> Overview
          </button>
          <button
            type="button"
            aria-pressed={tab === "settings"}
            onClick={() => setTab("settings")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${tab === "settings" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Settings2 className="h-4 w-4" /> Settings
          </button>
        </div>

        {tab === "overview" ? (
          <section className="mt-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">Workspace tasks</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search and filter the fixture dataset, then select a safe task for the detail
                  panel.
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                {filteredTasks.length} of {tasks.length} visible
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_190px_auto]">
              <label className="relative block">
                <span className="sr-only">Search tasks</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  aria-label="Search tasks"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by title, ID, or owner"
                  className="w-full rounded-lg border border-border bg-surface/50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="relative block">
                <span className="sr-only">Filter by status</span>
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-surface/50 py-2.5 pl-9 pr-8 text-sm outline-none focus:border-primary"
                >
                  <option>All statuses</option>
                  <option>Ready</option>
                  <option>In review</option>
                  <option>Complete</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </label>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("All statuses");
                }}
                className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent"
              >
                Reset filters
              </button>
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[1fr_auto] border-b border-border bg-surface/40 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <span>Task</span>
                  <span>Status</span>
                </div>
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No matching tasks. Try another search or reset the filters.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredTasks.map((task) => (
                      <button
                        type="button"
                        key={task.id}
                        aria-pressed={selectedTask === task.id}
                        onClick={() => setSelectedTask(task.id)}
                        className={`grid w-full grid-cols-[1fr_auto] gap-4 px-4 py-4 text-left hover:bg-accent/40 ${selectedTask === task.id ? "bg-primary/5" : ""}`}
                      >
                        <span>
                          <span className="font-mono text-[11px] text-primary">{task.id}</span>
                          <span className="mt-1 block text-sm font-medium">{task.title}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Owner: {task.owner} · Priority: {task.priority}
                          </span>
                        </span>
                        <span
                          className={`self-start rounded-full px-2 py-1 text-[10px] ${task.status === "Complete" ? "bg-success/15 text-success" : task.status === "In review" ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary"}`}
                        >
                          {task.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <TaskDetail
                task={tasks.find((task) => task.id === selectedTask) || tasks[0]}
                saved={saved}
                onSave={() => setSaved(true)}
              />
            </div>
          </section>
        ) : (
          <section className="mt-7 max-w-3xl">
            <div>
              <h2 className="font-display text-2xl font-semibold">Fixture preferences</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Safe local settings provide form-fill, select, checkbox, and save-button coverage.
              </p>
            </div>
            <div className="mt-6 space-y-4 rounded-xl border border-border p-5">
              <label className="flex items-center justify-between gap-4 border-b border-border pb-4">
                <span>
                  <span className="block text-sm font-medium">Compact task rows</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Changes the visible density of the fixture.
                  </span>
                </span>
                <input
                  aria-label="Compact task rows"
                  type="checkbox"
                  checked={compact}
                  onChange={(event) => setCompact(event.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between gap-4 border-b border-border pb-4">
                <span>
                  <span className="block text-sm font-medium">Email updates</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    A safe preference toggle; no email is sent.
                  </span>
                </span>
                <input
                  aria-label="Email updates"
                  type="checkbox"
                  checked={emailUpdates}
                  onChange={(event) => setEmailUpdates(event.target.checked)}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Timezone</span>
                <select
                  aria-label="Timezone"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="rounded-lg border border-border bg-surface/50 px-3 py-2.5"
                >
                  <option>Europe/London</option>
                  <option>America/New_York</option>
                  <option>Asia/Tokyo</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => setSaved(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
              >
                <Check className="h-4 w-4" /> Save preferences
              </button>
              {saved && (
                <div
                  role="status"
                  className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success"
                >
                  Preferences saved locally for this fixture. No external request was made.
                </div>
              )}
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Current mode:{" "}
              {compact ? "compact" : "comfortable"} · {emailUpdates ? "updates on" : "updates off"}{" "}
              · {timezone}
            </div>
          </section>
        )}
        <div className="mt-10 rounded-xl border border-border bg-surface/30 p-5 text-xs leading-5 text-muted-foreground">
          <strong className="text-foreground">Testing boundary:</strong> all controls are
          same-origin, non-destructive, deterministic, and safe for automated QA. The fixture is not
          a customer account and contains no credentials or sensitive data.
        </div>
      </main>
    </div>
  );
}

function TaskDetail({
  task,
  saved,
  onSave,
}: {
  task: (typeof tasks)[number];
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <aside className="rounded-xl border border-border bg-surface/30 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
          Selected task
        </div>
        <span className="rounded-full bg-success/15 px-2 py-1 text-[10px] text-success">
          Safe action
        </span>
      </div>
      <h3 className="mt-3 font-display text-xl font-semibold">{task.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        This detail panel changes when another task is selected. The confirmation action records a
        local visible state change for evidence.
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Task ID</dt>
          <dd className="mt-1 font-mono text-foreground">{task.id}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Owner</dt>
          <dd className="mt-1 text-foreground">{task.owner}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onSave}
        className="mt-6 w-full rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15"
      >
        {saved ? "Task confirmed" : "Confirm task review"}
      </button>
    </aside>
  );
}
