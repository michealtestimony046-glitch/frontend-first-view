import { useEffect, useMemo, useState } from "react";
import { ArrowUp, BookOpen, Check, Loader2, MessageCircle, ShieldCheck, Sparkles, X } from "lucide-react";
import { guidanceApi, type GuidanceMessage } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type MiaGuideProps = { compact?: boolean };

const INTRO = "I’m Mia, your Matrix QA guide. Ask me how to run a test, where to find a report, what a notification means, or what happened in your recent runs. I can explain your account, but I cannot start tests or change anything for you.";
const SUGGESTIONS = ["How do I run my first test?", "What happened in my latest run?", "Where are my notifications?"];

function storageKey(userId: string) { return `matrixqa_mia_messages:${userId}`; }
function seenKey(userId: string) { return `matrixqa_mia_seen:${userId}`; }

function sanitizeStoredMessage(value: string): string {
  return value
    .replace(/\bAI browser test\b/gi, "adaptive browser test")
    .replace(/\bAI browser worker\b/gi, "test worker")
    .replace(/\bAI pass assertion\b/gi, "evidence-backed pass check")
    .replace(/\bAI\b/gi, "test worker")
    .replace(/\bMatrix Units?\b/gi, "test capacity")
    .replace(/\b\d+(?:\.\d+)?\s*⟐/g, "additional test capacity")
    .replace(/\b(?:OpenRouter|Ollama|Groq|Cloudflare|Z\.ai|Gemini|Claude|GPT(?:-\d+(?:\.\d+)?)?)\b/gi, "configured test capacity")
    .slice(0, 2_000);
}

export function MiaGuide({ compact = false }: MiaGuideProps) {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<GuidanceMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? "";
  const hasConversation = messages.length > 0;
  const isFirstVisit = Boolean(userId && typeof window !== "undefined" && !localStorage.getItem(seenKey(userId)));

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey(userId)) || "[]") as GuidanceMessage[];
      if (Array.isArray(stored)) setMessages(stored.filter((item) => (item.role === "user" || item.role === "assistant") && typeof item.content === "string").map((item) => ({ role: item.role, content: sanitizeStoredMessage(item.content) })).slice(-10));
    } catch {
      setMessages([]);
    }
  }, [userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId || !isFirstVisit || typeof window === "undefined") return;
    const timer = window.setTimeout(() => setOpen(true), 650);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, isFirstVisit, userId]);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    localStorage.setItem(storageKey(userId), JSON.stringify(messages.slice(-10)));
  }, [messages, userId]);

  const visibleMessages = useMemo(() => hasConversation ? messages : [{ role: "assistant" as const, content: INTRO }], [hasConversation, messages]);

  if (!isAuthenticated || !user) return null;

  const openGuide = () => {
    setOpen(true);
    localStorage.setItem(seenKey(userId), "1");
    setError(null);
  };

  const closeGuide = () => {
    setOpen(false);
    localStorage.setItem(seenKey(userId), "1");
  };

  const send = async (value = draft) => {
    const message = value.trim();
    if (!message || loading) return;
    const nextHistory: GuidanceMessage[] = [...messages, { role: "user" as const, content: message.slice(0, 2_000) }].slice(-10);
    setMessages(nextHistory);
    setDraft("");
    setLoading(true);
    setError(null);
    try {
      const response = await guidanceApi.chat(message, messages.slice(-8));
      setMessages((current) => [...current, { role: "assistant" as const, content: sanitizeStoredMessage(response.answer) }].slice(-10));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mia could not respond right now.");
    } finally {
      setLoading(false);
    }
  };

  return <>
    {open && <div className={`fixed z-[60] ${compact ? "bottom-20 right-3 sm:bottom-5 sm:right-5" : "bottom-20 right-3 sm:bottom-5 sm:right-5"} w-[min(390px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)]`} role="dialog" aria-label="Mia product guide" aria-modal="false">
      <header className="flex items-start justify-between gap-3 border-b border-border bg-surface-2/60 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary"><MessageCircle className="h-4 w-4" /></span><div className="min-w-0"><div className="flex items-center gap-1.5 text-sm font-semibold">Mia <span className="rounded-full border border-primary/25 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">Guide</span></div><p className="mt-0.5 text-[11px] text-muted-foreground">Read-only help for your Matrix QA account</p></div></div>
        <button type="button" onClick={closeGuide} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close Mia guide"><X className="h-4 w-4" /></button>
      </header>
      <div className="max-h-[min(430px,55vh)] space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {!hasConversation && <div className="mb-1 flex items-center gap-2 text-[11px] text-primary"><Sparkles className="h-3.5 w-3.5" />Start with a question about Matrix QA</div>}
        {visibleMessages.map((item, index) => <div key={`${item.role}-${index}`} className={item.role === "user" ? "ml-8 rounded-xl bg-primary/10 px-3 py-2.5 text-sm text-foreground" : "mr-3 rounded-xl border border-border bg-surface-2/45 px-3 py-2.5 text-sm leading-5 text-foreground/90"}><div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{item.role === "user" ? "You" : "Mia"}</div>{item.content}</div>)}
        {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />Mia is checking your account context…</div>}
        {error && <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive"><span className="flex-1">{error}</span><button type="button" onClick={() => setError(null)} className="shrink-0 underline">Dismiss</button></div>}
        {!hasConversation && <div className="grid gap-2 pt-1">{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="flex items-center gap-2 rounded-lg border border-border bg-surface/70 px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"><BookOpen className="h-3.5 w-3.5 text-primary" />{suggestion}</button>)}</div>}
      </div>
      <div className="border-t border-border bg-surface-2/30 px-3 py-3"><div className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck className="h-3 w-3 text-primary" />Mia explains; she does not execute account actions.</div><form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex items-center gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={loading} maxLength={2_000} placeholder="Ask about your Matrix QA account…" className="min-w-0 flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary/50" aria-label="Ask Mia a question" /><button type="submit" disabled={loading || !draft.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send question to Mia"><ArrowUp className="h-4 w-4" /></button></form></div>
    </div>}
    {!open && <button type="button" onClick={openGuide} className="fixed bottom-[4.5rem] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-primary/35 bg-surface text-primary shadow-[0_10px_35px_-12px_rgba(0,0,0,0.9)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 md:bottom-5 md:right-5" aria-label="Open Mia product guide" title="Ask Mia"><MessageCircle className="h-5 w-5" /><span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" /></button>}
  </>;
}
