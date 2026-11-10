var CACHE_NAME = 'v0.27.0';

var urlsToCache = [
  '/',
  'index.html',
  'scripts/script.min.js',
  'styles/main.min.css',

  'lib/confetti.js',
  'lib/web-animations.min.js',
  'lib/navigo.min.js',
  'scripts/libs.min.js',

  'media/plus.svg',
  'media/edit.svg',
  'media/trash.svg',
  'media/discount.svg',
  'media/back.svg',
  'media/user-circle.svg',
  'media/profile-pic.jpg',
  'media/gift_jump_once.gif',

  'site.webmanifest',

  'icons/favicon.ico',
  'icons/favicon-16x16.png',
  'icons/favicon-32x32.png',
  'icons/android-chrome-192x192.png',
  'icons/android-chrome-512x512.png',
  'icons/maskable_icon_192.png',
  'icons/maskable_icon_512.png',
  'icons/safari-pinned-tab.svg',

  'https://fonts.googleapis.com/css?family=Nunito:300,400,700'
];

self.addEventListener('install', (event) => {
  // Take over right away instead of waiting for every open tab/app window to close.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName != CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network first, cache as offline fallback.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  // GitHub Pages lets browsers reuse files for 10 minutes without checking, so after a
  // deploy the app kept running old scripts. Revalidate our own files (304 if unchanged).
  const isOwnFile =
    request.method === 'GET' &&
    request.mode !== 'navigate' &&
    new URL(request.url).origin === self.location.origin;
  event.respondWith(
    fetch(isOwnFile ? new Request(request, { cache: 'no-cache' }) : request).catch(() => {
      return caches.match(request);
    })
  );
});
