/* ============================================================
   Service Worker for TìmSân PWA
   - Caches static assets (App Shell)
   - Network-first for API calls
   - Cache-first for static files (images, fonts, JS, CSS)
   ============================================================ */

const CACHE_NAME = 'timsanvn-v1';
const APP_SHELL = [
    '/',
    '/index.html',
    '/static/js/bundle.js',
    '/manifest.json',
];

// ── Install: pre-cache app shell ──────────────────────────────
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching App Shell');
            return cache.addAll(APP_SHELL).catch((err) => {
                console.warn('[SW] Some App Shell resources failed to cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────────
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            )
        )
    );
    self.clients.claim();
});

// ── Fetch: strategy per request type ─────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') return;

    // ── API calls → Network First (always fresh data) ──────────
    if (url.pathname.startsWith('/api/') || url.port === '5000') {
        event.respondWith(
            fetch(request)
                .then((response) => response)
                .catch(() => {
                    // Offline fallback for API
                    return new Response(
                        JSON.stringify({ error: 'Bạn đang offline. Vui lòng kiểm tra kết nối.' }),
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                })
        );
        return;
    }

    // ── Google Fonts → Cache First ─────────────────────────────
    if (url.origin === 'https://fonts.googleapis.com' ||
        url.origin === 'https://fonts.gstatic.com') {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // ── Static Assets (JS, CSS, images) → Cache First ──────────
    if (
        url.pathname.startsWith('/static/') ||
        url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?|ttf)$/)
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (!response || response.status !== 200) return response;
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // ── HTML Navigation → Network First, fallback to index.html ─
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request).catch(() => caches.match('/index.html'))
        );
        return;
    }
});

// ── Background Sync (future use) ─────────────────────────────
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
});

// ── Push Notifications (future use) ──────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;
    const data = event.data.json();
    const options = {
        body: data.body || 'Có thông báo mới từ TìmSân',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' },
    };
    event.waitUntil(
        self.registration.showNotification(data.title || 'TìmSân', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
    );
});
