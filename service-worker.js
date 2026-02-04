// service-worker.js
const CACHE_NAME = 'math-rush-v2.8'; // Incrementa esto cuando hagas cambios
const STATIC_CACHE = 'static-' + CACHE_NAME;
const DYNAMIC_CACHE = 'dynamic-' + CACHE_NAME;

// Solo los archivos críticos para que la PWA funcione offline
const staticAssets = [
  '/',  
  '/index.html',
  '/main-index.html',
  '/manifest.json',
  '/privacy-policy.html',
  '/terms-of-service.html',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalación
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll(staticAssets);
      })
      .then(() => self.skipWaiting()) 
  );
});

// Activación y limpieza
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Caché primero, luego Red (y guardar en dinámica)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then(networkResponse => {
          // Guardar automáticamente páginas visitadas en la caché dinámica
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
