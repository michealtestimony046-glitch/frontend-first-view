import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bug, Download, ExternalLink, Search, X } from "lucide-react";
import { getIssues, type IssueGroup } from "@/lib/mock-data";

export const Route = createFileRoute("/app/issues")({
  head: () => ({
    meta: [{ title: "Issues · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: IssuesPage,
});

const sevTone: Record<IssueGroup["severity"], string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-info/15 text-info border-info/30",
  low: "bg-surface-2 text-muted-foreground border-border",
};

function IssuesPage() {
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<"all" | IssueGroup["severity"]>("all");
  const [selected, setSelected] = useState<IssueGroup | null>(null);
  const list = getIssues().filter((i) => {
    if (sev !== "all" && i.severity !== sev) return false;
    if (q && !i.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Issues
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Duplicate failures across matrix variants collapse into one
          actionable issue. Grouped by root cause, not by run.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface-2/40 px-3 py-1.5 md:max-w-md">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search issues…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-surface-2/40 p-1">
          {(["all", "critical", "high", "medium", "low"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSev(f)}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize ${
                sev === f
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <section className="surface-card mt-4 overflow-hidden">
        <ul className="divide-y divide-border">
          {list.map((i) => (
            <li key={i.id}>
              <button
                onClick={() => setSelected(i)}
                className="grid w-full grid-cols-[1fr_auto] items-start gap-3 px-4 py-3.5 text-left hover:bg-accent/30 md:grid-cols-[1fr_120px_100px_120px_16px]"
              >
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <Bug className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {i.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span
                          className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${sevTone[i.severity]}`}
                        >
                          {i.severity}
                        </span>
                        <span>{i.scope}</span>
                        <span>·</span>
                        <span className="font-mono">{i.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="hidden text-sm text-foreground md:block">
                  {i.occurrences}×
                </span>
                <span className="hidden text-xs text-muted-foreground md:block">
                  {i.affectedRuns.length} runs
                </span>
                <span className="hidden text-xs text-muted-foreground md:block">
                  {i.lastSeen}
                </span>
                <ExternalLink className="hidden h-4 w-4 shrink-0 text-muted-foreground md:block" />
              </button>
            </li>
          ))}
          {list.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">
              Nothing matches those filters.
            </li>
          )}
        </ul>
      </section>

      {selected && <IssueDrawer issue={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function IssueDrawer({ issue, onClose }: { issue: IssueGroup; onClose: () => void }) {
  const repro = `### ${issue.title}

**Severity:** ${issue.severity.toUpperCase()}
**Scope:** ${issue.scope}
**Category:** ${issue.category}
**Occurrences:** ${issue.occurrences}
**Affected runs:** ${issue.affectedRuns.join(", ")}

### Reproduction
1. Trigger the ${issue.scope.toLowerCase()} scenario
2. Observe the ${issue.category} failure

### Evidence
See screenshots and console/network traces on each affected run.
`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative flex w-full max-w-xl flex-col border-l border-border bg-surface">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${sevTone[issue.severity]}`}
              >
                {issue.severity}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {issue.id}
              </span>
            </div>
            <h2 className="mt-2 font-display text-base font-semibold">
              {issue.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Meta label="Occurrences" value={`${issue.occurrences}`} />
            <Meta label="Runs affected" value={`${issue.affectedRuns.length}`} />
            <Meta label="First seen" value={issue.firstSeen} />
            <Meta label="Last seen" value={issue.lastSeen} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Repair Package · Markdown
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(repro)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2/60 px-2 py-1 text-xs hover:bg-accent"
              >
                <Download className="h-3 w-3" /> Copy
              </button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-foreground">
              {repro}
            </pre>
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Export for
            </div>
            <div className="flex flex-wrap gap-2">
              {["Cursor", "Claude Code", "GitHub Issue", "Linear"].map((t) => (
                <button
                  key={t}
                  className="rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
