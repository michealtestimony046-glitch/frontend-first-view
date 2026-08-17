import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/logo";
import { authApi } from "@/lib/api-client";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/auth/confirm-email")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Confirm email · Matrix QA" }, { name: "robots", content: "noindex" }] }),
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirming your new email address…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This confirmation link is missing its token. Request a new email change from Settings.");
      return;
    }
    authApi.confirmEmailChange(token).then(() => {
      setStatus("success");
      setMessage("Your email address has been updated. Sign in again to continue.");
      setTimeout(() => navigate({ to: "/auth", search: { mode: "signin", returnTo: "/app" } }), 900);
    }).catch((cause) => {
      setStatus("error");
      setMessage(cause instanceof Error ? cause.message : "This confirmation link is invalid or expired.");
    });
  }, [navigate, token]);

  return <div className="grid min-h-screen bg-background md:grid-cols-2"><div className="flex flex-col justify-between p-8 md:p-12"><Logo /><main className="mx-auto w-full max-w-sm"><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">{status === "loading" ? <Loader2 className="h-6 w-6 animate-spin" /> : status === "success" ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}</div><span className="font-mono text-xs uppercase tracking-widest text-primary">Email confirmation</span><h1 className="mt-2 font-display text-3xl font-semibold text-gradient">{status === "success" ? "Email confirmed." : status === "loading" ? "Checking the link." : "We could not confirm it."}</h1><p className={`mt-3 rounded-xl border p-3 text-sm leading-6 ${status === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/20 bg-primary/10 text-muted-foreground"}`}>{message}</p><p className="mt-6 text-center text-sm text-muted-foreground"><Link to="/auth" search={{ mode: "signin", returnTo: "/app" }} className="text-primary hover:underline">Back to sign in</Link></p></main><p className="font-mono text-[11px] text-muted-foreground"><Link to="/" className="hover:text-foreground">← back to matrixqa.dev</Link></p></div><div className="hidden border-l border-border bg-hero md:block" /></div>;
}
