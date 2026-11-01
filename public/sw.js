const CACHE_NAME = 'nexabis-pwa-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
];

const BYPASS_PATTERNS = [
  'supabase.co',
  'evoapi.nexabistech.com',
  'n8n',
  '/functions/v1/',
  '/rest/v1/',
  '/auth/v1/',
  '/realtime/v1/',
  '/storage/v1/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((oldKey) => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Bypass API, Realtime, Auth, and external webhook calls
  if (BYPASS_PATTERNS.some((pattern) => request.url.includes(pattern))) {
    return;
  }

  // Bypass Vite dev server HMR / module requests if running locally
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/src/')
  ) {
    return;
  }

  // Network-first with cache fallback for SPA navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', copy);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached =
            (await caches.match(request)) ||
            (await caches.match('/index.html')) ||
            (await caches.match('/'));
          return cached || Response.error();
        })
    );
    return;
  }

  // Stale-while-revalidate for static assets (.js, .css, .png, .svg, .woff2, .ico, .webp)
  const isStaticAsset = /\.(?:js|css|png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|webmanifest)$/i.test(
    url.pathname
  );

  if (isStaticAsset && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
  }
});
