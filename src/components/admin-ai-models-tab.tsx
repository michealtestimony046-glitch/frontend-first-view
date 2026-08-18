import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Check, Crown, Loader2, Plus, RefreshCw, Settings2, Trash2 } from "lucide-react";
import { adminApi, type AdminAiModelCatalogResponse, type AdminAiProviderConfig } from "@/lib/api-client";

type Provider = AdminAiProviderConfig["provider"];
type UseCase = AdminAiProviderConfig["useCase"];
type SavePayload = Partial<AdminAiProviderConfig> & Pick<AdminAiProviderConfig, "provider" | "model" | "useCase" | "secretRef">;

type Props = {
  configs: AdminAiProviderConfig[];
  busyId: string | null;
  onSave: (data: SavePayload) => Promise<void> | void;
  onHealthCheck: (config: AdminAiProviderConfig) => Promise<void> | void;
  onRemove: (config: AdminAiProviderConfig) => Promise<void> | void;
  managedSecretNames?: string[];
};

type Draft = SavePayload & {
  baseUrl: string;
  enabled: boolean;
  priority: number;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
  estimatedInputUsdPerMillion: number;
  estimatedOutputUsdPerMillion: number;
  matrixUnitSurcharge: number;
};

const useCases: UseCase[] = ["DISCOVERY", "PLANNING", "BROWSER_AGENT", "VISION", "RECOVERY"];
const providers: Array<{ value: Provider; label: string }> = [
  { value: "groq", label: "Groq" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "anthropic", label: "Claude / Anthropic" },
  { value: "zai", label: "Z.ai (GLM)" },
  { value: "openai_compatible", label: "Other OpenAI-compatible" },
];

const defaultSecretRefs: Record<Provider, string> = {
  groq: "GROQ_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  zai: "ZAI_API_KEY",
  openai_compatible: "AI_COMPATIBLE_API_KEY",
};

const useCaseLabels: Record<UseCase, string> = {
  DISCOVERY: "Discovery",
  PLANNING: "Planning",
  BROWSER_AGENT: "Browser Agent",
  VISION: "Vision",
  RECOVERY: "Recovery",
};

const useCaseDescriptions: Record<UseCase, string> = {
  DISCOVERY: "Maps pages, features, and deterministic safe actions.",
  PLANNING: "Builds the ordered journey graph before execution.",
  BROWSER_AGENT: "Chooses the next approved Playwright tool call.",
  VISION: "Verifies visual state from screenshots when configured.",
  RECOVERY: "Advises bounded recovery and bug-intelligence enrichment.",
};

const blankDraft = (useCase: UseCase = "DISCOVERY", priority = 1): Draft => ({
  provider: "groq",
  model: "",
  useCase,
  secretRef: "GROQ_API_KEY",
  baseUrl: "",
  enabled: false,
  priority,
  timeoutMs: 20000,
  maxOutputTokens: 2000,
  temperature: 0,
  estimatedInputUsdPerMillion: 0,
  estimatedOutputUsdPerMillion: 0,
  matrixUnitSurcharge: 1,
});

function providerLabel(provider: Provider) {
  return providers.find((item) => item.value === provider)?.label || provider;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not checked";
}

function sortedConfigs(configs: AdminAiProviderConfig[]) {
  return [...configs].sort((left, right) => left.priority - right.priority || left.updatedAt.localeCompare(right.updatedAt));
}

function compatibilityClass(status: AdminAiModelCatalogResponse["models"][number]["compatibility"]["status"]) {
  if (status === "INCOMPATIBLE") return "border-destructive/40 bg-destructive/10 text-destructive";
  if (status === "WARNING") return "border-warning/40 bg-warning/10 text-warning";
  if (status === "COMPATIBLE") return "border-primary/30 bg-primary/10 text-primary";
  return "border-border bg-surface-2/30 text-muted-foreground";
}

