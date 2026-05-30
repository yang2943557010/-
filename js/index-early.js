(function () {
  var D = window.DiskData;
  if (!D) return;

  function applyEarlyDiskMeta(meta) {
    if (!meta) return;
    document.title = meta.name;
    window.__earlyDiskMeta = meta;
  }

  function preloadGuide(file) {
    if (!file) return;
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return;
    var href = '/assets/images/guides/' + file;
    var link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    if (/\.webp$/i.test(href)) link.type = 'image/webp';
    link.fetchPriority = 'high';
    document.head.insertBefore(link, document.head.firstChild);
  }

  var params = new URLSearchParams(location.search);
  var raw = params.get('d') || '';
  var shortId = params.get('s') || '';
  var file = '';
  var decoded = '';

  if (shortId) {
    try {
      var shortLinks = JSON.parse(localStorage.getItem('shortLinks') || '{}');
      raw = (shortLinks[shortId] || '').split('|')[0] || '';
    } catch (e) {}
  }

  if (raw) {
    decoded = D.decodeBase64Url(raw).split('|')[0] || raw;
    file = D.GUIDE_MAP[decoded.charAt(0)] || D.guideFromUrl(decoded);
    applyEarlyDiskMeta(D.metaFromDecoded(decoded));
  } else if (params.get('u')) {
    decoded = D.decodeBase64Url(params.get('u'));
    file = D.guideFromUrl(decoded);
    applyEarlyDiskMeta(D.metaFromUrl(decoded));
  }

  preloadGuide(file);
  window.__earlyGuideFile = file || '';

  var mobilePayload = null;
  if (raw) {
    mobilePayload = D.parseSharePayload(raw);
  } else if (params.get('u')) {
    try {
      var legacyUrl = D.decodeBase64Url(params.get('u'));
      if (legacyUrl && legacyUrl.indexOf('http') === 0) {
        mobilePayload = {
          targetUrl: legacyUrl,
          adText: params.get('ad') ? decodeURIComponent(params.get('ad')) : '',
          adDuration: parseInt(params.get('ad_t'), 10) || 2
        };
      }
    } catch (e) {}
  }

  var preview = params.get('previewDevice');
  var isMobile = preview === 'mobile'
    || (preview !== 'desktop' && (
      (window.matchMedia && window.matchMedia('(max-width: 768px)').matches)
      || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
    ));

  if (mobilePayload && isMobile && !(mobilePayload.adText && String(mobilePayload.adText).trim())) {
    location.replace(mobilePayload.targetUrl);
  }
})();
