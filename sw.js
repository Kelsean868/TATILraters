/**
 * TATIL Insurance Raters - Service Worker
 * Provides offline caching and network optimization for mobile data connections
 * Version: 2.0
 */

const CACHE_NAME = 'tatil-raters-v2.0';
const CACHE_VERSION = '2.0';

// Resources to cache for offline functionality
const CACHE_RESOURCES = [
    './',
    './index.html',
    './js/resource-loader.min.js',
    './js/tatil-raters.min.js',
    './css/rater-styles.min.css',
    './manifest.json',
    './ping.json'
];

// Dynamic cache for API responses and user data
const DYNAMIC_CACHE = 'tatil-dynamic-v2.0';

// CDN resources that should be cached
const CDN_CACHE = 'tatil-cdn-v2.0';

self.addEventListener('install', event => {
    console.log('[SW] Install event');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell');
                return cache.addAll(CACHE_RESOURCES);
            })
            .then(() => {
                console.log('[SW] App shell cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Error caching app shell:', error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] Activate event');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            // Delete old versions of our caches
                            return (cacheName.startsWith('tatil-') && 
                                   cacheName !== CACHE_NAME && 
                                   cacheName !== DYNAMIC_CACHE && 
                                   cacheName !== CDN_CACHE);
                        })
                        .map(cacheName => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Old caches deleted');
                return self.clients.claim();
            })
    );
});

self.addEventListener('fetch', event => {
    const requestURL = new URL(event.request.url);

    // Handle different types of requests with appropriate strategies
    if (requestURL.origin === location.origin) {
        // Same-origin requests: Use cache-first for static resources
        if (isStaticResource(event.request.url)) {
            event.respondWith(cacheFirstStrategy(event.request));
        } else {
            // Network-first for dynamic content
            event.respondWith(networkFirstStrategy(event.request));
        }
    } else if (requestURL.hostname === 'cdn.jsdelivr.net') {
        // CDN requests: Use stale-while-revalidate
        event.respondWith(staleWhileRevalidateStrategy(event.request, CDN_CACHE));
    } else if (isAPIRequest(event.request.url)) {
        // API requests: Network-first with fallback
        event.respondWith(networkFirstStrategy(event.request, DYNAMIC_CACHE));
    } else {
        // Other external requests: Let them pass through
        return;
    }
});

/**
 * Check if the request is for a static resource
 */
function isStaticResource(url) {
    return url.includes('.js') || 
           url.includes('.css') || 
           url.includes('.png') || 
           url.includes('.jpg') || 
           url.includes('.jpeg') || 
           url.includes('.svg') || 
           url.includes('.ico') ||
           url.includes('.woff') ||
           url.includes('.woff2');
}

/**
 * Check if the request is for an API endpoint
 */
function isAPIRequest(url) {
    return url.includes('/api/') || 
           url.includes('.json') ||
           url.includes('ping.json');
}

/**
 * Cache-first strategy: Good for static resources
 * Try cache first, fallback to network if not found
 */
function cacheFirstStrategy(request) {
    return caches.match(request)
        .then(response => {
            if (response) {
                console.log('[SW] Serving from cache:', request.url);
                return response;
            }

            console.log('[SW] Fetching from network:', request.url);
            return fetch(request)
                .then(response => {
                    // Don't cache if response is not successful
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response because it can only be consumed once
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(request, responseToCache);
                        });

                    return response;
                })
                .catch(error => {
                    console.error('[SW] Network fetch failed:', error);

                    // Return a fallback response for critical resources
                    if (request.url.includes('.js')) {
                        return new Response('console.log("Offline fallback for JS");', {
                            headers: { 'Content-Type': 'application/javascript' }
                        });
                    } else if (request.url.includes('.css')) {
                        return new Response('/* Offline fallback for CSS */', {
                            headers: { 'Content-Type': 'text/css' }
                        });
                    }

                    throw error;
                });
        });
}

/**
 * Network-first strategy: Good for dynamic content
 * Try network first, fallback to cache if network fails
 */
