import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  FileSearch,
  Gauge,
  Lock,
  Loader2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { LaunchConsoleLink } from "@/components/launch-console-link";
import {
  AUTH_EVENT,
  creditsApi,
  getAuthToken,
  organizationsApi,
  plansApi,
  type EffectivePlanResponse,
  type MatrixUnitTopUpCatalog,
  type PublicPlan,
} from "@/lib/api-client";
import { seoHead } from "@/lib/seo";

const pricingFaqs = [
  {
    question: "What does Free include?",
    answer:
      "Free includes 150 Matrix Units each month, Quick Scan-oriented preflight, Quick Smoke browser testing, one logical worker, basic evidence, and 90-day retention. Paid capabilities remain visible as upgrade paths rather than disappearing from the page.",
  },
  {
    question: "What does Starter unlock?",
    answer:
      "Starter is $49 per month with 980 Matrix Units, Quick Smoke, Standard Adaptive multi-viewport testing, and governed collaboration with up to five logical worker slots. Actual browser concurrency remains subject to run policy and available infrastructure.",
  },
  {
    question: "Is a run charged at one fixed price?",
    answer:
      "No. Matrix QA reserves a bounded amount before execution, then meters authoritative work as it is observed. Unused reserve is released during settlement, and qualifying infrastructure failures receive correction treatment.",
  },
  {
    question: "Can I buy a top-up today?",
    answer:
      "The current catalog is display-only. Checkout is not enabled until an approved payment integration is connected, so the pricing page never implies that a payment or balance addition has happened.",
  },
] satisfies { question: string; answer: string }[];

const publicTopUpPackages = [
  { id: "mu-250", matrixUnits: 250, priceUsd: 12.5 },
  { id: "mu-500", matrixUnits: 500, priceUsd: 25 },
  { id: "mu-1000", matrixUnits: 1000, priceUsd: 50 },
  { id: "mu-2500", matrixUnits: 2500, priceUsd: 125 },
];

type Feature = { label: string; locked?: string; href?: string };
type PricingPlan = {
  id: PublicPlan;
  name: string;
  price: string;
  cadence?: string;
  audience: string;
  description: string;
  features: Feature[];
  accent: string;
  badge?: string;
};

const pricingPlans: PricingPlan[] = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    cadence: "/month",
    audience: "A practical first signal for one important journey.",
    description: "Start with bounded browser evidence before you commit to broader coverage.",
    accent: "border-border bg-surface/55",
    features: [
      { label: "150 ⟐ each month" },
      { label: "Quick Scan-oriented preflight" },
      { label: "Quick Smoke browser testing" },
      { label: "1 logical worker" },
      { label: "Basic evidence and report" },
      { label: "90-day retention" },
      {
        label: "Standard Adaptive",
        locked: "Upgrade to Starter",
        href: "/learn/standard-adaptive-testing",
      },
      {
        label: "Five-worker collaboration",
        locked: "Upgrade to Starter",
        href: "/learn/five-worker-qa-collaboration",
      },
    ],
  },
  {
    id: "STARTER",
    name: "Starter",
    price: "$49",
    cadence: "/month",
    audience: "For teams ready to investigate across the viewport matrix.",
    description: "The launch tier for adaptive coverage, more usage, and governed collaboration.",
    accent:
      "border-primary/55 bg-primary/[0.06] shadow-[0_30px_80px_-40px_oklch(0.86_0.18_148/0.6)]",
    badge: "Launch tier",
    features: [
      { label: "980 ⟐ each month" },
      { label: "Quick Scan + Quick Smoke" },
      { label: "Standard Adaptive multi-viewport testing" },
      { label: "Up to 5 logical worker slots" },
      { label: "Coordinator-led delegation and handoffs" },
      { label: "Shared coverage and independent reproduction" },
      { label: "AI failure analysis on supported findings" },
      { label: "Decision-based live usage metering" },
      { label: "Longer retention than Free" },
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "Coming soon",
    audience: "For larger teams that need a broader commercial capacity plan.",
    description:
      "Planned commercial expansion; no unsupported price or feature promise is made today.",
    accent: "border-border bg-surface/35",
    features: [
      {
        label: "Deep Matrix",
        locked: "Available to alpha, staff, and admin during MVP",
        href: "/learn/standard-adaptive-testing",
      },
      { label: "Larger team capacity", locked: "Coming soon" },
      { label: "Commercial billing controls", locked: "Coming soon" },
    ],
  },
];

export const Route = createFileRoute("/pricing")({
  head: () =>
    seoHead({
      title: "Matrix QA Pricing | Free and Starter Browser QA Plans",
      description:
        "Compare Matrix QA Free and Starter plans, Matrix Unit allowances, Quick Smoke and Standard Adaptive browser testing, governed worker collaboration, and transparent top-up groundwork.",
      path: "/pricing",
      faqItems: pricingFaqs,
    }),
  component: PricingPage,
});

