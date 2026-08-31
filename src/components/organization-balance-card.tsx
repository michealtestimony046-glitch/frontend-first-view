import { ArrowUpRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  creditsApi,
  plansApi,
  type CreditsSummary,
  type EffectivePlanResponse,
} from "@/lib/api-client";
import { subscribeToCustomerBalanceUpdates } from "@/lib/balance-events";

export const ORGANIZATION_CHANGED_EVENT = "matrix-qa-organization-changed";
const ACTIVE_ORGANIZATION_KEY = "matrix_qa_active_organization";
const REFRESH_INTERVAL_MS = 5_000;

const planNames: Record<EffectivePlanResponse["plan"], string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
  BUSINESS: "Business",
  ENTERPRISE: "Enterprise",
};

const accessLabels: Record<EffectivePlanResponse["accessSource"], string> = {
  FREE: "Standard access",
  SUBSCRIPTION: "Subscription access",
  ALPHA: "Alpha access",
  STAFF: "Staff access",
  ADMIN: "Admin access",
};

function formatUnits(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Math.max(0, value));
}

function usagePercent(summary: CreditsSummary, plan: EffectivePlanResponse | null) {
  if (Number.isFinite(summary.usagePercent))
    return Math.min(100, Math.max(0, summary.usagePercent));
  const limit = summary.monthlyCeilingUnits || plan?.monthlyMu || 0;
  if (!limit) return 0;
  return Math.min(100, Math.max(0, (summary.usedUnits / limit) * 100));
}

function planLimit(summary: CreditsSummary, plan: EffectivePlanResponse | null) {
  return summary.monthlyCeilingUnits > 0 ? summary.monthlyCeilingUnits : (plan?.monthlyMu ?? 0);
}

export function OrganizationBalanceCard({ instanceId = "default" }: { instanceId?: string }) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [plan, setPlan] = useState<EffectivePlanResponse | null>(null);
  const [summary, setSummary] = useState<CreditsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const headingId = `organization-balance-title-${instanceId}`;

  useEffect(() => {
    let cancelled = false;

    const load = async (silent = false) => {
      const nextOrganizationId = localStorage.getItem(ACTIVE_ORGANIZATION_KEY);
      if (cancelled) return;
      setOrganizationId(nextOrganizationId);
      if (!nextOrganizationId) {
        setPlan(null);
        setSummary(null);
        setError(null);
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);
      const [planResult, summaryResult] = await Promise.allSettled([
        plansApi.effective(nextOrganizationId),
        creditsApi.getSummary(nextOrganizationId),
      ]);
      if (cancelled) return;

      const nextPlan = planResult.status === "fulfilled" ? planResult.value : null;
      const nextSummary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
      setPlan(nextPlan);
      setSummary(nextSummary);
      setError(
        !nextPlan && !nextSummary
          ? "Plan and balance are temporarily unavailable."
          : !nextPlan
            ? "Plan details are temporarily unavailable."
            : !nextSummary
              ? "Live balance is temporarily unavailable."
              : null,
      );
      if (!silent) setLoading(false);
    };

    const refresh = () => void load(true);
    void load();
    const timer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const unsubscribeBalance = subscribeToCustomerBalanceUpdates(refresh);
    window.addEventListener(ORGANIZATION_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      unsubscribeBalance();
      window.removeEventListener(ORGANIZATION_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const limit = summary ? planLimit(summary, plan) : (plan?.monthlyMu ?? 0);
  const percent = summary ? usagePercent(summary, plan) : 0;
  const planTitle = plan ? `${planNames[plan.plan]} Plan` : "Plan details";
  const matrixUnitSymbol = summary?.symbol?.trim() || "⟐";
  const accessibleBalance = summary
    ? `${formatUnits(summary.usedUnits)} Matrix Units used of ${formatUnits(limit)} Matrix Units`
    : "Live Matrix Units balance is not available";

  return (
    <section
      aria-labelledby={headingId}
      className="mt-3 rounded-xl border border-border/80 bg-surface-2/45 p-3 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.9)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Current plan
          </p>
          <h2 id={headingId} className="mt-1 truncate text-sm font-semibold text-primary">
            {planTitle}
          </h2>
          {plan ? (
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {accessLabels[plan.accessSource]}
            </p>
          ) : null}
        </div>
        <Link
          to="/app/credits"
          aria-label="View Matrix Unit usage"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Loading balance…
        </div>
      ) : organizationId && summary ? (
        <>
          <p className="mt-4 text-base font-medium tracking-tight" aria-label={accessibleBalance}>
            <span aria-hidden="true">
              {formatUnits(summary.usedUnits)} {matrixUnitSymbol}
            </span>
            <span className="px-1 text-muted-foreground" aria-hidden="true">
              /
            </span>
            <span aria-hidden="true">
              {formatUnits(limit)} {matrixUnitSymbol}
            </span>
            <span className="sr-only">{accessibleBalance}</span>
          </p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/80"
            role="progressbar"
            aria-label="Matrix Unit usage"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span>{Math.round(percent)}% used</span>
            <span aria-label={`${formatUnits(summary.availableUnits)} Matrix Units available now`}>
              <span aria-hidden="true">
                {formatUnits(summary.availableUnits)} {matrixUnitSymbol}
              </span>{" "}
              available
            </span>
          </div>
        </>
      ) : organizationId ? (
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Balance will appear when the organization capacity service responds.
        </p>
      ) : (
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Choose an organization to see its live balance.
        </p>
      )}

      {error ? <p className="mt-2 text-[10px] leading-4 text-warning">{error}</p> : null}

      <Link
        to="/app/credits"
        className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
      >
        View usage details <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </section>
  );
}
