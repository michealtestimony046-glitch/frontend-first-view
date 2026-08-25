import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoHead } from "@/lib/seo";
import { seoTopicPages } from "./seo-topic-content";

const page = seoTopicPages["/accessibility-testing"];

export const Route = createFileRoute("/accessibility-testing")({
  head: () =>
    seoHead({
      title: page.title,
      description: page.description,
      path: "/accessibility-testing",
    }),
  component: () => <SeoTopicPage config={page} />,
});
