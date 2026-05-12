/**
 * URL重定向二维码页面 - 主应用脚本
 * @license Proprietary - All Rights Reserved
 * @copyright 2024
 */

// ==================== 加密模块 ====================

const CryptoUtil = {

  // ── 网盘代号表 ──────────────────────────────────────────
  // 格式：代号 → { domain, pathPrefix }
  // pathPrefix: 大多数网盘分享路径前缀（省略后只存ID）
  DISK_CODES: {
    B: { domain: 'pan.baidu.com',       prefix: '/s/' },
    Q: { domain: 'pan.quark.cn',        prefix: '/s/' },
    A: { domain: 'alipan.com',          prefix: '/s/' },
    X: { domain: 'pan.xunlei.com',      prefix: '/s/' },
    E: { domain: '115.com',             prefix: '/s/' },
    L: { domain: 'lanzou.com',          prefix: '/b/' },
    T: { domain: 'cloud.189.cn',        prefix: '/t/' },
    W: { domain: 'weiyun.com',          prefix: '/s/' },
    J: { domain: 'jianguoyun.com',      prefix: '/d/' },
    M: { domain: 'caiyun.139.com',      prefix: '/s/' },
    U: { domain: 'pan.wo.cn',           prefix: '/s/' },
    C: { domain: 'drive.uc.cn',         prefix: '/s/' },
    P: { domain: 'mypikpak.com',        prefix: '/s/' },
    N: { domain: '123pan.com',          prefix: '/s/' },
    F: { domain: 'ctfile.com',          prefix: '/f/' },
    O: { domain: '1drv.ms',             prefix: '/'   },
    G: { domain: 'drive.google.com',    prefix: '/file/d/' },
    D: { domain: 'dropbox.com',         prefix: '/s/' },
    Z: { domain: 'mega.nz',             prefix: '/#!' },
    R: { domain: 'mediafire.com',       prefix: '/file/' },
    K: { domain: 'box.com',             prefix: '/s/' },
    I: { domain: 'icloud.com',          prefix: '/share/' },
    V: { domain: 'pcloud.com',          prefix: '/share/' },
  },

  // 页面风格缩写（default 省略不存）
  STYLE_CODES: {
    m: 'minimal', g: 'gradient', s: 'sunset', o: 'ocean',
    f: 'forest',  c: 'cherry',   n: 'midnight', a: 'aurora',
    k: 'candy',   r: 'card',
  },
  STYLE_ENCODE: {
    minimal: 'm', gradient: 'g', sunset: 's', ocean: 'o',
    forest: 'f',  cherry: 'c',   midnight: 'n', aurora: 'a',
    candy: 'k',   card: 'r',
  },

  // ── 压缩 URL ────────────────────────────────────────────
  // 输出格式：代号ID  或  代号ID:提取码
  // 例：Qabc123  或  Babc123:1234
  compressUrl(url, extractCode) {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase().replace(/^www\./, '');
      // 找匹配的代号
      const entry = Object.entries(this.DISK_CODES).find(([, v]) =>
        host === v.domain || host.endsWith('.' + v.domain)
      );
      if (!entry) return null; // 未知网盘，不压缩
      const [code, { prefix }] = entry;
      let path = u.pathname;
      // 去掉路径前缀
      if (prefix !== '/' && path.startsWith(prefix)) {
        path = path.slice(prefix.length);
      } else {
        path = path.replace(/^\//, '');
      }
      // 提取码：优先用 URL 里的 pwd/password/code 参数
      const urlCode = u.searchParams.get('pwd') || u.searchParams.get('password') || u.searchParams.get('code') || '';
      const finalCode = extractCode || urlCode;
      // 格式：代号+路径ID[:提取码]
      return code + path + (finalCode ? ':' + finalCode : '');
    } catch (e) {
      return null;
    }
  },

  // ── 还原 URL ────────────────────────────────────────────
  decompressUrl(str) {
    if (!str) return str;
    // 新格式：单大写字母开头
    const m = str.match(/^([A-Z])([^:]+)(?::(.*))?$/);
    if (!m) return str; // 旧格式，原样返回
    const [, code, id, pwd] = m;
    const disk = this.DISK_CODES[code];
    if (!disk) return str;
    const url = `https://${disk.domain}${disk.prefix}${id}`;
    return pwd ? url + '?pwd=' + pwd : url;
  },

  // 从压缩格式提取提取码
  extractCodeFromCompressed(str) {
    if (!str) return '';
    const m = str.match(/^[A-Z][^:]+:(.+)$/);
    return m ? m[1] : '';
  },

  // ── 新版编码（极致压缩）────────────────────────────────
  // 格式（|分隔，末尾空值省略）：
  //   压缩URL | 名称 | 风格单字母 | 广告文字 | 广告时长
  // 提取码已编码进压缩URL，不单独存
  encryptData(data) {
    try {
      const compressed = this.compressUrl(data.u || '', data.c || '');
      const u = compressed || data.u || ''; // 未知网盘用原URL
      const t = this.STYLE_ENCODE[data.t] || ''; // default 省略
      const parts = [u, data.n || '', t, data.a || '', data.at || ''];
      while (parts.length > 1 && !parts[parts.length - 1]) parts.pop();
      return this.toBase64Url(parts.join('|'));
    } catch (e) {
      console.error('加密失败:', e);
      return null;
    }
  },

  // ── 新版解码 ────────────────────────────────────────────
  decryptData(str) {
    try {
      if (!str) return null;
      const decoded = this.fromBase64Url(str);
      const parts = decoded.split('|');
      const rawU = parts[0] || '';
      // 判断是否是压缩格式
      const isCompressed = /^[A-Z]/.test(rawU) && !rawU.startsWith('http');
      const u = isCompressed ? this.decompressUrl(rawU) : rawU;
      const c = isCompressed ? this.extractCodeFromCompressed(rawU) : (parts[2] || '');
      const tCode = parts[2] || '';
      // 风格：新格式是单字母，旧格式是全名
      const t = this.STYLE_CODES[tCode] || tCode || 'default';
      return {
        u,
        n: parts[1] || '',
        c: c || parts[2] || '',
        t,
        a: parts[3] || '',
        at: parts[4] || '',
        wx: parts[5] || '' // 兼容旧格式
      };
    } catch (e) {
      console.error('解密失败:', e);
      return null;
    }
  },

  // ── 旧版兼容解码（XOR+Base64）──────────────────────────
  decryptDataLegacy(str) {
    try {
      if (!str) return null;
      const key = 'Qr24';
      const decoded = this.fromBase64Url(str);
      let xored = '';
      for (let i = 0; i < decoded.length; i++) {
        xored += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      const parts = xored.split('|');
      return {
        u: parts[0] || '',
        n: parts[1] || '',
        c: parts[2] || '',
        t: parts[3] || 'default',
        a: parts[4] || '',
        at: parts[5] || '',
        wx: parts[6] || ''
      };
    } catch (e) {
      return null;
    }
  },

  // 转URL安全Base64
  toBase64Url(str) {
    try {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      bytes.forEach(b => binary += String.fromCharCode(b));
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
  },

  // 从URL安全Base64解码
  fromBase64Url(str) {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    try {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return decodeURIComponent(escape(atob(b64)));
    }
  },

  // 旧版兼容（单URL加密）
  encrypt(text) {
    const key = 'Qr24';
    let xored = '';
    for (let i = 0; i < text.length; i++) {
      xored += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return this.toBase64Url(xored);
  },

  decrypt(str) {
    try {
      if (!str) return null;
      const key = 'Qr24';
      const decoded = this.fromBase64Url(str);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result.startsWith('http') ? result : null;
    } catch (e) {
      return null;
    }
  }
};

// ==================== 网盘配置 ====================

const DISK_CONFIG = {
  // ===== 国内主流网盘 =====
  baidu: {
    name: '百度网盘',
    keywords: ['pan.baidu.com', 'yun.baidu.com'],
    logo: 'assets/logos/baidu.png',
    guide: 'assets/images/guides/baidu-guide.png',
    appName: '百度网盘APP',
    color: '#06a7ff'
  },
  quark: {
    name: '夸克网盘',
    keywords: ['pan.quark.cn', 'quark.cn'],
    logo: 'assets/logos/quark.png',
    guide: 'assets/images/guides/quark-guide.png',
    appName: '夸克APP',
    color: '#1890ff'
  },
  aliyun: {
    name: '阿里云盘',
    keywords: ['aliyundrive.com', 'alipan.com'],
    logo: 'assets/logos/aliyun.ico',
    guide: 'assets/images/guides/aliyun-guide.svg',
    appName: '阿里云盘APP',
    color: '#ff6a00'
  },
  xunlei: {
    name: '迅雷云盘',
    keywords: ['pan.xunlei.com', 'xl.xunlei.com'],
    logo: 'assets/logos/xunlei.ico',
    guide: 'assets/images/guides/xunlei-guide.svg',
    appName: '迅雷APP',
    color: '#0078d4'
  },
  '115': {
    name: '115网盘',
    keywords: ['115.com', '115cdn.com'],
    logo: 'assets/logos/115.ico',
    guide: 'assets/images/guides/115-guide.svg',
    appName: '115APP',
    color: '#2b579a'
  },
  lanzou: {
    name: '蓝奏云',
    keywords: ['lanzou', 'lanzoui', 'lanzoux', 'lanzoucloud'],
    logo: 'assets/logos/lanzou.ico',
    guide: 'assets/images/guides/lanzou-guide.svg',
    appName: '手机浏览器',
    color: '#0099ff'
  },
  tianyi: {
    name: '天翼云盘',
    keywords: ['cloud.189.cn', 'e.189.cn', 'b.189.cn'],
    logo: 'assets/logos/tianyi.ico',
    guide: 'assets/images/guides/tianyi-guide.svg',
    appName: '天翼云盘APP',
    color: '#21a9e1'
  },
  weiyun: {
    name: '腾讯微云',
    keywords: ['weiyun.com', 'share.weiyun.com'],
    logo: 'assets/logos/weiyun.ico',
    guide: 'assets/images/guides/weiyun-guide.svg',
    appName: '微云APP',
    color: '#07c160'
  },
  jianguoyun: {
    name: '坚果云',
    keywords: ['jianguoyun.com', 'nutstore.net'],
    logo: 'assets/logos/jianguoyun.ico',
    guide: 'assets/images/guides/jianguoyun-guide.svg',
    appName: '坚果云APP',
    color: '#f5a623'
  },
  caiyun: {
    name: '中国移动云盘',
    keywords: ['caiyun.139.com', 'yun.139.com', '139.com/w'],
    logo: 'assets/logos/caiyun.svg',
    guide: 'assets/images/guides/caiyun-guide.svg',
    appName: '中国移动云盘APP',
    color: '#00a0e9'
  },
  wocloud: {
    name: '联通云盘',
    keywords: ['pan.wo.cn', 'cloud.wo.cn', 'wo.cn/pan'],
    logo: 'assets/logos/wocloud.ico',
    guide: 'assets/images/guides/wocloud-guide.svg',
    appName: '联通云盘APP',
    color: '#e60012'
  },
  ctyun: {
    name: '天翼企业云盘',
    keywords: ['ctyun.cn', 'oos.ctyun.cn'],
    logo: 'assets/logos/tianyi.ico',
    guide: 'assets/images/guides/tianyi-guide.svg',
    appName: '手机浏览器',
    color: '#0066cc'
  },
  uc: {
    name: 'UC网盘',
    keywords: ['drive.uc.cn', 'uc.cn/pan'],
    logo: 'assets/logos/uc.ico',
    guide: 'assets/images/guides/uc-guide.svg',
    appName: 'UC浏览器',
    color: '#ff6600'
  },
  pikpak: {
    name: 'PikPak',
    keywords: ['mypikpak.com', 'pikpak.com'],
    logo: 'assets/logos/pikpak.ico',
    guide: 'assets/images/guides/pikpak-guide.svg',
    appName: 'PikPak APP',
    color: '#7c3aed'
  },
  '123pan': {
    name: '123云盘',
    keywords: ['123pan.com', '123684.com', '123865.com'],
    logo: 'assets/logos/123pan.svg',
    guide: 'assets/images/guides/123pan-guide.svg',
    appName: '123云盘APP',
    color: '#ff4d4f'
  },
  ctfile: {
    name: '城通网盘',
    keywords: ['ctfile.com', 'u.ctfile.com'],
    logo: 'assets/logos/ctfile.ico',
    guide: '',
    appName: '手机浏览器',
    color: '#1677ff'
  },
  feijipan: {
    name: '飞机盘',
    keywords: ['feijipan.com'],
    logo: '',
    guide: '',
    appName: '手机浏览器',
    color: '#1890ff'
  },
  kuaizipan: {
    name: '快资盘',
    keywords: ['kuaizipan.com'],
    logo: '',
    guide: '',
    appName: '手机浏览器',
    color: '#ff7a00'
  },
  // ===== 国际主流网盘 =====
  onedrive: {
    name: 'OneDrive',
    keywords: ['onedrive.live.com', '1drv.ms', 'sharepoint.com'],
    logo: 'assets/logos/onedrive.png',
    guide: 'assets/images/guides/onedrive-guide.svg',
    appName: 'OneDrive APP',
    color: '#0078d4'
  },
  googledrive: {
    name: 'Google Drive',
    keywords: ['drive.google.com', 'docs.google.com', 'photos.google.com'],
    logo: 'assets/logos/googledrive.png',
    guide: 'assets/images/guides/googledrive-guide.svg',
    appName: 'Google Drive APP',
    color: '#4285f4'
  },
  dropbox: {
    name: 'Dropbox',
    keywords: ['dropbox.com', 'db.tt'],
    logo: 'assets/logos/dropbox.ico',
    guide: 'assets/images/guides/dropbox-guide.svg',
    appName: 'Dropbox APP',
    color: '#0061ff'
  },
  mega: {
    name: 'MEGA',
    keywords: ['mega.nz', 'mega.co.nz'],
    logo: 'assets/logos/mega.ico',
    guide: 'assets/images/guides/mega-guide.svg',
    appName: 'MEGA APP',
    color: '#d9272e'
  },
  mediafire: {
    name: 'MediaFire',
    keywords: ['mediafire.com'],
    logo: 'assets/logos/mediafire.ico',
    guide: '',
    appName: '手机浏览器',
    color: '#1d6fa4'
  },
  box: {
    name: 'Box',
    keywords: ['box.com', 'app.box.com'],
    logo: 'assets/logos/box.ico',
    guide: '',
    appName: 'Box APP',
    color: '#0061d5'
  },
  icloud: {
    name: 'iCloud',
    keywords: ['icloud.com'],
    logo: 'assets/logos/icloud.ico',
    guide: '',
    appName: '手机浏览器',
    color: '#3478f6'
  },
  pcloud: {
    name: 'pCloud',
    keywords: ['pcloud.com', 'u.pcloud.com'],
    logo: 'assets/logos/pcloud.svg',
    guide: '',
    appName: '手机浏览器',
    color: '#20b2aa'
  },
  default: {
    name: '资源分享',
    keywords: [],
    logo: '',
    guide: '',
    appName: '手机浏览器',
    color: '#1890ff'
  }
};

/**
 * 根据URL识别网盘类型 - 优化版本
 */
function detectDiskType(url) {
  if (!url) return DISK_CONFIG.default;
  
  // 缓存检测结果
  if (!detectDiskType.cache) {
    detectDiskType.cache = new Map();
  }
  
  if (detectDiskType.cache.has(url)) {
    return detectDiskType.cache.get(url);
  }
  
  const lowerUrl = url.toLowerCase();
  for (const [key, config] of Object.entries(DISK_CONFIG)) {
    if (key === 'default') continue;
    if (config.keywords.some(keyword => lowerUrl.includes(keyword))) {
      const result = { ...config, type: key };
      detectDiskType.cache.set(url, result);
      return result;
    }
  }
  
  const result = { ...DISK_CONFIG.default, type: 'default' };
  detectDiskType.cache.set(url, result);
  return result;
}

// ==================== URL处理模块 ====================

const UrlHandler = {
  // 新版：使用压缩编码（单参数d）
  encodeData(data) {
    return CryptoUtil.encryptData(data);
  },
  
  decodeData(str) {
    return CryptoUtil.decryptData(str);
  },
  
  // 旧版兼容
  encode(url) {
    return CryptoUtil.encrypt(url);
  },
  
  decode(encodedUrl) {
    let result = CryptoUtil.decrypt(encodedUrl);
    if (result && result.startsWith('http')) return result;
    try {
      let base64 = encodedUrl.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      return decodeURIComponent(atob(base64));
    } catch (e) {
      return null;
    }
  },
  
  parseParams() {
    const params = new URLSearchParams(window.location.search);
    
    // 短链接模式
    const shortId = params.get('s');
    if (shortId) {
      let data = null;
      try {
        if (window.ShortLinkGenerator) {
          ShortLinkGenerator.init();
          data = ShortLinkGenerator.resolve(shortId);
        } else {
          const shortLinks = JSON.parse(localStorage.getItem('shortLinks') || '{}');
          const compressed = shortLinks[shortId];
          if (compressed) {
            const parts = compressed.split('|');
            data = {
              u: parts[0] || '',
              n: parts[1] || '',
              c: parts[2] || '',
              t: parts[3] || '',
              a: parts[4] || '',
              at: parts[5] || '',
              wx: parts[6] || ''
            };
          }
        }
      } catch (e) {
        data = null;
      }
      if (data && data.u) {
        return {
          targetUrl: data.u,
          resourceName: data.n || '资源',
          extractCode: data.c || '无',
          template: data.t || 'default',
          adText: data.a || '',
          adDuration: Math.min(Math.max(parseInt(data.at) || 2, 1), 5),
          wxArticleId: data.wx || '',
          isValid: true
        };
      }
    }
    
    // 新版：单参数d包含所有数据
    const compressedData = params.get('d');
    if (compressedData) {
      // 先尝试新格式解码
      let data = this.decodeData(compressedData);
      // 如果新格式解码后 URL 不合法，尝试旧版 XOR 格式
      if (!data || !data.u || !data.u.startsWith('http')) {
        data = CryptoUtil.decryptDataLegacy(compressedData);
      }
      if (data && data.u) {
        return {
          targetUrl: data.u,
          resourceName: data.n || '资源',
          extractCode: data.c || '无',
          template: data.t || 'default',
          adText: data.a || '',
          adDuration: Math.min(Math.max(parseInt(data.at) || 2, 1), 5),
          wxArticleId: params.get('wx') || data.wx || '',
          isValid: true
        };
      }
    }
    
    // 旧版兼容：多参数模式
    const encodedUrl = params.get('u');
    const name = params.get('n') || '资源';
    const code = params.get('c') || '无';
    const template = params.get('t') || 'default';
    const adText = params.get('ad') || '';
    const adDuration = parseInt(params.get('ad_t')) || 2;
    const targetUrl = this.decode(encodedUrl);
    return {
      targetUrl,
      resourceName: decodeURIComponent(name),
      extractCode: decodeURIComponent(code),
      template,
      adText: adText ? decodeURIComponent(adText) : '',
      adDuration: Math.min(Math.max(adDuration, 1), 5),
      isValid: !!targetUrl
    };
  }
};

// ==================== 设备检测模块 - 优化版 ====================

const DeviceDetector = {
  // 缓存结果
  _isMobileCache: null,
  
  isMobile() {
    if (this._isMobileCache !== null) return this._isMobileCache;
    
    // 使用更高效的方法检测移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this._isMobileCache = isMobile;
    return isMobile;
  },
  
  getDeviceType() {
    // 使用更高效的方法检测设备类型
    if (/iPad|Android.*tablet|playbook|silk/i.test(navigator.userAgent)) return 'tablet';
    if (this.isMobile()) return 'mobile';
    return 'desktop';
  }
};

// ==================== 二维码生成模块 ====================

const QRCodeGenerator = {
  qrInstance: null,
  scriptPromise: null,

  loadLibrary() {
    if (typeof QRCode !== 'undefined') return Promise.resolve();
    if (this.scriptPromise) return this.scriptPromise;

    this.scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  },
  
  generate(url, container) {
    container.innerHTML = '';
    if (typeof QRCode === 'undefined') {
      this.loadLibrary()
        .then(() => this.render(url, container))
        .catch(() => this.renderFallback(url, container));
      return;
    }
    this.render(url, container);
  },

  render(url, container) {
    try {
      // 使用更高效的二维码配置
      this.qrInstance = new QRCode(container, {
        text: url,
        width: 160,
        height: 160,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M, // 使用中等纠错级别提升生成速度
        quietZone: 1 // 减少静默区域
      });
    } catch (e) {
      this.renderFallback(url, container);
    }
  },

  renderFallback(url, container) {
    container.innerHTML = `<a href="${url}" style="word-break: break-all; color: #1890ff;">${url}</a>`;
  }
};

// ==================== 页面渲染模块 ====================

const PageRenderer = {
  renderQRPage(params) {
    const { targetUrl, resourceName, extractCode } = params;
    const diskConfig = detectDiskType(targetUrl);
    
    document.title = diskConfig.name;
    
    const siteLogo = document.getElementById('siteLogo');
    const siteName = document.getElementById('siteName');
    if (diskConfig.logo) {
      siteLogo.onerror = () => {
        siteLogo.style.visibility = 'hidden';
        siteLogo.removeAttribute('src');
      };
      siteLogo.src = diskConfig.logo;
      siteLogo.style.display = 'inline-block';
      siteLogo.style.visibility = 'visible';
    } else {
      siteLogo.removeAttribute('src');
      siteLogo.style.visibility = 'hidden';
    }
    siteName.textContent = diskConfig.name;
    
    document.getElementById('resourceName').textContent = `资源名称：${resourceName}`;
    document.getElementById('extractCode').textContent = extractCode;
    document.getElementById('scanTip').innerHTML = `打开 <span class="app-name">${diskConfig.appName}</span> - 点击搜索框相机 - 扫码`;
    document.getElementById('bottomAppName').textContent = diskConfig.appName;
    
    const guideRight = document.getElementById('guideRight');
    if (diskConfig.guide) {
      guideRight.style.display = 'flex';
      const guideImg = document.createElement('img');
      guideImg.src = diskConfig.guide;
      guideImg.alt = '引导图';
      guideImg.className = 'guide-img';
      guideImg.loading = 'eager';
      guideImg.fetchPriority = 'high';
      guideImg.decoding = 'async';
      guideImg.width = 420;
      guideImg.height = 640;
      guideRight.replaceChildren(guideImg);
    } else {
      guideRight.replaceChildren();
      guideRight.style.display = 'none';
    }

    // 加载微信文章（桌面端，仅当有文章ID时）
    if (params.wxArticleId) {
      loadWxArticles(params.wxArticleId);
    }
    
    const qrContainer = document.getElementById('qrContainer');
    QRCodeGenerator.generate(targetUrl, qrContainer);
    
    document.getElementById('qrCard').style.display = 'block';
    document.getElementById('errorContainer').style.display = 'none';
  },
  
  renderErrorPage(message = '链接无效') {
    document.getElementById('qrCard').style.display = 'none';
    document.getElementById('guideRight').style.display = 'none';
    document.getElementById('errorContainer').style.display = 'block';
    document.querySelector('.error-container h2').textContent = message;
  },
  
  redirect(url) {
    window.location.href = url;
  }
};

// ==================== 主程序入口 ====================

function init() {
  processInit();
}

function processInit() {
  const params = UrlHandler.parseParams();
  if (!params.isValid) {
    PageRenderer.renderErrorPage('链接无效');
    return;
  }
  
  // 应用模板样式
  applyTemplate(params.template);
  
  const previewDevice = new URLSearchParams(window.location.search).get('previewDevice');
  const isMobile = previewDevice === 'mobile'
    ? true
    : (previewDevice === 'desktop' ? false : DeviceDetector.isMobile());
  if (isMobile) {
    // 检查是否有广告设置
    if (params.adText) {
      showAdAndRedirect(params.targetUrl, params.adText, params.adDuration, {
        resourceName: params.resourceName,
        template: params.template
      });
    } else {
      PageRenderer.redirect(params.targetUrl);
    }
  } else {
    PageRenderer.renderQRPage(params);
  }
}

// 显示广告并跳转 - 增强版（带预加载）
function showAdAndRedirect(targetUrl, adText, duration, params = {}) {
  const overlay = document.getElementById('adOverlay');
  const textEl = document.getElementById('adText');
  const countdownEl = document.getElementById('adCountdown');
  const progressBar = document.getElementById('adProgressBar');
  const skipBtn = document.getElementById('adSkipBtn');
  const diskLogo = document.getElementById('adDiskLogo');
  const diskName = document.getElementById('adDiskName');
  const adIcon = document.getElementById('adIcon');
  const adHint = document.getElementById('adHint');
  
  if (!overlay) {
    PageRenderer.redirect(targetUrl);
    return;
  }

  const previewDevice = new URLSearchParams(window.location.search).get('previewDevice');
  const isPreviewMode = previewDevice === 'mobile' || previewDevice === 'desktop';
  const isInIFrame = window.self !== window.top;
  const shouldManualOpen = isPreviewMode && isInIFrame;
  
  // 🚀 预加载目标页面 - 在广告显示期间提前加载
  let preloadFrame = null;
  if (!shouldManualOpen) {
    try {
      const targetOrigin = new URL(targetUrl).origin;
      
      // 预连接到目标域
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preconnect';
      preloadLink.href = targetOrigin;
      document.head.appendChild(preloadLink);
      
      // DNS预解析
      const dnsLink = document.createElement('link');
      dnsLink.rel = 'dns-prefetch';
      dnsLink.href = targetOrigin;
      document.head.appendChild(dnsLink);
      
      // 预加载页面（使用隐藏iframe）
      preloadFrame = document.createElement('iframe');
      preloadFrame.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
      preloadFrame.src = targetUrl;
      preloadFrame.loading = 'lazy'; // 使用懒加载属性
      document.body.appendChild(preloadFrame);
    } catch (e) {
      console.warn('预加载失败:', e);
    }
  }
  
  // 设置广告文字（保留换行格式）
  textEl.innerHTML = adText.replace(/\n/g, '<br>');
  countdownEl.textContent = duration;
  progressBar.style.width = '100%';
  
  // 设置网盘信息
  const diskConfig = detectDiskType(targetUrl);
  if (diskLogo) {
    if (diskConfig.logo) {
      diskLogo.onerror = () => {
        diskLogo.style.display = 'none';
        diskLogo.removeAttribute('src');
      };
      diskLogo.src = diskConfig.logo;
      diskLogo.style.display = 'inline';
    } else {
      diskLogo.style.display = 'none';
    }
  }
  if (diskName) diskName.textContent = diskConfig.name;
  
  // 根据网盘类型设置图标
  const iconMap = {
    'baidu': '💙',
    'quark': '⚡',
    'aliyun': '☁️',
    'xunlei': '⚡',
    '115': '📦',
    'lanzou': '🔵',
    'tianyi': '☁️',
    'weiyun': '💚',
    'jianguoyun': '🌰',
    'caiyun': '📱',
    'wocloud': '🔴',
    'ctyun': '🏢',
    'uc': '🟠',
    'pikpak': '🟣',
    '123pan': '🔢',
    'ctfile': '📁',
    'feijipan': '✈️',
    'kuaizipan': '⚡',
    'onedrive': '🔷',
    'googledrive': '🌈',
    'dropbox': '📦',
    'mega': '🔴',
    'mediafire': '🔥',
    'box': '📦',
    'icloud': '🍎',
    'pcloud': '☁️',
    'default': '🚀'
  };
  if (adIcon) adIcon.textContent = iconMap[diskConfig.type] || '🚀';
  
  // 根据页面模板设置主题
  const themeMap = {
    'default': 'theme-gradient',
    'gradient': 'theme-gradient',
    'sunset': 'theme-sunset',
    'ocean': 'theme-ocean',
    'forest': 'theme-forest',
    'midnight': 'theme-dark',
    'cherry': 'theme-candy',
    'candy': 'theme-candy'
  };
  const template = params.template || 'default';
  overlay.className = 'ad-overlay ' + (themeMap[template] || 'theme-gradient');
  
  // 设置提示文字
  const hints = [
    '请稍候，正在为您准备资源...',
    '即将为您打开资源页面...',
    '资源加载中，请耐心等待...',
    '正在连接资源服务器...'
  ];
  adHint.textContent = hints[Math.floor(Math.random() * hints.length)];
  
  // 显示广告
  overlay.style.display = 'flex';

  if (shouldManualOpen) {
    progressBar.style.width = '0%';
    countdownEl.textContent = '0';
    if (skipBtn) {
      const skipBtnSpans = skipBtn.querySelectorAll('span');
      if (skipBtnSpans && skipBtnSpans[1]) skipBtnSpans[1].textContent = '打开链接';
      skipBtn.classList.add('visible');
    }
    if (adHint) adHint.textContent = '预览模式下目标站点禁止在弹窗打开，手机端正常自己跳转，电脑端需要点击按钮在新标签页打开';
    window._adTargetUrl = targetUrl;
    window._preloadFrame = preloadFrame;
    return;
  }

  if (skipBtn) {
    const skipBtnSpans = skipBtn.querySelectorAll('span');
    if (skipBtnSpans && skipBtnSpans[1]) skipBtnSpans[1].textContent = '跳过';
  }
  
  // 跳过按钮逻辑（1秒后显示，加快体验）
  skipBtn.classList.remove('visible');
  setTimeout(() => {
    skipBtn.classList.add('visible');
  }, 1000);
  
  // 保存跳转目标供跳过按钮使用
  window._adTargetUrl = targetUrl;
  window._preloadFrame = preloadFrame;
  
  let remaining = duration;
  const startTime = Date.now();
  const totalMs = duration * 1000;
  
  // 更新进度条和倒计时
  const updateInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.max(0, 100 - (elapsed / totalMs * 100));
    progressBar.style.width = progress + '%';
    
    const newRemaining = Math.ceil((totalMs - elapsed) / 1000);
    if (newRemaining !== remaining && newRemaining >= 0) {
      remaining = newRemaining;
      countdownEl.textContent = remaining;
      
      // 倒计时动画
      countdownEl.style.transform = 'scale(1.2)';
      setTimeout(() => countdownEl.style.transform = 'scale(1)', 150);
    }
  }, 50);
  
  // 倒计时结束后跳转
  window._adTimeout = setTimeout(() => {
    clearInterval(updateInterval);
    doRedirect(targetUrl);
  }, totalMs);
  
  window._adInterval = updateInterval;
}

// 执行跳转（快速版）
function doRedirect(targetUrl) {
  const overlay = document.getElementById('adOverlay');

  const previewDevice = new URLSearchParams(window.location.search).get('previewDevice');
  const isPreviewMode = previewDevice === 'mobile' || previewDevice === 'desktop';
  const isInIFrame = window.self !== window.top;
  if (isPreviewMode && isInIFrame) {
    const skipBtn = document.getElementById('adSkipBtn');
    const adHint = document.getElementById('adHint');
    if (adHint) adHint.textContent = '预览模式下目标站点禁止iframe打开，请点击按钮在新标签页打开';
    if (skipBtn) {
      const skipBtnSpans = skipBtn.querySelectorAll('span');
      if (skipBtnSpans && skipBtnSpans[1]) skipBtnSpans[1].textContent = '打开链接';
      skipBtn.classList.add('visible');
    }
    window._adTargetUrl = targetUrl;
    return;
  }
  
  // 清理预加载iframe
  if (window._preloadFrame) {
    window._preloadFrame.remove();
  }
  
  // 快速淡出（200ms）
  overlay.classList.add('fade-out');
  
  // 立即跳转，不等待淡出完成
  setTimeout(() => {
    window.location.replace(targetUrl); // 使用replace避免返回到广告页
  }, 100);
}

// 跳过广告
function skipAd() {
  if (window._adTimeout) clearTimeout(window._adTimeout);
  if (window._adInterval) clearInterval(window._adInterval);

  const previewDevice = new URLSearchParams(window.location.search).get('previewDevice');
  const isPreviewMode = previewDevice === 'mobile' || previewDevice === 'desktop';
  const isInIFrame = window.self !== window.top;
  if (isPreviewMode && isInIFrame && window._adTargetUrl) {
    const openedWindow = window.open(window._adTargetUrl, '_blank', 'noopener');
    if (!openedWindow) {
      try {
        window.top.location.href = window._adTargetUrl;
      } catch (e) {
        window.location.href = window._adTargetUrl;
      }
    }
    return;
  }

  doRedirect(window._adTargetUrl);
}

// 模板样式
function applyTemplate(template) {
  const body = document.body;
  const card = document.querySelector('.card');
  
  // 重置样式
  body.style.background = '';
  if (card) {
    card.style.background = '';
    card.style.boxShadow = '';
  }
  
  switch(template) {
    case 'minimal':
      body.style.background = '#ffffff';
      break;
    case 'gradient':
      body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      break;
    case 'sunset':
      body.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #f6d365 100%)';
      break;
    case 'ocean':
      body.style.background = 'linear-gradient(135deg, #0c3483 0%, #a2b6df 50%, #6b8dd6 100%)';
      break;
    case 'forest':
      body.style.background = 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)';
      break;
    case 'cherry':
      body.style.background = 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)';
      break;
    case 'midnight':
      body.style.background = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)';
      if (card) {
        card.style.background = 'rgba(255,255,255,0.95)';
        card.style.boxShadow = '0 40px 80px rgba(0,0,0,0.3)';
      }
      break;
    case 'aurora':
      body.style.background = 'linear-gradient(135deg, #00c6fb 0%, #005bea 25%, #a855f7 50%, #ec4899 75%, #f97316 100%)';
      break;
    case 'candy':
      body.style.background = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%)';
      break;
    case 'card':
      body.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
      break;
    default:
      body.style.background = '#f3f6fb';
  }
}

