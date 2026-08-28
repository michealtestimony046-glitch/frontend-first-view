import { useEffect, useState } from "react";
import type { AlphaRewardTier, PublicPlan } from "@/lib/api-client";

export type AdminUserAccess = {
  plan?: PublicPlan;
  activeAlpha?: { tier: Exclude<AlphaRewardTier, "NONE">; expiresAt: string } | null;
};

export function useAdminAlphaClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function AdminPlanBadge({ access, now }: { access: AdminUserAccess; now: number }) {
  const alphaActive = Boolean(access.activeAlpha && Date.parse(access.activeAlpha.expiresAt) > now);
  if (alphaActive) {
    const expiresAt = access.activeAlpha!.expiresAt;
    return (
      <span
        aria-label={`Alpha access until ${new Date(expiresAt).toLocaleString()}`}
        title={`Alpha access until ${new Date(expiresAt).toLocaleString()}`}
        className="inline-flex items-center rounded-md border border-amber-400/60 bg-amber-400/20 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-amber-200"
      >
        Alpha
      </span>
    );
  }

  const plan = access.plan || "FREE";
  const labels: Record<PublicPlan, string> = {
    FREE: "Free",
    STARTER: "Starter",
    PRO: "Pro",
    BUSINESS: "Business",
    ENTERPRISE: "Enterprise",
  };
  const styles: Record<PublicPlan, string> = {
    FREE: "border-slate-400/50 bg-slate-400/15 text-slate-200",
    STARTER: "border-orange-700/60 bg-orange-700/20 text-orange-200",
    PRO: "border-violet-400/50 bg-violet-400/15 text-violet-200",
    BUSINESS: "border-sky-400/50 bg-sky-400/15 text-sky-200",
    ENTERPRISE: "border-rose-400/50 bg-rose-400/15 text-rose-200",
  };
  const safePlan = styles[plan] ? plan : "FREE";
  return (
    <span
      aria-label={`${labels[safePlan]} plan`}
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider ${styles[safePlan]}`}
    >
      {labels[safePlan]}
    </span>
  );
}
