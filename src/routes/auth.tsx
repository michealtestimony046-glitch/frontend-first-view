import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Github, Mail, Terminal, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { authApi } from "@/lib/api-client";
import { useMutation } from "@/hooks/use-api";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Matrix QA" },
      { name: "description", content: "Sign in to the Matrix QA console." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [loginMutate, loginState] = useMutation(authApi.login);
  const [signupMutate, signupState] = useMutation(async (data: any) => {
    const res = await authApi.signup(data);
    return res;
  });

  const isLoading = loginState.loading || signupState.loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      if (mode === "signin") {
        await loginMutate({ email, password });
      } else {
        // Pass fullName if the backend supports it, or just email/password as per current authApi.signup
        await signupMutate({ email, password });
      }
      
      // Small delay to ensure state/tokens are settled
      setTimeout(() => {
        navigate({ to: "/app" });
      }, 100);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Authentication failed. Please try again."
      );
    }
  };

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col justify-between p-8 md:p-12">
        <Logo />

        <div className="mx-auto w-full max-w-sm">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            {mode === "signin" ? "Welcome back" : "Get started"}
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-gradient">
            {mode === "signin"
              ? "Return to the console."
              : "Spin up your first run."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to see your latest runs and evidence."
              : "One workspace, one project, unlimited v1 runs while in preview."}
          </p>

          <div className="mt-8 grid gap-2">
            <button className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface/60 py-2.5 text-sm font-medium transition-colors hover:bg-accent">
              <Github className="h-4 w-4" />
              Continue with GitHub
            </button>
            <button className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface/60 py-2.5 text-sm font-medium transition-colors hover:bg-accent">
              <GoogleIcon /> Continue with Google
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMessage && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {errorMessage}
              </div>
            )}
            {mode === "signup" && (
              <Field
                label="Full name"
                type="text"
                placeholder="Jane Cooper"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}
            <Field
              label="Work email"
              type="email"
              placeholder="jane@company.com"
              icon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <Field
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || !email || !password || (mode === "signup" && !fullName)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground btn-primary-glow transition-transform hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create workspace"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to Matrix QA?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="font-mono text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← back to matrixqa.dev
          </Link>
        </p>
      </div>

      {/* Right: showcase */}
      <div className="relative hidden overflow-hidden border-l border-border bg-hero md:block">
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative flex h-full flex-col items-center justify-center p-10">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface/70 p-4 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  run_9f2c · live
                </span>
              </div>
              <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-[10px] text-destructive">
                3 bugs
              </span>
            </div>
            <div className="mt-3 space-y-2 font-mono text-[11px] leading-relaxed">
              <div className="text-muted-foreground">worker boot · chromium 128</div>
              <div>GET / <span className="text-success">200</span></div>
              <div>click "Sign up"</div>
              <div>fill signup form · 6 fields</div>
              <div className="text-warning">warn: key prop missing</div>
              <div>POST /api/checkout/quote <span className="text-destructive">500</span></div>
              <div className="text-destructive">
                error: Cannot read properties of undefined
              </div>
              <div className="text-primary">● bug captured · CheckoutSummary.tsx:41</div>
            </div>
          </div>
          <p className="mt-6 max-w-sm text-center text-sm text-muted-foreground">
            Your workers are already warming up. First run in under 30 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  disabled,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <input
          {...props}
          disabled={disabled}
          className={`w-full rounded-md border border-border bg-surface-2/60 py-2.5 text-sm placeholder:text-muted-foreground/70 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed ${
            icon ? "pl-9 pr-3" : "px-3"
          }`}
        />
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v3.2h5.35c-.24 1.4-1.66 4.1-5.35 4.1a5.9 5.9 0 1 1 0-11.8c1.85 0 3.1.79 3.8 1.47l2.6-2.5C16.8 3.9 14.6 3 12 3a9 9 0 1 0 0 18c5.2 0 8.6-3.65 8.6-8.8 0-.6-.06-1.05-.15-1.5Z"
      />
    </svg>
  );
}
