import { createFileRoute } from "@tanstack/react-router";
import { SpecialTopicPage } from "@/components/special-topic-page";
import { seoHead } from "@/lib/seo";
import { finalFourPages } from "./final-four-content";

const page = finalFourPages["/playwright-testing"];

export const Route = createFileRoute("/playwright-testing")({
  head: () =>
    seoHead({
      title: "Playwright Testing and Browser Evidence | Matrix QA",
      description: page.description,
      path: "/playwright-testing",
    }),
  component: () => <SpecialTopicPage config={page} />,
});
