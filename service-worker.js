// service-worker.js
const CACHE_NAME = 'math-rush-v4.0'; // Incrementado a 4.0 para forzar la actualización limpia
const STATIC_CACHE = 'static-' + CACHE_NAME;
const DYNAMIC_CACHE = 'dynamic-' + CACHE_NAME;

// Archivos críticos para funcionamiento básico y offline
const staticAssets = [
  './',  
  './index.html',
  './main-index.html',
  './manifest.json',
  './privacy-policy.html',
  './terms-of-service.html',
  './icon-192.png',
  './icon-512.png',
  './iconkid.jpg' 
];

// 1. Instalación: Guardar archivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('✅ Precargando recursos estáticos');
        // Usamos rutas relativas para evitar problemas con redirecciones de dominio
        return cache.addAll(staticAssets);
      })
      .then(() => self.skipWaiting()) 
  );
});

// 2. Activación: Limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Estrategia Fetch: Manejo de Redirecciones y Seguridad
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        
        // --- SOLUCIÓN AL ERROR DE REDIRECCIÓN ---
        // Si la respuesta fue redireccionada, la devolvemos tal cual.
        // Chrome bloquea el guardado en caché de respuestas redireccionadas por seguridad.
        if (networkResponse.redirected) {
          return networkResponse;
        }

        // --- VALIDACIÓN DE SEGURIDAD ---
        // Solo guardamos si es una respuesta exitosa y de nuestro propio origen (basic).
        // Esto evita que el SW se "pille" con recursos de terceros (Google Fonts, CDNs).
        if (
          !networkResponse || 
          networkResponse.status !== 200 || 
          networkResponse.type !== 'basic'
        ) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Soporte offline para navegación principal
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
