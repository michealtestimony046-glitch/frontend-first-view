import { createFileRoute } from "@tanstack/react-router";
import { SpecialTopicPage } from "@/components/special-topic-page";
import { seoHead } from "@/lib/seo";
import { finalFourPages } from "./final-four-content";

const page = finalFourPages["/qa-for-saas"];

export const Route = createFileRoute("/qa-for-saas")({
  head: () =>
    seoHead({
      title: "QA for SaaS Products | Tenants, Roles, and Evidence | Matrix QA",
      description: page.description,
      path: "/qa-for-saas",
    }),
  component: () => <SpecialTopicPage config={page} />,
});
