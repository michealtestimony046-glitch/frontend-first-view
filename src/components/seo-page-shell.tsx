import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

type SeoCard = { title: string; body: string };
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
};

const nav = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/automated-browser-testing", label: "Browser testing" },
] as const;

export function SeoPageShell({
  eyebrow,
  title,
  summary,
  intent,
  cards,
  steps,
  sections,
  faqs,
  cta,
}: SeoPageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
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
            <Link
              to="/pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              search={{ mode: "signin", returnTo: "/app" }}
              className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup", returnTo: "/app" }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-px"
            >
              {cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border bg-hero">
          <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
          <div className="relative mx-auto max-w-[1440px] px-6 pb-20 pt-16 lg:px-10 lg:pb-24 lg:pt-20 xl:px-12">
            <div className="max-w-4xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
                {eyebrow}
              </span>
              <h1 className="mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.03] tracking-tight text-gradient sm:text-5xl md:text-7xl">
                {title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                {summary}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/auth"
                  search={{ mode: "signup", returnTo: "/app" }}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow"
                >
                  Run your first scan <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/sample-report"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  See sample evidence
                </Link>
              </div>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {intent}
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10 xl:px-12">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
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
            <div className="max-w-2xl">
              <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
                The workflow
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                From one URL to evidence you can act on.
              </h2>
            </div>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="relative rounded-xl border border-border bg-background/60 p-5"
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
            {sections.map((section) => (
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
          <div className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Questions teams ask
            </div>
            <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-background/60">
              {faqs.map((faq) => (
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
            <Link
              to="/auth"
              search={{ mode: "signup", returnTo: "/app" }}
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow"
            >
              {cta} <ArrowRight className="h-4 w-4" />
            </Link>
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
              <Link to="/terms" className="transition-colors hover:text-primary">
                Terms
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-primary">
                Privacy
              </Link>
              <Link to="/cookies" className="transition-colors hover:text-primary">
                Cookies
              </Link>
              <Link to="/faq" className="transition-colors hover:text-primary">
                FAQ
              </Link>
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
