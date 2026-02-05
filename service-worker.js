const CACHE_NAME = 'math-rush-v5.0'; // Subimos a 5.0 para limpiar todo
const STATIC_CACHE = 'static-' + CACHE_NAME;

const staticAssets = [
  './',
  './index.html',
  './main-index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './iconkid.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(staticAssets))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== STATIC_CACHE ? caches.delete(key) : null)
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Si la respuesta es buena y no es una redirección, la devolvemos
        return networkResponse;
      })
      .catch(() => {
        // Si falla la red (offline), intentamos buscar en la caché
        return caches.match(event.request);
      })
  );
});
