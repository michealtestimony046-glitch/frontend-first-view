import type { ReactNode } from "react";
import { SeoPageShell } from "@/components/seo-page-shell";

type TopicSection = { title: string; body: ReactNode };

export type SeoTopicPageConfig = {
  title: string;
  description: string;
  eyebrow: string;
  hero: ReactNode;
  summary: string;
  intent: string;
  cards: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  sections: TopicSection[];
  faqs: { question: string; answer: string }[];
  cta: string;
};

export function SeoTopicPage({ config }: { config: SeoTopicPageConfig }) {
  return (
    <SeoPageShell
      eyebrow={config.eyebrow}
      title={config.hero}
      summary={config.summary}
      intent={config.intent}
      cards={config.cards}
      steps={config.steps}
      sections={config.sections}
      faqs={config.faqs}
      cta={config.cta}
    />
  );
}
