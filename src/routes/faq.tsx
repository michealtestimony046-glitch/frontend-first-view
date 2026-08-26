import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronDown, CircleHelp } from "lucide-react";
import { useState } from "react";
import { FAQS } from "@/lib/faq-data";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () =>
    seoHead({
      title: "Matrix QA FAQ | Browser Testing, Evidence & Preview",
      description:
        "Answers about Matrix QA browser testing, evidence reports, Preview access, usage, safety, and the current console.",
      path: "/faq",
      breadcrumbLabel: "FAQ",
      faqItems: FAQS.map(({ q, a }) => ({ question: q, answer: a })),
    }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Matrix QA
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup", returnTo: "/app" }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
            >
              Join Preview <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
            <CircleHelp className="h-3 w-3" /> Help center
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-6xl">
            Questions developers ask first.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            A living guide to Matrix QA Preview, the browser worker, evidence reports, usage, and
            the current console.
          </p>
        </div>

        <div className="mt-12 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface/40">
          {FAQS.map((faq, index) => (
            <FaqItem key={faq.q} {...faq} defaultOpen={index === 0} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface/30 p-5">
          <div>
            <div className="text-sm font-semibold">Still have a question?</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Join Preview and ask from inside your workspace.
            </div>
          </div>
          <Link
            to="/auth"
            search={{ mode: "signup", returnTo: "/app" }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            Create workspace <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-accent/40"
      >
        <span>{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-5 pb-5 text-sm leading-6 text-muted-foreground">{a}</div>}
    </div>
  );
}
