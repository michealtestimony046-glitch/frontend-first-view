import React, { useState } from "react";
import { KeyRound, Loader2, RotateCw, Trash2 } from "lucide-react";
import { adminApi, type ManagedSecretMetadata, type StaffRole } from "@/lib/api-client";

interface Props {
  secrets: ManagedSecretMetadata[];
  role?: StaffRole | null;
  busyId: string | null;
  onSaved: (secret: ManagedSecretMetadata) => void;
  onDeleted: (name: string) => void;
  setMessage: (message: string) => void;
  setError: (message: string) => void;
}

const validName = /^[A-Z][A-Z0-9_]{1,127}$/;

export function AdminSecretsTab({ secrets, role, busyId, onSaved, onDeleted, setMessage, setError }: Props) {
  const canManage = role === "OWNER" || role === "OPERATIONS_ADMIN";
  const canDelete = role === "OWNER";
  const [name, setName] = React.useState("");
  const [value, setValue] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [showValue, setShowValue] = useState(false);
  const [localBusy, setLocalBusy] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = name.trim().toUpperCase();
    if (!validName.test(normalized)) {
      setError("Secret name must match ^[A-Z][A-Z0-9_]{1,127}$.");
      return;
    }
    if (!value) {
      setError("Enter a secret value. It will not be shown again after saving.");
      return;
    }
    setError(""); setMessage(""); setLocalBusy("secret");
    try {
      const saved = await adminApi.saveManagedSecret({ name: normalized, value, description: description.trim() || undefined });
      onSaved(saved);
      setName(""); setValue(""); setDescription(""); setShowValue(false);
      setMessage(`${normalized} saved. The value is encrypted and will not be returned.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save secret.");
    } finally {
      setLocalBusy(null);
    }
  };

  const rotate = (secret: ManagedSecretMetadata) => {
    setName(secret.name);
    setDescription(secret.description || "");
    setValue("");
    setShowValue(false);
    setMessage(`Enter a new value to rotate ${secret.name}.`);
    setError("");
  };

  const remove = async (secret: ManagedSecretMetadata) => {
    if (!canDelete || !window.confirm(`Delete ${secret.name}? Any AI configuration using it will stop resolving after deletion.`)) return;
    setError(""); setMessage(""); setLocalBusy(`delete-${secret.name}`);
    try {
      await adminApi.deleteManagedSecret(secret.name);
      onDeleted(secret.name);
      setMessage(`${secret.name} deleted.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete secret.");
    } finally {
      setLocalBusy(null);
    }
  };

  if (!canManage) return <div className="mt-6 surface-card p-6 text-sm text-muted-foreground">Secrets are restricted to owners and operations administrators.</div>;

  return <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
    <section className="surface-card p-5">
      <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">Add or rotate a secret</h2></div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">Values are encrypted before storage. Matrix QA returns only the exact reference name and health metadata, never the secret value.</p>
      <form onSubmit={(event) => { void save(event); }} className="mt-5 grid gap-3">
        <label className="grid gap-1 text-xs text-muted-foreground">Reference name<input name="managedSecretName" autoComplete="off" required pattern="[A-Z][A-Z0-9_]{1,127}" value={name} onChange={(event) => setName(event.target.value.toUpperCase())} placeholder="ZAI_API_KEY" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /><span className="text-[11px]">Use this exact name in the AI Models configuration.</span></label>
        <label className="grid gap-1 text-xs text-muted-foreground">Secret value<input name="managedSecretValue" autoComplete="new-password" required type={showValue ? "text" : "password"} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Paste the provider key once" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={showValue} onChange={(event) => setShowValue(event.target.checked)} /> Show value while entering</label>
        <label className="grid gap-1 text-xs text-muted-foreground">Description <span className="font-normal">(optional)</span><input name="managedSecretDescription" autoComplete="off" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Z.ai direct API key" maxLength={500} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label>
        <button disabled={localBusy === "secret" || Boolean(busyId)} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{localBusy === "secret" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />} Save encrypted secret</button>
      </form>
      <div className="mt-5 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs leading-5 text-warning">The vault uses the server encryption key. Keep the deployment encryption key backed up; without it, encrypted values cannot be recovered.</div>
    </section>
    <section className="surface-card overflow-hidden">
      <header className="border-b border-border px-5 py-4"><h2 className="font-display text-base font-semibold">Managed secret references</h2><p className="mt-1 text-xs text-muted-foreground">Only names, versions, source, and health metadata are shown.</p></header>
      <div className="divide-y divide-border">{secrets.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No Matrix QA-managed secrets yet. Deployment environment references remain available as fallback.</p> : secrets.map((secret) => <article key={secret.id} className="px-5 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-mono text-sm font-medium">{secret.name}</div><div className="mt-1 text-xs text-muted-foreground">v{secret.version} · {secret.source === "MANAGED" ? "Encrypted vault" : secret.source} · updated {new Date(secret.updatedAt).toLocaleString()}</div>{secret.description && <p className="mt-1 text-xs text-muted-foreground">{secret.description}</p>}</div><div className="flex gap-2"><button type="button" onClick={() => rotate(secret)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-accent"><RotateCw className="h-3.5 w-3.5" /> Rotate</button>{canDelete && <button type="button" onClick={() => { void remove(secret); }} disabled={localBusy === `delete-${secret.name}` || Boolean(busyId)} className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>}</div></div><div className="mt-3 text-[11px] text-muted-foreground">Health: {secret.lastHealthStatus || "Not checked"}{secret.lastHealthError ? ` · ${secret.lastHealthError}` : ""}{secret.lastUsedAt ? ` · last used ${new Date(secret.lastUsedAt).toLocaleString()}` : ""}</div></article>)}</div>
    </section>
  </div>;
}

