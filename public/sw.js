// Biomo Review - Enhanced Service Worker
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `biomo-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `biomo-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `biomo-images-${CACHE_VERSION}`;

// Static assets to precache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Cache strategies by resource type
const STRATEGIES = {
  // Static assets: Cache-first
  static: [
    '/_next/static/',
    '/icons/',
    '/fonts/',
    '.woff',
    '.woff2',
  ],
  // Images: Cache-first with expiration
  images: [
    '/screenshots/',
    'storage.googleapis.com',
    'firebasestorage.googleapis.com',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.svg',
  ],
  // API: Network-first
  api: [
    '/api/',
  ],
  // HTML pages: Network-first with cache fallback
  pages: [
    '/',
    '/admin',
    '/metricas',
    '/login',
  ],
};

// Check if URL matches patterns
function matchesPatterns(url, patterns) {
  return patterns.some(pattern => url.includes(pattern));
}

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('biomo-') &&
                     name !== STATIC_CACHE &&
                     name !== DYNAMIC_CACHE &&
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - route requests to appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.startsWith('http')) return;

  // API requests: Network-first (don't cache)
  if (matchesPatterns(url, STRATEGIES.api)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets: Cache-first
  if (matchesPatterns(url, STRATEGIES.static)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Images: Cache-first with separate cache
  if (matchesPatterns(url, STRATEGIES.images)) {
    event.respondWith(cacheFirstWithExpiration(request, IMAGE_CACHE, 7 * 24 * 60 * 60 * 1000)); // 7 days
    return;
  }

  // Everything else: Network-first with cache fallback
  event.respondWith(networkFirstWithCache(request, DYNAMIC_CACHE));
});

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Cache-first with expiration
async function cacheFirstWithExpiration(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const dateHeader = cachedResponse.headers.get('date');
    if (dateHeader) {
      const cachedDate = new Date(dateHeader).getTime();
      const now = Date.now();
      if (now - cachedDate < maxAge) {
        return cachedResponse;
      }
    } else {
      // No date header, return cached anyway
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    console.log('[SW] Cache-first with expiration failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy (for API calls)
async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Network-first failed, no fallback for API:', error);
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Network-first with cache fallback
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-feedbacks') {
    event.waitUntil(syncPendingFeedbacks());
  }
});

// Sync pending feedbacks from IndexedDB
async function syncPendingFeedbacks() {
  console.log('[SW] Syncing pending feedbacks...');
  // This would be implemented with IndexedDB storage
  // For now, just log the attempt
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }

  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.startsWith('biomo-')) {
          caches.delete(name);
        }
      });
    });
  }
});

// Notify clients about updates
self.addEventListener('controllerchange', () => {
  console.log('[SW] Controller changed, notifying clients...');
});

console.log('[SW] Service Worker loaded, version:', CACHE_VERSION);
