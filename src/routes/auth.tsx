import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Chrome, Github, Loader2, Mail, ShieldCheck, Terminal, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { authApi, organizationsApi, projectsApi, workspacesApi, type Project } from "@/lib/api-client";
import { useMutation } from "@/hooks/use-api";
import { enrollBrowserPush } from "@/lib/push-notifications";

const PENDING_ONBOARDING_KEY = "matrix_qa_pending_onboarding";
const FIRST_TEST_READY_KEY = "matrix_qa_first_test_ready";
const ONBOARDING_PROFILE_KEY = "matrix_qa_onboarding_profile";

type OnboardingDraft = {
  fullName: string;
  email: string;
  password: string;
  workspaceName: string;
  role: string;
  targetUrl: string;
  ownershipConfirmed: boolean;
  focusArea: string;
  notifications: "email" | "email_push";
};

const ROLE_OPTIONS = [
  "Solo developer / indie hacker",
  "Agency or team",
  "QA/engineering lead at a company",
  "Just exploring",
] as const;

const authSearchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional().default("signup"),
  returnTo: z.enum(["/app", "/admin"]).optional().default("/app"),
  recover: z.boolean().optional().default(false),
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
  const adminSignInOnly = search.returnTo === "/admin";
  const [selectedMode, setSelectedMode] = useState<"signin" | "signup">(search.mode);
  const mode: "signin" | "signup" = adminSignInOnly ? "signin" : selectedMode;
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [draft, setDraft] = useState<OnboardingDraft>({ fullName: "", email: "", password: "", workspaceName: "", role: "", targetUrl: "", ownershipConfirmed: false, focusArea: "", notifications: "email" });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(search.recover);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState({ google: false, github: false });
  const [oauthUserId, setOauthUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const returnTo = search.returnTo === "/admin" ? "/admin" : "/app";

  const [loginMutate, loginState] = useMutation(authApi.login);
  const [signupMutate, signupState] = useMutation(authApi.signup);
  const [verifyMutate, verifyState] = useMutation(authApi.verifyEmail);
  const isLoading = loginState.loading || signupState.loading || verifyState.loading || oauthLoading;

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const provider = params.get("provider");
    const state = params.get("state");
    const oauthError = params.get("oauth_error");
    if (oauthError) {
      window.history.replaceState({}, "", "/auth");
      setErrorMessage("Social sign-in could not be completed. Please try again.");
      authApi.oauthProviders().then((available) => { if (active) setOauthProviders(available); }).catch(() => undefined);
    } else if (code && provider) {
      setOauthLoading(true);
      authApi.handleOAuthCallback(code, provider, state || undefined)
        .then((response) => {
          const oauthIntent = typeof window !== "undefined" ? window.sessionStorage.getItem("matrix_qa_oauth_intent") || selectedMode : selectedMode;
          window.sessionStorage.removeItem("matrix_qa_oauth_intent");
          window.history.replaceState({}, "", "/auth");
          if (oauthIntent === "signup" && !adminSignInOnly) {
            setOauthUserId(response.user.id);
            setDraft((current) => ({ ...current, email: response.user.email, fullName: response.user.fullName || current.fullName }));
            setOnboardingStep(2);
            setSuccessMessage("Signed in. Finish the short workspace and first-test setup.");
          } else {
            navigate({ to: returnTo });
          }
        })
        .catch((cause) => {
          window.history.replaceState({}, "", "/auth");
          setErrorMessage(cause instanceof Error ? cause.message : "Social sign-in could not be completed.");
        })
        .finally(() => { if (active) setOauthLoading(false); });
    } else {
      authApi.oauthProviders().then((available) => { if (active) setOauthProviders(available); }).catch(() => undefined);
    }
    return () => { active = false; };
  }, [navigate, returnTo]);

  const startOAuth = (provider: "google" | "github") => {
    setOauthLoading(true);
    window.sessionStorage.setItem("matrix_qa_oauth_intent", mode);
    if (provider === "google") authApi.loginWithGoogle();
    else authApi.loginWithGithub();
  };

  const updateDraft = <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrorMessage("");
  };

  const handleRequestReset = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await authApi.requestPasswordReset(draft.email.trim().toLowerCase());
      setSuccessMessage("If an account exists for that email, a reset link is on its way.");
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "We could not request a password reset.");
    }
  };

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await loginMutate({ email: draft.email.trim().toLowerCase(), password: draft.password });
      navigate({ to: returnTo });
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "Authentication failed. Please try again.");
    }
  };

  const continueOnboarding = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    if (onboardingStep === 1) {
      if (!draft.email.trim() || !draft.password) { setErrorMessage("Enter your email and password to continue."); return; }
      if (draft.password.length < 8) { setErrorMessage("Use at least 8 characters for your password."); return; }
      setOnboardingStep(2);
      return;
    }
    if (onboardingStep === 2) {
      if (!draft.workspaceName.trim()) { setErrorMessage("Give your workspace a name before continuing."); return; }
      if (!draft.role) { setErrorMessage("Choose the option that best describes you."); return; }
      setOnboardingStep(3);
      return;
    }
    if (!draft.targetUrl.trim()) { setErrorMessage("Add the website you want Matrix QA to test first."); return; }
    if (!isValidTargetUrl(draft.targetUrl)) { setErrorMessage("Use a valid http:// or https:// website address."); return; }
    if (!draft.ownershipConfirmed) { setErrorMessage("Confirm that you own this website or have permission to test it."); return; }
    void submitSignup();
  };

  const submitSignup = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    const cleanDraft = { ...draft, email: draft.email.trim().toLowerCase(), fullName: draft.fullName.trim(), workspaceName: draft.workspaceName.trim(), targetUrl: normalizeTargetUrl(draft.targetUrl), focusArea: draft.focusArea.trim() };
    try {
      localStorage.setItem(PENDING_ONBOARDING_KEY, JSON.stringify(cleanDraft));
      if (oauthUserId) {
        await provisionFirstTest(cleanDraft, oauthUserId);
        localStorage.removeItem(PENDING_ONBOARDING_KEY);
        setSuccessMessage("Your first test is being prepared now.");
        window.setTimeout(() => navigate({ to: "/app" }), 450);
        return;
      }
      const response = await signupMutate({ email: cleanDraft.email, password: cleanDraft.password, fullName: cleanDraft.fullName, workspaceName: cleanDraft.workspaceName });
      setVerificationEmail(response.email || cleanDraft.email);
      setVerificationCode("");
      setVerificationStep(true);
      setSuccessMessage("Check your email for the 6-digit verification code.");
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "We could not create your account. Please try again.");
    }
  };

  const provisionFirstTest = async (onboarding: OnboardingDraft, userId: string) => {
    const organizations = await organizationsApi.list();
    const organization = organizations[0];
    if (!organization) throw new Error("Your account is verified, but the organization could not be loaded yet. Please open the console and try again.");
    const desiredOrganizationName = onboarding.workspaceName.trim();
    const activeOrganization = desiredOrganizationName && organization.name !== desiredOrganizationName
      ? await organizationsApi.rename(organization.id, desiredOrganizationName)
      : organization;
    localStorage.setItem("matrix_qa_active_organization", activeOrganization.id);
    const workspaces = await workspacesApi.list(activeOrganization.id);
    const workspace = workspaces[0] ?? await workspacesApi.create({ organizationId: activeOrganization.id, name: desiredOrganizationName });
    localStorage.setItem("matrix_qa_active_workspace", workspace.id);
    const existing = await projectsApi.list(activeOrganization.id, workspace.id);
    const project: Project = existing.find((item) => item.defaultTargetUrl === onboarding.targetUrl) ?? await projectsApi.create({ organizationId: activeOrganization.id, workspaceId: workspace.id, name: `${desiredOrganizationName} first test`, description: onboarding.focusArea.trim() || undefined, defaultTargetUrl: onboarding.targetUrl });
    localStorage.setItem("matrix_qa_active_project", project.id);
    localStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify({ userId, role: onboarding.role, notifications: onboarding.notifications, focusArea: onboarding.focusArea.trim() }));
    if (onboarding.notifications === "email_push") {
      await enrollBrowserPush().catch(() => undefined);
    }
    localStorage.setItem(FIRST_TEST_READY_KEY, JSON.stringify({ projectId: project.id, targetUrl: onboarding.targetUrl, missionGoal: onboarding.focusArea.trim() || "Test this website thoroughly.", autoStart: true, targetAuthorizationConfirmed: onboarding.ownershipConfirmed }));
  };

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    if (verificationCode.length !== 6) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await verifyMutate({ email: verificationEmail, code: verificationCode });
      const raw = localStorage.getItem(PENDING_ONBOARDING_KEY);
      const pending = raw ? JSON.parse(raw) as OnboardingDraft : null;
      if (!pending) {
        setSuccessMessage("Email verified. Welcome to Matrix QA.");
        window.setTimeout(() => navigate({ to: returnTo }), 250);
        return;
      }
      try {
        await provisionFirstTest(pending, response.user.id);
        localStorage.removeItem(PENDING_ONBOARDING_KEY);
        setSuccessMessage("Email verified. Your first test is being prepared now.");
        window.setTimeout(() => navigate({ to: "/app" }), 450);
      } catch (cause) {
        setSuccessMessage("Email verified. Your console is ready; finish the first-test setup there.");
        setErrorMessage(cause instanceof Error ? cause.message : "We could not finish the first-test setup yet.");
        window.setTimeout(() => navigate({ to: "/app/projects" }), 900);
      }
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "We could not verify your email. Please try again.");
    }
  };

  const handleCodeChange = (value: string) => { setVerificationCode(value.replace(/\D/g, "").slice(0, 6)); setErrorMessage(""); };
  const backToSignup = () => { setVerificationStep(false); setVerificationCode(""); setErrorMessage(""); setSuccessMessage(""); };
  const switchMode = () => { if (adminSignInOnly) return; setSelectedMode((current) => current === "signin" ? "signup" : "signin"); setRecoveryMode(false); setOnboardingStep(1); setErrorMessage(""); setSuccessMessage(""); };

  return <div className="grid min-h-screen bg-background md:grid-cols-2">
    <div className="flex flex-col justify-between p-6 sm:p-8 md:p-12">
      <Logo />
      <div className="mx-auto w-full max-w-md">
        {!verificationStep ? recoveryMode ? <RecoveryForm email={draft.email} setEmail={(value) => updateDraft("email", value)} loading={isLoading} error={errorMessage} success={successMessage} onSubmit={handleRequestReset} onBack={() => { setRecoveryMode(false); setErrorMessage(""); setSuccessMessage(""); }} /> : mode === "signin" ? <SignInForm adminSignInOnly={adminSignInOnly} email={draft.email} password={draft.password} setEmail={(value) => updateDraft("email", value)} setPassword={(value) => updateDraft("password", value)} loading={isLoading} error={errorMessage} success={successMessage} onSubmit={handleSignIn} onRecovery={() => { setRecoveryMode(true); setErrorMessage(""); setSuccessMessage(""); }} oauthProviders={oauthProviders} oauthLoading={oauthLoading} onOAuth={startOAuth} /> : <OnboardingForm key={`onboarding-${onboardingStep}`} step={onboardingStep} draft={draft} updateDraft={updateDraft} loading={isLoading} error={errorMessage} success={successMessage} onSubmit={continueOnboarding} onBack={() => { setErrorMessage(""); setOnboardingStep((current) => current > 1 ? (current - 1) as 1 | 2 | 3 : 1); }} oauthProviders={oauthProviders} oauthLoading={oauthLoading} onOAuth={startOAuth} /> : <VerificationPanel email={verificationEmail} code={verificationCode} loading={isLoading} error={errorMessage} success={successMessage} onCodeChange={handleCodeChange} onSubmit={handleVerify} onBack={backToSignup} />}
        {!verificationStep && !recoveryMode && !adminSignInOnly && <p className="mt-7 text-center text-sm text-muted-foreground">{mode === "signin" ? "New to Matrix QA?" : "Already have an account?"}{" "}<button type="button" onClick={switchMode} className="text-primary hover:underline">{mode === "signin" ? "Create an account" : "Sign in"}</button></p>}
      </div>
      <p className="font-mono text-[11px] text-muted-foreground"><Link to="/" className="hover:text-foreground">← back to matrixqa.dev</Link></p>
    </div>
    <div className="relative hidden overflow-hidden border-l border-border bg-hero md:block"><div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" /><div className="relative flex h-full flex-col items-center justify-center p-10"><div className="w-full max-w-md rounded-2xl border border-border bg-surface/70 p-4 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur"><div className="flex items-center justify-between border-b border-border pb-3"><div className="flex items-center gap-2"><Terminal className="h-3.5 w-3.5 text-primary" /><span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">first_test · setup</span></div><span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">ready</span></div><div className="mt-3 space-y-2 font-mono text-[11px] leading-relaxed"><div className="text-muted-foreground">account boot · secure session</div><div>workspace <span className="text-success">provisioned</span></div><div>target ownership <span className="text-success">confirmed</span></div><div>fresh plan <span className="text-warning">next</span></div><div className="text-primary">● evidence-backed report ahead</div></div></div><p className="mt-6 max-w-sm text-center text-sm text-muted-foreground">Three short screens, then you can prepare your first real Matrix QA test.</p></div></div>
  </div>;
}

