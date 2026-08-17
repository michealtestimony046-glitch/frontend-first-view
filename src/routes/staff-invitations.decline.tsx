import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { staffInvitationApi } from "@/lib/api-client";

export const Route = createFileRoute("/staff-invitations/decline")({
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search.token === "string" ? search.token : "" }),
  component: DeclineStaffInvitationPage,
});

function DeclineStaffInvitationPage() {
  const { token } = Route.useSearch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setError("This invitation link is missing its token."); setLoading(false); return; }
    void staffInvitationApi.decline(token).catch((cause) => setError(cause instanceof Error ? cause.message : "This invitation is no longer available.")).finally(() => setLoading(false));
  }, [token]);

  return <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12"><main className="w-full max-w-lg"><div className="surface-card p-7 text-center md:p-9"><ShieldCheck className="mx-auto h-8 w-8 text-primary" /><h1 className="mt-4 font-display text-2xl font-semibold">{loading ? "Declining invitation…" : error ? "Invitation unavailable" : "Invitation declined"}</h1>{loading ? <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Updating invitation…</div> : <p className={`mt-3 text-sm leading-6 ${error ? "text-destructive" : "text-muted-foreground"}`}>{error || "The invitation has been declined. You do not need to create a Matrix QA account."}</p>}<Link to="/" className="mt-6 inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent">Return to matrixqa.dev</Link></div></main></div>;
}
