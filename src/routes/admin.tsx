import { useEffect, useState } from "react";
import { Activity, Check, CircleAlert, Database, Loader2, Mail, Radio, RefreshCw, Send, ShieldCheck, X } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { adminApi, type AdminAllocationRequest, type AdminTelemetrySummary, type StaffNotificationRecipient, type WorkerHealth } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console · Matrix QA" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type AdminTab = "queue" | "notifications" | "telemetry";

function AdminPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("queue");
  const [requests, setRequests] = useState<AdminAllocationRequest[]>([]);
  const [recipients, setRecipients] = useState<StaffNotificationRecipient[]>([]);
  const [telemetry, setTelemetry] = useState<AdminTelemetrySummary | null>(null);
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientLabel, setRecipientLabel] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<"ALL_USERS" | "STAFF">("ALL_USERS");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { void navigate({ to: "/auth" }); return; }
    if (!user.isStaff) void navigate({ to: "/app" });
  }, [isLoading, navigate, user]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [requestData, recipientData, telemetryData, healthData] = await Promise.all([
        adminApi.listAllocationRequests("PENDING"),
        adminApi.listRecipients(),
        adminApi.telemetry(),
        adminApi.workerHealth(),
      ]);
      setRequests(requestData);
      setRecipients(recipientData);
      setTelemetry(telemetryData);
      setHealth(healthData);
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

  if (isLoading || !user || !user.isStaff) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking staff access…</div>;

  return <AppShell title="Admin Console"><div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary"><ShieldCheck className="h-4 w-4" /> Matrix QA staff</div><h1 className="mt-2 font-display text-2xl font-semibold">Admin console</h1><p className="mt-1 text-sm text-muted-foreground">Private-alpha operations, allocation decisions, notifications, and cost telemetry.</p></div><button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div>
    {error && <div className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}{message && <div className="mt-5 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</div>}
    <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border"><TabButton active={tab === "queue"} onClick={() => setTab("queue")}>Allocation queue {requests.length > 0 && <span className="ml-1 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">{requests.length}</span>}</TabButton><TabButton active={tab === "notifications"} onClick={() => setTab("notifications")}>Notifications</TabButton><TabButton active={tab === "telemetry"} onClick={() => setTab("telemetry")}>Telemetry</TabButton></div>
    {loading ? <div className="flex items-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading staff data…</div> : tab === "queue" ? <QueueTab requests={requests} busyId={busyId} onReview={review} /> : tab === "notifications" ? <NotificationsTab recipients={recipients} recipientEmail={recipientEmail} recipientLabel={recipientLabel} setRecipientEmail={setRecipientEmail} setRecipientLabel={setRecipientLabel} busyId={busyId} onSave={saveRecipient} onDisable={disableRecipient} broadcastTitle={broadcastTitle} broadcastMessage={broadcastMessage} broadcastAudience={broadcastAudience} setBroadcastTitle={setBroadcastTitle} setBroadcastMessage={setBroadcastMessage} setBroadcastAudience={setBroadcastAudience} onBroadcast={sendBroadcast} /> : <TelemetryTab telemetry={telemetry} health={health} />}
  </div></AppShell>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{children}</button>; }

function QueueTab({ requests, busyId, onReview }: { requests: AdminAllocationRequest[]; busyId: string | null; onReview: (request: AdminAllocationRequest, status: "APPROVED" | "DECLINED") => void }) { return <section className="mt-6 space-y-3">{requests.length === 0 ? <div className="surface-card p-8 text-sm text-muted-foreground">No pending allocation requests. New requests will appear here with the requester, organization, workspace, and requested Matrix Units.</div> : requests.map((request) => <article key={request.id} className="surface-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-display text-base font-semibold">{request.requestedUnits} ⟐ requested</h2><span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-warning">{request.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{request.organization.name} · {request.workspace.name} · {request.requestedBy.fullName || request.requestedBy.email}</p></div><div className="flex gap-2"><button disabled={busyId === request.id} type="button" onClick={() => onReview(request, "DECLINED")} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"><X className="h-3.5 w-3.5" /> Decline</button><button disabled={busyId === request.id} type="button" onClick={() => onReview(request, "APPROVED")} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Approve</button></div></div><p className="mt-4 border-l-2 border-primary/40 pl-3 text-sm leading-6 text-muted-foreground">{request.reason}</p><p className="mt-3 text-[11px] text-muted-foreground">Submitted {new Date(request.createdAt).toLocaleString()}</p></article>)}</section>; }

function NotificationsTab(props: { recipients: StaffNotificationRecipient[]; recipientEmail: string; recipientLabel: string; setRecipientEmail: (value: string) => void; setRecipientLabel: (value: string) => void; busyId: string | null; onSave: (event: React.FormEvent) => void; onDisable: (recipient: StaffNotificationRecipient) => void; broadcastTitle: string; broadcastMessage: string; broadcastAudience: "ALL_USERS" | "STAFF"; setBroadcastTitle: (value: string) => void; setBroadcastMessage: (value: string) => void; setBroadcastAudience: (value: "ALL_USERS" | "STAFF") => void; onBroadcast: (event: React.FormEvent) => void }) { return <div className="mt-6 grid gap-5 xl:grid-cols-2"><section className="surface-card p-5"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">Staff email recipients</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Allocation requests are also sent to every enabled address below through Resend.</p><form onSubmit={props.onSave} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input type="email" required value={props.recipientEmail} onChange={(event) => props.setRecipientEmail(event.target.value)} placeholder="staff@matrixqa.com" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><input value={props.recipientLabel} onChange={(event) => props.setRecipientLabel(event.target.value)} placeholder="Label (optional)" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><button disabled={props.busyId === "recipient"} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Send className="h-3.5 w-3.5" /> Save</button></form><div className="mt-4 space-y-2">{props.recipients.map((recipient) => <div key={recipient.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"><div><div className="text-sm">{recipient.email}</div><div className="text-[11px] text-muted-foreground">{recipient.label || "Staff recipient"} · {recipient.enabled ? "Enabled" : "Disabled"}</div></div>{recipient.enabled && <button type="button" onClick={() => props.onDisable(recipient)} disabled={props.busyId === recipient.id} className="text-xs text-destructive hover:underline">Disable</button>}</div>)}</div></section><section className="surface-card p-5"><div className="flex items-center gap-2"><Radio className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">In-app broadcast</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Send an operational message to all customer accounts or Matrix QA staff.</p><form onSubmit={props.onBroadcast} className="mt-4 space-y-3"><input required minLength={3} maxLength={120} value={props.broadcastTitle} onChange={(event) => props.setBroadcastTitle(event.target.value)} placeholder="Notification title" className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><textarea required minLength={3} maxLength={2000} value={props.broadcastMessage} onChange={(event) => props.setBroadcastMessage(event.target.value)} placeholder="Message" className="min-h-28 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><div className="flex flex-wrap items-center justify-between gap-3"><select value={props.broadcastAudience} onChange={(event) => props.setBroadcastAudience(event.target.value as "ALL_USERS" | "STAFF")} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm"><option value="ALL_USERS">All users</option><option value="STAFF">Staff only</option></select><button disabled={props.busyId === "broadcast"} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Send className="h-3.5 w-3.5" /> Send broadcast</button></div></form></section></div>; }

