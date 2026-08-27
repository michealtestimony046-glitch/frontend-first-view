import type { SpecialTopicPageConfig } from "@/components/special-topic-page";

export const specialTopicPages: Record<string, SpecialTopicPageConfig> = {
  "/javascript-error-monitoring": {
    path: "/javascript-error-monitoring",
    variant: "observatory",
    eyebrow: "Runtime signal / browser diagnostics",
    title: "Find the JavaScript failure inside the journey.",
    description:
      "Learn how Matrix QA helps investigate uncaught JavaScript errors and browser runtime failures with screenshots, console signals, network context, actions, and timestamps.",
    summary:
      "JavaScript error monitoring is only useful when an error can be connected to what a user did, what the page showed, and what the application returned. Matrix QA exercises an authorized journey and preserves that surrounding evidence for triage.",
    intent: "For teams chasing runtime failures that appear after a real interaction.",
    cta: "Inspect a runtime signal",
    heroMetric: "RUNTIME",
    heroMetricLabel: "signal category surfaced by the browser journey",
    signals: [
      {
        label: "exception",
        value: "uncaught",
        body: "A browser-side exception can turn a visible symptom into a concrete finding.",
      },
      {
        label: "context",
        value: "time-synced",
        body: "Review the action, page state, console line, network request, and timestamp around the event.",
      },
      {
        label: "triage",
        value: "evidence",
        body: "Use the captured report as a reproducible starting point instead of a loose console dump.",
      },
    ],
    steps: [
      {
        number: "01",
        title: "Choose the journey",
        body: "Start with an authorized flow where the failure matters: sign-in, navigation, forms, checkout-like UI, or another critical path.",
      },
      {
        number: "02",
        title: "Let the browser reproduce it",
        body: "The worker moves through the configured steps and records browser and application signals around meaningful state changes.",
      },
      {
        number: "03",
        title: "Follow the signal backward",
        body: "Open the finding and trace the observed runtime error back through the action sequence and surrounding evidence.",
      },
    ],
    sections: [
      {
        kicker: "the category",
        title: "What JavaScript error monitoring is actually trying to answer.",
        paragraphs: [
          "A runtime error is rarely the whole story. A TypeError in the console may be the direct failure, while a missing response, an unexpected state transition, or a selector that pointed at the wrong element may explain why the code reached that line. Good diagnostics preserve enough context to separate the error from the symptom and the likely cause.",
          "Matrix QA approaches this from the browser journey. It does not ask only whether a page loaded. It walks an authorized flow, observes what the browser emits, and connects hard signals to the action that preceded them. That makes the output useful for investigation without presenting a single run as a complete picture of every possible runtime failure.",
        ],
        bullets: [
          "Uncaught exceptions and runtime crashes",
          "Console messages around a meaningful action",
          "Network failures that help explain the runtime symptom",
          "Screenshots, timestamps, and report findings when available",
        ],
      },
      {
        kicker: "the signal chain",
        title: "From console line to developer-ready context.",
        paragraphs: [
          "A useful finding should answer four questions: what was the worker trying to do, what did the user-visible page look like, what did the browser or backend return, and when did the failure occur? Those questions turn an isolated error string into a path another engineer can investigate.",
          "Matrix QA can capture screenshots, page URLs, console observations, network activity, browser events, timings, logs, and other artifacts when available. The exact evidence set depends on the run and the available storage, so the report should always be read as an account of this journey in this environment.",
        ],
      },
      {
        kicker: "the workflow",
        title: "How to investigate a runtime failure without losing the reproduction.",
        paragraphs: [
          "Begin with a dedicated test account and an authorized target. Describe the journey in terms of the user-visible outcome: open the sign-in page, submit the form, navigate to the protected area, and verify the expected state. When the run stops or produces a finding, inspect the action immediately before the error before jumping to a code fix.",
          "The next pass should be narrower, not louder. Re-run the smallest authorized journey that reproduces the signal, compare the new evidence with the original report, and note whether the error is deterministic, data-dependent, timing-sensitive, or environment-specific. A second run that does not reproduce the issue is information, not proof that the first signal was invalid.",
        ],
        bullets: [
          "Describe the expected state before the action",
          "Use stable selectors and controlled test data",
          "Compare console and network context together",
          "Record whether a rerun reproduced the same signal",
        ],
      },
      {
        kicker: "where it fits",
        title: "Browser evidence is different from continuous production monitoring.",
        paragraphs: [
          "Dedicated monitoring products may collect errors from many live sessions, alert continuously, support source-map pipelines, or provide session replay. Matrix QA’s current role is narrower: it runs configured authorized journeys and captures the signals observed during those runs. That makes it a practical release and investigation layer, not a claim that every visitor’s JavaScript error is being collected.",
          "Use the approach that matches the question. If you need to know whether a critical workflow emits a runtime failure after a release, a controlled browser journey can provide strong evidence. If you need population-wide error rates, long-term alerting, or live-user telemetry, pair browser QA with a dedicated monitoring system.",
        ],
      },
      {
        kicker: "the boundary",
        title: "What this page does not promise.",
        paragraphs: [
          "Matrix QA does not promise 24/7 production monitoring, universal source-map resolution, complete stack traces for every browser error, session replay, automatic remediation, or coverage of every possible user state. It also does not replace unit tests, integration tests, security review, performance testing, or an engineer’s judgment.",
          "The safe boundary matters too. Run only against systems you own or are authorized to test. Use dedicated credentials and non-destructive data. Do not configure a journey to submit real payments, alter production permissions, delete data, or contact real users unless the workflow is explicitly authorized and controlled.",
        ],
      },
      {
        kicker: "the practical checklist",
        title: "A better first runtime-error investigation.",
        paragraphs: [
          "Pick one user journey with a clear expected outcome. Define what success looks like before the run starts, and decide which evidence would distinguish a frontend exception from a failed request or a missing state transition. After the run, keep the report, screenshot, console observation, network request, and timestamp together when sharing the issue.",
          "The goal is not to accumulate the largest number of console lines. The goal is to make the next engineering decision easier: reproduce, inspect the responsible boundary, fix the defect, and run the same safe journey again.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does Matrix QA continuously monitor all production visitors?",
        answer:
          "No. Matrix QA’s current workflow runs configured authorized browser journeys and reports the runtime signals observed during those runs. It is not presented as population-wide real-user monitoring or always-on alerting.",
      },
      {
        question: "What JavaScript problems can it help surface?",
        answer:
          "It can help surface uncaught runtime exceptions and related browser or network signals observed during an authorized journey. The exact evidence depends on the run and available storage.",
      },
      {
        question: "Does a clean run prove there are no JavaScript errors?",
        answer:
          "No. A clean run means the configured journey did not produce the captured hard signal under that environment and data. It does not cover every route, state, browser, timing, or user path.",
      },
      {
        question: "What should I do after seeing a runtime finding?",
        answer:
          "Open the report, inspect the action and page state before the signal, review related console and network evidence, then reproduce the smallest authorized journey before applying and verifying a fix.",
      },
    ],
    related: [
      {
        to: "/evidence-based-bug-reports",
        label: "Evidence-based bug reports",
        body: "See how a runtime observation becomes a report another engineer can investigate.",
      },
      {
        to: "/automated-browser-testing",
        label: "Automated browser testing",
        body: "Understand the browser-first journey that produces the surrounding evidence.",
      },
      {
        to: "/visual-regression-testing",
        label: "Visual regression testing",
        body: "Pair a visible symptom with the technical signals that may explain it.",
      },
    ],
  },
  "/staging-environment-testing": {
    path: "/staging-environment-testing",
    variant: "control-room",
    eyebrow: "Release readiness / environment control",
    title: "Test the release candidate before it becomes the release.",
    description:
      "Use Matrix QA to validate authorized staging and pre-release URLs with controlled journeys, test data, browser evidence, and release-aware findings—without claiming automatic deployment or production parity.",
    summary:
      "A staging environment is valuable when it answers a release question. Matrix QA helps teams walk the critical journey against a controlled pre-production URL and keep the evidence attached to the environment that produced it.",
    intent: "For release teams validating a candidate build before production exposure.",
    cta: "Validate a staging journey",
    heroMetric: "PRE-REL",
    heroMetricLabel: "release candidate evidence, not a production guarantee",
    signals: [
      {
        label: "target",
        value: "authorized",
        body: "Point the project at the pre-release or staging URL your team is allowed to test.",
      },
      {
        label: "data",
        value: "controlled",
        body: "Use dedicated test accounts and deliberate fixtures so findings can be interpreted.",
      },
      {
        label: "decision",
        value: "reviewable",
        body: "Use the report to decide whether to investigate, fix, rerun, or proceed.",
      },
    ],
    steps: [
      {
        number: "01",
        title: "Name the environment",
        body: "Record whether the target is a pre-release deployment, staging environment, or another authorized release surface.",
      },
      {
        number: "02",
        title: "Run the critical path",
        body: "Exercise the user journey that would make the release risky if it failed: auth, forms, navigation, or an integrated workflow.",
      },
      {
        number: "03",
        title: "Review before promotion",
        body: "Inspect findings with the environment context attached, then make a human release decision and rerun after changes.",
      },
    ],
    sections: [
      {
        kicker: "the environment question",
        title: "Staging is not a magic word. It is a decision context.",
        paragraphs: [
          "A staging or pre-release URL is useful because it creates a place to observe a change before users encounter it at full scale. The important question is not simply whether the page is called staging. It is whether the target has the code, configuration, backing services, credentials, data, and feature flags needed to make the result meaningful.",
          "Matrix QA does not create that environment for you. It starts from the URL and instructions your team provides, then validates the journey that the environment exposes. The report should therefore name the environment and record the assumptions that affect the result.",
        ],
        bullets: [
          "Pre-release deployment created from a pull request",
          "Shared staging environment for a release candidate",
          "Pre-production route with dedicated test credentials",
          "Authorized production smoke path when explicitly controlled",
        ],
      },
      {
        kicker: "the runway",
        title: "Move through environments without confusing confidence with proof.",
        paragraphs: [
          "Development is where a change is built and explored. A pre-release environment can make one change reviewable. Staging is often where several services and a release candidate are assembled. Production is where real users and real consequences exist. Each step changes the quality of evidence available to the team.",
          "The closer a non-production environment is to production, the more useful the comparison can be—but similarity must be checked rather than assumed. Differences in backing services, feature flags, third-party availability, data shape, browser configuration, and secrets can produce different results.",
        ],
      },
      {
        kicker: "test data control",
        title: "The safest staging run begins with the data boundary.",
        paragraphs: [
          "A staging check should use a dedicated test identity and data that can be created, inspected, and reset without affecting real customers. Explain which records the journey is allowed to touch, what the expected cleanup behavior is, and which actions are intentionally out of scope.",
          "Matrix QA customers remain responsible for authorization and test instructions. Do not paste real passwords into a prompt, run destructive flows casually, or assume that a staging database is harmless simply because it is not production. Treat customer-like data, payment-shaped data, and private integrations as sensitive unless the team has explicitly approved the test boundary.",
        ],
        bullets: [
          "Use a dedicated test account",
          "Prefer deterministic fixtures and resettable records",
          "Avoid real payment, deletion, and permission changes",
          "Record feature flags and external-service assumptions",
        ],
      },
      {
        kicker: "release review",
        title: "Turn a staging run into a release conversation.",
        paragraphs: [
          "A report is most useful when it changes what the team does next. A hard runtime error or failed request on the critical path may require a fix and rerun. A clean run may support proceeding with the tested scope. A blocked run may mean the environment is unavailable, the credentials are invalid, or the journey needs clarification.",
          "Do not reduce the decision to a single green or red label. Read the findings with the target URL, environment, journey instructions, status, timestamps, and artifacts. A release decision should consider what was actually tested and what remains uncovered.",
        ],
      },
      {
        kicker: "parity and limits",
        title: "What staging testing cannot tell you by itself.",
        paragraphs: [
          "A successful staging run cannot prove that production is configured identically, that a third-party service will respond the same way, that every browser and device will behave the same way, or that load and security characteristics are acceptable. It is one layer of release confidence, not a complete release certificate.",
          "Matrix QA does not provision infrastructure, deploy code, synchronize databases, automatically gate a merge, or certify production parity. Teams can place the browser signal alongside their existing CI/CD, unit, integration, API, performance, security, and accessibility checks.",
        ],
      },
      {
        kicker: "the operating pattern",
        title: "A calm staging workflow for small and large teams.",
        paragraphs: [
          "Start with one critical journey and one authorized environment. Keep the environment name, target URL, data assumptions, and expected outcome visible to the reviewer. Run the same journey after a meaningful change rather than rewriting the test around the failure.",
          "Over time, build a small collection of high-value paths: sign-in, protected navigation, a core form, a key integration, and a recovery state. Each path should have an owner, a safe test account, a reason to exist, and a clear interpretation when it is blocked or incomplete.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can Matrix QA create my staging environment?",
        answer:
          "No. Matrix QA tests an authorized URL and configured journey. Your team remains responsible for provisioning the pre-release or staging environment, data, credentials, integrations, and deployment process.",
      },
      {
        question: "Does a staging pass prove production is safe?",
        answer:
          "No. It provides evidence for the tested journey in that environment. Differences in configuration, data, services, browser conditions, and traffic can still change production behavior.",
      },
      {
        question: "Should staging tests use production data?",
        answer:
          "Use dedicated, controlled test data unless your organization has explicitly authorized another arrangement and can protect the information. Avoid real customer credentials and destructive actions.",
      },
      {
        question: "Can staging checks be used in a release process?",
        answer:
          "They can provide a browser-level signal alongside your release process. The current page does not claim that Matrix QA automatically blocks merges or deploys changes.",
      },
    ],
    related: [
      {
        to: "/ci-cd-testing",
        label: "CI/CD testing",
        body: "Place staging evidence alongside the layered checks that protect a release pipeline.",
      },
      {
        to: "/end-to-end-testing",
        label: "End-to-end testing",
        body: "Validate a complete user journey across the deployed application boundary.",
      },
      {
        to: "/how-it-works",
        label: "How the run works",
        body: "Review the URL-to-browser-worker-to-report lifecycle before your first check.",
      },
    ],
  },
  "/web-application-testing": {
    path: "/web-application-testing",
    variant: "field-manual",
    eyebrow: "Field manual / web QA coverage",
    title: "A web application is more than a page that loads.",
    description:
      "Understand web application testing as a layered practice, and see where Matrix QA fits with browser journeys, authentication, forms, integration signals, screenshots, and evidence-backed findings.",
    summary:
      "Web application testing asks whether the product behaves as users, browsers, services, and data make it behave together. Matrix QA covers the browser-facing journey layer and preserves evidence for the parts your team needs to investigate next.",
    intent: "For product and engineering teams building a practical web QA coverage map.",
    cta: "Map a web journey",
    heroMetric: "01",
    heroMetricLabel: "browser journey first; broader QA layers remain essential",
    signals: [
      {
        label: "interface",
        value: "visible",
        body: "Check routes, forms, navigation, protected screens, and the states users can actually reach.",
      },
      {
        label: "integration",
        value: "observed",
        body: "Pair UI behavior with console and network evidence when the browser triggers application services.",
      },
      {
        label: "coverage",
        value: "planned",
        body: "Choose a small set of high-value journeys rather than pretending one run covers the whole application.",
      },
    ],
    steps: [
      {
        number: "01",
        title: "Map the promise",
        body: "Write down the user-visible outcome, the roles involved, the data needed, and the failure that would matter.",
      },
      {
        number: "02",
        title: "Walk the boundary",
        body: "Exercise the authorized browser journey and observe the frontend, backend responses, runtime signals, and visible state together.",
      },
      {
        number: "03",
        title: "Close the loop",
        body: "Turn the result into a report, fix or clarify the issue, and run the smallest meaningful verification again.",
      },
    ],
    sections: [
      {
        kicker: "the definition",
        title: "Web application testing is a coverage map, not a single test type.",
        paragraphs: [
          "A web application combines an interface with routes, state, authentication, data, services, browser behavior, and dependencies. Testing it well means choosing the right layer for the right question. Unit tests can validate isolated logic. API tests can validate service contracts. Integration tests can validate boundaries between components. Browser journeys can validate what the assembled product does through the interface.",
          "Matrix QA is focused on that browser-facing layer. It can walk an authorized journey and preserve evidence around what the user-visible application did. It is useful precisely because it complements narrower tests, not because it replaces every other kind of quality work.",
        ],
        bullets: [
          "Unit tests for isolated logic",
          "API and integration tests for service boundaries",
          "Browser journeys for user-visible behavior",
          "Security, performance, and accessibility review for specialist questions",
        ],
      },
      {
        kicker: "the application map",
        title: "Start with the routes where the product makes a promise.",
        paragraphs: [
          "Do not begin by trying to test every page. Begin with the paths that carry the product’s promise: a user can sign in, reach the right workspace, submit a form, see a meaningful response, recover from invalid input, and complete the next step. These journeys expose the points where UI state, API behavior, data, and third-party services meet.",
          "A good coverage map names the actor, entry point, expected state, critical action, dependency, and safe stopping point. It also names what the test does not do. That precision helps the team interpret a clean result honestly and prevents a small smoke test from being mistaken for full application coverage.",
        ],
      },
      {
        kicker: "the browser layer",
        title: "Why the browser still matters when APIs are healthy.",
        paragraphs: [
          "A service can return a successful response while the interface fails to render it, a selector can point to the wrong control, a client-side exception can interrupt the next state, or a redirect can send the user somewhere unexpected. Browser testing observes the assembled path from the user’s point of view.",
          "Matrix QA records actions and can capture screenshots, DOM or browser events, console messages, network activity, timestamps, logs, videos, findings, and other artifacts when available. This creates a connected evidence trail for the tested flow rather than a screenshot detached from the event that produced it.",
        ],
      },
      {
        kicker: "the everyday surfaces",
        title: "Forms, authentication, navigation, and recovery deserve first-class coverage.",
        paragraphs: [
          "The most valuable web application journeys are often ordinary: sign in, sign up, reset a password, navigate to a protected route, submit a form, handle invalid input, wait for a response, and recover from a failed request. They are also where small changes can create large user-visible consequences.",
          "Use dedicated test accounts, predictable data, and safe stopping conditions. When the workflow reaches a payment, booking, data deletion, permission change, or outbound communication, stop unless that action is explicitly authorized and intentionally controlled.",
        ],
        bullets: [
          "Authentication and protected routes",
          "Forms and validation states",
          "Navigation and redirects",
          "Loading, failure, and recovery states",
        ],
      },
      {
        kicker: "the evidence layer",
        title: "A finding should help the next person reproduce the question.",
        paragraphs: [
          "A web QA result is stronger when it connects expected behavior, actual behavior, reproduction steps, and the evidence that supports the observation. The engineer should be able to see what the worker did, what page state appeared, which request or console event mattered, and when the signal occurred.",
          "That is why Matrix QA emphasizes evidence-backed reports. The report is not a decorative screenshot gallery and it is not a guarantee of defect-free software. It is a structured record of a tested journey and the hard signals available during that run.",
        ],
      },
      {
        kicker: "the gaps",
        title: "What browser-first web testing does not replace.",
        paragraphs: [
          "Browser journeys do not by themselves establish security, load capacity, accessibility conformance, compatibility across every browser and device, data correctness across every record, or resilience under every failure mode. Those questions require specialized methods, environments, and expertise.",
          "A complete web application testing strategy is layered. Let each test type answer a question it is good at, and keep the boundaries visible in the report and release conversation. Matrix QA contributes the user-visible, browser-level evidence layer.",
        ],
      },
      {
        kicker: "the first week",
        title: "A practical operating plan for building coverage.",
        paragraphs: [
          "In the first week, select three journeys: one authentication path, one core product action, and one recovery or validation path. Run them against an authorized staging or pre-release URL with dedicated test data. Review the evidence with the engineers who own the affected routes and services.",
          "Then expand deliberately. Add a journey only when it protects a meaningful product promise, has a safe test boundary, and has an owner who can interpret the result. Revisit the set after releases, because application behavior and dependencies change over time.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is included in web application testing?",
        answer:
          "It can include functional, browser, integration, API, performance, security, accessibility, compatibility, and data-focused testing. Matrix QA’s core contribution is authorized browser journeys with evidence around observed behavior.",
      },
      {
        question: "Can Matrix QA test my entire web application automatically?",
        answer:
          "No. A run covers the configured journey and captured signals. Teams should prioritize critical paths and combine Matrix QA with other test types rather than treating one run as complete application coverage.",
      },
      {
        question: "Does web application testing replace unit or API tests?",
        answer:
          "No. Browser journeys and direct service tests answer different questions. A layered strategy uses each one where it gives the clearest evidence.",
      },
      {
        question: "What should I test first?",
        answer:
          "Start with a critical authentication path, a core product action, and a recovery or validation state. Use an authorized environment, dedicated data, and explicit safe stopping conditions.",
      },
    ],
    related: [
      {
        to: "/features",
        label: "Matrix QA features",
        body: "See the browser worker, evidence capture, deterministic findings, and workspace model.",
      },
      {
        to: "/authentication-testing",
        label: "Authentication testing",
        body: "Go deeper on login, protected routes, sessions, and safe test accounts.",
      },
      {
        to: "/end-to-end-testing",
        label: "End-to-end testing",
        body: "Explore complete user journeys across the assembled application boundary.",
      },
    ],
  },
};
