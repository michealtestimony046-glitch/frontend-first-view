import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Lock,
  MessageSquare,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  PREVIEW_INCLUSIONS,
  getBillingUsage,
  setMockUsage,
  PREVIEW_CAP,
} from "@/lib/mock-data";

export const Route = createFileRoute("/app/settings/billing")({
  head: () => ({
    meta: [
      { title: "Billing · Matrix QA" },
      { name: "description", content: "Preview allocation and billing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

const WEBHOOK_URL = import.meta.env.VITE_ALLOCATION_WEBHOOK_URL as
  | string
  | undefined;

function BillingPage() {
  return (
    <AppShell title="Billing">
      <BillingBody />
    </AppShell>
  );
}

function BillingBody() {
  const [tick, setTick] = useState(0);
  const usage = getBillingUsage();
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => setTick((t) => t + 1);
  void tick;

  const barColor =
    usage.pct >= 95
      ? "bg-destructive"
      : usage.pct >= 80
        ? "bg-warning"
        : "bg-primary";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Billing
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Matrix QA is in Preview. Billing is disabled while we validate the
            Core Engine — you'll see paid plans launch with v2.
          </p>
        </div>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View pricing
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Current plan */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-primary/40 bg-primary/[0.04] shadow-[0_0_0_1px_oklch(0.86_0.18_148/0.2)]">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 md:p-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
                Current plan
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-display text-xl font-semibold">
                Matrix QA Preview
              </h2>
              <span className="font-mono text-sm text-muted-foreground">
                $0 / mo
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Included while Matrix QA is in v1 Public Preview.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Active · Free Access
          </span>
        </div>
      </section>

      {/* Usage */}
      <section className="mt-4 surface-card overflow-hidden">
        <div className="border-b border-border p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Test runs · {usage.cycleLabel}
              </div>
              <div className="mt-1 font-display text-3xl font-semibold">
                <span
                  className={
                    usage.pct >= 95
                      ? "text-destructive"
                      : usage.pct >= 80
                        ? "text-warning"
                        : "text-foreground"
                  }
                >
                  {usage.used}
                </span>
                <span className="text-muted-foreground"> / {usage.cap}</span>
              </div>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground btn-primary-glow"
            >
              <Zap className="h-3.5 w-3.5" />
              Request more allocation
            </button>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${usage.pct}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>
              Pool resets when v2 introduces per-plan quotas. Limits may change
              during Preview.
            </span>
            {usage.atCap && (
              <span className="inline-flex items-center gap-1 font-mono uppercase tracking-widest text-destructive">
                <Lock className="h-3 w-3" />
                Preview cap reached · new runs blocked
              </span>
            )}
          </div>
        </div>

        {/* Dev-only cap simulator */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border bg-surface-2/40 px-5 py-3 text-[11px]">
          <div className="font-mono uppercase tracking-widest text-muted-foreground">
            Dev · Simulate usage
          </div>
          <div className="flex gap-1.5">
            {[0, 87, 200, 250].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setMockUsage(n);
                  refresh();
                }}
                className={`rounded-md border px-2 py-1 font-mono text-[10px] ${
                  usage.used === n
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {n} / {PREVIEW_CAP}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* What's included + Coming next */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="surface-card p-5 md:p-6">
          <h3 className="font-display text-base font-semibold">
            What's included in Preview
          </h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {PREVIEW_INCLUSIONS.slice(0, 10).map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-foreground/90">{f}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/pricing"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
          >
            See all Preview inclusions
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        <section className="surface-card p-5 md:p-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-surface/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Coming next
            </span>
          </div>
          <p className="mt-3 text-sm text-foreground/90">
            Paid plans launch with{" "}
            <span className="font-semibold text-foreground">v2 (Starter · $49)</span>{" "}
            and{" "}
            <span className="font-semibold text-foreground">v3 (Pro · $129)</span>.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Preview accounts get advance notice and a grace period before quota
            rules change.
          </p>
          <Link
            to="/pricing"
            hash="roadmap"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
          >
            See the full roadmap
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </div>

      {/* Invoices empty state */}
      <section className="mt-4 surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-base font-semibold">
            Invoices & payment method
          </h3>
        </header>
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-2/60 text-muted-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              No billing history
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              You'll see invoices and payment methods here once paid plans
              launch.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <CreditCard className="h-3 w-3" />
            Billing disabled during Preview
          </div>
        </div>
      </section>

      {modalOpen && (
        <AllocationModal
          onClose={() => setModalOpen(false)}
          onSubmitted={(msg) => {
            setModalOpen(false);
            setToast(msg);
            window.setTimeout(() => setToast(null), 4500);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-primary/40 bg-surface px-4 py-3 text-sm shadow-lg md:bottom-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-foreground">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function AllocationModal({
  onClose,
  onSubmitted,
}: {
  onClose: () => void;
  onSubmitted: (msg: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [workload, setWorkload] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (WEBHOOK_URL) {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "matrix_qa_billing",
            email,
            workload,
            submittedAt: new Date().toISOString(),
          }),
        });
        if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
        onSubmitted("Request sent. We'll follow up by email shortly.");
      } else {
        // No webhook configured — soft success for local dev.
        console.warn(
          "[Matrix QA] VITE_ALLOCATION_WEBHOOK_URL not set; simulating success.",
        );
        await new Promise((r) => setTimeout(r, 400));
        onSubmitted("Request recorded locally (no webhook configured).");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="surface-card w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold">
                Request more allocation
              </h3>
              <p className="text-xs text-muted-foreground">
                Tell us about your workload — we bump Preview pools manually.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Work email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Tell us about your workload
            </span>
            <textarea
              required
              value={workload}
              onChange={(e) => setWorkload(e.target.value)}
              rows={4}
              placeholder="How many runs per week, which environments, what you're trying to catch…"
              className="w-full resize-y rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Or reach us in the community
              <ExternalLink className="h-3 w-3" />
            </a>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border bg-surface/60 px-3 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground btn-primary-glow disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" />
                {submitting ? "Sending…" : "Submit request"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
