import { Link } from "@tanstack/react-router";
import type { SeoTopicPageConfig } from "@/components/seo-topic-page";

const linkClass = "text-primary underline underline-offset-4";
const link = (to: string, label: string) => (
  <Link className={linkClass} to={to}>
    {label}
  </Link>
);

export const seoTopicPages: Record<string, SeoTopicPageConfig> = {
  "/end-to-end-testing": {
    title: "End-to-End Testing for Real Web Journeys | Matrix QA",
    description:
      "Learn how Matrix QA validates authorized web journeys across the browser, frontend, backend, and integrated services with evidence-backed reports.",
    eyebrow: "Testing method / E2E",
    variant: "editorial",
    hero: <>End-to-end testing for the journeys users actually take.</>,
    summary:
      "Matrix QA exercises an authorized web flow from start to finish in a real browser, then preserves the runtime evidence your team needs to investigate what happened.",
    intent: "For teams validating a complete path instead of one isolated function.",
    cards: [
      {
        title: "Complete journey coverage",
        body: "Follow configured paths such as signing in, navigating, submitting a form, or reaching a result page.",
      },
      {
        title: "Cross-layer signals",
        body: "Connect browser actions with page state, console messages, network responses, and timestamps.",
      },
      {
        title: "Environment-aware results",
        body: "Read each outcome in the context of the target URL, test account, run mode, queue, and available artifacts.",
      },
      {
        title: "A complement to code tests",
        body: "Add browser-level confidence alongside unit, API, integration, and framework-owned tests.",
      },
    ],
    steps: [
      {
        title: "Choose one critical path",
        body: "Start with a user journey where a failure would matter to a release or customer.",
      },
      {
        title: "Run it in an authorized browser",
        body: "Provide the target, instructions, mode, and dedicated test credentials when authentication is required.",
      },
      {
        title: "Trace the outcome",
        body: "Review the report and evidence to distinguish a product defect from a target, environment, or configuration issue.",
      },
    ],
    sections: [
      {
        title: "What end-to-end testing checks",
        body: (
          <>
            <p>
              End-to-end testing checks whether a complete user-visible workflow works across the
              parts that support it. A login journey, for example, may involve the browser, frontend
              form, authentication endpoint, session state, redirects, and protected page.
            </p>
            <p>
              Matrix QA is designed for these sequential browser journeys. It does not claim that
              one run covers every branch or proves that an application is defect-free.
            </p>
          </>
        ),
      },
      {
        title: "When E2E testing is most valuable",
        body: (
          <>
            <p>
              Use an end-to-end check for high-value paths that cross integration boundaries:
              onboarding, authentication, search, forms, navigation, or a core workflow. Keep
              lower-level logic covered by faster unit and integration tests.
            </p>
            <p>
              See {link("/how-it-works", "how Matrix QA works")} for the run lifecycle and{" "}
              {link("/features", "the features overview")} for the evidence model.
            </p>
          </>
        ),
      },
      {
        title: "Keep the test safe and reproducible",
        body: (
          <>
            <p>
              Use staging where possible, create dedicated test users, avoid real payments and
              destructive actions, and make the target and expected outcome explicit. Only test
              systems you own or are authorized to assess.
            </p>
            <p>Review the {link("/terms", "Terms of Service")} before connecting a target.</p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "What is the difference between E2E and integration testing?",
        answer:
          "Integration tests usually verify selected components or services working together. End-to-end tests exercise a complete user-visible workflow across the deployed system and its integrations.",
      },
      {
        question: "Can Matrix QA cover every possible user path?",
        answer:
          "No. Coverage depends on the configured mission, target, mode, and run outcome. Start with representative critical paths and expand deliberately.",
      },
      {
        question: "Does an E2E report replace developer tests?",
        answer:
          "No. Browser-level checks are complementary. Unit, integration, API, security, and accessibility testing still provide different kinds of coverage.",
      },
    ],
    cta: "Start an E2E check",
  },
  "/ci-cd-testing": {
    title: "CI/CD Testing for Safer Web Releases | Matrix QA",
    description:
      "Use Matrix QA as a browser-level signal for staging and release workflows. Learn how to place end-to-end checks in a layered CI/CD testing strategy.",
    eyebrow: "Delivery / release QA",
    variant: "split",
    hero: <>Put browser evidence closer to every release.</>,
    summary:
      "Matrix QA helps teams validate authorized web journeys against a deployed environment, so release decisions can include observed browser behavior instead of build status alone.",
    intent: "For engineering teams adding practical UI confidence to a layered delivery process.",
    cards: [
      {
        title: "Layered test strategy",
        body: "Use browser checks after faster unit, API, and integration coverage rather than forcing every assertion through the UI.",
      },
      {
        title: "Staging-first validation",
        body: "Point a project at an authorized deployment and exercise the critical flow that matters for the release.",
      },
      {
        title: "Evidence for triage",
        body: "Give the team screenshots, console and network observations, timestamps, and findings when available.",
      },
      {
        title: "Honest release signals",
        body: "Treat a run result as evidence about the tested journey and environment, not a universal deployment guarantee.",
      },
    ],
    steps: [
      {
        title: "Define the release gate",
        body: "Choose the one or two browser journeys whose failure should stop investigation before release.",
      },
      {
        title: "Run against the right environment",
        body: "Use a stable staging or preview URL, safe test data, and a repeatable mission instruction.",
      },
      {
        title: "Review before promotion",
        body: "Inspect the outcome and artifacts, then decide whether the evidence supports the next release step.",
      },
    ],
    sections: [
      {
        title: "Where browser checks fit in CI/CD",
        body: (
          <>
            <p>
              CI/CD testing is strongest when it is layered. Fast checks provide quick feedback,
              while a smaller set of browser journeys validates that the deployed frontend, backend,
              authentication, and integrations work together.
            </p>
            <p>
              Matrix QA can provide that browser-level signal. This page does not promise a native
              plug-in, webhook, or automatic pipeline gate unless your current product configuration
              explicitly provides one.
            </p>
          </>
        ),
      },
      {
        title: "A practical release workflow",
        body: (
          <>
            <p>
              Start by running a critical staging journey after a deployment. Review the run status,
              findings, and evidence. Once the journey is stable and the team understands the result
              states, document how it should inform release approval.
            </p>
            <p>
              Pair this page with {link("/end-to-end-testing", "end-to-end testing concepts")} and{" "}
              {link("/sample-report", "the sample report")} before designing a larger check set.
            </p>
          </>
        ),
      },
      {
        title: "Avoid noisy pipeline checks",
        body: (
          <>
            <p>
              Browser checks can be slower and more environment-sensitive than unit tests. Keep
              journeys narrow, use deterministic data, avoid third-party volatility where possible,
              and investigate timeouts instead of blindly retrying them.
            </p>
            <p>
              For the product lifecycle, read{" "}
              {link("/how-it-works", "how a run moves from URL to report")}.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Does Matrix QA automatically block my deployment?",
        answer:
          "The current public page describes browser execution and reporting. Do not assume an automatic deployment block or native CI provider integration unless it is enabled in your workspace.",
      },
      {
        question: "Should I run browser tests on every commit?",
        answer:
          "Usually, teams balance fast lower-level checks on every change with a focused browser suite at a useful deployment or preview stage. Choose the cadence that matches your target stability and release risk.",
      },
      {
        question: "What should a CI browser check include?",
        answer:
          "Use a short critical path, explicit expected outcomes, safe test data, a stable environment, and a clear owner for reviewing failures.",
      },
    ],
    cta: "Plan a release check",
  },
  "/visual-regression-testing": {
    title: "Visual Regression Testing with Browser Evidence | Matrix QA",
    description:
      "Understand visual regression testing, screenshot baselines, and environment limits. Matrix QA captures browser evidence to help investigate visible UI changes.",
    eyebrow: "UI quality / visual checks",
    variant: "terminal",
    hero: <>See the UI change. Keep the context.</>,
    summary:
      "Matrix QA captures screenshots and browser state around authorized journeys, helping teams investigate visible changes alongside console, network, and timing evidence.",
    intent:
      "For teams who need to understand a visual change rather than treat every pixel difference as a bug.",
    cards: [
      {
        title: "Screenshot evidence",
        body: "Preserve visual state at meaningful points in a browser journey when artifacts are available.",
      },
      {
        title: "Change context",
        body: "Pair what the page looked like with the action, URL, runtime signals, and timing around it.",
      },
      {
        title: "Baseline discipline",
        body: "A trustworthy visual comparison needs an approved reference, stable data, and a consistent rendering environment.",
      },
      {
        title: "Human review matters",
        body: "A difference can be intentional, content-driven, or environment-specific; evidence supports the decision rather than making it for you.",
      },
    ],
    steps: [
      {
        title: "Choose a stable state",
        body: "Select the page and interaction state that represents a meaningful product promise.",
      },
      {
        title: "Capture the journey",
        body: "Run the authorized flow with controlled data and inspect the screenshots and surrounding signals.",
      },
      {
        title: "Classify the change",
        body: "Decide whether the visual difference is an intended update, a regression, or a test-environment variation.",
      },
    ],
    sections: [
      {
        title: "What visual regression testing means",
        body: (
          <>
            <p>
              Visual regression testing compares a current rendering with an approved reference so
              unintended UI changes can be investigated. Reliable comparisons depend on consistent
              browser, operating system, fonts, viewport, data, and timing; rendering can vary
              across environments.
            </p>
            <p>
              Matrix QA’s current workflow captures browser screenshots and related evidence. Do not
              read this page as a claim that every run performs pixel-diff baseline comparison.
            </p>
          </>
        ),
      },
      {
        title: "Use screenshots with technical signals",
        body: (
          <>
            <p>
              A screenshot shows the visible symptom, but the cause may be a failed request, console
              exception, missing asset, changed route, or delayed state. Review the full evidence
              set rather than approving or rejecting a change from a single image.
            </p>
            <p>
              See {link("/features", "Matrix QA features")} and{" "}
              {link("/sample-report", "the sample report")} for the evidence workflow.
            </p>
          </>
        ),
      },
      {
        title: "Design stable visual checks",
        body: (
          <>
            <p>
              Prefer deterministic fixtures, fixed viewport sizes, stable content, and an explicit
              approval process for baseline updates. Record why an intentional design change is
              accepted so future reviewers have context.
            </p>
            <p>
              Use {link("/how-it-works", "the run lifecycle")} to understand how the browser journey
              is recorded.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Is every screenshot difference a regression?",
        answer:
          "No. Content, fonts, viewport, browser version, timing, and intentional design changes can all alter a screenshot. Review the environment and product intent.",
      },
      {
        question: "Does Matrix QA provide pixel-perfect screenshot diffs?",
        answer:
          "The current workflow captures screenshots and supporting browser evidence. Do not assume a dedicated baseline diff engine unless your workspace explicitly exposes that capability.",
      },
      {
        question: "What makes a visual test reliable?",
        answer:
          "Use a stable rendering environment, deterministic content, a meaningful checkpoint, an approved reference, and a human review process for changes.",
      },
    ],
    cta: "Inspect visual evidence",
  },
  "/evidence-based-bug-reports": {
    title: "Evidence-Based Bug Reports for Faster Triage | Matrix QA",
    description:
      "Create reproducible, evidence-based bug reports with steps, expected and actual results, screenshots, console signals, network context, and timestamps.",
    eyebrow: "Reporting / reproducibility",
    variant: "editorial",
    hero: <>A bug report should show what happened, not just say “broken.”</>,
    summary:
      "Matrix QA connects a browser journey to structured findings and captured evidence, helping engineers move from an observed failure to a reproducible investigation.",
    intent: "For QA and product teams turning browser observations into developer-ready reports.",
    cards: [
      {
        title: "Reproduction context",
        body: "Record the target, journey, mode, page state, and action that preceded the observed issue.",
      },
      {
        title: "Expected vs actual",
        body: "Describe the product behavior that should have occurred and what the browser actually returned.",
      },
      {
        title: "Technical evidence",
        body: "Use screenshots, console messages, network responses, timestamps, logs, and artifacts when available.",
      },
      {
        title: "Prioritized findings",
        body: "Give teams a clear signal to investigate, without confusing one run with complete defect coverage.",
      },
    ],
    steps: [
      {
        title: "Observe the failure",
        body: "Run an authorized journey and capture the state where the behavior differs from the expected result.",
      },
      {
        title: "Connect the evidence",
        body: "Relate the finding to the action sequence, URL, screenshot, console line, request, and timestamp.",
      },
      {
        title: "Make the next step clear",
        body: "Explain how to reproduce or investigate the issue and what decision the team needs to make.",
      },
    ],
    sections: [
      {
        title: "The anatomy of an actionable report",
        body: (
          <>
            <p>
              A useful bug report contains a concise title, affected context, numbered reproduction
              steps, expected result, actual result, severity or impact, and supporting evidence.
              The goal is to reduce the distance between discovery and engineering action.
            </p>
            <p>
              Matrix QA structures findings around observed browser behavior. It should supplement,
              not replace, the team’s issue tracker and verification process.
            </p>
          </>
        ),
      },
      {
        title: "Why evidence beats a vague screenshot",
        body: (
          <>
            <p>
              A screenshot can establish what was visible, but a console error or failed network
              response may explain why. Combining visual and runtime evidence lets a reviewer test
              competing hypotheses faster.
            </p>
            <p>
              See {link("/sample-report", "the sample report")} for the shape of a report and{" "}
              {link("/features", "the feature overview")} for available evidence categories.
            </p>
          </>
        ),
      },
      {
        title: "Be precise without overstating certainty",
        body: (
          <>
            <p>
              Separate confirmed observations from suspected causes. Say what the run captured, what
              was not captured, and what still needs reproduction. This keeps a report credible when
              the target or environment changes.
            </p>
            <p>
              Read {link("/how-it-works", "how Matrix QA records a journey")} before defining your
              reporting standard.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "What should every bug report include?",
        answer:
          "Include a clear title, context, steps to reproduce, expected and actual behavior, impact, environment, and the evidence needed to verify the observation.",
      },
      {
        question: "Can a screenshot prove the root cause?",
        answer:
          "Usually not by itself. A screenshot proves a visible state; console, network, logs, and reproduction steps can provide additional context for the cause.",
      },
      {
        question: "Does Matrix QA automatically create tickets?",
        answer:
          "The public workflow focuses on runs, reports, evidence, and findings. Do not assume a tracker integration unless it is enabled in your workspace.",
      },
    ],
    cta: "Review a sample report",
  },
  "/authentication-testing": {
    title: "Authentication Testing for Login and Sessions | Matrix QA",
    description:
      "Test authorized login, signup, password reset, redirects, and protected web journeys with Matrix QA browser evidence and safe test accounts.",
    eyebrow: "Identity / functional QA",
    variant: "split",
    hero: <>Test the sign-in path before users find the edge case.</>,
    summary:
      "Matrix QA can exercise authorized authentication journeys in a real browser, from login and signup to protected routes and reset flows, while preserving evidence for triage.",
    intent:
      "For teams validating authentication behavior without confusing functional QA with a security audit.",
    cards: [
      {
        title: "Login and signup flows",
        body: "Check the visible form, validation, submit behavior, redirects, and resulting authenticated state.",
      },
      {
        title: "Protected-route coverage",
        body: "Confirm that an authorized test user reaches the expected page and that signed-out states behave as intended.",
      },
      {
        title: "Reset and recovery",
        body: "Exercise password-reset or email-verification journeys where the target and test mailbox are configured safely.",
      },
      {
        title: "Security boundary",
        body: "Functional browser checks do not replace penetration testing, threat modeling, or an independent security review.",
      },
    ],
    steps: [
      {
        title: "Create a dedicated test identity",
        body: "Use a non-production account and controlled data; never share credentials for systems you do not own or have permission to test.",
      },
      {
        title: "Walk the auth journey",
        body: "Configure the expected login, signup, reset, redirect, or protected-route sequence.",
      },
      {
        title: "Review state and evidence",
        body: "Inspect the resulting URL, page state, errors, requests, screenshots, and timestamps without exposing secrets in reports.",
      },
    ],
    sections: [
      {
        title: "What functional authentication testing covers",
        body: (
          <>
            <p>
              Functional authentication testing checks whether an intended user can complete a
              documented identity journey: submit valid credentials, see the correct validation for
              invalid input, receive the right redirect, and access the expected protected state.
            </p>
            <p>
              It is different from testing whether an attacker can bypass authentication. Matrix QA
              should not be presented as a penetration test or authorization assessment.
            </p>
          </>
        ),
      },
      {
        title: "Use safe credentials and controlled states",
        body: (
          <>
            <p>
              Use dedicated test users, non-sensitive fixtures, and a staging environment when
              possible. Avoid placing passwords, tokens, recovery links, or personal data into
              mission text or screenshots. Review {link("/privacy", "the Privacy Policy")} and{" "}
              {link("/terms", "Terms of Service")} before testing authenticated targets.
            </p>
          </>
        ),
      },
      {
        title: "Review the whole path",
        body: (
          <>
            <p>
              Authentication bugs often appear between pages: a form submits but redirects
              incorrectly, a session is not retained, a protected route flashes, or a reset link
              lands in the wrong state. Capture the sequence, not just the login page.
            </p>
            <p>
              Pair this page with {link("/end-to-end-testing", "end-to-end testing")} and{" "}
              {link("/how-it-works", "the Matrix QA workflow")}.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Is authentication testing the same as penetration testing?",
        answer:
          "No. This page describes authorized functional browser journeys. Penetration testing and security assessments require separate scope, methods, expertise, and authorization.",
      },
      {
        question: "Can I use a real customer account?",
        answer:
          "No. Use a dedicated test account and controlled data. Do not expose customer credentials or personal information to an automated run.",
      },
      {
        question: "What authentication flows can be checked?",
        answer:
          "Depending on the target and configuration, teams can check login, signup, validation, redirects, protected routes, email verification, and password recovery journeys.",
      },
    ],
    cta: "Test an auth journey",
  },
  "/accessibility-testing": {
    title: "Accessibility Testing for Web Applications | Matrix QA",
    description:
      "Learn how browser journeys can support web accessibility testing through keyboard-aware workflows, form checks, visible evidence, and careful manual review.",
    eyebrow: "Inclusive UX / accessibility",
    variant: "terminal",
    hero: <>Make accessibility part of the journey, not a late checklist.</>,
    summary:
      "Matrix QA helps teams observe accessibility-relevant behavior during authorized browser journeys, while making clear that automated evidence complements—not replaces—manual and assistive-technology review.",
    intent: "For teams building a practical accessibility testing loop around real user flows.",
    cards: [
      {
        title: "Journey-level checks",
        body: "Inspect login, navigation, forms, dialogs, errors, and other interactive states in the browser.",
      },
      {
        title: "Keyboard-aware review",
        body: "Use keyboard navigation as a deliberate test dimension and record where focus or interaction becomes difficult.",
      },
      {
        title: "Evidence for fixes",
        body: "Pair a visible state with the URL, action, screenshot, console signal, and timing needed for follow-up.",
      },
      {
        title: "Honest coverage limits",
        body: "Automated checks can find some issues; they cannot establish complete WCAG conformance or replace disabled-user testing.",
      },
    ],
    steps: [
      {
        title: "Select an important journey",
        body: "Choose a flow with forms, navigation, errors, dialogs, or other interaction states used by real people.",
      },
      {
        title: "Test the interaction",
        body: "Observe labels, focus order, keyboard access, feedback, contrast, and responsive behavior within the authorized journey.",
      },
      {
        title: "Combine signals and review",
        body: "Use browser evidence as input to manual inspection, assistive-technology testing, and remediation.",
      },
    ],
    sections: [
      {
        title: "What automated accessibility testing can and cannot do",
        body: (
          <>
            <p>
              Automated evaluation can surface common issues such as missing labels, invalid
              properties, or some contrast and structure problems. It cannot reliably judge every
              question of meaning, task completion, focus usability, error clarity, or compatibility
              with assistive technology.
            </p>
            <p>
              For that reason, Matrix QA should be used as one signal in an accessibility program,
              not as a certificate of WCAG compliance.
            </p>
          </>
        ),
      },
      {
        title: "Test the states people experience",
        body: (
          <>
            <p>
              Many accessibility problems are state-specific: a validation message is not announced,
              a modal traps or loses focus, a menu cannot be reached by keyboard, or an error
              appears far from the field it describes. A journey-based review can expose these
              transitions better than a static page scan.
            </p>
            <p>
              See {link("/automated-browser-testing", "automated browser testing")} and{" "}
              {link("/how-it-works", "how a journey is recorded")} for the execution model.
            </p>
          </>
        ),
      },
      {
        title: "Build a complete evaluation loop",
        body: (
          <>
            <p>
              Combine automated checks with keyboard-only testing, screen-reader review, content
              inspection, responsive checks, and feedback from disabled users. Record the observed
              barrier, affected task, expected experience, and evidence for the fix.
            </p>
            <p>
              Use {link("/evidence-based-bug-reports", "evidence-based bug reports")} to structure
              the handoff.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Does an automated check prove WCAG compliance?",
        answer:
          "No. Automated checks cover only some accessibility requirements. Complete evaluation needs manual, assistive-technology, content, and user-centered review.",
      },
      {
        question: "What should I test with a keyboard?",
        answer:
          "Move through interactive controls, menus, dialogs, forms, validation messages, and focus changes without a mouse. Record any unreachable control, confusing order, or lost focus.",
      },
      {
        question: "Can Matrix QA replace an accessibility specialist?",
        answer:
          "No. Matrix QA can help capture repeatable browser evidence, while specialists and disabled users provide essential context and evaluation depth.",
      },
    ],
    cta: "Plan an accessibility check",
  },
};
