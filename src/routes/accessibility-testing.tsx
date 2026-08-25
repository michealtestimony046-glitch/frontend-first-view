import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoTopicPages } from "./seo-topic-content";

const page = seoTopicPages["/accessibility-testing"];

export const Route = createFileRoute("/accessibility-testing")({
  head: () => ({
    meta: [{ title: page.title }, { name: "description", content: page.description }],
  }),
  component: () => <SeoTopicPage config={page} />,
});
