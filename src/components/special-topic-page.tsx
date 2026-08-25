import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import {
  Activity,
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  Gauge,
  Globe2,
  Layers3,
  LockKeyhole,
  Network,
  Radar,
  ShieldCheck,
  Terminal,
  TriangleAlert,
} from "lucide-react";
type Variant = "observatory" | "control-room" | "field-manual";

type Section = {
  kicker: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type Faq = { question: string; answer: string };
type Signal = { label: string; value: string; body: string };
type Step = { number: string; title: string; body: string };
type Related = { to: string; label: string; body: string };

export type SpecialTopicPageConfig = {
  path: string;
  variant: Variant;
  eyebrow: string;
  title: string;
  description: string;
  summary: string;
  intent: string;
  cta: string;
  heroMetric: string;
  heroMetricLabel: string;
  signals: Signal[];
  steps: Step[];
  sections: Section[];
  faqs: Faq[];
  related: Related[];
};

function Header({ variant }: { variant: Variant }) {
  const light = variant === "field-manual";
  return (
    <header
      className={`border-b ${light ? "border-[#1e2a22]/15 bg-[#efeee8]/90" : "border-white/10 bg-[#080b0d]/90"} sticky top-0 z-30 backdrop-blur-xl`}
    >
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-6 lg:px-10">
        <Logo className={light ? "text-[#17201b]" : "text-white"} size={28} />
        <nav
          className={`hidden items-center gap-5 text-xs sm:flex ${light ? "text-[#526057]" : "text-white/60"}`}
          aria-label="Primary navigation"
        >
          <Link to="/features" className="hover:text-primary">
            Features
          </Link>
          <Link to="/how-it-works" className="hover:text-primary">
            How it works
          </Link>
          <Link to="/sample-report" className="hover:text-primary">
            Sample report
          </Link>
          <Link to="/pricing" className="hover:text-primary">
            Pricing
          </Link>
        </nav>
        <Link
          to="/auth"
          search={{ mode: "signup", returnTo: "/app" }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground"
        >
          Open the console <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}

function ObservatoryHero({ config }: { config: SpecialTopicPageConfig }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#080b11] text-white">
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(115,255,112,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(115,255,112,.06)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-10 lg:py-24">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.22em] text-primary">
            {config.eyebrow}
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[.97] tracking-[-.045em] sm:text-7xl">
            {config.title}
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white/62">{config.summary}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup", returnTo: "/app" }}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              {config.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/35">
              {config.intent}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/12 bg-black/35 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[10px] uppercase tracking-[.16em] text-white/45">
            <span className="flex items-center gap-2">
              <Radar className="h-3.5 w-3.5 text-primary" /> runtime observatory
            </span>
            <span className="text-primary">live evidence</span>
          </div>
          <div className="grid gap-3 py-4 sm:grid-cols-[.8fr_1.2fr]">
            <div className="rounded-xl border border-primary/20 bg-primary/[.06] p-5">
              <CircleAlert className="h-5 w-5 text-primary" />
              <div className="mt-8 font-display text-4xl text-white">{config.heroMetric}</div>
              <div className="mt-2 text-xs text-white/45">{config.heroMetricLabel}</div>
            </div>
            <div className="space-y-2">
              {config.signals.slice(0, 3).map((signal, index) => (
                <div
                  key={signal.label}
                  className="rounded-lg border border-white/10 bg-white/[.035] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] text-primary">
                      0{index + 1} · {signal.label}
                    </span>
                    <span className="text-[10px] text-white/40">{signal.value}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/60">{signal.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 pt-3 text-[11px] text-white/42">
            <Terminal className="h-3.5 w-3.5 text-primary" /> A signal is useful when its context
            survives the run.
          </div>
        </div>
      </div>
    </section>
  );
}

function ControlRoomHero({ config }: { config: SpecialTopicPageConfig }) {
  return (
    <section className="border-b border-[#f0d98a]/15 bg-[#11130f] text-[#f4f0df]">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-24">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#e5c95b]">
              {config.eyebrow}
            </p>
            <h1 className="mt-6 font-display text-5xl font-medium leading-[.96] tracking-[-.045em] sm:text-7xl">
              {config.title}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#f4f0df]/60">{config.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup", returnTo: "/app" }}
                className="inline-flex items-center gap-2 rounded-md bg-[#e5c95b] px-4 py-3 text-sm font-semibold text-[#1b1b0e]"
              >
                {config.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/ci-cd-testing"
                className="inline-flex items-center gap-2 rounded-md border border-[#f0d98a]/25 px-4 py-3 text-sm text-[#f4f0df]/75"
              >
                See release testing <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="min-w-[230px] rounded-xl border border-[#f0d98a]/20 bg-[#1d2117] p-5">
            <div className="font-mono text-[10px] uppercase tracking-[.18em] text-[#e5c95b]">
              current release view
            </div>
            <div className="mt-5 font-display text-5xl">{config.heroMetric}</div>
            <p className="mt-2 text-sm text-[#f4f0df]/50">{config.heroMetricLabel}</p>
          </div>
        </div>
        <div className="mt-14 grid gap-2 overflow-hidden rounded-xl border border-[#f0d98a]/20 bg-[#191d15] md:grid-cols-4">
          {["development", "preview", "staging", "production"].map((environment, index) => (
            <div
              key={environment}
              className={`relative p-5 ${index === 2 ? "bg-[#e5c95b]/10" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#e5c95b]">
                  0{index + 1}
                </span>
                {index < 3 ? (
                  <Check className="h-4 w-4 text-[#a9d889]" />
                ) : (
                  <LockKeyhole className="h-4 w-4 text-[#f4f0df]/40" />
                )}
              </div>
              <h2 className="mt-8 font-display text-lg">{environment}</h2>
              <p className="mt-2 text-xs leading-5 text-[#f4f0df]/45">
                {index === 0
                  ? "Build and local feedback."
                  : index === 1
                    ? "Change-specific confidence."
                    : index === 2
                      ? "Release candidate evidence."
                      : "Observe only with authorization."}
              </p>
              {index < 3 && (
                <span className="absolute right-0 top-1/2 hidden h-px w-5 bg-[#e5c95b]/50 md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FieldManualHero({ config }: { config: SpecialTopicPageConfig }) {
  return (
    <section className="border-b border-[#1e2a22]/15 bg-[#efeee8] text-[#17201b]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[.72fr_1.28fr] lg:px-10 lg:py-24">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#50715b]">
            {config.eyebrow}
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[.96] tracking-[-.05em] sm:text-7xl">
            {config.title}
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#526057]">{config.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup", returnTo: "/app" }}
              className="inline-flex items-center gap-2 rounded-md bg-[#17201b] px-4 py-3 text-sm font-semibold text-[#f5f4ed]"
            >
              {config.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="self-center font-mono text-[10px] uppercase tracking-widest text-[#7a887e]">
              {config.intent}
            </span>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[#1e2a22]/15 bg-[#dce3d7] p-6">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-[#50715b]/20" />
          <div className="absolute right-8 top-8 h-32 w-32 rounded-full border border-[#50715b]/20" />
          <div className="relative flex h-full min-h-[260px] flex-col justify-between">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#50715b]">
              <span>web application test map</span>
              <Globe2 className="h-4 w-4" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#1e2a22]/15 bg-[#f3f5ef]/75 p-3">
                <Layers3 className="h-4 w-4 text-[#50715b]" />
                <p className="mt-5 text-xs font-semibold">Interface</p>
                <p className="mt-1 text-[11px] text-[#66736a]">forms · routes · state</p>
              </div>
              <div className="rounded-lg border border-[#1e2a22]/15 bg-[#f3f5ef]/75 p-3">
                <Network className="h-4 w-4 text-[#50715b]" />
                <p className="mt-5 text-xs font-semibold">Integration</p>
                <p className="mt-1 text-[11px] text-[#66736a]">requests · responses</p>
              </div>
              <div className="rounded-lg border border-[#1e2a22]/15 bg-[#f3f5ef]/75 p-3">
                <FileCheck2 className="h-4 w-4 text-[#50715b]" />
                <p className="mt-5 text-xs font-semibold">Evidence</p>
                <p className="mt-1 text-[11px] text-[#66736a]">steps · findings</p>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-[#1e2a22]/15 pt-4 font-mono text-[10px] uppercase tracking-widest text-[#50715b]">
              <span className="h-2 w-2 rounded-full bg-[#6d9a6d]" /> A practical coverage map, not a
              promise of total coverage.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecialHero({ config }: { config: SpecialTopicPageConfig }) {
  if (config.variant === "observatory") return <ObservatoryHero config={config} />;
  if (config.variant === "control-room") return <ControlRoomHero config={config} />;
  return <FieldManualHero config={config} />;
}

function SectionBlock({
  section,
  index,
  variant,
}: {
  section: Section;
  index: number;
  variant: Variant;
}) {
  const light = variant === "field-manual";
  return (
    <article
      className={`border-b py-10 last:border-b-0 ${light ? "border-[#1e2a22]/15" : "border-white/10"}`}
    >
      <div className="grid gap-6 lg:grid-cols-[.32fr_.68fr]">
        <div>
          <span
            className={`font-mono text-[10px] uppercase tracking-[.18em] ${light ? "text-[#50715b]" : "text-primary"}`}
          >
            {String(index + 1).padStart(2, "0")} / {section.kicker}
          </span>
          <h2
            className={`mt-3 font-display text-2xl font-medium leading-tight md:text-4xl ${light ? "text-[#17201b]" : "text-white"}`}
          >
            {section.title}
          </h2>
        </div>
        <div
          className={`space-y-5 text-sm leading-7 ${light ? "text-[#526057]" : "text-white/60"}`}
        >
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.bullets && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {section.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className={`flex gap-2 rounded-lg border p-3 text-xs leading-5 ${light ? "border-[#1e2a22]/15 bg-white/45" : "border-white/10 bg-white/[.03]"}`}
                >
                  <Check
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${light ? "text-[#50715b]" : "text-primary"}`}
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

export function SpecialTopicPage({ config }: { config: SpecialTopicPageConfig }) {
  const light = config.variant === "field-manual";
  return (
    <div
      className={
        light
          ? "min-h-screen bg-[#efeee8] text-[#17201b]"
          : config.variant === "control-room"
            ? "min-h-screen bg-[#11130f] text-[#f4f0df]"
            : "min-h-screen bg-[#080b11] text-white"
      }
    >
      <Header variant={config.variant} />
      <main>
        <SpecialHero config={config} />
        <section
          className={`border-b ${light ? "border-[#1e2a22]/15 bg-[#f7f6f0]" : config.variant === "control-room" ? "border-[#f0d98a]/15 bg-[#151811]" : "border-white/10 bg-[#0c1018]"}`}
        >
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
            <div className="grid gap-3 md:grid-cols-3">
              {config.signals.map((signal) => (
                <article
                  key={signal.label}
                  className={`rounded-xl border p-5 ${light ? "border-[#1e2a22]/15 bg-white/55" : config.variant === "control-room" ? "border-[#f0d98a]/15 bg-[#1d2117]" : "border-white/10 bg-white/[.035]"}`}
                >
                  <div
                    className={`font-mono text-[10px] uppercase tracking-[.17em] ${light ? "text-[#50715b]" : config.variant === "control-room" ? "text-[#e5c95b]" : "text-primary"}`}
                  >
                    {signal.label}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Activity
                      className={`h-4 w-4 ${light ? "text-[#50715b]" : config.variant === "control-room" ? "text-[#e5c95b]" : "text-primary"}`}
                    />
                    <span className="font-display text-xl">{signal.value}</span>
                  </div>
                  <p
                    className={`mt-3 text-sm leading-6 ${light ? "text-[#526057]" : "text-white/55"}`}
                  >
                    {signal.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          className={
            light
              ? "bg-[#efeee8]"
              : config.variant === "control-room"
                ? "bg-[#11130f]"
                : "bg-[#080b11]"
          }
        >
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[.28fr_.72fr]">
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div
                  className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] ${light ? "text-[#50715b]" : config.variant === "control-room" ? "text-[#e5c95b]" : "text-primary"}`}
                >
                  <Gauge className="h-3.5 w-3.5" /> A long-form guide
                </div>
                <p
                  className={`mt-4 text-sm leading-6 ${light ? "text-[#66736a]" : "text-white/45"}`}
                >
                  Start with the direct answer, then use the sections to decide where this testing
                  approach belongs in your release process.
                </p>
                <div
                  className={`mt-7 rounded-xl border p-4 text-xs leading-6 ${light ? "border-[#1e2a22]/15 bg-white/45 text-[#526057]" : "border-white/10 bg-white/[.03] text-white/45"}`}
                >
                  <ShieldCheck
                    className={`mb-2 h-4 w-4 ${light ? "text-[#50715b]" : "text-primary"}`}
                  />
                  Use Matrix QA only on websites and applications you own or are authorized to test.
                </div>
              </aside>
              <div>
                {config.steps.length > 0 && (
                  <ol className="mb-12 grid gap-3 md:grid-cols-3">
                    {config.steps.map((step) => (
                      <li
                        key={step.number}
                        className={`rounded-xl border p-5 ${light ? "border-[#1e2a22]/15 bg-white/55" : config.variant === "control-room" ? "border-[#f0d98a]/15 bg-[#1d2117]" : "border-white/10 bg-white/[.035]"}`}
                      >
                        <span
                          className={`font-mono text-[10px] ${light ? "text-[#50715b]" : config.variant === "control-room" ? "text-[#e5c95b]" : "text-primary"}`}
                        >
                          {step.number}
                        </span>
                        <h3 className="mt-5 font-display text-lg">{step.title}</h3>
                        <p
                          className={`mt-2 text-sm leading-6 ${light ? "text-[#66736a]" : "text-white/50"}`}
                        >
                          {step.body}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
                {config.sections.map((section, index) => (
                  <SectionBlock
                    key={section.title}
                    section={section}
                    index={index}
                    variant={config.variant}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
        <section
          className={`border-t ${light ? "border-[#1e2a22]/15 bg-[#dce3d7]" : config.variant === "control-room" ? "border-[#f0d98a]/15 bg-[#191d15]" : "border-white/10 bg-[#0c1018]"}`}
        >
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p
                  className={`font-mono text-[10px] uppercase tracking-[.18em] ${light ? "text-[#50715b]" : config.variant === "control-room" ? "text-[#e5c95b]" : "text-primary"}`}
                >
                  Related reading
                </p>
                <h2 className="mt-3 font-display text-3xl">Keep building the picture.</h2>
              </div>
              <Link
                to="/features"
                className={`hidden text-sm underline underline-offset-4 sm:inline-flex ${light ? "text-[#50715b]" : "text-primary"}`}
              >
                All features
              </Link>
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {config.related.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group rounded-xl border p-5 transition-transform hover:-translate-y-0.5 ${light ? "border-[#1e2a22]/15 bg-white/55" : config.variant === "control-room" ? "border-[#f0d98a]/15 bg-[#1d2117]" : "border-white/10 bg-white/[.035]"}`}
                >
                  <div
                    className={`flex items-center justify-between text-sm font-semibold ${light ? "text-[#17201b]" : "text-white"}`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                  <p
                    className={`mt-3 text-sm leading-6 ${light ? "text-[#66736a]" : "text-white/50"}`}
                  >
                    {item.body}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section
          className={
            light
              ? "bg-[#17201b] text-[#f5f4ed]"
              : config.variant === "control-room"
                ? "bg-[#e5c95b] text-[#1b1b0e]"
                : "bg-[#101b14] text-white"
          }
        >
          <div className="mx-auto max-w-5xl px-6 py-16 text-center lg:px-10 lg:py-20">
            <h2 className="font-display text-3xl font-medium md:text-5xl">
              Use the right signal for the right decision.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 opacity-70">
              {config.description}
            </p>
            <Link
              to="/auth"
              search={{ mode: "signup", returnTo: "/app" }}
              className={`mt-8 inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold ${light ? "bg-[#e5c95b] text-[#17201b]" : config.variant === "control-room" ? "bg-[#1b1b0e] text-[#f4f0df]" : "bg-primary text-primary-foreground"}`}
            >
              {config.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <section
        className={
          light
            ? "bg-[#efeee8]"
            : config.variant === "control-room"
              ? "bg-[#11130f]"
              : "bg-[#080b11]"
        }
      >
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-primary">
            <TriangleAlert className="h-3.5 w-3.5" /> Questions worth asking
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-2">
            {config.faqs.map((faq) => (
              <details
                key={faq.question}
                className={`rounded-xl border p-5 ${light ? "border-[#1e2a22]/15 bg-white/55" : config.variant === "control-room" ? "border-[#f0d98a]/15 bg-[#1d2117]" : "border-white/10 bg-white/[.035]"}`}
              >
                <summary className="cursor-pointer list-none pr-5 font-display text-base marker:hidden">
                  {faq.question}
                </summary>
                <p
                  className={`mt-3 text-sm leading-7 ${light ? "text-[#66736a]" : "text-white/55"}`}
                >
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <footer
        className={`border-t px-6 py-8 text-xs ${light ? "border-[#1e2a22]/15 bg-[#efeee8] text-[#66736a]" : "border-white/10 bg-inherit text-white/40"}`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:px-4">
          <div className="flex flex-wrap gap-5">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/faq">FAQ</Link>
          </div>
          <span>© {new Date().getFullYear()} Matrix QA · Tr Labs</span>
        </div>
      </footer>
    </div>
  );
}
