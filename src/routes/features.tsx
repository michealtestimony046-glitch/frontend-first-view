import { createFileRoute, Link } from "@tanstack/react-router";
import { SeoPageShell } from "@/components/seo-page-shell";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/features")({
  head: () =>
    seoHead({
      title: "Matrix QA Features | Evidence-Grade Web QA",
      description:
        "Explore Matrix QA features for authorized browser journeys, technical evidence, deterministic findings, and multi-tenant QA workflows.",
      path: "/features",
    }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <SeoPageShell
      eyebrow="Product / capabilities"
      title={<>The QA signal behind every deploy.</>}
      summary="Matrix QA combines an authorized browser worker, live evidence capture, runtime telemetry, deterministic filtering, and report workflows so teams can investigate real failures faster."
      intent="Built for developers, QA teams, and product owners who need reproducible release evidence."
      cards={[
        {
          title: "Browser worker",
          body: "Walk login, signup, navigation, and form journeys sequentially in a real browser.",
        },
        {
          title: "Evidence capture",
          body: "Capture screenshots, DOM state, console output, network activity, and timestamps around meaningful actions.",
        },
        {
          title: "Deterministic findings",
          body: "Filter for hard signals such as uncaught JavaScript errors, failed selectors, and non-success responses.",
        },
        {
          title: "Workspace isolation",
          body: "Keep projects, runs, reports, and evidence scoped to the correct organization and workspace.",
        },
      ]}
      steps={[
        {
          title: "Configure a project",
          body: "Add an authorized target URL, test mode, journey instructions, and any dedicated test credentials.",
        },
        {
          title: "Let the worker explore",
          body: "The worker navigates the approved flow while the platform records structured evidence and runtime events.",
        },
        {
          title: "Review the report",
          body: "Open findings with the related screenshot, console line, network request, and timestamp.",
        },
      ]}
      sections={[
        {
          title: "A full technical picture, not a screenshot dump",
          body: (
            <>
              <p>
                Each run is designed to connect what a user did with what the browser and
                application did in response. That means a finding can be investigated using the
                action sequence, page state, console stream, network request, and captured artifact
                together.
              </p>
              <p>
                Matrix QA is built for evidence-backed triage. It does not claim that one run proves
                an application is bug-free; it gives your team a clearer, more reproducible starting
                point.
              </p>
            </>
          ),
        },
        {
          title: "Safety is part of the product",
          body: (
            <>
              <p>
                Matrix QA is intended for websites and applications you own or are authorized to
                test. The workflow includes safety controls around consequential actions, and
                customers remain responsible for target authorization, test accounts, and
                instructions.
              </p>
              <p>
                Review the{" "}
                <Link className="text-primary underline underline-offset-4" to="/terms">
                  Terms of Service
                </Link>{" "}
                before your first run.
              </p>
            </>
          ),
        },
        {
          title: "Designed for an incremental rollout",
          body: (
            <>
              <p>
                Start with one project and one critical journey. Use{" "}
                <Link className="text-primary underline underline-offset-4" to="/sample-report">
                  the sample report
                </Link>{" "}
                to understand the evidence shape, then move to repeatable staging checks and release
                workflows.
              </p>
              <p>
                For product access, see{" "}
                <Link className="text-primary underline underline-offset-4" to="/pricing">
                  Preview pricing
                </Link>{" "}
                or{" "}
                <Link className="text-primary underline underline-offset-4" to="/faq">
                  common questions
                </Link>
                .
              </p>
            </>
          ),
        },
      ]}
      faqs={[
        {
          question: "What does Matrix QA test?",
          answer:
            "It is designed for authorized browser-based journeys such as login, signup, navigation, forms, and other critical user flows configured for a project.",
        },
        {
          question: "What evidence does a run produce?",
          answer:
            "Depending on the run and available storage, evidence can include screenshots, browser events, console and network observations, timestamps, logs, videos, reports, and findings.",
        },
        {
          question: "Does a report guarantee that no bugs exist?",
          answer:
            "No. Reports are evidence for the tested journey and captured signals, not a guarantee of complete defect coverage.",
        },
      ]}
      cta="Explore the console"
      variant="split"
    />
  );
}
