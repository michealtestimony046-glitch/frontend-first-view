import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileSearch,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/sample-report")({
  head: () =>
    seoHead({
      title: "Sample report · Matrix QA",
      description: "Explore a public, read-only Matrix QA sample report.",
      path: "/sample-report",
    }),
  component: SampleReportPage,
});

const sampleSteps = [
  { name: "Open landing page", status: "Passed", detail: "GET / returned 200", time: "00:01.2" },
  {
    name: "Open sign-in form",
    status: "Passed",
    detail: "Form fields were visible and enabled",
    time: "00:02.8",
  },
  {
    name: "Submit invalid email",
    status: "Passed",
    detail: "Validation message appeared without a network error",
    time: "00:04.1",
  },
  {
    name: "Navigate to account area",
    status: "Review",
    detail: "A visual shift was retained in Audit Log",
    time: "00:06.7",
  },
];

function SampleReportPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Matrix QA
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup", returnTo: "/app" }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
          >
            Run your own scan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
              <FileSearch className="h-3 w-3" /> Public sample · read-only
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl">
              A report developers can act on.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              This is a fixed demonstration report using safe fixture data. It is not a live
              customer run and does not require an account or project ID.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface/50 px-4 py-3 text-right">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Sample run
            </div>
            <div className="mt-1 font-mono text-sm text-foreground">demo-auth-flow</div>
            <div className="mt-1 text-xs text-success">Completed · 00:08.4</div>
          </div>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          <Metric
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Assertions passed"
            value="3"
            tone="text-success"
          />
          <Metric
            icon={<CircleAlert className="h-4 w-4" />}
            label="Review items"
            value="1"
            tone="text-warning"
          />
          <Metric
            icon={<Clock3 className="h-4 w-4" />}
            label="Duration"
            value="8.4s"
            tone="text-primary"
          />
          <Metric
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Confidence"
            value="92"
            tone="text-primary"
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-xl border border-border bg-surface/40">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Journey timeline</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Every action is paired with an outcome and timestamp.
                </p>
              </div>
              <Globe2 className="h-5 w-5 text-primary" />
            </div>
            <div className="divide-y divide-border">
              {sampleSteps.map((step) => (
                <div
                  key={step.name}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="text-sm font-medium">{step.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{step.detail}</div>
                  </div>
                  <div className="flex items-center gap-3 sm:text-right">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider ${step.status === "Passed" ? "text-success" : "text-warning"}`}
                    >
                      {step.status}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{step.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-border bg-surface/40 p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
              Evidence package
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold">Everything in one place.</h2>
            <div className="mt-5 space-y-3 text-sm">
              <EvidenceLine label="Screenshots" value="4 captured" />
              <EvidenceLine label="Console events" value="2 retained" />
              <EvidenceLine label="Network checks" value="12 observed" />
              <EvidenceLine label="Report export" value="Markdown ready" />
            </div>
            <div className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              The real console adds project context, issue filters, audit logs, assertions, and
              artifact links for authenticated workspaces.
            </div>
          </aside>
        </section>

        <section className="mt-8 rounded-xl border border-warning/30 bg-warning/10 p-5">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <h2 className="text-sm font-semibold">Why this page is separate from the console</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                A public sample should never depend on a customer project, a private run, or an
                existing session. When you are ready to test your own application, create an account
                and Matrix QA will open the authenticated console with your organization context
                preserved.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className={`flex items-center gap-2 text-xs ${tone}`}>
        {icon}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function EvidenceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs text-foreground">{value}</span>
    </div>
  );
}
