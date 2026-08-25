import { createFileRoute, Link } from "@tanstack/react-router";
import { SeoPageShell } from "@/components/seo-page-shell";

export const Route = createFileRoute("/automated-browser-testing")({
  head: () => ({
    meta: [
      { title: "Automated Browser Testing for Web Apps | Matrix QA" },
      {
        name: "description",
        content:
          "Automate critical browser journeys with Matrix QA. Capture screenshots, console errors, network failures, timestamps, and evidence-backed findings.",
      },
    ],
  }),
  component: AutomatedBrowserTestingPage,
});

function AutomatedBrowserTestingPage() {
  return (
    <SeoPageShell
      eyebrow="Category / browser QA"
      title={<>Automated browser testing with proof attached.</>}
      summary="Matrix QA runs authorized web journeys in a real browser and turns the result into structured evidence: screenshots, console signals, network activity, timestamps, and findings your team can investigate."
      intent="For teams that need more than a green check or a screenshot in a folder."
      cards={[
        {
          title: "Critical-path coverage",
          body: "Exercise journeys such as login, signup, navigation, forms, and other project-defined browser flows.",
        },
        {
          title: "Runtime signals",
          body: "Capture uncaught JavaScript errors, failed selectors, non-success responses, and browser-side events.",
        },
        {
          title: "Evidence-grade output",
          body: "Tie a finding to the observed action, page state, console line, request, timestamp, and artifact when available.",
        },
        {
          title: "Developer-ready context",
          body: "Give engineers a reproducible account of what the worker did and what the application returned.",
        },
      ]}
      steps={[
        {
          title: "Choose an authorized URL",
          body: "Point a project at a staging or production target that you own or have permission to test.",
        },
        {
          title: "Configure a browser journey",
          body: "Add the mode, mission instructions, and safe dedicated test credentials needed for the flow.",
        },
        {
          title: "Investigate the evidence",
          body: "Review the run report and follow each finding back to the captured browser and application signals.",
        },
      ]}
      sections={[
        {
          title: "What automated browser testing means here",
          body: (
            <>
              <p>
                Automated browser testing validates an application through the interface a real user
                would use. Matrix QA is focused on sequential, critical-path journeys rather than
                isolated function calls: open the target, move through the flow, observe the result,
                and preserve the evidence.
              </p>
              <p>
                That makes it useful for catching integration failures that only appear when the
                browser, frontend, backend, and third-party services work together.
              </p>
            </>
          ),
        },
        {
          title: "Signals that help explain a failure",
          body: (
            <>
              <p>
                A failed journey is more useful when the report shows what happened around it.
                Matrix QA can capture screenshots, page URLs, console messages, network requests,
                response status, timing, logs, browser events, and videos or other artifacts when
                available.
              </p>
              <p>
                See the{" "}
                <Link className="text-primary underline underline-offset-4" to="/sample-report">
                  sample report
                </Link>{" "}
                to understand how evidence can support the investigation.
              </p>
            </>
          ),
        },
        {
          title: "Browser automation without unsafe surprises",
          body: (
            <>
              <p>
                Automation must be authorized and bounded. Use dedicated test accounts, avoid real
                payment or destructive flows, and configure only actions you are allowed to perform.
                Matrix QA is not an authorization bypass or a license to probe somebody else’s
                application.
              </p>
              <p>
                Read the{" "}
                <Link className="text-primary underline underline-offset-4" to="/terms">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link className="text-primary underline underline-offset-4" to="/privacy">
                  Privacy Policy
                </Link>{" "}
                before running tests with sensitive data.
              </p>
            </>
          ),
        },
        {
          title: "How it complements your existing tests",
          body: (
            <>
              <p>
                Browser journeys complement unit and integration tests by validating a user-visible
                flow in a deployed environment. Start manually, learn which journeys matter, then
                connect repeatable checks to your release process as your coverage grows.
              </p>
              <p>
                For the product overview, visit{" "}
                <Link className="text-primary underline underline-offset-4" to="/features">
                  Matrix QA features
                </Link>{" "}
                or start with the{" "}
                <Link className="text-primary underline underline-offset-4" to="/sample-report">
                  sample report
                </Link>
                .
              </p>
            </>
          ),
        },
      ]}
      faqs={[
        {
          question: "Does Matrix QA replace Playwright or Cypress?",
          answer:
            "No. Matrix QA is a hosted browser-QA workflow focused on configured journeys, evidence capture, and findings. Teams may use it alongside their existing browser test frameworks.",
        },
        {
          question: "Can it test authenticated web apps?",
          answer:
            "Yes, where the project has an authorized target and a dedicated test account or supported authentication setup. Never provide credentials for a system you are not permitted to test.",
        },
        {
          question: "What is the difference between browser testing and API testing?",
          answer:
            "Browser testing validates the user-visible journey through the interface and observes the integrated application behavior. API testing focuses on direct service requests. Matrix QA’s core workflow is browser-first.",
        },
      ]}
      cta="Run a browser check"
      variant="terminal"
    />
  );
}
