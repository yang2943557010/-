(function () {
  var meta = window.__earlyDiskMeta;
  if (meta) {
    var siteName = document.getElementById('siteName');
    if (siteName) siteName.textContent = meta.name;
    var scanTip = document.getElementById('scanTip');
    if (scanTip) scanTip.innerHTML = '打开 <span class="app-name">' + meta.app + '</span> - 点击搜索框相机 - 扫码';
    var bottomApp = document.getElementById('bottomAppName');
    if (bottomApp) bottomApp.textContent = meta.app;
  }

  if (!(window.matchMedia && window.matchMedia('(max-width: 768px)').matches)) {
    var file = window.__earlyGuideFile;
    if (file) {
      var wrap = document.getElementById('guideRight');
      var img = document.getElementById('earlyGuideImg');
      if (wrap && img) {
        var base = '/assets/images/guides/' + file;
        if (/\.webp$/i.test(file)) {
          var source = document.getElementById('earlyGuideSource');
          if (source) source.srcset = base;
          img.src = base.replace(/\.webp$/i, '.png');
        } else {
          img.src = base;
        }
        img.loading = 'eager';
        img.hidden = false;
        img.onerror = function () {
          if (/\.webp(?:\?|$)/i.test(img.src)) {
            img.src = img.src.replace(/\.webp(\?|$)/i, '.png$1');
          } else {
            img.style.visibility = 'hidden';
          }
        };
        wrap.hidden = false;
        wrap.style.display = 'flex';
        wrap.removeAttribute('aria-hidden');
      }
    }
  }

  var disclaimerHtml = '<strong style="color:#6b7280;">⚠️ 免责声明</strong><br>本页面仅提供链接跳转服务，不存储任何资源文件。所有资源均由第三方网盘托管，本站不对资源内容的合法性、准确性、安全性负责。<br>用户应自行判断资源的合法性，因使用本服务产生的任何法律责任由用户自行承担。如有侵权，请联系资源分享者删除。';

  function mountDisclaimer() {
    var slot = document.getElementById('disclaimerSlot');
    if (!slot || slot.dataset.mounted) return;
    slot.dataset.mounted = '1';
    slot.className = 'disclaimer';
    slot.removeAttribute('aria-hidden');
    slot.style.cssText = 'max-width:1200px;margin:20px auto 80px;padding:16px 20px;background:rgba(0,0,0,0.02);border-radius:12px;font-size:11px;color:#9ca3af;line-height:1.8;text-align:center;';
    slot.innerHTML = disclaimerHtml;
  }

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(mountDisclaimer, { timeout: 5000 });
  } else {
    window.addEventListener('load', mountDisclaimer, { once: true });
  }
})();
