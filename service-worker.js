// service-worker.js
const CACHE_NAME = 'math-rush-v2.6'; // <--- CAMBIA ESTE NÚMERO EN CADA ACTUALIZACIÓN
const STATIC_CACHE = 'static-' + CACHE_NAME;
const DYNAMIC_CACHE = 'dynamic-' + CACHE_NAME;

// 🔧 LISTA ACTUALIZADA - RECURSOS PARA CACHEAR
const staticAssets = [
  '/',  
  '/index.html',
  '/manifest.json',
  '/1Sumasmovil.html',
  '/2Restasmovil.html',
  '/3Sumas20movil.html',
  '/4Tablas1a5.html',
  '/5Tablas6a9.html',
  '/6Tablas1al10movil.html',
  '/7Divisiones1a5.html',
  '/8Divisiones6a9.html',
  '/9Divisiones1a10.html',
  '/10Sumasyrestas.html',
  '/11Operacionescombinadas5.html',
  '/12Sumayrestanegativo.html',
  '/13Sumasyrestasdificil.html',
  '/privacy-policy.html',
  '/terms-of-service.html',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalación: Guarda los archivos en la memoria del dispositivo
self.addEventListener('install', event => {
  console.log('🚀 Service Worker instalando v2.6...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return Promise.all(
          staticAssets.map(asset => {
            return cache.add(asset).catch(error => {
              console.warn(`⚠️ No se pudo cachear ${asset}:`, error.message);
            });
          })
        );
      })
      .then(() => self.skipWaiting()) // Fuerza a que el nuevo SW se active sin esperar
  );
});

// Activación: Borra las versiones viejas de la caché
self.addEventListener('activate', event => {
  console.log('⚡ Service Worker v2.6 activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma el control de la web inmediatamente
  );
});

// Estrategia de búsqueda: Intenta buscar en caché, si no está, va a internet
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch(() => {
            // Fallback: Si no hay internet y es una página, muestra el index
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Escuchar mensajes para forzar la actualización inmediata
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
