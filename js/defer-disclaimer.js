(function () {
  'use strict';
  var slot = document.getElementById('disclaimerSlot');
  var tpl = document.getElementById('pageDisclaimer');
  if (!slot || !tpl) return;

  function mount() {
    if (slot.dataset.mounted) return;
    slot.dataset.mounted = '1';
    slot.appendChild(tpl.content.cloneNode(true));
    if (slot.dataset.class) slot.className = slot.dataset.class;
    if (slot.dataset.style) slot.style.cssText = slot.dataset.style;
    slot.removeAttribute('aria-hidden');
  }

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(mount, { timeout: 5000 });
  } else {
    window.addEventListener('load', mount, { once: true });
  }
})();
