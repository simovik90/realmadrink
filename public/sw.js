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