function toMessage(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message.trim() ? cause.message : fallback;
}

function planLabel(plan: EffectivePlanResponse) {
  if (plan.accessSource === "ALPHA") return "Alpha access";
  if (plan.accessSource === "ADMIN") return "Admin access";
  if (plan.accessSource === "STAFF") return "Staff access";
  return `${plan.plan[0]}${plan.plan.slice(1).toLowerCase()} plan`;
}

function UpgradeAction({
  planId,
  currentPlan,
}: {
  planId: PublicPlan;
  currentPlan: PublicPlan | null;
}) {
  if (currentPlan === planId) {
    return (
      <Link
        to="/app"
        className="inline-flex items-center justify-center gap-2 rounded-md border border-primary/35 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15"
      >
        Open your workspace <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }
  if (planId === "FREE") {
    return (
      <Link
        to="/auth"
        search={{ mode: "signup", returnTo: "/app" }}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background/70 px-4 py-2.5 text-sm font-semibold hover:bg-accent"
      >
        Start free <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }
  if (planId === "STARTER") {
    return (
      <Link
        to="/app/settings/billing"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow hover:-translate-y-px"
      >
        Upgrade to Starter <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }
  return (
    <Link
      to="/learn/standard-adaptive-testing"
      className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background/70 px-4 py-2.5 text-sm font-semibold hover:bg-accent"
    >
      Explore the launch boundary <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function FeatureLine({ feature, included }: { feature: Feature; included: boolean }) {
  if (included && !feature.locked) {
    return (
      <li className="flex items-start gap-2 text-sm text-foreground/90">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>{feature.label}</span>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2 text-sm text-muted-foreground">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
      <span>
        <span className="text-foreground/75">{feature.label}</span>
        <span className="ml-1.5 font-medium text-primary">
          — {feature.locked ?? "Available on a higher tier"}
        </span>
        {feature.href ? (
          <Link
            to={feature.href}
            className="ml-1.5 underline underline-offset-4 hover:text-foreground"
          >
            Learn why
          </Link>
        ) : null}
      </span>
    </li>
  );
}

function PricingCard({ plan, currentPlan }: { plan: PricingPlan; currentPlan: PublicPlan | null }) {
  const isCurrent = currentPlan === plan.id;
  const included = plan.id === "FREE" || plan.id === "STARTER";
  return (
    <article className={`relative flex flex-col rounded-2xl border p-6 ${plan.accent}`}>
      {plan.badge ? (
        <span className="absolute right-4 top-4 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
          {plan.badge}
        </span>
      ) : null}
      <div className="flex items-center gap-2">
        <h2 className="font-display text-2xl font-semibold">{plan.name}</h2>
        {isCurrent ? (
          <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary">
            Current plan
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex min-h-12 items-end gap-1">
        <span className="font-display text-4xl font-semibold tracking-tight">{plan.price}</span>
        {plan.cadence ? (
          <span className="mb-1 font-mono text-xs text-muted-foreground">{plan.cadence}</span>
        ) : null}
      </div>
      <p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">{plan.audience}</p>
      <p className="mt-4 text-sm leading-6 text-foreground/85">{plan.description}</p>
      <ul className="mt-6 flex-1 space-y-3 border-t border-border/70 pt-5">
        {plan.features.map((feature) => (
          <FeatureLine key={feature.label} feature={feature} included={included} />
        ))}
      </ul>
      <div className="mt-7">
        <UpgradeAction planId={plan.id} currentPlan={currentPlan} />
      </div>
      {plan.id === "STARTER" ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Checkout is not enabled yet. The billing route is the honest next step rather than a
          simulated payment.
        </p>
      ) : null}
    </article>
  );
}

function PricingPage() {
  const [signedIn, setSignedIn] = useState(() => Boolean(getAuthToken()));
  const [effectivePlan, setEffectivePlan] = useState<EffectivePlanResponse | null>(null);
  const [topUps, setTopUps] = useState<MatrixUnitTopUpCatalog | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    const onAuthChange = () => setSignedIn(Boolean(getAuthToken()));
    window.addEventListener(AUTH_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_EVENT, onAuthChange);
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setEffectivePlan(null);
      setTopUps(null);
      setAccountName(null);
      setPlanError(null);
      return;
    }
    let cancelled = false;
    setPlanLoading(true);
    setPlanError(null);
    organizationsApi
      .list()
      .then(async (organizations) => {
        const stored = localStorage.getItem("matrix_qa_active_organization");
        const organization = organizations.find((item) => item.id === stored) ?? organizations[0];
        if (organization) localStorage.setItem("matrix_qa_active_organization", organization.id);
        const [plan, catalog] = await Promise.all([
          plansApi.effective(organization?.id),
          creditsApi.topUpOptions().catch(() => null),
        ]);
        if (cancelled) return;
        setAccountName(organization?.name ?? null);
        setEffectivePlan(plan);
        setTopUps(catalog);
      })
      .catch((cause) => {
        if (!cancelled) setPlanError(toMessage(cause, "Your plan could not be loaded right now."));
      })
      .finally(() => {
        if (!cancelled) setPlanLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const currentPlan = effectivePlan?.plan ?? null;
  const packages = topUps?.packages ?? publicTopUpPackages;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-10 xl:px-12">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
            <Link
              to="/"
              hash="product"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Product
            </Link>
            <Link
              to="/"
              hash="evidence"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Evidence
            </Link>
            <Link
              to="/learn/matrix-units"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Learn
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              search={{ mode: "signin", returnTo: "/app" }}
              className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              Already a user? Sign in
            </Link>
            <LaunchConsoleLink className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl border border-primary/35 bg-primary/80 px-2.5 py-2 text-xs font-semibold text-primary-foreground shadow-[0_10px_28px_-18px_rgba(0,0,0,0.95)] backdrop-blur-md transition-opacity hover:bg-primary/90 sm:gap-1.5 sm:rounded-md sm:px-3 sm:py-1.5 sm:text-sm" />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-hero">
          <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-20 text-center md:pb-20 md:pt-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" />
              Launch pricing
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.04] tracking-tight text-gradient sm:text-5xl md:text-7xl">
              Start small. See more when the evidence calls for it.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
              Free gives you a real, bounded browser signal. Starter adds 980 ⟐, multi-viewport
              Standard Adaptive testing, and governed five-worker collaboration without hiding what
              Free users can unlock next.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup", returnTo: "/app" }}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground btn-primary-glow hover:-translate-y-px"
              >
                Start with Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/learn/matrix-units"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 px-5 py-3 text-sm font-semibold hover:bg-accent"
              >
                How Matrix Units work <BookOpen className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {signedIn ? (
          <section className="border-b border-border bg-primary/[0.04]" aria-live="polite">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-10 xl:px-12">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-primary">
                  Your workspace access
                </p>
                {planLoading ? (
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading your effective plan…
                  </p>
                ) : effectivePlan ? (
                  <p className="mt-2 text-sm text-foreground">
                    {accountName ? `${accountName} · ` : ""}
                    <strong>{planLabel(effectivePlan)}</strong> · {effectivePlan.monthlyMu} ⟐/month
                    · {effectivePlan.maxLogicalWorkers} logical worker
                    {effectivePlan.maxLogicalWorkers === 1 ? "" : "s"}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sign in to see organization-specific access and allowance.
                  </p>
                )}
                {planError ? (
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{planError}</p>
                ) : null}
              </div>
              {effectivePlan ? (
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 rounded-md border border-primary/35 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"
                >
                  Open workspace <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20 xl:px-12">
            <div className="max-w-3xl">
              <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
                Compare plans
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                A visible upgrade path, not a hidden feature list.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Every tier shows what it includes and what remains locked. Backend entitlements
                enforce the same boundary when a run starts.
              </p>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <PricingCard key={plan.id} plan={plan} currentPlan={currentPlan} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface/30">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[.75fr_1.25fr] lg:px-10 lg:py-20 xl:px-12">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
                What the tiers mean
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                Choose the smallest useful proof.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Matrix QA is designed to make the next investigation legible: a bounded smoke result
                first, adaptive coverage when the question deserves it, and a live usage signal
                instead of a fictional fixed quote.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-xl border border-border bg-background/65 p-5">
                <Gauge className="h-5 w-5 text-primary" />
                <h3 className="mt-5 font-display text-lg font-semibold">Measured usage</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A reserve protects the run; measured work determines the final charge.
                </p>
              </article>
              <article className="rounded-xl border border-border bg-background/65 p-5">
                <UsersRound className="h-5 w-5 text-primary" />
                <h3 className="mt-5 font-display text-lg font-semibold">Governed collaboration</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Named worker dialogue, capacity, leases, handoffs, and evidence stay visible in
                  the Run Console.
                </p>
              </article>
              <article className="rounded-xl border border-border bg-background/65 p-5">
                <FileSearch className="h-5 w-5 text-primary" />
                <h3 className="mt-5 font-display text-lg font-semibold">Evidence first</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A finding should remain tied to the journey, viewport, timing, and artifact that
                  support it.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20 xl:px-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
                  Learn before you run
                </span>
                <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                  Short guides for the terms on this page.
                </h2>
              </div>
              <Link to="/faq" className="text-sm font-semibold text-primary hover:underline">
                Open pricing FAQ <ArrowRight className="ml-1 inline h-4 w-4" />
              </Link>
            </div>
            <nav
              aria-label="Pricing and product learning guides"
              className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <Link
                to="/learn/matrix-units"
                className="rounded-xl border border-border bg-surface/55 p-5 hover:border-primary/40"
              >
                <span className="font-mono text-xs text-primary">01</span>
                <h3 className="mt-4 font-display text-lg font-semibold">How Matrix Units work</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Understand holds, live drainage, final settlement, and failed-run treatment.
                </p>
              </Link>
              <Link
                to="/learn/quick-smoke-testing"
                className="rounded-xl border border-border bg-surface/55 p-5 hover:border-primary/40"
              >
                <span className="font-mono text-xs text-primary">02</span>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  Quick Smoke browser testing
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Start with one bounded journey and a clear evidence question.
                </p>
              </Link>
              <Link
                to="/learn/standard-adaptive-testing"
                className="rounded-xl border border-border bg-surface/55 p-5 hover:border-primary/40"
              >
                <span className="font-mono text-xs text-primary">03</span>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  Standard Adaptive testing
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Expand across viewport conditions without making execution unbounded.
                </p>
              </Link>
              <Link
                to="/learn/five-worker-qa-collaboration"
                className="rounded-xl border border-border bg-surface/55 p-5 hover:border-primary/40"
              >
                <span className="font-mono text-xs text-primary">04</span>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  Five-worker QA collaboration
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  See how Coordinator-led assignments and named worker messages stay governed.
                </p>
              </Link>
              <Link
                to="/learn/matrix-unit-top-ups"
                className="rounded-xl border border-border bg-surface/55 p-5 hover:border-primary/40"
              >
                <span className="font-mono text-xs text-primary">05</span>
                <h3 className="mt-4 font-display text-lg font-semibold">Matrix Unit top-ups</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Review the display-only catalog and why checkout is not simulated.
                </p>
              </Link>
              <Link
                to="/learn/quick-scan"
                className="rounded-xl border border-border bg-surface/55 p-5 hover:border-primary/40"
              >
                <span className="font-mono text-xs text-primary">06</span>
                <h3 className="mt-4 font-display text-lg font-semibold">Quick Scan preflight</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Separate fast structural leads from findings verified in the browser.
                </p>
              </Link>
            </nav>
          </div>
        </section>

        <section className="border-b border-border bg-surface/30">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20 xl:px-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
                  Top-up groundwork
                </span>
                <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                  Transparent capacity for larger investigations.
                </h2>
              </div>
              <Link
                to="/learn/matrix-unit-top-ups"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Read the top-up guide <ArrowRight className="ml-1 inline h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg) => (
                <article
                  key={pkg.id}
                  className="rounded-xl border border-border bg-background/60 p-5"
                >
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    One-time package
                  </p>
                  <p className="mt-3 font-display text-2xl font-semibold">
                    {pkg.matrixUnits.toLocaleString()} ⟐
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ${Number(pkg.priceUsd).toFixed(2)}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              {topUps?.purchaseNote ??
                "Display values use the current $0.05 per MU selling snapshot. Checkout is not enabled, so no payment or balance change occurs from this page."}
            </p>
          </div>
        </section>

        <section className="border-b border-border" aria-labelledby="pricing-faq-heading">
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-10 lg:py-20">
            <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
              Pricing answers
            </span>
            <h2
              id="pricing-faq-heading"
              className="mt-3 font-display text-3xl font-semibold md:text-4xl"
            >
              Clear answers before you connect a target.
            </h2>
            <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface/50">
              {pricingFaqs.map((item) => (
                <details key={item.question} className="group p-5">
                  <summary className="cursor-pointer list-none pr-8 font-display text-base font-semibold marker:hidden group-open:text-primary">
                    {item.question}
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-hero">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center lg:px-10">
            <h2 className="font-display text-3xl font-semibold text-gradient md:text-4xl">
              Ready to see what the smallest useful proof catches?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              Start with Free, then upgrade when the question needs broader evidence—not because the
              page hid the next capability.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup", returnTo: "/app" }}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground btn-primary-glow"
              >
                Start with Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/sample-report"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 px-5 py-3 text-sm font-semibold hover:bg-accent"
              >
                See a sample report <FileSearch className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between lg:px-10 xl:px-12">
          <Logo />
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6 md:items-end">
            <nav
              className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
              aria-label="Footer navigation"
            >
              <Link to="/learn/matrix-units">Matrix Units</Link>
              <Link to="/learn/quick-smoke-testing">Quick Smoke</Link>
              <Link to="/learn/standard-adaptive-testing">Standard Adaptive</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
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
