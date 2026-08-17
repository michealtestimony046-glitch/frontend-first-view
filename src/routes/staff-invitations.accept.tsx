import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { staffInvitationApi, type StaffInvitationPreview } from "@/lib/api-client";

export const Route = createFileRoute("/staff-invitations/accept")({
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search.token === "string" ? search.token : "" }),
  component: AcceptStaffInvitationPage,
});

function AcceptStaffInvitationPage() {
  const { token } = Route.useSearch();
  const [preview, setPreview] = useState<StaffInvitationPreview | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setError("This invitation link is missing its token."); setLoading(false); return; }
    void staffInvitationApi.preview(token).then((data) => {
      setPreview(data);
      setFullName(data.proposedName || "");
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "This invitation is no longer available.")).finally(() => setLoading(false));
  }, [token]);

  const accept = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await staffInvitationApi.accept(token, { fullName: fullName.trim() || undefined, password: password || undefined });
      setMessage(`${result.message} Use the staff sign-in page to enter the admin console.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to accept this invitation."); }
    finally { setBusy(false); }
  };

  return <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12"><main className="w-full max-w-lg"><div className="surface-card p-7 md:p-9"><div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary"><ShieldCheck className="h-4 w-4" /> Matrix QA staff</div><h1 className="mt-4 font-display text-2xl font-semibold">Accept staff invitation</h1>{loading ? <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking invitation…</div> : error ? <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : preview ? <><p className="mt-2 text-sm leading-6 text-muted-foreground">{preview.inviterName} invited <strong className="text-foreground">{preview.email}</strong> as a <strong className="text-foreground">{preview.role.replaceAll("_", " ").toLowerCase()}</strong>. This link expires {new Date(preview.expiresAt).toLocaleString()}.</p>{message ? <div className="mt-6 space-y-4"><div className="rounded-md border border-primary/30 bg-primary/10 p-4 text-sm text-primary">{message}</div><Link to="/auth" search={{ mode: "signin", returnTo: "/admin" }} className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Sign in as staff</Link></div> : <form onSubmit={accept} className="mt-6 space-y-4"><label className="block text-sm font-medium">Name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" className="mt-1.5 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2.5 text-sm" /></label><label className="block text-sm font-medium">Create a password <span className="font-normal text-muted-foreground">(leave blank if you already have a Matrix QA account)</span><input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="mt-1.5 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2.5 text-sm" /></label><p className="text-xs leading-5 text-muted-foreground">The invitation link proves access to this email. Your password is never sent to the inviter or included in email.</p><button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Accept and activate staff access</button></form>}</> : null}</div><p className="mt-5 text-center text-xs text-muted-foreground"><Link to="/" className="hover:text-foreground">Return to matrixqa.dev</Link></p></main></div>;
}
