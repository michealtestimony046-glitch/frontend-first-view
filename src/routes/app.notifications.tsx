import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Loader2, RefreshCw, Smartphone } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { notificationsApi, type NotificationItem } from "@/lib/api-client";
import { enrollBrowserPush, removeBrowserPush } from "@/lib/push-notifications";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Matrix QA" }, { name: "robots", content: "noindex" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pushConfigured, setPushConfigured] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

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

  useEffect(() => {
    let active = true;
    void load();
    notificationsApi.pushCapabilities().then(async (capabilities) => {
      if (!active) return;
      setPushConfigured(capabilities.enabled);
      if (capabilities.enabled && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        if (active) setPushSubscribed(Boolean(subscription));
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const enablePush = async () => {
    setPushBusy(true);
    setPushMessage("");
    const result = await enrollBrowserPush();
    setPushBusy(false);
    setPushSubscribed(result.status === "subscribed");
    setPushMessage(result.status === "subscribed" ? "Browser push is enabled on this device." : result.reason || "Browser push is not available right now.");
  };

  const disablePush = async () => {
    setPushBusy(true);
    setPushMessage("");
    try {
      await removeBrowserPush();
      setPushSubscribed(false);
      setPushMessage("Browser push is disabled on this device.");
    } catch (cause) {
      setPushMessage(cause instanceof Error ? cause.message : "Browser push could not be disabled.");
    } finally {
      setPushBusy(false);
    }
  };

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
    {pushConfigured && <section className="surface-card mt-6 flex flex-wrap items-center justify-between gap-4 px-5 py-4" aria-labelledby="push-notifications-title">
      <div className="flex min-w-0 items-start gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Smartphone className="h-4 w-4" /></div><div><h2 id="push-notifications-title" className="text-sm font-semibold">Browser push</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Get important Matrix QA updates on this device. Email and in-app notifications remain available.</p>{pushMessage && <p className="mt-1 text-xs text-primary" aria-live="polite">{pushMessage}</p>}</div></div>
      {pushSubscribed ? <button type="button" onClick={() => void disablePush()} disabled={pushBusy} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-40">{pushBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Disable on this device</button> : <button type="button" onClick={() => void enablePush()} disabled={pushBusy} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40">{pushBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Enable browser push</button>}
    </section>}
    <section className="surface-card mt-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-display text-base font-semibold">Inbox</h2><p className="mt-1 text-xs text-muted-foreground">{unread ? `${unread} unread update${unread === 1 ? "" : "s"}` : "You are all caught up"}</p></div></div>
      {loading ? <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…</div> : items.length === 0 ? <div className="p-8 text-sm text-muted-foreground">No notifications yet. Allocation decisions and account activity will appear here.</div> : <div className="divide-y divide-border">{items.map((item) => <article key={item.id} className={`flex gap-3 px-5 py-4 ${item.readAt ? "" : "bg-primary/5"}`}><div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.readAt ? "bg-surface-2 text-muted-foreground" : "bg-primary/15 text-primary"}`}><Bell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-sm font-medium">{item.title}</h3><time className="text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</time></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.message}</p>{!item.readAt && <button type="button" onClick={() => void markRead(item.id)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Check className="h-3.5 w-3.5" /> Mark read</button>}</div></article>)}</div>}
    </section>
  </div>;
}
