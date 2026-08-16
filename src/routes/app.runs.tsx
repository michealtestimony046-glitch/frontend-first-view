import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/runs")({
  head: () => ({
    meta: [{ title: "Test Runs · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: RunsLayout,
});

function RunsLayout() {
  return <Outlet />;
}
