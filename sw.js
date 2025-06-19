// This is the service worker script (sw.js)

// Define a unique name for your cache. 
// It's a good practice to include a version number.
// If you update any of your site's files, you should increment this version number.
const CACHE_NAME = 'tatil-raters-cache-v1.1';

// This is the list of all the files that make up your app's "shell".
// We will cache all of these upon installation.
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'motor_rater.html',
  'health_rater.html',
  'motor_rater_data.js',
  'health_rater_data.js',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Source+Serif+Pro:wght@600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
];

// --- INSTALL Event ---
// This event is fired when the service worker is first installed.
// We open our cache and add all the app shell files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// --- ACTIVATE Event ---
// This event is fired when the service worker is activated.
// This is a good place to clean up old caches to remove outdated files.
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
});

// --- FETCH Event ---
// This event is fired for every single request the page makes (e.g., for CSS, images, data).
// We'll intercept these requests and serve files from the cache if they are available.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If the request is in the cache, return the cached response.
        if (response) {
          return response;
        }

        // If the request is not in the cache, fetch it from the network.
        return fetch(event.request).then(
          networkResponse => {
            // We can also cache new requests as they are made,
            // but for this app, pre-caching is sufficient.
            return networkResponse;
          }
        );
      })
  );
});
