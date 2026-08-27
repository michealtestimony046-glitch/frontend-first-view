import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoHead } from "@/lib/seo";
import { launchGuidePages } from "../launch-guide-content";

const path = "/learn/standard-adaptive-testing";
const page = launchGuidePages[path];

export const Route = createFileRoute("/learn/standard-adaptive-testing")({
  head: () =>
    seoHead({
      title: page.title,
      description: page.description,
      path,
      breadcrumbLabel: "Standard Adaptive browser testing",
      faqItems: page.faqs,
    }),
  component: () => <SeoTopicPage config={page} />,
});
