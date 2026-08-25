import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoHead } from "@/lib/seo";
import { seoTopicPages } from "./seo-topic-content";

const page = seoTopicPages["/visual-regression-testing"];

export const Route = createFileRoute("/visual-regression-testing")({
  head: () =>
    seoHead({
      title: page.title,
      description: page.description,
      path: "/visual-regression-testing",
    }),
  component: () => <SeoTopicPage config={page} />,
});
