import { createFileRoute, Link } from "@tanstack/react-router";
import { SeoPageShell } from "@/components/seo-page-shell";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Matrix QA Works | Browser QA with Evidence" },
      {
        name: "description",
        content:
          "See how Matrix QA turns one authorized web URL into a browser-run journey, captured diagnostics, and evidence-backed QA findings.",
      },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <SeoPageShell
      eyebrow="Product / workflow"
      title={<>Three steps. One evidence-backed report.</>}
      summary="Give Matrix QA an authorized URL and a critical journey. The browser worker walks it, the evidence layer records it, and your team gets a report built for investigation."
      intent="A practical guide to the Matrix QA run lifecycle."
      cards={[
        {
          title: "1. Define the journey",
          body: "Choose the project, target URL, mode, instructions, and dedicated test credentials.",
        },
        {
          title: "2. Capture the run",
          body: "The worker navigates the flow while browser state, timestamps, console, and network events are recorded.",
        },
        {
          title: "3. Triage the signal",
          body: "Findings connect observed failures to the evidence needed for a reproducible engineering decision.",
        },
        {
          title: "Safe by default",
          body: "Only run against systems you own or are authorized to test, with explicit controls around consequential actions.",
        },
      ]}
      steps={[
        {
          title: "Enter an authorized target",
          body: "Create a project and provide the URL and journey context. Matrix QA is intended for staging or production systems where you have permission to test.",
        },
        {
          title: "Let a real browser walk it",
          body: "A queued run is admitted to a worker, which follows the configured journey and records structured evidence at meaningful state changes.",
        },
        {
          title: "Review what happened",
          body: "Open the run, inspect its findings and evidence, and use the report to decide what needs attention before release.",
        },
      ]}
      sections={[
        {
          title: "Before the worker starts",
          body: (
            <>
              <p>
                Each run is associated with a workspace and project. The run can carry a target URL,
                mode, mission instructions, and optional encrypted test credentials. This lets teams
                keep a repeatable, authorized test context instead of pasting sensitive material
                into a prompt.
              </p>
              <p>
                For a first look at the output, visit the{" "}
                <Link className="text-primary underline underline-offset-4" to="/sample-report">
                  sample report
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          title: "During the browser journey",
          body: (
            <>
              <p>
                The worker performs sequential browser actions such as navigating, clicking, filling
                forms, and checking the resulting state. The platform records events around the
                journey, including screenshots, page URLs, console messages, network activity,
                timings, and errors when available.
              </p>
              <p>
                Runs may be queued, admitted, completed, blocked, failed, or otherwise stopped by
                the system. A run result should always be read in the context of the journey and
                environment that produced it.
              </p>
            </>
          ),
        },
        {
          title: "After the run",
          body: (
            <>
              <p>
                Evidence is processed into a report with findings tied to observable signals. A
                useful finding should help an engineer reproduce or investigate the issue rather
                than simply announce that a page looked different.
              </p>
              <p>
                Matrix QA is not a replacement for unit tests, integration tests, security review,
                or accessibility expertise. It is an additional browser-level signal for critical
                user journeys.
              </p>
            </>
          ),
        },
        {
          title: "Where it fits in your release process",
          body: (
            <>
              <p>
                Teams can start manually, then connect repeatable checks to staging and deployment
                workflows. Read about{" "}
                <Link
                  className="text-primary underline underline-offset-4"
                  to="/automated-browser-testing"
                >
                  automated browser testing
                </Link>{" "}
                for the underlying category, or use the{" "}
                <Link className="text-primary underline underline-offset-4" to="/faq">
                  FAQ
                </Link>{" "}
                for common product questions.
              </p>
            </>
          ),
        },
      ]}
      faqs={[
        {
          question: "What do I need to start a run?",
          answer:
            "You need an account, a project, an authorized target URL, and journey instructions. A dedicated test account can be supplied when the target requires authentication.",
        },
        {
          question: "Can Matrix QA make a purchase or booking?",
          answer:
            "Do not configure a run to submit payments, make bookings, delete data, change permissions, or send communications unless you have explicit authorization and the workflow is intentionally controlled.",
        },
        {
          question: "How quickly do I get a report?",
          answer:
            "Timing depends on queue capacity, the target application, journey length, provider availability, and evidence processing. The run lifecycle records status and timestamps for the actual execution.",
        },
      ]}
      cta="Start a test run"
    />
  );
}