export function AdminAiModelsTab({ configs, busyId, onSave, onHealthCheck, onRemove, managedSecretNames = [] }: Props) {
  const [draft, setDraft] = useState<Draft>(() => blankDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<AdminAiModelCatalogResponse | null>(null);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [catalogError, setCatalogError] = useState("");

  const editing = useMemo(() => configs.find((item) => item.id === editingId) || null, [configs, editingId]);
  const useCaseConfigs = useMemo(() => sortedConfigs(configs.filter((item) => item.useCase === draft.useCase)), [configs, draft.useCase]);
  const selectedCatalogModel = catalog?.models.find((item) => item.id === draft.model);
  const canAddChainItem = useCaseConfigs.length < 4;
  const validSecretRef = /^[A-Z][A-Z0-9_]{1,127}$/.test(draft.secretRef.trim());
  const saveDisabled = !draft.model.trim() || !validSecretRef || (draft.provider === "openai_compatible" && !draft.baseUrl.trim());

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
    setCatalog(null);
    setCatalogError("");
  }, [editing]);

  const loadCatalog = useCallback(async (refresh = false) => {
    if (!draft.secretRef || !/^[A-Z][A-Z0-9_]{1,127}$/.test(draft.secretRef)) {
      setCatalogError("Enter a valid deployment secret reference before fetching models.");
      return;
    }
    if (draft.provider === "openai_compatible" && !draft.baseUrl.trim()) {
      setCatalogError("Enter the HTTPS base URL for the compatible provider before fetching models.");
      return;
    }
    setCatalogBusy(true);
    setCatalogError("");
    try {
      const response = await adminApi.listAiModelCatalog({ provider: draft.provider, secretRef: draft.secretRef, baseUrl: draft.baseUrl.trim() || undefined, useCase: draft.useCase, refresh });
      setCatalog(response);
    } catch (cause) {
      setCatalogError(cause instanceof Error ? cause.message : "Unable to fetch the live model catalog.");
    } finally {
      setCatalogBusy(false);
    }
  }, [draft.baseUrl, draft.provider, draft.secretRef, draft.useCase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCatalog(false); }, 350);
    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const selectModel = (modelId: string) => {
    const catalogModel = catalog?.models.find((model) => model.id === modelId);
    setDraft((current) => ({
      ...current,
      model: modelId,
      estimatedInputUsdPerMillion: catalogModel?.inputPriceUsdPerMillion ?? current.estimatedInputUsdPerMillion,
      estimatedOutputUsdPerMillion: catalogModel?.outputPriceUsdPerMillion ?? current.estimatedOutputUsdPerMillion,
    }));
  };
  const reset = (useCase: UseCase = "DISCOVERY", priority = 1) => {
    setEditingId(null);
    setDraft(blankDraft(useCase, priority));
    setCatalog(null);
    setCatalogError("");
  };

  const changeProvider = (provider: Provider) => {
    const currentDefault = defaultSecretRefs[draft.provider];
    setDraft((current) => ({
      ...current,
      provider,
      secretRef: current.secretRef === currentDefault ? defaultSecretRefs[provider] : current.secretRef,
      baseUrl: provider === "openai_compatible" ? current.baseUrl : "",
      model: "",
    }));
    setCatalog(null);
  };

  const changeUseCase = (useCase: UseCase) => {
    setDraft((current) => ({ ...current, useCase, priority: configs.filter((item) => item.useCase === useCase).length + 1, model: "" }));
    setCatalog(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.model.trim()) {
      setCatalogError("Choose a live model or type a model ID manually before saving.");
      return;
    }
    if (!/^[A-Z][A-Z0-9_]{1,127}$/.test(draft.secretRef.trim())) {
      setCatalogError("Use an exact secret reference name such as ZAI_API_KEY.");
      return;
    }
    await onSave({ ...draft, model: draft.model.trim(), secretRef: draft.secretRef.trim(), baseUrl: draft.baseUrl.trim() || undefined });
  };

  const reorder = async (items: AdminAiProviderConfig[]) => {
    for (const [index, item] of items.entries()) {
      if (item.priority !== index + 1) {
        await onSave({
          provider: item.provider,
          model: item.model,
          useCase: item.useCase,
          secretRef: item.secretRef,
          baseUrl: item.baseUrl || undefined,
          enabled: item.enabled,
          priority: index + 1,
          timeoutMs: item.timeoutMs,
          maxOutputTokens: item.maxOutputTokens,
          temperature: item.temperature,
          estimatedInputUsdPerMillion: item.estimatedInputUsdPerMillion,
          estimatedOutputUsdPerMillion: item.estimatedOutputUsdPerMillion,
          matrixUnitSurcharge: item.matrixUnitSurcharge,
        });
      }
    }
  };

  const promote = async (config: AdminAiProviderConfig) => {
    const items = sortedConfigs(configs.filter((item) => item.useCase === config.useCase));
    const promoted = [config, ...items.filter((item) => item.id !== config.id)];
    await reorder(promoted);
  };

  const move = async (config: AdminAiProviderConfig, direction: "up" | "down") => {
    const items = sortedConfigs(configs.filter((item) => item.useCase === config.useCase));
    const index = items.findIndex((item) => item.id === config.id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    await reorder(items);
  };

  return <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
    <section className="surface-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="flex items-center gap-2"><Crown className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">Primary model and fallback chain</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Configure one primary model and up to three ordered fallbacks for each V2 use case. The browser never receives provider keys.</p></div>
        <button type="button" onClick={() => reset(draft.useCase, useCaseConfigs.length + 1)} disabled={!canAddChainItem} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-accent disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> {useCaseConfigs.length ? "Add fallback" : "Add primary"}</button>
      </div>
      <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">GitHub Models inference was retired. GitHub is not an inference provider here; use <strong>Other OpenAI-compatible</strong> only when you have a current compatible endpoint. Keys remain deployment secrets such as <code>GROQ_API_KEY</code>.</div>
      {draft.provider === "zai" && <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs leading-5 text-warning"><strong>Z.ai direct API:</strong> the model list is curated from published Z.ai API models because no public catalog endpoint is documented. Use <code>ZAI_API_KEY</code> for backend API access; do not paste a GLM Coding Plan credential unless its server-side use is approved by Z.ai.</div>}
      <form className="mt-5 grid gap-3" onSubmit={(event) => { void submit(event); }}>
        <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs text-muted-foreground">Use case<select value={draft.useCase} onChange={(event) => changeUseCase(event.target.value as UseCase)} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground">{useCases.map((item) => <option key={item} value={item}>{useCaseLabels[item]}</option>)}</select></label><label className="grid gap-1 text-xs text-muted-foreground">Provider<select value={draft.provider} onChange={(event) => changeProvider(event.target.value as Provider)} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground">{providers.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>
        <p className="text-[11px] text-muted-foreground">{useCaseDescriptions[draft.useCase]}</p>
        <div className="grid gap-2"><label className="grid gap-1 text-xs text-muted-foreground">Live model catalog or manual model ID<input required list={`ai-model-options-${draft.useCase}`} value={draft.model} onChange={(event) => selectModel(event.target.value)} placeholder="Choose a live model or type an ID" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /><datalist id={`ai-model-options-${draft.useCase}`}>{catalog?.models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</datalist></label><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => { void loadCatalog(true); }} disabled={catalogBusy} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium hover:bg-accent disabled:opacity-50">{catalogBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh models</button>{catalog && <span className="text-[11px] text-muted-foreground">{catalog.source === "CURATED" ? "Curated" : catalog.cached ? "Cached" : "Live"} catalog · {formatDate(catalog.fetchedAt)}{catalog.stale ? " · stale" : ""}</span>}</div></div>
        {catalogError && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">{catalogError}</div>}
        {catalog?.warnings.map((warning) => <div key={warning} className="rounded-md border border-warning/40 bg-warning/10 p-2 text-[11px] text-warning"><AlertTriangle className="mr-1 inline h-3.5 w-3.5" />{warning}</div>)}
        {selectedCatalogModel && <div className={`rounded-md border p-2 text-[11px] ${compatibilityClass(selectedCatalogModel.compatibility.status)}`}><strong>{selectedCatalogModel.name}</strong> · {selectedCatalogModel.status.toLowerCase()} · {selectedCatalogModel.contextLength ? `${selectedCatalogModel.contextLength.toLocaleString()} context` : "context unknown"}{selectedCatalogModel.compatibility.reasons.length > 0 && <span> · {selectedCatalogModel.compatibility.reasons.join(" ")}</span>}</div>}
        {draft.model && !selectedCatalogModel && <div className="rounded-md border border-warning/40 bg-warning/10 p-2 text-[11px] text-warning"><AlertTriangle className="mr-1 inline h-3.5 w-3.5" />Manual / unverified model ID. Run a health check after saving before activating it.</div>}
        <label className="grid gap-1 text-xs text-muted-foreground">Secret reference<input required list={`ai-secret-options-${draft.useCase}`} pattern="[A-Z][A-Z0-9_]{1,127}" value={draft.secretRef} onChange={(event) => set("secretRef", event.target.value.toUpperCase())} placeholder="ANTHROPIC_API_KEY" className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /><datalist id={`ai-secret-options-${draft.useCase}`}>{[...new Set([...managedSecretNames, ...Object.values(defaultSecretRefs)])].map((secret) => <option key={secret} value={secret}>{managedSecretNames.includes(secret) ? "Managed encrypted secret" : "Deployment fallback"}</option>)}</datalist><span className="text-[11px]">Choose a managed encrypted secret or use an exact deployment environment name. Never paste the actual API key here.</span></label>
        <label className="grid gap-1 text-xs text-muted-foreground">Custom HTTPS base URL <span className="font-normal">(required for Other OpenAI-compatible)</span><input type="url" required={draft.provider === "openai_compatible"} value={draft.baseUrl} onChange={(event) => set("baseUrl", event.target.value)} placeholder={draft.provider === "openai_compatible" ? "https://your-provider.example/v1" : "Leave blank for provider default"} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label>
        <div className="grid gap-3 sm:grid-cols-3"><label className="grid gap-1 text-xs text-muted-foreground">Chain position<input type="number" min={1} max={100} value={draft.priority} onChange={(event) => set("priority", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Timeout ms<input type="number" min={1000} max={120000} value={draft.timeoutMs} onChange={(event) => set("timeoutMs", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Max output tokens<input type="number" min={16} max={8192} value={draft.maxOutputTokens} onChange={(event) => set("maxOutputTokens", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label></div>
        <div className="grid gap-3 sm:grid-cols-4"><label className="grid gap-1 text-xs text-muted-foreground">Temperature<input type="number" min={0} max={1} step={0.05} value={draft.temperature} onChange={(event) => set("temperature", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Input USD / 1M<input type="number" min={0} step={0.000001} value={draft.estimatedInputUsdPerMillion} onChange={(event) => set("estimatedInputUsdPerMillion", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Output USD / 1M<input type="number" min={0} step={0.000001} value={draft.estimatedOutputUsdPerMillion} onChange={(event) => set("estimatedOutputUsdPerMillion", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Matrix units<input type="number" min={0} max={100} value={draft.matrixUnitSurcharge} onChange={(event) => set("matrixUnitSurcharge", Number(event.target.value))} className="rounded-md border border-border bg-surface-2/40 px-3 py-2 text-sm text-foreground" /></label></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.enabled} onChange={(event) => set("enabled", event.target.checked)} /> Activate this configuration for new work</label>
        {!draft.model.trim() && <p className="rounded-md border border-warning/40 bg-warning/10 p-2 text-[11px] text-warning">Choose a catalog model or type a model ID before saving. Provider selection alone is not a model mapping.</p>}
        {draft.model.trim() && !validSecretRef && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">Use an exact secret reference name such as GROQ_API_KEY; never paste the secret value.</p>}
        <div className="flex flex-wrap gap-2"><button disabled={busyId === `ai-provider-${draft.useCase}` || saveDisabled} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Check className="h-3.5 w-3.5" /> {editingId ? "Save configuration" : draft.priority === 1 ? "Save primary" : "Save fallback"}</button>{editingId && <button type="button" onClick={() => reset(draft.useCase, useCaseConfigs.length + 1)} className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent">Cancel edit</button>}</div>
      </form>
    </section>
    <section className="surface-card p-5"><div className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /><h2 className="font-display text-base font-semibold">Configuration chains</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Primary is position 1. Fallbacks run in order for transient provider failures, unavailable models, and bounded recovery events. Matrix QA policy remains authoritative.</p><div className="mt-4 space-y-4">{useCases.map((useCase) => { const items = sortedConfigs(configs.filter((item) => item.useCase === useCase)); return <section key={useCase} className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0"><div className="flex items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">{useCaseLabels[useCase]}</h3><p className="text-[11px] text-muted-foreground">{useCaseDescriptions[useCase]}</p></div><button type="button" onClick={() => reset(useCase, items.length + 1)} disabled={items.length >= 4} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50"><Plus className="h-3 w-3" /> {items.length >= 4 ? "Maximum reached" : items.length ? "Add fallback" : "Add primary"}</button></div>{items.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No model configured.</p> : <div className="mt-2 space-y-2">{items.map((config, index) => <article key={config.id} className={`border p-3 ${index === 0 ? "border-primary/40 bg-primary/5" : "border-border/70"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-medium">{index === 0 ? <Crown className="h-3.5 w-3.5 text-primary" /> : <span className="text-[10px] font-mono text-muted-foreground">F{index}</span>}<span className="truncate">{index === 0 ? "Primary" : `Fallback ${index}`} · {providerLabel(config.provider)}</span></div><div className="mt-1 truncate text-[11px] text-muted-foreground">{config.model} · v{config.configVersion} · {config.enabled ? "Active" : "Disabled"}</div><div className={`mt-1 text-[11px] font-medium ${config.runtimeStatus === "READY" ? "text-success" : config.runtimeStatus === "MISSING_SECRET" ? "text-destructive" : "text-muted-foreground"}`}>{config.runtimeStatus === "READY" ? `Mapped · ${config.secretSource === "MANAGED" ? "managed vault" : "deployment fallback"}` : config.runtimeStatus === "MISSING_SECRET" ? "Mapping unavailable · secret missing" : "Not active"}</div></div><div className="flex shrink-0 flex-wrap justify-end gap-1"><button type="button" onClick={() => setEditingId(config.id)} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent">Edit</button>{index > 0 && <button type="button" onClick={() => { void promote(config); }} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent">Promote</button>}<button type="button" aria-label="Move up" disabled={index === 0} onClick={() => { void move(config, "up"); }} className="rounded-md border border-border p-1 hover:bg-accent disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button><button type="button" aria-label="Move down" disabled={index === items.length - 1} onClick={() => { void move(config, "down"); }} className="rounded-md border border-border p-1 hover:bg-accent disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button><button type="button" aria-label="Remove configuration" onClick={() => { void onRemove(config); }} disabled={busyId === `ai-remove-${config.id}`} className="rounded-md border border-destructive/40 p-1 text-destructive hover:bg-destructive/10 disabled:opacity-50"><Trash2 className="h-3 w-3" /></button></div></div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground"><span>{config.secretRef}</span><span>{config.baseUrl || "provider default endpoint"}</span><span>Health: {config.lastHealthStatus || "Not checked"}</span><span>{formatDate(config.lastHealthCheckedAt)}</span></div>{config.lastHealthError && <div className="mt-1 text-[11px] text-destructive">{config.lastHealthError}</div>}<div className="mt-2 flex items-center justify-between gap-2"><span className={`text-[11px] font-medium ${config.enabled ? "text-primary" : "text-muted-foreground"}`}>{config.enabled ? "Eligible for new work" : "Disabled"}</span><div className="flex gap-1"><button type="button" onClick={() => { void onSave({ provider: config.provider, model: config.model, useCase: config.useCase, secretRef: config.secretRef, baseUrl: config.baseUrl || undefined, enabled: !config.enabled, priority: index + 1, timeoutMs: config.timeoutMs, maxOutputTokens: config.maxOutputTokens, temperature: config.temperature, estimatedInputUsdPerMillion: config.estimatedInputUsdPerMillion, estimatedOutputUsdPerMillion: config.estimatedOutputUsdPerMillion, matrixUnitSurcharge: config.matrixUnitSurcharge }); }} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent">{config.enabled ? "Disable" : "Enable"}</button><button type="button" onClick={() => { void onHealthCheck(config); }} disabled={busyId === `ai-health-${config.id}`} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50">{busyId === `ai-health-${config.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : "Health check"}</button></div></div></article>)}</div>}</section>; })}</div></section>
  </div>;
}
