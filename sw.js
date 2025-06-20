// This is the service worker script (sw.js)

// Define a unique name for your cache. 
// Increment this version number when you update any of the cached files.
const CACHE_NAME = 'tatil-rater-hub-cache-v1.1'; // <-- Incremented version

// This is the complete list of all the files that make up your app.
// The service worker will cache all of these upon installation.
const URLS_TO_CACHE = [
  './',
  './index.html',
  './motor_rater.html',
  './health_rater.html',
  './property_rater.html', // <-- Added new rater html
  './motor_rater_data.js',
  './health_rater_data.js',
  './property_rater_data.js', // <-- Added new rater data
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Source+Serif+Pro:wght@600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
];

// --- INSTALL Event ---
// Fired when the service worker is first installed.
// We open our cache and add all the app shell files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching all app files');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// --- ACTIVATE Event ---
// Fired when the service worker is activated.
// This is where we clean up old, unused caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // If a cache's name is not our current CACHE_NAME, we delete it.
          if (cacheName !== CACHE_NAME) {
            console.log('Service worker: clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// --- FETCH Event ---
// Fired for every network request. We use a "Cache first, then network" strategy.
// This makes the app load instantly from the cache if available.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If we find a match in the cache, return it.
        if (response) {
          return response;
        }
        // Otherwise, fetch the request from the network.
        return fetch(event.request);
      })
  );
});
