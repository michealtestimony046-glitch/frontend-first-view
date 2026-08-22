import { notificationsApi } from "./api-client";

export type PushEnrollmentResult =
  | { status: "subscribed" }
  | { status: "disabled" | "unsupported" | "denied" | "unavailable"; reason?: string };

function decodeVapidKey(value: string) {
  const normalized = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=").replace(/-/g, "+").replace(/_/g, "/");
  const binary = window.atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function subscriptionPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return null;
  return {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    userAgent: navigator.userAgent.slice(0, 512),
  };
}

export async function enrollBrowserPush(): Promise<PushEnrollmentResult> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { status: "unsupported", reason: "This browser does not support web push." };
  }

  let capabilities;
  try {
    capabilities = await notificationsApi.pushCapabilities();
  } catch (cause) {
    return { status: "unavailable", reason: cause instanceof Error ? cause.message : "Push capability could not be checked." };
  }
  if (!capabilities.enabled || !capabilities.publicKey) return { status: "disabled", reason: "Push delivery is not configured for this deployment." };

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied", reason: "Browser notification permission was not granted." };

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(capabilities.publicKey) });
    }
    const payload = subscriptionPayload(subscription);
    if (!payload) return { status: "unavailable", reason: "The browser returned an incomplete push subscription." };
    await notificationsApi.upsertPushSubscription(payload);
    return { status: "subscribed" };
  } catch (cause) {
    return { status: "unavailable", reason: cause instanceof Error ? cause.message : "Push enrollment could not be completed." };
  }
}

export async function removeBrowserPush(endpoint?: string) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  const target = endpoint || subscription?.endpoint;
  if (!target) return;
  await notificationsApi.deletePushSubscription(target);
  if (subscription) await subscription.unsubscribe();
}