if (document.readyState === 'loading' && !document.getElementById('stage')) {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  (window.queueMicrotask || ((callback) => Promise.resolve().then(callback)))(init);
}

// 导出模块
if (typeof window !== 'undefined') {
  window.UrlHandler = UrlHandler;
  window.CryptoUtil = CryptoUtil;
  window.DeviceDetector = DeviceDetector;
  window.detectDiskType = detectDiskType;
  window.DISK_CONFIG = DISK_CONFIG;
}

// ==================== 微信文章加载 ====================

const WX_PROXY_URL = 'https://wx.251800.xyz';

// 利用浏览器 DOM 彻底去除 HTML 标签，比正则更可靠
function stripHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.innerHTML = str;
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

// 加载多篇文章（ids 为逗号分隔的ID字符串）
function loadWxArticles(wxIds) {
  const panel = document.getElementById('wxArticlePanel');
  if (!panel || !wxIds) return;

  const ids = wxIds.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
  if (!ids.length) return;

  panel.style.display = 'flex';

  if (ids.length === 1) {
    // 单篇
    panel.innerHTML = `<div class="wx-article-inner"><div class="wx-loading"><div class="wx-loading-spinner"></div>加载中...</div></div>`;
    const url = `https://mp.weixin.qq.com/s/${ids[0]}`;
    const card = panel.children[0];
    if (!WX_PROXY_URL) { renderFallbackInto(card, url); return; }
    fetch(`${WX_PROXY_URL}?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(data => { if (!data.success) throw new Error(); data.url = url; renderArticleInto(card, data); })
      .catch(() => renderFallbackInto(card, url));
  } else {
    // 多篇：一次批量请求
    panel.innerHTML = `
      <div class="wx-article-inner wx-multi">
        <div class="wx-account-bar" id="wxAccountBar">
          <div class="wx-account-avatar">更</div>
          <span class="wx-account-name">更多资源</span>
          <span class="wx-follow-btn">+ 关注</span>
        </div>
        <div class="wx-multi-list" id="wxMultiList">
          ${ids.map(() => `<div class="wx-multi-item wx-multi-loading"><div class="wx-loading-spinner"></div></div>`).join('')}
        </div>
      </div>`;

    const list = document.getElementById('wxMultiList');

    if (!WX_PROXY_URL) {
      ids.forEach((id, i) => renderMultiItemFallback(list.children[i], `https://mp.weixin.qq.com/s/${id}`));
      return;
    }

    // 批量接口：一次请求拿全部
    fetch(`${WX_PROXY_URL}?urls=${ids.join(',')}`)
      .then(r => r.json())
      .then(res => {
        if (!res.success || !res.articles) throw new Error();
        res.articles.forEach((data, i) => {
          const url = `https://mp.weixin.qq.com/s/${ids[i]}`;
          data.url = url; // 强制用拼接链接
          if (data.success) {
            renderMultiItem(list.children[i], data);
          } else {
            renderMultiItemFallback(list.children[i], url);
          }
          // 用第一篇更新顶部账号（固定显示"更多资源"，不用 Worker 返回的账号名覆盖）
          if (i === 0) {
            const bar = document.getElementById('wxAccountBar');
            if (bar) {
              bar.querySelector('.wx-account-avatar').textContent = '更';
              bar.querySelector('.wx-account-name').textContent = '更多资源';
            }
          }
        });
      })
      .catch(() => {
        // 批量失败降级为逐个请求
        ids.forEach((id, i) => {
          const url = `https://mp.weixin.qq.com/s/${id}`;
          fetch(`${WX_PROXY_URL}?url=${encodeURIComponent(url)}`)
            .then(r => r.json())
            .then(data => { if (!data.success) throw new Error(); data.url = url; renderMultiItem(list.children[i], data); })
            .catch(() => renderMultiItemFallback(list.children[i], url));
        });
      });
  }
}

