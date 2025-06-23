// sw.js

// By including a timestamp, we ensure the browser sees this as a new
// service worker file every time it's deployed. This triggers the update process.
const CACHE_NAME = 'tatil-rater-hub-cache-v1.2.1'; 
const PRECACHE_URLS = [
  './',
  './index.html',
  './motor_rater.html',
  './health_rater.html',
  './property_rater.html', 
  './motor_rater_data.js',
  './health_rater_data.js',
  './property_rater_data.js',
  './manifest.json',
  // External assets that are unlikely to change can also be precached.
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Source+Serif+Pro:wght@600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// --- INSTALL Event ---
// This event is fired when a new service worker is installed.
// It opens a new cache and adds all the essential app files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // By calling skipWaiting(), the new service worker activates immediately
        // once it's finished installing, rather than waiting for the user to close all tabs.
        // This is a more aggressive but effective update strategy.
        self.skipWaiting(); 
      })
  );
});

// --- ACTIVATE Event ---
// This event is fired when the new service worker is activated.
// This is the ideal place to clean up old, unused caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // If a cache's name is not our current CACHE_NAME, we delete it.
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Tells the service worker to take control of the page immediately.
        return self.clients.claim();
    })
  );
});

// --- FETCH Event ---
// This event is fired for every network request from the app.
// It uses a "Cache falling back to network" strategy.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If we find a match in the cache, we return it.
        // Otherwise, we fetch the request from the network.
        return response || fetch(event.request);
      })
  );
});