function TelemetryTab({ telemetry, health }: { telemetry: AdminTelemetrySummary | null; health: WorkerHealth | null }) { const sum = telemetry?.sums || {}; return <div className="mt-6 space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Activity} label="Runs measured" value={String(telemetry?.totals ?? 0)} detail={`Build ${telemetry?.version.build ?? "1.6.2"}`} /><Metric icon={Database} label="Worker time" value={`${Math.round(Number(sum.workerTimeMs || 0) / 3600000 * 10) / 10} h`} detail="Recorded terminal runs" /><Metric icon={Database} label="Artifact bytes" value={formatBytes(Number(sum.artifactBytes || 0))} detail="Evidence and video uploads" /><Metric icon={Radio} label="R2 operations" value={String(sum.r2OperationCount || 0)} detail="Put/get/delete counts" /></div><div className={`surface-card flex items-start gap-3 p-5 ${health?.healthy ? "" : "border-destructive/40"}`}><div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${health?.healthy ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}><Activity className="h-4 w-4" /></div><div><h2 className="font-display text-base font-semibold">Worker health {health?.healthy ? "looks healthy" : "needs attention"}</h2><p className="mt-1 text-xs text-muted-foreground">{health?.activeRuns ?? 0} active runs · {health?.staleRuns ?? 0} stale heartbeats · last checked {health?.checkedAt ? new Date(health.checkedAt).toLocaleString() : "—"}</p></div>{!health?.healthy && <CircleAlert className="ml-auto h-5 w-5 text-destructive" />}</div><section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">Pricing telemetry</h2><p className="mt-1 text-xs text-muted-foreground">Worker time, video time, evidence bytes, R2 operations, and email-volume fields are persisted per run for v2 pricing calibration.</p></header><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Activity} label="Video time" value={`${Math.round(Number(sum.videoTimeMs || 0) / 60000)} min`} detail="FFmpeg/video boundary" /><Metric icon={Mail} label="Email volume" value={String(sum.emailCount || 0)} detail="Per-run counter" /><Metric icon={Database} label="R2 puts" value={String(sum.r2PutCount || 0)} detail="Artifact uploads" /><Metric icon={Database} label="R2 gets" value={String(sum.r2GetCount || 0)} detail="Signed/read operations" /></div></section></div>; }

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string; detail: string }) { return <div className="surface-card p-4"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div><div className="mt-2 font-display text-2xl font-semibold">{value}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></div>; }
function formatBytes(bytes: number) { if (!bytes) return "0 B"; const units = ["B", "KB", "MB", "GB"]; const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024))); return `${Math.round(bytes / Math.pow(1024, index) * 10) / 10} ${units[index]}`; }
