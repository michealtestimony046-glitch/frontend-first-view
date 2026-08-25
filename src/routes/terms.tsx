import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LegalList,
  LegalPageShell,
  LegalParagraph,
  LegalRow,
  LegalTable,
  type LegalSection,
} from "@/components/legal-page-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · Matrix QA" },
      { name: "description", content: "Terms governing use of Matrix QA." },
    ],
  }),
  component: TermsPage,
});

const sections: LegalSection[] = [
  {
    title: "The service",
    children: (
      <>
        <LegalParagraph>
          Matrix QA is an authorized website quality-assurance service operated by Tr Labs. It can
          run automated browser checks, capture technical evidence, use configured AI providers for
          planning and analysis, and return reports, findings, and artifacts.
        </LegalParagraph>
        <LegalParagraph>
          Matrix QA is preview software. A report is not a guarantee that every defect, outage,
          security issue, accessibility issue, or unsafe behavior has been found. Review important
          results with qualified people before relying on them.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Eligibility and authorization",
    children: (
      <>
        <LegalParagraph>
          You must be at least 16 years old and legally able to enter an agreement in your location.
          You may submit only websites, applications, accounts, credentials, data, and instructions
          that you own or are authorized to test.
        </LegalParagraph>
        <LegalParagraph>
          Do not use Matrix QA to bypass access controls, evade rate limits, test third-party
          systems without permission, submit payments, make bookings, delete data, change
          permissions, or send communications unless you are expressly authorized to do so.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Accounts and security",
    children: (
      <>
        <LegalParagraph>
          Keep your registration information accurate and protect your password, bearer token,
          recovery links, OAuth session, and test credentials. You are responsible for activity
          carried out through your account or organization.
        </LegalParagraph>
        <LegalParagraph>
          Organization owners and administrators are responsible for member access and
          organization-owned content. Tell us promptly at{" "}
          <a
            className="text-primary underline underline-offset-4"
            href="mailto:support@trlabs.tech"
          >
            support@trlabs.tech
          </a>{" "}
          if you suspect unauthorized access.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Your content and evidence",
    children: (
      <>
        <LegalParagraph>
          You retain rights in the URLs, instructions, credentials, project data, screenshots, logs,
          network traces, videos, reports, and other materials you submit or generate. You give Tr
          Labs permission to host, process, secure, transform, and display that content only as
          needed to provide, support, secure, improve, and account for the Service.
        </LegalParagraph>
        <LegalParagraph>
          Evidence may be stored by Cloudflare and delivered through time-limited signed links.
          Treat signed artifact links as confidential because anyone who possesses an active link
          may be able to access the linked file.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "AI and third-party providers",
    children: (
      <>
        <LegalParagraph>
          The production provider chain includes Groq, Ollama, Google Gemini, Z.ai, OpenRouter, and
          Cloudflare Workers AI. Selected prompts, test context, page observations, screenshots, or
          other permitted inputs may be processed by the provider selected for a task.
        </LegalParagraph>
        <LegalParagraph>
          Customers may choose whether to allow or prevent AI-provider training use through the
          available setting in Matrix QA Settings or while starting a run. AI outputs can be
          incorrect or incomplete and must be reviewed independently.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Credits and billing",
    children: (
      <>
        <LegalParagraph>
          The console may show Matrix Units, internal credits, allocations, reservations,
          settlements, refunds, usage, ceilings, and extension requests. These operational values
          are not invoices unless an applicable paid plan or order says otherwise.
        </LegalParagraph>
        <LegalParagraph>
          The current public billing experience is Preview billing: invoices and payment methods are
          disabled. If paid plans launch, the applicable prices, taxes, unit rules, refunds, expiry,
          and overage terms will be shown with the purchase.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Acceptable use and termination",
    children: (
      <>
        <LegalParagraph>
          Do not interfere with the Service, introduce malware, probe systems without authorization,
          circumvent quotas or safety controls, impersonate others, infringe rights, or upload
          unlawful or harmful content.
        </LegalParagraph>
        <LegalParagraph>
          Tr Labs may suspend or terminate access for misuse, security risk, legal requirement,
          non-payment, provider restrictions, or breach of these Terms. You may stop using the
          Service at any time.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Disclaimers and liability",
    children: (
      <>
        <LegalParagraph>
          To the maximum extent permitted by law, the Service is provided “as is” and “as
          available.” Tr Labs does not warrant uninterrupted operation, complete evidence, defect
          detection, or error-free results.
        </LegalParagraph>
        <LegalParagraph>
          To the maximum extent permitted by law, Tr Labs’ total liability is limited to the amount
          you paid for the Service in the three months before the event giving rise to the claim. If
          you paid nothing during that period, the cap is USD $100.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Governing law and contact",
    children: (
      <>
        <LegalParagraph>
          These Terms are governed by the laws of the State of Delaware, United States. Courts
          located in Wilmington, Delaware have exclusive jurisdiction unless mandatory law provides
          otherwise. Before filing a claim, the parties will try in good faith to resolve it through
          written notice and discussion for 90 days, except for urgent protective relief.
        </LegalParagraph>
        <LegalTable>
          <LegalRow label="Operator" value="Tr Labs, operating Matrix QA" />
          <LegalRow
            label="Address"
            value="15 Marina Road, Lagos Island, Lagos State, Nigeria, 101001"
          />
          <LegalRow label="Contact" value="support@trlabs.tech" />
          <LegalRow label="Effective date" value="1 September 2026" />
        </LegalTable>
        <LegalParagraph>
          See also{" "}
          <Link className="text-primary underline underline-offset-4" to="/privacy">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link className="text-primary underline underline-offset-4" to="/cookies">
            Cookie Policy
          </Link>
          .
        </LegalParagraph>
      </>
    ),
  },
];

function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Policy / 01"
      title="Terms of Service"
      summary="The rules for using Matrix QA responsibly — from target authorization and test safety to evidence, AI providers, credits, and account security."
      updated="1 September 2026"
      sections={sections}
    />
  );
}
