import { createFileRoute } from "@tanstack/react-router";
import { SpecialTopicPage } from "@/components/special-topic-page";
import { seoHead } from "@/lib/seo";
import { specialTopicPages } from "./special-topic-content";

const page = specialTopicPages["/web-application-testing"];

export const Route = createFileRoute("/web-application-testing")({
  head: () =>
    seoHead({
      title: "Web Application Testing Guide | Browser QA and Evidence | Matrix QA",
      description: page.description,
      path: "/web-application-testing",
    }),
  component: () => <SpecialTopicPage config={page} />,
});
