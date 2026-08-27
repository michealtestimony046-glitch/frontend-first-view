import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoHead } from "@/lib/seo";
import { launchGuidePages } from "../launch-guide-content";

const path = "/learn/quick-smoke-testing";
const page = launchGuidePages[path];

export const Route = createFileRoute("/learn/quick-smoke-testing")({
  head: () =>
    seoHead({
      title: page.title,
      description: page.description,
      path,
      breadcrumbLabel: "Quick Smoke browser testing",
      faqItems: page.faqs,
    }),
  component: () => <SeoTopicPage config={page} />,
});
