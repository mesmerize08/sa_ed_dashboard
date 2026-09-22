const CACHE_NAME = "sa-ed-dashboard-v1";
const APP_SHELL = ["/", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Hospital data must always be fresh — never serve API calls from cache.
  if (request.url.includes("/api/")) return;

  event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
});
