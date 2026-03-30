// PV ROI Calculator Service Worker
// Ermöglicht Offline-Funktionalität und Caching

const CACHE_NAME = 'pv-roi-calculator-v1';
const CACHE_ASSETS = [
    './',
    './pv-roi-calculator.html',
    './pv-roi-calculator-manifest.json',
    './pv-roi-calculator-sw.js'
];

// Installation - Cache wichtige Dateien
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app files');
                return cache.addAll(CACHE_ASSETS);
            })
            .catch((error) => {
                console.error('[SW] Cache failed:', error);
            })
    );
    self.skipWaiting();
});

// Activation - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
    self.clients.claim();
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip non-http(s) requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        // Try network first
        fetch(event.request)
            .then((response) => {
                // Clone response because it can only be used once
                const clonedResponse = response.clone();

                // Cache successful responses
                if (response.status === 200) {
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, clonedResponse);
                        });
                }

                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            console.log('[SW] Using cached response for:', event.request.url);
                            return cachedResponse;
                        }

                        // Return offline page if available
                        if (event.request.mode === 'navigate') {
                            return caches.match('./pv-roi-calculator.html');
                        }

                        return new Response('Offline - Resource not cached', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Message handling for cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME)
            .then(() => {
                console.log('[SW] Cache cleared');
                event.ports[0].postMessage({ success: true });
            });
    }
});

// Background sync for future features
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-results') {
        event.waitUntil(
            // Placeholder for future sync functionality
            Promise.resolve()
        );
    }
});

// Periodic background sync (optional)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', (event) => {
        if (event.tag === 'update-check') {
            // Check for app updates
            console.log('[SW] Periodic sync - checking for updates');
        }
    });
}

console.log('[SW] Service Worker loaded');
