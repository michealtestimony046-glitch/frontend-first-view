import { createFileRoute } from "@tanstack/react-router";
import { SpecialTopicPage } from "@/components/special-topic-page";
import { seoHead } from "@/lib/seo";
import { finalFourPages } from "./final-four-content";

const page = finalFourPages["/qa-for-startups"];

export const Route = createFileRoute("/qa-for-startups")({
  head: () =>
    seoHead({
      title: "QA for Startups | Risk-Based Web Testing | Matrix QA",
      description: page.description,
      path: "/qa-for-startups",
      faqItems: page.faqs,
    }),
  component: () => <SpecialTopicPage config={page} />,
});
