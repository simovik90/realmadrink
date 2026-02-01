// Service worker minimale per PWA "Aggiungi alla Home"
// Richiesto da Chrome/Android per considerare l'app installabile

const CACHE_NAME = "realmadrink-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Pass-through: tutte le richieste vanno in rete (nessuna cache offline)
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", function (event) {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const opts = {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
    };
    event.waitUntil(self.registration.showNotification(data.title || "RealMadrink", opts));
  } catch (_) {}
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url && "focus" in clientList[i]) {
          clientList[i].navigate(url);
          return clientList[i].focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
