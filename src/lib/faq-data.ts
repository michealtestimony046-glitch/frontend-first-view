export type FaqEntry = {
  q: string;
  a: string;
};

export const FAQS: FaqEntry[] = [
  {
    q: "Is there a free Matrix QA plan?",
    a: "Yes. Matrix QA has a Free plan with 150 Matrix Units each month, Quick Scan-oriented preflight, Quick Smoke browser testing, one logical worker, basic evidence, and 90-day retention.",
  },
  {
    q: "What does Starter unlock?",
    a: "Starter is $49 per month with 980 Matrix Units, Quick Smoke, Standard Adaptive multi-viewport testing, and governed collaboration with up to five logical worker slots. Actual browser concurrency remains subject to run policy and available infrastructure.",
  },
  {
    q: "How does Matrix QA charge for a run?",
    a: "Matrix QA reserves a bounded amount before execution, then meters authoritative work as it is observed. Unused reserve is released during settlement, and qualifying infrastructure failures receive correction treatment.",
  },
  {
    q: "What are the current usage limits?",
    a: "Plans define Matrix Unit allowances, worker capacity, supported run modes, and retention. The current Free and Starter boundaries are shown on the Pricing page, while actual execution remains subject to run policy and available infrastructure.",
  },
  {
    q: "What does Matrix QA do?",
    a: "It walks authorized critical user journeys such as login, signup, navigation, and forms, then organizes screenshots, console signals, network activity, timestamps, reports, and findings for human investigation. Only hard failures are surfaced in the primary issue stream.",
  },
  {
    q: "How do I request more capacity?",
    a: "Open the Test capacity page in your workspace and choose the request form. Your request is tracked and routed to the Matrix QA staff team for review; you do not need to find a private email address.",
  },
  {
    q: "Do you store the test data or credentials I use?",
    a: "Every run and every piece of evidence is isolated behind strict workspace guards. Credentials you enter for a scan are used to drive the browser worker and are not shared across workspaces.",
  },
  {
    q: "Is there an API, CLI, or GitHub integration?",
    a: "Not in the current web-console release. CLI, GitHub, and broader integrations are planned as later releases while the browser worker, evidence loop, and workspace controls continue to mature.",
  },
];
