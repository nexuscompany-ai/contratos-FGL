// Service Worker do FGL Contratos — recebe Web Push e abre o contrato
// correspondente ao tocar na notificação. Sem cache/offline neste momento:
// escopo único, focado em push confiável.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "FGL Rastreamento", body: event.data.text() };
  }

  const title = payload.title || "FGL Rastreamento";
  const options = {
    body: payload.body || "",
    icon: "/apple-touch-icon.png",
    badge: "/favicon.png",
    tag: payload.tag || "fgl-notificacao",
    data: { url: payload.url || "/" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const absoluteUrl = new URL(url, self.location.origin).href;

      for (const client of clientList) {
        if (client.url === absoluteUrl && "focus" in client) {
          return client.focus();
        }
      }

      for (const client of clientList) {
        if ("focus" in client && "navigate" in client) {
          return client.focus().then(() => client.navigate(absoluteUrl));
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl);
      }
    })
  );
});
