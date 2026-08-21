import React, { useState } from "react";
import { FileJson, KeyRound, Loader2, RotateCw, Trash2, Upload } from "lucide-react";
import { adminApi, type ManagedSecretImportResult, type ManagedSecretMetadata, type StaffRole } from "@/lib/api-client";

interface Props {
  secrets: ManagedSecretMetadata[];
  role?: StaffRole | null;
  busyId: string | null;
  onSaved: (secret: ManagedSecretMetadata) => void;
  onDeleted: (name: string) => void;
  setMessage: (message: string) => void;
  setError: (message: string) => void;
}

type ImportSource = "JSON" | "ENV";
type SecretEntry = { name: string; value: string; description?: string };
type ImportIssue = { name: string; message: string };
type ImportPreview = { entries: SecretEntry[]; errors: ImportIssue[] };

const validName = /^[A-Z][A-Z0-9_]{1,127}$/;
const ollamaKeyPattern = /^OLLAMA_API_KEY_(\d+)$/;
const ollamaPoolDisplayLimit = 80;

function ollamaOrdinal(name: string): number | null {
  const match = ollamaKeyPattern.exec(name.trim().toUpperCase());
  if (!match) return null;
  const ordinal = Number(match[1]);
  return Number.isSafeInteger(ordinal) && ordinal > 0 ? ordinal : null;
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEntry(name: string, value: unknown, description?: unknown): SecretEntry | ImportIssue {
  const normalized = name.trim().toUpperCase();
  if (!validName.test(normalized)) return { name: name.trim() || "(unnamed)", message: "Name must match ^[A-Z][A-Z0-9_]{1,127}$." };
  if (typeof value !== "string" || !value) return { name: normalized, message: "Value is missing or empty." };
  if (value.length > 10000) return { name: normalized, message: "Value is longer than the 10,000-character limit." };
  if (description !== undefined && typeof description !== "string") return { name: normalized, message: "Description must be text." };
  if (typeof description === "string" && description.length > 500) return { name: normalized, message: "Description is longer than the 500-character limit." };
  return { name: normalized, value, description: typeof description === "string" ? description.trim() || undefined : undefined };
}

function keepFirst(entries: Array<SecretEntry | ImportIssue>): ImportPreview {
  const validEntries: SecretEntry[] = [];
  const errors: ImportIssue[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    if ("message" in entry) {
      errors.push(entry);
      continue;
    }
    if (seen.has(entry.name)) {
      errors.push({ name: entry.name, message: "Duplicate name; the first occurrence was kept." });
      continue;
    }
    seen.add(entry.name);
    validEntries.push(entry);
  }
  return { entries: validEntries, errors };
}

function parseJson(raw: string): ImportPreview {
  const parsed: unknown = JSON.parse(raw);
  const root = isRecord(parsed) && "secrets" in parsed ? parsed.secrets : parsed;
  const candidates: Array<SecretEntry | ImportIssue> = [];
  if (Array.isArray(root)) {
    root.forEach((item, index) => {
      if (!isRecord(item) || typeof item.name !== "string") {
        candidates.push({ name: `item ${index + 1}`, message: "Array entries must include a string name." });
        return;
      }
      candidates.push(normalizeEntry(item.name, item.value, item.description));
    });
  } else if (isRecord(root)) {
    Object.entries(root).forEach(([name, item]) => {
      if (isRecord(item) && "value" in item) candidates.push(normalizeEntry(name, item.value, item.description));
      else candidates.push(normalizeEntry(name, item));
    });
  } else {
    throw new Error("JSON must be an object map, an array of { name, value } entries, or an object with a secrets property.");
  }
  return keepFirst(candidates);
}

function unquoteEnvValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
    const inner = trimmed.slice(1, -1);
    return trimmed.startsWith('"') ? inner.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\") : inner;
  }
  return trimmed;
}

function parseEnv(raw: string): ImportPreview {
  const candidates: Array<SecretEntry | ImportIssue> = [];
  raw.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const withoutExport = trimmed.startsWith("export ") ? trimmed.slice(7).trimStart() : trimmed;
    const separator = withoutExport.indexOf("=");
    if (separator <= 0) {
      candidates.push({ name: `line ${index + 1}`, message: "Expected KEY=value." });
      return;
    }
    const name = withoutExport.slice(0, separator).trim();
    const value = unquoteEnvValue(withoutExport.slice(separator + 1));
    candidates.push(normalizeEntry(name, value));
  });
  return keepFirst(candidates);
}

