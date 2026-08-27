import { Link } from "@tanstack/react-router";
import type { SeoTopicPageConfig } from "@/components/seo-topic-page";

const linkClass = "text-primary underline underline-offset-4";
const guideLink = (to: string, label: string) => (
  <Link className={linkClass} to={to}>
    {label}
  </Link>
);

export const launchGuidePages: Record<string, SeoTopicPageConfig> = {
  "/learn/matrix-units": {
    title: "Matrix Units Explained | Live Usage-Based QA Billing | Matrix QA",
    description:
      "Learn how Matrix Units measure browser QA work, why a pre-run hold is not a fixed quote, and how live usage reconciliation protects both customers and the platform.",
    eyebrow: "Usage / Matrix Units",
    variant: "terminal",
    hero: <>Understand the unit behind every evidence-backed browser run.</>,
    summary:
      "Matrix Units are the customer-facing usage measure for Matrix QA. A run reserves capacity before it starts, then drains measured usage as browser, AI, artifact, and storage work is observed.",
    intent:
      "For teams that want predictable controls without pretending every website costs the same to test.",
    cards: [
      {
        title: "A usage measure, not a guess",
        body: "The pre-run amount is a safety reserve. It is not a guaranteed quote because different journeys produce different work.",
      },
      {
        title: "Live balance movement",
        body: "Idempotent usage ticks can consume held reserve and then available balance as billable work is recorded.",
      },
      {
        title: "One clear selling value",
        body: "The current launch pricing snapshot uses $0.05 per MU. Internal infrastructure cost remains private operational data.",
      },
      {
        title: "Reconciled at the end",
        body: "Final measured work, unused reserve, corrections, alpha waivers, and incident treatment are reconciled when the run closes.",
      },
    ],
    steps: [
      {
        title: "Reserve before execution",
        body: "Matrix QA places a bounded hold so a run cannot begin without a safe spending boundary.",
      },
      {
        title: "Measure the work",
        body: "AI usage and authoritative runtime, artifact, and object-storage counters contribute to usage as the run progresses.",
      },
      {
        title: "Settle the difference",
        body: "The terminal result charges measured work, releases unused reserve, or applies the documented infrastructure-failure correction.",
      },
    ],
    sections: [
      {
        title: "Why Matrix Units are not a fixed per-run quote",
        body: (
          <>
            <p>
              A browser run is not a single predictable API request. A small smoke journey may need
              only a few decisions, while a large SaaS workflow can require more navigation,
              evidence, retries, analysis, or artifact storage. A reserve protects the account while
              the system learns what the run actually required.
            </p>
            <p>
              Read {guideLink("/learn/quick-smoke-testing", "how Quick Smoke stays bounded")} and{" "}
              {guideLink(
                "/learn/standard-adaptive-testing",
                "how Standard Adaptive expands coverage deliberately",
              )}{" "}
              before comparing run modes.
            </p>
          </>
        ),
      },
      {
        title: "What happens when a run fails",
        body: (
          <>
            <p>
              A failed run is not automatically free and it is not automatically charged in full.
              Target-access, provider, timeout, and customer-cancelled outcomes preserve
              authoritative measured work. Matrix QA infrastructure failures and no-work outcomes
              can reverse provisional customer charges and release unused reserve.
            </p>
            <p>
              Alpha access can waive the customer charge while measurement continues, so the team
              can evaluate platform cost without hiding the underlying usage signal.
            </p>
          </>
        ),
      },
      {
        title: "See the current plan allowance",
        body: (
          <>
            <p>
              Free includes 150 MU per month. Starter includes 980 MU per month and adds Standard
              Adaptive plus governed five-worker collaboration. These are monthly plan allowances,
              separate from any future top-up purchase flow.
            </p>
            <p>
              Compare the tiers on the {guideLink("/pricing", "Matrix QA pricing page")} or review{" "}
              {guideLink(
                "/learn/matrix-unit-top-ups",
                "how top-up packages are priced and bounded",
              )}
              .
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Is one MU the same as one browser run?",
        answer:
          "No. MU measures billable work, while run cost varies with the mode, decisions, AI usage, evidence, and measured runtime or storage work.",
      },
      {
        question: "Can the final charge be lower than the reserve?",
        answer:
          "Yes. Unused reserve is released during terminal reconciliation, and a qualifying Matrix QA infrastructure failure can correct provisional customer charges.",
      },
      {
        question: "Does Matrix QA expose internal provider cost?",
        answer:
          "No. Customers receive usage and plan information; raw provider credentials and internal cost details remain operational data.",
      },
    ],
    cta: "Start a measured QA run",
  },
  "/learn/quick-smoke-testing": {
    title: "Quick Smoke Browser Testing | Fast QA Checks | Matrix QA",
    description:
      "Learn how Quick Smoke browser testing gives Matrix QA a bounded first pass over an authorized web journey with clear evidence and controlled usage.",
    eyebrow: "Run mode / Quick Smoke",
    variant: "split",
    hero: <>Start with the shortest useful browser signal.</>,
    summary:
      "Quick Smoke is the launch-friendly way to validate one important authorized journey before expanding into broader adaptive coverage.",
    intent:
      "For teams that need a fast answer about whether a critical path is working before investing in deeper exploration.",
    cards: [
      {
        title: "Bounded by design",
        body: "Use a focused mission and a constrained decision budget to keep the first signal fast and understandable.",
      },
      {
        title: "Evidence, not a green guess",
        body: "Review the journey outcome alongside screenshots, timing, and available browser signals.",
      },
      {
        title: "A safe starting point",
        body: "Use staging, dedicated test data, and reversible actions before connecting a production-like workflow.",
      },
      {
        title: "A path to more coverage",
        body: "If the smoke result raises questions, move to Standard Adaptive instead of making the first pass do everything.",
      },
    ],
    steps: [
      {
        title: "Choose one critical path",
        body: "Pick a login, landing, search, checkout-like test flow, or other journey where a failure matters.",
      },
      {
        title: "State the expected outcome",
        body: "Describe what success looks like and keep credentials, scope, and target origin explicit.",
      },
      {
        title: "Read the evidence",
        body: "Use the report to decide whether to fix, retry safely, or expand the investigation.",
      },
    ],
    sections: [
      {
        title: "Quick Smoke is not a full application audit",
        body: (
          <>
            <p>
              A smoke check answers a narrow question quickly. It does not prove that every route,
              viewport, role, integration, or edge case works. Its value comes from making the first
              browser signal small enough to interpret and repeat.
            </p>
            <p>
              For a broader journey, continue with{" "}
              {guideLink("/learn/standard-adaptive-testing", "Standard Adaptive browser testing")}{" "}
              or start with {guideLink("/learn/quick-scan", "Quick Scan preflight")} to identify
              structural leads.
            </p>
          </>
        ),
      },
      {
        title: "Use safe test data",
        body: (
          <>
            <p>
              Run against a system you own or are authorized to assess. Prefer staging and dedicated
              accounts, avoid real payments and destructive actions, and keep the mission limited to
              the intended target origin.
            </p>
            <p>
              When the journey needs more coordination,{" "}
              {guideLink("/learn/five-worker-qa-collaboration", "five-worker QA collaboration")}{" "}
              explains how the Coordinator and governed workers divide work without creating
              arbitrary tasks.
            </p>
          </>
        ),
      },
      {
        title: "Usage stays visible",
        body: (
          <>
            <p>
              Quick Smoke uses the same live Matrix Unit accounting model as other run modes. The
              hold is a limit, not a promise that every smoke run costs the same amount.
            </p>
            <p>
              Learn {guideLink("/learn/matrix-units", "how Matrix Units work")} before planning a
              monthly allowance.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Who should start with Quick Smoke?",
        answer:
          "Teams that want a focused, repeatable browser signal for one important journey before broadening coverage.",
      },
      {
        question: "Does Quick Smoke replace unit or integration tests?",
        answer:
          "No. It complements lower-level tests by observing a deployed, user-visible path in an authorized browser.",
      },
      {
        question: "Can a Quick Smoke run become a full audit?",
        answer:
          "The run mode stays bounded. Use the result to decide whether a Standard Adaptive or other planned investigation is appropriate.",
      },
    ],
    cta: "Run a Quick Smoke check",
  },
  "/learn/standard-adaptive-testing": {
    title: "Standard Adaptive Browser Testing | Multi-Viewport QA | Matrix QA",
    description:
      "Learn how Standard Adaptive browser testing expands beyond a smoke check with deliberate viewport coverage, shared evidence, and bounded Coordinator decisions.",
    eyebrow: "Run mode / Standard Adaptive",
    variant: "editorial",
    hero: <>Expand coverage when the evidence says it is worth it.</>,
    summary:
      "Standard Adaptive adds structured exploration across the supported viewport matrix while keeping the Coordinator, worker leases, and spending boundary in control.",
    intent:
      "For teams that need more than a single browser path without turning every run into an unbounded exploration session.",
    cards: [
      {
        title: "Multi-viewport perspective",
        body: "Compare desktop, tablet-like, and mobile-like behavior where the run policy calls for those conditions.",
      },
      {
        title: "Decision-based exploration",
        body: "Workers investigate assigned scope and return evidence so the Coordinator can choose the next useful action.",
      },
      {
        title: "Shared coverage memory",
        body: "The workforce records claims and handoffs to reduce duplicate exploration and make gaps visible.",
      },
      {
        title: "Bounded concurrency",
        body: "Five logical collaboration slots do not promise five simultaneous Chromium sessions on every deployment tier.",
      },
    ],
    steps: [
      {
        title: "Define the target and mission",
        body: "Give the Coordinator an authorized origin, a clear goal, and safe test data.",
      },
      {
        title: "Assign bounded worker leases",
        body: "Specialized workers receive approved tasks such as core-flow, responsive, or interaction coverage.",
      },
      {
        title: "Compare and prioritize",
        body: "Review evidence-linked findings across the observed viewport conditions and decide what deserves follow-up.",
      },
    ],
    sections: [
      {
        title: "What adaptive means here",
        body: (
          <>
            <p>
              Adaptive does not mean random or unlimited. The Coordinator uses worker reports,
              coverage claims, target state, and run policy to decide which next check is useful. A
              worker may propose work, but task leases and approval boundaries govern execution.
            </p>
            <p>
              See{" "}
              {guideLink(
                "/learn/five-worker-qa-collaboration",
                "how the collaborating QA team works",
              )}{" "}
              and {guideLink("/learn/quick-smoke-testing", "when a Quick Smoke check is enough")}.
            </p>
          </>
        ),
      },
      {
        title: "Why viewport attribution matters",
        body: (
          <>
            <p>
              A layout can work on a wide screen and fail at a narrow breakpoint. Standard Adaptive
              keeps the observed viewport attached to the evidence so teams can distinguish a
              responsive defect from a general journey failure.
            </p>
            <p>
              The result is still evidence about the tested conditions, not a guarantee for every
              device, browser, or assistive technology.
            </p>
          </>
        ),
      },
      {
        title: "Starter access and launch boundaries",
        body: (
          <>
            <p>
              Starter is the launch tier for Quick Smoke, Standard Adaptive, 980 monthly MU, and
              governed five-worker collaboration. Deep Matrix remains an alpha, staff, or admin
              capability during the MVP period.
            </p>
            <p>
              Compare current access on the {guideLink("/pricing", "functional pricing page")} and
              understand {guideLink("/learn/matrix-units", "live MU usage")} before starting a
              larger run.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Does Standard Adaptive always use five browsers at once?",
        answer:
          "No. Starter provides up to five logical collaboration slots, while the active worker set and actual browser concurrency remain governed by run policy and available infrastructure.",
      },
      {
        question: "Can workers invent new tasks?",
        answer:
          "Workers can propose useful follow-up work, but the Coordinator and scheduler must approve safe task leases before execution.",
      },
      {
        question: "Is Standard Adaptive available on Free?",
        answer:
          "No. Free is limited to Quick Smoke in the current launch entitlement model; the page shows Standard Adaptive as a clear upgrade path rather than hiding it.",
      },
    ],
    cta: "Explore Standard Adaptive",
  },
  "/learn/five-worker-qa-collaboration": {
    title: "Five-Worker QA Collaboration | Coordinator-Led Browser Testing | Matrix QA",
    description:
      "Learn how Matrix QA’s Coordinator and specialized workers share assignments, capacity, evidence, and handoffs while keeping browser testing governed and observable.",
    eyebrow: "Workforce / collaboration",
    variant: "terminal",
    hero: <>A QA team that talks through the work, not around it.</>,
    summary:
      "Matrix QA makes worker dialogue visible in the Run Console: assignments, proposals, approvals, handoffs, evidence, and completion states remain durable and redacted.",
    intent:
      "For teams that want parallel investigative thinking without giving autonomous workers an ungoverned path to act.",
    cards: [
      {
        title: "One Coordinator",
        body: "The Coordinator turns the mission into bounded work, receives reports, and chooses the next safe action.",
      },
      {
        title: "Specialized workers",
        body: "Discovery, core-flow, responsive, interaction, and reproduction/evidence responsibilities can be separated by worker role.",
      },
      {
        title: "Conversation in the console",
        body: "Named agents can report progress, ask for a handoff, propose a check, and return evidence-linked findings.",
      },
      {
        title: "Capacity-aware execution",
        body: "Leases and capacity snapshots prevent the team from treating logical workers as unlimited physical browsers.",
      },
    ],
    steps: [
      {
        title: "Coordinator assigns a lease",
        body: "The worker receives a defined scope, allowed actions, target origin, and deadline.",
      },
      {
        title: "Worker reports and proposes",
        body: "The worker can describe progress or suggest the next check without bypassing approval policy.",
      },
      {
        title: "Coordinator closes the loop",
        body: "The console records the response, evidence references, completion state, and any safe handoff.",
      },
    ],
    sections: [
      {
        title: "How a real exchange should read",
        body: (
          <>
            <p>
              A useful collaboration transcript is specific: “SK3-sub-agent is checking the
              mobile-like viewport; the navigation wraps at the breakpoint. Should SK4 verify
              keyboard focus on the same menu?” The Coordinator can approve, redirect, or close that
              proposal based on coverage and capacity.
            </p>
            <p>
              The goal is observable work, not theatrical chat. Messages remain tied to durable
              workforce state and the authenticated Run Console boundary.
            </p>
          </>
        ),
      },
      {
        title: "Five logical slots are not five guaranteed sessions",
        body: (
          <>
            <p>
              The launch contract exposes five logical worker slots for Starter collaboration.
              Actual browser processes, queue capacity, deployment limits, and run policy can
              constrain simultaneous execution. This distinction keeps the product promise useful
              without hiding infrastructure limits.
            </p>
            <p>
              For the underlying usage model, read{" "}
              {guideLink("/learn/matrix-units", "Matrix Unit metering")} and for the broader run
              mode read {guideLink("/learn/standard-adaptive-testing", "Standard Adaptive testing")}
              .
            </p>
          </>
        ),
      },
      {
        title: "Safety is part of collaboration",
        body: (
          <>
            <p>
              Worker messages are bounded and redacted before they reach customer-facing console
              views. The workforce records coverage claims, conflict signals, proposals, approvals,
              and leases so no worker can silently create arbitrary work or leave the approved
              target scope.
            </p>
            <p>
              Start with {guideLink("/learn/quick-smoke-testing", "a focused Quick Smoke journey")}{" "}
              when you are validating a new target.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Do the workers chat with each other?",
        answer:
          "The Run Console can show durable named-agent messages, handoffs, proposals, approvals, and responses. The Coordinator remains the governing decision point.",
      },
      {
        question: "Can a worker take any action it wants?",
        answer:
          "No. Worker proposals require safe task leases and Coordinator or scheduler approval within the run’s scope and policy.",
      },
      {
        question: "Is this feature included in Free?",
        answer:
          "Free includes one logical worker. Starter is the launch tier for governed five-worker collaboration.",
      },
    ],
    cta: "See collaboration in action",
  },
  "/learn/matrix-unit-top-ups": {
    title: "Matrix Unit Top-Ups | Usage Credit Packages | Matrix QA",
    description:
      "Learn how Matrix QA top-up packages are structured, how MU price maps to display value, and why checkout remains disabled until an approved payment integration is connected.",
    eyebrow: "Usage / top-ups",
    variant: "split",
    hero: <>Add capacity without turning usage into a mystery.</>,
    summary:
      "Top-ups are planned as bounded prepaid Matrix Unit packages. The launch catalog is transparent about price, package size, and whether purchase is actually enabled.",
    intent:
      "For teams planning beyond a monthly allowance while keeping customer-facing pricing separate from private infrastructure cost.",
    cards: [
      {
        title: "Direct MU pricing",
        body: "The current display catalog derives package value from the configured $0.05 selling price per Matrix Unit.",
      },
      {
        title: "Prepaid and bounded",
        body: "A future checkout should add a defined package to a workspace without creating an open-ended spend path.",
      },
      {
        title: "No simulated checkout",
        body: "The current API reports purchaseEnabled=false until payment capture and subscription controls are approved and integrated.",
      },
      {
        title: "Usage still reconciles",
        body: "Top-up balance does not change the live metering rules: reserve, measured work, and terminal settlement remain visible.",
      },
    ],
    steps: [
      {
        title: "Choose a package",
        body: "Review Matrix Unit quantity, one-time display value, and the workspace plan context.",
      },
      {
        title: "Confirm the payment path",
        body: "Only an approved payment integration should capture funds or add balance.",
      },
      {
        title: "Use with live metering",
        body: "Runs continue to drain authoritative measured usage and release unused reserve.",
      },
    ],
    sections: [
      {
        title: "Current catalog values",
        body: (
          <>
            <p>
              The backend display catalog currently exposes 250 MU for $12.50, 500 MU for $25.00,
              1,000 MU for $50.00, and 2,500 MU for $125.00 when the configured selling value is
              $0.05 per MU. The catalog is intentionally derived from the pricing snapshot rather
              than hard-coding a conflicting credit conversion.
            </p>
            <p>
              For the underlying unit model, read{" "}
              {guideLink("/learn/matrix-units", "the Matrix Units guide")} and compare{" "}
              {guideLink("/pricing", "monthly Free and Starter allowances")}.
            </p>
          </>
        ),
      },
      {
        title: "Why a top-up is not a promise of unlimited runs",
        body: (
          <>
            <p>
              A top-up adds usage capacity; it does not make a run free, fixed-price, or unlimited.
              The actual charge still follows measured work and the run’s failure policy. Unused
              holds are released, while qualifying infrastructure failures can receive correction
              treatment.
            </p>
            <p>
              Teams planning larger workloads should first understand{" "}
              {guideLink("/learn/standard-adaptive-testing", "Standard Adaptive coverage")} and{" "}
              {guideLink("/learn/five-worker-qa-collaboration", "worker capacity boundaries")}.
            </p>
          </>
        ),
      },
      {
        title: "The safe launch boundary",
        body: (
          <>
            <p>
              The public page can explain package value now, but it must not imply that a payment
              was captured or balance was added when the payment provider is not connected. The
              product therefore exposes a display-only catalog and a clear unavailable state rather
              than a fake checkout button.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Can I buy a top-up today?",
        answer:
          "The current backend catalog is display-only and reports purchaseEnabled=false. Checkout should be enabled only after an approved payment integration is connected.",
      },
      {
        question: "Are top-ups priced in dollars or internal cost?",
        answer:
          "The customer-facing catalog uses the configured selling value per MU. Private provider and infrastructure cost data is not exposed.",
      },
      {
        question: "Do top-ups change failed-run treatment?",
        answer:
          "No. Failure treatment remains based on authoritative measured work, released reserve, and qualifying infrastructure incident correction.",
      },
    ],
    cta: "Review top-up options",
  },
  "/learn/quick-scan": {
    title: "Quick Scan Website Preflight | Structural QA Leads | Matrix QA",
    description:
      "Learn how Quick Scan provides an early structural and accessibility-oriented preflight that can hand useful leads to a bounded browser investigation.",
    eyebrow: "Preflight / Quick Scan",
    variant: "editorial",
    hero: <>Find the likely friction before the browser goes deep.</>,
    summary:
      "Quick Scan is a lightweight preflight for structural and accessibility-oriented signals. Its findings are leads for verification, not proof that a user-facing defect exists.",
    intent:
      "For teams that want a fast map of possible issues before spending more time on adaptive browser exploration.",
    cards: [
      {
        title: "Structural first pass",
        body: "Use a compact preflight to surface page structure, obvious interaction, and accessibility-oriented leads.",
      },
      {
        title: "Leads, not verdicts",
        body: "Each lead should be independently verified in the browser before becoming a confirmed finding.",
      },
      {
        title: "Handoff into the run",
        body: "Relevant leads can be carried into a bounded browser mission with their source and status visible.",
      },
      {
        title: "A faster investigation start",
        body: "Use the signal to choose where to look next instead of asking one browser run to inspect everything blindly.",
      },
    ],
    steps: [
      {
        title: "Run the preflight",
        body: "Point Quick Scan at an authorized target and collect structural or accessibility-oriented observations.",
      },
      {
        title: "Select useful leads",
        body: "Prioritize signals that match the mission and discard noise before browser verification.",
      },
      {
        title: "Verify with evidence",
        body: "Use Quick Smoke or Standard Adaptive to reproduce the behavior and attach observed evidence.",
      },
    ],
    sections: [
      {
        title: "Quick Scan and browser testing have different jobs",
        body: (
          <>
            <p>
              A preflight can identify clues quickly, but it may not know whether a control is
              reachable through the actual journey, whether an error is announced, or whether a
              responsive state breaks under interaction. Browser verification supplies the
              user-visible context.
            </p>
            <p>
              Learn when to use {guideLink("/learn/quick-smoke-testing", "Quick Smoke")} and when to
              expand into {guideLink("/learn/standard-adaptive-testing", "Standard Adaptive")}.
            </p>
          </>
        ),
      },
      {
        title: "Keep the handoff honest",
        body: (
          <>
            <p>
              Quick Scan leads should retain their source, title, and verification status. A lead
              marked unverified is not a customer-facing defect until the browser observes the
              relevant behavior or another authorized review confirms it.
            </p>
            <p>
              That distinction supports evidence-based triage and prevents a fast preflight from
              inflating the finding count.
            </p>
          </>
        ),
      },
      {
        title: "A practical path for Free users",
        body: (
          <>
            <p>
              Free users can use the Quick Scan-oriented preflight and Quick Smoke path while
              Standard Adaptive remains a visible upgrade option. The pricing page keeps the upgrade
              path explicit instead of hiding capabilities from the Free experience.
            </p>
            <p>
              Compare {guideLink("/pricing", "Free and Starter access")} and understand{" "}
              {guideLink("/learn/matrix-units", "how measured usage works")}.
            </p>
          </>
        ),
      },
    ],
    faqs: [
      {
        question: "Does Quick Scan prove a bug?",
        answer:
          "No. It provides structural or accessibility-oriented leads that should be verified through the browser or an appropriate manual review.",
      },
      {
        question: "Can Quick Scan replace Quick Smoke?",
        answer:
          "No. Quick Scan is a preflight; Quick Smoke observes a bounded authorized browser journey. They answer different questions.",
      },
      {
        question: "Are Quick Scan leads charged as confirmed findings?",
        answer:
          "No. The handoff preserves an unverified state until the relevant behavior is independently observed or reviewed.",
      },
    ],
    cta: "Start with Quick Scan",
  },
};
