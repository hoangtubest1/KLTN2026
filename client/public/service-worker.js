/*
  Service Worker for CRA-based PWA
  - Precache minimal shell
  - Network-first for API and HTML navigation
  - Stale-while-revalidate for static assets
*/

const SW_VERSION = 'v2';
const STATIC_CACHE = `timsan-static-${SW_VERSION}`;
const RUNTIME_CACHE = `timsan-runtime-${SW_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/72.png',
  '/icons/192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

const isHtmlNavigation = (request) => request.mode === 'navigate';

const isApiRequest = (url) => {
  if (url.pathname.startsWith('/api/')) return true;
  if (url.origin !== self.location.origin && url.pathname.includes('/api/')) return true;
  return false;
};

const isStaticAsset = (request, url) => {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/static/')) return true;
  return ['script', 'style', 'image', 'font', 'worker'].includes(request.destination);
};

async function networkFirst(request, cacheName, fallbackResponse) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || fallbackResponse;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  return cached || networkPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol === 'chrome-extension:') return;

  if (isApiRequest(url)) {
    event.respondWith(
      networkFirst(
        request,
        RUNTIME_CACHE,
        new Response(
          JSON.stringify({ error: 'Bạn đang offline. Vui lòng kiểm tra kết nối.' }),
          { headers: { 'Content-Type': 'application/json' }, status: 503 }
        )
      )
    );
    return;
  }

  if (isHtmlNavigation(request)) {
    event.respondWith(
      networkFirst(request, RUNTIME_CACHE, caches.match('/index.html'))
    );
    return;
  }

  if (isStaticAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Có thông báo mới từ TìmSân',
    icon: '/icons/192.png',
    badge: '/icons/72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'TìmSân', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
