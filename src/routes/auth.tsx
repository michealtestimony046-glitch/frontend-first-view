import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { ArrowRight, Github, Mail, Terminal, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { authApi } from "@/lib/api-client";
import { useMutation } from "@/hooks/use-api";

const PENDING_WORKSPACE_KEY = "matrix_qa_pending_workspace";

const authSearchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional().default("signup"),
  returnTo: z.enum(["/app", "/admin"]).optional().default("/app"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({ meta: [{ title: "Sign in · Matrix QA" }, { name: "description", content: "Sign in to the Matrix QA console." }, { name: "robots", content: "noindex" }] }),
  component: AuthRoute,
});

function AuthRoute() {
  const location = useLocation();
  return location.pathname === "/auth" ? <AuthPage /> : <Outlet />;
}

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode);

  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const navigate = useNavigate();
  const returnTo = search.returnTo === "/admin" ? "/admin" : "/app";

  const [loginMutate, loginState] = useMutation(authApi.login);
  const [signupMutate, signupState] = useMutation(authApi.signup);
  const [verifyMutate, verifyState] = useMutation(authApi.verifyEmail);
  const isLoading = loginState.loading || signupState.loading || verifyState.loading;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const provider = params.get("provider");
      if (code && provider) {
      setOauthLoading(provider);
      authApi.handleOAuthCallback(code, provider).then(() => navigate({ to: returnTo })).catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : `${provider} authentication failed. Please try again.`);
        setOauthLoading(null);
      });
    }
  }, [navigate]);

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await authApi.requestPasswordReset(email.trim().toLowerCase());
      setSuccessMessage("If an account exists for that email, a reset link is on its way.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "We could not request a password reset.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      if (mode === "signin") {
        await loginMutate({ email: email.trim().toLowerCase(), password });
        navigate({ to: returnTo });
        return;
      }
      const cleanWorkspace = workspaceName.trim();
      if (!cleanWorkspace) {
        setErrorMessage("Give your workspace a name before creating your account.");
        return;
      }
      localStorage.setItem(PENDING_WORKSPACE_KEY, cleanWorkspace);
      const response = await signupMutate({ email: email.trim().toLowerCase(), password, fullName: fullName.trim(), workspaceName: cleanWorkspace });
      setVerificationEmail(response.email || email.trim().toLowerCase());
      setVerificationCode("");
      setVerificationStep(true);
      setSuccessMessage("Check your email for your 6-digit verification code.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await verifyMutate({ email: verificationEmail, code: verificationCode });
      const pendingWorkspace = localStorage.getItem(PENDING_WORKSPACE_KEY)?.trim();
      if (!pendingWorkspace) {
        setSuccessMessage("Email verified. Welcome to Matrix QA.");
        setTimeout(() => navigate({ to: returnTo }), 250);
        return;
      }
      localStorage.removeItem(PENDING_WORKSPACE_KEY);
      setSuccessMessage("Email verified. Your organization is ready. Create a workspace to begin.");
      setTimeout(() => navigate({ to: returnTo }), 250);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "We could not complete verification and workspace setup. Please try again.");
    }
  };

  const handleCodeChange = (value: string) => { setVerificationCode(value.replace(/\D/g, "").slice(0, 6)); setErrorMessage(""); };
  const backToSignup = () => { setVerificationStep(false); setVerificationCode(""); setErrorMessage(""); setSuccessMessage(""); };
  const switchMode = () => { setMode((current) => current === "signin" ? "signup" : "signin"); setVerificationStep(false); setErrorMessage(""); setSuccessMessage(""); };

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="flex flex-col justify-between p-8 md:p-12">
        <Logo />
        <div className="mx-auto w-full max-w-sm">
          {!verificationStep ? <>
            <span className="font-mono text-xs uppercase tracking-widest text-primary">{recoveryMode ? "Account recovery" : mode === "signin" ? "Welcome back" : "Get started"}</span>
            <h1 className="mt-2 font-display text-3xl font-semibold text-gradient">{recoveryMode ? "Reset your password." : mode === "signin" ? "Return to the console." : "Create your workspace."}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{recoveryMode ? "Enter your work email and we will send a single-use reset link." : mode === "signin" ? "Sign in to see your latest runs and evidence." : "Name your workspace, create your account, then verify your email before entering Matrix QA."}</p>
            <div className="mt-8 grid gap-2">
              <button type="button" disabled className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-border bg-surface/40 py-2.5 text-sm font-medium text-muted-foreground opacity-80"><Github className="h-4 w-4" />GitHub sign-in · coming later</button>
              <button type="button" disabled className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-border bg-surface/40 py-2.5 text-sm font-medium text-muted-foreground opacity-80"><GoogleIcon />Google sign-in · coming later</button>
            </div>
            <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">or</span><span className="h-px flex-1 bg-border" /></div>
            {recoveryMode ? <form onSubmit={handleRequestReset} className="space-y-3">{errorMessage && <ErrorNotice>{errorMessage}</ErrorNotice>}{successMessage && <SuccessNotice>{successMessage}</SuccessNotice>}<Field label="Work email" type="email" placeholder="jane@company.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /><button type="submit" disabled={!email} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Send reset link <ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => { setRecoveryMode(false); setErrorMessage(""); setSuccessMessage(""); }} className="w-full text-xs text-muted-foreground hover:text-foreground">Back to sign in</button></form> : <form onSubmit={handleSubmit} className="space-y-3">
              {errorMessage && <ErrorNotice>{errorMessage}</ErrorNotice>}
              {successMessage && <SuccessNotice>{successMessage}</SuccessNotice>}
              {mode === "signup" && <>
                <Field label="Workspace name" type="text" placeholder="Acme QA" autoComplete="organization" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} disabled={isLoading} />
                <Field label="Full name" type="text" placeholder="Jane Cooper" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
              </>}
              <Field label="Work email" type="email" placeholder="jane@company.com" icon={<Mail className="h-4 w-4" />} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              <Field label="Password" type="password" placeholder="••••••••" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
              <button type="submit" disabled={isLoading || !email || !password || (mode === "signup" && (!fullName || !workspaceName))} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50">{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "signin" ? "Sign in" : "Create workspace"}{!isLoading && <ArrowRight className="h-4 w-4" />}</button>
            </form>}
            {!recoveryMode && mode === "signin" && <button type="button" onClick={() => { setRecoveryMode(true); setErrorMessage(""); setSuccessMessage(""); }} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-primary">Forgot your password?</button>}
            <p className="mt-6 text-center text-sm text-muted-foreground">{mode === "signin" ? "New to Matrix QA?" : "Already have an account?"}{" "}<button type="button" onClick={switchMode} className="text-primary hover:underline">{mode === "signin" ? "Create an account" : "Sign in"}</button></p>
          </> : <VerificationPanel email={verificationEmail} code={verificationCode} loading={isLoading} error={errorMessage} success={successMessage} onCodeChange={handleCodeChange} onSubmit={handleVerify} onBack={backToSignup} />}
        </div>
        <p className="font-mono text-[11px] text-muted-foreground"><Link to="/" className="hover:text-foreground">← back to matrixqa.dev</Link></p>
      </div>
      <div className="relative hidden overflow-hidden border-l border-border bg-hero md:block">
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative flex h-full flex-col items-center justify-center p-10">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface/70 p-4 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-border pb-3"><div className="flex items-center gap-2"><Terminal className="h-3.5 w-3.5 text-primary" /><span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">run_9f2c · live</span></div><span className="rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-[10px] text-destructive">3 bugs</span></div>
            <div className="mt-3 space-y-2 font-mono text-[11px] leading-relaxed"><div className="text-muted-foreground">worker boot · chromium 128</div><div>GET / <span className="text-success">200</span></div><div>click "Sign up"</div><div>fill signup form · workspace + account</div><div className="text-warning">warn: verification pending</div><div>POST /auth/verify-email <span className="text-success">200</span></div><div className="text-primary">● workspace provisioned · ready</div></div>
          </div>
          <p className="mt-6 max-w-sm text-center text-sm text-muted-foreground">Verify once, then your workspace is ready for its first Matrix QA project.</p>
        </div>
      </div>
    </div>
  );
}

