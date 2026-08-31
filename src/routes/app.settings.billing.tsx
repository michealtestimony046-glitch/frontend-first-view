import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, CreditCard, FileText, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { billingApi, type PublicPlan } from "@/lib/api-client";

export const Route = createFileRoute("/app/settings/billing")({
  head: () => ({
    meta: [
      { title: "Billing · Matrix QA" },
      { name: "description", content: "Manage your Matrix QA subscription and billing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingBody,
});

const STARTER_CHECKOUT_URL =
  import.meta.env.VITE_WHOP_STARTER_CHECKOUT_URL ?? "https://whop.com/checkout/plan_SlWPb6Ph4TpKl";

type BillingStatus = Awaited<ReturnType<typeof billingApi.status>>;

function formatPeriodEnd(periodEnd: string | null | undefined) {
  if (!periodEnd) return null;
  const date = new Date(periodEnd);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function planName(plan: PublicPlan) {
  return plan === "STARTER" ? "Starter" : "Free";
}

function planPrice(plan: PublicPlan) {
  return plan === "STARTER" ? "$49/month" : "$0/month";
}

function BillingBody() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    billingApi
      .status()
      .then((status) => {
        if (!cancelled) setBilling(status);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Billing details could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentPlan = billing?.plan === "STARTER" ? "STARTER" : "FREE";
  const periodEnd = formatPeriodEnd(billing?.periodEnd);
  const statusLabel = billing?.status?.trim() || (currentPlan === "FREE" ? "ACTIVE" : "UNKNOWN");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Billing &amp; Usage</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Manage your organization&apos;s Matrix QA plan and view payment history.
          </p>
        </div>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View pricing <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <section className="mt-6 surface-card p-6" role="status" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your organization billing details…
          </div>
        </section>
      ) : error ? (
        <section className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6" role="alert">
          <h2 className="font-display text-lg font-semibold">Billing details unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
        </section>
      ) : billing ? (
        <>
          <section className="mt-6 overflow-hidden rounded-2xl border border-primary/40 bg-primary/[0.04] shadow-[0_0_0_1px_oklch(0.86_0.18_148/0.2)]">
            <div className="flex flex-wrap items-start justify-between gap-4 p-5 md:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-primary">Current plan</span>
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-display text-xl font-semibold">{planName(currentPlan)}</h2>
                  <span className="font-mono text-sm text-muted-foreground">{planPrice(currentPlan)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {currentPlan === "STARTER" ? "Your organization has an active Starter subscription." : "Current free access for your organization."}
                </p>
                {currentPlan === "STARTER" && periodEnd ? (
                  <p className="mt-2 text-xs text-muted-foreground">Billing period ends {periodEnd}.</p>
                ) : null}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {statusLabel}
              </span>
            </div>
          </section>

          <section className="mt-4 surface-card overflow-hidden">
            <div className="border-b border-border p-5 md:p-6">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Plans</div>
              <h2 className="mt-1 font-display text-xl font-semibold">Choose the access your organization needs.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Plan access is determined by the organization entitlement returned from Matrix QA&apos;s billing service.
              </p>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
              <div className={`rounded-xl border p-5 ${currentPlan === "FREE" ? "border-primary/40 bg-primary/[0.04]" : "border-border bg-background/30"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">Free</h3>
                    <p className="mt-1 font-mono text-sm text-muted-foreground">$0/month</p>
                  </div>
                  {currentPlan === "FREE" ? <CheckCircle2 className="h-5 w-5 text-primary" aria-label="Current plan" /> : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">Current free access with the organization&apos;s included Matrix QA allowance.</p>
                {currentPlan === "FREE" ? <p className="mt-4 text-xs font-medium text-primary">Current free access</p> : null}
              </div>

              <div className={`rounded-xl border p-5 ${currentPlan === "STARTER" ? "border-primary/40 bg-primary/[0.04]" : "border-border bg-background/30"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">Starter</h3>
                    <p className="mt-1 font-mono text-sm text-muted-foreground">$49/month</p>
                  </div>
                  {currentPlan === "STARTER" ? <CheckCircle2 className="h-5 w-5 text-primary" aria-label="Current plan" /> : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">Expanded Matrix QA access for organizations ready to run more coverage.</p>
                {currentPlan === "FREE" ? (
                  <a
                    href={STARTER_CHECKOUT_URL}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow hover:-translate-y-px"
                  >
                    Upgrade to Starter <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="mt-4 text-xs font-medium text-primary">Current Starter plan</p>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}

      <section className="mt-4 surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-base font-semibold">Billing history</h3>
        </header>
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-2/60 text-muted-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">No payments yet</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Your billing history will appear here after your first successful payment.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
