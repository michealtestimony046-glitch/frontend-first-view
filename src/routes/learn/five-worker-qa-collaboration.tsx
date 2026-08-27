import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoHead } from "@/lib/seo";
import { launchGuidePages } from "../launch-guide-content";

const path = "/learn/five-worker-qa-collaboration";
const page = launchGuidePages[path];

export const Route = createFileRoute("/learn/five-worker-qa-collaboration")({
  head: () =>
    seoHead({
      title: page.title,
      description: page.description,
      path,
      breadcrumbLabel: "Five-worker QA collaboration",
      faqItems: page.faqs,
    }),
  component: () => <SeoTopicPage config={page} />,
});
