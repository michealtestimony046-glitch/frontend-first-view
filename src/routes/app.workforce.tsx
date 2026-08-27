import { createFileRoute } from "@tanstack/react-router";
import { WorkerPoolHealth } from "@/components/worker-pool-health";
import { useLivePortfolio } from "@/lib/live-data";

export const Route = createFileRoute("/app/workforce")({
  head: () => ({
    meta: [{ title: "Worker Pool Health · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: WorkforceHealthPage,
});

function WorkforceHealthPage() {
  const live = useLivePortfolio();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Worker Pool Health
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          See the live health and assignment state of Matrix QA sub-agents in the selected
          workspace. This is an observational view of bounded workforce orchestration, not a control
          plane for permissions or browser concurrency.
        </p>
      </div>
      <WorkerPoolHealth projectId={live.activeProject?.id} />
    </div>
  );
}
