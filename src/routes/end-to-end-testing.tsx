import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoHead } from "@/lib/seo";
import { seoTopicPages } from "./seo-topic-content";

const page = seoTopicPages["/end-to-end-testing"];

export const Route = createFileRoute("/end-to-end-testing")({
  head: () =>
    seoHead({
      title: page.title,
      description: page.description,
      path: "/end-to-end-testing",
    }),
  component: () => <SeoTopicPage config={page} />,
});
