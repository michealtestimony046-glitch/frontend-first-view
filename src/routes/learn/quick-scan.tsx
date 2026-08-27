import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoHead } from "@/lib/seo";
import { launchGuidePages } from "../launch-guide-content";

const path = "/learn/quick-scan";
const page = launchGuidePages[path];

export const Route = createFileRoute("/learn/quick-scan")({
  head: () =>
    seoHead({
      title: page.title,
      description: page.description,
      path,
      breadcrumbLabel: "Quick Scan website preflight",
      faqItems: page.faqs,
    }),
  component: () => <SeoTopicPage config={page} />,
});
