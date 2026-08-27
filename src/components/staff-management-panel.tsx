import { useMemo, useState } from "react";
import { Check, Clock3, Copy, MailPlus, RefreshCw, Shield, UserMinus, UserPlus, X } from "lucide-react";
import { adminApi, type StaffAuditEvent, type StaffInvitation, type StaffManagementData, type StaffMembership, type StaffRole } from "@/lib/api-client";

type Props = {
  data: StaffManagementData;
  role?: StaffRole | null;
  onChanged: () => Promise<void>;
  setMessage: (message: string) => void;
  setError: (message: string) => void;
};

const roleLabels: Record<StaffRole, string> = {
  OWNER: "Owner",
  OPERATIONS_ADMIN: "Operations admin",
  OPERATOR: "Operator",
  VIEWER: "Viewer",
};

const roleDescriptions: Record<StaffRole, string> = {
  OWNER: "Full staff management and operations control.",
  OPERATIONS_ADMIN: "Requests, notifications, telemetry, and recipients.",
  OPERATOR: "Allocation requests and operational notifications.",
  VIEWER: "Read-only telemetry, health, and request history.",
};

export function StaffManagementPanel({ data, role, onChanged, setMessage, setError }: Props) {
  const canManage = role === "OWNER" || role === "OPERATIONS_ADMIN";
  const canOwnerManage = role === "OWNER";
  const [emails, setEmails] = useState("");
  const [proposedName, setProposedName] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("VIEWER");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  const activeStaff = useMemo(() => data.staff.filter((item) => item.status === "ACTIVE"), [data.staff]);
  const pendingInvites = useMemo(() => data.invitations.filter((item) => item.status === "PENDING"), [data.invitations]);
  const expiringSoon = useMemo(() => pendingInvites.filter((item) => new Date(item.expiresAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000), [pendingInvites]);

  const run = async (id: string, action: () => Promise<void>, success: string) => {
    setBusy(id); setError(""); setMessage("");
    try { await action(); setMessage(success); await onChanged(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to complete staff action."); }
    finally { setBusy(null); }
  };

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedEmails = emails.split(/[\n,;]+/).map((email) => email.trim()).filter(Boolean);
    if (parsedEmails.length === 0) { setError("Enter at least one work email address."); return; }
    await run("invite", async () => {
      const result = await adminApi.inviteStaff({ emails: parsedEmails, proposedName: proposedName.trim() || undefined, role: inviteRole, internalNote: note.trim() || undefined });
      const sent = result.results.filter((item) => item.status === "sent" || item.status === "resent").length;
      const skipped = result.results.length - sent;
      setMessage(`${sent} invitation${sent === 1 ? "" : "s"} sent${skipped ? `; ${skipped} skipped` : ""}.`);
      setEmails(""); setProposedName(""); setNote("");
    }, "Invitations processed.");
  };

  const changeRole = (member: StaffMembership, nextRole: StaffRole) => run(`role-${member.userId}`, async () => { await adminApi.changeStaffRole(member.userId, nextRole); }, `${member.user.fullName || member.user.email} is now ${roleLabels[nextRole]}.`);
  const toggleMember = (member: StaffMembership) => run(`toggle-${member.userId}`, async () => { if (member.status === "ACTIVE") await adminApi.disableStaff(member.userId); else await adminApi.enableStaff(member.userId); }, member.status === "ACTIVE" ? "Staff access disabled and sessions revoked." : "Staff access re-enabled.");
  const revokeSessions = (member: StaffMembership) => run(`sessions-${member.userId}`, async () => { await adminApi.revokeStaffSessions(member.userId); }, "All sessions for that staff member were revoked.");

  return <div className="mt-6 space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Summary label="Active staff" value={String(activeStaff.length)} detail="Can enter /admin" icon={<Shield className="h-4 w-4" />} />
      <Summary label="Pending invitations" value={String(pendingInvites.length)} detail="Awaiting acceptance" icon={<Clock3 className="h-4 w-4" />} />
      <Summary label="Expiring soon" value={String(expiringSoon.length)} detail="Within three days" icon={<Clock3 className="h-4 w-4" />} />
      <Summary label="Disabled" value={String(data.staff.filter((item) => item.status === "DISABLED").length)} detail="Retained for audit" icon={<UserMinus className="h-4 w-4" />} />
    </div>

    {canManage && <section className="surface-card p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><MailPlus className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">Add staff</h2></div><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Invite one or many work emails. Each recipient accepts through a single-use link and chooses their own password. No password is sent to you.</p></div><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-wider text-primary">72-hour link</span></div><form onSubmit={invite} className="mt-4 grid gap-3"><textarea required value={emails} onChange={(event) => setEmails(event.target.value)} placeholder="jane@company.com\noperator@company.com" className="min-h-24 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><div className="grid gap-3 md:grid-cols-3"><input value={proposedName} onChange={(event) => setProposedName(event.target.value)} placeholder="Suggested name (optional)" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /><select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as StaffRole)} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm">{(Object.keys(roleLabels) as StaffRole[]).filter((item) => canOwnerManage || item !== "OWNER").map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Internal note (optional)" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm" /></div><div className="flex items-center justify-between gap-3"><p className="text-[11px] text-muted-foreground">Role: {roleLabels[inviteRole]} — {roleDescriptions[inviteRole]}</p><button disabled={busy === "invite"} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><UserPlus className="h-3.5 w-3.5" /> Send invitations</button></div></form></section>}

    <section className="surface-card overflow-hidden"><header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="font-display text-base font-semibold">Active and disabled staff</h2><p className="mt-1 text-xs text-muted-foreground">Staff access is separate from operational email recipients.</p></div><span className="text-xs text-muted-foreground">{data.staff.length} records</span></header><div className="max-h-[34rem] overflow-y-auto divide-y divide-border pr-1">{data.staff.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No staff memberships yet.</p> : data.staff.map((member) => <div key={member.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div className="flex min-w-0 items-center gap-3">{member.user.avatarUrl ? <img src={member.user.avatarUrl} alt={`${member.user.fullName || member.user.email} avatar`} className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{(member.user.fullName || member.user.email).slice(0, 1).toUpperCase()}</div>}<div className="min-w-0"><div className="truncate text-sm font-medium">{member.user.fullName || "Unnamed staff"}</div><div className="truncate text-xs text-muted-foreground">{member.user.email} · {member.status === "ACTIVE" ? "Active" : "Disabled"}</div></div></div><div className="flex flex-wrap items-center gap-2"><select disabled={!canOwnerManage || busy === `role-${member.userId}`} value={member.role} onChange={(event) => void changeRole(member, event.target.value as StaffRole)} className="rounded-md border border-border bg-surface-2/40 px-2 py-1.5 text-xs">{(Object.keys(roleLabels) as StaffRole[]).map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select>{canOwnerManage && <><button type="button" disabled={busy === `toggle-${member.userId}`} onClick={() => void toggleMember(member)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-accent">{member.status === "ACTIVE" ? <><UserMinus className="h-3.5 w-3.5" /> Disable</> : <><Check className="h-3.5 w-3.5" /> Enable</>}</button><button type="button" disabled={busy === `sessions-${member.userId}`} onClick={() => void revokeSessions(member)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-accent"><RefreshCw className="h-3.5 w-3.5" /> Revoke sessions</button></>}</div></div>)}</div></section>

    <section className="surface-card overflow-hidden"><header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">Pending invitations</h2><p className="mt-1 text-xs text-muted-foreground">Resending invalidates the previous link and creates a fresh 72-hour window.</p></header><div className="max-h-[28rem] overflow-y-auto divide-y divide-border pr-1">{pendingInvites.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No pending invitations.</p> : pendingInvites.map((invitation) => <InvitationRow key={invitation.id} invitation={invitation} busy={busy} onResend={() => void run(`resend-${invitation.id}`, async () => { await adminApi.resendStaffInvitation(invitation.id); }, "Invitation resent.")} onRevoke={() => void run(`revoke-${invitation.id}`, async () => { await adminApi.revokeStaffInvitation(invitation.id); }, "Invitation revoked.")} />)}</div></section>

    <section className="surface-card overflow-hidden"><button type="button" onClick={() => setShowAudit((value) => !value)} className="flex w-full items-center justify-between px-5 py-4 text-left"><div><h2 className="font-display text-base font-semibold">Access audit history</h2><p className="mt-1 text-xs text-muted-foreground">Invites, accepts, declines, role changes, disables, and session revocations.</p></div><span className="text-xs text-primary">{showAudit ? "Hide" : `Show ${data.audit.length}`}</span></button>{showAudit && <div className="max-h-[34rem] overflow-y-auto divide-y divide-border border-t border-border pr-1">{data.audit.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No audit events yet.</p> : data.audit.map((event) => <AuditRow key={event.id} event={event} />)}</div>}</section>
  </div>;
}

function InvitationRow({ invitation, busy, onResend, onRevoke }: { invitation: StaffInvitation; busy: string | null; onResend: () => void; onRevoke: () => void }) { return <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><div className="text-sm font-medium">{invitation.email}</div><div className="text-xs text-muted-foreground">{roleLabels[invitation.role]} · expires {new Date(invitation.expiresAt).toLocaleString()}</div></div><div className="flex items-center gap-2"><button type="button" disabled={busy === `resend-${invitation.id}`} onClick={onResend} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-accent"><RefreshCw className="h-3.5 w-3.5" /> Resend</button><button type="button" disabled={busy === `revoke-${invitation.id}`} onClick={onRevoke} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"><X className="h-3.5 w-3.5" /> Revoke</button></div></div>; }
function AuditRow({ event }: { event: StaffAuditEvent }) { return <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"><div><div className="text-xs font-medium">{event.eventType.replaceAll("_", " ")}</div><div className="text-[11px] text-muted-foreground">{event.targetUser?.fullName || event.targetUser?.email || "Invitation"} · by {event.actor?.fullName || event.actor?.email || "system"}</div></div><time className="text-[11px] text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</time></div>; }
function Summary({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) { return <div className="surface-card p-4"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div><div className="mt-2 font-display text-2xl font-semibold">{value}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></div>; }
