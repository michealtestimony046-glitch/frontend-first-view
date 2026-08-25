import { ArrowRight, CheckCircle2, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

type SeoCard = { title: string; body: string };
export type SeoPageVariant = "standard" | "editorial" | "split" | "terminal";
type SeoPageShellProps = {
  eyebrow: string;
  title: ReactNode;
  summary: string;
  intent: string;
  cards: SeoCard[];
  steps: SeoCard[];
  sections: { title: string; body: ReactNode }[];
  faqs: { question: string; answer: string }[];
  cta: string;
  variant?: SeoPageVariant;
};

const nav = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/automated-browser-testing", label: "Browser testing" },
] as const;

const relatedGuides = [
  { to: "/end-to-end-testing", label: "End-to-end testing" },
  { to: "/ci-cd-testing", label: "CI/CD testing" },
  { to: "/visual-regression-testing", label: "Visual regression" },
  { to: "/evidence-based-bug-reports", label: "Evidence-based reports" },
  { to: "/authentication-testing", label: "Authentication testing" },
  { to: "/accessibility-testing", label: "Accessibility testing" },
  { to: "/cross-browser-testing", label: "Cross-browser testing" },
  { to: "/playwright-testing", label: "Playwright testing" },
  { to: "/qa-for-saas", label: "QA for SaaS" },
  { to: "/qa-for-startups", label: "QA for startups" },
  { to: "/mia", label: "Meet Mia" },
] as const;

