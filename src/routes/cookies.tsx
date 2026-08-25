import { createFileRoute, Link } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
import {
  LegalList,
  LegalPageShell,
  LegalParagraph,
  LegalRow,
  LegalTable,
  type LegalSection,
} from "@/components/legal-page-shell";

export const Route = createFileRoute("/cookies")({
  head: () =>
    seoHead({
      title: "Cookie Policy · Matrix QA",
      description: "How Matrix QA uses cookies and similar browser technologies.",
      path: "/cookies",
    }),
  component: CookiesPage,
});

const sections: LegalSection[] = [
  {
    title: "What this covers",
    children: (
      <>
        <LegalParagraph>
          This Cookie Policy explains how Tr Labs, operating Matrix QA, uses cookies and similar
          browser technologies on the public site, console, and authenticated interfaces. Similar
          technologies include local storage, session storage, service workers, push subscriptions,
          pixels, and SDKs.
        </LegalParagraph>
        <LegalParagraph>
          The current frontend stores the bearer authentication token in browser local storage. That
          is not technically an HTTP cookie, but it has a similar privacy and security impact and is
          included here.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Technologies in use",
    children: (
      <LegalTable>
        <LegalRow
          label="Authentication token"
          value="Keeps verified users signed in and authenticates API requests. Required for authenticated features; token configuration indicates seven-day expiry."
        />
        <LegalRow
          label="Console context"
          value="Remembers active organization, workspace, and project. Functional convenience."
        />
        <LegalRow
          label="Onboarding state"
          value="Preserves unfinished onboarding and first-test setup. Temporary functional storage."
        />
        <LegalRow
          label="OAuth intent"
          value="Temporarily remembers whether Google or GitHub redirect began as sign-in or sign-up."
        />
        <LegalRow
          label="Service worker and push"
          value="Supports optional web push when enabled and permission is granted."
        />
        <LegalRow
          label="Google Analytics"
          value="Measures traffic, page use, events, and product performance. Non-essential where applicable law requires consent."
        />
      </LegalTable>
    ),
  },
  {
    title: "Necessary and functional storage",
    children: (
      <>
        <LegalParagraph>
          Authentication, security, account navigation, API access, rate limiting, and core console
          operation rely on necessary technologies. Blocking them may prevent sign-in, project
          management, run creation, report access, or logout.
        </LegalParagraph>
        <LegalParagraph>
          Functional storage remembers your selected organization, workspace, project, and
          unfinished onboarding state. Clearing it may require you to repeat selections or setup
          steps.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Analytics and third parties",
    children: (
      <>
        <LegalParagraph>
          Matrix QA uses Google Analytics on the deployed service. Google Analytics may set cookies
          or use similar identifiers and may process device, browser, page, event, and approximate
          location information under Google’s own policies.
        </LegalParagraph>
        <LegalParagraph>
          Google and GitHub may set their own technologies during OAuth sign-in. Render, Neon,
          Cloudflare, Resend, AI providers, browsers, and operating systems may also use their own
          technical identifiers when their services are involved. Tr Labs does not control
          independent third-party practices.
        </LegalParagraph>
        <LegalParagraph>
          The reviewed frontend did not show a direct first-party <code>document.cookie</code>{" "}
          assignment or a dedicated advertising-cookie SDK. If advertising or additional tracking is
          introduced, this Policy and consent choices will be updated.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Push notifications",
    children: (
      <>
        <LegalParagraph>
          If you opt in to web push, Matrix QA may register a service worker and store a push
          endpoint, cryptographic subscription keys, and a shortened user-agent string to deliver
          notifications. You can withdraw browser permission and unsubscribe through available
          notification controls.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Your choices",
    children: (
      <>
        <LegalParagraph>
          You can block, delete, or restrict cookies and browser storage through your browser
          settings. You can also withdraw optional notification permission. Blocking local storage,
          session storage, service workers, or authorization headers may stop authenticated features
          from working.
        </LegalParagraph>
        <LegalParagraph>
          Where law requires consent for non-essential analytics, Matrix QA will request consent
          before activating it. Necessary security and authentication technologies may operate where
          permitted without consent.
        </LegalParagraph>
        <LegalParagraph>
          For questions or requests, contact{" "}
          <a
            className="text-primary underline underline-offset-4"
            href="mailto:support@trlabs.tech"
          >
            support@trlabs.tech
          </a>
          . See also the{" "}
          <Link className="text-primary underline underline-offset-4" to="/privacy">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link className="text-primary underline underline-offset-4" to="/terms">
            Terms of Service
          </Link>
          .
        </LegalParagraph>
      </>
    ),
  },
];

function CookiesPage() {
  return (
    <LegalPageShell
      eyebrow="Policy / 03"
      title="Cookie Policy"
      summary="A transparent view of the browser technologies that keep Matrix QA signed in, remember your workspace, deliver notifications, and measure product usage."
      updated="1 September 2026"
      sections={sections}
    />
  );
}
