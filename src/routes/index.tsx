import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bug,
  Camera,
  CheckCircle2,
  Clock,
  Cpu,
  FileSearch,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { BrowserFrame } from "@/components/browser-frame";
import { LaunchConsoleLink } from "@/components/launch-console-link";
import { canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [canonicalLink("/")],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-6 lg:px-10 xl:px-12">
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
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground md:hidden"
            >
              Pricing
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin", returnTo: "/app" }}
              className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground md:inline-flex"
            >
              Already a user? Sign in
            </Link>
            <LaunchConsoleLink className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl border border-primary/35 bg-primary/80 px-2.5 py-2 text-xs font-semibold text-primary-foreground shadow-[0_10px_28px_-18px_rgba(0,0,0,0.95)] backdrop-blur-md transition-opacity hover:bg-primary/90 sm:gap-1.5 sm:rounded-md sm:px-3 sm:py-1.5 sm:text-sm" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-[1440px] px-6 pb-20 pt-16 sm:px-8 md:pt-24 lg:px-10 lg:pt-28 xl:px-12">
          <div className="mx-auto max-w-5xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Public Preview · Autonomous QA Worker
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-gradient sm:text-5xl md:text-7xl lg:text-7xl xl:text-8xl">
              Proof your app works.
              <br />
              <span className="text-primary">Every deploy.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base text-muted-foreground md:text-lg">
              Matrix QA walks your critical user journeys — login, signup, navigation, forms — and
              streams screenshots, console logs, network activity, and timestamps into an
              evidence-grade report. Deterministic. Multi-tenant. Built for developers.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup", returnTo: "/app" }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow transition-transform hover:-translate-y-px"
              >
                <Play className="h-4 w-4" />
                Run your first scan
              </Link>
              <Link
                to="/sample-report"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                <FileSearch className="h-4 w-4" />
                See a sample report
              </Link>
            </div>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              no card · no install · one URL is enough
            </p>

            {/* Value strip — four product pillars */}
            <div className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  t: "Core journeys, automated",
                  b: "Login, signup, navigation, forms — walked sequentially.",
                },
                {
                  t: "Raw diagnostic evidence",
                  b: "Screenshots, console, network, timestamps — streamed live.",
                },
                {
                  t: "Deterministic quality filter",
                  b: "Only hard errors: uncaught JS, non-2xx/3xx, failed selectors.",
                },
                {
                  t: "Multi-tenant by design",
                  b: "Every run isolated behind strict workspace UUID guards.",
                },
              ].map((v) => (
                <div
                  key={v.t}
                  className="rounded-lg border border-border bg-surface/50 p-3 text-left"
                >
                  <CheckCircle2 className="mb-2 h-4 w-4 text-primary" />
                  <div className="text-sm font-semibold text-foreground">{v.t}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{v.b}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero preview */}
          <div className="relative mx-auto mt-16 max-w-6xl">
            <div className="pointer-events-none absolute -inset-x-16 -top-8 -bottom-8 bg-[radial-gradient(600px_200px_at_50%_0%,var(--primary)/0.2,transparent)]" />
            <div className="relative rounded-2xl border border-border bg-surface/70 p-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
              <HeroConsole />
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="product" className="border-t border-border bg-background">
        <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10 xl:px-12">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-primary">
              The core loop
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              One URL in. A full evidence report out.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Matrix QA’s core workflow walks auth, signup, navigation, and forms with every action
              captured as indisputable evidence.
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
                <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evidence showcase */}
      <section id="evidence" className="border-t border-border bg-surface/40">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-24 lg:grid-cols-[1.1fr_1fr] lg:px-10 lg:items-center xl:px-12">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-primary">
              Evidence-grade reports
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Every bug shipped with proof.
            </h2>
            <p className="mt-4 text-muted-foreground">
              No screenshots-only. No log dumps. Every finding ties a screenshot to the console
              line, the network call, and the exact millisecond it happened. Reproducibility is the
              default.
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

      {/* How it works */}
      <section id="how" className="border-t border-border bg-background">
        <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10 xl:px-12">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-primary">
              How it works
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Three steps. One evidence-backed report.
            </h2>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: ArrowRight,
                title: "Enter your app's URL",
                body: "Point Matrix QA at any staging or production URL. No install, no config.",
              },
              {
                n: "02",
                icon: Cpu,
                title: "The worker walks your journeys",
                body: "Login, signup, navigation, and forms — walked sequentially in a real browser.",
              },
              {
                n: "03",
                icon: FileSearch,
                title: "Review an evidence-backed report",
                body: "Every hard failure ships with screenshots, console logs, and network traces attached.",
              },
            ].map((s) => (
              <li key={s.n} className="relative rounded-xl border border-border bg-surface/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    step {s.n}
                  </span>
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>

          {/* What Matrix QA catches */}
          <div className="mt-14">
            <div className="mb-4 flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
                What Matrix QA catches
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Uncaught JS exceptions",
                  body: "Runtime errors that crash the page — captured with stack trace + source ref.",
                  code: "TypeError: Cannot read properties of undefined (reading 'total')",
                },
                {
                  title: "Non-2xx / 3xx responses",
                  body: "Server failures on any request the worker triggers, with timing and payload size.",
                  code: "POST /api/checkout/quote  →  500  612ms",
                },
                {
                  title: "Failed selectors",
                  body: "Critical-path elements that vanish, move, or never render.",
                  code: "waiting for [data-cta='signup']  →  timeout 5000ms",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="min-w-0 rounded-xl border border-border bg-surface/50 p-5"
                >
                  <h3 className="font-display text-base font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
                  <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-background/60 p-2.5 font-mono text-[11px] leading-relaxed text-destructive">
                    {f.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Trust one-liner */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl border border-border bg-surface/40 px-5 py-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {[
              "Built with Playwright",
              "Deterministic evidence",
              "Workspace-isolated",
              "No browser extensions",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10 xl:px-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                Roadmap
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                What's live today — and what's coming next.
              </h2>
            </div>
            <span className="rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Public build in progress
            </span>
          </div>

          {/* Available now */}
          <div className="mt-10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
                Available now
              </span>
            </div>
            <ol className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Cpu,
                  title: "Browser Worker",
                  body: "Sequential automation across login, signup, navigation, and forms.",
                },
                {
                  icon: Camera,
                  title: "Evidence Capture",
                  body: "Screenshots, console logs, and network traces synced to every action.",
                },
                {
                  icon: FileSearch,
                  title: "Dashboard Reports",
                  body: "Findings ranked by severity, tied to reproducible evidence.",
                },
              ].map((s) => (
                <li
                  key={s.title}
                  className="relative rounded-xl border border-primary/40 bg-primary/5 p-5"
                >
                  <div className="flex items-center justify-between">
                    <s.icon className="h-4 w-4 text-primary" />
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                      Live
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Coming next */}
          <div className="mt-12">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Coming next
              </span>
            </div>
            <ol className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                {
                  tag: "Planned",
                  title: "Application Mapping",
                  body: "Project scanner, journey graph, and safety policy engine.",
                },
                {
                  tag: "Planned",
                  title: "Matrix Simulation",
                  body: "Roles × viewports × environments explored in parallel.",
                },
                {
                  tag: "Planned",
                  title: "Repair Packages",
                  body: "Fix bundles routed to your coding agent.",
                },
              ].map((s) => (
                <li
                  key={`${s.title}-${s.tag}`}
                  className="relative rounded-xl border border-border bg-surface/40 p-5"
                >
                  <div className="flex items-center justify-between">
                    <Rocket className="h-4 w-4 text-muted-foreground" />
                    <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="border-t border-border bg-hero">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center lg:px-10 xl:px-12">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-4 font-display text-4xl font-semibold text-gradient md:text-5xl">
            Ship without shipping bugs.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Join the early developer cohort. Matrix QA is free during Preview while we prove the
            engine.
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
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between lg:px-10 xl:px-12">
          <Logo />
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6 md:items-end">
            <nav
              className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
              aria-label="Legal navigation"
            >
              <Link to="/terms" className="transition-colors hover:text-primary">
                Terms of Service
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-primary">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="transition-colors hover:text-primary">
                Cookie Policy
              </Link>
              <a href="mailto:support@trlabs.tech" className="transition-colors hover:text-primary">
                Contact
              </a>
            </nav>
            <p className="font-mono text-xs text-muted-foreground">
              © {new Date().getFullYear()} Matrix QA · Autonomous QA infrastructure
            </p>
          </div>
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
              <div key={i} className="rounded border border-border bg-surface p-2">
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
          <span className="font-mono text-[10px] text-muted-foreground">run_9f2c</span>
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
            POST /api/checkout/quote <span className="text-destructive">500</span> 612ms
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

function Line({ t, c, children }: { t: string; c: string; children: React.ReactNode }) {
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
