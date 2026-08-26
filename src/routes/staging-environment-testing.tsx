import { createFileRoute } from "@tanstack/react-router";
import { SpecialTopicPage } from "@/components/special-topic-page";
import { seoHead } from "@/lib/seo";
import { specialTopicPages } from "./special-topic-content";

const page = specialTopicPages["/staging-environment-testing"];

export const Route = createFileRoute("/staging-environment-testing")({
  head: () =>
    seoHead({
      title: "Staging Environment Testing for Safer Releases | Matrix QA",
      description: page.description,
      path: "/staging-environment-testing",
      faqItems: page.faqs,
    }),
  component: () => <SpecialTopicPage config={page} />,
});