function OnboardingForm({ step, draft, updateDraft, loading, error, success, onSubmit, onBack, oauthProviders, oauthLoading, onOAuth }: { step: 1 | 2 | 3; draft: OnboardingDraft; updateDraft: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void; loading: boolean; error: string; success: string; onSubmit: (event: FormEvent) => void; onBack: () => void; oauthProviders: { google: boolean; github: boolean }; oauthLoading: boolean; onOAuth: (provider: "google" | "github") => void }) {
  const title = step === 1 ? "Create your account." : step === 2 ? "Shape your workspace." : "Test your first site.";
  const description = step === 1 ? "Start with the account you will use to review evidence-backed reports." : step === 2 ? "A little context helps Matrix QA make future guidance feel relevant. It never controls access." : "Tell Matrix QA what to observe first. Email updates are on by default.";
  return <form onSubmit={onSubmit} className="animate-in fade-in slide-in-from-right-3 duration-200 motion-reduce:animate-none" aria-label={`Onboarding screen ${step} of 3`}>
    <div className="flex items-center justify-between"><span className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Screen {step} of 3</span><span className="font-mono text-[10px] text-muted-foreground">{step === 1 ? "Account" : step === 2 ? "Workspace" : "First test"}</span></div>
    <div className="mt-3 flex gap-1.5" aria-label="Onboarding progress">{[1, 2, 3].map((item) => <span key={item} className={`h-1 flex-1 rounded-full ${item <= step ? "bg-primary" : "bg-surface-2"}`} />)}</div>
    <h1 className="mt-7 font-display text-3xl font-semibold text-gradient">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    {error && <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div>}{success && <div className="mt-5"><SuccessNotice>{success}</SuccessNotice></div>}
    <div className="mt-6 space-y-4">
      {step === 1 && <><div className="grid gap-2 sm:grid-cols-2">{oauthProviders.google && <button type="button" onClick={() => onOAuth("google")} disabled={loading || oauthLoading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"><Chrome className="h-4 w-4" />Continue with Google</button>}{oauthProviders.github && <button type="button" onClick={() => onOAuth("github")} disabled={loading || oauthLoading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"><Github className="h-4 w-4" />Continue with GitHub</button>}</div>{(oauthProviders.google || oauthProviders.github) && <div className="relative py-1 text-center text-[11px] text-muted-foreground"><span className="bg-background px-2">or use email</span></div>}<Field label="Your name" type="text" placeholder="Jane Cooper" autoComplete="name" value={draft.fullName} onChange={(event) => updateDraft("fullName", event.target.value)} disabled={loading} /><Field label="Work email" type="email" placeholder="jane@company.com" icon={<Mail className="h-4 w-4" />} autoComplete="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} disabled={loading} /><Field label="Password" type="password" placeholder="At least 8 characters" autoComplete="new-password" value={draft.password} onChange={(event) => updateDraft("password", event.target.value)} disabled={loading} /><div className="rounded-lg border border-border/70 bg-surface-2/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Email verification comes next.</strong> We’ll use it to activate your account before the first test is prepared.</div></>}
      {step === 2 && <><Field label="What should we call your workspace?" type="text" placeholder="Acme QA" autoComplete="organization" value={draft.workspaceName} onChange={(event) => updateDraft("workspaceName", event.target.value)} disabled={loading} /><fieldset><legend className="mb-2 text-xs font-medium text-foreground">What best describes you?</legend><div className="grid gap-2">{ROLE_OPTIONS.map((option) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${draft.role === option ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-surface-2/30 text-muted-foreground hover:bg-accent/50"}`}><input type="radio" name="role" value={option} checked={draft.role === option} onChange={() => updateDraft("role", option)} className="accent-primary" />{option}</label>)}</div></fieldset></>}
      {step === 3 && <><Field label="What’s the first thing you want tested?" type="url" placeholder="https://staging.your-app.com" autoComplete="url" value={draft.targetUrl} onChange={(event) => updateDraft("targetUrl", event.target.value)} disabled={loading} /><div className="flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">Don’t have a site to test yet?</span><a href="/sample-report" target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">See a sample report ↗</a></div><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-3 text-sm"><input type="checkbox" checked={draft.ownershipConfirmed} onChange={(event) => updateDraft("ownershipConfirmed", event.target.checked)} disabled={loading} className="mt-0.5 accent-primary" /><span><span className="font-medium text-foreground">I own this website, or I have permission to test it.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">This confirmation is required before Matrix QA prepares a test.</span></span></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-foreground">Anything specific you’re worried about? <span className="font-normal text-muted-foreground">(optional)</span></span><textarea value={draft.focusArea} onChange={(event) => updateDraft("focusArea", event.target.value)} disabled={loading} maxLength={2_000} rows={3} placeholder="e.g. Check the sign-up flow and mobile layout" className="w-full resize-none rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-sm leading-5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15" /></label><fieldset><legend className="mb-2 text-xs font-medium text-foreground">Test updates</legend><div className="grid gap-2 sm:grid-cols-2"><label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-xs ${draft.notifications === "email" ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-surface-2/30 text-muted-foreground"}`}><input type="radio" name="notifications" checked={draft.notifications === "email"} onChange={() => updateDraft("notifications", "email")} className="accent-primary" />Email only</label><label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-xs ${draft.notifications === "email_push" ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-surface-2/30 text-muted-foreground"}`}><input type="radio" name="notifications" checked={draft.notifications === "email_push"} onChange={() => updateDraft("notifications", "email_push")} className="accent-primary" />Email + push</label></div><p className="mt-1.5 text-[11px] text-muted-foreground">Email is on by default. Push can be added when device permissions are available.</p></fieldset></>}
    </div>
    <div className="mt-7 flex gap-2">{step > 1 && <button type="button" onClick={onBack} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"><ArrowLeft className="h-4 w-4" />Back</button>}<button type="submit" disabled={loading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow disabled:cursor-not-allowed disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{step < 3 ? "Continue" : "Create account & prepare first test"}{!loading && <ArrowRight className="h-4 w-4" />}</button></div>
  </form>;
}

function SignInForm({ adminSignInOnly, email, password, setEmail, setPassword, loading, error, success, onSubmit, onRecovery, oauthProviders, oauthLoading, onOAuth }: { adminSignInOnly: boolean; email: string; password: string; setEmail: (value: string) => void; setPassword: (value: string) => void; loading: boolean; error: string; success: string; onSubmit: (event: FormEvent) => void; onRecovery: () => void; oauthProviders: { google: boolean; github: boolean }; oauthLoading: boolean; onOAuth: (provider: "google" | "github") => void }) {
  return <form onSubmit={onSubmit} className="animate-in fade-in duration-200 motion-reduce:animate-none"><span className="font-mono text-xs uppercase tracking-widest text-primary">{adminSignInOnly ? "Matrix QA staff" : "Welcome back"}</span><h1 className="mt-2 font-display text-3xl font-semibold text-gradient">{adminSignInOnly ? "Sign in to staff operations." : "Return to the console."}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{adminSignInOnly ? "Use an existing staff-enabled Matrix QA account. Customer accounts cannot grant themselves staff access." : "Sign in to see your latest runs, evidence, and reports."}</p>{error && <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div>}{success && <div className="mt-5"><SuccessNotice>{success}</SuccessNotice></div>}{!adminSignInOnly && (oauthProviders.google || oauthProviders.github) && <><div className="mt-6 grid gap-2 sm:grid-cols-2">{oauthProviders.google && <button type="button" onClick={() => onOAuth("google")} disabled={loading || oauthLoading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"><Chrome className="h-4 w-4" />Google</button>}{oauthProviders.github && <button type="button" onClick={() => onOAuth("github")} disabled={loading || oauthLoading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"><Github className="h-4 w-4" />GitHub</button>}</div><div className="relative py-1 text-center text-[11px] text-muted-foreground"><span className="bg-background px-2">or use email</span></div></>}<div className="mt-6 space-y-4"><Field label="Work email" type="email" placeholder="jane@company.com" icon={<Mail className="h-4 w-4" />} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} /><Field label="Password" type="password" placeholder="••••••••" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} /></div><button type="submit" disabled={loading || !email || !password} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Sign in{!loading && <ArrowRight className="h-4 w-4" />}</button>{!adminSignInOnly && <button type="button" onClick={onRecovery} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-primary">Forgot your password?</button>}</form>;
}

function RecoveryForm({ email, setEmail, loading, error, success, onSubmit, onBack }: { email: string; setEmail: (value: string) => void; loading: boolean; error: string; success: string; onSubmit: (event: FormEvent) => void; onBack: () => void }) { return <form onSubmit={onSubmit} className="animate-in fade-in duration-200 motion-reduce:animate-none"><span className="font-mono text-xs uppercase tracking-widest text-primary">Account recovery</span><h1 className="mt-2 font-display text-3xl font-semibold text-gradient">Reset your password.</h1><p className="mt-2 text-sm text-muted-foreground">Enter your work email and we will send a single-use reset link.</p>{error && <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div>}{success && <div className="mt-5"><SuccessNotice>{success}</SuccessNotice></div>}<Field label="Work email" type="email" placeholder="jane@company.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} /><button type="submit" disabled={loading || !email} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Send reset link <ArrowRight className="h-4 w-4" /></button><button type="button" onClick={onBack} className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">Back to sign in</button></form>; }

function VerificationPanel({ email, code, loading, error, success, onCodeChange, onSubmit, onBack }: { email: string; code: string; loading: boolean; error: string; success: string; onCodeChange: (value: string) => void; onSubmit: (event: FormEvent) => void; onBack: () => void }) { return <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none"><div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><ShieldCheck className="h-6 w-6" /></div><span className="font-mono text-xs uppercase tracking-widest text-primary">Email verification</span><h1 className="mt-2 font-display text-3xl font-semibold text-gradient">One last little check.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it below to activate your account and prepare your first test.</p>{error && <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div>}{success && <div className="mt-5"><SuccessNotice>{success}</SuccessNotice></div>}<form onSubmit={onSubmit} className="mt-6 space-y-5"><label className="block"><span className="mb-2 block text-xs font-medium text-muted-foreground">Verification code</span><input value={code} onChange={(event) => onCodeChange(event.target.value)} inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} pattern="[0-9]{6}" placeholder="000000" aria-label="6-digit email verification code" className="w-full rounded-xl border border-primary/20 bg-surface-2/70 px-4 py-4 text-center font-mono text-3xl font-semibold tracking-[0.35em] text-foreground placeholder:text-muted-foreground/30 focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10" /></label><button type="submit" disabled={loading || code.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{loading ? "Verifying…" : "Verify email"}</button></form><div className="mt-6 flex items-center justify-between text-xs text-muted-foreground"><button type="button" onClick={onBack} className="hover:text-foreground hover:underline">← Review signup</button><span className="font-mono">expires in 10 min</span></div></div>; }

function ErrorNotice({ children }: { children: ReactNode }) { return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs leading-5 text-destructive" role="alert">{children}</div>; }
function SuccessNotice({ children }: { children: ReactNode }) { return <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs leading-5 text-primary" role="status"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{children}</div>; }
function Field({ label, icon, disabled, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: ReactNode; disabled?: boolean }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span><div className="relative">{icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}<input {...props} disabled={disabled} className={`w-full rounded-lg border border-border bg-surface-2/60 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 ${icon ? "pl-9 pr-3" : "px-3"}`} /></div></label>; }
function normalizeTargetUrl(value: string) { const trimmed = value.trim(); return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`; }
function isValidTargetUrl(value: string) { try { const parsed = new URL(normalizeTargetUrl(value)); return ["http:", "https:"].includes(parsed.protocol) && Boolean(parsed.hostname); } catch { return false; } }
