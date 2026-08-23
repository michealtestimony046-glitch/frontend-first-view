import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { authApi, organizationsApi, usersApi, workspacesApi } from "@/lib/api-client";
import { ACTIVE_WORKSPACE_KEY } from "@/lib/live-data";
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
  const { user, applyUser, logoutAll } = useAuth();
  const displayName = user?.fullName?.trim() || "Matrix QA user";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const [name, setName] = useState(user?.fullName || "");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarAction, setAvatarAction] = useState<"upload" | "remove" | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setName(user?.fullName || ""), [user?.fullName]);
  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const updated = await usersApi.updateProfile({ fullName: name });
      applyUser(updated);
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update your profile.");
    } finally {
      setBusy(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setAvatarAction("upload");
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    try {
      const updated = await usersApi.uploadAvatar(file);
      applyUser(updated);
      setAvatarPreview(null);
      setMessage("Avatar updated.");
    } catch (error) {
      setAvatarPreview(null);
      setMessage(error instanceof Error ? error.message : "Could not upload your avatar.");
    } finally {
      setAvatarBusy(false);
      setAvatarAction(null);
      event.target.value = "";
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed. Other sessions were signed out.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not change your password.");
    } finally {
      setBusy(false);
    }
  };

  const requestEmailChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await authApi.requestEmailChange({ newEmail, currentPassword });
      setNewEmail("");
      setCurrentPassword("");
      setMessage("Check the new email address for a confirmation link.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not request an email change.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3"><h2 className="font-display text-sm font-semibold">Profile</h2><p className="text-[11px] text-muted-foreground">Your account identity and avatar</p></header>
        <div className="space-y-5 p-5">
          <div className="flex items-center gap-4">
            {avatarPreview || user?.avatarUrl ? <img src={avatarPreview || user?.avatarUrl || undefined} alt="Profile avatar" className="h-14 w-14 rounded-full object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary/20 font-mono text-lg font-semibold text-primary-foreground">{initials}</div>}
            <div><div className="text-sm font-medium">{displayName}</div><div className="text-xs text-muted-foreground">PNG, JPEG, or WebP up to 2 MB.</div><div className="mt-2 flex gap-2"><button type="button" disabled={avatarBusy} onClick={() => fileRef.current?.click()} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-60">{avatarAction === "upload" ? "Updating…" : "Upload avatar"}</button>{user?.avatarUrl && <button type="button" disabled={avatarBusy} onClick={async () => { setAvatarBusy(true); setAvatarAction("remove"); try { const updated = await usersApi.removeAvatar(); applyUser(updated); setAvatarPreview(null); setMessage("Avatar removed."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not remove your avatar."); } finally { setAvatarBusy(false); setAvatarAction(null); } }} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent disabled:opacity-60">{avatarAction === "remove" ? "Updating…" : "Remove"}</button>}<input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} disabled={avatarBusy} className="hidden" /></div></div>
          </div>
          <form onSubmit={saveName} className="space-y-3"><label className="block"><span className="mb-1.5 block text-xs font-medium">Full name</span><input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-primary" /></label><button disabled={busy} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">Save profile</button></form>
          <Field label="Email" value={user?.email || "Unavailable"} readonly />
          {message && <p className="rounded-md border border-border/60 bg-surface-2/30 p-3 text-xs text-muted-foreground">{message}</p>}
        </div>
      </section>

      <div className="space-y-4">
        <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-3"><h2 className="font-display text-sm font-semibold">Password</h2><p className="text-[11px] text-muted-foreground">Change it without leaving Settings</p></header><div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3"><span className="text-xs text-muted-foreground">Forgot the current password?</span><Link to="/auth" search={{ mode: "signin", returnTo: "/app", recover: true }} className="text-xs font-medium text-primary hover:underline">Send a reset link</Link></div><form onSubmit={changePassword} className="space-y-3 p-5"><input type="password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><input type="password" placeholder="New password · 10+ characters" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={10} required className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><button disabled={busy} className="rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-accent disabled:opacity-60">Change password</button></form></section>
        <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-3"><h2 className="font-display text-sm font-semibold">Change email</h2><p className="text-[11px] text-muted-foreground">We will confirm the new address before switching it</p></header><form onSubmit={requestEmailChange} className="space-y-3 p-5"><input type="email" placeholder="New email address" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><input type="password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><button disabled={busy} className="rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-accent disabled:opacity-60">Send confirmation</button></form></section>
        <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-3"><h2 className="font-display text-sm font-semibold">Sessions</h2><p className="text-[11px] text-muted-foreground">Revoke every active Matrix QA session</p></header><div className="space-y-3 p-5"><Meta label="Authentication" value={user ? "Authenticated" : "Not available"} /><Meta label="Account" value={user?.email || "Unavailable"} /><button type="button" onClick={() => void logoutAll()} className="rounded-md border border-destructive/50 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10">Sign out everywhere</button></div></section>
        <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-3"><h2 className="font-display text-sm font-semibold">About Matrix QA</h2></header><div className="space-y-2 p-5 text-xs text-muted-foreground"><Meta label="Product release" value="1.2.0" /><Meta label="Build/runtime" value="1.6.2" /></div></section>
      </div>
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
            Matrix QA stores each project’s target URL with the backend project record. Open Projects to review or create a project target instead of editing example URLs here.
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
          <p className="text-[11px] text-muted-foreground">Worker defaults are controlled by the backend</p>
        </header>
        <div className="p-5">
          <AvailabilityNotice>
            Per-project feature scopes and custom journey maps are not configurable in this console yet. The browser worker uses the deployed backend defaults and reports the resulting evidence.
          </AvailabilityNotice>
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
        <AvailabilityNotice>
          The encrypted role vault is not enabled in this console. Do not paste test credentials into this page. Secure persona storage is planned for a future release.
        </AvailabilityNotice>
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
                This toggle is local to the current browser session. Terminal reports continue to use the backend noise gate.
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
          <AvailabilityNotice>Quota editing and concurrency controls are read-only in this console. Plan-specific governors are managed by the workspace.</AvailabilityNotice>
        </div>
      </section>
    </div>
  );
}

