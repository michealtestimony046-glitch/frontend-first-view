import { createFileRoute, Link, Outlet, useLocation, useMatches } from "@tanstack/react-router";
import { useState } from "react";
import {
  CreditCard,
  KeyRound,
  ShieldCheck,
  Sliders,
  User,
  Users,
  Copy,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import { z } from "zod";
import {
  currentUser,
  workspaces,
  getPersonas,
  getFeatureScopes,
} from "@/lib/mock-data";

const searchSchema = z.object({
  tab: z
    .enum(["profile", "engine", "vault", "policy", "tokens"])
    .optional()
    .default("profile"),
});

export const Route = createFileRoute("/app/settings")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Settings · Matrix QA" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsLayout,
});

type Tab = "profile" | "engine" | "vault" | "policy" | "tokens" | "billing";

const tabs: { key: Tab; label: string; icon: typeof User; href: string; scope: string }[] = [
  { key: "profile", label: "Profile", icon: User, href: "/app/settings?tab=profile", scope: "user" },
  { key: "billing", label: "Billing & Usage", icon: CreditCard, href: "/app/settings/billing", scope: "workspace" },
  { key: "engine", label: "Target Engine", icon: Sliders, href: "/app/settings?tab=engine", scope: "workspace" },
  { key: "vault", label: "Role Vault", icon: Users, href: "/app/settings?tab=vault", scope: "workspace" },
  { key: "policy", label: "Run Policy", icon: ShieldCheck, href: "/app/settings?tab=policy", scope: "workspace" },
  { key: "tokens", label: "API Tokens", icon: KeyRound, href: "/app/settings?tab=tokens", scope: "technical" },
];

function SettingsLayout() {
  const { pathname } = useLocation();
  const matches = useMatches();
  const search = Route.useSearch();
  const isBilling =
    pathname.startsWith("/app/settings/billing") ||
    matches.some((m) => m.routeId === "/app/settings/billing");
  const activeTab: Tab = isBilling ? "billing" : (search.tab ?? "profile");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account, workspace, and engine configuration.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="flex min-w-max gap-1 border-b border-border">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = t.key === activeTab;
            return (
              <Link
                key={t.key}
                to={t.href}
                className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {isBilling ? <Outlet /> : <TabContent tab={search.tab ?? "profile"} />}
      </div>
    </div>
  );
}

function TabContent({ tab }: { tab: "profile" | "engine" | "vault" | "policy" | "tokens" }) {
  switch (tab) {
    case "engine":
      return <EngineTab />;
    case "vault":
      return <VaultTab />;
    case "policy":
      return <PolicyTab />;
    case "tokens":
      return <TokensTab />;
    default:
      return <ProfileTab />;
  }
}

// ---------------- Profile ----------------

function ProfileTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Profile</h2>
          <p className="text-[11px] text-muted-foreground">User-level · scoped to you</p>
        </header>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary/20 font-mono text-lg font-semibold text-primary-foreground">
              {currentUser.initials}
            </div>
            <button className="rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-xs hover:bg-accent">
              Change avatar
            </button>
          </div>
          <Field label="Full name" value={currentUser.name} />
          <Field label="Email" value={currentUser.email} readonly />
          <div>
            <div className="mb-1.5 text-xs font-medium">Password</div>
            <button className="rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-xs hover:bg-accent">
              Change password
            </button>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Session</h2>
          <p className="text-[11px] text-muted-foreground">This device</p>
        </header>
        <div className="space-y-3 p-5 text-sm">
          <Meta label="System role" value={currentUser.systemRole} />
          <Meta label="Active workspace" value={workspaces.find((w) => w.current)?.name ?? "—"} />
          <Meta label="Last sign-in" value="Just now · Chromium 128 · macOS" />
          <button className="mt-3 w-full rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/20">
            Sign out of all sessions
          </button>
        </div>
      </section>
    </div>
  );
}

// ---------------- Engine ----------------

function EngineTab() {
  const scopes = getFeatureScopes();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Target environments</h2>
          <p className="text-[11px] text-muted-foreground">
            URLs the worker points at
          </p>
        </header>
        <div className="space-y-4 p-5">
          <Field label="Staging / Preview URL" value="https://staging.acme.dev" mono />
          <div>
            <Field label="Production URL" value="https://app.acme.dev" mono />
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded border border-warning/40 bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">
              Production targets default to Safe Mode controls.
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Feature scope map</h2>
          <p className="text-[11px] text-muted-foreground">
            Declare which parts of the app the worker walks
          </p>
        </header>
        <ul className="divide-y divide-border">
          {scopes.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                  {s.paths.join(" · ")}
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked={s.enabled} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-surface-2 transition-colors peer-checked:bg-primary" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-foreground transition-transform peer-checked:translate-x-4" />
              </label>
            </li>
          ))}
        </ul>
        <div className="border-t border-border p-3">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-xs hover:bg-accent">
            <Plus className="h-3.5 w-3.5" /> Add feature
          </button>
        </div>
      </section>
    </div>
  );
}

