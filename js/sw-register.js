(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;

  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
  if (isLocal) return;

  var pendingWorker = null;

  function showUpdateBanner() {
    if (document.getElementById('sw-update-banner')) return;
    function mount() {
      if (document.getElementById('sw-update-banner')) return;
      var bar = document.createElement('button');
    bar.id = 'sw-update-banner';
    bar.type = 'button';
    bar.setAttribute('aria-label', '刷新页面以应用新版本');
    bar.style.cssText = [
      'position:fixed',
      'bottom:72px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:99999',
      'padding:10px 18px',
      'background:#0f172a',
      'color:#fff',
      'border:none',
      'border-radius:999px',
      'font-size:13px',
      'line-height:1.4',
      'box-shadow:0 10px 28px rgba(0,0,0,.22)',
      'cursor:pointer',
      'display:flex',
      'align-items:center',
      'gap:8px',
      'max-width:calc(100vw - 32px)'
    ].join(';');
    bar.innerHTML = '<span>✨ 新版本已就绪</span><strong style="color:#a5b4fc">点击刷新</strong>';
    bar.addEventListener('click', function () {
      bar.disabled = true;
      bar.textContent = '正在刷新…';
      if (pendingWorker) pendingWorker.postMessage({ type: 'SKIP_WAITING' });
      else location.reload();
    });
    document.body.appendChild(bar);
    }
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once: true });
  }

  function registerSW() {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function (reg) {
        reg.addEventListener('updatefound', function () {
          var worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', function () {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              pendingWorker = worker;
              showUpdateBanner();
            }
          });
        });
      })
      .catch(function () {});
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(registerSW, { timeout: 8000 });
  } else {
    window.addEventListener('load', function () {
      setTimeout(registerSW, 2500);
    }, { once: true });
  }

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (window.__swReloaded) return;
    window.__swReloaded = true;
    location.reload();
  });
})();
