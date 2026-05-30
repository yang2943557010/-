(function () {
  'use strict';
  var prefetched = new Set();

  function prefetchUrl(href) {
    if (!href || prefetched.has(href)) return;
    var url;
    try {
      url = new URL(href, location.href);
    } catch (_) {
      return;
    }
    if (url.origin !== location.origin) return;
    if (!/\.html$/.test(url.pathname) && url.pathname !== '/') return;
    prefetched.add(url.href);
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url.href;
    document.head.appendChild(link);
  }

  function shouldWarmPages() {
    var path = location.pathname || '';
    var isIndex = path === '/' || path.endsWith('/index.html');
    if (!isIndex) return true;
    var q = location.search || '';
    return q.indexOf('d=') === -1 && q.indexOf('s=') === -1 && q.indexOf('u=') === -1;
  }

  function warmCommonPages() {
    if (!shouldWarmPages()) return;
    var path = location.pathname || '';
    if (path.indexOf('generator') === -1) prefetchUrl(location.origin + '/pages/generator.html');
    if (path.indexOf('resources') === -1) prefetchUrl(location.origin + '/pages/resources.html');
    if (path === '/' || path.endsWith('/index.html')) return;
    prefetchUrl(location.origin + '/index.html');
  }

  document.addEventListener('pointerover', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a) prefetchUrl(a.href);
  }, { capture: true, passive: true });

  if ('requestIdleCallback' in window) {
    requestIdleCallback(warmCommonPages, { timeout: 12000 });
  } else {
    window.addEventListener('load', function () {
      setTimeout(warmCommonPages, 4000);
    }, { once: true });
  }
})();
