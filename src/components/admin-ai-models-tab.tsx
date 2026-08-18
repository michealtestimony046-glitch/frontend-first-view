import { useEffect, useMemo, useState } from "react";
import { Activity, BrainCircuit, Check, Plus, Settings2 } from "lucide-react";
import type { AdminAiProviderConfig } from "@/lib/api-client";

type Provider = AdminAiProviderConfig["provider"];
type UseCase = AdminAiProviderConfig["useCase"];
type SavePayload = Partial<AdminAiProviderConfig> & Pick<AdminAiProviderConfig, "provider" | "model" | "useCase" | "secretRef">;

type Props = {
  configs: AdminAiProviderConfig[];
  busyId: string | null;
  onSave: (data: SavePayload) => void;
  onHealthCheck: (config: AdminAiProviderConfig) => void;
};

const useCases: UseCase[] = ["DISCOVERY", "PLANNING", "BROWSER_AGENT", "VISION", "RECOVERY"];
const providers: Array<{ value: Provider; label: string }> = [
  { value: "groq", label: "Groq" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "anthropic", label: "Claude / Anthropic" },
  { value: "openai_compatible", label: "Other OpenAI-compatible" },
];

const blankDraft = (): SavePayload & { baseUrl: string; enabled: boolean; priority: number; timeoutMs: number; maxOutputTokens: number; temperature: number; estimatedInputUsdPerMillion: number; estimatedOutputUsdPerMillion: number; matrixUnitSurcharge: number } => ({
  provider: "groq",
  model: "openai/gpt-oss-20b",
  useCase: "DISCOVERY",
  secretRef: "GROQ_API_KEY",
  baseUrl: "",
  enabled: false,
  priority: 1,
  timeoutMs: 20000,
  maxOutputTokens: 2000,
  temperature: 0,
  estimatedInputUsdPerMillion: 0.075,
  estimatedOutputUsdPerMillion: 0.3,
  matrixUnitSurcharge: 1,
});

function providerLabel(provider: Provider) {
  return providers.find((item) => item.value === provider)?.label || provider;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not checked";
}

