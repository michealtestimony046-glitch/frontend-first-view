import { createFileRoute } from "@tanstack/react-router";
import { ScenarioCatalogPage } from "@/components/scenario-catalog";
export const Route = createFileRoute("/app/scenarios")({
  head: () => ({
    meta: [{ title: "Scenarios · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: ScenarioCatalogPage,
});
