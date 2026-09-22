const CACHE_NAME = "sa-ed-dashboard-v2";
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

  // Network-first, falling back to cache only when offline. Cache-first
  // here would serve a stale app shell referencing a previous deployment's
  // content-hashed JS chunk filenames after a new build ships — those
  // chunks are gone, so the page 404s on every script and never mounts.
  // Confirmed hitting exactly this while testing a rebuild locally.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