function renderMultiItem(el, data) {
  el.className = 'wx-multi-item';
  el.innerHTML = ''; // 清空

  // 封面图
  if (data.cover) {
    const img = document.createElement('img');
    img.className = 'wx-multi-cover';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.src = data.cover;
    img.onerror = () => img.style.display = 'none';
    el.appendChild(img);
  }

  // body
  const body = document.createElement('div');
  body.className = 'wx-multi-body';

  // 标题
  const title = document.createElement('div');
  title.className = 'wx-multi-title';
  title.textContent = data.title || '';
  body.appendChild(title);

  // 摘要（用 textContent 彻底避免 HTML 注入）
  const cleanDesc = stripHtml(data.desc || '');
  if (cleanDesc) {
    const desc = document.createElement('div');
    desc.className = 'wx-multi-desc';
    desc.textContent = cleanDesc;
    body.appendChild(desc);
  }

  // footer
  const footer = document.createElement('div');
  footer.className = 'wx-multi-footer';

  const time = document.createElement('span');
  time.className = 'wx-multi-time';
  time.textContent = data.publishTime ? `📅 ${data.publishTime}` : '';
  footer.appendChild(time);

  // 按钮——用 createElement 确保一定存在
  const btn = document.createElement('a');
  btn.href = data.url;
  btn.target = '_blank';
  btn.rel = 'noopener';
  btn.textContent = '阅读原文 →';
  btn.style.cssText = 'display:inline-flex;align-items:center;background:#07c160;color:#fff;border-radius:14px;padding:5px 12px;font-size:11px;font-weight:600;text-decoration:none;white-space:nowrap;';
  footer.appendChild(btn);

  body.appendChild(footer);
  el.appendChild(body);
}

