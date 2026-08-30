const CACHE_VERSION = 'ita-shell-2026-08-30-v1';
const OFFLINE_URL = new URL('./offline.html', self.registration.scope).href;
const CORE_URLS = [
  new URL('./', self.registration.scope).href,
  OFFLINE_URL,
  new URL('./manifest.json', self.registration.scope).href,
  new URL('./images/icon-192x192.png', self.registration.scope).href,
  new URL('./images/icon-512x512.png', self.registration.scope).href
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE_URLS)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_VERSION).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_VERSION);
        event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      }
      return response;
    } catch {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      if (request.mode === 'navigate') return (await caches.match(OFFLINE_URL)) || Response.error();
      return Response.error();
    }
  })());
});
