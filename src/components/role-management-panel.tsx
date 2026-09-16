import { useCallback, useEffect, useState } from "react";
import { ChevronDown, EyeOff, KeyRound, Loader2, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { v2Api, type ProjectRole, type V2Environment } from "@/lib/api-client";

type Props = { projectId: string; environment: V2Environment };
type Form = {
  name: string;
  loginUrl: string;
  verificationUrl: string;
  username: string;
  password: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
};
const blank: Form = {
  name: "",
  loginUrl: "/login",
  verificationUrl: "/dashboard",
  username: "",
  password: "",
  usernameSelector: "",
  passwordSelector: "",
  submitSelector: "",
};
const relative = (value: string) =>
  value.startsWith("/") && !value.startsWith("//") && !value.includes("://");

export function RoleManagementPanel({ projectId, environment }: Props) {
  const [roles, setRoles] = useState<ProjectRole[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failureScreenshot, setFailureScreenshot] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [form, setForm] = useState<Form>(blank);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRoles(await v2Api.listRoles(projectId, environment.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load roles.");
    } finally {
      setLoading(false);
    }
  }, [environment.id, projectId]);
  useEffect(() => {
    void load();
  }, [load]);
  const update = (key: keyof Form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setFailureScreenshot(null);
    if (!form.name.trim() || !form.username.trim() || !form.password)
      return setError("Name, username, and password are required.");
    if (!relative(form.loginUrl) || !relative(form.verificationUrl))
      return setError("Login and verification routes must be relative paths such as /login.");
    setBusy(true);
    try {
      const role = await v2Api.createRole({
        projectId,
        environmentId: environment.id,
        roleType: "AUTHENTICATED",
        ...form,
        usernameSelector: form.usernameSelector || undefined,
        passwordSelector: form.passwordSelector || undefined,
        submitSelector: form.submitSelector || undefined,
      });
      setRoles((current) => [role, ...current]);
      setFailureScreenshot(role.bootstrapScreenshotData ?? null);
      setOpen(false);
      setForm(blank);
      setNotice(
        role.sessionStatus === "ACTIVE"
          ? `Role “${role.name}” verified and ready.`
          : "Role saved, but verification failed. Fix the credentials and try again.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Role verification failed.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async (role: ProjectRole) => {
    if (!window.confirm(`Delete “${role.name}” and wipe its stored credentials?`)) return;
    setError(null);
    try {
      await v2Api.deleteRole(role.id);
      setRoles((current) => current.filter((item) => item.id !== role.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete role.");
    }
  };
  return (
    <section className="surface-card mt-5 overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Role configuration</h2>
            <span className="rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 font-mono text-[10px] text-primary">
              {environment.name}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Authenticated personas are isolated to this environment and verified before they can be
            used by a matrix run.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setNotice(null);
            setForm(blank);
            setOpen(true);
          }}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Add Role
        </button>
      </header>
      {error && (
        <div
          role="alert"
          className="mx-5 mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mx-5 mt-4 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success"
        >
          {notice}
        </div>
      )}
      {failureScreenshot && (
        <div className="mx-5 mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="mb-2 text-xs font-semibold text-destructive">Worker failure evidence</p>
          <img
            src={failureScreenshot}
            alt="Login verification failure screenshot"
            className="max-h-72 w-full rounded-md object-contain"
          />
          <button
            type="button"
            onClick={() => setFailureScreenshot(null)}
            className="mt-2 text-xs text-muted-foreground hover:underline"
          >
            Dismiss screenshot
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-2/30 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Role name</th>
              <th className="px-5 py-3">Login URL</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  No authenticated roles configured for this environment.
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id}>
                  <td className="px-5 py-4 font-medium">{role.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                    {role.loginUrl}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={role.sessionStatus} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => void remove(role)}
                      className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-background shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="font-display text-xl font-semibold">Add authenticated role</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Credentials are encrypted server-side and never returned to the browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                disabled={busy}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <form onSubmit={submit} className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Role name"
                  value={form.name}
                  onChange={(v) => update("name", v)}
                  disabled={busy}
                  placeholder="Store Manager"
                />
                <Field
                  label="Username / email"
                  value={form.username}
                  onChange={(v) => update("username", v)}
                  disabled={busy}
                  autoComplete="username"
                  placeholder="manager@example.com"
                />
                <Field
                  label="Login route"
                  value={form.loginUrl}
                  onChange={(v) => update("loginUrl", v)}
                  disabled={busy}
                  error={
                    form.loginUrl && !relative(form.loginUrl) ? "Use a relative path" : undefined
                  }
                  placeholder="/login"
                />
                <Field
                  label="Verification route"
                  value={form.verificationUrl}
                  onChange={(v) => update("verificationUrl", v)}
                  disabled={busy}
                  error={
                    form.verificationUrl && !relative(form.verificationUrl)
                      ? "Use a relative path"
                      : undefined
                  }
                  placeholder="/dashboard"
                />
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Password <span className="text-primary">(write-only)</span>
                  </span>
                  <div className="relative">
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      disabled={busy}
                      autoComplete="new-password"
                      className="w-full rounded-md border border-border bg-surface-2/30 px-3 py-2 pr-10 text-sm outline-none focus:border-primary"
                      placeholder="Enter password for one-time verification"
                    />
                    <EyeOff className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </label>
              </div>
              <div className="rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setAdvanced((value) => !value)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
                >
                  <span>Advanced: Custom CSS Selectors</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${advanced ? "rotate-180" : ""}`}
                  />
                </button>
                {advanced && (
                  <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-3">
                    <Field
                      label="Username selector"
                      value={form.usernameSelector}
                      onChange={(v) => update("usernameSelector", v)}
                      disabled={busy}
                      placeholder="#email"
                    />
                    <Field
                      label="Password selector"
                      value={form.passwordSelector}
                      onChange={(v) => update("passwordSelector", v)}
                      disabled={busy}
                      placeholder="input[name=password]"
                    />
                    <Field
                      label="Submit selector"
                      value={form.submitSelector}
                      onChange={(v) => update("submitSelector", v)}
                      disabled={busy}
                      placeholder="button[type=submit]"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Save &amp; Verify locks this form while the worker tests the login and
                  verification route. Invalid credentials return a failure screenshot for
                  troubleshooting.
                </span>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying role…
                  </>
                ) : (
                  "Save & Verify"
                )}
              </button>
              {busy && (
                <p className="text-center text-xs text-muted-foreground">
                  The verification worker is running. Please keep this window open.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  error,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-surface-2/30 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
function StatusBadge({ status }: { status: ProjectRole["sessionStatus"] }) {
  const styles =
    status === "ACTIVE"
      ? "border-success/30 bg-success/10 text-success"
      : status === "EXPIRED" || status === "INVALID_CREDENTIALS"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-warning/30 bg-warning/10 text-warning";
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[10px] font-semibold tracking-wide ${styles}`}
    >
      {status}
    </span>
  );
}
