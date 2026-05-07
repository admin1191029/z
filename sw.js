/* ══════════════════════════════════════════════════
   Service Worker — مدارس البشرى
   الإصدار: 1.0.0
   ══════════════════════════════════════════════════ */

const CACHE_NAME = 'bushra-admin-v1';

// الملفات اللي هتتخزن للاستخدام بدون نت
const ASSETS_TO_CACHE = [
  './',
  './index.html'  // غيّر الاسم لو اسم ملف الـ HTML مختلف
];

/* ── التثبيت ── */
self.addEventListener('install', function(event) {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // نحاول نخزن الملفات — لو فشل مش مشكلة
      return cache.addAll(ASSETS_TO_CACHE).catch(function(err) {
        console.warn('[SW] Cache addAll failed (non-fatal):', err);
      });
    }).then(function() {
      console.log('[SW] ✅ Installed');
      return self.skipWaiting();
    })
  );
});

/* ── التفعيل ── */
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      console.log('[SW] ✅ Activated');
      return self.clients.claim();
    })
  );
});

/* ── اعتراض الطلبات (Network First) ── */
self.addEventListener('fetch', function(event) {
  // تجاهل طلبات الـ Firebase والـ APIs الخارجية
  var url = event.request.url;
  if (
    url.includes('firebase') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('cloudflare') ||
    url.includes('chrome-extension') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // خزّن نسخة في الـ cache
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // لو فشل الـ network → رجّع من الـ cache
        return caches.match(event.request);
      })
  );
});
