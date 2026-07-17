import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bug,
  Camera,
  CheckCircle2,
  Clock,
  Cpu,
  FileSearch,
  Github,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { BrowserFrame } from "@/components/browser-frame";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#product" className="text-sm text-muted-foreground hover:text-foreground">
              Product
            </a>
            <a href="#evidence" className="text-sm text-muted-foreground hover:text-foreground">
              Evidence
            </a>
            <a href="#roadmap" className="text-sm text-muted-foreground hover:text-foreground">
              Roadmap
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground md:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Launch console
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              v1 · Core engine now in preview
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-gradient md:text-7xl">
              The QA layer that
              <br />
              <span className="text-primary">runs itself.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              Autonomous browser workers explore your web app, uncover real bugs,
              capture evidence, and generate reports your developers can act on —
              from a single URL.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/app"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow transition-transform hover:-translate-y-px"
              >
                <Play className="h-4 w-4" />
                Run your first test
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                <Github className="h-4 w-4" />
                See how it works
              </a>
            </div>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              no card · no install · one URL is enough
            </p>

            {/* Value strip */}
            <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                "Catch production-breaking bugs before your users do",
                "Cut manual QA time from hours to minutes",
                "Ship with evidence-backed confidence",
              ].map((v) => (
                <div
                  key={v}
                  className="rounded-lg border border-border bg-surface/50 px-3 py-2.5 text-left text-xs text-foreground/80 sm:text-sm"
                >
                  <CheckCircle2 className="mb-1.5 h-3.5 w-3.5 text-primary" />
                  {v}
                </div>
              ))}
            </div>
          </div>

          {/* Hero preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="pointer-events-none absolute -inset-x-16 -top-8 -bottom-8 bg-[radial-gradient(600px_200px_at_50%_0%,var(--primary)/0.2,transparent)]" />
            <div className="relative rounded-2xl border border-border bg-surface/70 p-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
              <HeroConsole />
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="product" className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-primary">
              The core loop
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              One URL in. A full evidence report out.
            </h2>
            <p className="mt-3 text-muted-foreground">
              v1 proves the foundation: sequential browser automation for auth,
              signup, navigation, and forms — with every action captured as
              indisputable evidence.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Cpu,
                title: "Browser worker",
                body: "Sequential automation across login, signup, navigation, and forms.",
              },
              {
                icon: Camera,
                title: "Evidence capture",
                body: "Screenshots, DOM traces, and timestamps streamed to the artifact tier.",
              },
              {
                icon: Terminal,
                title: "Console + network",
                body: "Full runtime telemetry — JS errors, HTTP failures, and warnings.",
              },
              {
                icon: Bug,
                title: "Signal, not noise",
                body: "Deterministic filtering surfaces the bugs developers actually care about.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-xl border border-border bg-surface/60 p-5 transition-colors hover:border-primary/30 hover:bg-surface"
              >
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <f.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-display text-base font-semibold">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evidence showcase */}
      <section id="evidence" className="border-t border-border bg-surface/40">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-primary">
              Evidence-grade reports
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Every bug shipped with proof.
            </h2>
            <p className="mt-4 text-muted-foreground">
              No screenshots-only. No log dumps. Every finding ties a screenshot
              to the console line, the network call, and the exact millisecond it
              happened. Reproducibility is the default.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Time-synced screenshots at every meaningful state change",
                "Full console stream with source file + line references",
                "Network waterfall with status, latency, and payload size",
                "Deterministic severity — hard errors vs. background warnings",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-foreground/80">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <BrowserFrame url="app.acme.dev/checkout">
            <MiniCheckoutError />
          </BrowserFrame>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                Roadmap
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                We're shipping the matrix, one layer at a time.
              </h2>
            </div>
            <span className="rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Public build in progress
            </span>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                tag: "v1 · now",
                title: "Core engine proof",
                body: "Sequential worker, evidence capture, dashboard report.",
                accent: true,
              },
              {
                tag: "v2 · next",
                title: "Application mapping",
                body: "Project scanner, journey graph, safety policy engine.",
              },
              {
                tag: "v3",
                title: "Matrix simulation",
                body: "Roles × viewports × environments in parallel.",
              },
              {
                tag: "v4+",
                title: "Repair packages",
                body: "AI-authored fix bundles routed straight to your coding agent.",
              },
            ].map((s) => (
              <li
                key={s.tag}
                className={`relative rounded-xl border p-5 ${
                  s.accent
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-surface/50"
                }`}
              >
                <span
                  className={`font-mono text-[11px] uppercase tracking-wider ${
                    s.accent ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {s.tag}
                </span>
                <h3 className="mt-2 font-display text-base font-semibold">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="border-t border-border bg-hero">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-4 font-display text-4xl font-semibold text-gradient md:text-5xl">
            Ship without shipping bugs.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Join the early developer cohort. v1 is free while we prove the engine.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow"
            >
              <Zap className="h-4 w-4" />
              Get early access
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Open the console
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 md:flex-row">
          <Logo />
          <p className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} Matrix QA · Autonomous QA infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
}

function HeroConsole() {
  return (
    <div className="grid gap-2 rounded-xl bg-background/80 p-3 md:grid-cols-[1.2fr_1fr]">
      <BrowserFrame url="app.acme.dev">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-primary to-primary/40" />
              <span className="font-display text-sm font-semibold">Acme</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>Products</span>
              <span>Pricing</span>
              <span>Docs</span>
              <span className="rounded bg-primary px-2 py-0.5 text-primary-foreground">
                Sign in
              </span>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="h-3 w-2/3 rounded bg-foreground/80" />
            <div className="h-3 w-1/2 rounded bg-foreground/40" />
          </div>
          <div className="mt-4 grid flex-1 grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded border border-border bg-surface p-2"
              >
                <div className="h-1.5 w-2/3 rounded bg-foreground/60" />
                <div className="mt-1.5 h-1 w-full rounded bg-foreground/20" />
                <div className="mt-1 h-1 w-4/5 rounded bg-foreground/20" />
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute right-4 top-14 flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary shadow-lg">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            worker running · step 4 / 12
          </div>
        </div>
      </BrowserFrame>

      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-3 py-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              live evidence
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            run_9f2c
          </span>
        </div>
        <div className="flex-1 space-y-1.5 p-3 font-mono text-[11px] leading-relaxed">
          <Line t="00:00" c="text-muted-foreground">
            worker boot · chromium 128
          </Line>
          <Line t="00:04" c="text-foreground">
            GET / <span className="text-success">200</span> 84ms
          </Line>
          <Line t="00:06" c="text-foreground">
            click "Sign up" <span className="text-muted-foreground">a.cta</span>
          </Line>
          <Line t="00:08" c="text-foreground">
            fill signup form · 6 fields
          </Line>
          <Line t="00:11" c="text-warning">
            warn: key prop missing &lt;OrderRow /&gt;
          </Line>
          <Line t="00:14" c="text-foreground">
            POST /api/checkout/quote{" "}
            <span className="text-destructive">500</span> 612ms
          </Line>
          <Line t="00:14" c="text-destructive">
            error: Cannot read properties of undefined (reading 'total')
          </Line>
          <Line t="00:15" c="text-primary">
            ● bug captured · CheckoutSummary.tsx:41
          </Line>
        </div>
      </div>
    </div>
  );
}

function Line({
  t,
  c,
  children,
}: {
  t: string;
  c: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="w-10 shrink-0 text-muted-foreground/70">{t}</span>
      <span className={c}>{children}</span>
    </div>
  );
}

function MiniCheckoutError() {
  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      <div className="flex-1 p-5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 rounded bg-foreground/70" />
          <div className="flex gap-2">
            <div className="h-5 w-14 rounded bg-foreground/30" />
            <div className="h-5 w-14 rounded bg-foreground/30" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 w-1/2 rounded bg-foreground/60" />
            <div className="h-8 rounded border border-border bg-surface" />
            <div className="h-8 rounded border border-border bg-surface" />
            <div className="h-8 rounded border border-border bg-surface" />
          </div>
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <Bug className="h-4 w-4" />
              <span className="font-mono text-xs">TypeError</span>
            </div>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-foreground/80">
              Cannot read properties of undefined (reading 'total')
              <br />
              at CheckoutSummary.tsx:41
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-border bg-surface px-4 py-2 font-mono text-[10px] text-muted-foreground">
        captured at 00:02.611 · run_9f2c
      </div>
    </div>
  );
}
