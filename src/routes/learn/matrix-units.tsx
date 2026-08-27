import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoHead } from "@/lib/seo";
import { launchGuidePages } from "../launch-guide-content";

const path = "/learn/matrix-units";
const page = launchGuidePages[path];

export const Route = createFileRoute("/learn/matrix-units")({
  head: () =>
    seoHead({
      title: page.title,
      description: page.description,
      path,
      breadcrumbLabel: "Matrix Units",
      faqItems: page.faqs,
    }),
  component: () => <SeoTopicPage config={page} />,
});