function parseImport(raw: string, source: ImportSource): ImportPreview {
  return source === "JSON" ? parseJson(raw) : parseEnv(raw);
}

function ImportPreviewBox({ preview, busy, disabled, onImport }: { preview: ImportPreview; busy: boolean; disabled: boolean; onImport: () => void }) {
  if (preview.entries.length === 0 && preview.errors.length === 0) return null;
  return <div className="mt-3 rounded-md border border-border/60 p-3">
    {preview.entries.length > 0 && <><div className="text-xs font-semibold">Ready to import</div><div className="mt-2 grid gap-1 sm:grid-cols-2">{preview.entries.map((entry) => <div key={entry.name} className="font-mono text-[11px] text-muted-foreground">{entry.name} <span className="font-sans text-success">· value present</span></div>)}</div><button type="button" onClick={onImport} disabled={busy || disabled} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Import {preview.entries.length} secret{preview.entries.length === 1 ? "" : "s"}</button></>}
    {preview.errors.length > 0 && <div className={`${preview.entries.length > 0 ? "mt-3 " : ""}rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning`}><div className="font-semibold">Not imported</div>{preview.errors.map((issue, index) => <div key={`${issue.name}-${index}`} className="mt-1">{issue.name}: {issue.message}</div>)}</div>}
  </div>;
}

