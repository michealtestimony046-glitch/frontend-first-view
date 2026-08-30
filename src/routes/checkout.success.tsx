import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { billingApi, getAuthToken } from "@/lib/api-client";

export const Route = createFileRoute("/checkout/success")({ component: CheckoutSuccessPage });

type State = "checking" | "activated" | "waiting" | "error";

function CheckoutSuccessPage() {
  const [state, setState] = useState<State>(() => (getAuthToken() ? "checking" : "error"));
  const [message, setMessage] = useState("We are confirming your Starter subscription securely.");

  useEffect(() => {
    if (!getAuthToken()) {
      setMessage("Please sign in with the same Matrix QA email used during checkout.");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const check = async () => {
      try {
        const status = await billingApi.status();
        if (cancelled) return;
        if (status.plan === "STARTER" && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(status.status)) {
          setState("activated");
          setMessage("Your Starter workspace is active. You can open Matrix QA now.");
          return;
        }
        attempts += 1;
        if (attempts >= 10) {
          setState("waiting");
          setMessage("Payment was received, but activation is still processing. Please refresh in a few seconds.");
          return;
        }
        setTimeout(check, 2000);
      } catch {
        if (!cancelled) {
          setState("waiting");
          setMessage("We could not read the activation status yet. Please refresh shortly; your payment will not be charged again.");
        }
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const Icon = state === "activated" ? CheckCircle2 : state === "waiting" || state === "error" ? TriangleAlert : Loader2;
  const iconClass = state === "activated" ? "text-primary" : state === "checking" ? "animate-spin text-primary" : "text-warning";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-surface/60 p-8 text-center shadow-xl">
        <Icon className={`mx-auto h-12 w-12 ${iconClass}`} />
        <h1 className="mt-5 font-display text-3xl font-semibold">
          {state === "activated" ? "Starter activated" : state === "error" ? "Sign in required" : "Confirming your subscription"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{message}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {state === "activated" ? (
            <Link to="/app" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Open workspace</Link>
          ) : (
            <button type="button" onClick={() => window.location.reload()} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Check again</button>
          )}
          <Link to="/pricing" className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold">Back to pricing</Link>
        </div>
      </section>
    </main>
  );
}
