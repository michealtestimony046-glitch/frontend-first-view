import { createFileRoute } from "@tanstack/react-router";
import { SpecialTopicPage } from "@/components/special-topic-page";
import { seoHead } from "@/lib/seo";
import { finalFourPages } from "./final-four-content";

const page = finalFourPages["/cross-browser-testing"];

export const Route = createFileRoute("/cross-browser-testing")({
  head: () =>
    seoHead({
      title: "Cross-Browser Testing for Web Apps | Matrix QA",
      description: page.description,
      path: "/cross-browser-testing",
      faqItems: page.faqs,
    }),
  component: () => <SpecialTopicPage config={page} />,
});
