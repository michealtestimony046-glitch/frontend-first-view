import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoHead } from "@/lib/seo";
import { seoTopicPages } from "./seo-topic-content";

const page = seoTopicPages["/ci-cd-testing"];

export const Route = createFileRoute("/ci-cd-testing")({
  head: () =>
    seoHead({
      title: page.title,
      description: page.description,
      path: "/ci-cd-testing",
      faqItems: page.faqs,
    }),
  component: () => <SeoTopicPage config={page} />,
});