export function AdminSecretsTab({ secrets, role, busyId, onSaved, onDeleted, setMessage, setError }: Props) {
  const canManage = role === "OWNER" || role === "OPERATIONS_ADMIN";
  const canDelete = role === "OWNER";
  const [name, setName] = React.useState("");
  const [value, setValue] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [showValue, setShowValue] = useState(false);
  const [localBusy, setLocalBusy] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonPreview, setJsonPreview] = useState<ImportPreview>({ entries: [], errors: [] });
  const [envFileName, setEnvFileName] = useState("");
  const [envPreview, setEnvPreview] = useState<ImportPreview>({ entries: [], errors: [] });

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

  const previewJson = () => {
    setError(""); setMessage("");
    if (!jsonText.trim()) {
      setJsonPreview({ entries: [], errors: [{ name: "JSON", message: "Paste a JSON object or array first." }] });
      setError("Paste a JSON object or array first.");
      return;
    }
    try {
      const parsed = parseImport(jsonText, "JSON");
      setJsonPreview(parsed);
      setMessage(`${parsed.entries.length} secret${parsed.entries.length === 1 ? "" : "s"} ready to import from pasted JSON. Values remain masked.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to parse JSON.";
      setJsonPreview({ entries: [], errors: [{ name: "JSON", message }] });
      setError(message);
    }
  };

  const handleEnvFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setMessage(""); setLocalBusy("parse");
    try {
      const parsed = parseImport(await file.text(), "ENV");
      setEnvFileName(file.name);
      setEnvPreview(parsed);
      setMessage(`${parsed.entries.length} secret${parsed.entries.length === 1 ? "" : "s"} ready to import from ${file.name}. Values remain masked.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to parse .env file.";
      setEnvFileName(file.name);
      setEnvPreview({ entries: [], errors: [{ name: file.name, message }] });
      setError(message);
    } finally {
      setLocalBusy(null);
    }
  };

  const importSecrets = async (source: ImportSource, currentPreview: ImportPreview, onComplete: () => void) => {
    if (currentPreview.entries.length === 0) return;
    setError(""); setMessage(""); setLocalBusy(`${source.toLowerCase()}-import`);
    try {
      const result: ManagedSecretImportResult = await adminApi.importManagedSecrets({ source, entries: currentPreview.entries });
      result.secrets.forEach(onSaved);
      onComplete();
      const summary = `${result.imported} imported, ${result.rotated} rotated, ${result.rejected} rejected.`;
      setMessage(`Secret import complete: ${summary} Values were encrypted and are never returned.`);
      if (result.errors.length > 0) setError(result.errors.map((item) => `${item.name}: ${item.message}`).join(" "));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to import secrets.");
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

  return <div className="mt-6 space-y-5">
    <section className="surface-card p-5">
      <div className="flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">Import JSON or `.env` separately</h2></div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">Paste JSON directly into the first box, or choose a `.env` file in the second box. Both previews show names only; validated values are sent through the authenticated request and are never returned.</p>
      {(() => {
        const ollamaKeys = secrets.map((secret) => ollamaOrdinal(secret.name)).filter((ordinal): ordinal is number => ordinal !== null).sort((left, right) => left - right);
        const highest = ollamaKeys.at(-1) ?? 0;
        return <div className="mt-3 rounded-md border border-primary/25 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Ollama Cloud key pool:</strong> {ollamaKeys.length} configured position{ollamaKeys.length === 1 ? "" : "s"}{highest > ollamaPoolDisplayLimit ? ` · highest position ${highest}` : ` · positions 1–${ollamaPoolDisplayLimit} supported by default`}. Missing positions are allowed; values remain encrypted and are never displayed.</div>;
      })()}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border/60 p-4">
          <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Paste JSON</h3><p className="mt-1 text-[11px] text-muted-foreground">Object map, array, or an object with a secrets property.</p></div><FileJson className="h-4 w-4 text-primary" /></div>
          <textarea value={jsonText} onChange={(event) => { setJsonText(event.target.value); setJsonPreview({ entries: [], errors: [] }); }} placeholder={'{\n  "ZAI_API_KEY": "paste-value-here"\n}'} spellCheck={false} className="mt-3 min-h-36 w-full rounded-md border border-border bg-surface-2/40 px-3 py-2 font-mono text-xs text-foreground" />
          <button type="button" onClick={previewJson} disabled={!jsonText.trim() || localBusy !== null || Boolean(busyId)} className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-accent disabled:opacity-50"><FileJson className="h-3.5 w-3.5" /> Preview pasted JSON</button>
          <ImportPreviewBox preview={jsonPreview} busy={localBusy === "json-import"} disabled={Boolean(busyId)} onImport={() => { void importSecrets("JSON", jsonPreview, () => { setJsonText(""); setJsonPreview({ entries: [], errors: [] }); }); }} />
        </div>
        <div className="rounded-md border border-border/60 p-4">
          <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Import `.env` file</h3><p className="mt-1 text-[11px] text-muted-foreground">Comments, `export KEY=value`, and quoted values are supported.</p></div><Upload className="h-4 w-4 text-primary" /></div>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"><Upload className="h-3.5 w-3.5" /> Choose `.env` file<input type="file" accept=".env,text/plain" onChange={(event) => { void handleEnvFile(event); }} className="sr-only" /></label>
          {envFileName && <div className="mt-2 text-xs text-muted-foreground">{envFileName} · {envPreview.entries.length} valid entr{envPreview.entries.length === 1 ? "y" : "ies"}</div>}
          <ImportPreviewBox preview={envPreview} busy={localBusy === "env-import"} disabled={Boolean(busyId)} onImport={() => { void importSecrets("ENV", envPreview, () => { setEnvFileName(""); setEnvPreview({ entries: [], errors: [] }); }); }} />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Existing names are rotated and receive a new vault version. Duplicate names in one source keep the first occurrence.</p>
    </section>

    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="surface-card p-5">
        <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">Add or rotate a secret</h2></div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Values are encrypted before storage. Matrix QA returns only the exact reference name and health metadata, never the secret value.</p>
        <form autoComplete="off" onSubmit={(event) => { void save(event); }} className="mt-5 grid gap-3">
          <label className="grid gap-1 text-xs text-muted-foreground">Reference name<input name="managedSecretName" autoComplete="off" required pattern="[A-Z][A-Z0-9_]{1,127}" value={name} onChange={(event) => setName(event.target.value.toUpperCase())} placeholder="OLLAMA_API_KEY_1" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /><span className="text-[11px]">Use an exact provider reference. Ollama pool positions use OLLAMA_API_KEY_1 through OLLAMA_API_KEY_80 by default; gaps are allowed.</span></label>
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
    </div>
  </div>;
}
