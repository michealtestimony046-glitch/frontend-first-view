import { createFileRoute } from "@tanstack/react-router";
import { SeoTopicPage } from "@/components/seo-topic-page";
import { seoHead } from "@/lib/seo";
import { launchGuidePages } from "../launch-guide-content";

const path = "/learn/matrix-unit-top-ups";
const page = launchGuidePages[path];

export const Route = createFileRoute("/learn/matrix-unit-top-ups")({
  head: () =>
    seoHead({
      title: page.title,
      description: page.description,
      path,
      breadcrumbLabel: "Matrix Unit top-ups",
      faqItems: page.faqs,
    }),
  component: () => <SeoTopicPage config={page} />,
});
