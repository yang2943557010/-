// Cloudflare Pages：HTML 网络优先；静态资源 stale-while-revalidate / cache-first
const CACHE_VERSION = 'netdisk-cf-v25';
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE = [
  './js/sw-register.js',
  './js/site-prefetch.js',
  './js/defer-aux-scripts.js',
  './js/defer-disclaimer.js',
  './js/disk-data.js',
  './js/index-early.js',
  './js/generator-early.js',
  './js/page-guard.js',
  './css/index-critical.css',
  './css/generator-critical.css',
  './css/speed-critical.css',
  './css/resources-critical.css',
  './css/vip-critical.css',
  './css/tools-critical.css',
  './css/perf-optimized.css',
  './css/resources.css',
  './js/app.js',
  './assets/images/guides/baidu-guide.webp',
  './assets/images/guides/baidu-guide.png',
  './assets/images/guides/quark-guide.webp',
  './assets/images/guides/quark-guide.png',
  './assets/logos/baidu.webp',
  './assets/logos/quark.webp'
];

const SKIP_PATH_PREFIXES = ['/scripts/', '/extras/'];

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

function isImmutableAsset(pathname) {
  return pathname.startsWith('/vendor/') || pathname.startsWith('/assets/');
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
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

  if (isImmutableAsset(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if (/\.(js|css|woff2?|svg|png|jpe?g|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