function networkFirstStrategy(request, cacheName = DYNAMIC_CACHE) {
    return fetch(request)
        .then(response => {
            // Don't cache if response is not successful
            if (!response || response.status !== 200) {
                return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(cacheName)
                .then(cache => {
                    cache.put(request, responseToCache);
                });

            console.log('[SW] Served from network and cached:', request.url);
            return response;
        })
        .catch(error => {
            console.log('[SW] Network failed, trying cache:', request.url);

            return caches.match(request)
                .then(response => {
                    if (response) {
                        console.log('[SW] Served from cache (offline):', request.url);
                        return response;
                    }

                    // Return offline page or error response
                    if (request.destination === 'document') {
                        return caches.match('./index.html');
                    }

                    throw error;
                });
        });
}

/**
 * Stale-while-revalidate strategy: Good for CDN resources
 * Serve from cache immediately, update cache in background
 */
function staleWhileRevalidateStrategy(request, cacheName = CDN_CACHE) {
    return caches.open(cacheName)
        .then(cache => {
            return cache.match(request)
                .then(cachedResponse => {
                    // Start background fetch to update cache
                    const fetchPromise = fetch(request)
                        .then(response => {
                            if (response && response.status === 200) {
                                cache.put(request, response.clone());
                            }
                            return response;
                        })
                        .catch(error => {
                            console.error('[SW] Background fetch failed:', error);
                        });

                    // Return cached version immediately if available
                    if (cachedResponse) {
                        console.log('[SW] Served from cache (stale-while-revalidate):', request.url);
                        return cachedResponse;
                    }

                    // If no cached version, wait for network
                    console.log('[SW] Waiting for network (stale-while-revalidate):', request.url);
                    return fetchPromise;
                });
        });
}

/**
 * Handle background sync for offline actions
 */
self.addEventListener('sync', event => {
    if (event.tag === 'quote-request') {
        console.log('[SW] Background sync: quote-request');
        event.waitUntil(processOfflineQuotes());
    }
});

/**
 * Process offline quote requests when back online
 */
function processOfflineQuotes() {
    return getOfflineQuotes()
        .then(quotes => {
            return Promise.all(
                quotes.map(quote => {
                    return submitQuote(quote)
                        .then(() => removeOfflineQuote(quote.id))
                        .catch(error => {
                            console.error('[SW] Failed to submit offline quote:', error);
                        });
                })
            );
        });
}

/**
 * Get offline quotes from IndexedDB
 */
function getOfflineQuotes() {
    return new Promise((resolve) => {
        // Simplified - in real implementation would use IndexedDB
        resolve([]);
    });
}

/**
 * Submit quote to server
 */
function submitQuote(quote) {
    return fetch('/api/quotes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(quote)
    });
}

/**
 * Remove processed offline quote
 */
function removeOfflineQuote(quoteId) {
    // Implementation would remove from IndexedDB
    console.log('[SW] Removed offline quote:', quoteId);
}

/**
 * Handle push notifications
 */
self.addEventListener('push', event => {
    const options = {
        body: 'Your insurance quote is ready!',
        icon: './icon-192.png',
        badge: './badge-72.png',
        tag: 'quote-ready',
        data: {
            url: '/'
        },
        actions: [
            {
                action: 'view',
                title: 'View Quote'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };

    if (event.data) {
        const data = event.data.json();
        options.body = data.body || options.body;
        options.data = data.data || options.data;
    }

    event.waitUntil(
        self.registration.showNotification('TATIL Insurance', options)
    );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data && event.data.type === 'GET_CACHE_SIZE') {
        getCacheSize().then(size => {
            event.ports[0].postMessage({ cacheSize: size });
        });
    }
});

/**
 * Get total cache size for monitoring
 */
function getCacheSize() {
    return caches.keys()
        .then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    return caches.open(cacheName)
                        .then(cache => cache.keys())
                        .then(keys => keys.length);
                })
            );
        })
        .then(sizes => {
            return sizes.reduce((total, size) => total + size, 0);
        });
}

console.log('[SW] Service Worker script loaded');
