var CACHE_NAME = 'v0.05';

var urlsToCache = [
  '.',
  '/index.html',
  '/script.js',
  '/style.css',

  '/lib/confetti.js',

  '/media/plus.svg',
  '/media/edit.svg',
  '/media/trash.svg',
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

  'https://fonts.googleapis.com/css?family=Nunito:300,400,700',
  'https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName != CACHE_NAME;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});