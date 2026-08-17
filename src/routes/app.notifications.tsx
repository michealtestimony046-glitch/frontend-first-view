import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { notificationsApi, type NotificationItem } from "@/lib/api-client";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Matrix QA" }, { name: "robots", content: "noindex" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await notificationsApi.list());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update notification.");
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to mark notifications read.");
    }
  };

  const unread = items.filter((item) => !item.readAt).length;

  return <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary"><Bell className="h-4 w-4" /> Activity center</div><h1 className="mt-2 font-display text-2xl font-semibold">Notifications</h1><p className="mt-1 text-sm text-muted-foreground">Live account, allocation, and Matrix QA system updates.</p></div>
      <div className="flex items-center gap-2"><button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button><button type="button" onClick={() => void markAllRead()} disabled={unread === 0} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium disabled:opacity-40 hover:bg-accent"><CheckCheck className="h-3.5 w-3.5" /> Mark all read</button></div>
    </div>
    {error && <div className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    <section className="surface-card mt-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-display text-base font-semibold">Inbox</h2><p className="mt-1 text-xs text-muted-foreground">{unread ? `${unread} unread update${unread === 1 ? "" : "s"}` : "You are all caught up"}</p></div></div>
      {loading ? <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…</div> : items.length === 0 ? <div className="p-8 text-sm text-muted-foreground">No notifications yet. Allocation decisions and account activity will appear here.</div> : <div className="divide-y divide-border">{items.map((item) => <article key={item.id} className={`flex gap-3 px-5 py-4 ${item.readAt ? "" : "bg-primary/5"}`}><div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.readAt ? "bg-surface-2 text-muted-foreground" : "bg-primary/15 text-primary"}`}><Bell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-sm font-medium">{item.title}</h3><time className="text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</time></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.message}</p>{!item.readAt && <button type="button" onClick={() => void markRead(item.id)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Check className="h-3.5 w-3.5" /> Mark read</button>}</div></article>)}</div>}
    </section>
  </div>;
}
