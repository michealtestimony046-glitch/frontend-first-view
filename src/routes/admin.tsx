import { useEffect, useState } from "react";
import { Activity, ArrowLeft, BrainCircuit, Check, CircleAlert, CircleDollarSign, Database, Download, Eye, ListChecks, Loader2, Mail, Menu, Radio, RefreshCw, Search, Send, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { adminApi, authApi, type BackendHealthResponse, type AdminAiProviderConfig, type AdminAllocationRequest, type AdminAlphaParticipant, type AdminClientView, type AdminControlTowerSnapshot, type AdminCustomerAccount, type AdminOllamaRequestDiagnostic, type AdminOperationsMetrics, type AdminProviderCreditSnapshot, type AdminTelemetrySummary, type AdminMatrixUnitSnapshot, type AdminWorkforceAgent, type AdminWorkforceSnapshot, type AlphaRewardTier, type ManagedSecretMetadata, type StaffManagementData, type StaffReliabilityDashboard, type StaffNotificationRecipient, type TargetComplaint, type TargetComplaintStatus, type TargetSuspension, type WorkerHealth } from "@/lib/api-client";
import { StaffManagementPanel } from "@/components/staff-management-panel";
import { useAuth } from "@/lib/auth-context";
import { AdminAiModelsTab } from "@/components/admin-ai-models-tab";
import { AdminSecretsTab } from "@/components/admin-secrets-tab";
import { AdminAlphaEventTab } from "@/components/admin-alpha-event-tab";
import { AdminWorkforceTab } from "@/components/admin-workforce-tab";
import { AdminPlanBadge, useAdminAlphaClock } from "@/components/admin-plan-badge";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console · Matrix QA" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type AdminTab = "control_tower" | "queue" | "notifications" | "telemetry" | "reliability" | "ai_models" | "secrets" | "staff" | "customers" | "complaints" | "client_view" | "alpha_event" | "workforce";

type OllamaRequestRow = NonNullable<AdminTelemetrySummary["aiUsage"]>["recent"][number];

type OllamaRequestRecord = {
  row: OllamaRequestRow;
  request: AdminOllamaRequestDiagnostic;
};

const withFallbackTimeout = <T,>(request: Promise<T>, fallback: T, timeoutMs = 5000): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const fallbackPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });
  return Promise.race([request.catch(() => fallback), fallbackPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

function getOllamaRequestRows(ai: AdminTelemetrySummary["aiUsage"]): OllamaRequestRecord[] {
  return (ai?.recent ?? []).flatMap((row) => {
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {};
    const providerRequests = Array.isArray(metadata.providerRequests) ? metadata.providerRequests : [];
    return providerRequests.flatMap((candidate) => {
      if (!candidate || typeof candidate !== "object") return [];
      const request = candidate as Record<string, unknown>;
      if (request.provider !== "ollama_cloud" || typeof request.endpoint !== "string") return [];
      return [{ row, request: request as unknown as OllamaRequestRecord["request"] }];
    });
  });
}

function formatOllamaControlFields(request: OllamaRequestRecord["request"]): string {
  const fields = request.body?.fields ?? {};
  return Object.entries(fields)
    .filter(([key]) => ["model", "temperature", "max_tokens", "max_completion_tokens", "reasoning_effort", "include_reasoning"].includes(key))
    .map(([key, value]) => `${key}=${typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "[shape recorded]"}`)
    .join(" · ");
}

function AdminPage() {
  const { user, isLoading } = useAuth();
  const [tab, setTab] = useState<AdminTab>("control_tower");
  const [requests, setRequests] = useState<AdminAllocationRequest[]>([]);
  const [recipients, setRecipients] = useState<StaffNotificationRecipient[]>([]);
  const [telemetry, setTelemetry] = useState<AdminTelemetrySummary | null>(null);
  const [controlTower, setControlTower] = useState<AdminControlTowerSnapshot | null>(null);
  const [metrics, setMetrics] = useState<AdminOperationsMetrics | null>(null);
  const [reliability, setReliability] = useState<StaffReliabilityDashboard | null>(null);
  const [aiProviders, setAiProviders] = useState<AdminAiProviderConfig[]>([]);
  const [providerCredits, setProviderCredits] = useState<AdminProviderCreditSnapshot | null>(null);
  const [matrixUnits, setMatrixUnits] = useState<AdminMatrixUnitSnapshot | null>(null);
  const [providerCreditsLoading, setProviderCreditsLoading] = useState(false);
  const [providerCreditsRefreshing, setProviderCreditsRefreshing] = useState(false);
  const [providerCreditsError, setProviderCreditsError] = useState("");
  const [secrets, setSecrets] = useState<ManagedSecretMetadata[]>([]);
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [runtimeHealth, setRuntimeHealth] = useState<BackendHealthResponse | null>(null);
  const [staffData, setStaffData] = useState<StaffManagementData | null>(null);
  const [customers, setCustomers] = useState<AdminCustomerAccount[]>([]);
  const [alphaParticipants, setAlphaParticipants] = useState<AdminAlphaParticipant[]>([]);
  const [complaints, setComplaints] = useState<TargetComplaint[]>([]);
  const [suspensions, setSuspensions] = useState<TargetSuspension[]>([]);
  const [clientView, setClientView] = useState<AdminClientView | null>(null);
  const [clientViewLoading, setClientViewLoading] = useState(false);
  const [workforceAgents, setWorkforceAgents] = useState<AdminWorkforceAgent[]>([]);
  const [workforceRun, setWorkforceRun] = useState<AdminWorkforceSnapshot | null>(null);
  const [workforceRunLoading, setWorkforceRunLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientLabel, setRecipientLabel] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<"ALL_USERS" | "STAFF">("ALL_USERS");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const canManageStaff = user?.staffRole === "OWNER" || user?.staffRole === "OPERATIONS_ADMIN";
      const [requestData, recipientData, telemetryData, matrixUnitData, aiProviderData, healthData, runtimeHealthData, managedSecretData, staffManagementData, controlTowerData, metricsData, reliabilityData, customerData, alphaParticipantData, complaintData, suspensionData, workforceAgentData] = await Promise.all([
        adminApi.listAllocationRequests("PENDING"),
        adminApi.listRecipients(),
        withFallbackTimeout(adminApi.telemetry(), null),
        adminApi.matrixUnits().catch(() => null),
        adminApi.listAiProviderConfigs(),
        adminApi.workerHealth(),
        authApi.ping().catch(() => null),
        canManageStaff ? adminApi.listManagedSecrets() : Promise.resolve([]),
        canManageStaff ? adminApi.listStaff() : Promise.resolve(null),
        adminApi.controlTower(),
        adminApi.metrics(7),
        adminApi.reliability(30),
        adminApi.listCustomerAccounts(),
        adminApi.listAlphaParticipants().catch(() => []),
        adminApi.listTargetComplaints(),
        adminApi.listTargetSuspensions(),
        adminApi.listWorkforceAgents().catch(() => []),
      ]);
      setRequests(requestData);
      setRecipients(recipientData);
      setTelemetry(telemetryData);
      setMatrixUnits(matrixUnitData);
      setAiProviders(aiProviderData);
      setHealth(healthData);
      setRuntimeHealth(runtimeHealthData);
      setSecrets(managedSecretData);
      setStaffData(staffManagementData);
      setControlTower(controlTowerData);
      setMetrics(metricsData);
      setReliability(reliabilityData);
      setCustomers(customerData);
      setAlphaParticipants(alphaParticipantData);
      setComplaints(complaintData);
      setSuspensions(suspensionData);
      setWorkforceAgents(workforceAgentData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load staff console data.");
    } finally {
      setLoading(false);
    }
  };

  const loadMatrixUnits = async () => {
    try { setMatrixUnits(await adminApi.matrixUnits()); } catch { /* older rolling backend or temporary staff API outage; retain the last snapshot */ }
  };

  const loadWorkforceRun = async (runId: string) => {
    setWorkforceRunLoading(true); setError(""); setMessage("");
    try {
      setWorkforceRun(await adminApi.workforceRun(runId));
      setMessage(`Loaded workforce ledger for run ${runId.slice(0, 12)}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the workforce run ledger.");
      setWorkforceRun(null);
    } finally { setWorkforceRunLoading(false); }
  };

  const decideWorkforceDelegation = async (messageId: string, approve: boolean) => {
    const reason = window.prompt(approve ? "Optional approval note" : "Reason for rejecting this delegation", "") ?? "";
    if (!approve && !reason.trim()) return;
    setBusyId(`${approve ? "approve" : "reject"}-${messageId}`); setError(""); setMessage("");
    try {
      if (approve) await adminApi.approveWorkforceDelegation(messageId, reason.trim() || undefined);
      else await adminApi.rejectWorkforceDelegation(messageId, reason.trim());
      setMessage(`Delegation ${approve ? "approved" : "rejected"}.`);
      if (workforceRun) await loadWorkforceRun(workforceRun.runId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to decide the workforce delegation."); }
    finally { setBusyId(null); }
  };

  const loadProviderCredits = async (forceRefresh = false) => {
    if (forceRefresh) setProviderCreditsRefreshing(true); else setProviderCreditsLoading(true);
    setProviderCreditsError("");
    try {
      setProviderCredits(await adminApi.providerCredits(forceRefresh));
    } catch (cause) {
      setProviderCreditsError(cause instanceof Error ? cause.message : "Unable to load provider credit telemetry.");
    } finally {
      setProviderCreditsLoading(false);
      setProviderCreditsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user?.isStaff) return;
    void load();
    void loadProviderCredits();
    void loadMatrixUnits();
    const timer = window.setInterval(() => { void loadProviderCredits(); void loadMatrixUnits(); }, 60_000);
    return () => window.clearInterval(timer);
  }, [user?.isStaff]);

  const exportAudit = async () => {
    setExporting(true); setError(""); setMessage("");
    try {
      const audit = await adminApi.auditExport();
      const blob = new Blob([JSON.stringify(audit, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `matrixqa-audit-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage(`Complete audit export ready: ${audit.counts.runs} runs, ${audit.counts.aiEvents} AI events, ${audit.counts.telemetryRows} telemetry rows.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to export complete audit data."); }
    finally { setExporting(false); }
  };

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

  const viewAsClient = async (client: AdminCustomerAccount) => {
    setBusyId(`view-client-${client.id}`); setClientViewLoading(true); setError(""); setMessage(""); setTab("client_view");
    try {
      const view = await adminApi.viewAsClient(client.id);
      setClientView(view);
      setMessage(`Read-only client view opened for ${client.email}. Staff identity remains active and actions are attributed to the staff operator.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to open the client view."); }
    finally { setClientViewLoading(false); setBusyId(null); }
  };

  const returnToClientAccounts = () => { setClientView(null); setClientViewLoading(false); setTab("customers"); };

  const changeCustomerStatus = async (customer: AdminCustomerAccount, status: "ACTIVE" | "SUSPENDED" | "DISABLED") => {
    const reason = window.prompt(status === "ACTIVE" ? "Optional reactivation note" : `Reason for ${status.toLowerCase()} this client account`, "") ?? "";
    if (status !== "ACTIVE" && reason.trim().length < 3) return;
    setBusyId(`customer-${customer.id}`); setError(""); setMessage("");
    try {
      const updated = await adminApi.changeCustomerAccountStatus(customer.id, { status, reason: reason.trim() || undefined });
      setCustomers((current) => current.map((item) => item.id === updated.id ? { ...item, accountStatus: updated.accountStatus } : item));
      setMessage(`${customer.email} is now ${status.toLowerCase()}; active sessions were revoked.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to change the client account status."); }
    finally { setBusyId(null); }
  };

  const grantAlphaReward = async (data: { email: string; tier: Exclude<AlphaRewardTier, "NONE">; startAt?: string; reason?: string }) => {
    setBusyId("alpha-grant"); setError(""); setMessage("");
    try {
      const result = await adminApi.grantAlphaReward(data);
      setAlphaParticipants(await adminApi.listAlphaParticipants());
      setMessage(`${result.user.email} received ${result.grant.tier.replaceAll("_", " ").toLowerCase()}; the reward expires ${new Date(result.grant.expiresAt).toLocaleString()}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to grant the alpha event reward."); }
    finally { setBusyId(null); }
  };

  const revokeAlphaReward = async (grantId: string) => {
    const reason = window.prompt("Reason for revoking this alpha event reward", "") ?? "";
    setBusyId(`alpha-revoke-${grantId}`); setError(""); setMessage("");
    try {
      await adminApi.revokeAlphaReward(grantId, reason.trim() || undefined);
      setAlphaParticipants(await adminApi.listAlphaParticipants());
      setMessage("Alpha event reward revoked. The client now falls back to the normal access-limit gate.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to revoke the alpha event reward."); }
    finally { setBusyId(null); }
  };

  const saveAlphaParticipant = async (userId: string, data: Parameters<typeof adminApi.updateAlphaParticipant>[1]) => {
    setBusyId(`alpha-participant-${userId}`); setError(""); setMessage("");
    try {
      await adminApi.updateAlphaParticipant(userId, data);
      setAlphaParticipants(await adminApi.listAlphaParticipants());
      setMessage("Participant record saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save the participant record."); }
    finally { setBusyId(null); }
  };

  const addAlphaParticipantFeedback = async (userId: string, note: string) => {
    setBusyId(`alpha-feedback-${userId}`); setError(""); setMessage("");
    try {
      await adminApi.addAlphaParticipantFeedback(userId, note);
      setAlphaParticipants(await adminApi.listAlphaParticipants());
      setMessage("Participant feedback added.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to add participant feedback."); }
    finally { setBusyId(null); }
  };

  const reviewComplaint = async (complaint: TargetComplaint, status: TargetComplaintStatus, suspendTarget = false) => {
    const prompt = suspendTarget ? `Reason for suspending ${complaint.targetUrl}` : `Optional note for ${status.toLowerCase().replaceAll("_", " ")}`;
    const staffNote = window.prompt(prompt, complaint.staffNote ?? "") ?? "";
    if (suspendTarget && staffNote.trim().length < 3) return;
    setBusyId(`complaint-${complaint.id}`); setError(""); setMessage("");
    try {
      const updated = await adminApi.reviewTargetComplaint(complaint.id, { status, staffNote: staffNote.trim() || undefined, suspendTarget });
      setComplaints((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      if (updated.targetSuspended && updated.suspensionId) setSuspensions((current) => [{ id: updated.suspensionId!, normalizedOrigin: new URL(complaint.targetUrl).origin.toLowerCase(), targetUrl: complaint.targetUrl, reason: staffNote.trim(), status: "ACTIVE", createdById: user?.id || "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current.filter((item) => item.id !== updated.suspensionId)]);
      setMessage(suspendTarget ? `Target suspended. New runs against this origin are blocked until staff revokes the suspension.` : `Target complaint marked ${status.toLowerCase().replaceAll("_", " ")}; the reporter was notified.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to review the target complaint."); }
    finally { setBusyId(null); }
  };

  const reviewReliabilityQuarantine = async (id: string, status: "ACTIVE" | "RESOLVED" | "REJECTED" | "REVOKED") => {
    setBusyId(`reliability-${id}`); setError(""); setMessage("");
    try {
      const updated = await adminApi.reviewReliabilityQuarantine(id, { status });
      setReliability((current) => current ? { ...current, quarantines: current.quarantines.map((item) => item.id === id ? { ...item, ...updated } : item) } : current);
      setMessage(`Reliability quarantine marked ${status.toLowerCase()}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to review reliability quarantine."); }
    finally { setBusyId(null); }
  };

  const revokeSuspension = async (suspension: TargetSuspension) => {
    const note = window.prompt(`Optional revocation note for ${suspension.normalizedOrigin}`, "") ?? "";
    setBusyId(`suspension-${suspension.id}`); setError(""); setMessage("");
    try {
      await adminApi.revokeTargetSuspension(suspension.id, note.trim() || undefined);
      setSuspensions((current) => current.filter((item) => item.id !== suspension.id));
      setMessage(`Target suspension revoked for ${suspension.normalizedOrigin}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to revoke the target suspension."); }
    finally { setBusyId(null); }
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking staff access…</div>;
  if (!user) return <AdminAccessGate title="Staff sign-in required" message="The Matrix QA admin console is restricted to staff accounts." action={<Link to="/auth" search={{ mode: "signin", returnTo: "/admin" }} className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Sign in as staff</Link>} />;
  if (!user.isStaff) return <AdminAccessGate title="Staff access required" message="Your account is signed in, but it is not enabled for Matrix QA staff operations." action={<Link to="/app" className="inline-flex items-center rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground">Return to console</Link>} />;

  return <AdminShell activeTab={tab} onTabChange={(nextTab) => { setTab(nextTab); }} canManageStaff={user.staffRole === "OWNER" || user.staffRole === "OPERATIONS_ADMIN"}><div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary"><ShieldCheck className="h-4 w-4" /> Matrix QA staff</div><h1 className="mt-2 font-display text-2xl font-semibold">Admin console</h1><p className="mt-1 text-sm text-muted-foreground">Private-alpha operations, allocation decisions, notifications, and cost telemetry.</p></div><button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div>
    {error && <div className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}{message && <div className="mt-5 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</div>}
    {loading ? <div className="flex items-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading staff data…</div> : tab === "control_tower" ? <ControlTowerTab snapshot={controlTower} metrics={metrics} providers={aiProviders} onOpenAiModels={() => setTab("ai_models")} /> :
 tab === "queue" ? <QueueTab requests={requests} busyId={busyId} onReview={review} /> : tab === "workforce" ? <AdminWorkforceTab agents={workforceAgents} snapshot={workforceRun} loading={workforceRunLoading} busyId={busyId} onLoadRun={loadWorkforceRun} onApprove={(messageId) => decideWorkforceDelegation(messageId, true)} onReject={(messageId) => decideWorkforceDelegation(messageId, false)} /> : tab === "alpha_event" ? <AdminAlphaEventTab rows={alphaParticipants} canManageRewards={user.staffRole === "OWNER" || user.staffRole === "OPERATIONS_ADMIN"} busyId={busyId} onGrant={grantAlphaReward} onRevoke={revokeAlphaReward} onSaveParticipant={saveAlphaParticipant} onAddFeedback={addAlphaParticipantFeedback} /> : tab === "notifications" ? <NotificationsTab recipients={recipients} recipientEmail={recipientEmail} recipientLabel={recipientLabel} setRecipientEmail={setRecipientEmail} setRecipientLabel={setRecipientLabel} busyId={busyId} onSave={saveRecipient} onDisable={disableRecipient} broadcastTitle={broadcastTitle} broadcastMessage={broadcastMessage} broadcastAudience={broadcastAudience} setBroadcastTitle={setBroadcastTitle} setBroadcastMessage={setBroadcastMessage} setBroadcastAudience={setBroadcastAudience} onBroadcast={sendBroadcast} /> : tab === "customers" ? <CustomersTab customers={customers} busyId={busyId} onStatusChange={changeCustomerStatus} onViewAsClient={viewAsClient} /> : tab === "client_view" ? <ClientViewTab customers={customers} busyId={busyId} clientView={clientView} loading={clientViewLoading} onViewAsClient={viewAsClient} onReturn={returnToClientAccounts} /> : tab === "complaints" ? <ComplaintsTab complaints={complaints} suspensions={suspensions} busyId={busyId} onReview={reviewComplaint} onSuspend={(complaint) => { void reviewComplaint(complaint, "UNDER_REVIEW", true); }} onRevoke={revokeSuspension} /> : tab === "telemetry" ? <TelemetryTab telemetry={telemetry} health={health} runtimeHealth={runtimeHealth} exporting={exporting} onExport={exportAudit} providerCredits={providerCredits} providerCreditsLoading={providerCreditsLoading} providerCreditsRefreshing={providerCreditsRefreshing} providerCreditsError={providerCreditsError} onRefreshProviderCredits={() => void loadProviderCredits(true)} matrixUnits={matrixUnits} /> : tab === "reliability" ? <ReliabilityTab data={reliability} busyId={busyId} onReview={reviewReliabilityQuarantine} /> : tab === "ai_models" ? <AdminAiModelsTab configs={aiProviders} busyId={busyId} managedSecretNames={secrets.map((secret) => secret.name)} onSave={saveAiProvider} onHealthCheck={healthCheckAiProvider} onRemove={removeAiProvider} /> : tab === "secrets" && (user.staffRole === "OWNER" || user.staffRole === "OPERATIONS_ADMIN") ? <AdminSecretsTab secrets={secrets} role={user.staffRole} busyId={busyId} onSaved={saveManagedSecret} onDeleted={deleteManagedSecret} setMessage={setMessage} setError={setError} /> : staffData ? <StaffManagementPanel data={staffData} role={user.staffRole} onChanged={load} setMessage={setMessage} setError={setError} /> : <div className="mt-6 surface-card p-6 text-sm text-muted-foreground">Staff management is available to owners and operations administrators.</div>}
  </div></AdminShell>;
}

function AdminShell({ activeTab, onTabChange, canManageStaff, children }: { activeTab: AdminTab; onTabChange: (tab: AdminTab) => void; canManageStaff: boolean; children: React.ReactNode }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups: Array<{ label: string; items: Array<{ key: AdminTab; label: string; icon: typeof Activity }> }> = [
    { label: "Overview", items: [{ key: "control_tower", label: "Control tower", icon: Activity }] },
    { label: "Operations", items: [{ key: "queue", label: "Queue & capacity", icon: ListChecks }, { key: "workforce", label: "Collaborative workforce", icon: Users }, { key: "telemetry", label: "Telemetry", icon: Radio }, { key: "reliability", label: "Reliability", icon: Activity }, { key: "notifications", label: "Notifications", icon: Mail }] },
    { label: "Security", items: [{ key: "client_view", label: "Client view", icon: Eye }, { key: "customers", label: "Client accounts", icon: Users }, { key: "complaints", label: "Target complaints", icon: CircleAlert }] },
    { label: "Research", items: [{ key: "alpha_event", label: "Alpha event", icon: UserPlus }] },
    { label: "Configuration", items: [{ key: "ai_models", label: "AI providers", icon: BrainCircuit }, ...(canManageStaff ? [{ key: "secrets" as const, label: "Secrets", icon: Database }, { key: "staff" as const, label: "Staff management", icon: Users }] : [])] },
  ];
  const sidebar = <div className="flex h-full flex-col bg-background text-muted-foreground"><div className="flex h-16 items-center gap-3 border-b border-border px-5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">M</div><div><div className="font-display text-sm font-semibold tracking-wide text-foreground">Matrix QA</div><div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Control tower</div></div></div><div className="border-b border-border px-5 py-4"><div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Operations workspace</div><div className="mt-1 truncate text-sm font-medium text-foreground">Private alpha</div></div><nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4">{groups.map((group) => <div key={group.label} className="mb-5"><div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</div><div className="space-y-1">{group.items.map((item) => { const Icon = item.icon; const active = activeTab === item.key; return <button key={item.key} type="button" onClick={() => { onTabChange(item.key); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${active ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</div></div>)}</nav><div className="border-t border-border p-4"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{(user?.fullName || user?.email || "MQ").slice(0, 2).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-xs font-medium text-foreground">{user?.fullName || "Staff operator"}</div><div className="truncate text-[10px] text-muted-foreground">{user?.staffRole || "Staff"}</div></div></div></div></div>;
  return <div className="min-h-screen bg-background text-foreground"><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:flex">{sidebar}</aside>{mobileOpen && <div className="fixed inset-0 z-40 lg:hidden"><button type="button" aria-label="Close admin navigation" className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} /> <aside className="relative h-full w-72 shadow-2xl">{sidebar}</aside></div>}<div className="min-h-screen lg:pl-64"><header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-8"><button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden" aria-label="Open admin navigation" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button><div className="relative hidden max-w-md flex-1 md:block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search admin console" placeholder="Search runs, organizations, findings…" className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary" /></div><div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground"><span className="hidden items-center gap-2 sm:flex"><span className="h-2 w-2 rounded-full bg-success" />Systems operational</span><span className="hidden h-5 w-px bg-border sm:block" /> <Link to="/app" aria-label="Switch to client console" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10"><ArrowLeft className="h-3.5 w-3.5" />Switch to client console</Link><span className="font-medium text-foreground">Staff console</span></div></header><main className="min-h-[calc(100vh-4rem)]">{children}</main></div></div>;
}

function AdminAccessGate({ title, message, action }: { title: string; message: string; action: React.ReactNode }) { return <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center"><div className="max-w-md"><ShieldCheck className="mx-auto h-8 w-8 text-primary" /><h1 className="mt-4 font-display text-xl font-semibold">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p><div className="mt-5">{action}</div></div></div>; }


function ReliabilityTab({ data, busyId, onReview }: { data: StaffReliabilityDashboard | null; busyId: string | null; onReview: (id: string, status: "ACTIVE" | "RESOLVED" | "REJECTED" | "REVOKED") => void }) {
  if (!data) return <div className="surface-card p-8 text-sm text-muted-foreground">Reliability data is unavailable. Refresh the staff console after the backend migration is deployed.</div>;
  const outcomes = data.attempts.reduce((result, attempt) => { const key = String(attempt.outcome || "inconclusive"); result[key] = (result[key] || 0) + 1; return result; }, {} as Record<string, number>);
  const maxOutcome = Math.max(1, ...Object.values(outcomes));
  return <div className="space-y-5"><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Control tower / signal quality</div><h2 className="mt-2 font-display text-xl font-semibold">Reliability intelligence</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Immutable attempts, environment-aware classifications, recurring failure signatures, quarantine proposals, and release-gate decisions. This surface is staff-only and does not overwrite the original run result.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><MetricCard label="Attempts" value={data.summary.attemptCount} tone="neutral" /><MetricCard label="Pass rate" value={data.summary.passRate == null ? "—" : `${Math.round(data.summary.passRate * 100)}%`} tone={data.summary.passRate != null && data.summary.passRate >= 0.9 ? "success" : "warning"} /><MetricCard label="Failures" value={data.summary.failCount} tone={data.summary.failCount ? "danger" : "success"} /><MetricCard label="Quarantined" value={data.summary.quarantinedCount} tone={data.summary.quarantinedCount ? "warning" : "success"} /><MetricCard label="Gate decisions" value={data.releaseGateDecisions.length} tone="neutral" /></div><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h3 className="font-display text-base font-semibold">Outcome distribution</h3><p className="mt-1 text-xs text-muted-foreground">The distinction between target, worker, environment, policy, and inconclusive outcomes is intentional.</p></header><div className="space-y-3 p-5">{Object.entries(outcomes).map(([outcome, count]) => <div key={outcome}><div className="flex items-center justify-between text-xs"><span className="capitalize text-foreground">{outcome.replaceAll("_", " ")}</span><span className="font-mono text-muted-foreground">{count}</span></div><div className="mt-1 h-2 rounded-full bg-surface-2"><div className={`h-full rounded-full ${outcome === "pass" ? "bg-success" : outcome.includes("failure") ? "bg-destructive" : "bg-warning"}`} style={{ width: `${Math.max(5, Math.round((count / maxOutcome) * 100))}%` }} /></div></div>)}{!Object.keys(outcomes).length && <p className="text-sm text-muted-foreground">No attempts are in the selected window.</p>}</div></section><section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h3 className="font-display text-base font-semibold">Release-gate decisions</h3><p className="mt-1 text-xs text-muted-foreground">Gate decisions are append-only and carry their source attempt watermark.</p></header><div className="max-h-64 overflow-y-auto divide-y divide-border pr-1">{data.releaseGateDecisions.slice(0, 8).map((decision) => <div key={decision.id} className="px-5 py-3"><div className="flex items-center justify-between gap-3"><span className={`font-mono text-[10px] uppercase tracking-wider ${decision.status === "TRUSTED" ? "text-success" : decision.status === "BLOCKED" ? "text-destructive" : "text-warning"}`}>{decision.status.replaceAll("_", " ")}</span><span className="font-mono text-[10px] text-muted-foreground">{new Date(decision.decidedAt).toLocaleString()}</span></div><p className="mt-1 text-xs text-muted-foreground">{decision.decisionReason}</p></div>)}{!data.releaseGateDecisions.length && <p className="p-5 text-sm text-muted-foreground">No release-gate decisions yet.</p>}</div></section></div><section className="surface-card overflow-hidden"><header className="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 className="font-display text-base font-semibold">Quarantine review queue</h3><p className="mt-1 text-xs text-muted-foreground">Reviewing a quarantine changes its release-gate effect, not the historical attempt.</p></div><span className="font-mono text-xs text-muted-foreground">{data.quarantines.length} records</span></header><div className="max-h-[34rem] overflow-y-auto divide-y divide-border pr-1">{data.quarantines.slice(0, 25).map((row) => <div key={String(row.id)} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-wider text-warning">{String(row.status)}</span><span className="font-mono text-[10px] text-muted-foreground">expires {new Date(String(row.expiresAt)).toLocaleDateString()}</span></div><p className="mt-1 text-sm text-foreground">{String(row.reason)}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">quarantine {String(row.id).slice(0, 12)} · logical test {String(row.logicalTestId).slice(0, 12)}</p></div><div className="flex shrink-0 flex-wrap gap-2">{row.status === "PROPOSED" && <><button type="button" disabled={busyId === `reliability-${row.id}`} onClick={() => onReview(String(row.id), "ACTIVE")} className="rounded-md border border-warning/30 px-2.5 py-1.5 text-[11px] font-medium text-warning hover:bg-warning/10 disabled:opacity-40">Activate</button><button type="button" disabled={busyId === `reliability-${row.id}`} onClick={() => onReview(String(row.id), "REJECTED")} className="rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent disabled:opacity-40">Reject</button></>}{row.status === "ACTIVE" && <button type="button" disabled={busyId === `reliability-${row.id}`} onClick={() => onReview(String(row.id), "RESOLVED")} className="rounded-md border border-success/30 px-2.5 py-1.5 text-[11px] font-medium text-success hover:bg-success/10 disabled:opacity-40">Resolve</button>}</div></div>)}{!data.quarantines.length && <p className="p-5 text-sm text-muted-foreground">No quarantine proposals are waiting for review.</p>}</div></section></div>;
}

function CustomersTab({ customers, busyId, onStatusChange, onViewAsClient }: { customers: AdminCustomerAccount[]; busyId: string | null; onStatusChange: (customer: AdminCustomerAccount, status: "ACTIVE" | "SUSPENDED" | "DISABLED") => void; onViewAsClient: (client: AdminCustomerAccount) => void }) {
  const active = customers.filter((customer) => customer.accountStatus === "ACTIVE").length;
  const suspended = customers.filter((customer) => customer.accountStatus === "SUSPENDED").length;
  const disabled = customers.filter((customer) => customer.accountStatus === "DISABLED").length;
  const alphaNow = useAdminAlphaClock();
  return <div className="space-y-5"><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Security / lifecycle</div><h2 className="mt-2 font-display text-xl font-semibold">Client accounts</h2><p className="mt-1 text-sm text-muted-foreground">Review account access, revoke active sessions, and keep the private alpha under control.</p></div><div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Active" value={active} tone="success" /><MetricCard label="Suspended" value={suspended} tone="warning" /><MetricCard label="Disabled" value={disabled} tone="danger" /></div><section className="surface-card overflow-hidden"><header className="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 className="font-display text-base font-semibold">Client directory</h3><p className="mt-1 text-xs text-muted-foreground">Account state changes revoke sessions immediately and create audit records.</p></div><span className="font-mono text-xs text-muted-foreground">{customers.length} accounts</span></header><div className="max-h-[34rem] divide-y divide-border overflow-y-auto">{customers.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No client accounts found.</p> : customers.map((customer) => <div key={customer.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-semibold">{customer.fullName || "Unnamed client"}</span><AdminPlanBadge access={customer} now={alphaNow} /><span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${customer.accountStatus === "ACTIVE" ? "border-success/30 bg-success/10 text-success" : customer.accountStatus === "SUSPENDED" ? "border-warning/30 bg-warning/10 text-warning" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>{customer.accountStatus}</span></div><div className="mt-1 truncate text-xs text-muted-foreground">{customer.email} · joined {new Date(customer.createdAt).toLocaleDateString()} · {customer.emailVerified ? "verified" : "unverified"}</div><div className="mt-2 text-[11px] text-muted-foreground">{customer.organizationCount} organizations · {customer.runCount} triggered runs</div></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => onViewAsClient(customer)} disabled={busyId === `view-client-${customer.id}`} className="rounded-md border border-primary/30 px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/10 disabled:opacity-40">View as client</button><button type="button" onClick={() => onStatusChange(customer, "ACTIVE")} disabled={busyId === `customer-${customer.id}` || customer.accountStatus === "ACTIVE"} className="rounded-md border border-success/30 px-2.5 py-1.5 text-[11px] font-medium text-success hover:bg-success/10 disabled:opacity-40">Reactivate</button><button type="button" onClick={() => onStatusChange(customer, "SUSPENDED")} disabled={busyId === `customer-${customer.id}` || customer.accountStatus === "SUSPENDED"} className="rounded-md border border-warning/30 px-2.5 py-1.5 text-[11px] font-medium text-warning hover:bg-warning/10 disabled:opacity-40">Suspend</button><button type="button" onClick={() => onStatusChange(customer, "DISABLED")} disabled={busyId === `customer-${customer.id}` || customer.accountStatus === "DISABLED"} className="rounded-md border border-destructive/30 px-2.5 py-1.5 text-[11px] font-medium text-destructive hover:bg-destructive/10 disabled:opacity-40">Disable</button></div></div>)}</div></section></div>;
}

function ClientViewTab({ customers, busyId, clientView, loading, onViewAsClient, onReturn }: { customers: AdminCustomerAccount[]; busyId: string | null; clientView: AdminClientView | null; loading: boolean; onViewAsClient: (client: AdminCustomerAccount) => void; onReturn: () => void }) {
  const [query, setQuery] = useState("");
  const alphaNow = useAdminAlphaClock();
  const matches = customers.filter((client) => `${client.fullName || ""} ${client.email}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="mt-6 space-y-5"><section className="surface-card overflow-hidden"><header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4"><div><div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-primary"><Eye className="h-4 w-4" /> Staff workspace</div><h2 className="mt-2 font-display text-xl font-semibold">Client view</h2><p className="mt-1 text-sm text-muted-foreground">Select a client to inspect their profile, organizations, workspaces, projects, and recent runs without changing the URL or leaving the staff console.</p></div>{clientView && <button type="button" onClick={onReturn} className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">Return to client accounts</button>}</header><div className="p-5"><label className="text-xs font-medium text-foreground" htmlFor="client-view-search">Find a client</label><div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input id="client-view-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" className="w-full rounded-md border border-border bg-surface-2 py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary" /></div><div className="mt-4 grid max-h-64 gap-2 overflow-y-auto pr-1">{matches.length ? matches.map((client) => <button key={client.id} type="button" onClick={() => onViewAsClient(client)} disabled={busyId === `view-client-${client.id}`} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-3 text-left ${clientView?.client.id === client.id ? "border-primary/50 bg-primary/10" : "border-border/70 bg-surface-2/25 hover:bg-accent"}`}><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><span className="block truncate text-sm font-medium text-foreground">{client.fullName || "Unnamed client"}</span><AdminPlanBadge access={client} now={alphaNow} /></span><span className="mt-1 block truncate text-xs text-muted-foreground">{client.email} · {client.organizationCount} organizations · {client.runCount} runs</span></span><span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{client.accountStatus}</span></button>) : <p className="text-sm text-muted-foreground">No clients match this search.</p>}</div></div></section>{loading ? <div className="surface-card flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading the selected client view…</div> : clientView ? <ClientViewPanel view={clientView} onClose={onReturn} /> : <div className="surface-card p-8 text-sm text-muted-foreground">Choose a client above to open the read-only client view. Every view is recorded in the staff audit history.</div>}</div>;
}

function ClientViewPanel({ view, onClose }: { view: AdminClientView; onClose: () => void }) {
  const client = view.client;
  return (
    <section className="surface-card overflow-hidden border-primary/20 p-5 md:p-6" aria-labelledby="client-view-title">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Read-only staff view</div>
          <h2 id="client-view-title" className="mt-2 font-display text-xl font-semibold">View as client</h2>
          <p className="mt-1 text-sm text-muted-foreground">{client.fullName || "Unnamed client"} · {client.email}</p>
          <p className="mt-2 text-xs text-muted-foreground">This view never changes the staff identity, cannot submit client actions, and is recorded in the staff audit history.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">Return to client accounts</button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <MetricCard label="Account status" value={client.accountStatus} tone={client.accountStatus === "ACTIVE" ? "success" : client.accountStatus === "SUSPENDED" ? "warning" : "danger"} />
        <MetricCard label="Organizations" value={view.organizations.length} tone="neutral" />
        <MetricCard label="Recent runs" value={view.recentRuns.length} tone="neutral" />
        <MetricCard label="Email" value={client.emailVerified ? "Verified" : "Unverified"} tone={client.emailVerified ? "success" : "warning"} />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-card overflow-hidden">
          <header className="border-b border-border px-4 py-3">
            <h3 className="font-display text-base font-semibold">Client organizations and workspaces</h3>
            <p className="mt-1 text-xs text-muted-foreground">Read-only structure view; no client data is modified.</p>
          </header>
          <div className="max-h-[32rem] overflow-y-auto divide-y divide-border pr-1">
            {view.organizations.length ? view.organizations.map((organization) => (
              <article key={organization.id} className="px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{organization.name}</div>
                  <span className="text-xs text-muted-foreground">{organization.ownerId === client.id ? "Owner" : organization.members[0]?.role || "Member"}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {organization.workspaces.length ? organization.workspaces.map((workspace) => (
                    <div key={workspace.id} className="rounded-md border border-border/70 bg-surface-2/35 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{workspace.name}</span>
                        <span className="text-[11px] text-muted-foreground">{workspace.projects.length} projects</span>
                      </div>
                      {workspace.projects.length > 0 && <div className="mt-2 space-y-1">
                        {workspace.projects.map((project) => (
                          <div key={project.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span>{project.name}</span>
                            <span className="max-w-[22rem] truncate font-mono text-muted-foreground">{project.defaultTargetUrl || "No target configured"}</span>
                          </div>
                        ))}
                      </div>}
                    </div>
                  )) : <p className="text-xs text-muted-foreground">No workspaces found.</p>}
                </div>
              </article>
            )) : <p className="p-4 text-sm text-muted-foreground">No organizations found.</p>}
          </div>
        </section>
        <section className="surface-card overflow-hidden">
          <header className="border-b border-border px-4 py-3">
            <h3 className="font-display text-base font-semibold">Recent client runs</h3>
            <p className="mt-1 text-xs text-muted-foreground">Latest run outcomes available to staff for support.</p>
          </header>
          <div className="max-h-[32rem] overflow-y-auto divide-y divide-border pr-1">
            {view.recentRuns.length ? view.recentRuns.map((run) => (
              <div key={run.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider">{run.status}</span>
                  <span className="text-[11px] text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-1 truncate text-sm font-medium">{run.targetUrl}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{run.project?.name || "Project"} · {run.workspace?.name || "Workspace"} · {run.type}</div>
                {run.errorMessage && <div className="mt-1 truncate text-xs text-destructive">{run.errorMessage}</div>}
              </div>
            )) : <p className="p-4 text-sm text-muted-foreground">No runs recorded for this client.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}

function ComplaintsTab({ complaints, suspensions, busyId, onReview, onSuspend, onRevoke }: { complaints: TargetComplaint[]; suspensions: TargetSuspension[]; busyId: string | null; onReview: (complaint: TargetComplaint, status: TargetComplaintStatus) => void; onSuspend: (complaint: TargetComplaint) => void; onRevoke: (suspension: TargetSuspension) => void }) {
  const open = complaints.filter((complaint) => complaint.status === "OPEN" || complaint.status === "UNDER_REVIEW").length;
  return <div className="space-y-5"><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Security / target integrity</div><h2 className="mt-2 font-display text-xl font-semibold">Target complaints</h2><p className="mt-1 text-sm text-muted-foreground">Review client reports about unsafe, incorrect, or unexpectedly reachable targets. Every decision is notified and audited.</p></div><div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Open review" value={open} tone="warning" /><MetricCard label="Resolved" value={complaints.filter((complaint) => complaint.status === "RESOLVED").length} tone="success" /><MetricCard label="Dismissed" value={complaints.filter((complaint) => complaint.status === "DISMISSED").length} tone="neutral" /></div><section className="surface-card overflow-hidden"><header className="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 className="font-display text-base font-semibold">Complaint queue</h3><p className="mt-1 text-xs text-muted-foreground">Client target reports are retained for operational review.</p></div><span className="font-mono text-xs text-muted-foreground">{complaints.length} reports</span></header><div className="max-h-[34rem] divide-y divide-border overflow-y-auto">{complaints.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No target complaints have been submitted.</p> : complaints.map((complaint) => <div key={complaint.id} className="space-y-3 px-5 py-4"><div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{complaint.status.replaceAll("_", " ")}</span><span className="truncate text-sm font-semibold">{complaint.reporter?.email || complaint.reporterId || "Client"}</span></div><a href={complaint.targetUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate font-mono text-xs text-primary hover:underline">{complaint.targetUrl}</a><p className="mt-2 text-sm leading-5 text-foreground/85">{complaint.reason}</p>{complaint.staffNote && <p className="mt-2 text-xs text-muted-foreground">Staff note: {complaint.staffNote}</p>}</div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => onReview(complaint, "UNDER_REVIEW")} disabled={busyId === `complaint-${complaint.id}` || complaint.status === "UNDER_REVIEW"} className="rounded-md border border-primary/30 px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/10 disabled:opacity-40">Mark reviewing</button><button type="button" onClick={() => onReview(complaint, "RESOLVED")} disabled={busyId === `complaint-${complaint.id}` || complaint.status === "RESOLVED"} className="rounded-md border border-success/30 px-2.5 py-1.5 text-[11px] font-medium text-success hover:bg-success/10 disabled:opacity-40">Resolve</button><button type="button" onClick={() => onReview(complaint, "DISMISSED")} disabled={busyId === `complaint-${complaint.id}` || complaint.status === "DISMISSED"} className="rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent disabled:opacity-40">Dismiss</button><button type="button" onClick={() => onSuspend(complaint)} disabled={busyId === `complaint-${complaint.id}` || Boolean(complaint.targetSuspended)} className="rounded-md border border-warning/40 px-2.5 py-1.5 text-[11px] font-medium text-warning hover:bg-warning/10 disabled:opacity-40">{complaint.targetSuspended ? "Target suspended" : "Suspend target"}</button></div></div><div className="text-[11px] text-muted-foreground">Submitted {new Date(complaint.createdAt).toLocaleString()}{complaint.project?.name ? ` · project ${complaint.project.name}` : ""}</div></div>)}</div></section><section className="surface-card overflow-hidden"><header className="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 className="font-display text-base font-semibold">Active target suspensions</h3><p className="mt-1 text-xs text-muted-foreground">New runs against these origins are rejected before provider or Matrix reservations.</p></div><span className="font-mono text-xs text-muted-foreground">{suspensions.length} active</span></header><div className="max-h-[28rem] overflow-y-auto divide-y divide-border pr-1">{suspensions.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No active target suspensions.</p> : suspensions.map((suspension) => <div key={suspension.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="truncate font-mono text-sm text-primary">{suspension.normalizedOrigin}</div><div className="mt-1 text-xs text-muted-foreground">{suspension.reason}</div><div className="mt-1 text-[11px] text-muted-foreground">Created {new Date(suspension.createdAt).toLocaleString()}</div></div><button type="button" onClick={() => onRevoke(suspension)} disabled={busyId === `suspension-${suspension.id}`} className="shrink-0 rounded-md border border-success/30 px-2.5 py-1.5 text-[11px] font-medium text-success hover:bg-success/10 disabled:opacity-40">Revoke suspension</button></div>)}</div></section></div>;
}

function MetricCard({ label, value, tone }: { label: string; value: number | string; tone: "success" | "warning" | "danger" | "neutral" }) {
  const styles = { success: "text-success", warning: "text-warning", danger: "text-destructive", neutral: "text-foreground" } as const;
  return <div className="surface-card p-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className={`mt-2 font-display text-2xl font-semibold ${styles[tone]}`}>{value}</div></div>;
}


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

function ControlTowerTab({ snapshot, metrics, providers, onOpenAiModels }: { snapshot: AdminControlTowerSnapshot | null; metrics: AdminOperationsMetrics | null; providers: AdminAiProviderConfig[]; onOpenAiModels: () => void }) {
  if (!snapshot) return <div className="mt-6 surface-card p-8 text-sm text-muted-foreground">The control-tower snapshot is unavailable. Refresh to try again.</div>;
  const alphaNow = useAdminAlphaClock();
  const statusCount = (status: string) => snapshot.runs.statusCounts[status] ?? 0;
  const newestUsers = snapshot.users.recent.slice(0, 8);
  const newestRuns = snapshot.runs.recent.slice(0, 8);
  const providerRows = [...providers].sort((left, right) => left.useCase.localeCompare(right.useCase) || left.priority - right.priority);
  return <div className="mt-6 space-y-5">
    {metrics && <OperationsMetricsPanel metrics={metrics} />}
    <section className="surface-card overflow-hidden border-primary/25 bg-primary/[0.04] p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-primary"><ShieldCheck className="h-4 w-4" /> Product mission</div><h2 className="mt-2 max-w-3xl font-display text-xl font-semibold leading-tight">{snapshot.product.mission}</h2><p className="mt-2 text-xs text-muted-foreground">Runtime: {snapshot.product.runtime} · Deterministic client fallback: {snapshot.product.deterministicCustomerFallback ? "enabled" : "disabled"}</p></div><div className="rounded-md border border-primary/20 bg-background/70 px-3 py-2 text-right text-[11px] text-muted-foreground"><div className="font-medium text-foreground">Control tower snapshot</div><div className="mt-1">{new Date(snapshot.generatedAt).toLocaleString()}</div></div></div></section>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Metric icon={Users} label="Users" value={String(snapshot.users.total)} detail={`+${snapshot.users.new24h} in 24h · +${snapshot.users.new30d} in 30d`} /><Metric icon={Database} label="Organizations" value={String(snapshot.organizations.total)} detail={`+${snapshot.organizations.new30d} in 30d`} /><Metric icon={Activity} label="Running" value={String(snapshot.queue.running)} detail={`${snapshot.queue.pending} pending`} /><Metric icon={ListChecks} label="Completed" value={String(snapshot.queue.completed)} detail={`${statusCount("FAILED")} failed · ${snapshot.queue.blocked} blocked`} /><Metric icon={BrainCircuit} label="Providers" value={String(snapshot.aiProviders.length)} detail={`${snapshot.aiProviders.filter((item) => item.enabled).length} active`} /><Metric icon={Mail} label="Unread alerts" value={String(snapshot.security.unreadNotifications)} detail="In-app notifications" /></div>
        <section className="surface-card overflow-hidden"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="font-display text-base font-semibold">AI provider fleet</h2><p className="mt-1 text-xs text-muted-foreground">Primary and fallback capacity at a glance. Pool size shows references only; secret values never enter the browser.</p></div><button type="button" onClick={onOpenAiModels} className="text-xs font-medium text-primary hover:underline">Manage AI models</button>
</header><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">{providerRows.length ? providerRows.map((provider) => <article key={provider.id} className="rounded-md border border-border/70 bg-surface-2/20 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{provider.useCase} · {provider.priority === 1 ? "Primary" : `Fallback ${provider.priority - 1}`}</div><div className="mt-1 truncate text-sm font-semibold">{provider.provider}</div><div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{provider.model}</div></div><span className={`mt-1 h-2.5 w-2.5 rounded-full ${provider.runtimeStatus === "READY" && provider.lastHealthStatus !== "UNHEALTHY" ? "bg-success" : provider.runtimeStatus === "MISSING_SECRET" ? "bg-destructive" : "bg-warning"}`} title={provider.lastHealthStatus || provider.runtimeStatus || "Not checked"} /> </div><div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground"><span>{provider.enabled ? "Eligible" : "Disabled"}</span><span>{provider.secretSource === "POOL" ? `Pool · ${provider.configuredPoolKeys ?? 0} keys` : provider.secretSource === "MANAGED" ? "Managed vault" : provider.secretSource === "DEPLOYMENT" ? "Deployment secret" : "Missing secret"}</span></div><div className="mt-2 text-[11px] text-muted-foreground">Health: {provider.lastHealthStatus || "Not checked"}{provider.lastHealthCheckedAt ? ` · ${new Date(provider.lastHealthCheckedAt).toLocaleString()}` : ""}</div></article>) : <p className="text-sm text-muted-foreground">No database-managed AI providers configured. The fallback environment path is visible in Telemetry.</p>}</div></section>
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]"><section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">Recent runs</h2>
<p className="mt-1 text-xs text-muted-foreground">Operational view of the latest AI browser work. Open the run to inspect the evidence-backed report and linked evidence.</p></header><div className="divide-y divide-border">{newestRuns.length ? newestRuns.map((run) => <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs"><div className="min-w-0"><div className="truncate font-medium">{run.targetUrl}</div><div className="mt-1 text-muted-foreground">{String(run.metadata?.mode || run.type).replaceAll("_", " ")} · {new Date(run.createdAt).toLocaleString()}</div></div><div className="text-right"><div className="font-mono uppercase tracking-wider text-foreground">{run.status}</div>{run.errorMessage && <div className="mt-1 max-w-xs truncate text-destructive">{run.errorMessage}</div>}</div></div>) : <p className="px-5 py-8 text-sm text-muted-foreground">No runs recorded yet.</p>}</div></section><section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">Queue and capacity</h2><p className="mt-1 text-xs text-muted-foreground">The queue protects the provider while preserving client-credit trust.</p></header><div className="grid grid-cols-2 gap-3 p-5">{[["Pending", snapshot.queue.pending], ["Running", snapshot.queue.running], ["Blocked", snapshot.queue.blocked], ["Failed", snapshot.queue.failed], ["Completed", snapshot.queue.completed]].map(([label, value]) => <div key={String(label)} className="rounded-md border border-border/60 p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 font-display text-xl font-semibold">{String(value)}</div></div>)}</div><div className="border-t border-border px-5 py-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Provider reservations</div><div className="mt-3 space-y-2">{Object.entries(snapshot.queue.capacityByStatus).length ? Object.entries(snapshot.queue.capacityByStatus).map(([status, value]) => <div key={status} className="flex items-center justify-between text-xs"><span className="uppercase tracking-wider">{status}</span><span className="text-muted-foreground">{value.reservations} reservations · {value.estimatedUnits} estimated units</span></div>) : <span className="text-xs text-muted-foreground">No active provider reservations.</span>}</div></div></section></div>
    <div className="grid gap-5 xl:grid-cols-2"><section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">New users and leads</h2><p className="mt-1 text-xs text-muted-foreground">Accounts are visible for operations; marketing-lead tracking remains intentionally separate and disabled.</p></header><div className="divide-y divide-border">{newestUsers.map((person) => <div key={person.id} className="flex items-center justify-between gap-3 px-5 py-3 text-xs"><div><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{person.fullName || person.email}</span><AdminPlanBadge access={person} now={alphaNow} /></div><div className="mt-1 text-muted-foreground">{person.email} · {new Date(person.createdAt).toLocaleString()}</div></div><div className="text-right text-muted-foreground">{person.isStaff ? "Staff" : person.emailVerified ? "Verified" : "Unverified"}</div></div>)}{newestUsers.length === 0 && <p className="px-5 py-8 text-sm text-muted-foreground">No users recorded yet.</p>}</div><div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">Lead tracking: {snapshot.users.leadTracking.tracked ? "enabled" : "not enabled"}. {snapshot.users.leadTracking.reason}</div></section><section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">Security and controls</h2><p className="mt-1 text-xs text-muted-foreground">The console shows what is tracked and what is intentionally not collected.</p></header><div className="grid gap-3 p-5 sm:grid-cols-2">{[["Client suspension", snapshot.controls.customerAccountSuspension], ["Session revocation", snapshot.controls.customerSessionRevocation], ["Provider configuration", snapshot.controls.providerConfiguration], ["Allocation review", snapshot.controls.allocationReview], ["Login telemetry", snapshot.security.loginTelemetry.tracked], ["Country telemetry", snapshot.security.countryTelemetry.tracked]].map(([label, enabled]) => <div key={String(label)} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-xs"><span>{label}</span><span className={enabled ? "text-success" : "text-muted-foreground"}>{enabled ? "Enabled" : "Not collected"}</span></div>)}</div><div className="border-t border-border px-5 py-4"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Recent staff audit events</div><div className="mt-3 max-h-64 overflow-y-auto space-y-2 pr-1">{snapshot.security.recentStaffAuditEvents.map((event) => <div key={event.id} className="flex justify-between gap-3 text-xs"><span className="font-medium">{event.eventType}</span><span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span></div>)}{snapshot.security.recentStaffAuditEvents.length === 0 && <span className="text-xs text-muted-foreground">No staff audit events yet.</span>}</div></div></section></div>
  </div>;
}

function OperationsMetricsPanel({ metrics }: { metrics: AdminOperationsMetrics }) {
  const current = metrics.current;
  const trend = metrics.trend;
  const maxRuns = Math.max(1, ...trend.map((bucket) => bucket.totalRuns));
  const statusEntries = Object.entries(current.statusCounts).filter(([, value]) => value > 0).sort(([, left], [, right]) => right - left);
  const maxStatus = Math.max(1, ...statusEntries.map(([, value]) => value));
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const signed = (value: number, digits = 2) => `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;
  const reportTime = formatDuration(current.averageTimeToFirstReportSec);
  return <section className="surface-card overflow-hidden border-primary/20"><header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4"><div><div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-primary"><Activity className="h-3.5 w-3.5" /> Real operations metrics</div><h2 className="mt-1 font-display text-base font-semibold">What the platform did in the last {metrics.window.days} days</h2><p className="mt-1 text-xs text-muted-foreground">Values are calculated from persisted runs, evidence outcomes, queue state, and AI usage events. No sample deltas are used.</p></div><div className="text-right text-[11px] text-muted-foreground">Compared with the preceding {metrics.window.days} days</div></header><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-6"><Metric icon={CircleAlert} label="Findings captured" value={String(current.findingRuns)} detail={`${percent(current.findingRate)} of covered runs · ${signed(metrics.comparisons.findingRate.delta * 100, 1)} pp`} /><Metric icon={Check} label="Pass rate" value={percent(current.passRate)} detail={`${current.successfulRuns} successful terminal runs · ${signed(metrics.comparisons.totalRuns.delta, 0)} run delta`} /><Metric icon={Activity} label="Time to report" value={reportTime} detail={`${signed(metrics.comparisons.averageTimeToFirstReportSec.delta, 1)} sec vs prior`} /><Metric icon={Radio} label="Queue depth" value={String(current.queueDepth)} detail={`${signed(metrics.comparisons.queueDepth.delta, 0)} vs prior window`} /><Metric icon={CircleDollarSign} label="AI cost / run" value={formatUsd(current.ai.costPerRunUsd)} detail={`${current.ai.calls} calls · ${percent(current.ai.fallbackRate)} fallback`} /><Metric icon={RefreshCw} label="Repeat-run rate" value={percent(current.repeatRunRate)} detail={`${signed(metrics.comparisons.repeatRunRate.delta * 100, 1)} pp vs prior`} /></div><div className="grid gap-5 border-t border-border p-5 xl:grid-cols-[1.4fr_0.6fr]"><div><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-sm font-semibold">Overall run trend</h3><p className="mt-1 text-xs text-muted-foreground">Passed, findings, failed, blocked, and running work per bucket.</p></div><div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground"><span><i className="mr-1 inline-block h-2 w-2 bg-success" />Passed</span><span><i className="mr-1 inline-block h-2 w-2 bg-primary" />Findings</span><span><i className="mr-1 inline-block h-2 w-2 bg-destructive" />Failed</span><span><i className="mr-1 inline-block h-2 w-2 bg-warning" />Blocked</span><span><i className="mr-1 inline-block h-2 w-2 bg-muted-foreground" />Running</span></div></div>{trend.length ? <div className="mt-4 grid min-h-[190px] grid-cols-7 items-end gap-2 border-b border-border pb-2">{trend.slice(-7).map((bucket) => <div key={bucket.bucketStart} className="flex min-w-0 flex-col items-center justify-end gap-2"><div className="flex h-36 items-end justify-center gap-0.5" title={`${bucket.label}: ${bucket.totalRuns} runs, queue depth ${bucket.queueDepth}`}><span className="w-2 bg-success" style={{ height: `${Math.max(3, ((bucket.completed / maxRuns) * 120))}px` }} /><span className="w-2 bg-primary" style={{ height: `${Math.max(3, ((bucket.passedWithFindings / maxRuns) * 120))}px` }} /><span className="w-2 bg-destructive" style={{ height: `${Math.max(3, ((bucket.failed / maxRuns) * 120))}px` }} /><span className="w-2 bg-warning" style={{ height: `${Math.max(3, ((bucket.blocked / maxRuns) * 120))}px` }} /><span className="w-2 bg-muted-foreground" style={{ height: `${Math.max(3, ((bucket.running / maxRuns) * 120))}px` }} /></div><span className="max-w-full truncate text-[10px] text-muted-foreground">{bucket.label.slice(5)}</span></div>)}</div> : <p className="mt-8 text-sm text-muted-foreground">No run activity was recorded in this period.</p>}</div><div><h3 className="font-display text-sm font-semibold">Period comparison</h3><dl className="mt-3 divide-y divide-border border-y border-border text-xs"><ComparisonRow label="Runs" item={metrics.comparisons.totalRuns} /><ComparisonRow label="Finding rate" item={metrics.comparisons.findingRate} percentValue /><ComparisonRow label="Queue depth" item={metrics.comparisons.queueDepth} /><ComparisonRow label="Provider waits" item={metrics.comparisons.providerExhaustionFrequency} /><ComparisonRow label="AI cost / run" item={metrics.comparisons.aiCostPerRunUsd} currency /></dl><p className="mt-3 text-[11px] leading-5 text-muted-foreground">Provider wait counts include queued runs and reservations classified as capacity-waiting. AI costs are internal estimates.</p></div></div><div className="grid gap-5 border-t border-border p-5 xl:grid-cols-2"><section className="rounded-lg border border-border bg-surface-2/25 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-sm font-semibold">Run status distribution</h3><p className="mt-1 text-xs text-muted-foreground">Persisted terminal and active statuses in the current window.</p></div><span className="font-mono text-[11px] text-muted-foreground">{current.totalRuns} total</span></div><div className="mt-4 space-y-3">{statusEntries.length ? statusEntries.map(([status, value]) => { const normalized = status.toLowerCase(); const tone = normalized.includes("fail") ? "bg-destructive" : normalized.includes("block") ? "bg-warning" : normalized.includes("pass") || normalized.includes("complete") ? "bg-success" : normalized.includes("run") ? "bg-primary" : "bg-info"; return <div key={status}><div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="font-medium uppercase tracking-wider">{status.replaceAll("_", " ")}</span><span className="font-mono text-muted-foreground">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(4, (value / maxStatus) * 100)}%` }} /></div></div>; }) : <p className="text-sm text-muted-foreground">No status data recorded in this period.</p>}</div></section><section className="rounded-lg border border-border bg-surface-2/25 p-4"><div><h3 className="font-display text-sm font-semibold">Throughput and queue depth</h3><p className="mt-1 text-xs text-muted-foreground">Daily run volume compared with persisted queue depth.</p></div>{trend.length ? <div className="mt-4 flex min-h-[190px] items-end gap-2 border-b border-border pb-2">{trend.slice(-7).map((bucket) => <div key={bucket.bucketStart} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="flex h-32 items-end gap-1" title={`${bucket.label}: ${bucket.totalRuns} runs · queue depth ${bucket.queueDepth}`}><div className="w-3 rounded-t bg-primary" style={{ height: `${Math.max(4, (bucket.totalRuns / maxRuns) * 116)}px` }} /><div className="w-3 rounded-t bg-warning" style={{ height: `${Math.max(4, (bucket.queueDepth / Math.max(1, maxRuns)) * 116)}px` }} /></div><span className="max-w-full truncate text-[10px] text-muted-foreground">{bucket.label.slice(5)}</span></div>)}</div> : <p className="mt-8 text-sm text-muted-foreground">No trend data recorded in this period.</p>}<div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground"><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-primary" />Runs</span><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-warning" />Queue depth</span></div></section></div></section>;
}

function ComparisonRow({ label, item, percentValue, currency }: { label: string; item: { current: number; previous: number; delta: number }; percentValue?: boolean; currency?: boolean }) {
  const display = (value: number) => currency ? formatUsd(value) : percentValue ? `${(value * 100).toFixed(1)}%` : String(Math.round(value * 100) / 100);
  return <div className="flex items-center justify-between gap-3 py-2.5"><dt className="text-muted-foreground">{label}</dt><dd className="text-right"><span className="font-medium text-foreground">{display(item.current)}</span><span className="ml-2 text-[10px] text-muted-foreground">prev {display(item.previous)}</span></dd></div>;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function QueueTab({ requests, busyId, onReview }: { requests: AdminAllocationRequest[]; busyId: string | null; onReview: (request: AdminAllocationRequest, status: "APPROVED" | "DECLINED") => void }) { return <section className="mt-6 max-h-[calc(100vh-8rem)] overflow-y-auto space-y-3 pr-1">{requests.length === 0 ? <div className="surface-card p-8 text-sm text-muted-foreground">No pending allocation requests. New requests will appear here with the requester, organization, workspace, and requested Matrix Units.</div> : requests.map((request) => <article key={request.id} className="surface-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-display text-base font-semibold">{request.requestedUnits} ⟐ requested</h2><span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-warning">{request.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{request.organization.name} · {request.workspace.name} · {request.requestedBy.fullName || request.requestedBy.email}</p></div><div className="flex gap-2"><button disabled={busyId === request.id} type="button" onClick={() => onReview(request, "DECLINED")} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"><X className="h-3.5 w-3.5" /> Decline</button><button disabled={busyId === request.id} type="button" onClick={() => onReview(request, "APPROVED")} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Approve</button></div></div><p className="mt-4 border-l-2 border-primary/40 pl-3 text-sm leading-6 text-muted-foreground">{request.reason}</p><p className="mt-3 text-[11px] text-muted-foreground">Submitted {new Date(request.createdAt).toLocaleString()}</p></article>)}</section>; }

function NotificationsTab(props: { recipients: StaffNotificationRecipient[]; recipientEmail: string; recipientLabel: string; setRecipientEmail: (value: string) => void; setRecipientLabel: (value: string) => void; busyId: string | null; onSave: (event: React.FormEvent) => void; onDisable: (recipient: StaffNotificationRecipient) => void; broadcastTitle: string; broadcastMessage: string; broadcastAudience: "ALL_USERS" | "STAFF"; setBroadcastTitle: (value: string) => void; setBroadcastMessage: (value: string) => void; setBroadcastAudience: (value: "ALL_USERS" | "STAFF") => void; onBroadcast: (event: React.FormEvent) => void }) { return <div className="mt-6 grid gap-5 xl:grid-cols-2"><section className="surface-card p-5"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">Staff email recipients</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Allocation requests are also sent to every enabled address below through Resend.</p><form onSubmit={props.onSave} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input type="email" required value={props.recipientEmail} onChange={(event) => props.setRecipientEmail(event.target.value)} placeholder="staff@matrixqa.com" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><input value={props.recipientLabel} onChange={(event) => props.setRecipientLabel(event.target.value)} placeholder="Label (optional)" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><button disabled={props.busyId === "recipient"} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Send className="h-3.5 w-3.5" /> Save</button></form><div className="mt-4 max-h-64 overflow-y-auto space-y-2 pr-1">{props.recipients.map((recipient) => <div key={recipient.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"><div><div className="text-sm">{recipient.email}</div><div className="text-[11px] text-muted-foreground">{recipient.label || "Staff recipient"} · {recipient.enabled ? "Enabled" : "Disabled"}</div></div>{recipient.enabled && <button type="button" onClick={() => props.onDisable(recipient)} disabled={props.busyId === recipient.id} className="text-xs text-destructive hover:underline">Disable</button>}</div>)}</div></section><section className="surface-card p-5"><div className="flex items-center gap-2"><Radio className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">In-app broadcast</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Send an operational message to all customer accounts or Matrix QA staff.</p><form onSubmit={props.onBroadcast} className="mt-4 space-y-3"><input required minLength={3} maxLength={120} value={props.broadcastTitle} onChange={(event) => props.setBroadcastTitle(event.target.value)} placeholder="Notification title" className="w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><textarea required minLength={3} maxLength={2000} value={props.broadcastMessage} onChange={(event) => props.setBroadcastMessage(event.target.value)} placeholder="Message" className="min-h-28 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><div className="flex flex-wrap items-center justify-between gap-3"><select value={props.broadcastAudience} onChange={(event) => props.setBroadcastAudience(event.target.value as "ALL_USERS" | "STAFF")} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm"><option value="ALL_USERS">All users</option><option value="STAFF">Staff only</option></select><button disabled={props.busyId === "broadcast"} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Send className="h-3.5 w-3.5" /> Send broadcast</button></div></form></section></div>; }

function formatCreditNumber(value: number | null, unit: "requests" | "tokens" | "credits") {
  if (value === null) return "—";
  return `${new Intl.NumberFormat().format(value)} ${unit}`;
}

function formatCreditReset(resetAt: string | null, resetAfterSeconds: number | null) {
  if (resetAfterSeconds !== null) {
    if (resetAfterSeconds < 60) return `reset in ${Math.max(1, Math.round(resetAfterSeconds))}s`;
    if (resetAfterSeconds < 3600) return `reset in ${Math.max(1, Math.round(resetAfterSeconds / 60))}m`;
    if (resetAfterSeconds < 86400) return `reset in ${Math.max(1, Math.round(resetAfterSeconds / 3600))}h`;
    return `reset in ${Math.max(1, Math.round(resetAfterSeconds / 86400))}d`;
  }
  if (resetAt) return `reset ${new Date(resetAt).toLocaleString()}`;
  return "reset not exposed";
}

function ProviderCreditsPanel({ snapshot, loading, refreshing, error, onRefresh }: { snapshot: AdminProviderCreditSnapshot | null; loading: boolean; refreshing: boolean; error: string; onRefresh: () => void }) {
  const statusTone = (status: AdminProviderCreditSnapshot["rows"][number]["status"]) => status === "AVAILABLE" ? "text-success" : status === "RATE_LIMITED" || status === "ERROR" ? "text-warning" : status === "MISSING_SECRET" ? "text-destructive" : "text-muted-foreground";
  return <section className="surface-card overflow-hidden"><header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="flex items-center gap-2 font-display text-base font-semibold"><Activity className="h-4 w-4 text-primary" />Provider credit headroom</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">Staff-only live provider telemetry. Remaining and reset values appear only when the provider exposes them through a supported API or response header; observed usage is shown separately and is not treated as quota.</p></div><button type="button" onClick={onRefresh} disabled={refreshing || loading} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Refreshing…" : "Refresh credits"}</button></header>{error && <div className="border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-xs text-destructive">{error}</div>}{loading && !snapshot ? <div className="flex items-center gap-2 p-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking configured provider limits…</div> : snapshot ? <><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3 text-[11px] text-muted-foreground"><span>Last checked {new Date(snapshot.checkedAt).toLocaleString()}</span><span>Auto-refresh every {snapshot.cacheTtlSeconds}s while this console is open</span></div><div className="max-h-[34rem] overflow-y-auto divide-y divide-border pr-1">{snapshot.rows.length ? snapshot.rows.map((row) => <article key={`${row.provider}-${row.model}-${row.secretRef}`} className="px-5 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="text-sm font-semibold">{row.provider} · {row.model}</div><div className="mt-1 text-[11px] text-muted-foreground">{row.useCases.join(", ")} · secret ref {row.secretRef}{row.secretSource === "POOL" ? ` · ${row.configuredPoolKeys} pool keys` : ` · ${row.secretSource.toLowerCase()}`}</div></div><div className={`font-mono text-[10px] uppercase tracking-wider ${statusTone(row.status)}`}>{row.status.replaceAll("_", " ")}</div></div><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{row.dimensions.length ? row.dimensions.map((item) => <div key={`${item.kind}-${item.source}`} className="rounded-md border border-border/60 bg-surface-2/20 px-3 py-2"><div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-muted-foreground"><span>{item.kind.replaceAll("_", " ")}</span><span>{item.source === "PROVIDER_API" ? "provider API" : "response header"}</span></div><div className="mt-1 text-sm font-semibold">{formatCreditNumber(item.remaining, item.unit)} <span className="font-normal text-muted-foreground">/ {formatCreditNumber(item.limit, item.unit)}</span></div><div className="mt-1 text-[11px] text-muted-foreground">{item.used === null ? "Used: not reported" : `Used: ${formatCreditNumber(item.used, item.unit)}`} · {formatCreditReset(item.resetAt, item.resetAfterSeconds)}</div></div>) : <div className="rounded-md border border-border/60 bg-surface-2/20 px-3 py-2 text-xs text-muted-foreground sm:col-span-2 xl:col-span-4">{row.warning || "No provider credit dimension was exposed."}</div>}</div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground"><span>Observed last 24h: {row.observed24h.calls} calls</span><span>{row.observed24h.totalTokens.toLocaleString()} tokens</span><span>Probe {row.latencyMs}ms</span><span>{row.enabled ? "Enabled lane" : "Disabled lane"}</span></div>{row.warning && row.dimensions.length > 0 && <div className="mt-2 text-[11px] text-muted-foreground">{row.warning}</div>}</article>) : <p className="px-5 py-6 text-sm text-muted-foreground">No provider configurations or environment fallback credentials are available to inspect.</p>}</div><div className="border-t border-border px-5 py-3 text-[11px] leading-5 text-muted-foreground">{snapshot.notes.join(" ")}</div></> : <div className="p-5 text-sm text-muted-foreground">Provider credit telemetry is not available yet.</div>}</section>;
}

function TelemetryTab({ telemetry, health, runtimeHealth, exporting, onExport, providerCredits, providerCreditsLoading, providerCreditsRefreshing, providerCreditsError, onRefreshProviderCredits, matrixUnits }: { telemetry: AdminTelemetrySummary | null; health: WorkerHealth | null; runtimeHealth: BackendHealthResponse | null; exporting: boolean; onExport: () => void; providerCredits: AdminProviderCreditSnapshot | null; providerCreditsLoading: boolean; providerCreditsRefreshing: boolean; providerCreditsError: string; onRefreshProviderCredits: () => void; matrixUnits: AdminMatrixUnitSnapshot | null }) {
  const sum = telemetry?.sums || {};
  const ai = telemetry?.aiUsage;
  const aiTotals = ai?.totals;
  const directRunLedger = ai?.directRunLedger;
  const creditUsage = telemetry?.creditUsage;
  const capacity = telemetry?.providerCapacity;
  const capacityWindow = capacity?.window;
  const capacityBudget = capacity?.configuration.dailyBudget ?? 0;
  const ollamaRequests = getOllamaRequestRows(ai);
  return <div className="mt-6 space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Activity} label="Runs measured" value={String(telemetry?.totals ?? 0)} detail={`API ${runtimeHealth?.version?.public ?? telemetry?.version.public ?? "Unavailable"} · build ${runtimeHealth?.version?.build ?? telemetry?.version.build ?? "Unavailable"}`}
 /><Metric icon={Database} label="Worker time" value={`${Math.round(Number(sum.workerTimeMs || 0) / 3600000 * 10) / 10} h`} detail="Recorded terminal runs" /><Metric icon={Database} label="Artifact bytes" value={formatBytes(Number(sum.artifactBytes || 0))} detail="Evidence and video uploads" /><Metric icon={Radio} label="R2 operations" value={String(sum.r2OperationCount || 0)} detail="Put/get/delete counts" /></div>
    <div className={`surface-card flex items-start gap-3 p-5 ${health?.healthy ? "" : "border-destructive/40"}`}><div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${health?.healthy ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}><Activity className="h-4 w-4" /></div><div><h2 className="font-display text-base font-semibold">Worker health {health?.healthy ? "looks healthy" : "needs attention"}</h2><p className="mt-1 text-xs text-muted-foreground">{health?.activeRuns ?? 0} active runs · {health?.staleRuns ?? 0} stale heartbeats · last checked {health?.checkedAt ? new Date(health.checkedAt).toLocaleString() : "—"}</p></div>{!health?.healthy && <CircleAlert className="ml-auto h-5 w-5 text-destructive" />}</div>
    <ProviderCreditsPanel snapshot={providerCredits} loading={providerCreditsLoading} refreshing={providerCreditsRefreshing} error={providerCreditsError} onRefresh={onRefreshProviderCredits} />
    {matrixUnits && <section className="surface-card overflow-hidden"><header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="flex items-center gap-2 font-display text-base font-semibold"><CircleDollarSign className="h-4 w-4 text-primary" />Measured Matrix Unit accounting</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">Staff-only cost accounting. Customers do not see Matrix Units during alpha. When a run starts, Matrix QA temporarily holds the run’s maximum decision-budget amount. After the run finishes, it charges only the measured AI, runtime, and artifact usage, then immediately returns whatever was not used. For example, a 10 MU hold with 6.5 MU of measured usage returns 3.5 MU.</p></div><div className="text-right text-[11px] text-muted-foreground"><div>{matrixUnits.formulaVersion}</div><div>1 MU = ${matrixUnits.exchangeRateUsd.toFixed(2)} internal price</div></div></header><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={Database} label="Held" value={`${matrixUnits.totals.heldMu.toFixed(2)} MU`} detail="Pre-run decision-cap holds" /><Metric icon={Check} label="Charged" value={`${matrixUnits.totals.chargedMu.toFixed(2)} MU`} detail="Settled measured usage" /><Metric icon={RefreshCw} label="Refunded" value={`${matrixUnits.totals.refundedMu.toFixed(2)} MU`} detail="Unused hold returned" /><Metric icon={CircleDollarSign} label="Internal cost" value={formatUsd(matrixUnits.totals.internalCostUsd)} detail="Fixed, Neon, AI, and R2 model" /><Metric icon={Activity} label="Run rows" value={String(matrixUnits.recentRuns.length)} detail="All rows returned by the staff accounting snapshot" /></div><div className="max-h-[28rem] overflow-y-auto divide-y divide-border border-t border-border">{matrixUnits.allocations.length ? matrixUnits.allocations.map((allocation) => <article key={`${allocation.workspaceId}-${allocation.periodStart}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs"><div><div className="font-medium">Workspace {allocation.workspaceId}</div><div className="mt-1 text-[11px] text-muted-foreground">{new Date(allocation.periodStart).toLocaleDateString()} – {new Date(allocation.periodEnd).toLocaleDateString()} · {allocation.regularMu.toFixed(2)} regular + {allocation.bonusMu.toFixed(2)} bonus MU</div></div><div className="text-right"><div className="font-mono">{allocation.availableMu.toFixed(2)} available · {allocation.reservedMu.toFixed(2)} held</div><div className="text-[11px] text-muted-foreground">{allocation.settledMu.toFixed(2)} settled</div></div></article>) : <p className="px-5 py-5 text-xs text-muted-foreground">No workspace allocations exist yet.</p>}</div><div className="max-h-[28rem] overflow-y-auto divide-y divide-border border-t border-border">{matrixUnits.recentRuns.length ? matrixUnits.recentRuns.map((run) => <article key={run.runId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs"><div><div className="font-medium">{run.mode} · {run.status} · {run.measurementStatus}</div><div className="mt-1 font-mono text-[10px] text-muted-foreground">Run {run.runId} · {run.actualDecisionCount} decisions · {run.extensionCount} extensions · {run.aiCalls} AI calls · {run.aiTotalTokens.toLocaleString()} tokens</div></div><div className="text-right"><div className="font-mono">{run.chargedMu.toFixed(2)} MU charged · {run.refundedMu.toFixed(2)} MU refunded</div><div className="text-[11px] text-muted-foreground">{formatUsd(run.internalCostUsd)} internal cost · {formatUsd(run.aiTotalCostUsd)} total AI cost · {(run.providersUsed || []).join(", ") || "no provider rows"} · {new Date(run.createdAt).toLocaleString()}</div></div></article>) : <p className="px-5 py-5 text-xs text-muted-foreground">No Matrix Unit run accounting rows exist yet.</p>}</div></section>}
    <section className="surface-card overflow-hidden"><header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="flex items-center gap-2 font-display text-base font-semibold"><BrainCircuit className="h-4 w-4 text-primary" />AI usage and cost</h2><p className="mt-1 text-xs text-muted-foreground">Estimated provider spend from sanitized AI calls. USD is an internal cost estimate; Matrix Units are the customer-facing usage surcharge and are tracked separately.</p></div><button type="button" onClick={onExport} disabled={exporting} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/30 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"><Download className="h-3.5 w-3.5" />{exporting ? "Exporting…" : "Export complete audit"}</button></header><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={BrainCircuit} label="AI calls" value={String(aiTotals?.events ?? 0)} detail={`${aiTotals?.degradedEvents ?? 0} degraded`} /><Metric icon={Database} label="AI tokens" value={String(aiTotals?.totalTokens ?? 0)} detail={`${aiTotals?.averageLatencyMs ?? 0} ms average`} /><Metric icon={CircleDollarSign} label="Estimated USD" value={formatUsd(aiTotals?.estimatedCostUsd ?? 0)} detail="Provider model estimate" /><Metric icon={CircleDollarSign} label="AI Matrix Units" value={`${aiTotals?.billableMatrixUnits ?? 0} ⟐`} detail="Successful enrichment surcharge" /><Metric icon={Activity} label="AI success" value={aiTotals?.events ? `${Math.round(((aiTotals.events - aiTotals.degradedEvents) / aiTotals.events) * 100)}%` : "—"} detail="Non-degraded calls" /></div>{directRunLedger && <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-3"><Metric icon={CircleDollarSign} label="Measured run AI cost" value={formatUsd(directRunLedger.totals.estimatedCostUsd)} detail={`${directRunLedger.totals.calls} calls · ${directRunLedger.measuredRuns} measured runs`} /><Metric icon={BrainCircuit} label="Measured run calls" value={String(directRunLedger.totals.calls)} detail={`${directRunLedger.totals.inputTokens + directRunLedger.totals.outputTokens} input/output tokens`} /><Metric icon={CircleAlert} label="Ledger coverage" value={`${directRunLedger.measuredRuns}/${directRunLedger.measuredRuns + directRunLedger.unmeasuredRuns}`} detail={`${directRunLedger.unmeasuredRuns} legacy or unmeasured runs`} /></div>}{ai && <div className="grid gap-5 border-t border-border p-5 xl:grid-cols-2"><div><h3 className="font-display text-sm font-semibold">Provider/model breakdown</h3><div className="mt-3 max-h-[24rem] overflow-y-auto divide-y divide-border border-y border-border">{ai.providers.length ? ai.providers.map((provider) => <div key={`${provider.provider}-${provider.model}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div><div className="font-medium">{provider.provider} · {provider.model}</div><div className="text-muted-foreground">{provider.events} calls · {provider.totalTokens} tokens · {provider.degradedEvents} degraded</div></div><div className="text-right"><div className="font-mono">{formatUsd(provider.estimatedCostUsd)}</div><div className="text-muted-foreground">{provider.billableMatrixUnits} ⟐</div></div></div>) : <p className="py-4 text-xs text-muted-foreground">No AI calls recorded yet.</p>}</div></div><div><h3 className="font-display text-sm font-semibold">Provider chain activity</h3><div className="mt-3 max-h-[24rem] overflow-y-auto divide-y divide-border border-y border-border">{ai.providerChain?.length ? ai.providerChain.map((item) => <div key={`${item.useCase}-${item.chainPosition}-${item.provider}-${item.model}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div><div className="font-medium">{item.useCase} · {item.chainPosition === 1 ? "Primary" : `Fallback ${item.chainPosition - 1}`} · {item.provider}</div><div className="text-muted-foreground">{item.model} · {item.attempts} attempts · {item.successes} successful · {item.degradedAttempts} degraded</div></div><div className="text-right"><div className="font-mono">{formatUsd(item.estimatedCostUsd)}</div><div className="text-muted-foreground">{item.billableMatrixUnits} ⟐</div></div></div>) : <p className="py-4 text-xs text-muted-foreground">No provider-chain attempts recorded yet.</p>}</div></div><div><h3 className="font-display text-sm font-semibold">Use-case breakdown</h3><div className="mt-3 max-h-[24rem] overflow-y-auto divide-y divide-border border-y border-border">{ai.useCases.length ? ai.useCases.map((item) => <div key={item.useCase} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div><div className="font-medium">{item.useCase}</div><div className="text-muted-foreground">{item.events} calls · {item.totalTokens} tokens · {item.degradedEvents} degraded</div></div><div className="text-right"><div className="font-mono">{formatUsd(item.estimatedCostUsd)}</div><div className="text-muted-foreground">{item.billableMatrixUnits} ⟐</div></div></div>) : <p className="py-4 text-xs text-muted-foreground">No use-case AI usage recorded yet.</p>}</div></div><div><h3 className="font-display text-sm font-semibold">Organization breakdown</h3><div className="mt-3 max-h-[24rem] overflow-y-auto divide-y divide-border border-y border-border">{ai.organizations.length ? ai.organizations.map((organization) => <div key={organization.organizationId} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div><div className="font-medium">{organization.organizationName}</div><div className="text-muted-foreground">{organization.events} calls · {organization.totalTokens} tokens · {organization.degradedEvents} degraded</div></div><div className="text-right"><div className="font-mono">{formatUsd(organization.estimatedCostUsd)}</div><div className="text-muted-foreground">{organization.billableMatrixUnits} ⟐</div></div></div>) : <p className="py-4 text-xs text-muted-foreground">No organization AI usage recorded yet.</p>}</div></div></div>}</section>
    {ai && <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="flex items-center gap-2 font-display text-base font-semibold"><CircleAlert className="h-4 w-4 text-warning" />Recent provider failure diagnostics</h2><p className="mt-1 text-xs text-muted-foreground">Staff-only, redacted excerpts retained from structured-output failures. Secrets, credentials, URLs with query strings, and email addresses are sanitized before they reach this view.</p></header><div className="p-5">{ai.providerDiagnostics?.length ? <div className="max-h-[28rem] overflow-y-auto divide-y divide-border border-y border-border">{ai.providerDiagnostics.map((diagnostic) => <article key={`${diagnostic.usageEventId}-${diagnostic.capturedAt}`} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-medium text-sm">{diagnostic.provider} · {diagnostic.model}</div><div className="mt-1 text-[11px] text-muted-foreground">{diagnostic.useCase} · {diagnostic.chainPosition === 1 ? "Primary" : `Fallback ${diagnostic.chainPosition - 1}`} · {diagnostic.kind} · {diagnostic.schemaName}</div></div><div className="text-right text-[11px] text-muted-foreground">{new Date(diagnostic.capturedAt).toLocaleString()}{diagnostic.runId ? <div className="mt-1 font-mono">Run {diagnostic.runId}</div> : null}</div></div><p className="mt-3 text-xs leading-5"><span className="font-medium text-warning">Validation:</span> {diagnostic.validationError}</p><pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-surface-2/30 p-3 font-mono text-[11px] leading-5 text-muted-foreground">{diagnostic.responseExcerpt}</pre></article>)}</div> : <p className="text-xs text-muted-foreground">No retained structured-output diagnostics are available.</p>}</div></section>}
        {ai && <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">Recent Ollama request shape</h2><p className="mt-1 text-xs text-muted-foreground">Staff-only request evidence. Credential values and prompt text are never rendered; this shows the exact endpoint, header structure, secret reference provenance, and non-sensitive body controls used by the backend.</p></header><div className="p-5">{ollamaRequests.length ? <div className="max-h-[28rem] overflow-y-auto divide-y divide-border border-y border-border">{ollamaRequests.map(({ row, request }, index) => <article key={`${row.id}-${index}`} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-medium text-sm">{request.method} {request.endpoint}</div><div className="mt-1 text-[11px] text-muted-foreground">{row.useCase || "Unknown use case"} · {request.authorization.keyReference} · {request.authorization.keySource}{request.authorization.keySource === "MANAGED" ? ` v${request.authorization.keyVersion}` : ""}</div></div><div className="text-right text-[11px] text-muted-foreground">{new Date(row.createdAt).toLocaleString()}{row.runId ? <div className="mt-1 font-mono">Run {row.runId}</div> : null}</div></div><div className="mt-3 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2"><div><span className="font-medium text-foreground">Authorization:</span> <code>{request.headers.authorization}</code></div><div><span className="font-medium text-foreground">Key shape:</span> {request.authorization.keyLength} chars · outer whitespace normalized {request.authorization.trimmedOuterWhitespace ? "yes" : "no"} · internal whitespace {request.authorization.containsInternalWhitespace ? "yes" : "no"}</div><div className="sm:col-span-2"><span className="font-medium text-foreground">Body keys:</span> <code>{request.body?.keys.join(", ") || "none"}</code></div><div className="sm:col-span-2"><span className="font-medium text-foreground">Control values:</span> {formatOllamaControlFields(request) || "No scalar controls recorded"}</div></div></article>)}</div> : <p className="text-xs text-muted-foreground">No captured Ollama request-shape records are available yet. The next real Ollama provider call will add one here.</p>}</div></section>}
    <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">Credit and infrastructure reconciliation</h2>
<p className="mt-1 text-xs text-muted-foreground">This is the platform-wide ledger view; client Matrix Units remain separate from internal provider invoices and infrastructure cost.</p></header><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={CircleDollarSign} label="Reserved (outstanding)" value={`${creditUsage?.reservedUnits ?? 0} ⟐`} detail={`${creditUsage?.grossReservedUnits ?? creditUsage?.reservedUnits ?? 0} gross · ${creditUsage?.reservedInternalCredits ?? 0} internal`} /><Metric icon={Check} label="Settled" value={`${creditUsage?.settledUnits ?? 0} ⟐`} detail={`${creditUsage?.settledInternalCredits ?? 0} internal`} /><Metric icon={RefreshCw} label="Refunded" value={`${creditUsage?.refundedUnits ?? 0} ⟐`} detail={`${creditUsage?.refundedInternalCredits ?? 0} internal`} /><Metric icon={Activity} label="Video time" value={`${Math.round(Number(sum.videoTimeMs || 0) / 60000)} min`} detail="FFmpeg/video boundary" /><Metric icon={Mail} label="Email volume" value={String(sum.emailCount || 0)} detail="Per-run counter" /></div><div className="grid gap-4 border-t border-border p-5 sm:grid-cols-2"><Metric icon={Database} label="R2 puts" value={String(sum.r2PutCount || 0)} detail="Artifact uploads" /><Metric icon={Database} label="R2 gets" value={String(sum.r2GetCount || 0)} detail="Signed/read operations" /></div></section>
    {capacity && <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">Provider capacity window</h2><p className="mt-1 text-xs text-muted-foreground">Internal staff telemetry for the configured free-first provider. Clients see only Matrix Units and queue/reset messaging.</p></header><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={Activity} label="Provider" value={capacity.configuration.provider} detail="Current capacity source" /><Metric icon={Database} label="Daily budget" value={String(capacityBudget)} detail={`${capacity.configuration.organizationSlots} logical slots`} /><Metric icon={ShieldCheck} label="Protected reserve" value={String(capacity.configuration.protectedReserve)} detail={`${capacity.configuration.alphaOrganizations} alpha organizations`} /><Metric icon={Activity} label="Reserved" value={String(capacityWindow?.reservedUnits ?? 0)} detail={`${Math.round((capacityWindow?.reservedUnits ?? 0) / Math.max(1, capacityBudget) * 100)}% of budget`} /><Metric icon={Check} label="Consumed / released" value={`${capacityWindow?.consumedUnits ?? 0} / ${capacityWindow?.releasedUnits ?? 0}`} detail="Settled provider units" /></div><div className="border-t border-border p-5"><h3 className="font-display text-sm font-semibold">Reservation status</h3><div className="mt-3 grid gap-2 sm:grid-cols-3">{Object.entries(capacity.reservationsByStatus).map(([status, item]) => <div key={status} className="rounded-md border border-border/60 p-3 text-xs"><div className="font-medium uppercase tracking-wider">{status}</div><div className="mt-1 text-muted-foreground">{item.reservations} reservations · {item.estimatedUnits} estimated units · {item.actualUnits} actual units</div></div>)}{Object.keys(capacity.reservationsByStatus).length === 0 && <p className="text-xs text-muted-foreground">No provider reservations in the current UTC window.</p>}</div></div></section>}
  </div>;
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string; detail: string }) { return <div className="surface-card p-4"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div><div className="mt-2 font-display text-2xl font-semibold">{value}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></div>; }
function formatBytes(bytes: number) { if (!bytes) return "0 B"; const units = ["B", "KB", "MB", "GB"]; const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024))); return `${Math.round(bytes / Math.pow(1024, index) * 10) / 10} ${units[index]}`; }
function formatUsd(value: number) { return `$${Number(value || 0).toFixed(8)}`; }
