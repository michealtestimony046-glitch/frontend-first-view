import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Chrome, Github, Loader2, Mail, ShieldCheck, Terminal, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { authApi, formatRunStartError, organizationsApi, projectsApi, quickScanApi, v2Api, workspacesApi, workspaceConsentApi, type OnboardingQuickScanResult, type Project, type TriggerRunResponse } from "@/lib/api-client";
import { toQuickScanHandoff } from "@/lib/quick-scan-handoff";
import { useMutation } from "@/hooks/use-api";
import { enrollBrowserPush } from "@/lib/push-notifications";

const FIRST_TEST_READY_KEY = "matrix_qa_first_test_ready";
const ONBOARDING_PROFILE_KEY = "matrix_qa_onboarding_profile";
const ONBOARDING_QUICK_SCAN_KEY = "matrix_qa_onboarding_quick_scan";
const OAUTH_INTENT_KEY = "matrix_qa_oauth_intent";
const OAUTH_HANDOFF_KEY = "matrix_qa_oauth_handoff";
const OAUTH_HANDOFF_TTL_MS = 10 * 60 * 1000;

type OnboardingDraft = {
  fullName: string;
  email: string;
  password: string;
  workspaceName: string;
  role: string;
  targetUrl: string;
  ownershipConfirmed: boolean;
  improveMatrixQa: boolean;
  focusArea: string;
  notifications: "email" | "email_push";
};

const ROLE_OPTIONS = [
  "Solo developer / indie hacker",
  "Agency or team",
  "QA/engineering lead at a company",
  "Just exploring",
] as const;

type OAuthProvider = "google" | "github";
type QuickScanState = "idle" | "running" | "complete" | "failed";
type RealUserTestState = "idle" | "preparing" | "running" | "queued" | "failed";

const onboardingSleep = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));


function isOAuthProvider(value: string | null): value is OAuthProvider {
  return value === "google" || value === "github";
}

function oauthProviderLabel(provider: OAuthProvider) {
  return provider === "google" ? "Google" : "GitHub";
}

type OAuthHandoff = {
  userId: string;
  email: string;
  fullName: string;
  returnTo: "/app" | "/admin";
  expiresAt: number;
};

const readOAuthHandoff = (): OAuthHandoff | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(OAUTH_HANDOFF_KEY);
    if (!raw) return null;
    const handoff = JSON.parse(raw) as Partial<OAuthHandoff>;
    if (!handoff.userId || !handoff.email || !handoff.expiresAt || handoff.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(OAUTH_HANDOFF_KEY);
      return null;
    }
    return {
      userId: handoff.userId,
      email: handoff.email,
      fullName: handoff.fullName || "",
      returnTo: handoff.returnTo === "/admin" ? "/admin" : "/app",
      expiresAt: handoff.expiresAt,
    };
  } catch {
    window.sessionStorage.removeItem(OAUTH_HANDOFF_KEY);
    return null;
  }
};

const persistOAuthHandoff = (handoff: OAuthHandoff): void => {
  if (typeof window !== "undefined") window.sessionStorage.setItem(OAUTH_HANDOFF_KEY, JSON.stringify(handoff));
};

const clearOAuthHandoff = (): void => {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(OAUTH_HANDOFF_KEY);
};

const readOAuthIntent = (): "signin" | "signup" | null => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(OAUTH_INTENT_KEY) === "signin" ? "signin" : window.sessionStorage.getItem(OAUTH_INTENT_KEY) === "signup" ? "signup" : null;
};

const writeOAuthIntent = (mode: "signin" | "signup"): void => {
  if (typeof window !== "undefined") window.sessionStorage.setItem(OAUTH_INTENT_KEY, mode);
};

const clearOAuthIntent = (): void => {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(OAUTH_INTENT_KEY);
};

const authSearchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional().default("signup"),
  returnTo: z.enum(["/app", "/admin"]).optional().default("/app"),
  recover: z.boolean().optional().default(false),
  code: z.string().optional(),
  provider: z.string().optional(),
  state: z.string().optional(),
  oauth_error: z.string().optional(),
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
  const [initialOAuthHandoff] = useState<OAuthHandoff | null>(() => readOAuthHandoff());
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(initialOAuthHandoff ? 2 : 1);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [draft, setDraft] = useState<OnboardingDraft>(() => ({ fullName: initialOAuthHandoff?.fullName || "", email: initialOAuthHandoff?.email || "", password: "", workspaceName: "", role: "", targetUrl: "", ownershipConfirmed: false, improveMatrixQa: false, focusArea: "", notifications: "email" }));
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(search.recover);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState({ google: false, github: false });
  const [oauthProvidersLoaded, setOauthProvidersLoaded] = useState(false);
  const [oauthUserId, setOauthUserId] = useState<string | null>(initialOAuthHandoff?.userId || null);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
  const [quickScanState, setQuickScanState] = useState<QuickScanState>("idle");
  const [quickScanResult, setQuickScanResult] = useState<OnboardingQuickScanResult | null>(null);
  const [realUserTestState, setRealUserTestState] = useState<RealUserTestState>("idle");
  const [realUserTestResponse, setRealUserTestResponse] = useState<TriggerRunResponse | null>(null);
  const [realUserTestError, setRealUserTestError] = useState("");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const navigate = useNavigate();
  const returnTo = search.returnTo === "/admin" ? "/admin" : "/app";

    const [loginMutate, loginState] = useMutation(authApi.login);
  const [signupMutate, signupState] = useMutation(authApi.signup);
  const [verifyMutate, verifyState] = useMutation(authApi.verifyEmail);
  const [resendMutate, resendState] = useMutation(authApi.resendVerification);
  const isLoading = loginState.loading || signupState.loading || verifyState.loading || oauthLoading || quickScanState === "running" || realUserTestState === "preparing";


  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const providerValue = params.get("provider");
    const state = params.get("state");
    const oauthError = params.get("oauth_error");
    const clearCallbackParams = () => window.history.replaceState({}, "", "/auth");
    if (oauthError) {
      clearOAuthIntent();
      clearOAuthHandoff();
      clearCallbackParams();
      setErrorMessage("Social sign-in could not be completed. Please try again.");
      authApi.oauthProviders().then((available) => { if (active) { setOauthProviders(available); setOauthProvidersLoaded(true); } }).catch(() => { if (active) setOauthProvidersLoaded(true); });
    } else if (!code && !providerValue && !state) {
      authApi.oauthProviders().then((available) => { if (active) { setOauthProviders(available); setOauthProvidersLoaded(true); } }).catch(() => { if (active) setOauthProvidersLoaded(true); });
    } else if (!code || !state || !isOAuthProvider(providerValue)) {
      clearOAuthIntent();
      clearOAuthHandoff();
      clearCallbackParams();
      setErrorMessage("The social sign-in link is incomplete or expired. Please start again.");
    } else {
      const provider = providerValue;
      setOauthLoading(true);
      authApi.handleOAuthCallback(code, provider, state)
        .then((response) => {
          const oauthIntent = readOAuthIntent();
          clearOAuthIntent();
          const isFirstTimeOAuthUser = response.isNewUser === true || (response.isNewUser === undefined && oauthIntent === "signup");
          if (isFirstTimeOAuthUser && !adminSignInOnly) {
            const email = response.user.email.trim().toLowerCase();
            const fullName = response.user.fullName?.trim() || "";
            persistOAuthHandoff({ userId: response.user.id, email, fullName, returnTo, expiresAt: Date.now() + OAUTH_HANDOFF_TTL_MS });
            setOauthUserId(response.user.id);
            setDraft((current) => ({ ...current, email, fullName: fullName || current.fullName }));
            setSelectedMode("signup");
            setOnboardingStep(2);
            setSuccessMessage(`Signed in with ${oauthProviderLabel(provider)}. Finish the short workspace and first-test setup.`);
            clearCallbackParams();
          } else {
            clearOAuthHandoff();
            clearCallbackParams();
            navigate({ to: returnTo });
          }
        })
        .catch((cause) => {
          clearOAuthIntent();
          clearOAuthHandoff();
          clearCallbackParams();
          setErrorMessage(cause instanceof Error ? cause.message : `${oauthProviderLabel(provider)} sign-in could not be completed.`);
        })
        .finally(() => { if (active) setOauthLoading(false); });
    }
    return () => { active = false; };
  }, [adminSignInOnly, navigate, returnTo]);

  const startOAuth = (provider: "google" | "github") => {
    setOauthLoading(true);
    writeOAuthIntent(mode);
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
      void submitSignup();
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
    const cleanDraft = { ...draft, targetUrl: normalizeTargetUrl(draft.targetUrl), focusArea: draft.focusArea.trim() };
    void (async () => {
      try {
        const completedQuickScan = await runQuickScan(cleanDraft);
        const userId = oauthUserId || verifiedUserId;
        if (!userId) throw new Error("Verify your email before preparing the first test.");
        await provisionFirstTest(cleanDraft, userId, completedQuickScan);
        setOnboardingComplete(true);
        clearOAuthHandoff();
        setSuccessMessage("Quick Scan is complete. Your Real User Test is moving forward in the background.");
      } catch (cause) {
        setErrorMessage(cause instanceof Error ? cause.message : "We could not start your Quick Scan. Please try again.");
      }
    })();
  };

  const runQuickScan = async (onboarding: OnboardingDraft) => {
    setQuickScanState("running");
    setQuickScanResult(null);
    setErrorMessage("");
    try {
      const result = await quickScanApi.run({ targetUrl: onboarding.targetUrl, ownershipConfirmed: onboarding.ownershipConfirmed });
      setQuickScanResult(result);
      setQuickScanState(result.status === "COMPLETED" ? "complete" : "failed");
      localStorage.setItem(ONBOARDING_QUICK_SCAN_KEY, JSON.stringify(result));
      if (result.status !== "COMPLETED") throw new Error(result.errorMessage || "Quick Scan could not reach this target.");
      return result;
    } catch (cause) {
      setQuickScanState("failed");
      throw cause;
    }
  };

  const startRealUserTest = async (onboarding: OnboardingDraft, project: Project, handoff: OnboardingQuickScanResult) => {
    setRealUserTestState("preparing");
    setRealUserTestError("");
    try {
      const createdScan = await v2Api.startScan(project.id, { targetUrl: onboarding.targetUrl, missionGoal: onboarding.focusArea.trim() || "Test this website thoroughly.", accessMode: "ANONYMOUS" });
      let scan = createdScan;
      while (scan.status === "PENDING" || scan.status === "RUNNING") {
        await onboardingSleep(1_800);
        scan = await v2Api.getScan(scan.id);
      }
      if (scan.status !== "COMPLETED") throw new Error(scan.errorMessage || "The Real User Test could not finish its fresh preparation.");
      const plan = await v2Api.createPlanFromScan(scan.id, { name: "First Real User Test", mode: "QUICK_SMOKE", missionGoal: onboarding.focusArea.trim() || "Test this website thoroughly.", accessMode: "ANONYMOUS" });
      const blockedPolicy = plan.policyDecisions.some((decision) => decision.status !== "ALLOWED" && decision.status !== "APPROVED");
      if (blockedPolicy || plan.scenarios.length === 0) throw new Error("The Real User Test needs a safe plan review before it can start.");
      const approvedPlan = plan.status === "APPROVED" ? plan : await v2Api.approvePlan(plan.id);
      const response = await v2Api.runPlan(approvedPlan.id, { targetUrl: onboarding.targetUrl, accessMode: "ANONYMOUS", targetAuthorizationConfirmed: onboarding.ownershipConfirmed, enableVision: false, enableRecovery: false, quickScanHandoff: toQuickScanHandoff(handoff) });
      setRealUserTestResponse(response);
      setRealUserTestState(response.metadata?.providerCapacity?.status === "WAITING" ? "queued" : "running");
      localStorage.removeItem(FIRST_TEST_READY_KEY);
      return response;
    } catch (cause) {
      setRealUserTestState("failed");
      setRealUserTestError(formatRunStartError(cause, "The Real User Test could not start yet."));
      localStorage.setItem(FIRST_TEST_READY_KEY, JSON.stringify({ projectId: project.id, targetUrl: onboarding.targetUrl, missionGoal: onboarding.focusArea.trim() || "Test this website thoroughly.", autoStart: true, targetAuthorizationConfirmed: onboarding.ownershipConfirmed }));
      return null;
    }
  };

  const submitSignup = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    const cleanDraft = { ...draft, email: draft.email.trim().toLowerCase(), fullName: draft.fullName.trim(), workspaceName: draft.workspaceName.trim(), targetUrl: normalizeTargetUrl(draft.targetUrl), focusArea: draft.focusArea.trim() };
    try {
      const response = await signupMutate({ email: cleanDraft.email, password: cleanDraft.password, fullName: cleanDraft.fullName });
      setVerificationEmail(response.email || cleanDraft.email);
      setVerificationCode("");
      setVerificationStep(true);
      setSuccessMessage("Account created. Check your email for a verification code before continuing to workspace setup.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "We could not create your account. Please try again.";
      setErrorMessage(message);
    }
  };

  const provisionFirstTest = async (onboarding: OnboardingDraft, userId: string, handoff: OnboardingQuickScanResult) => {
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
    await workspaceConsentApi.update(workspace.id, onboarding.improveMatrixQa);
    const existing = await projectsApi.list(activeOrganization.id, workspace.id);
    const project: Project = existing.find((item) => item.defaultTargetUrl === onboarding.targetUrl) ?? await projectsApi.create({ organizationId: activeOrganization.id, workspaceId: workspace.id, name: `${desiredOrganizationName} first test`, description: onboarding.focusArea.trim() || undefined, defaultTargetUrl: onboarding.targetUrl });
    localStorage.setItem("matrix_qa_active_project", project.id);
    localStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify({ userId, role: onboarding.role, notifications: onboarding.notifications, focusArea: onboarding.focusArea.trim() }));
    if (onboarding.notifications === "email_push") await enrollBrowserPush().catch(() => undefined);
    void startRealUserTest(onboarding, project, handoff);
  };

    const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    if (verificationCode.length !== 6) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await verifyMutate({ email: verificationEmail, code: verificationCode });
      setVerifiedUserId(response.user.id);
      setVerificationEmail("");
      setVerificationStep(false);
      setOnboardingStep(2);
      setSuccessMessage("Email verified. Continue with your workspace setup.");
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "We could not verify your email. Please try again.");
    }
  };

  const handleResendCode = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await resendMutate({ email: verificationEmail });
      setSuccessMessage("A new code is on its way.");
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "We could not resend the code. Please try again.");
    }
  };

  const handleCodeChange = (value: string) => { setVerificationCode(value.replace(/\D/g, "").slice(0, 6)); setErrorMessage(""); };

  const backToSignup = () => { setVerificationStep(false); setVerificationCode(""); setVerificationEmail(""); setErrorMessage(""); setSuccessMessage(""); };
  const switchMode = () => { if (adminSignInOnly) return; clearOAuthHandoff(); setSelectedMode((current) => current === "signin" ? "signup" : "signin"); setRecoveryMode(false); setOnboardingStep(1); setErrorMessage(""); setSuccessMessage(""); };

  return <div className="grid min-h-screen bg-background md:grid-cols-2">
    <div className="flex flex-col justify-between p-6 sm:p-8 md:p-12">
      <Logo />
      <div className="mx-auto w-full max-w-md">
        {!verificationStep ? recoveryMode ? <RecoveryForm email={draft.email} setEmail={(value) => updateDraft("email", value)} loading={isLoading} error={errorMessage} success={successMessage} onSubmit={handleRequestReset} onBack={() => { setRecoveryMode(false); setErrorMessage(""); setSuccessMessage(""); }} /> : mode === "signin" ? <SignInForm adminSignInOnly={adminSignInOnly} email={draft.email} password={draft.password} setEmail={(value) => updateDraft("email", value)} setPassword={(value) => updateDraft("password", value)} loading={isLoading} error={errorMessage} success={successMessage} onSubmit={handleSignIn} onRecovery={() => { setRecoveryMode(true); setErrorMessage(""); setSuccessMessage(""); }} oauthProviders={oauthProviders} oauthProvidersLoaded={oauthProvidersLoaded} oauthLoading={oauthLoading} onOAuth={startOAuth} /> : <OnboardingForm key={`onboarding-${onboardingStep}`} step={onboardingStep} draft={draft} updateDraft={updateDraft} loading={isLoading} error={errorMessage} success={successMessage} onSubmit={continueOnboarding} onBack={() => { setErrorMessage(""); setOnboardingStep((current) => current > 1 ? (current - 1) as 1 | 2 | 3 : 1); }} oauthProviders={oauthProviders} oauthProvidersLoaded={oauthProvidersLoaded} oauthLoading={oauthLoading}         onOAuth={startOAuth} quickScanState={quickScanState} quickScanResult={quickScanResult} realUserTestState={realUserTestState} realUserTestResponse={realUserTestResponse} realUserTestError={realUserTestError} onboardingComplete={onboardingComplete} onContinueToApp={() => navigate({ to: "/app" })} /> : <VerificationPanel email={verificationEmail} code={verificationCode} loading={isLoading} error={errorMessage} success={successMessage} onCodeChange={handleCodeChange} onSubmit={handleVerify} onBack={backToSignup} onResend={handleResendCode} resendLoading={resendState.loading} />}
        {!verificationStep && !recoveryMode && !adminSignInOnly && <p className="mt-7 text-center text-sm text-muted-foreground">{mode === "signin" ? "New to Matrix QA?" : "Already have an account?"}{" "}<button type="button" onClick={switchMode} className="text-primary hover:underline">{mode === "signin" ? "Create an account" : "Sign in"}</button></p>}
      </div>
      <p className="font-mono text-[11px] text-muted-foreground"><Link to="/" className="hover:text-foreground">← back to matrixqa.dev</Link></p>
    </div>
    <div className="relative hidden overflow-hidden border-l border-border bg-hero md:block"><div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" /><div className="relative flex h-full flex-col items-center justify-center p-10"><div className="w-full max-w-md rounded-2xl border border-border bg-surface/70 p-4 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur"><div className="flex items-center justify-between border-b border-border pb-3"><div className="flex items-center gap-2"><Terminal className="h-3.5 w-3.5 text-primary" /><span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">first_test · setup</span></div><span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">ready</span></div><div className="mt-3 space-y-2 font-mono text-[11px] leading-relaxed"><div className="text-muted-foreground">account boot · secure session</div><div>workspace <span className="text-success">provisioned</span></div><div>target ownership <span className="text-success">confirmed</span></div><div>fresh plan <span className="text-warning">next</span></div><div className="text-primary">● evidence-backed report ahead</div></div></div><p className="mt-6 max-w-sm text-center text-sm text-muted-foreground">Three short screens, then you can prepare your first real Matrix QA test.</p></div></div>
  </div>;
}

