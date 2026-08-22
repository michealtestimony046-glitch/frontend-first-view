self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }
  const title = typeof payload.title === "string" ? payload.title : "Matrix QA";
  const options = {
    body: typeof payload.body === "string" ? payload.body : "You have a new Matrix QA notification.",
    icon: "/matrixqa-icon.svg",
    badge: "/matrixqa-icon.svg",
    tag: typeof payload.type === "string" ? `matrixqa-${payload.type}` : "matrixqa-notification",
    data: { url: typeof payload.url === "string" ? payload.url : "/app/notifications" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || "/app/notifications", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        return existing.navigate(destination).then((client) => client.focus());
      }
      return self.clients.openWindow(destination);
    }),
  );
});
