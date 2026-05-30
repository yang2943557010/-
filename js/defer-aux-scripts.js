(function () {
  'use strict';

  function loadScript(src) {
    var s = document.createElement('script');
    s.src = src;
    s.defer = true;
    document.body.appendChild(s);
  }

  function boot() {
    loadScript('/js/site-prefetch.js');
    loadScript('/js/sw-register.js');
  }

  if (document.readyState === 'complete') {
    boot();
  } else {
    window.addEventListener('load', boot, { once: true });
  }
})();
