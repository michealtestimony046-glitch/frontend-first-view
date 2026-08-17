import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Lock,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/app/settings/billing")({
  head: () => ({
    meta: [
      { title: "Billing · Matrix QA" },
      { name: "description", content: "Preview allocation and billing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingBody,
});

const PREVIEW_INCLUSIONS = [
  "Browser worker runs",
  "Evidence screenshots and events",
  "Live run status",
  "Issue and audit views",
  "Project-scoped reports",
  "Workspace isolation",
];

function BillingBody() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Billing</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Matrix QA is in Preview. Billing and plan management are disabled while the Core Engine is validated.
          </p>
        </div>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View pricing <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-primary/40 bg-primary/[0.04] shadow-[0_0_0_1px_oklch(0.86_0.18_148/0.2)]">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 md:p-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-primary">Current plan</span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-display text-xl font-semibold">Matrix QA Preview</h2>
              <span className="font-mono text-sm text-muted-foreground">$0 / mo</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Free access while Matrix QA is in v1 Public Preview.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Active · Free Access
          </span>
        </div>
      </section>

      <section className="mt-4 surface-card overflow-hidden">
        <div className="border-b border-border p-5 md:p-6">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Usage and quotas</div>
          <h2 className="mt-1 font-display text-xl font-semibold">Managed during Preview</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            The v1 backend does not expose a billing-usage endpoint or plan quota editor. To keep this page honest, Matrix QA does not display simulated counters. Run availability is determined by the deployed backend when a run is queued.
          </p>
        </div>
        <div className="flex items-start gap-3 p-5 md:p-6">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="text-xs leading-5 text-muted-foreground">
            Preview allocation changes are handled manually for the private alpha. Contact the Matrix QA team through your agreed internal channel if your organization needs more capacity.
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="surface-card p-5 md:p-6">
          <h3 className="font-display text-base font-semibold">What is included in Preview</h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {PREVIEW_INCLUSIONS.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-foreground/90">{feature}</span>
              </li>
            ))}
          </ul>
          <Link to="/pricing" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80">
            See public preview terms <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        <section className="surface-card p-5 md:p-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-surface/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Coming next</span>
          </div>
          <p className="mt-3 text-sm text-foreground/90">
            Paid plans launch alongside the roadmap. Prices and feature sets are directional until those plans are implemented.
          </p>
          <Link to="/pricing" hash="roadmap" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80">
            See the full roadmap <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </div>

      <section className="mt-4 surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-base font-semibold">Invoices & payment method</h3>
        </header>
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-2/60 text-muted-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">No billing history</div>
            <p className="mt-1 text-xs text-muted-foreground">Invoices and payment methods will appear once paid plans launch.</p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <CreditCard className="h-3 w-3" /> Billing disabled during Preview
          </div>
        </div>
      </section>
    </div>
  );
}
