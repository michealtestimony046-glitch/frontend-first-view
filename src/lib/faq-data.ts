export type FaqEntry = {
  q: string;
  a: string;
};

export const FAQS: FaqEntry[] = [
  {
    q: "Is Preview really free?",
    a: "Yes. Matrix QA is free during v1 Public Preview. No credit card, no checkout, no trial expiry. We're validating the Core Engine with early developers.",
  },
  {
    q: "Why call it Preview instead of a free trial?",
    a: "A trial implies a finished product you're evaluating. Matrix QA v1 is the Core Engine — you're joining an evolving product, closer to early access than a polished SaaS free tier.",
  },
  {
    q: "What happens when v2 ships?",
    a: "The Preview card retires and Starter launches. We'll keep a limited free tier so you can continue running scans; existing Preview workspaces get notice and a grace period before quota rules change.",
  },
  {
    q: "Are there usage limits today?",
    a: "Private-alpha workspaces receive a visible Matrix Unit allocation. The Credits page shows what is available, what has been reserved, and when the current allowance resets.",
  },
  {
    q: "What does Matrix QA actually do in v1?",
    a: "It walks your critical user journeys — login, signup, navigation, forms — and streams screenshots, console logs, network activity, and timestamps into an evidence-grade report. Only hard failures are surfaced in the primary issue stream.",
  },
  {
    q: "How do I request more alpha allocation?",
    a: "Open the Credits page in your workspace and choose Request more alpha allocation. Your request is tracked and routed to the Matrix QA staff team for review; you do not need to find a private email address.",
  },
  {
    q: "Do you store the test data or credentials I use?",
    a: "Every run and every piece of evidence is isolated behind strict workspace guards. Credentials you enter for a scan are used to drive the browser worker and are not shared across workspaces.",
  },
  {
    q: "Is there an API, CLI, or GitHub integration?",
    a: "Not in the first web-console release. CLI, GitHub, and broader AI integrations are planned as later releases while the browser worker and evidence loop are stabilized.",
  },
];
