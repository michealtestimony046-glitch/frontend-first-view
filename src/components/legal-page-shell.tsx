import { ArrowLeft, ArrowUpRight, FileText, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import type { ReactNode } from "react";
import { DISCORD_SUPPORT_URL } from "@/lib/support";

export type LegalSection = {
  title: string;
  children: ReactNode;
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
};

const policyLinks = [
  { to: "/terms", label: "Terms of Service" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/cookies", label: "Cookie Policy" },
] as const;

export function LegalPageShell({
  eyebrow,
  title,
  summary,
  updated,
  sections,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Logo size={26} />
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Primary navigation">
            <Link
              to="/pricing"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Pricing
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin", returnTo: "/app" }}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup", returnTo: "/app" }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-[0_10px_30px_-16px_rgba(170,255,140,0.8)] transition-transform hover:-translate-y-px"
            >
              Start scanning <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border bg-hero">
          <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
          <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-12 lg:px-10 lg:pb-20 lg:pt-16">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Matrix QA
            </Link>
            <div className="mt-10 max-w-3xl">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                <FileText className="h-3.5 w-3.5" /> {eyebrow}
              </div>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-gradient sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {summary}
              </p>
              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Effective {updated}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-10 lg:py-16">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              On this page
            </p>
            <nav className="mt-4 grid gap-2 border-l border-border pl-4" aria-label="Page sections">
              {sections.map((section, index) => (
                <a
                  key={section.title}
                  href={`#section-${index + 1}`}
                  className="text-xs leading-5 text-muted-foreground transition-colors hover:text-primary"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="min-w-0 max-w-3xl">
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-5 text-sm leading-6 text-foreground/80 sm:p-6">
              This policy is written for clarity and accountability. If you have a question about
              how it applies to your account or organization, contact{" "}
              <a
                className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                href="mailto:support@trlabs.tech"
              >
                support@trlabs.tech
              </a>
              .
            </div>
            <div className="mt-10 space-y-12">
              {sections.map((section, index) => (
                <section id={`section-${index + 1}`} key={section.title} className="scroll-mt-28">
                  <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                    {section.children}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </main>

      <footer className="border-t border-border bg-surface/35">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-end sm:justify-between lg:px-10">
          <div>
            <div className="font-display text-sm font-semibold">Matrix QA</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Autonomous QA infrastructure by Tr Labs.
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"
            aria-label="Legal navigation"
          >
            {policyLinks.map((policy) => (
              <Link key={policy.to} to={policy.to} className="transition-colors hover:text-primary">
                {policy.label}
              </Link>
            ))}
            <a href="mailto:support@trlabs.tech" className="transition-colors hover:text-primary">
              Contact
            </a>
            <a href={DISCORD_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
              Support on Discord
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}
export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-primary">{children}</ul>;
}
export function LegalTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface/40">
      <table className="w-full min-w-[560px] text-left text-xs">
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function LegalRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border/70 last:border-0">
      <th className="w-2/5 px-4 py-3 font-medium text-foreground">{label}</th>
      <td className="px-4 py-3 text-muted-foreground">{value}</td>
    </tr>
  );
}
