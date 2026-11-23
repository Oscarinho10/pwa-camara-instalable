/* =========================================================
   SERVICE WORKER BÁSICO - ESTRATEGIA CACHE FIRST
   Precarga el shell de la aplicación y responde primero
   desde caché; si no existe, cae a la red.
   ========================================================= */
const NOMBRE_CACHE = 'inspeccion-pwa-v1';
const ARCHIVOS_PRECACHE = [
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// INSTALL: precachea todos los archivos del shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(NOMBRE_CACHE)
            .then((cache) => cache.addAll(ARCHIVOS_PRECACHE))
    );
});

// ACTIVATE: elimina versiones antiguas de la caché
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((claves) => Promise.all(
                claves
                    .filter((clave) => clave !== NOMBRE_CACHE)
                    .map((clave) => caches.delete(clave))
            ))
    );
});

// FETCH: Cache First
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((respuestaCache) => respuestaCache || fetch(event.request))
    );
});