function TokensTab() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => typeof window !== "undefined" ? localStorage.getItem(ACTIVE_WORKSPACE_KEY) : null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const organizations = await organizationsApi.list();
        const workspaceGroups = await Promise.all(organizations.slice(0, 10).map((organization) => workspacesApi.list(organization.id)));
        const workspaces = workspaceGroups.flat();
        const selected = workspaces.find((workspace) => workspace.id === workspaceId) ?? workspaces[0] ?? null;
        if (cancelled) return;
        setWorkspaceId(selected?.id ?? null);
        setWorkspaceName(selected?.name ?? null);
        if (selected) localStorage.setItem(ACTIVE_WORKSPACE_KEY, selected.id);
      } catch {
        if (!cancelled) setWorkspaceName(null);
      } finally {
        if (!cancelled) setLoadingWorkspace(false);
      }
    })();
    return () => { cancelled = true; };
  }, [workspaceId]);

  return (
    <div className="grid gap-4">
      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Workspace API tokens</h2>
          <p className="text-[11px] text-muted-foreground">Programmatic run triggers are not enabled in the web console</p>
        </header>
        <div className="p-5">
          <div className="flex items-start gap-3 rounded-md border border-border bg-surface-2/30 p-4">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">No API token is available</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Matrix QA does not currently issue workspace API tokens. The workspace ID below identifies the selected workspace for Mia context; it is not a secret and cannot authenticate requests by itself.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Selected workspace identifier</h2>
          <p className="text-[11px] text-muted-foreground">Use this non-secret ID when referring to the workspace in integrations or support requests</p>
        </header>
        <div className="p-5">
          <div className="rounded-md border border-border bg-surface-2/30 p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{workspaceName ?? "Current workspace"}</div>
            <code className="mt-2 block select-all break-all text-sm text-foreground">{loadingWorkspace ? "Loading current workspace…" : workspaceId ?? "No workspace selected"}</code>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Mia receives this workspace context through the authenticated request. The ID does not grant access without the signed-in session.</p>
          </div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <header className="border-b border-border px-5 py-3">
          <h2 className="font-display text-sm font-semibold">Quick start</h2>
        </header>
        <div className="p-5">
          <AvailabilityNotice>Use the authenticated web console to create projects and queue runs. CLI and API-token workflows are planned for a future release.</AvailabilityNotice>
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

function AvailabilityNotice({ children }: { children: ReactNode }) {
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
