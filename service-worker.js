// service-worker.js
const CACHE_NAME = 'math-rush-v3.1'; // Incrementado a 3.1 para forzar la actualización
const STATIC_CACHE = 'static-' + CACHE_NAME;
const DYNAMIC_CACHE = 'dynamic-' + CACHE_NAME;

// Archivos críticos para funcionamiento básico y offline
const staticAssets = [
  '/',  
  '/index.html',
  '/main-index.html',
  '/manifest.json',
  '/privacy-policy.html',
  '/terms-of-service.html',
  '/icon-192.png',
  '/icon-512.png',
  'iconkid.jpg' // Añadido porque es el fondo de tu web
];

// 1. Instalación: Guardar archivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('✅ Precargando recursos estáticos');
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

// 3. Estrategia Fetch: Caché primero, luego Red (con validación de seguridad)
self.addEventListener('fetch', event => {
  // Solo procesar peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Si está en caché, lo devolvemos inmediatamente
      if (cachedResponse) return cachedResponse;

      // Si no está, vamos a la red
      return fetch(event.request).then(networkResponse => {
        
        // --- VALIDACIÓN DE SEGURIDAD PARA CHROME ---
        // Solo guardamos en caché si la respuesta es válida (status 200)
        // y si el recurso es de nuestro propio dominio (type === 'basic').
        // Esto evita errores de "Opaque Response" con CDNs externos.
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
        // Si falla la red (offline) y es una navegación, mostrar la home
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