function PrimaryAction({ label }: { label: string }) {
  return (
    <Link
      to="/auth"
      search={{ mode: "signup", returnTo: "/app" }}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function Hero({ props, variant }: { props: SeoPageShellProps; variant: SeoPageVariant }) {
  if (variant === "editorial") {
    return (
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-16 lg:grid-cols-[1.15fr_.85fr] lg:px-10 lg:py-24 xl:px-12">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              {props.eyebrow}
            </span>
            <h1 className="mt-5 max-w-4xl font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
              {props.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              {props.summary}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryAction label={props.cta} />
              <Link
                to="/sample-report"
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm hover:bg-accent"
              >
                Read the sample report <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <aside className="self-end rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 lg:mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Search intent
            </p>
            <p className="mt-3 text-xl leading-8 text-foreground">{props.intent}</p>
            <div className="mt-8 border-t border-primary/15 pt-5 text-sm leading-6 text-muted-foreground">
              A practical guide for teams that need a clear next action, not generic testing copy.
            </div>
          </aside>
        </div>
      </section>
    );
  }
  if (variant === "split") {
    return (
      <section className="relative overflow-hidden border-b border-border bg-hero">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto grid max-w-[1440px] gap-12 px-6 py-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-10 lg:py-24 xl:px-12">
          <div>
            <span className="inline-flex rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              {props.eyebrow}
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.03] tracking-tight text-gradient sm:text-5xl md:text-7xl">
              {props.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              {props.summary}
            </p>
            <div className="mt-8">
              <PrimaryAction label={props.cta} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {props.cards.slice(0, 4).map((card, index) => (
              <article
                key={card.title}
                className="rounded-lg border border-border bg-background/70 p-5"
              >
                <span className="font-mono text-xs text-primary">0{index + 1}</span>
                <h2 className="mt-8 font-display text-base font-semibold">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }
  if (variant === "terminal") {
    return (
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-16 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-10 lg:py-24 xl:px-12">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              {props.eyebrow}
            </span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
              {props.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              {props.summary}
            </p>
            <div className="mt-8">
              <PrimaryAction label={props.cta} />
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-primary/25 bg-[#07100d] font-mono text-xs shadow-[0_0_60px_rgba(117,255,108,.08)]">
            <div className="flex items-center gap-2 border-b border-primary/15 px-4 py-3 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-red-400/80" />
              <span className="h-2 w-2 rounded-full bg-yellow-300/80" />
              <span className="h-2 w-2 rounded-full bg-primary/80" />
              <span className="ml-2">matrixqa / run-preview</span>
            </div>
            <div className="space-y-4 p-5 leading-6">
              <p className="text-primary">$ matrixqa inspect --target authorized-url</p>
              <p className="text-foreground/80">
                [01] browser session initialized
                <br />
                [02] journey instructions loaded
                <br />
                [03] evidence capture active
              </p>
              <p className="text-primary">✓ {props.intent}</p>
              <p className="text-muted-foreground">
                report → screenshots · console · network · timestamps
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="relative overflow-hidden border-b border-border bg-hero">
      <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
      <div className="relative mx-auto max-w-[1440px] px-6 pb-20 pt-16 lg:px-10 lg:pb-24 lg:pt-20 xl:px-12">
        <div className="max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
            {props.eyebrow}
          </span>
          <h1 className="mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.03] tracking-tight text-gradient sm:text-5xl md:text-7xl">
            {props.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            {props.summary}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryAction label={props.cta} />
            <Link
              to="/sample-report"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              See sample evidence
            </Link>
          </div>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {props.intent}
          </p>
        </div>
      </div>
    </section>
  );
}

export function SeoPageShell(props: SeoPageShellProps) {
  const variant = props.variant ?? "standard";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-10 xl:px-12">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary navigation">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              search={{ mode: "signin", returnTo: "/app" }}
              className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
            <PrimaryAction label={props.cta} />
          </div>
        </div>
      </header>
      <main>
        <Hero props={props} variant={variant} />
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10 xl:px-12">
            <div
              className={`grid gap-4 ${variant === "editorial" ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"}`}
            >
              {props.cards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-xl border border-border bg-surface/55 p-5 transition-colors hover:border-primary/35 hover:bg-surface"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <h2 className="mt-4 font-display text-base font-semibold">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="border-b border-border bg-surface/30">
          <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10 xl:px-12">
            <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
              The workflow
            </span>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold md:text-4xl">
              From one URL to evidence you can act on.
            </h2>
            <ol
              className={`mt-10 grid gap-4 ${variant === "terminal" ? "lg:grid-cols-[1.2fr_.8fr]" : "md:grid-cols-3"}`}
            >
              {props.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-border bg-background/60 p-5"
                >
                  <span className="font-mono text-xs text-primary">0{index + 1}</span>
                  <h3 className="mt-5 font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="border-b border-border">
          <div className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
            {props.sections.map((section) => (
              <article
                key={section.title}
                className="border-b border-border py-8 first:pt-0 last:border-0"
              >
                <h2 className="font-display text-2xl font-semibold md:text-3xl">{section.title}</h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                  {section.body}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="border-b border-border bg-surface/30">
          <div className="mx-auto max-w-4xl px-6 py-14 lg:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
                  Explore the QA library
                </span>
                <h2 className="mt-3 font-display text-2xl font-semibold md:text-3xl">
                  Find the testing guide that matches your next question.
                </h2>
              </div>
              <Link to="/features" className="text-sm text-primary hover:underline">
                View all capabilities
              </Link>
            </div>
            <nav
              aria-label="Related testing guides"
              className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
            >
              {relatedGuides.map((guide) => (
                <Link
                  key={guide.to}
                  to={guide.to}
                  className="rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
                >
                  {guide.label}
                </Link>
              ))}
            </nav>
          </div>
        </section>
        <section className="border-b border-border bg-surface/30">
          <div className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Questions teams ask
            </div>
            <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-background/60">
              {props.faqs.map((faq) => (
                <details key={faq.question} className="group p-5">
                  <summary className="cursor-pointer list-none pr-8 font-display text-base font-semibold marker:hidden group-open:text-primary">
                    {faq.question}
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-hero">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center lg:px-10">
            <h2 className="font-display text-3xl font-semibold text-gradient md:text-4xl">
              Turn your next deploy into a proof, not a guess.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Start with one authorized URL. Matrix QA walks the journey and returns the evidence
              your team needs to decide what ships.
            </p>
            <div className="mt-8">
              <PrimaryAction label={props.cta} />
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between lg:px-10 xl:px-12">
          <Logo />
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6 md:items-end">
            <nav
              className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
              aria-label="Legal navigation"
            >
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/cookies">Cookies</Link>
              <Link to="/faq">FAQ</Link>
            </nav>
            <p className="font-mono text-xs text-muted-foreground">
              © {new Date().getFullYear()} Matrix QA · Tr Labs
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
