(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;

  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
  if (isLocal) return;

  function registerSW() {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function (reg) {
        reg.addEventListener('updatefound', function () {
          var worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', function () {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(function () {});
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(registerSW, { timeout: 5000 });
  } else {
    window.addEventListener('load', function () {
      setTimeout(registerSW, 1500);
    }, { once: true });
  }

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (window.__swReloaded) return;
    window.__swReloaded = true;
  });
})();
