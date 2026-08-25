import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoTopicPages } from "./seo-topic-content";

const page = seoTopicPages["/end-to-end-testing"];

export const Route = createFileRoute("/end-to-end-testing")({
  head: () => ({
    meta: [{ title: page.title }, { name: "description", content: page.description }],
  }),
  component: () => <SeoTopicPage config={page} />,
});