export function AdminAiModelsTab({ configs, busyId, onSave, onHealthCheck }: Props) {
  const [draft, setDraft] = useState(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(() => configs.find((item) => item.id === editingId) || null, [configs, editingId]);

  useEffect(() => {
    if (!editing) return;
    setDraft({
      provider: editing.provider,
      model: editing.model,
      useCase: editing.useCase,
      secretRef: editing.secretRef,
      baseUrl: editing.baseUrl || "",
      enabled: editing.enabled,
      priority: editing.priority,
      timeoutMs: editing.timeoutMs,
      maxOutputTokens: editing.maxOutputTokens,
      temperature: editing.temperature,
      estimatedInputUsdPerMillion: editing.estimatedInputUsdPerMillion,
      estimatedOutputUsdPerMillion: editing.estimatedOutputUsdPerMillion,
      matrixUnitSurcharge: editing.matrixUnitSurcharge,
    });
  }, [editing]);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const reset = () => { setEditingId(null); setDraft(blankDraft()); };

  return <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
    <section className="surface-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">AI model configurations</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Add one or more provider/model rows for each V2 use case. Lower priority numbers are tried first.</p></div>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"><Plus className="h-3.5 w-3.5" /> Add another</button>
      </div>
      <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">Keys stay in deployment secrets. This form stores only the environment-variable name, such as <code>GROQ_API_KEY</code>. Official GitHub Models inference was retired; use <strong>Other OpenAI-compatible</strong> with a current GitHub/Azure-compatible endpoint if your organization has one.</div>
      <form className="mt-5 grid gap-3" onSubmit={(event) => { event.preventDefault(); onSave({ ...draft, model: draft.model.trim(), secretRef: draft.secretRef.trim(), baseUrl: draft.baseUrl?.trim() || undefined }); }}>
        <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs text-muted-foreground">Use case<select value={draft.useCase} onChange={(event) => set("useCase", event.target.value as UseCase)} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground">{useCases.map((item) => <option key={item}>{item}</option>)}</select></label><label className="grid gap-1 text-xs text-muted-foreground">Provider<select value={draft.provider} onChange={(event) => set("provider", event.target.value as Provider)} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground">{providers.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>
        <label className="grid gap-1 text-xs text-muted-foreground">Model<input required value={draft.model} onChange={(event) => set("model", event.target.value)} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label>
        <label className="grid gap-1 text-xs text-muted-foreground">Deployment secret reference<input required pattern="[A-Z][A-Z0-9_]{1,127}" value={draft.secretRef} onChange={(event) => set("secretRef", event.target.value.toUpperCase())} placeholder="ANTHROPIC_API_KEY" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /><span className="text-[11px]">Never paste the actual API key here.</span></label>
        <label className="grid gap-1 text-xs text-muted-foreground">Custom HTTPS base URL <span className="font-normal">(required for Other OpenAI-compatible)</span><input type="url" required={draft.provider === "openai_compatible"} value={draft.baseUrl} onChange={(event) => set("baseUrl", event.target.value)} placeholder={draft.provider === "openai_compatible" ? "https://your-provider.example/v1" : "Leave blank for the provider default"} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label>
        <div className="grid gap-3 sm:grid-cols-3"><label className="grid gap-1 text-xs text-muted-foreground">Priority<input type="number" min={1} max={100} value={draft.priority} onChange={(event) => set("priority", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Timeout ms<input type="number" min={1000} max={120000} value={draft.timeoutMs} onChange={(event) => set("timeoutMs", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Max output tokens<input type="number" min={16} max={8192} value={draft.maxOutputTokens} onChange={(event) => set("maxOutputTokens", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label></div>
        <div className="grid gap-3 sm:grid-cols-4"><label className="grid gap-1 text-xs text-muted-foreground">Temperature<input type="number" min={0} max={1} step={0.05} value={draft.temperature} onChange={(event) => set("temperature", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Input USD / 1M<input type="number" min={0} step={0.000001} value={draft.estimatedInputUsdPerMillion} onChange={(event) => set("estimatedInputUsdPerMillion", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Output USD / 1M<input type="number" min={0} step={0.000001} value={draft.estimatedOutputUsdPerMillion} onChange={(event) => set("estimatedOutputUsdPerMillion", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Matrix units<input type="number" min={0} max={100} value={draft.matrixUnitSurcharge} onChange={(event) => set("matrixUnitSurcharge", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.enabled} onChange={(event) => set("enabled", event.target.checked)} /> Activate this configuration for new work</label>
        <div className="flex flex-wrap gap-2"><button disabled={busyId === `ai-provider-${draft.useCase}`} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Check className="h-3.5 w-3.5" /> {editingId ? "Save new version" : "Save configuration"}</button>{editingId && <button type="button" onClick={reset} className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent">Cancel edit</button>}</div>
      </form>
    </section>
    <section className="surface-card p-5"><div className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">Configured providers</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Vision and Recovery can be configured and billed like every other use case. Changes affect new scans/plans/runs; running jobs keep their snapshot.</p><div className="mt-4 space-y-2">{configs.length === 0 ? <p className="text-sm text-muted-foreground">No database-managed provider configurations yet. Deployment fallback is active where configured.</p> : configs.map((config) => <article key={config.id} className={`rounded-md border p-3 ${config.enabled ? "border-primary/40" : "border-border/60"}`}><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium">{providerLabel(config.provider)} / {config.model}</div><div className="text-[11px] text-muted-foreground">{config.useCase} · priority {config.priority} · v{config.configVersion} · {config.enabled ? "Active" : "Disabled"}</div></div><div className="flex gap-2"><button type="button" onClick={() => { setEditingId(config.id); }} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent">Edit</button><button type="button" onClick={() => onHealthCheck(config)} disabled={busyId === `ai-health-${config.id}`} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50">Health check</button></div></div><div className="mt-2 text-[11px] text-muted-foreground">Secret ref: {config.secretRef} · {config.baseUrl || "provider default endpoint"}</div><div className="mt-1 text-[11px] text-muted-foreground">Health: {config.lastHealthStatus || "Not checked"} · checked {formatDate(config.lastHealthCheckedAt)}</div>{config.lastHealthError && <div className="mt-1 text-[11px] text-destructive">{config.lastHealthError}</div>}</article>)}</div></section>
  </div>;
}
