import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoHead } from "@/lib/seo";
import { seoTopicPages } from "./seo-topic-content";

const page = seoTopicPages["/evidence-based-bug-reports"];

export const Route = createFileRoute("/evidence-based-bug-reports")({
  head: () =>
    seoHead({
      title: page.title,
      description: page.description,
      path: "/evidence-based-bug-reports",
      faqItems: page.faqs,
    }),
  component: () => <SeoTopicPage config={page} />,
});
