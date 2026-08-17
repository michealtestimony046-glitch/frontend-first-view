import { useState, type ReactNode } from "react";
import {
  CreditCard,
  KeyRound,
  ShieldCheck,
  Sliders,
  User,
  Users,
  LockKeyhole,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createFileRoute, Link, Outlet, useLocation, useMatches } from "@tanstack/react-router";
import { z } from "zod";

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

type Tab = "profile" | "organization" | "engine" | "vault" | "policy" | "tokens" | "billing";

type TabConfig = {
  key: Tab;
  label: string;
  icon: typeof User;
  billing?: boolean;
  tab?: "profile" | "engine" | "vault" | "policy" | "tokens";
  subroute?: "/app/settings/organization";
};

const tabs: TabConfig[] = [
  { key: "profile", label: "Profile", icon: User, tab: "profile" },
  { key: "organization", label: "Organization", icon: Users, subroute: "/app/settings/organization" },
  { key: "billing", label: "Billing & Usage", icon: CreditCard, billing: true },
  { key: "engine", label: "Target Engine", icon: Sliders, tab: "engine" },
  { key: "vault", label: "Role Vault", icon: Users, tab: "vault" },
  { key: "policy", label: "Run Policy", icon: ShieldCheck, tab: "policy" },
  { key: "tokens", label: "API Tokens", icon: KeyRound, tab: "tokens" },
];

function SettingsLayout() {
  const { pathname } = useLocation();
  const matches = useMatches();
  const search = Route.useSearch();
  const isBilling =
    pathname.startsWith("/app/settings/billing") ||
    matches.some((match) => match.routeId === "/app/settings/billing");
  const isOrganization = matches.some((match) => match.routeId === "/app/settings/organization");
  const activeTab: Tab = isBilling ? "billing" : isOrganization ? "organization" : search.tab ?? "profile";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account, organization, and engine configuration.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="flex min-w-max gap-1 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.key === activeTab;
            const linkProps = tab.billing
              ? { to: "/app/settings/billing" as const }
              : tab.subroute
                ? { to: tab.subroute }
                : { to: "/app/settings" as const, search: { tab: tab.tab } };
            return (
              <Link
                key={tab.key}
                {...linkProps}
                className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {isBilling || isOrganization ? <Outlet /> : <TabContent tab={search.tab ?? "profile"} />}
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

function ProfileTab() {
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() || "Matrix QA user";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Profile</h2>
          <p className="text-[11px] text-muted-foreground">Live identity from the authenticated session</p>
        </header>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary/20 font-mono text-lg font-semibold text-primary-foreground">
              {initials}
            </div>
            <div>
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground">Avatar editing is not enabled in v1.</div>
            </div>
          </div>
          <Field label="Full name" value={user?.fullName || "Not provided"} />
          <Field label="Email" value={user?.email || "Unavailable"} readonly />
          <DisabledAction label="Change password" detail="Password changes ship with the account-security flow in a later release." />
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Session</h2>
          <p className="text-[11px] text-muted-foreground">This browser</p>
        </header>
        <div className="space-y-3 p-5 text-sm">
          <Meta label="Authentication" value={user ? "Authenticated" : "Not available"} />
          <Meta label="Account" value={user?.email || "Unavailable"} />
          <Meta label="Organization and workspace" value="Use the selector in the sidebar" />
          <div className="mt-3 rounded-md border border-border/60 bg-surface-2/30 p-3 text-[11px] text-muted-foreground">
            Session-wide sign-out is not exposed in v1. Use the account menu to log out of this browser.
          </div>
        </div>
      </section>
    </div>
  );
}

function EngineTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Target environments</h2>
          <p className="text-[11px] text-muted-foreground">Configured per project in the live Projects page</p>
        </header>
        <div className="space-y-4 p-5">
          <p className="text-sm leading-6 text-muted-foreground">
            Matrix QA v1 stores each project’s target URL with the backend project record. Open Projects to review or create a project target instead of editing example URLs here.
          </p>
          <Link
            to="/app/projects"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/60 px-3 py-2 text-xs font-medium hover:bg-accent"
          >
            Open Projects <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Feature scope map</h2>
          <p className="text-[11px] text-muted-foreground">Worker defaults are controlled by the backend in v1</p>
        </header>
        <div className="p-5">
          <V1Notice>
            Per-project feature scopes and custom journey maps are not configurable in the v1 console yet. The browser worker uses the deployed backend defaults and reports the resulting evidence.
          </V1Notice>
        </div>
      </section>
    </div>
  );
}

function VaultTab() {
  return (
    <section className="surface-card overflow-hidden">
      <header className="border-b border-border px-5 py-3">
        <h2 className="font-display text-sm font-semibold">Role Vault</h2>
        <p className="text-[11px] text-muted-foreground">Secure test personas for browser runs</p>
      </header>
      <div className="p-5">
        <V1Notice>
          The encrypted role vault is not enabled in v1. Do not paste test credentials into this page. Secure persona storage is planned for the v2 backend.
        </V1Notice>
      </div>
    </section>
  );
}

function PolicyTab() {
  const [noise, setNoise] = useState(true);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">UI Noise Gate</h2>
          <p className="text-[11px] text-muted-foreground">Preview-only browser preference</p>
        </header>
        <div className="space-y-3 p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={noise}
              onChange={(event) => setNoise(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">Hide minor visual shifts and console warnings</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                This toggle is local to the current browser session in v1. Terminal reports continue to use the backend noise gate.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Concurrency & credit governor</h2>
          <p className="text-[11px] text-muted-foreground">Preview workspace boundaries</p>
        </header>
        <div className="space-y-4 p-5 text-sm">
          <Meta label="Configuration" value="Managed by the deployed backend" />
          <V1Notice>Quota editing and concurrency controls are read-only in v1. Plan-specific governors ship with the paid product releases.</V1Notice>
        </div>
      </section>
    </div>
  );
}

function TokensTab() {
  return (
    <div className="grid gap-4">
      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Workspace API tokens</h2>
          <p className="text-[11px] text-muted-foreground">Programmatic run triggers are not enabled in the v1 web console</p>
        </header>
        <div className="p-5">
          <div className="flex items-start gap-3 rounded-md border border-border bg-surface-2/30 p-4">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">No API token is available</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Matrix QA v1 has no token-generation endpoint. The previous placeholder token UI has been removed so the console never presents a value that cannot authenticate against the live backend.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Quick start</h2>
        </header>
        <div className="p-5">
          <V1Notice>Use the authenticated web console to create projects and queue runs in v1. CLI and API-token workflows are planned for a later release.</V1Notice>
        </div>
      </section>
    </div>
  );
}

function DisabledAction({ label, detail }: { label: string; detail: string }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium">{label}</div>
      <button
        type="button"
        disabled
        className="rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-xs text-muted-foreground disabled:cursor-not-allowed disabled:opacity-70"
      >
        Coming later
      </button>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function V1Notice({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-border/60 bg-surface-2/30 p-3 text-[11px] leading-5 text-muted-foreground">{children}</div>;
}

function Field({ label, value, readonly }: { label: string; value: string; readonly?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      <input
        value={value}
        readOnly={readonly}
        aria-readonly={readonly}
        className={`w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary ${readonly ? "text-muted-foreground" : ""}`}
      />
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
