var CACHE_NAME = 'v0.14';

var urlsToCache = [
  '.',
  '/index.html',
  '/script-min.js',
  '/style-min.css',
  '/script.js',
  '/style.css',

  '/lib/confetti.js',
  '/lib/web-animations.min.js',
  '/lib/navigo.min.js',

  '/media/plus.svg',
  '/media/edit.svg',
  '/media/trash.svg',
  '/media/discount.svg',
  '/media/back.svg',
  '/media/dislike.svg',
  '/media/user-circle.svg',
  '/media/profile-pic.jpg',
  '/media/congratulations.gif',

  '/site.webmanifest',
  '/sw.js',

  '/icons/favicon.ico',
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/android-chrome-192x192.png',

  'https://fonts.googleapis.com/css?family=Nunito:300,400,700'
];

self.addEventListener('install', (event) => {
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
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});