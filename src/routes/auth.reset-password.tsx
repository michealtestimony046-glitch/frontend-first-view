import { useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/logo";
import { authApi } from "@/lib/api-client";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Reset password · Matrix QA" }, { name: "robots", content: "noindex" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!token) return setError("This reset link is missing its token. Request a new one from the sign-in page.");
    if (newPassword.length < 10) return setError("Use a password with at least 10 characters.");
    if (newPassword !== confirmPassword) return setError("The passwords do not match.");
    setBusy(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      setMessage("Password reset complete. You can now sign in with your new password.");
      setTimeout(() => navigate({ to: "/auth", search: { mode: "signin", returnTo: "/app" } }), 600);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This reset link is invalid or expired.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="grid min-h-screen bg-background md:grid-cols-2"><div className="flex flex-col justify-between p-8 md:p-12"><Logo /><main className="mx-auto w-full max-w-sm"><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><ShieldCheck className="h-6 w-6" /></div><span className="font-mono text-xs uppercase tracking-widest text-primary">Account recovery</span><h1 className="mt-2 font-display text-3xl font-semibold text-gradient">Choose a new password.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">The reset link is single-use and expires shortly. Your other sessions will be revoked after reset.</p>{error && <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs leading-5 text-destructive">{error}</div>}{message && <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs leading-5 text-primary">{message}</div>}<form onSubmit={submit} className="mt-6 space-y-3"><label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">New password</span><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required minLength={10} className="w-full rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-sm focus:border-primary focus:outline-none" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirm password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={10} className="w-full rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-sm focus:border-primary focus:outline-none" /></label><button disabled={busy || !token} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Reset password {!busy && <ArrowRight className="h-4 w-4" />}</button></form><p className="mt-6 text-center text-sm text-muted-foreground"><Link to="/auth" search={{ mode: "signin", returnTo: "/app" }} className="text-primary hover:underline">Back to sign in</Link></p></main><p className="font-mono text-[11px] text-muted-foreground"><Link to="/" className="hover:text-foreground">← back to matrixqa.dev</Link></p></div><div className="hidden border-l border-border bg-hero md:block" /></div>;
}
