import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import {
  ArrowUp,
  BookOpen,
  Check,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  AUTH_EVENT,
  clearLegacyClientMiaHistory,
  guidanceApi,
  type GuidanceMessage,
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type MiaGuideProps = { compact?: boolean };

const ACTIVE_WORKSPACE_KEY = "matrix_qa_active_workspace";
const INTRO =
  "I’m Mia, your Matrix QA guide. Ask me about Matrix QA, your selected workspace, a focused run, Quick Scan, reports, notifications, projects, or settings. I explain what the product and your current workspace data support, but I do not change account data or execute runs.";
const SUGGESTIONS = [
  "How do I run my first test?",
  "What happened in my latest run?",
  "Where are my notifications?",
];

function activeWorkspaceId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY) || undefined;
}

function conversationScopeKey(userId: string, workspaceId?: string) {
  return `${userId}:${workspaceId || "unscoped"}`;
}
function seenKey(userId: string) {
  return `matrixqa_mia_seen:${userId}`;
}

type MiaMarkdownBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string; level: number }
  | { kind: "list"; ordered: boolean; items: string[] };

function renderMiaInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+?\*\*|`[^`]+`|\*[^*]+?\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-background/60 px-1 py-0.5 font-mono text-[0.9em] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <span key={index}>{part}</span>;
  });
}

function parseMiaMarkdown(content: string): MiaMarkdownBlock[] {
  const normalized = content
    .replace(/\r\n?/g, "\n")
    .replace(/\s+(\d+)\.\s+(?=\*\*)/g, "\n$1. ")
    .trim();
  if (!normalized) return [];

  const blocks: MiaMarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: Extract<MiaMarkdownBlock, { kind: "list" }> | null = null;

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push({ kind: "paragraph", text });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const rawLine of normalized.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2] });
      continue;
    }

    const orderedItem = line.match(/^\d+[.)]\s+(.+)$/);
    const unorderedItem = line.match(/^[-*+]\s+(.+)$/);
    if (orderedItem || unorderedItem) {
      flushParagraph();
      const ordered = Boolean(orderedItem);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { kind: "list", ordered, items: [] };
      }
      list.items.push((orderedItem || unorderedItem)?.[1] || "");
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function MiaMessageContent({ content }: { content: string }) {
  const blocks = parseMiaMarkdown(content);
  return (
    <div className="space-y-3 break-words">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          const headingClass =
            block.level === 1
              ? "text-base font-semibold"
              : block.level === 2
                ? "text-sm font-semibold"
                : "text-sm font-medium";
          const HeadingTag = block.level === 1 ? "h3" : "h4";
          return (
            <HeadingTag key={index} className={headingClass}>
              {renderMiaInlineMarkdown(block.text)}
            </HeadingTag>
          );
        }
        if (block.kind === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={index}
              className={`${block.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-5`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1">
                  {renderMiaInlineMarkdown(item)}
                </li>
              ))}
            </ListTag>
          );
        }
        return <p key={index}>{renderMiaInlineMarkdown(block.text)}</p>;
      })}
    </div>
  );
}

export function sanitizeMiaChatText(value: string): string {
  return value
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/gi, "[REDACTED_SECRET_BLOCK]")
    .replace(/\b(?:sk|rk|ghp|gho|github_pat|xox[baprs]-)[A-Za-z0-9_\-]{12,}\b/gi, "[REDACTED_TOKEN]")
    .replace(/\b(?:eyJ)[A-Za-z0-9_\-]{20,}(?:\.[A-Za-z0-9_\-]+){1,2}\b/g, "[REDACTED_TOKEN]")
    .replace(/\b(?:password|passwd|passcode|secret|token|cookie|authorization|credential|username|user[_ -]?name|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret)\b\s*(?:is|[:=])\s*["']?[^\s,"';]+["']?/gi, "[REDACTED_SENSITIVE]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\b(?:\+?\d[\d .()\-]{7,}\d)\b/g, "[REDACTED_PHONE]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_PAYMENT_NUMBER]")
    .replace(/https?:\/\/[^\s]+/gi, (url) => {
      try {
        const parsed = new URL(url);
        parsed.search = "";
        parsed.hash = "";
        return parsed.toString().replace(/\/$/, "");
      } catch {
        return "[REDACTED_URL]";
      }
    })
    .replace(/\bevidence[-‑ ]backed\s+AI\s+pass\s+assertion\b/gi, "evidence-backed pass check")
    .replace(/\bAI browser test\b/gi, "adaptive browser test")
    .replace(/\bAI browser worker\b/gi, "test worker")
    .replace(/\bAI pass assertion\b/gi, "evidence-backed pass check")
    .replace(/\bAI\b/gi, "test worker")
    .replace(/\bMatrix Units?\b/gi, "test capacity")
    .replace(/\b\d+(?:\.\d+)?\s*⟐/g, "additional test capacity")
    .replace(/\b(?:OpenRouter|Ollama|Groq|Cloudflare|Z\.ai|Gemini|Claude|GPT(?:-\d+(?:\.\d+)?)?)\b/gi, "configured test capacity")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 2_000);
}

export function MiaGuide({ compact = false }: MiaGuideProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const focusedRunId = useMemo(() => {
    const match = location.pathname.match(/^\/app\/runs\/([^/]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  }, [location.pathname]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [workspaceScope, setWorkspaceScope] = useState<string | undefined>(() =>
    activeWorkspaceId(),
  );
  const [messages, setMessages] = useState<GuidanceMessage[]>([]);
  const [loadedHistoryKey, setLoadedHistoryKey] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(false);
  const [authRefreshVersion, setAuthRefreshVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const shouldFollowLatestRef = useRef(true);
  const previousWorkspaceScopeRef = useRef(workspaceScope);
  const previousUserIdRef = useRef<string | null>(null);

  const userId = user?.id ?? "";
  const hasConversation = messages.length > 0;
  const historyScopeKey = useMemo(
    () => conversationScopeKey(userId, workspaceScope),
    [userId, workspaceScope],
  );
  const isFirstVisit = Boolean(
    userId && typeof window !== "undefined" && !localStorage.getItem(seenKey(userId)),
  );
  const conversationReady = Boolean(userId && !hydrating && loadedHistoryKey === historyScopeKey);

  useEffect(() => {
    if (typeof window !== "undefined") clearLegacyClientMiaHistory();
  }, []);

  useEffect(() => {
    if (previousUserIdRef.current === userId) return;
    previousUserIdRef.current = userId;
    setMessages([]);
    setError(null);
    setLoadedHistoryKey(null);
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const resetConversation = () => {
      setMessages([]);
      setDraft("");
      setError(null);
      setLoadedHistoryKey(null);
      setAuthRefreshVersion((current) => current + 1);
      const nextWorkspaceScope = activeWorkspaceId();
      previousWorkspaceScopeRef.current = nextWorkspaceScope;
      setWorkspaceScope(nextWorkspaceScope);
    };
    window.addEventListener(AUTH_EVENT, resetConversation);
    return () => window.removeEventListener(AUTH_EVENT, resetConversation);
  }, []);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const syncWorkspaceScope = () => {
      const nextWorkspaceScope = activeWorkspaceId();
      setWorkspaceScope((current) =>
        current === nextWorkspaceScope ? current : nextWorkspaceScope,
      );
    };
    syncWorkspaceScope();
    const interval = window.setInterval(syncWorkspaceScope, 1_000);
    window.addEventListener("focus", syncWorkspaceScope);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncWorkspaceScope);
    };
  }, [userId]);

  useEffect(() => {
    if (previousWorkspaceScopeRef.current === workspaceScope) return;
    previousWorkspaceScopeRef.current = workspaceScope;
    setMessages([]);
    setError(null);
  }, [workspaceScope]);

  useEffect(() => {
    if (!isAuthenticated || !userId || typeof window === "undefined") return;
    if (!workspaceScope) {
      setMessages([]);
      setLoadedHistoryKey(null);
      setHydrating(false);
      return;
    }
    let cancelled = false;
    setHydrating(true);
    setLoadedHistoryKey(null);
    setError(null);
    guidanceApi.history(workspaceScope)
      .then((response) => {
        if (cancelled) return;
        setMessages(
          response.messages
            .filter((item) => item.role === "user" || item.role === "assistant")
            .map((item) => ({ role: item.role, content: sanitizeMiaChatText(item.content) }))
            .slice(-100),
        );
        setLoadedHistoryKey(historyScopeKey);
      })
      .catch(() => {
        if (cancelled) return;
        setMessages([]);
        setError("Mia history is temporarily unavailable; new messages are still safe to send.");
        setLoadedHistoryKey(historyScopeKey);
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authRefreshVersion, historyScopeKey, isAuthenticated, userId, workspaceScope]);

  useEffect(() => {
    if (!isAuthenticated || !userId || !isFirstVisit || typeof window === "undefined") return;
    const timer = window.setTimeout(() => setOpen(true), 650);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, isFirstVisit, userId]);



  const visibleMessages = useMemo(
    () => (hasConversation ? messages : [{ role: "assistant" as const, content: INTRO }]),
    [hasConversation, messages],
  );

  useEffect(() => {
    if (!open || !shouldFollowLatestRef.current) return;
    const frame = window.requestAnimationFrame(() =>
      latestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [open, visibleMessages.length, loading, error]);

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
    const message = sanitizeMiaChatText(value.trim());
    if (!message || loading || !conversationReady) return;
    const currentWorkspaceId = activeWorkspaceId();
    const baseMessages = currentWorkspaceId === workspaceScope ? messages : [];
    if (currentWorkspaceId !== workspaceScope) {
      setWorkspaceScope(currentWorkspaceId);
      setMessages([]);
    }
    const nextHistory: GuidanceMessage[] = [
      ...baseMessages,
      { role: "user" as const, content: message.slice(0, 2_000) },
    ].slice(-10);
    setMessages(nextHistory);
    setDraft("");
    setLoading(true);
    setError(null);
    try {
      const response = await guidanceApi.chat(message, baseMessages.slice(-8), {
        workspaceId: currentWorkspaceId,
        runId: focusedRunId,
      });
      setMessages((current) =>
        [
          ...current,
          { role: "assistant" as const, content: sanitizeMiaChatText(response.answer) },
        ].slice(-10),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mia could not respond right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className={`fixed z-[60] ${compact ? "bottom-20 right-3 sm:bottom-5 sm:right-5" : "bottom-20 right-3 sm:bottom-5 sm:right-5"} w-[min(410px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/15 bg-surface/55 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.95),0_0_0_1px_rgba(140,255,160,0.05)] backdrop-blur-2xl`}
          role="dialog"
          aria-label="Mia product guide"
          aria-modal="false"
        >
          <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-background/25 px-4 py-3 backdrop-blur-md">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <MessageCircle className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  Mia{" "}
                  <span className="rounded-full border border-primary/25 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                    Guide
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Grounded in your selected workspace and current run
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeGuide}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-muted-foreground backdrop-blur-md hover:border-primary/30 hover:bg-primary/10 hover:text-foreground"
              aria-label="Close Mia guide"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div
            ref={messageViewportRef}
            onScroll={() => {
              const viewport = messageViewportRef.current;
              if (!viewport) return;
              shouldFollowLatestRef.current =
                viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 72;
            }}
            className="max-h-[min(430px,55vh)] space-y-3 overflow-y-auto bg-background/15 px-4 py-4"
            aria-live="polite"
          >
            {conversationReady && !hasConversation && (
              <div className="mb-1 flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/[0.06] px-3 py-2 text-[11px] text-primary backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                Start with a question about Matrix QA
              </div>
            )}
            {conversationReady &&
              visibleMessages.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={
                    item.role === "user"
                      ? "ml-8 rounded-2xl border border-primary/25 bg-primary/10 px-3.5 py-3 text-[13px] leading-[1.6] text-foreground shadow-[0_12px_30px_-24px_rgba(0,0,0,0.95)] sm:text-sm"
                      : "mr-3 rounded-2xl border border-white/10 bg-surface/65 px-3.5 py-3 text-[13px] leading-[1.6] text-foreground/90 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.95)] sm:text-sm"
                  }
                >
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {item.role === "user" ? "You" : "Mia"}
                  </div>
                  <MiaMessageContent content={item.content} />
                </div>
              ))}
            {loading && (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-muted-foreground backdrop-blur-md">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Mia is checking your selected workspace and current run…
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">
                <span className="flex-1">{error}</span>
                <button type="button" onClick={() => setError(null)} className="shrink-0 underline">
                  Dismiss
                </button>
              </div>
            )}
            {conversationReady && !hasConversation && (
              <div className="grid gap-2 pt-1">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs text-muted-foreground backdrop-blur-md hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div ref={latestMessageRef} aria-hidden="true" className="h-px" />
          </div>
          <div className="border-t border-white/10 bg-background/20 px-3 py-3 backdrop-blur-md">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-primary" />
              Mia uses current Matrix QA context; she does not execute account actions.
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={loading || !conversationReady}
                maxLength={2_000}
                placeholder="Ask about this workspace or run…"
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-xs text-foreground outline-none backdrop-blur-md placeholder:text-muted-foreground/70 focus:border-primary/55 focus:bg-primary/[0.06] focus:ring-2 focus:ring-primary/10"
                aria-label="Ask Mia a question"
              />
              <button
                type="submit"
                disabled={loading || !conversationReady || !draft.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-primary/75 text-primary-foreground shadow-[0_8px_24px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md transition-transform duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send question to Mia"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
      {!open && (
        <button
          type="button"
          onClick={openGuide}
          className="fixed bottom-[4.5rem] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-primary/35 bg-surface/65 text-primary shadow-[0_16px_40px_-18px_rgba(0,0,0,0.95)] backdrop-blur-xl transition-transform duration-150 active:scale-95 hover:-translate-y-0.5 hover:bg-surface-2/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 md:bottom-5 md:right-5"
          aria-label="Open Mia product guide"
          title="Ask Mia"
        >
          <MessageCircle className="h-5 w-5" />
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary"
            aria-hidden="true"
          />
        </button>
      )}
    </>
  );
}
