/*
 * Deliberately minimal service worker.
 *
 * It caches nothing except the offline fallback page. Caching HTML, API responses or
 * dashboard routes would risk showing stale wallet balances, order data or another
 * customer's cached page, so every request still goes to the network first.
 */
const OFFLINE_URL = "/offline.html";
const OFFLINE_CACHE = "trustify-offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== OFFLINE_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  /* Only top-level navigations get a fallback; never intercept API or asset calls. */
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(OFFLINE_CACHE);
      const cached = await cache.match(OFFLINE_URL);
      return cached || new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } });
    }),
  );
});
