/**
 * MAMEKA MAHODAYAM (మమేక మహోదయం) - Official Service Worker (sw.js)
 * High-Performance Offline Caching, Stale-While-Revalidate, and Resilient PWA Engine
 */

const CACHE_VERSION = 'mameka-mahodayam-v1.0.0';
const STATIC_CACHE = `mameka-static-${CACHE_VERSION}`;
const DATA_CACHE = `mameka-data-${CACHE_VERSION}`;
const IMAGE_CACHE = `mameka-images-${CACHE_VERSION}`;

// Core static assets required for instant native app shell experience
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/epaper.html',
  '/editorial-team.html',
  '/district.html',
  '/about.html',
  '/contact.html',
  '/advertise.html',
  '/styles/design-system.css',
  '/styles/motion.css',
  '/js/config.js',
  '/js/categories-config.js',
  '/js/districts-config.js',
  '/js/i18n.js',
  '/js/navigation.js',
  '/js/content-api.js',
  '/js/chatbot.js',
  '/js/pwa.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon.png',
  '/manifest.json'
];

// Offline fallback HTML template
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="te">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ఆఫ్‌లైన్ — మమేక మహోదయం</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #fdf8f6;
      color: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .offline-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 36px 24px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 12px 36px rgba(138, 8, 75, 0.12);
      border: 1px solid #fbcfe8;
    }
    .emblem {
      font-size: 54px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 1.5rem;
      color: #8a084b;
      margin: 0 0 10px 0;
      font-weight: 800;
    }
    p {
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #d81b7a 0%, #8a084b 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 24px;
      font-weight: 700;
      font-size: 0.95rem;
      box-shadow: 0 4px 14px rgba(216, 27, 122, 0.35);
      border: none;
      cursor: pointer;
    }
    .btn:active { transform: scale(0.97); }
  </style>
</head>
<body>
  <div class="offline-card">
    <div class="emblem">📡</div>
    <h1>మీరు ఆఫ్‌లైన్‌లో ఉన్నారు</h1>
    <p>ఇంటర్నెట్ కనెక్షన్ అందుబాటులో లేదు. దయచేసి నెట్‌వర్క్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి. గతంలో లోడ్ అయిన వార్తలు హోమ్ పేజీలో అందుబాటులో ఉంటాయి.</p>
    <button class="btn" onclick="window.location.reload()">మళ్లీ ప్రయత్నించండి (Retry)</button>
  </div>
</body>
</html>`;

// 1. Install Event: Pre-cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[PWA ServiceWorker] Pre-caching static assets for Mameka Mahodayam');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA ServiceWorker] Notice on some precache items:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE, DATA_CACHE, IMAGE_CACHE].includes(cacheName)) {
            console.log('[PWA ServiceWorker] Purging old cache version:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Routing Strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests and browser-extension / socket schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // A. Public API Requests (/api/public/...) -> Network-First with Cache Fallback
  if (url.pathname.startsWith('/api/public/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DATA_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, serve last cached news data
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Return empty fallback JSON if no cached data exists
            return new Response(JSON.stringify({ success: true, articles: [], offline: true }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // B. Media & Images (/uploads/..., /icons/..., external fonts/images) -> Cache-First
  if (
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/icons/') ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(IMAGE_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // If image fails completely and offline, return transparent empty SVG or cached fallback
            return caches.match('/icons/icon-192.png');
          });
      })
    );
    return;
  }

  // C. HTML Navigation Requests -> Network-First, Cache fallback, Offline page fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('/index.html').then((indexFallback) => {
              if (indexFallback) return indexFallback;
              return new Response(OFFLINE_HTML, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            });
          });
        })
    );
    return;
  }

  // D. Static Assets (CSS, JS, Fonts) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