function OAuthButtons({ providers, loaded, loading, onOAuth }: { providers: { google: boolean; github: boolean }; loaded: boolean; loading: boolean; onOAuth: (provider: "google" | "github") => void }) {
  const providerLabel = (provider: "google" | "github") => provider === "google" ? "Google" : "GitHub";
  return <div className="space-y-2" aria-label="Social sign-in options">
    <div className="grid gap-2 sm:grid-cols-2">
      {(["google", "github"] as const).map((provider) => {
        const configured = providers[provider];
        const label = providerLabel(provider);
        return <button key={provider} type="button" onClick={() => onOAuth(provider)} disabled={loading || !loaded || !configured} aria-disabled={!loaded || !configured} title={!loaded ? "Checking sign-in availability" : configured ? `Continue with ${label}` : `${label} sign-in is not configured yet`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-55"><span aria-hidden="true">{provider === "google" ? <Chrome className="h-4 w-4" /> : <Github className="h-4 w-4" />}</span>Continue with {label}</button>;
      })}
    </div>
    {!loaded ? <p className="text-center text-[11px] text-muted-foreground" role="status">Checking social sign-in availability…</p> : !providers.google && !providers.github ? <p className="text-center text-[11px] leading-5 text-muted-foreground">Google and GitHub are visible here and will become active when provider setup is enabled.</p> : null}
  </div>;
}

function renderInlineMarkdown(value: string): ReactNode {
  return value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${part}-${index}`} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={`${part}-${index}`} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.9em] text-primary">{part.slice(1, -1)}</code>;
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

type QuickScanSummaryItem = { title?: string; body: string };

function parseQuickScanItem(value: string): QuickScanSummaryItem {
  const clean = value.replace(/^\s*(?:[-*]|\d+[.)])\s+/, "").trim();
  const boldTitle = clean.match(/^\*\*(.+?)\*\*\s*(?:(?:[-–—:]\s*)|(\s+))(.+)$/);
  if (boldTitle) return { title: boldTitle[1].trim(), body: boldTitle[3].trim() };
  const title = clean.match(/^([^:]{3,90}):\s+(.+)$/);
  if (title) return { title: title[1].trim(), body: title[2].trim() };
  return { body: clean };
}

function QuickScanSummary({ summary }: { summary: string | null }) {
  if (!summary?.trim()) return <p className="text-sm leading-6 text-muted-foreground">The page checks completed, but the summary provider was unavailable. The scan evidence is still available in this flow.</p>;
  const normalizedSummary = summary.trim().replace(/\s+(?=\d+[.)]\s+(?:\*\*|[A-Z<`]))/g, "\n").replace(/\s+(?=[-*]\s+)/g, "\n");
  const lines = normalizedSummary.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const blocks: Array<{ type: "heading" | "paragraph" | "list"; lines: string[] }> = [];
  for (const line of lines) {
    const isList = /^\s*(?:[-*]|\d+[.)])\s+/.test(line);
    const isHeading = /^#{1,3}\s+/.test(line);
    const type = isHeading ? "heading" : isList ? "list" : "paragraph";
    const previous = blocks[blocks.length - 1];
    if (previous?.type === type && type === "list") previous.lines.push(line);
    else blocks.push({ type, lines: [line] });
  }
  return <div className="space-y-3 text-sm leading-6 text-foreground">
    {blocks.map((block, blockIndex) => {
      if (block.type === "heading") return <h3 key={`summary-heading-${blockIndex}`} className="font-display text-sm font-semibold text-foreground">{renderInlineMarkdown(block.lines[0].replace(/^#{1,3}\s+/, ""))}</h3>;
      if (block.type === "list") return <ul key={`summary-list-${blockIndex}`} className="space-y-2">{block.lines.map((line, lineIndex) => { const item = parseQuickScanItem(line); return <li key={`summary-item-${lineIndex}`} className="rounded-lg border border-primary/15 bg-background/35 px-3 py-2.5">{item.title ? <><span className="font-semibold text-foreground">{renderInlineMarkdown(item.title)}</span>{item.body ? <span className="text-muted-foreground"> — {renderInlineMarkdown(item.body)}</span> : null}</> : <span>{renderInlineMarkdown(item.body)}</span>}</li>; })}</ul>;
      return <p key={`summary-paragraph-${blockIndex}`}>{renderInlineMarkdown(block.lines.join(" "))}</p>;
    })}
  </div>;
}

function QuickScanFindingList({ findings }: { findings: OnboardingQuickScanResult["findings"] }) {
  if (findings.length === 0) return null;
  return <ul className="space-y-2">{findings.slice(0, 5).map((finding) => <li key={`${finding.code}-${finding.evidence}`} className="rounded-lg border border-primary/15 bg-background/35 px-3 py-2.5 text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">{finding.title}:</span> {finding.evidence}</li>)}</ul>;
}

function OnboardingForm({ step, draft, updateDraft, loading, error, success, onSubmit, onBack, oauthProviders, oauthProvidersLoaded, oauthLoading, onOAuth, quickScanState, quickScanResult, realUserTestState, realUserTestResponse, realUserTestError, onboardingComplete, onContinueToApp }: { step: 1 | 2 | 3; draft: OnboardingDraft; updateDraft: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void; loading: boolean; error: string; success: string; onSubmit: (event: FormEvent) => void; onBack: () => void; oauthProviders: { google: boolean; github: boolean }; oauthProvidersLoaded: boolean; oauthLoading: boolean; onOAuth: (provider: "google" | "github") => void; quickScanState: QuickScanState; quickScanResult: OnboardingQuickScanResult | null; realUserTestState: RealUserTestState; realUserTestResponse: TriggerRunResponse | null; realUserTestError: string; onboardingComplete: boolean; onContinueToApp: () => void }) {
  const title = step === 1 ? "Create your account." : step === 2 ? "Shape your workspace." : "Test your first site.";
  const description = step === 1 ? "Start with the account you will use to review evidence-backed reports." : step === 2 ? "A little context helps Matrix QA make future guidance feel relevant. It never controls access." : "Tell Matrix QA what to observe first. Email updates are on by default.";
  const completedScan = step === 3 && quickScanState === "complete" && Boolean(quickScanResult);
  const runHref = realUserTestResponse?.id && realUserTestResponse.projectId ? `/app/runs/${encodeURIComponent(realUserTestResponse.id)}?projectId=${encodeURIComponent(realUserTestResponse.projectId)}` : null;
  return <form onSubmit={onSubmit} className="animate-in fade-in slide-in-from-right-3 duration-200 motion-reduce:animate-none" aria-label={`Onboarding screen ${step} of 3`}>
    <div className="flex items-center justify-between"><span className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Screen {step} of 3</span><span className="font-mono text-[10px] text-muted-foreground">{step === 1 ? "Account" : step === 2 ? "Workspace" : "First test"}</span></div>
    <div className="mt-3 flex gap-1.5" aria-label="Onboarding progress">{[1, 2, 3].map((item) => <span key={item} className={`h-1 flex-1 rounded-full ${item <= step ? "bg-primary" : "bg-surface-2"}`} />)}</div>
    <h1 className="mt-7 font-display text-3xl font-semibold text-gradient">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    {error && <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div>}{success && <div className="mt-5"><SuccessNotice>{success}</SuccessNotice></div>}
    <div className="mt-6 space-y-4">
      {step === 1 && <><OAuthButtons providers={oauthProviders} loaded={oauthProvidersLoaded} loading={loading || oauthLoading} onOAuth={onOAuth} /><div className="relative py-1 text-center text-[11px] text-muted-foreground"><span className="bg-background px-2">or use email</span></div><Field label="Your name" type="text" placeholder="Jane Cooper" autoComplete="name" value={draft.fullName} onChange={(event) => updateDraft("fullName", event.target.value)} disabled={loading} /><Field label="Work email" type="email" placeholder="jane@company.com" icon={<Mail className="h-4 w-4" />} autoComplete="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} disabled={loading} /><Field label="Password" type="password" placeholder="At least 8 characters" autoComplete="new-password" value={draft.password} onChange={(event) => updateDraft("password", event.target.value)} disabled={loading} /><div className="rounded-lg border border-border/70 bg-surface-2/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Email verification comes next.</strong> We’ll use it to activate your account before the first test is prepared.</div></>}
      {step === 2 && <><Field label="What should we call your workspace?" type="text" placeholder="Acme QA" autoComplete="organization" value={draft.workspaceName} onChange={(event) => updateDraft("workspaceName", event.target.value)} disabled={loading} /><fieldset><legend className="mb-2 text-xs font-medium text-foreground">What best describes you?</legend><div className="grid gap-2">{ROLE_OPTIONS.map((option) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${draft.role === option ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-surface-2/30 text-muted-foreground hover:bg-accent/50"}`}><input type="radio" name="role" value={option} checked={draft.role === option} onChange={() => updateDraft("role", option)} className="accent-primary" />{option}</label>)}</div></fieldset></>}
      {step === 3 && <><Field label="What’s the first thing you want tested?" type="url" placeholder="https://staging.your-app.com" autoComplete="url" value={draft.targetUrl} onChange={(event) => updateDraft("targetUrl", event.target.value)} disabled={loading} /><div className="flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">Don’t have a site to test yet?</span><a href="/sample-report" target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">See a sample report ↗</a></div><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-3 text-sm"><input type="checkbox" checked={draft.ownershipConfirmed} onChange={(event) => updateDraft("ownershipConfirmed", event.target.checked)} disabled={loading} className="mt-0.5 accent-primary" /><span><span className="font-medium text-foreground">I own this website, or I have permission to test it.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">This confirmation is required before Matrix QA prepares a test.</span></span></label><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-2/30 px-3 py-3 text-sm"><input type="checkbox" checked={draft.improveMatrixQa} onChange={(event) => updateDraft("improveMatrixQa", event.target.checked)} disabled={loading} className="mt-0.5 accent-primary" /><span><span className="font-medium text-foreground">Allow anonymized patterns from your test runs to help improve Matrix QA for everyone.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Optional and off by default. Your actual site data, screenshots, and findings stay private to your workspace either way.</span></span></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-foreground">Anything specific you’re worried about? <span className="font-normal text-muted-foreground">(optional)</span></span><textarea value={draft.focusArea} onChange={(event) => updateDraft("focusArea", event.target.value)} disabled={loading} maxLength={2_000} rows={3} placeholder="e.g. Check the sign-up flow and mobile layout" className="w-full resize-none rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-sm leading-5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15" /></label><fieldset><legend className="mb-2 text-xs font-medium text-foreground">Test updates</legend><div className="grid gap-2 sm:grid-cols-2"><label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-xs ${draft.notifications === "email" ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-surface-2/30 text-muted-foreground"}`}><input type="radio" name="notifications" checked={draft.notifications === "email"} onChange={() => updateDraft("notifications", "email")} className="accent-primary" />Email only</label><label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-xs ${draft.notifications === "email_push" ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-surface-2/30 text-muted-foreground"}`}><input type="radio" name="notifications" checked={draft.notifications === "email_push"} onChange={() => updateDraft("notifications", "email_push")} className="accent-primary" />Email + push</label></div><p className="mt-1.5 text-[11px] text-muted-foreground">Email is on by default. Push can be added when device permissions are available.</p></fieldset></>}
    </div>
    {step === 3 && quickScanState === "failed" && <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4" role="alert"><div className="text-sm font-semibold text-destructive">Quick Scan could not complete.</div><p className="mt-2 text-xs leading-5 text-muted-foreground">The page was not scanned successfully. Fix the target or try the Quick Scan again; no Real User Test result has been claimed.</p></div>}
    {step === 3 && quickScanState === "running" && <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4" role="status" aria-live="polite"><div className="flex items-center gap-2 text-sm font-semibold text-primary"><Loader2 className="h-4 w-4 animate-spin" />Quick Scan is checking the page now.</div><p className="mt-2 text-xs leading-5 text-muted-foreground">We are checking the page structure, metadata, links, and accessibility basics. This does not replace the Real User Test.</p></div>}
    {step === 3 && completedScan && quickScanResult && <div className="mt-6 space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4" role="status" aria-live="polite"><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-semibold text-primary">Quick Scan complete</div><p className="mt-1 text-xs text-muted-foreground">{quickScanResult.findingCount} structural finding{quickScanResult.findingCount === 1 ? "" : "s"} found · {quickScanResult.summaryStatus === "AI_GENERATED" ? "summary written from the scan evidence" : "summary unavailable"}</p></div><span className="font-mono text-[10px] uppercase tracking-wider text-primary">HTTP {quickScanResult.httpStatus ?? "—"}</span></div><div className="rounded-lg border border-primary/20 bg-background/30 p-3"><QuickScanSummary summary={quickScanResult.summary} /></div><QuickScanFindingList findings={quickScanResult.findings} /><div className="border-t border-primary/20 pt-3"><p className="text-sm font-semibold leading-5 text-foreground">{realUserTestState === "running" || realUserTestState === "queued" ? "Your Real User Test is running now — this is where Matrix QA finds the bugs a scanner can’t see." : realUserTestState === "preparing" ? "Your Real User Test is being prepared now — keep this page open while the live run is admitted." : realUserTestState === "failed" ? "The Real User Test needs attention before it can start." : "Finish the short account step and your Real User Test will start in the background."}</p>{realUserTestState === "failed" && realUserTestError && <p className="mt-1 text-xs leading-5 text-destructive">{realUserTestError}</p>}{runHref ? <a href={runHref} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow"><ArrowRight className="h-4 w-4" />Watch the Real User Test live</a> : realUserTestState === "preparing" ? <a href="/app" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/30 px-3.5 py-2.5 text-sm font-medium text-primary hover:bg-primary/10">Open the console</a> : null}</div></div>}
    <div className="mt-7 flex gap-2">{step > 1 && !completedScan && <button type="button" onClick={onBack} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"><ArrowLeft className="h-4 w-4" />Back</button>}{step < 3 && <button type="submit" disabled={loading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow disabled:cursor-not-allowed disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Continue{!loading && <ArrowRight className="h-4 w-4" />}</button>}{step === 3 && !completedScan && <button type="submit" disabled={loading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow disabled:cursor-not-allowed disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{quickScanState === "failed" ? "Retry Quick Scan" : "Run Quick Scan"}{!loading && <ArrowRight className="h-4 w-4" />}</button>}{step === 3 && completedScan && onboardingComplete && <button type="button" onClick={onContinueToApp} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15">Open the console<ArrowRight className="h-4 w-4" /></button>}{step === 3 && completedScan && !onboardingComplete && <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin" />Finishing setup…</span>}</div>
  </form>;
}

function SignInForm({ adminSignInOnly, email, password, setEmail, setPassword, loading, error, success, onSubmit, onRecovery, oauthProviders, oauthProvidersLoaded, oauthLoading, onOAuth }: { adminSignInOnly: boolean; email: string; password: string; setEmail: (value: string) => void; setPassword: (value: string) => void; loading: boolean; error: string; success: string; onSubmit: (event: FormEvent) => void; onRecovery: () => void; oauthProviders: { google: boolean; github: boolean }; oauthProvidersLoaded: boolean; oauthLoading: boolean; onOAuth: (provider: "google" | "github") => void }) {
  return <form onSubmit={onSubmit} className="animate-in fade-in duration-200 motion-reduce:animate-none"><span className="font-mono text-xs uppercase tracking-widest text-primary">{adminSignInOnly ? "Matrix QA staff" : "Welcome back"}</span><h1 className="mt-2 font-display text-3xl font-semibold text-gradient">{adminSignInOnly ? "Sign in to staff operations." : "Return to the console."}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{adminSignInOnly ? "Use an existing staff-enabled Matrix QA account. Customer accounts cannot grant themselves staff access." : "Sign in to see your latest runs, evidence, and reports."}</p>{error && <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div>}{success && <div className="mt-5"><SuccessNotice>{success}</SuccessNotice></div>}{!adminSignInOnly && <><div className="mt-6"><OAuthButtons providers={oauthProviders} loaded={oauthProvidersLoaded} loading={loading || oauthLoading} onOAuth={onOAuth} /></div><div className="relative py-1 text-center text-[11px] text-muted-foreground"><span className="bg-background px-2">or use email</span></div></>}<div className="mt-6 space-y-4"><Field label="Work email" type="email" placeholder="jane@company.com" icon={<Mail className="h-4 w-4" />} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} /><Field label="Password" type="password" placeholder="••••••••" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} /></div><button type="submit" disabled={loading || !email || !password} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Sign in{!loading && <ArrowRight className="h-4 w-4" />}</button>{!adminSignInOnly && <button type="button" onClick={onRecovery} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-primary">Forgot your password?</button>}</form>;
}

function RecoveryForm({ email, setEmail, loading, error, success, onSubmit, onBack }: { email: string; setEmail: (value: string) => void; loading: boolean; error: string; success: string; onSubmit: (event: FormEvent) => void; onBack: () => void }) { return <form onSubmit={onSubmit} className="animate-in fade-in duration-200 motion-reduce:animate-none"><span className="font-mono text-xs uppercase tracking-widest text-primary">Account recovery</span><h1 className="mt-2 font-display text-3xl font-semibold text-gradient">Reset your password.</h1><p className="mt-2 text-sm text-muted-foreground">Enter your work email and we will send a single-use reset link.</p>{error && <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div>}{success && <div className="mt-5"><SuccessNotice>{success}</SuccessNotice></div>}<Field label="Work email" type="email" placeholder="jane@company.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} /><button type="submit" disabled={loading || !email} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Send reset link <ArrowRight className="h-4 w-4" /></button><button type="button" onClick={onBack} className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">Back to sign in</button></form>; }

function VerificationPanel({ email, code, loading, error, success, onCodeChange, onSubmit, onBack, onResend, resendLoading }: { email: string; code: string; loading: boolean; error: string; success: string; onCodeChange: (value: string) => void; onSubmit: (event: FormEvent) => void; onBack: () => void; onResend: () => void; resendLoading: boolean }) { return <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none"><div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><ShieldCheck className="h-6 w-6" /></div><span className="font-mono text-xs uppercase tracking-widest text-primary">Email verification</span><h1 className="mt-2 font-display text-3xl font-semibold text-gradient">One last little check.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it below to activate your account and prepare your first test.</p>{error && <div className="mt-5"><ErrorNotice>{error}</ErrorNotice></div>}{success && <div className="mt-5"><SuccessNotice>{success}</SuccessNotice></div>}<form onSubmit={onSubmit} className="mt-6 space-y-5"><label className="block"><span className="mb-2 block text-xs font-medium text-muted-foreground">Verification code</span><input value={code} onChange={(event) => onCodeChange(event.target.value)} inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} pattern="[0-9]{6}" placeholder="000000" aria-label="6-digit email verification code" className="w-full rounded-xl border border-primary/20 bg-surface-2/70 px-4 py-4 text-center font-mono text-3xl font-semibold tracking-[0.35em] text-foreground placeholder:text-muted-foreground/30 focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10" /></label><button type="submit" disabled={loading || code.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{loading ? "Verifying…" : "Verify email"}</button></form><div className="mt-4 text-center"><button type="button" onClick={onResend} disabled={resendLoading} className="text-xs font-medium text-primary hover:underline disabled:opacity-50">{resendLoading ? "Sending a new code…" : "Didn't get a code? Resend it"}</button></div><div className="mt-6 flex items-center justify-between text-xs text-muted-foreground"><button type="button" onClick={onBack} className="hover:text-foreground hover:underline">← Review signup</button><span className="font-mono">expires in 10 min</span></div></div>; }

function ErrorNotice({ children }: { children: ReactNode }) { return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs leading-5 text-destructive" role="alert">{children}</div>; }
function SuccessNotice({ children }: { children: ReactNode }) { return <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs leading-5 text-primary" role="status"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{children}</div>; }
function Field({ label, icon, disabled, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: ReactNode; disabled?: boolean }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span><div className="relative">{icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}<input {...props} disabled={disabled} className={`w-full rounded-lg border border-border bg-surface-2/60 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 ${icon ? "pl-9 pr-3" : "px-3"}`} /></div></label>; }
function normalizeTargetUrl(value: string) { const trimmed = value.trim(); return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`; }
function isValidTargetUrl(value: string) { try { const parsed = new URL(normalizeTargetUrl(value)); return ["http:", "https:"].includes(parsed.protocol) && Boolean(parsed.hostname); } catch { return false; } }
