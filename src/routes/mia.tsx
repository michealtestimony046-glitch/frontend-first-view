import { createFileRoute } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
import {
  ArrowRight,
  BookOpen,
  Check,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

export const Route = createFileRoute("/mia")({
  head: () =>
    seoHead({
      title: "Meet Mia, Your Matrix QA Guide | Workspace-Aware QA Help",
      description:
        "Meet Mia, the Matrix QA guide for understanding your workspace, runs, reports, projects, notifications, and settings without changing account data or executing runs.",
      path: "/mia",
      image: "https://matrixqa.trlabs.tech/mia-og.png",
      imageAlt: "A glowing guide orb beside a Matrix QA evidence workspace",
      faqItems: MIA_FAQS,
    }),
  component: MiaPage,
});

const canDo = [
  "Explain Matrix QA features, the run lifecycle, and the difference between a browser journey and a direct API check.",
  "Use the selected workspace as context when answering questions about the workspace’s available data.",
  "Help interpret a focused run when you are viewing a run detail page and a run ID is available in the current route.",
  "Explain projects, test capacity, reports, notifications, settings, and the evidence captured around a run.",
  "Keep a server-backed conversation history scoped to the signed-in user and selected workspace when that history is available.",
  "Return a degraded or unavailable response instead of pretending that live guidance is available when the guidance service cannot respond.",
];

const cannotDo = [
  "Start, stop, rerun, approve, delete, or modify a run. Mia is a guide, not an account-action controller.",
  "Change organization data, workspace settings, billing, credentials, permissions, projects, or notifications.",
  "Execute a browser journey, click through a target site, make a booking, submit a payment, send a message, or perform a destructive action.",
  "Act as a security auditor, penetration tester, legal adviser, accessibility certification tool, or guarantee that an application is bug-free.",
  "Provide a secret, token, password, private credential, payment number, or unredacted sensitive value in chat.",
  "Treat one answer as a substitute for opening the underlying run, report, screenshot, console signal, network event, or timestamp.",
];

const questions = [
  [
    "How do I run my first test?",
    "Mia can explain the project setup, authorized target URL, journey instructions, test mode, and the role of a dedicated test account. To actually start a run, use the Run Console yourself.",
  ],
  [
    "What happened in my latest run?",
    "When the relevant workspace context and run are available, Mia can help you interpret status, findings, evidence, and the difference between a failed journey and a captured hard signal. Open the run detail for the source evidence.",
  ],
  [
    "Where are my notifications?",
    "Mia can point you toward the notifications area and explain common notification states. She cannot mark notifications as read, change delivery preferences, or send a notification on your behalf.",
  ],
  [
    "Can Mia fix the bug she finds?",
    "No. Mia can help explain a finding and suggest where to inspect next, but she cannot edit application code, create a pull request, change your workspace, or deploy a fix.",
  ],
  [
    "Does Mia know everything in my account?",
    "No. Her context is intentionally bounded. The client sends the selected workspace and, on a focused run page, the current run identifier. Responses should be checked against the source record in Matrix QA.",
  ],
] as const;

const MIA_FAQS = questions.map(([question, answer]) => ({ question, answer }));

function MiaPage() {
  return (
    <div className="min-h-screen bg-[#080b0d] text-foreground">
      <header className="border-b border-white/10 bg-[#080b0d]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-6 lg:px-10">
          <Link to="/" aria-label="Matrix QA home" className="inline-flex items-center gap-2.5">
            <img src="/matrixqa-icon.svg" alt="" className="h-7 w-7" />
            <span className="font-display text-sm font-semibold tracking-[0.18em]">MATRIX QA</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link to="/features" className="hidden text-white/60 hover:text-white sm:inline-flex">
              Product
            </Link>
            <Link
              to="/sample-report"
              className="hidden text-white/60 hover:text-white sm:inline-flex"
            >
              Sample report
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin", returnTo: "/app" }}
              className="rounded-md border border-white/15 px-3 py-2 text-white/75 hover:border-primary/50 hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <img
            src="/mia-og.png"
            alt="Abstract glowing guide orb beside an evidence workspace"
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#080b0d_0%,rgba(8,11,13,.92)_34%,rgba(8,11,13,.45)_100%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[.95fr_1.05fr] lg:items-end lg:px-10 lg:py-28">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.22em] text-primary">
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_currentColor]" />{" "}
                A guide, not an operator
              </div>
              <h1 className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[.98] tracking-[-.04em] text-white sm:text-7xl">
                Meet Mia.
                <br />
                <span className="text-primary">Ask better questions.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">
                Mia is the calm layer between a complicated QA workspace and the person trying to
                understand it. She explains what Matrix QA and your selected workspace support, then
                tells you where the underlying evidence lives.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/auth"
                  search={{ mode: "signup", returnTo: "/app" }}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_28px_rgba(139,255,102,.22)]"
                >
                  Ask Mia in the console <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-3 text-sm text-white/80 hover:border-primary/40 hover:text-white"
                >
                  See the run lifecycle
                </Link>
              </div>
            </div>
            <div className="lg:justify-self-end lg:max-w-md">
              <div className="rounded-2xl border border-white/15 bg-black/35 p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">Mia · Guide</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">
                      workspace-aware assistance
                    </p>
                  </div>
                </div>
                <div className="space-y-4 py-5 text-sm leading-6">
                  <p className="ml-8 rounded-2xl rounded-tr-sm bg-primary/10 px-4 py-3 text-white/75">
                    What happened in my latest run?
                  </p>
                  <p className="mr-8 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[.05] px-4 py-3 text-white/75">
                    I can help interpret the selected run’s status, findings, and captured evidence.
                    Open the source report before acting on the answer.
                  </p>
                </div>
                <div className="flex items-center gap-2 border-t border-white/10 pt-4 text-[11px] text-white/45">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Mia does not execute account
                  actions.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0c1112]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">
                  01 / the mental model
                </p>
                <h2 className="mt-4 max-w-sm font-display text-3xl font-medium leading-tight text-white md:text-5xl">
                  Think of Mia as a reading light.
                </h2>
              </div>
              <div className="max-w-3xl space-y-5 text-base leading-8 text-white/62">
                <p>
                  Matrix QA has a lot of moving parts: organizations, workspaces, projects, queued
                  runs, browser actions, findings, artifacts, reports, notifications, and settings.
                  Mia is designed to make that surface easier to understand without quietly turning
                  an explanation into an action.
                </p>
                <p>
                  Her answers are contextual, but they are not omniscient. The signed-in request can
                  include the active workspace, and a run detail page can provide a focused run
                  identifier. That context helps Mia explain the record you are looking at; it does
                  not grant her broader access or authority.
                </p>
                <blockquote className="border-l-2 border-primary pl-5 text-lg leading-8 text-white/85">
                  “She can help you understand the evidence. You remain the person who decides what
                  to do with it.”
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#080b0d]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">
                  02 / capability map
                </p>
                <h2 className="mt-4 font-display text-3xl font-medium text-white md:text-5xl">
                  What Mia can and cannot do.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-white/50">
                The boundary is the feature. A useful guide should be specific about both its reach
                and its restraint.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-2">
              <div className="bg-[#0d1611] p-7 lg:p-9">
                <div className="flex items-center gap-3 text-primary">
                  <Check className="h-5 w-5" />
                  <span className="font-mono text-[10px] uppercase tracking-[.18em]">
                    She can help with
                  </span>
                </div>
                <ul className="mt-7 space-y-5">
                  {canDo.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-7 text-white/70">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#151011] p-7 lg:p-9">
                <div className="flex items-center gap-3 text-red-300">
                  <X className="h-5 w-5" />
                  <span className="font-mono text-[10px] uppercase tracking-[.18em]">
                    She does not
                  </span>
                </div>
                <ul className="mt-7 space-y-5">
                  {cannotDo.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-7 text-white/70">
                      <X className="mt-1 h-4 w-4 shrink-0 text-red-300/80" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0c1112]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">
                  03 / under the hood
                </p>
                <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-white md:text-5xl">
                  Why her answers are bounded.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-7 text-white/55">
                  Mia’s behavior is shaped by the same product boundaries that protect the rest of
                  the console.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-xl border border-white/10 bg-black/20 p-6">
                  <LockKeyhole className="h-5 w-5 text-primary" />
                  <h3 className="mt-5 font-display text-lg text-white">Signed-in context</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    The guide is available inside the authenticated product. Its request is
                    associated with the signed-in user and the selected workspace rather than an
                    anonymous public chat.
                  </p>
                </article>
                <article className="rounded-xl border border-white/10 bg-black/20 p-6">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="mt-5 font-display text-lg text-white">Scoped history</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Conversation history is loaded for the current user and workspace when
                    available. The client keeps the visible history bounded and sanitizes
                    sensitive-looking content before display.
                  </p>
                </article>
                <article className="rounded-xl border border-white/10 bg-black/20 p-6">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="mt-5 font-display text-lg text-white">Focused questions</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Questions about one workspace or one run are more useful than vague prompts. On
                    a run page, Mia can receive the focused run identifier as context.
                  </p>
                </article>
                <article className="rounded-xl border border-white/10 bg-black/20 p-6">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="mt-5 font-display text-lg text-white">Safe by design</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Mia explains and points. She does not execute account actions, browser actions,
                    payments, bookings, destructive workflows, or permission changes.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#080b0d]">
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-10 lg:py-24">
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">
              04 / ask her well
            </p>
            <h2 className="mt-4 font-display text-3xl font-medium text-white md:text-5xl">
              Questions that lead somewhere.
            </h2>
            <div className="mt-10 divide-y divide-white/10 rounded-2xl border border-white/10">
              {MIA_FAQS.map(({ question, answer }) => (
                <details key={question} className="group p-6">
                  <summary className="cursor-pointer list-none pr-8 text-base font-medium text-white marker:hidden group-open:text-primary">
                    {question}
                  </summary>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#101b14]">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10 lg:py-20">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">
                05 / next step
              </p>
              <h2 className="mt-4 max-w-2xl font-display text-3xl font-medium text-white md:text-5xl">
                Open the console. Bring Mia a real question.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                Start with the workspace you already use, ask about a report or run, and then verify
                her explanation against the source evidence. The best Mia workflow is collaborative:
                she helps you orient, while you retain control.
              </p>
            </div>
            <Link
              to="/auth"
              search={{ mode: "signup", returnTo: "/app" }}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Open Matrix QA <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#080b0d]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div className="flex flex-wrap gap-5">
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/cookies" className="hover:text-white">
              Cookies
            </Link>
            <Link to="/faq" className="hover:text-white">
              FAQ
            </Link>
          </div>
          <span>© {new Date().getFullYear()} Matrix QA · Tr Labs</span>
        </div>
      </footer>
    </div>
  );
}
