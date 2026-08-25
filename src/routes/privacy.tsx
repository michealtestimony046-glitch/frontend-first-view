import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LegalList,
  LegalPageShell,
  LegalParagraph,
  LegalRow,
  LegalTable,
  type LegalSection,
} from "@/components/legal-page-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · Matrix QA" },
      { name: "description", content: "How Tr Labs handles personal information in Matrix QA." },
    ],
  }),
  component: PrivacyPage,
});

const sections: LegalSection[] = [
  {
    title: "Who we are",
    children: (
      <>
        <LegalParagraph>
          This Privacy Policy explains how Tr Labs, operating Matrix QA, collects and uses
          information when you visit the site, create an account, use the console, run an authorized
          test, receive notifications, or contact support. It applies worldwide, subject to
          mandatory local law.
        </LegalParagraph>
        <LegalTable>
          <LegalRow label="Operator" value="Tr Labs" />
          <LegalRow
            label="Address"
            value="15 Marina Road, Lagos Island, Lagos State, Nigeria, 101001"
          />
          <LegalRow label="Privacy contact" value="support@trlabs.tech" />
          <LegalRow label="DPO" value="Tr Labs has not appointed a Data Protection Officer" />
        </LegalTable>
      </>
    ),
  },
  {
    title: "Information we collect",
    children: (
      <>
        <LegalParagraph>
          We collect account information such as email address, full name, password hash,
          verification status, account identifiers, organization memberships, and timestamps. We
          also collect organization, workspace, project, feature, target URL, test mode, mission
          instructions, access settings, authorization confirmations, run status, timestamps,
          errors, retries, and metadata.
        </LegalParagraph>
        <LegalParagraph>
          Runs can generate screenshots, browser events, page URLs, console and network
          observations, logs, audit logs, test steps, assertions, findings, reports, videos,
          artifacts, and evidence storage keys. Optional test credentials are stored in encrypted
          form by the backend when provided. Use dedicated test accounts and avoid production
          secrets.
        </LegalParagraph>
        <LegalParagraph>
          We may receive technical information such as IP address, browser and device details,
          timestamps, API activity, authentication events, security events, rate-limit events,
          referrer information, and diagnostic logs. If you enable push notifications, we collect
          the push endpoint, subscription keys, and a shortened user-agent string.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "AI and provider processing",
    children: (
      <>
        <LegalParagraph>
          Production AI providers are Groq, Ollama, Google Gemini, Z.ai, OpenRouter, and Cloudflare
          Workers AI. The active provider may vary by task and availability. Selected prompts, test
          context, page observations, screenshots, and report inputs may be processed for planning,
          browser decisions, recovery, summarization, or report enrichment.
        </LegalParagraph>
        <LegalParagraph>
          You can choose whether to allow or prevent AI-provider training use through the setting in
          Matrix QA Settings or while starting a run. Tr Labs applies your selected choice to the
          extent supported by the relevant provider and configuration. AI outputs may be wrong or
          incomplete.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Why we use information",
    children: (
      <>
        <LegalParagraph>
          We use information to create and secure accounts, verify email, authenticate users,
          operate organizations and workspaces, execute authorized tests, generate reports and
          evidence, send transactional messages and notifications, prevent abuse, troubleshoot,
          manage provider capacity, calculate usage and Matrix Units, improve reliability, comply
          with law, and establish or defend legal claims.
        </LegalParagraph>
        <LegalParagraph>
          We may use aggregated or de-identified information for capacity planning, reliability,
          quality measurement, product improvement, and business reporting where it cannot
          reasonably identify you or your organization.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Vendors and disclosures",
    children: (
      <>
        <LegalParagraph>
          We share information only as needed to operate the Service, comply with law, or protect
          users and the Service.
        </LegalParagraph>
        <LegalTable>
          <LegalRow label="Hosting and database" value="Render and Neon" />
          <LegalRow label="Object storage" value="Cloudflare, including R2 where configured" />
          <LegalRow label="Transactional email" value="Resend" />
          <LegalRow label="OAuth" value="Google and GitHub" />
          <LegalRow
            label="AI providers"
            value="Groq, Ollama, Google Gemini, Z.ai, OpenRouter, Cloudflare Workers AI"
          />
          <LegalRow label="Analytics" value="Google Analytics" />
        </LegalTable>
        <LegalParagraph>
          Providers may process information in countries other than your own, including Nigeria, the
          United States, and countries where our providers operate. We use legally required transfer
          safeguards and can provide further information at{" "}
          <a
            className="text-primary underline underline-offset-4"
            href="mailto:support@trlabs.tech"
          >
            support@trlabs.tech
          </a>
          .
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Cookies and analytics",
    children: (
      <>
        <LegalParagraph>
          The frontend uses local storage for authentication and console context and session storage
          for temporary OAuth flow state. Matrix QA uses Google Analytics. The reviewed frontend did
          not show a direct first-party cookie assignment or dedicated advertising-cookie SDK, but
          Google Analytics, OAuth providers, hosting infrastructure, and future deployments may use
          cookies or similar technologies.
        </LegalParagraph>
        <LegalParagraph>
          See the{" "}
          <Link className="text-primary underline underline-offset-4" to="/cookies">
            Cookie Policy
          </Link>{" "}
          for details and controls.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Retention and deletion",
    children: (
      <>
        <LegalParagraph>
          Our proposed default retention schedule is: verification codes until expiry; account and
          organization data while active and for 30 days after approved deletion; run metadata,
          reports, screenshots, logs, videos, AI usage, and credit ledgers while needed and for 30
          days after approved deletion; support records for 24 months; security logs for 12 months;
          and encrypted backups for up to 90 days before overwrite or inaccessibility.
        </LegalParagraph>
        <LegalParagraph>
          Tr Labs will begin approved deletion of active account and associated personal data
          immediately, subject to technical processing time, legal holds, security records, and
          backup overwriting. Organization owners control deletion of organization-owned projects,
          runs, reports, and evidence. Retention may be extended for legal obligations, security
          investigations, disputes, or backup integrity.
        </LegalParagraph>
      </>
    ),
  },
  {
    title: "Your rights",
    children: (
      <>
        <LegalParagraph>
          Depending on applicable law, you may request access, correction, deletion, restriction,
          objection, portability, or withdrawal of consent, and you may complain to a supervisory
          authority. Contact{" "}
          <a
            className="text-primary underline underline-offset-4"
            href="mailto:support@trlabs.tech"
          >
            support@trlabs.tech
          </a>
          . We may verify your identity and apply lawful exceptions. Organization-owned test content
          may need to be requested through the organization owner.
        </LegalParagraph>
        <LegalParagraph>
          The Service is intended for people aged 16 or older. Tr Labs has not appointed a regional
          privacy representative.
        </LegalParagraph>
      </>
    ),
  },
];

function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Policy / 02"
      title="Privacy Policy"
      summary="A clear map of the information Matrix QA handles — from account identity and test evidence to AI processing, storage, analytics, and deletion."
      updated="1 September 2026"
      sections={sections}
    />
  );
}