function renderMultiItemFallback(el, url) {
  el.className = 'wx-multi-item';
  el.innerHTML = '';

  const body = document.createElement('div');
  body.className = 'wx-multi-body';

  const title = document.createElement('div');
  title.className = 'wx-multi-title';
  title.textContent = '微信公众号文章';
  body.appendChild(title);

  const footer = document.createElement('div');
  footer.className = 'wx-multi-footer';

  const empty = document.createElement('span');
  footer.appendChild(empty);

  const btn = document.createElement('a');
  btn.href = url;
  btn.target = '_blank';
  btn.rel = 'noopener';
  btn.textContent = '阅读原文 →';
  btn.style.cssText = 'display:inline-flex;align-items:center;background:#07c160;color:#fff;border-radius:14px;padding:5px 12px;font-size:11px;font-weight:600;text-decoration:none;white-space:nowrap;';
  footer.appendChild(btn);

  body.appendChild(footer);
  el.appendChild(body);
}

function renderArticleInto(card, data) {
  card.innerHTML = '';

  // 账号栏
  const bar = document.createElement('div');
  bar.className = 'wx-account-bar';
  const avatar = document.createElement('div');
  avatar.className = 'wx-account-avatar';
  avatar.textContent = '更';
  const name = document.createElement('span');
  name.className = 'wx-account-name';
  name.textContent = '更多资源';
  const follow = document.createElement('span');
  follow.className = 'wx-follow-btn';
  follow.textContent = '+ 关注';
  bar.append(avatar, name, follow);
  card.appendChild(bar);

  // 封面
  if (data.cover) {
    const img = document.createElement('img');
    img.className = 'wx-cover';
    img.src = data.cover;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => { img.style.display = 'none'; };
    card.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'wx-cover-placeholder';
    ph.textContent = '📰';
    card.appendChild(ph);
  }

  // 内容区
  const content = document.createElement('div');
  content.className = 'wx-article-content';

  const title = document.createElement('div');
  title.className = 'wx-article-title';
  title.textContent = data.title || '';
  content.appendChild(title);

  const cleanDesc = stripHtml(data.desc || '');
  if (cleanDesc) {
    const desc = document.createElement('div');
    desc.className = 'wx-article-desc';
    desc.textContent = cleanDesc;
    content.appendChild(desc);
  }

  const meta = document.createElement('div');
  meta.className = 'wx-article-meta';
  const time = document.createElement('span');
  time.textContent = data.publishTime ? `📅 ${data.publishTime}` : '微信公众号';
  const btn = document.createElement('a');
  btn.className = 'wx-read-btn';
  btn.href = data.url;
  btn.target = '_blank';
  btn.rel = 'noopener';
  btn.textContent = '阅读原文 →';
  meta.append(time, btn);
  content.appendChild(meta);

  card.appendChild(content);
}

function renderFallbackInto(card, url) {
  // 降级时不显示紫色封面，只显示简洁的文字卡片
  card.innerHTML = `
    <div class="wx-article-content" style="padding:20px 16px;">
      <div class="wx-article-title">微信公众号文章</div>
      <div class="wx-article-desc" style="margin:8px 0 12px;">点击阅读原文查看完整内容</div>
      <div class="wx-article-meta">
        <span>微信公众号</span>
        <a class="wx-read-btn" href="${url}" target="_blank" rel="noopener">阅读原文 →</a>
      </div>
    </div>`;
}
