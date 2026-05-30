/**
 * 网盘代号 / 引导图 / 元数据 — 全站共享（index 早渲染、app.js、generator.js）
 */
(function (global) {
  var DISK_CODES = {
    B: { domain: 'pan.baidu.com', prefix: '/s/' },
    Q: { domain: 'pan.quark.cn', prefix: '/s/' },
    A: { domain: 'alipan.com', prefix: '/s/' },
    X: { domain: 'pan.xunlei.com', prefix: '/s/' },
    E: { domain: '115.com', prefix: '/s/' },
    L: { domain: 'lanzou.com', prefix: '/b/' },
    T: { domain: 'cloud.189.cn', prefix: '/t/' },
    W: { domain: 'weiyun.com', prefix: '/s/' },
    J: { domain: 'jianguoyun.com', prefix: '/d/' },
    M: { domain: 'caiyun.139.com', prefix: '/s/' },
    U: { domain: 'pan.wo.cn', prefix: '/s/' },
    C: { domain: 'drive.uc.cn', prefix: '/s/' },
    P: { domain: 'mypikpak.com', prefix: '/s/' },
    N: { domain: '123pan.com', prefix: '/s/' },
    F: { domain: 'ctfile.com', prefix: '/f/' },
    O: { domain: '1drv.ms', prefix: '/' },
    G: { domain: 'drive.google.com', prefix: '/file/d/' },
    D: { domain: 'dropbox.com', prefix: '/s/' },
    Z: { domain: 'mega.nz', prefix: '/#!' },
    R: { domain: 'mediafire.com', prefix: '/file/' },
    K: { domain: 'box.com', prefix: '/s/' },
    I: { domain: 'icloud.com', prefix: '/share/' },
    V: { domain: 'pcloud.com', prefix: '/share/' }
  };

  var GUIDE_MAP = {
    B: 'baidu-guide.webp', Q: 'quark-guide.webp', A: 'aliyun-guide.svg', X: 'xunlei-guide.svg',
    E: '115-guide.svg', L: 'lanzou-guide.svg', T: 'tianyi-guide.svg', W: 'weiyun-guide.svg',
    J: 'jianguoyun-guide.svg', M: 'caiyun-guide.svg', U: 'wocloud-guide.svg', C: 'uc-guide.svg',
    P: 'pikpak-guide.svg', N: '123pan-guide.svg', O: 'onedrive-guide.svg', G: 'googledrive-guide.svg',
    D: 'dropbox-guide.svg', Z: 'mega-guide.svg'
  };

  var DISK_META = {
    B: { name: '百度网盘', app: '百度网盘APP' },
    Q: { name: '夸克网盘', app: '夸克APP' },
    A: { name: '阿里云盘', app: '阿里云盘APP' },
    X: { name: '迅雷云盘', app: '迅雷APP' },
    E: { name: '115网盘', app: '115APP' },
    L: { name: '蓝奏云', app: '手机浏览器' },
    T: { name: '天翼云盘', app: '天翼云盘APP' },
    W: { name: '微云', app: '腾讯微云APP' },
    J: { name: '坚果云', app: '坚果云APP' },
    M: { name: '和彩云', app: '和彩云APP' },
    U: { name: '联通云盘', app: '联通云盘APP' },
    C: { name: 'UC网盘', app: 'UC浏览器' },
    P: { name: 'PikPak', app: 'PikPak APP' },
    N: { name: '123云盘', app: '123云盘APP' },
    O: { name: 'OneDrive', app: 'OneDrive APP' },
    G: { name: 'Google Drive', app: 'Google Drive APP' },
    D: { name: 'Dropbox', app: 'Dropbox APP' },
    Z: { name: 'MEGA', app: 'MEGA APP' }
  };

  var DOMAIN_META = [
    ['pan.baidu.com', DISK_META.B], ['pan.quark.cn', DISK_META.Q], ['alipan.com', DISK_META.A],
    ['pan.xunlei.com', DISK_META.X], ['115.com', DISK_META.E], ['lanzou', DISK_META.L],
    ['cloud.189.cn', DISK_META.T], ['weiyun.com', DISK_META.W], ['jianguoyun.com', DISK_META.J],
    ['caiyun.139.com', DISK_META.M], ['pan.wo.cn', DISK_META.U], ['drive.uc.cn', DISK_META.C],
    ['mypikpak.com', DISK_META.P], ['123pan.com', DISK_META.N], ['1drv.ms', DISK_META.O],
    ['drive.google.com', DISK_META.G], ['dropbox.com', DISK_META.D], ['mega.nz', DISK_META.Z]
  ];

  var DOMAIN_GUIDE = [
    ['pan.baidu.com', 'baidu-guide.webp'], ['pan.quark.cn', 'quark-guide.webp'], ['alipan.com', 'aliyun-guide.svg'],
    ['pan.xunlei.com', 'xunlei-guide.svg'], ['115.com', '115-guide.svg'], ['lanzou', 'lanzou-guide.svg'],
    ['cloud.189.cn', 'tianyi-guide.svg'], ['weiyun.com', 'weiyun-guide.svg'], ['jianguoyun.com', 'jianguoyun-guide.svg'],
    ['caiyun.139.com', 'caiyun-guide.svg'], ['pan.wo.cn', 'wocloud-guide.svg'], ['drive.uc.cn', 'uc-guide.svg'],
    ['mypikpak.com', 'pikpak-guide.svg'], ['123pan.com', '123pan-guide.svg'], ['1drv.ms', 'onedrive-guide.svg'],
    ['drive.google.com', 'googledrive-guide.svg'], ['dropbox.com', 'dropbox-guide.svg'], ['mega.nz', 'mega-guide.svg']
  ];

  function decodeBase64Url(value) {
    if (!value) return '';
    try {
      var b64 = String(value).replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      return decodeURIComponent(Array.prototype.map.call(atob(b64), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      try { return atob(value); } catch (_) { return ''; }
    }
  }

  function decompressUrl(str) {
    var m = String(str || '').match(/^([A-Z])([^:]+)(?::(.*))?$/);
    if (!m) return str;
    var disk = DISK_CODES[m[1]];
    if (!disk) return str;
    var url = 'https://' + disk.domain + disk.prefix + m[2];
    return m[3] ? url + '?pwd=' + encodeURIComponent(m[3]) : url;
  }

  function guideFromUrl(url) {
    var lower = String(url || '').toLowerCase();
    for (var i = 0; i < DOMAIN_GUIDE.length; i++) {
      if (lower.indexOf(DOMAIN_GUIDE[i][0]) !== -1) return DOMAIN_GUIDE[i][1];
    }
    return '';
  }

  function metaFromUrl(url) {
    var lower = String(url || '').toLowerCase();
    for (var i = 0; i < DOMAIN_META.length; i++) {
      if (lower.indexOf(DOMAIN_META[i][0]) !== -1) return DOMAIN_META[i][1];
    }
    return null;
  }

  function metaFromDecoded(decoded) {
    if (!decoded) return null;
    if (/^https?:\/\//i.test(decoded)) return metaFromUrl(decoded);
    return DISK_META[decoded.charAt(0)] || null;
  }

  function parseSharePayload(dRaw) {
    if (!dRaw) return null;
    var decoded = decodeBase64Url(dRaw);
    var parts = decoded.split('|');
    var rawU = parts[0] || '';
    var isCompressed = /^[A-Z]/.test(rawU) && rawU.indexOf('http') !== 0;
    var targetUrl = isCompressed ? decompressUrl(rawU) : rawU;
    if (!targetUrl || targetUrl.indexOf('http') !== 0) return null;
    return {
      targetUrl: targetUrl,
      adText: parts[3] || '',
      adDuration: parseInt(parts[4], 10) || 2
    };
  }

  global.DiskData = {
    DISK_CODES: DISK_CODES,
    GUIDE_MAP: GUIDE_MAP,
    DISK_META: DISK_META,
    decodeBase64Url: decodeBase64Url,
    decompressUrl: decompressUrl,
    guideFromUrl: guideFromUrl,
    metaFromUrl: metaFromUrl,
    metaFromDecoded: metaFromDecoded,
    parseSharePayload: parseSharePayload
  };
})(typeof window !== 'undefined' ? window : this);
