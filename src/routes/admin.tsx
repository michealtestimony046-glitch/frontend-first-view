import { useEffect, useState } from "react";
import { Activity, BrainCircuit, Check, CircleAlert, CircleDollarSign, Database, Loader2, Mail, Radio, RefreshCw, Send, ShieldCheck, X } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { adminApi, type AdminAiProviderConfig, type AdminAllocationRequest, type AdminTelemetrySummary, type ManagedSecretMetadata, type StaffManagementData, type StaffNotificationRecipient, type WorkerHealth } from "@/lib/api-client";
import { StaffManagementPanel } from "@/components/staff-management-panel";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/app-shell";
import { AdminAiModelsTab } from "@/components/admin-ai-models-tab";
import { AdminSecretsTab } from "@/components/admin-secrets-tab";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console · Matrix QA" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type AdminTab = "queue" | "notifications" | "telemetry" | "ai_models" | "secrets" | "staff";

function AdminPage() {
  const { user, isLoading } = useAuth();
  const [tab, setTab] = useState<AdminTab>("queue");
  const [requests, setRequests] = useState<AdminAllocationRequest[]>([]);
  const [recipients, setRecipients] = useState<StaffNotificationRecipient[]>([]);
  const [telemetry, setTelemetry] = useState<AdminTelemetrySummary | null>(null);
  const [aiProviders, setAiProviders] = useState<AdminAiProviderConfig[]>([]);
  const [secrets, setSecrets] = useState<ManagedSecretMetadata[]>([]);
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [staffData, setStaffData] = useState<StaffManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientLabel, setRecipientLabel] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<"ALL_USERS" | "STAFF">("ALL_USERS");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const canManageStaff = user?.staffRole === "OWNER" || user?.staffRole === "OPERATIONS_ADMIN";
      const [requestData, recipientData, telemetryData, aiProviderData, healthData, managedSecretData, staffManagementData] = await Promise.all([
        adminApi.listAllocationRequests("PENDING"),
        adminApi.listRecipients(),
        adminApi.telemetry(),
        adminApi.listAiProviderConfigs(),
        adminApi.workerHealth(),
        canManageStaff ? adminApi.listManagedSecrets() : Promise.resolve([]),
        canManageStaff ? adminApi.listStaff() : Promise.resolve(null),
      ]);
      setRequests(requestData);
      setRecipients(recipientData);
      setTelemetry(telemetryData);
      setAiProviders(aiProviderData);
      setHealth(healthData);
      setSecrets(managedSecretData);
      setStaffData(staffManagementData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load staff console data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.isStaff) void load(); }, [user?.isStaff]);

  const review = async (request: AdminAllocationRequest, status: "APPROVED" | "DECLINED") => {
    const note = window.prompt(status === "APPROVED" ? "Optional approval note" : "Reason for declining this request", "") ?? "";
    if (status === "DECLINED" && !note.trim()) return;
    setBusyId(request.id); setError(""); setMessage("");
    try {
      await adminApi.reviewAllocationRequest(request.id, { status, staffNote: note.trim() || undefined });
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setMessage(`Request ${status === "APPROVED" ? "approved" : "declined"}. The requester was notified.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to review allocation request.");
    } finally { setBusyId(null); }
  };

  const saveRecipient = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recipientEmail.trim()) return;
    setBusyId("recipient"); setError(""); setMessage("");
    try {
      const saved = await adminApi.saveRecipient({ email: recipientEmail.trim(), label: recipientLabel.trim() || undefined });
      setRecipients((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.email.localeCompare(b.email)));
      setRecipientEmail(""); setRecipientLabel(""); setMessage("Notification recipient saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save recipient."); }
    finally { setBusyId(null); }
  };

  const disableRecipient = async (recipient: StaffNotificationRecipient) => {
    setBusyId(recipient.id); setError("");
    try {
      const disabled = await adminApi.disableRecipient(recipient.id);
      setRecipients((current) => current.map((item) => item.id === disabled.id ? disabled : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to disable recipient."); }
    finally { setBusyId(null); }
  };

  const saveAiProvider = async (data: Partial<AdminAiProviderConfig> & Pick<AdminAiProviderConfig, "provider" | "model" | "useCase" | "secretRef">) => {
    setBusyId(`ai-provider-${data.useCase}`); setError(""); setMessage("");
    try {
      const saved = await adminApi.saveAiProviderConfig(data);
      setAiProviders((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.useCase.localeCompare(b.useCase) || a.priority - b.priority));
      setMessage(`${saved.provider} / ${saved.model} saved for ${saved.useCase}. New scans use it after activation.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save AI provider configuration."); }
    finally { setBusyId(null); }
  };

  const removeAiProvider = async (config: AdminAiProviderConfig) => {
    setBusyId(`ai-remove-${config.id}`); setError(""); setMessage("");
    try {
      await adminApi.deleteAiProviderConfig(config.id);
      setAiProviders((current) => current.filter((item) => item.id !== config.id));
      setMessage(`${config.provider} / ${config.model} removed from ${config.useCase}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to remove AI provider configuration."); }
    finally { setBusyId(null); }
  };

  const healthCheckAiProvider = async (config: AdminAiProviderConfig) => {
    setBusyId(`ai-health-${config.id}`); setError(""); setMessage("");
    try {
      const checked = await adminApi.healthCheckAiProviderConfig(config.id);
      setAiProviders((current) => current.map((item) => item.id === checked.id ? checked : item));
      setMessage(`${checked.provider} / ${checked.model}: ${checked.lastHealthStatus || "checked"}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to check AI provider configuration."); }
    finally { setBusyId(null); }
  };

  const saveManagedSecret = (secret: ManagedSecretMetadata) => {
    setSecrets((current) => [...current.filter((item) => item.name !== secret.name), secret].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const deleteManagedSecret = (name: string) => setSecrets((current) => current.filter((item) => item.name !== name));

  const sendBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusyId("broadcast"); setError(""); setMessage("");
    try {
      const result = await adminApi.broadcast({ title: broadcastTitle.trim(), message: broadcastMessage.trim(), audience: broadcastAudience });
      setBroadcastTitle(""); setBroadcastMessage("");
      setMessage(`Broadcast delivered to ${result.deliveredCount} ${result.audience === "STAFF" ? "staff members" : "users"}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send broadcast."); }
    finally { setBusyId(null); }
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking staff access…</div>;
  if (!user) return <AdminAccessGate title="Staff sign-in required" message="The Matrix QA admin console is restricted to staff accounts." action={<Link to="/auth" search={{ mode: "signin", returnTo: "/admin" }} className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Sign in as staff</Link>} />;
  if (!user.isStaff) return <AdminAccessGate title="Staff access required" message="Your account is signed in, but it is not enabled for Matrix QA staff operations." action={<Link to="/app" className="inline-flex items-center rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground">Return to console</Link>} />;

  return <AppShell title="Admin Console"><div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary"><ShieldCheck className="h-4 w-4" /> Matrix QA staff</div><h1 className="mt-2 font-display text-2xl font-semibold">Admin console</h1><p className="mt-1 text-sm text-muted-foreground">Private-alpha operations, allocation decisions, notifications, and cost telemetry.</p></div><button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div>
    {error && <div className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}{message && <div className="mt-5 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</div>}
    <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border"><TabButton active={tab === "queue"} onClick={() => setTab("queue")}>Allocation queue {requests.length > 0 && <span className="ml-1 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">{requests.length}</span>}</TabButton><TabButton active={tab === "notifications"} onClick={() => setTab("notifications")}>Notifications</TabButton><TabButton active={tab === "telemetry"} onClick={() => setTab("telemetry")}>Telemetry</TabButton><TabButton active={tab === "ai_models"} onClick={() => setTab("ai_models")}>AI Models</TabButton>{(user.staffRole === "OWNER" || user.staffRole === "OPERATIONS_ADMIN") && <><TabButton active={tab === "secrets"} onClick={() => setTab("secrets")}>Secrets</TabButton><TabButton active={tab === "staff"} onClick={() => setTab("staff")}>Staff Management</TabButton></>}</div>
    {loading ? <div className="flex items-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading staff data…</div> : tab === "queue" ? <QueueTab requests={requests} busyId={busyId} onReview={review} /> : tab === "notifications" ? <NotificationsTab recipients={recipients} recipientEmail={recipientEmail} recipientLabel={recipientLabel} setRecipientEmail={setRecipientEmail} setRecipientLabel={setRecipientLabel} busyId={busyId} onSave={saveRecipient} onDisable={disableRecipient} broadcastTitle={broadcastTitle} broadcastMessage={broadcastMessage} broadcastAudience={broadcastAudience} setBroadcastTitle={setBroadcastTitle} setBroadcastMessage={setBroadcastMessage} setBroadcastAudience={setBroadcastAudience} onBroadcast={sendBroadcast} /> : tab === "telemetry" ? <TelemetryTab telemetry={telemetry} health={health} /> : tab === "ai_models" ? <AdminAiModelsTab configs={aiProviders} busyId={busyId} managedSecretNames={secrets.map((secret) => secret.name)} onSave={saveAiProvider} onHealthCheck={healthCheckAiProvider} onRemove={removeAiProvider} /> : tab === "secrets" && (user.staffRole === "OWNER" || user.staffRole === "OPERATIONS_ADMIN") ? <AdminSecretsTab secrets={secrets} role={user.staffRole} busyId={busyId} onSaved={saveManagedSecret} onDeleted={deleteManagedSecret} setMessage={setMessage} setError={setError} /> : staffData ? <StaffManagementPanel data={staffData} role={user.staffRole} onChanged={load} setMessage={setMessage} setError={setError} /> : <div className="mt-6 surface-card p-6 text-sm text-muted-foreground">Staff management is available to owners and operations administrators.</div>}
  </div></AppShell>;
}

function AdminAccessGate({ title, message, action }: { title: string; message: string; action: React.ReactNode }) { return <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center"><div className="max-w-md"><ShieldCheck className="mx-auto h-8 w-8 text-primary" /><h1 className="mt-4 font-display text-xl font-semibold">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p><div className="mt-5">{action}</div></div></div>; }

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{children}</button>; }

function LegacyAiModelsTab({ configs, busyId, onSave, onHealthCheck }: { configs: AdminAiProviderConfig[]; busyId: string | null; onSave: (data: Partial<AdminAiProviderConfig> & Pick<AdminAiProviderConfig, "provider" | "model" | "useCase" | "secretRef">) => void; onHealthCheck: (config: AdminAiProviderConfig) => void }) {
  const [useCase, setUseCase] = useState<AdminAiProviderConfig["useCase"]>("DISCOVERY");
  const active = configs.find((item) => item.useCase === useCase);
  const [provider, setProvider] = useState<AdminAiProviderConfig["provider"]>("groq");
  const [model, setModel] = useState("openai/gpt-oss-20b");
  const [secretRef, setSecretRef] = useState("GROQ_API_KEY");
  const [enabled, setEnabled] = useState(false);
  const [priority, setPriority] = useState(1);
  const [timeoutMs, setTimeoutMs] = useState(20000);
  const [maxOutputTokens, setMaxOutputTokens] = useState(2000);
  const [temperature, setTemperature] = useState(0);
  const [matrixUnitSurcharge, setMatrixUnitSurcharge] = useState(1);

  useEffect(() => {
    if (!active) return;
    setProvider(active.provider); setModel(active.model); setSecretRef(active.secretRef); setEnabled(active.enabled); setPriority(active.priority); setTimeoutMs(active.timeoutMs); setMaxOutputTokens(active.maxOutputTokens); setTemperature(active.temperature); setMatrixUnitSurcharge(active.matrixUnitSurcharge);
  }, [active?.id]);

  return <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]"><section className="surface-card p-5"><div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">AI model configuration</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Choose the provider and model for each V2 use case. API keys stay in Render secrets; this form stores only the secret reference.</p><form className="mt-5 grid gap-3" onSubmit={(event) => { event.preventDefault(); onSave({ provider, model: model.trim(), useCase, secretRef: secretRef.trim(), enabled, priority, timeoutMs, maxOutputTokens, temperature, matrixUnitSurcharge }); }}><label className="grid gap-1 text-xs text-muted-foreground">Use case<select value={useCase} onChange={(event) => setUseCase(event.target.value as AdminAiProviderConfig["useCase"])} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground"><option>DISCOVERY</option><option>PLANNING</option><option>BROWSER_AGENT</option><option>VISION</option><option>RECOVERY</option></select></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs text-muted-foreground">Provider<select value={provider} onChange={(event) => setProvider(event.target.value as AdminAiProviderConfig["provider"])} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground"><option value="groq">Groq</option><option value="openai">OpenAI</option><option value="gemini">Gemini</option><option value="openai_compatible">OpenAI-compatible</option></select></label><label className="grid gap-1 text-xs text-muted-foreground">Model<input value={model} onChange={(event) => setModel(event.target.value)} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label></div><label className="grid gap-1 text-xs text-muted-foreground">Deployment secret reference<input value={secretRef} onChange={(event) => setSecretRef(event.target.value)} placeholder="GROQ_API_KEY" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /><span className="text-[11px]">Never paste the actual API key here.</span></label><div className="grid gap-3 sm:grid-cols-3"><label className="grid gap-1 text-xs text-muted-foreground">Priority<input type="number" min={1} max={100} value={priority} onChange={(event) => setPriority(Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Timeout ms<input type="number" min={1000} max={120000} value={timeoutMs} onChange={(event) => setTimeoutMs(Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Max output tokens<input type="number" min={16} max={8192} value={maxOutputTokens} onChange={(event) => setMaxOutputTokens(Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs text-muted-foreground">Temperature<input type="number" min={0} max={1} step={0.05} value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Matrix surcharge units<input type="number" min={0} max={100} value={matrixUnitSurcharge} onChange={(event) => setMatrixUnitSurcharge(Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Activate this configuration for new work</label><button disabled={busyId === `ai-provider-${useCase}`} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Save versioned configuration</button></form></section><section className="surface-card p-5"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">Configured providers</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Changing a configuration affects new scans/plans. Existing runs keep their configuration snapshot.</p><div className="mt-4 space-y-2">{configs.length === 0 ? <p className="text-sm text-muted-foreground">No database-managed provider configurations yet. The deployment environment fallback remains active.</p> : configs.map((config) => <div key={config.id} className="rounded-md border border-border/60 p-3"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium">{config.provider} / {config.model}</div><div className="text-[11px] text-muted-foreground">{config.useCase} · v{config.configVersion} · {config.enabled ? "Active" : "Disabled"}</div></div><button type="button" onClick={() => onHealthCheck(config)} disabled={busyId === `ai-health-${config.id}`} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50">Health check</button></div><div className="mt-2 text-[11px] text-muted-foreground">Secret ref: {config.secretRef} · Status: {config.lastHealthStatus || "Not checked"}{config.lastHealthError ? ` · ${config.lastHealthError}` : ""}</div></div>)}</div></section></div>;
}

function QueueTab({ requests, busyId, onReview }: { requests: AdminAllocationRequest[]; busyId: string | null; onReview: (request: AdminAllocationRequest, status: "APPROVED" | "DECLINED") => void }) { return <section className="mt-6 space-y-3">{requests.length === 0 ? <div className="surface-card p-8 text-sm text-muted-foreground">No pending allocation requests. New requests will appear here with the requester, organization, workspace, and requested Matrix Units.</div> : requests.map((request) => <article key={request.id} className="surface-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-display text-base font-semibold">{request.requestedUnits} ⟐ requested</h2><span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-warning">{request.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{request.organization.name} · {request.workspace.name} · {request.requestedBy.fullName || request.requestedBy.email}</p></div><div className="flex gap-2"><button disabled={busyId === request.id} type="button" onClick={() => onReview(request, "DECLINED")} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"><X className="h-3.5 w-3.5" /> Decline</button><button disabled={busyId === request.id} type="button" onClick={() => onReview(request, "APPROVED")} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Approve</button></div></div><p className="mt-4 border-l-2 border-primary/40 pl-3 text-sm leading-6 text-muted-foreground">{request.reason}</p><p className="mt-3 text-[11px] text-muted-foreground">Submitted {new Date(request.createdAt).toLocaleString()}</p></article>)}</section>; }

function NotificationsTab(props: { recipients: StaffNotificationRecipient[]; recipientEmail: string; recipientLabel: string; setRecipientEmail: (value: string) => void; setRecipientLabel: (value: string) => void; busyId: string | null; onSave: (event: React.FormEvent) => void; onDisable: (recipient: StaffNotificationRecipient) => void; broadcastTitle: string; broadcastMessage: string; broadcastAudience: "ALL_USERS" | "STAFF"; setBroadcastTitle: (value: string) => void; setBroadcastMessage: (value: string) => void; setBroadcastAudience: (value: "ALL_USERS" | "STAFF") => void; onBroadcast: (event: React.FormEvent) => void }) { return <div className="mt-6 grid gap-5 xl:grid-cols-2"><section className="surface-card p-5"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">Staff email recipients</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Allocation requests are also sent to every enabled address below through Resend.</p><form onSubmit={props.onSave} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input type="email" required value={props.recipientEmail} onChange={(event) => props.setRecipientEmail(event.target.value)} placeholder="staff@matrixqa.com" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><input value={props.recipientLabel} onChange={(event) => props.setRecipientLabel(event.target.value)} placeholder="Label (optional)" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><button disabled={props.busyId === "recipient"} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Send className="h-3.5 w-3.5" /> Save</button></form><div className="mt-4 space-y-2">{props.recipients.map((recipient) => <div key={recipient.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"><div><div className="text-sm">{recipient.email}</div><div className="text-[11px] text-muted-foreground">{recipient.label || "Staff recipient"} · {recipient.enabled ? "Enabled" : "Disabled"}</div></div>{recipient.enabled && <button type="button" onClick={() => props.onDisable(recipient)} disabled={props.busyId === recipient.id} className="text-xs text-destructive hover:underline">Disable</button>}</div>)}</div></section><section className="surface-card p-5"><div className="flex items-center gap-2"><Radio className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">In-app broadcast</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Send an operational message to all customer accounts or Matrix QA staff.</p><form onSubmit={props.onBroadcast} className="mt-4 space-y-3"><input required minLength={3} maxLength={120} value={props.broadcastTitle} onChange={(event) => props.setBroadcastTitle(event.target.value)} placeholder="Notification title" className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><textarea required minLength={3} maxLength={2000} value={props.broadcastMessage} onChange={(event) => props.setBroadcastMessage(event.target.value)} placeholder="Message" className="min-h-28 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><div className="flex flex-wrap items-center justify-between gap-3"><select value={props.broadcastAudience} onChange={(event) => props.setBroadcastAudience(event.target.value as "ALL_USERS" | "STAFF")} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm"><option value="ALL_USERS">All users</option><option value="STAFF">Staff only</option></select><button disabled={props.busyId === "broadcast"} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Send className="h-3.5 w-3.5" /> Send broadcast</button></div></form></section></div>; }

function TelemetryTab({ telemetry, health }: { telemetry: AdminTelemetrySummary | null; health: WorkerHealth | null }) {
  const sum = telemetry?.sums || {};
  const ai = telemetry?.aiUsage;
  const aiTotals = ai?.totals;
  const creditUsage = telemetry?.creditUsage;
  const capacity = telemetry?.providerCapacity;
  const capacityWindow = capacity?.window;
  const capacityBudget = capacity?.configuration.dailyBudget ?? 0;
  return <div className="mt-6 space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Activity} label="Runs measured" value={String(telemetry?.totals ?? 0)} detail={`Build ${telemetry?.version.build ?? "1.6.2"}`} /><Metric icon={Database} label="Worker time" value={`${Math.round(Number(sum.workerTimeMs || 0) / 3600000 * 10) / 10} h`} detail="Recorded terminal runs" /><Metric icon={Database} label="Artifact bytes" value={formatBytes(Number(sum.artifactBytes || 0))} detail="Evidence and video uploads" /><Metric icon={Radio} label="R2 operations" value={String(sum.r2OperationCount || 0)} detail="Put/get/delete counts" /></div>
    <div className={`surface-card flex items-start gap-3 p-5 ${health?.healthy ? "" : "border-destructive/40"}`}><div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${health?.healthy ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}><Activity className="h-4 w-4" /></div><div><h2 className="font-display text-base font-semibold">Worker health {health?.healthy ? "looks healthy" : "needs attention"}</h2><p className="mt-1 text-xs text-muted-foreground">{health?.activeRuns ?? 0} active runs · {health?.staleRuns ?? 0} stale heartbeats · last checked {health?.checkedAt ? new Date(health.checkedAt).toLocaleString() : "—"}</p></div>{!health?.healthy && <CircleAlert className="ml-auto h-5 w-5 text-destructive" />}</div>
    <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="flex items-center gap-2 font-display text-base font-semibold"><BrainCircuit className="h-4 w-4 text-primary" />AI usage and cost</h2><p className="mt-1 text-xs text-muted-foreground">Estimated provider spend from sanitized AI calls. USD is an internal cost estimate; Matrix Units are the customer-facing usage surcharge and are tracked separately.</p></header><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={BrainCircuit} label="AI calls" value={String(aiTotals?.events ?? 0)} detail={`${aiTotals?.degradedEvents ?? 0} degraded`} /><Metric icon={Database} label="AI tokens" value={String(aiTotals?.totalTokens ?? 0)} detail={`${aiTotals?.averageLatencyMs ?? 0} ms average`} /><Metric icon={CircleDollarSign} label="Estimated USD" value={formatUsd(aiTotals?.estimatedCostUsd ?? 0)} detail="Provider model estimate" /><Metric icon={CircleDollarSign} label="AI Matrix Units" value={`${aiTotals?.billableMatrixUnits ?? 0} ⟐`} detail="Successful enrichment surcharge" /><Metric icon={Activity} label="AI success" value={aiTotals?.events ? `${Math.round(((aiTotals.events - aiTotals.degradedEvents) / aiTotals.events) * 100)}%` : "—"} detail="Non-degraded calls" /></div>{ai && <div className="grid gap-5 border-t border-border p-5 xl:grid-cols-2"><div><h3 className="font-display text-sm font-semibold">Provider/model breakdown</h3><div className="mt-3 divide-y divide-border border-y border-border">{ai.providers.length ? ai.providers.map((provider) => <div key={`${provider.provider}-${provider.model}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div><div className="font-medium">{provider.provider} · {provider.model}</div><div className="text-muted-foreground">{provider.events} calls · {provider.totalTokens} tokens · {provider.degradedEvents} degraded</div></div><div className="text-right"><div className="font-mono">{formatUsd(provider.estimatedCostUsd)}</div><div className="text-muted-foreground">{provider.billableMatrixUnits} ⟐</div></div></div>) : <p className="py-4 text-xs text-muted-foreground">No AI calls recorded yet.</p>}</div></div><div><h3 className="font-display text-sm font-semibold">Use-case breakdown</h3><div className="mt-3 divide-y divide-border border-y border-border">{ai.useCases.length ? ai.useCases.map((item) => <div key={item.useCase} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div><div className="font-medium">{item.useCase}</div><div className="text-muted-foreground">{item.events} calls · {item.totalTokens} tokens · {item.degradedEvents} degraded</div></div><div className="text-right"><div className="font-mono">{formatUsd(item.estimatedCostUsd)}</div><div className="text-muted-foreground">{item.billableMatrixUnits} ⟐</div></div></div>) : <p className="py-4 text-xs text-muted-foreground">No use-case AI usage recorded yet.</p>}</div></div><div><h3 className="font-display text-sm font-semibold">Organization breakdown</h3><div className="mt-3 divide-y divide-border border-y border-border">{ai.organizations.length ? ai.organizations.slice(0, 10).map((organization) => <div key={organization.organizationId} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div><div className="font-medium">{organization.organizationName}</div><div className="text-muted-foreground">{organization.events} calls · {organization.totalTokens} tokens · {organization.degradedEvents} degraded</div></div><div className="text-right"><div className="font-mono">{formatUsd(organization.estimatedCostUsd)}</div><div className="text-muted-foreground">{organization.billableMatrixUnits} ⟐</div></div></div>) : <p className="py-4 text-xs text-muted-foreground">No organization AI usage recorded yet.</p>}</div></div></div>}</section>
    <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">Credit and infrastructure reconciliation</h2><p className="mt-1 text-xs text-muted-foreground">This is the platform-wide ledger view; customer Matrix Units remain separate from internal provider invoices and infrastructure cost.</p></header><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={CircleDollarSign} label="Reserved (outstanding)" value={`${creditUsage?.reservedUnits ?? 0} ⟐`} detail={`${creditUsage?.grossReservedUnits ?? creditUsage?.reservedUnits ?? 0} gross · ${creditUsage?.reservedInternalCredits ?? 0} internal`} /><Metric icon={Check} label="Settled" value={`${creditUsage?.settledUnits ?? 0} ⟐`} detail={`${creditUsage?.settledInternalCredits ?? 0} internal`} /><Metric icon={RefreshCw} label="Refunded" value={`${creditUsage?.refundedUnits ?? 0} ⟐`} detail={`${creditUsage?.refundedInternalCredits ?? 0} internal`} /><Metric icon={Activity} label="Video time" value={`${Math.round(Number(sum.videoTimeMs || 0) / 60000)} min`} detail="FFmpeg/video boundary" /><Metric icon={Mail} label="Email volume" value={String(sum.emailCount || 0)} detail="Per-run counter" /></div><div className="grid gap-4 border-t border-border p-5 sm:grid-cols-2"><Metric icon={Database} label="R2 puts" value={String(sum.r2PutCount || 0)} detail="Artifact uploads" /><Metric icon={Database} label="R2 gets" value={String(sum.r2GetCount || 0)} detail="Signed/read operations" /></div></section>
    {capacity && <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">Provider capacity window</h2><p className="mt-1 text-xs text-muted-foreground">Internal staff telemetry for the configured free-first provider. Customers see only Matrix Units and queue/reset messaging.</p></header><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={Activity} label="Provider" value={capacity.configuration.provider} detail="Current capacity source" /><Metric icon={Database} label="Daily budget" value={String(capacityBudget)} detail={`${capacity.configuration.organizationSlots} logical slots`} /><Metric icon={ShieldCheck} label="Protected reserve" value={String(capacity.configuration.protectedReserve)} detail={`${capacity.configuration.alphaOrganizations} alpha organizations`} /><Metric icon={Activity} label="Reserved" value={String(capacityWindow?.reservedUnits ?? 0)} detail={`${Math.round((capacityWindow?.reservedUnits ?? 0) / Math.max(1, capacityBudget) * 100)}% of budget`} /><Metric icon={Check} label="Consumed / released" value={`${capacityWindow?.consumedUnits ?? 0} / ${capacityWindow?.releasedUnits ?? 0}`} detail="Settled provider units" /></div><div className="border-t border-border p-5"><h3 className="font-display text-sm font-semibold">Reservation status</h3><div className="mt-3 grid gap-2 sm:grid-cols-3">{Object.entries(capacity.reservationsByStatus).map(([status, item]) => <div key={status} className="rounded-md border border-border/60 p-3 text-xs"><div className="font-medium uppercase tracking-wider">{status}</div><div className="mt-1 text-muted-foreground">{item.reservations} reservations · {item.estimatedUnits} estimated units · {item.actualUnits} actual units</div></div>)}{Object.keys(capacity.reservationsByStatus).length === 0 && <p className="text-xs text-muted-foreground">No provider reservations in the current UTC window.</p>}</div></div></section>}
  </div>;
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string; detail: string }) { return <div className="surface-card p-4"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div><div className="mt-2 font-display text-2xl font-semibold">{value}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></div>; }
function formatBytes(bytes: number) { if (!bytes) return "0 B"; const units = ["B", "KB", "MB", "GB"]; const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024))); return `${Math.round(bytes / Math.pow(1024, index) * 10) / 10} ${units[index]}`; }
function formatUsd(value: number) { return `$${Number(value || 0).toFixed(8)}`; }
