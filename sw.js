// Cloudflare Pages：HTML 网络优先；静态资源 stale-while-revalidate（配合 _headers 边缘缓存）
const CACHE_VERSION = 'netdisk-cf-v5';
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE = [
  './sw-register.js',
  './perf-optimized.css',
  './generator.css',
  './resources.css',
  './resources.js',
  './vendor/qr-code-styling.js',
  './vendor/qrcode.min.js',
  './banned-words.js'
];

const SKIP_PATH_PREFIXES = ['/scripts/'];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(RUNTIME_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('netdisk-') && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function shouldSkipPath(pathname) {
  return SKIP_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isHtmlRequest(request, url) {
  return request.mode === 'navigate'
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('/');
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  if (cached) {
    networkPromise.catch(() => {});
    return cached;
  }

  const network = await networkPromise;
  if (network) return network;
  return cached || Response.error();
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected && response.type === 'basic') {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (shouldSkipPath(url.pathname)) return;

  if (isHtmlRequest(event.request, url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (/\.(js|css|woff2?|svg|png|jpe?g|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
