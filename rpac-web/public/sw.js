// Service Worker for RPAC Performance Optimization
const CACHE_NAME = 'rpac-v2';
const STATIC_CACHE = 'rpac-static-v2';
const DYNAMIC_CACHE = 'rpac-dynamic-v2';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/local',
  '/individual',
  '/settings',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-96x96.png',
  '/favicon-tp-bg.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/logga-beready.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Determine cache strategy
            if (isStaticAsset(request.url)) {
              // Cache static assets for a long time
              caches.open(STATIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            } else if (isAPIRequest(request.url)) {
              // Cache API responses for a shorter time
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Helper functions
function isStaticAsset(url) {
  return url.includes('/static/') || 
         url.includes('/_next/static/') ||
         url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);
}

function isAPIRequest(url) {
  return url.includes('/api/') || 
         url.includes('supabase.co/rest/v1/');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline actions when back online
  console.log('Performing background sync');
  // Implementation for syncing offline data
}