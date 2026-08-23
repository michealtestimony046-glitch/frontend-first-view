import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileSearch,
  Lock,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { PREVIEW_INCLUSIONS, ROADMAP } from "@/lib/mock-data";
import { LaunchConsoleLink } from "@/components/launch-console-link";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · Matrix QA Preview" },
      {
        name: "description",
        content:
          "Matrix QA is free during Public Preview while we validate the Core Engine. No credit card. Paid plans will be introduced as the product expands.",
      },
      { property: "og:title", content: "Matrix QA · Preview pricing" },
      {
        property: "og:description",
        content:
          "Free during Preview. Starter and Pro plans will be introduced as the product expands.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PricingPage,
});

type ComingPlan = {
  name: string;
  price: string;
  cadence?: string;
  audience: string;
  features: string[];
  cta: string;
}

const comingPlans: ComingPlan[] = [
  {
    name: "Starter",
    price: "$49",
    cadence: "/month",
    audience: "For solo developers and indie builders.",
    features: [
      "Multiple Projects",
      "Project Scanner",
      "Journey Graph",
      "Test Planner",
      "Better Dashboard",
      "Better Evidence",
      "Improved Worker Stability",
    ],
    cta: "Planned",
  },
  {
    name: "Pro",
    price: "$129",
    cadence: "/month",
    audience: "For teams building production software.",
    features: [
      "Everything in Starter",
      "Matrix Simulation",
      "Parallel Browser Workers",
      "Browser × Device × Role Testing",
      "More test capacity",
      "Faster Execution",
    ],
    cta: "Planned",
  },
  {
    name: "Business",
    price: "—",
    audience: "Built for startups and agencies.",
    features: [
      "Organizations",
      "Multiple Workspaces",
      "Team Members",
      "Permissions",
      "Shared test capacity",
      "Higher Concurrency",
    ],
    cta: "Planned",
  },
  {
    name: "Enterprise",
    price: "Custom",
    audience: "For larger engineering organizations.",
    features: [
      "Private Workers",
      "Dedicated Infrastructure",
      "SSO",
      "Audit Logs",
      "Enterprise Security",
      "SLA Support",
    ],
    cta: "Planned · contact sales",
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            <Link to="/" hash="product" className="text-sm text-muted-foreground hover:text-foreground">
              Product
            </Link>
            <Link to="/" hash="evidence" className="text-sm text-muted-foreground hover:text-foreground">
              Evidence
            </Link>
            <Link to="/" hash="roadmap" className="text-sm text-muted-foreground hover:text-foreground">
              Roadmap
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
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
        <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-4xl px-6 pb-14 pt-20 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" />
            Public Preview
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-gradient sm:text-5xl md:text-6xl">
            Matrix QA is free
            <br />
            <span className="text-primary">during Preview.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            We're validating the Core Engine with early developers. No credit
            card. No checkout. Just run scans and help us harden the worker.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {["Browser Worker", "Evidence Capture", "Bug Reports", "Dashboard"].map(
              (c) => (
                <span
                  key={c}
                  className="rounded-full border border-border bg-surface/60 px-2.5 py-1"
                >
                  {c}
                </span>
              ),
            )}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow hover:-translate-y-px"
            >
              Request early access
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/sample-report"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              <FileSearch className="h-4 w-4" />
              See a sample report
            </Link>
          </div>
        </div>
      </section>

      {/* Available today */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <div className="mb-6 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
              Available today
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-primary/[0.04] p-6 shadow-[0_0_0_1px_oklch(0.86_0.18_148/0.25),0_30px_80px_-30px_oklch(0.86_0.18_148/0.35)] md:p-8">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 bg-[radial-gradient(closest-side,oklch(0.86_0.18_148/0.15),transparent)]" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-semibold">
                    Preview
                  </h2>
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary">
                    Current
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Perfect for evaluating the Matrix QA Core Engine.
                </p>
              </div>
              <div className="text-right">
                <div className="font-display text-4xl font-semibold tracking-tight text-foreground">
                  $0
                </div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  during Preview
                </div>
              </div>
            </div>

            <ul className="relative mt-6 grid gap-2 sm:grid-cols-2">
              {PREVIEW_INCLUSIONS.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>

            <div className="relative mt-7 flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow"
              >
                Join Preview
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="max-w-sm text-[11px] text-muted-foreground">
                During Preview, usage limits may change as we improve the platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming next */}
      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Coming next
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold md:text-3xl">
              Paid plans launch alongside the roadmap.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Prices and features shown are directional. Availability tracks the roadmap below.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {comingPlans.map((p) => (
              <div
                key={p.name}
                className="relative flex flex-col rounded-xl border border-border bg-surface/60 p-5"
              >
                <span className="absolute right-3 top-3 rounded-full border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Planned
                </span>
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-semibold text-foreground/80">
                    {p.price}
                  </span>
                  {p.cadence && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.cadence}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{p.audience}</p>
                <ul className="mt-4 flex-1 space-y-1.5 text-xs">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-1.5 text-foreground/70"
                    >
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled
                  className="mt-5 inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-border bg-background/40 px-3 py-2 text-xs font-medium text-muted-foreground"
                >
                  <Lock className="h-3 w-3" />
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap strip */}
      <section id="roadmap" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
              Our roadmap
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold md:text-3xl">
              Available today. More capabilities are planned.
            </h2>
          </div>

          <ol className="mt-8 grid gap-2 sm:grid-cols-2 md:grid-cols-5">
            {ROADMAP.map((r) => (
              <li
                key={r.title}
                className={`rounded-lg border p-3 ${
                  r.current
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-surface/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[11px] font-semibold uppercase tracking-widest ${
                      r.current ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {r.current ? "Available" : "Planned"}
                  </span>
                  {r.current ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                  )}
                </div>
                <div className="mt-1.5 text-sm text-foreground">{r.title}</div>
                {r.current && (
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                    Current
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-5 px-6 py-12">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-primary">Need answers?</span>
            <h2 className="mt-2 font-display text-2xl font-semibold">Read the living FAQ.</h2>
            <p className="mt-1 text-sm text-muted-foreground">Usage, evidence, Preview, and what is planned next.</p>
          </div>
          <Link to="/faq" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent">Open FAQ <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
          <h3 className="font-display text-2xl font-semibold md:text-3xl">
            Ready to see what Matrix QA catches?
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Point Matrix QA at a URL. Get an evidence-grade report back.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow"
            >
              Join Preview
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/sample-report"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              <FileSearch className="h-4 w-4" />
              See a sample report
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground">
          <Logo size={22} />
          <span>© 2026 Matrix QA · Public Preview</span>
        </div>
      </footer>
    </div>
  );
}
