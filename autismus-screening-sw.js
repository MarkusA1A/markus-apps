// Service Worker für Autismus-Screening PWA
const CACHE_NAME = 'autismus-screening-v1';
const ASSETS = [
  'autismus-screening.html',
  'autismus-screening-manifest.json'
];

// Install event - cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('Cache failed for some assets:', err);
        // Continue even if some assets fail
        return Promise.resolve();
      });
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - Cache-First strategy with network fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }

      return fetch(event.request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response and cache it
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache).catch(err => {
            console.log('Cache put failed:', err);
          });
        });

        return response;
      }).catch(err => {
        // Offline - return cached version if available
        console.log('Fetch failed:', err);
        return caches.match(event.request);
      });
    })
  );
});

// Background sync for future use
self.addEventListener('sync', event => {
  if (event.tag === 'sync-test-data') {
    event.waitUntil(
      // Sync screening data if needed
      Promise.resolve()
    );
  }
});

// Message handler for cache control
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
