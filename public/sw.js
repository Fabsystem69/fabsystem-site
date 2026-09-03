const CACHE_NAME = "fabsystem-editor-static-v1";

// Ne met jamais en cache les pages HTML ni les API: elles transportent des
// sessions et des droits qui doivent rester frais. Le cache améliore seulement
// le chargement des ressources versionnées de l'éditeur quand le réseau varie.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || request.mode === "navigate" || url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/schema-icons/"))) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached ?? Response.error());
      return cached ?? network;
    })
  );
});
