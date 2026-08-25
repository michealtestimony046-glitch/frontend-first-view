import { createFileRoute } from "@tanstack/react-router";
import { SpecialTopicPage } from "@/components/special-topic-page";
import { seoHead } from "@/lib/seo";
import { specialTopicPages } from "./special-topic-content";

const page = specialTopicPages["/javascript-error-monitoring"];

export const Route = createFileRoute("/javascript-error-monitoring")({
  head: () =>
    seoHead({
      title: "JavaScript Error Monitoring with Browser Evidence | Matrix QA",
      description: page.description,
      path: "/javascript-error-monitoring",
    }),
  component: () => <SpecialTopicPage config={page} />,
});
