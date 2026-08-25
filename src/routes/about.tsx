import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers3,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { seoHead } from "@/lib/seo";

const aboutFaqs = [
  {
    question: "What is Matrix QA?",
    answer:
      "Matrix QA is an evidence-grade browser quality-assurance platform operated by Tr Labs. It runs authorized web journeys and organizes the captured evidence, runtime signals, reports, and findings for human investigation.",
  },
  {
    question: "Who operates Matrix QA?",
    answer:
      "Matrix QA is operated by Tr Labs. The product is currently presented as a Public Preview, so current capabilities and usage limits may change as the platform develops.",
  },
  {
    question: "What does Matrix QA return after a browser journey?",
    answer:
      "Depending on the run and available storage, Matrix QA can organize screenshots, browser events, console messages, network requests, response status, timings, logs, videos, reports, and findings.",
  },
  {
    question: "What does Matrix QA not guarantee?",
    answer:
      "A report is evidence for the tested journey and captured signals. It is not a guarantee that an application has no defects, and the public site does not claim complete application coverage, security certification, compliance certification, or universal device coverage.",
  },
] satisfies { question: string; answer: string }[];

export const Route = createFileRoute("/about")({
  head: () =>
    seoHead({
      title: "About Matrix QA | Browser QA by Tr Labs",
      description:
        "Learn what Matrix QA is, who operates it, what its browser reports contain, and which product claims remain outside its current scope.",
      path: "/about",
      breadcrumbLabel: "About Matrix QA",
      faqItems: aboutFaqs,
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f2f6f1] text-[#17201b]">
      <header className="border-b border-[#17201b]/10 bg-[#f2f6f1]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-6 lg:px-10">
          <Logo tone="light" />
          <nav
            className="hidden items-center gap-6 text-sm text-[#17201b]/65 md:flex"
            aria-label="Primary navigation"
          >
            <Link to="/features" className="transition-colors hover:text-[#17201b]">
              Features
            </Link>
            <Link to="/sample-report" className="transition-colors hover:text-[#17201b]">
              Sample report
            </Link>
            <Link to="/pricing" className="transition-colors hover:text-[#17201b]">
              Pricing
            </Link>
            <Link to="/faq" className="transition-colors hover:text-[#17201b]">
              FAQ
            </Link>
          </nav>
          <Link
            to="/auth"
            search={{ mode: "signup", returnTo: "/app" }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#17201b] px-4 py-2 text-sm font-semibold text-[#f2f6f1] transition-transform hover:-translate-y-px"
          >
            Join Preview <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-[#17201b]/10">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1b8a57]/30 bg-[#1b8a57]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#176b45]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1b8a57]" />
                Product facts · Public Preview
              </span>
              <h1 className="mt-7 max-w-3xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.04em] md:text-7xl">
                A clearer record of how your app was tested.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#17201b]/70">
                Matrix QA is an evidence-grade browser quality-assurance platform operated by Tr
                Labs. It runs authorized web journeys and organizes what happened into a report that
                people can inspect, question, and act on.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/sample-report"
                  className="inline-flex items-center gap-2 rounded-full bg-[#17201b] px-5 py-3 text-sm font-semibold text-[#f2f6f1] transition-transform hover:-translate-y-px"
                >
                  Read the sample report <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/features"
                  className="inline-flex items-center gap-2 rounded-full border border-[#17201b]/20 bg-white/45 px-5 py-3 text-sm font-semibold text-[#17201b] transition-colors hover:bg-white"
                >
                  See current capabilities
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-[#17201b]/15 bg-[#17201b] p-6 text-[#f2f6f1] shadow-[0_24px_70px_-34px_rgba(23,32,27,0.55)] md:p-8">
              <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#75dd9a]/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between border-b border-white/15 pb-5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8ffb7]">
                    The short answer
                  </span>
                  <BookOpen className="h-5 w-5 text-[#a8ffb7]" />
                </div>
                <p className="mt-7 font-display text-3xl font-medium leading-tight md:text-4xl">
                  One authorized journey in.
                  <br />
                  <span className="text-[#75dd9a]">Evidence a team can review out.</span>
                </p>
                <div className="mt-8 space-y-3 border-t border-white/15 pt-6 text-sm leading-6 text-white/70">
                  <p>
                    <strong className="text-white">Operated by:</strong> Tr Labs
                  </p>
                  <p>
                    <strong className="text-white">Primary surface:</strong> browser-based web
                    journeys
                  </p>
                  <p>
                    <strong className="text-white">Current status:</strong> Public Preview
                  </p>
                  <p>
                    <strong className="text-white">Human role:</strong> review the evidence and
                    findings
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 md:py-24">
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#176b45]">
              Current product facts
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl">
              What Matrix QA is built to do today.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#17201b]/65">
              These statements describe the public product surface, not a promise about capabilities
              that are only planned or unavailable in a particular workspace.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                title: "Authorized journeys",
                body: "Test login, signup, navigation, forms, and other project-defined critical paths with permission.",
              },
              {
                icon: Layers3,
                title: "Evidence around actions",
                body: "Organize screenshots, browser events, console signals, network activity, timestamps, and artifacts when captured.",
              },
              {
                icon: CheckCircle2,
                title: "Actionable findings",
                body: "Turn captured signals into reports and findings that keep the tested journey and its context together.",
              },
              {
                icon: ShieldCheck,
                title: "Human investigation",
                body: "Give developers and reviewers a traceable record to inspect rather than treating automation as a final verdict.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-2xl border border-[#17201b]/12 bg-white/55 p-5"
              >
                <Icon className="h-5 w-5 text-[#1b8a57]" />
                <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#17201b]/65">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-[#17201b]/10 bg-[#e4eee4]">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 md:py-24">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#176b45]">
                Why it exists
              </span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl">
                Testing is more useful when the proof survives the moment.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-[#17201b]/70">
              <p>
                A pass or fail can tell a team where to look. It cannot always show what the browser
                saw, which request failed, what happened immediately before the failure, or whether
                the result deserves human review.
              </p>
              <p>
                Matrix QA is designed around that missing context. The platform captures evidence
                around meaningful browser actions so a report can connect a journey step to its
                observable outcome. The public sample report demonstrates this model with safe
                fixture data.
              </p>
              <p>
                The goal is not to replace engineering judgment. It is to make the tested path,
                captured signals, and remaining uncertainty easier to inspect before a team decides
                what to ship.
              </p>
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-7xl px-6 py-16 lg:px-10 md:py-24"
          aria-labelledby="scope-heading"
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#176b45]">
                Read the scope carefully
              </span>
              <h2
                id="scope-heading"
                className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl"
              >
                Evidence is valuable because it is specific.
              </h2>
            </div>
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#176b45] hover:underline"
            >
              Read the FAQ <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <ScopeCard
              label="Live product surface"
              tone="green"
              items={[
                "Authorized browser journeys",
                "Evidence capture when available",
                "Reports and findings for review",
              ]}
            />
            <ScopeCard
              label="Evidence-dependent"
              tone="cream"
              items={[
                "Captured artifacts vary by run and available storage",
                "A report describes the tested journey",
                "Current Preview limits may change",
              ]}
            />
            <ScopeCard
              label="Not a promise"
              tone="dark"
              items={[
                "Not universal application coverage",
                "Not a security or compliance certification",
                "Not a substitute for engineering review",
              ]}
              warning
            />
          </div>
        </section>

        <section
          className="border-t border-[#17201b]/10 bg-[#17201b] text-[#f2f6f1]"
          aria-labelledby="about-faq-heading"
        >
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 md:py-24">
            <div className="max-w-2xl">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#a8ffb7]">
                Direct answers
              </span>
              <h2
                id="about-faq-heading"
                className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl"
              >
                About Matrix QA, plainly stated.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {aboutFaqs.map((item) => (
                <article
                  key={item.question}
                  className="rounded-2xl border border-white/15 bg-white/[0.04] p-5"
                >
                  <h3 className="font-display text-xl font-semibold">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/65">{item.answer}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-[#75dd9a] px-5 py-3 text-sm font-semibold text-[#17201b]"
              >
                See Preview status <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/sample-report"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Inspect the evidence model
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#17201b]/10 bg-[#f2f6f1]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-7 lg:px-10">
          <Logo tone="light" size={22} />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#17201b]/60">
            <Link to="/terms" className="hover:text-[#17201b]">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-[#17201b]">
              Privacy
            </Link>
            <Link to="/cookies" className="hover:text-[#17201b]">
              Cookies
            </Link>
            <a href="mailto:support@trlabs.tech" className="hover:text-[#17201b]">
              support@trlabs.tech
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ScopeCard({
  label,
  tone,
  items,
  warning = false,
}: {
  label: string;
  tone: "green" | "cream" | "dark";
  items: string[];
  warning?: boolean;
}) {
  const styles = {
    green: "border-[#1b8a57]/30 bg-[#dcefe0] text-[#17201b]",
    cream: "border-[#17201b]/12 bg-[#fffaf0] text-[#17201b]",
    dark: "border-[#17201b] bg-[#17201b] text-[#f2f6f1]",
  }[tone];
  return (
    <article className={`rounded-2xl border p-6 ${styles}`}>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
        {warning ? (
          <AlertTriangle className="h-4 w-4 text-[#f1c46b]" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-[#1b8a57]" />
        )}
        {label}
      </div>
      <ul className="mt-6 space-y-3 text-sm leading-6">
        {items.map((item) => (
          <li
            key={item}
            className={
              tone === "dark"
                ? "border-b border-white/10 pb-3 text-white/70 last:border-0"
                : "border-b border-[#17201b]/10 pb-3 last:border-0"
            }
          >
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
