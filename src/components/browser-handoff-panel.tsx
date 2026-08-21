import { useState } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { runsApi, type BrowserHandoff } from "@/lib/api-client";

export function BrowserHandoffPanel({
  projectId,
  runId,
  handoff,
  onChange,
}: {
  projectId: string;
  runId: string;
  handoff: BrowserHandoff | null;
  onChange: (value: BrowserHandoff | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!handoff) return null;

  const claim = async () => {
    setBusy(true);
    setError(null);
    try {
      onChange(await runsApi.claimHandoff(projectId, runId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to claim this handoff.");
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    if (!email.trim() || !password) {
      setError("Enter the temporary test-account email and password to resume the run.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onChange(await runsApi.completeHandoff(projectId, runId, { email: email.trim(), password }));
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to complete this handoff.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      onChange(await runsApi.cancelHandoff(projectId, runId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to cancel this handoff.");
    } finally {
      setBusy(false);
    }
  };

  if (handoff.status === "COMPLETED") {
    return (
      <div className="mt-5 flex items-start gap-3 rounded-md border border-success/30 bg-success/10 p-4 text-sm">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <div>
          <strong className="font-medium text-foreground">Authentication handoff completed</strong>
          <p className="mt-1 text-muted-foreground">The worker received the temporary credential securely and is verifying the target login before continuing.</p>
        </div>
      </div>
    );
  }

  if (handoff.status === "CANCELLED" || handoff.status === "EXPIRED") {
    return (
      <div className="mt-5 flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div>
          <strong className="font-medium text-foreground">Authentication handoff {handoff.status.toLowerCase()}</strong>
          <p className="mt-1 text-muted-foreground">The remaining scenarios were not executed. The report remains available for review.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-5 rounded-md border border-warning/40 bg-warning/10 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-sm font-semibold">Human authentication handoff required</h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-warning">{handoff.status}</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{handoff.reason || "The target requires authentication before the approved scenarios can continue."}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Claim this request only if you are authorized to use a temporary test account. The credential is encrypted at rest, is not sent to the test worker, and is never written into the evidence report.</p>
          {handoff.status === "PENDING" ? (
            <button type="button" onClick={() => { void claim(); }} disabled={busy} className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
              Claim handoff
            </button>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium"><span className="mb-1 block">Temporary test-account email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} autoComplete="off" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50" /></label>
              <label className="block text-xs font-medium"><span className="mb-1 block">Temporary test-account password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} autoComplete="new-password" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50" /></label>
              <div className="flex flex-wrap items-center gap-2 sm:col-span-2"><button type="button" onClick={() => { void complete(); }} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}Submit and resume</button><button type="button" onClick={() => { void cancel(); }} disabled={busy} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent disabled:opacity-50"><XCircle className="h-3.5 w-3.5" />Cancel handoff</button></div>
            </div>
          )}
          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </section>
  );
}
