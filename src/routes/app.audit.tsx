import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { getAuditLog, type AuditEntry } from "@/lib/mock-data";

export const Route = createFileRoute("/app/audit")({
  head: () => ({
    meta: [{ title: "Audit Log · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: AuditPage,
});

const catLabel: Record<AuditEntry["category"], string> = {
  console_warning: "Console Warning",
  network_noise: "Network Noise",
  visual_shift: "Visual Shift",
};

const catTone: Record<AuditEntry["category"], string> = {
  console_warning: "text-warning bg-warning/10",
  network_noise: "text-info bg-info/10",
  visual_shift: "text-muted-foreground bg-surface-2",
};

function AuditPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | AuditEntry["category"]>("all");
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  const all = getAuditLog();
  const list = all.filter((e) => {
    if (cat !== "all" && e.category !== cat) return false;
    if (q && !`${e.message} ${e.runId}`.toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  const counts = {
    total: all.length,
    warnings: all.filter((e) => e.category === "console_warning").length,
    network: all.filter((e) => e.category === "network_noise").length,
    visual: all.filter((e) => e.category === "visual_shift").length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Audit Log
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything the <span className="font-mono text-primary">UI Noise Gate</span>{" "}
          stripped from your primary run stream. Kept here for auditability.
        </p>
      </div>

      {/* Metric row */}
      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        <MetricPill label="Total suppressed" value={counts.total} />
        <MetricPill label="Console warnings" value={counts.warnings} />
        <MetricPill label="Network noise" value={counts.network} />
        <MetricPill label="Visual shifts" value={counts.visual} />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface-2/40 px-3 py-1.5 md:max-w-md">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search messages or run ID…"
            className="w-full bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface-2/40 p-1">
          <Filter className="ml-1 h-3 w-3 text-muted-foreground" />
          {(["all", "console_warning", "network_noise", "visual_shift"] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setCat(f)}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  cat === f
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : catLabel[f]}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Table */}
      <section className="surface-card mt-4 overflow-hidden">
        <div className="hidden md:block">
          <div className="grid grid-cols-[110px_100px_130px_1fr_80px] items-center gap-3 border-b border-border bg-surface-2/40 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Timestamp</span>
            <span>Run</span>
            <span>Category</span>
            <span>Message</span>
            <span />
          </div>
          <ul>
            {list.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setSelected(e)}
                  className="grid w-full grid-cols-[110px_100px_130px_1fr_80px] items-center gap-3 border-b border-border px-4 py-2.5 text-left font-mono text-xs last:border-b-0 hover:bg-accent/30"
                >
                  <span className="text-muted-foreground">{e.ts}</span>
                  <span className="text-primary">#{e.runId.slice(-4)}</span>
                  <span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${catTone[e.category]}`}
                    >
                      {catLabel[e.category]}
                    </span>
                  </span>
                  <span className="truncate text-foreground">{e.message}</span>
                  <span className="text-right text-[10px] uppercase text-muted-foreground">
                    Inspect
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile stacked */}
        <ul className="divide-y divide-border md:hidden">
          {list.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => setSelected(e)}
                className="block w-full px-4 py-3 text-left font-mono"
              >
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span
                    className={`rounded px-1.5 py-0.5 uppercase ${catTone[e.category]}`}
                  >
                    {catLabel[e.category]}
                  </span>
                  <span className="text-muted-foreground">
                    #{e.runId.slice(-4)} · {e.ts}
                  </span>
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-foreground">
                  {e.message}
                </div>
              </button>
            </li>
          ))}
        </ul>

        {list.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No suppressed entries match those filters.
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setSelected(null)} />
          <div className="relative flex w-full max-w-lg flex-col border-l border-border bg-surface">
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span
                    className={`rounded px-1.5 py-0.5 uppercase ${catTone[selected.category]}`}
                  >
                    {catLabel[selected.category]}
                  </span>
                  <span className="text-muted-foreground">
                    #{selected.runId.slice(-4)} · {selected.ts}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-base font-semibold">
                  Suppressed by noise gate
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Raw message
                </div>
                <pre className="overflow-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed">
                  {selected.message}
                </pre>
              </div>
              {selected.source && (
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    Source
                  </div>
                  <div className="font-mono text-xs text-foreground">
                    {selected.source}
                  </div>
                </div>
              )}
              <div>
                <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Suppression reason
                </div>
                <span className="inline-block rounded-md border border-border bg-surface-2/60 px-2 py-1 font-mono text-xs text-primary">
                  {selected.reason}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