// ---------------- Vault ----------------

function VaultTab() {
  return (
    <section className="surface-card overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold">Role Vault</h2>
          <p className="text-[11px] text-muted-foreground">
            Test personas the browser workers log in as
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-xs hover:bg-accent">
          <Plus className="h-3.5 w-3.5" /> Add persona
        </button>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-2 text-left">Role</th>
              <th className="px-5 py-2 text-left">Identity</th>
              <th className="px-5 py-2 text-left">Password</th>
              <th className="px-5 py-2 text-left">Target profile</th>
            </tr>
          </thead>
          <tbody>
            {getPersonas().map((p) => (
              <tr key={p.role} className="border-b border-border last:border-b-0">
                <td className="px-5 py-3 font-mono text-xs text-primary">{p.role}</td>
                <td className="px-5 py-3 font-mono text-xs text-foreground">{p.identity}</td>
                <td className="px-5 py-3 font-mono text-muted-foreground">••••••••</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{p.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border bg-surface-2/40 px-5 py-2.5 text-[11px] text-muted-foreground">
        Credentials are masked in v1. Encrypted vault backend ships with v2.
      </div>
    </section>
  );
}

// ---------------- Policy ----------------

function PolicyTab() {
  const [noise, setNoise] = useState(true);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">UI Noise Gate</h2>
          <p className="text-[11px] text-muted-foreground">
            Deterministic quality filter
          </p>
        </header>
        <div className="space-y-3 p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={noise}
              onChange={(e) => setNoise(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">Hide minor visual shifts and console warnings</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Relegates low-severity alerts to the background Audit Log so
                developers only see hard system errors.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">
            Concurrency & Credit Governor
          </h2>
          <p className="text-[11px] text-muted-foreground">Preview workspace boundaries</p>
        </header>
        <div className="space-y-4 p-5 text-sm">
          <Meta label="Concurrent worker limit" value="2 ephemeral browser nodes" />
          <Meta label="Daily compute budget" value="100 / 100 credits — resets tomorrow" />
          <div className="rounded-md border border-border/60 bg-surface-2/30 p-3 text-[11px] text-muted-foreground">
            <span className="font-mono uppercase tracking-wider text-primary">v1 —</span>{" "}
            Read-only. Governor tuning ships with per-plan quotas in v2.
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------- API Tokens ----------------

function TokensTab() {
  const [reveal, setReveal] = useState(false);
  const token = "mqa_sk_live_a7f3e2c9d0b14e8b9c1f6a5e2d3c4b5a";
  return (
    <div className="grid gap-4">
      <section className="surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="font-display text-sm font-semibold">Workspace API token</h2>
            <p className="text-[11px] text-muted-foreground">
              Trigger runs from your terminal or CI
            </p>
          </div>
          <button className="rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-xs hover:bg-accent">
            Regenerate
          </button>
        </header>
        <div className="p-5">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-xs">
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 truncate">
              {reveal ? token : "•".repeat(token.length)}
            </span>
            <button
              onClick={() => setReveal((v) => !v)}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Toggle reveal"
            >
              {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(token)}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Treat this key like a password. Anyone with it can trigger runs
            against your workspace's declared targets.
          </p>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Quick start</h2>
        </header>
        <pre className="overflow-auto p-5 font-mono text-[11px] leading-relaxed text-foreground">
{`# Trigger a run from your terminal
curl -X POST https://api.matrixqa.dev/v1/runs \\
  -H "Authorization: Bearer $MATRIX_QA_TOKEN" \\
  -d '{"project_id":"prj_01"}'`}
        </pre>
      </section>
    </div>
  );
}

// ---------------- helpers ----------------

function Field({
  label,
  value,
  readonly,
  mono,
}: {
  label: string;
  value: string;
  readonly?: boolean;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      <input
        defaultValue={value}
        readOnly={readonly}
        className={`w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary ${mono ? "font-mono text-xs" : ""} ${readonly ? "text-muted-foreground" : ""}`}
      />
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
