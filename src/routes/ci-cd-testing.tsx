import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoTopicPages } from "./seo-topic-content";

const page = seoTopicPages["/ci-cd-testing"];

export const Route = createFileRoute("/ci-cd-testing")({
  head: () => ({
    meta: [{ title: page.title }, { name: "description", content: page.description }],
  }),
  component: () => <SeoTopicPage config={page} />,
});
