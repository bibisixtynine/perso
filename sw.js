const CACHE_NAME = 'chromaphonie-v16';
const APP_ASSETS = [
  './',
  './index.html',
  './app.js',
  './config.js',
  './Bloop.js',
  './Melo.js',
  './Grizz.js',
  './Pico.js',
  './Nova.js',
  './Rocket.js',
  './Missile.js',
  './Explosion.js',
  './SplitFragment.js',
  './SplitDebris.js',
  './MiniCharacter.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
