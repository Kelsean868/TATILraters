// TATIL Insurance Raters - Simplified Service Worker
// This version provides basic caching without complex fallback strategies

const CACHE_NAME = 'tatil-raters-v2.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install event - cache basic files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event - network first with cache fallback strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Make a copy of the response
        const responseClone = response.clone();

        // Open the cache
        caches.open(CACHE_NAME)
          .then((cache) => {
            // Only cache successful responses
            if (response.status === 200) {
              // Add the response to the cache
              cache.put(event.request, responseClone);
            }
          });

        return response;
      })
      .catch(() => {
        // If network fails, try to get from cache
        return caches.match(event.request);
      })
  );
});
