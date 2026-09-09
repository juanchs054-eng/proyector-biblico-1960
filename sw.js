// Proyector Bíblico RV — Service Worker
// IMPORTANTE: cada vez que subas cambios a index.html, biblia-datos.js,
// manifest.json o los íconos, sube también este sw.js subiendo el número
// de versión de abajo (v1.0 -> v1.1 -> v1.2 ...). Eso hace que todos los
// que ya tienen la app instalada reciban la actualización automáticamente,
// sin tener que borrar el caché del teléfono.
const CACHE_VERSION = 'v2.1';
const CACHE_NAME = 'proyector-biblico-' + CACHE_VERSION;

const CORE_FILES = [
  './',
  './index.html',
  './biblia-datos.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: guarda en caché los archivos principales de la app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES))
  );
  self.skipWaiting(); // activa la nueva versión de inmediato
});

// Activación: borra cachés de versiones viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim(); // toma control de la app sin recargar dos veces
});

// Fetch: sirve desde caché primero (offline-first), y si no está,
// va a la red y guarda una copia para la próxima vez.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          // Sin internet y sin caché: si es una navegación de página,
          // muestra al menos el index.html guardado.
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
