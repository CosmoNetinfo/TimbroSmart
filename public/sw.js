const CACHE_NAME = 'easy-employee-v4';
const urlsToCache = [
    '/manifest.json',
    '/pwa-icon-192.png',
    '/pwa-icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

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
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (!event.request.url.startsWith(self.location.origin)) return;

    if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
        return; 
    }

    // Force network for navigation to ensure fresh CSS/Layout
    if (event.request.mode === 'navigate') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(error => {
                console.warn('Fetch event failed inside PWA ServiceWorker:', error);
                // Return a basic fallback response instead of failing
                return new Response('Network error occurred', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({ 'Content-Type': 'text/plain' })
                });
            })
    );
});

// End of fetch logic