function VerificationPanel({ email, code, loading, error, success, onCodeChange, onSubmit, onBack }: { email: string; code: string; loading: boolean; error: string; success: string; onCodeChange: (value: string) => void; onSubmit: (e: FormEvent) => void; onBack: () => void; }) {
  return <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_30px_-10px_hsl(var(--primary))]"><ShieldCheck className="h-6 w-6" /></div>
    <span className="font-mono text-xs uppercase tracking-widest text-primary">Email verification</span>
    <h1 className="mt-2 font-display text-3xl font-semibold text-gradient">One last little check.</h1>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it below to activate your Matrix QA account.</p>
    {error && <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div>}
    {success && <div className="mt-5"><SuccessNotice>{success}</SuccessNotice></div>}
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      <label className="block"><span className="mb-2 block text-xs font-medium text-muted-foreground">Verification code</span><input value={code} onChange={(e) => onCodeChange(e.target.value)} inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} pattern="[0-9]{6}" placeholder="000000" aria-label="6-digit email verification code" className="w-full rounded-xl border border-primary/20 bg-surface-2/70 px-4 py-4 text-center font-mono text-3xl font-semibold tracking-[0.35em] text-foreground placeholder:text-muted-foreground/30 focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10" /></label>
      <button type="submit" disabled={loading || code.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground btn-primary-glow transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{loading ? "Verifying…" : "Verify email"}</button>
    </form>
    <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground"><button type="button" onClick={onBack} className="hover:text-foreground hover:underline">← Use a different email</button><span className="font-mono">expires in 10 min</span></div>
  </div>;
}

function ErrorNotice({ children }: { children: ReactNode }) { return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs leading-5 text-destructive">{children}</div>; }
function SuccessNotice({ children }: { children: ReactNode }) { return <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs leading-5 text-primary"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{children}</div>; }
function Field({ label, icon, disabled, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: ReactNode; disabled?: boolean }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span><div className="relative">{icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}<input {...props} disabled={disabled} className={`w-full rounded-md border border-border bg-surface-2/60 py-2.5 text-sm placeholder:text-muted-foreground/70 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${icon ? "pl-9 pr-3" : "px-3"}`} /></div></label>; }
function GoogleIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v3.2h5.35c-.24 1.4-1.66 4.1-5.35 4.1a5.9 5.9 0 1 1 0-11.8c1.85 0 3.1.79 3.8 1.47l2.6-2.5C16.8 3.9 14.6 3 12 3a9 9 0 1 0 0 18c5.2 0 8.6-3.65 8.6-8.8 0-.6-.06-1.05-.15-1.5Z" /></svg>; }
