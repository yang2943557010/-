// ==================== 配置 ====================
const SECRET_KEY = 'QrShare2024Key!!';
const BASE_URL = window.location.origin + '/index.html';

const DISK_CONFIG = {
  // ===== 国内主流网盘 =====
  baidu: { name: '百度网盘', keywords: ['pan.baidu.com', 'yun.baidu.com'], logo: 'assets/logos/baidu.png', color: '#06a7ff' },
  quark: { name: '夸克网盘', keywords: ['pan.quark.cn', 'quark.cn'], logo: 'assets/logos/quark.png', color: '#1890ff' },
  aliyun: { name: '阿里云盘', keywords: ['aliyundrive.com', 'alipan.com'], logo: 'assets/logos/aliyun.ico', color: '#ff6a00' },
  xunlei: { name: '迅雷云盘', keywords: ['pan.xunlei.com', 'xl.xunlei.com'], logo: 'assets/logos/xunlei.ico', color: '#0078d4' },
  '115': { name: '115网盘', keywords: ['115.com', '115cdn.com'], logo: 'assets/logos/115.ico', color: '#2b579a' },
  lanzou: { name: '蓝奏云', keywords: ['lanzou', 'lanzoui', 'lanzoux', 'lanzouv', 'lanzouy', 'lanzoucloud'], logo: 'assets/logos/lanzou.ico', color: '#0099ff' },
  tianyi: { name: '天翼云盘', keywords: ['cloud.189.cn', 'e.189.cn', 'b.189.cn'], logo: 'assets/logos/tianyi.ico', color: '#21a9e1' },
  weiyun: { name: '腾讯微云', keywords: ['weiyun.com', 'share.weiyun.com'], logo: 'assets/logos/weiyun.ico', color: '#07c160' },
  jianguoyun: { name: '坚果云', keywords: ['jianguoyun.com', 'nutstore.net'], logo: 'assets/logos/jianguoyun.ico', color: '#f5a623' },
  caiyun: { name: '中国移动云盘', keywords: ['caiyun.139.com', 'yun.139.com', '139.com/w'], logo: 'assets/logos/caiyun.svg', color: '#00a0e9' },
  wocloud: { name: '联通云盘', keywords: ['pan.wo.cn', 'cloud.wo.cn', 'wo.cn/pan'], logo: 'assets/logos/wocloud.ico', color: '#e60012' },
  uc: { name: 'UC网盘', keywords: ['drive.uc.cn', 'uc.cn/pan'], logo: 'assets/logos/uc.ico', color: '#ff6600' },
  pikpak: { name: 'PikPak', keywords: ['mypikpak.com', 'pikpak.com'], logo: 'assets/logos/pikpak.ico', color: '#7c3aed' },
  '123pan': { name: '123云盘', keywords: ['123pan.com', '123684.com', '123865.com'], logo: 'assets/logos/123pan.svg', color: '#ff4d4f' },
  ctfile: { name: '城通网盘', keywords: ['ctfile.com', 'u.ctfile.com'], logo: 'assets/logos/ctfile.ico', color: '#1677ff' },
  feijipan: { name: '飞机盘', keywords: ['feijipan.com'], logo: '', color: '#1890ff' },
  // ===== 国际主流网盘 =====
  onedrive: { name: 'OneDrive', keywords: ['onedrive.live.com', '1drv.ms', 'sharepoint.com'], logo: 'assets/logos/onedrive.png', color: '#0078d4' },
  googledrive: { name: 'Google Drive', keywords: ['drive.google.com', 'docs.google.com', 'photos.google.com'], logo: 'assets/logos/googledrive.png', color: '#4285f4' },
  dropbox: { name: 'Dropbox', keywords: ['dropbox.com', 'db.tt'], logo: 'assets/logos/dropbox.ico', color: '#0061ff' },
  mega: { name: 'MEGA', keywords: ['mega.nz', 'mega.co.nz'], logo: 'assets/logos/mega.ico', color: '#d9272e' },
  mediafire: { name: 'MediaFire', keywords: ['mediafire.com'], logo: 'assets/logos/mediafire.ico', color: '#1d6fa4' },
  box: { name: 'Box', keywords: ['box.com', 'app.box.com'], logo: 'assets/logos/box.ico', color: '#0061d5' },
  icloud: { name: 'iCloud', keywords: ['icloud.com'], logo: 'assets/logos/icloud.ico', color: '#3478f6' },
  pcloud: { name: 'pCloud', keywords: ['pcloud.com', 'u.pcloud.com'], logo: 'assets/logos/pcloud.svg', color: '#20b2aa' },
  default: { name: '资源分享', keywords: [], logo: '', color: '#6366f1' }
};

let history = JSON.parse(localStorage.getItem('linkHistory') || '[]');
let historyDirty = false;
let groups = JSON.parse(localStorage.getItem('linkGroups') || '["默认","学习","娱乐","工作"]');
let settings = JSON.parse(localStorage.getItem('qrSettings') || '{"colorDark":"#1e293b","colorLight":"#ffffff","size":180,"dotStyle":"rounded","cornerStyle":"dot","colorMode":"solid","gradient1":"#6366f1","gradient2":"#8b5cf6","gradientType":"linear"}');
let currentData = null;
let selectedPosterStyle = 'elegant';
let currentQRCode = null;
let batchGeneratedResults = [];

function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, delay) {
  let last = 0;
  let timer = null;
  return function(...args) {
    const now = Date.now();
    const remaining = delay - (now - last);
    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

const qrRenderQueue = [];
let qrRenderScheduled = false;
const QR_RENDER_BATCH = 8;

function enqueueQRRender(containerId, url, size) {
  qrRenderQueue.push({ containerId, url, size });
  if (qrRenderScheduled) return;
  qrRenderScheduled = true;
  const runBatch = () => {
    let count = 0;
    while (qrRenderQueue.length && count < QR_RENDER_BATCH) {
      const { containerId: qId, url: targetUrl, size: qrSize } = qrRenderQueue.shift();
      const qrContainer = document.getElementById(qId);
      if (qrContainer) generateStyledQR(targetUrl, qrContainer, qrSize);
      count++;
    }
    if (qrRenderQueue.length) {
      if ('requestIdleCallback' in window) requestIdleCallback(runBatch, { timeout: 100 });
      else requestAnimationFrame(runBatch);
    } else {
      qrRenderScheduled = false;
    }
  };
  if ('requestIdleCallback' in window) requestIdleCallback(runBatch, { timeout: 100 });
  else requestAnimationFrame(runBatch);
}

// ==================== 加密工具 ====================

// 网盘代号表（与 app.js 保持一致）
const DISK_CODES = {
  B: { domain: 'pan.baidu.com',    prefix: '/s/' },
  Q: { domain: 'pan.quark.cn',     prefix: '/s/' },
  A: { domain: 'alipan.com',       prefix: '/s/' },
  X: { domain: 'pan.xunlei.com',   prefix: '/s/' },
  E: { domain: '115.com',          prefix: '/s/' },
  L: { domain: 'lanzou.com',       prefix: '/b/' },
  T: { domain: 'cloud.189.cn',     prefix: '/t/' },
  W: { domain: 'weiyun.com',       prefix: '/s/' },
  J: { domain: 'jianguoyun.com',   prefix: '/d/' },
  M: { domain: 'caiyun.139.com',   prefix: '/s/' },
  U: { domain: 'pan.wo.cn',        prefix: '/s/' },
  C: { domain: 'drive.uc.cn',      prefix: '/s/' },
  P: { domain: 'mypikpak.com',     prefix: '/s/' },
  N: { domain: '123pan.com',       prefix: '/s/' },
  F: { domain: 'ctfile.com',       prefix: '/f/' },
  O: { domain: '1drv.ms',          prefix: '/'   },
  G: { domain: 'drive.google.com', prefix: '/file/d/' },
  D: { domain: 'dropbox.com',      prefix: '/s/' },
  Z: { domain: 'mega.nz',          prefix: '/#!' },
  R: { domain: 'mediafire.com',    prefix: '/file/' },
  K: { domain: 'box.com',          prefix: '/s/' },
  I: { domain: 'icloud.com',       prefix: '/share/' },
  V: { domain: 'pcloud.com',       prefix: '/share/' },
};

// 域名 → 代号反查
const DOMAIN_TO_CODE = {};
for (const [code, { domain }] of Object.entries(DISK_CODES)) {
  DOMAIN_TO_CODE[domain] = code;
}

// 页面风格缩写
const STYLE_ENCODE = {
  minimal: 'm', gradient: 'g', sunset: 's', ocean: 'o',
  forest: 'f',  cherry: 'c',   midnight: 'n', aurora: 'a',
  candy: 'k',   card: 'r',
};


const STYLE_CODES = Object.fromEntries(Object.entries(STYLE_ENCODE).map(([name, code]) => [code, name]));

function fromBase64Url(str) {
  let b64 = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return decodeURIComponent(escape(atob(b64)));
  }
}

function decompressUrl(str) {
  if (!str) return str;
  const m = String(str).match(/^([A-Z])([^:]+)(?::(.*))?$/);
  if (!m) return str;
  const [, code, id, pwd] = m;
  const disk = DISK_CODES[code];
  if (!disk) return str;
  const url = `https://${disk.domain}${disk.prefix}${id}`;
  return pwd ? url + '?pwd=' + pwd : url;
}

function extractCodeFromCompressed(str) {
  const m = String(str || '').match(/^[A-Z][^:]+:(.+)$/);
  return m ? m[1] : '';
}

// 压缩 URL：https://pan.quark.cn/s/abc123?pwd=1234 → Qabc123:1234
function compressUrl(url, extractCode) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    const code = DOMAIN_TO_CODE[host] ||
      Object.keys(DISK_CODES).find(k => host.endsWith('.' + DISK_CODES[k].domain));
    if (!code) return null;
    const { prefix } = DISK_CODES[code];
    let path = u.pathname;
    if (prefix !== '/' && path.startsWith(prefix)) {
      path = path.slice(prefix.length);
    } else {
      path = path.replace(/^\//, '');
    }
    const urlCode = u.searchParams.get('pwd') || u.searchParams.get('password') || u.searchParams.get('code') || '';
    const finalCode = extractCode || urlCode;
    return code + path + (finalCode ? ':' + finalCode : '');
  } catch (e) {
    return null;
  }
}

// 转URL安全Base64（新版，用 TextEncoder）
function toBase64Url(str) {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

// 加密数据对象（新格式，极致压缩）
// 格式：压缩URL|名称|风格单字母|广告文字|广告时长
// 提取码已编码进压缩URL，不单独存
function encryptData(data) {
  try {
    const compressed = compressUrl(data.u || '', data.c || '');
    const u = compressed || data.u || '';
    const t = STYLE_ENCODE[data.t] || ''; // default 省略
    const parts = [u, data.n || '', t, data.a || '', data.at || ''];
    while (parts.length > 1 && !parts[parts.length - 1]) parts.pop();
    return toBase64Url(parts.join('|'));
  } catch (e) {
    console.error('加密失败:', e);
    return null;
  }
}


function decryptGeneratedData(str) {
  try {
    if (!str) return null;
    const decoded = fromBase64Url(str);
    const parts = decoded.split('|');
    const rawU = parts[0] || '';
    const isCompressed = /^[A-Z]/.test(rawU) && !rawU.startsWith('http');
    const u = isCompressed ? decompressUrl(rawU) : rawU;
    const tCode = parts[2] || '';
    return {
      u,
      n: parts[1] || '',
      c: (isCompressed ? extractCodeFromCompressed(rawU) : '') || '',
      t: STYLE_CODES[tCode] || tCode || 'default',
      a: parts[3] || '',
      at: parts[4] || ''
    };
  } catch (e) {
    return null;
  }
}

function parseGeneratedShareLink(input) {
  try {
    const u = new URL(input);
    const isLocalGenerated = u.pathname.endsWith('/index.html') || u.pathname === '/' || u.pathname.endsWith('/');
    if (!isLocalGenerated && !u.searchParams.has('d') && !u.searchParams.has('u')) return null;
    const d = u.searchParams.get('d');
    if (d) {
      const data = decryptGeneratedData(d);
      if (!data?.u) return null;
      return {
        targetUrl: data.u,
        resourceName: data.n || '',
        extractCode: data.c || '',
        pageStyle: data.t || 'default',
        adText: data.a || '',
        adDuration: data.at || '',
        wx: u.searchParams.get('wx') || data.wx || '',
        home: u.searchParams.get('home') || data.home || ''
      };
    }
    const oldEncoded = u.searchParams.get('u');
    if (oldEncoded) {
      let b64 = oldEncoded.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const targetUrl = decodeURIComponent(atob(b64));
      return {
        targetUrl,
        resourceName: u.searchParams.get('n') || '',
        extractCode: u.searchParams.get('c') || '',
        pageStyle: u.searchParams.get('t') || 'default',
        adText: u.searchParams.get('a') ? decodeURIComponent(u.searchParams.get('a')) : '',
        adDuration: u.searchParams.get('at') || '',
        wx: u.searchParams.get('wx') || '',
        home: u.searchParams.get('home') || ''
      };
    }
  } catch (e) {}
  return null;
}

/** 从「通过网盘分享的文件：xxx 链接: https://... 提取码: abc」等混合文本中解析 */
function parseShareText(input) {
  if (!input || !input.trim()) return null;
  const text = input.trim();

  const generated = parseGeneratedShareLink(text);
  if (generated) return generated;

  const urlCandidates = (text.match(/https?:\/\/[^\s<>"']+/gi) || [])
    .map((u) => u.replace(/[)\]}>.,;:!?，。；：！）】》]+$/g, ''));

  let targetUrl = '';
  for (const candidate of urlCandidates) {
    if (validateUrl(candidate).valid) {
      targetUrl = candidate;
      break;
    }
  }
  if (!targetUrl) return null;

  let extractCode = '';
  const codePatterns = [
    /(?:提取码|访问码|密码|口令|提取密码)[：:\s]+([a-zA-Z0-9]{2,10})/i,
    /[?&](?:pwd|password|code)=([a-zA-Z0-9]+)/i
  ];
  for (const pattern of codePatterns) {
    const m = text.match(pattern);
    if (m) {
      extractCode = m[1].replace(/[^a-zA-Z0-9]/g, '');
      break;
    }
  }
  if (!extractCode) {
    const um = targetUrl.match(/[?&](?:pwd|password|code)=([^&]+)/i);
    if (um) extractCode = um[1].replace(/[^a-zA-Z0-9]/g, '');
  }

  let resourceName = '';
  const namePatterns = [
    /(?:通过网盘分享的文件|分享的文件|分享文件|文件名称?|资源名称?)[：:\s]+(.+?)(?:\s+链接[：:]|https?:\/\/)/i,
    /^(.{2,40}?)\s+链接[：:\s]/m
  ];
  for (const pattern of namePatterns) {
    const m = text.match(pattern);
    if (m) {
      resourceName = m[1].replace(/\s*链接[：:].*$/i, '').trim();
      if (resourceName.length > 0 && resourceName.length <= 50) break;
      resourceName = '';
    }
  }

  return { targetUrl, extractCode, resourceName };
}

function applyShareTextToSingleForm(parsed, options = {}) {
  if (!parsed?.targetUrl) return false;
  const target = document.getElementById('targetUrl');
  if (target && options.replaceTarget !== false) target.value = parsed.targetUrl;
  if (parsed.extractCode) document.getElementById('extractCode').value = parsed.extractCode;
  if (parsed.resourceName) {
    const nameEl = document.getElementById('resourceName');
    if (nameEl && (options.forceName || !nameEl.value.trim())) nameEl.value = parsed.resourceName;
  }
  if (parsed.pageStyle && document.getElementById('pageStyle')) {
    document.getElementById('pageStyle').value = parsed.pageStyle;
  }
  return true;
}

function resolveShareInput(raw, options = {}) {
  if (!raw || !raw.trim()) return null;
  const text = raw.trim();
  const generated = parseGeneratedShareLink(text);
  if (generated) {
    if (options.populate) applyGeneratedLinkToSingleForm(generated, { replaceTarget: true });
    return generated;
  }
  const parsed = parseShareText(text);
  if (parsed) {
    if (options.populate) applyShareTextToSingleForm(parsed, { replaceTarget: true, forceName: options.forceName });
    return parsed;
  }
  return null;
}

function fillWxInputs(prefix, value) {
  const ids = String(value || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`${prefix}${i}`);
    if (!el) return;
    el.value = ids[i - 1] || '';
    el.style.color = ids[i - 1] ? '#07c160' : '';
  });
}

function applyGeneratedLinkToSingleForm(data, options = {}) {
  if (!data?.targetUrl) return null;
  const target = document.getElementById('targetUrl');
  if (target && options.replaceTarget !== false) target.value = data.targetUrl;
  if (data.resourceName) document.getElementById('resourceName').value = data.resourceName;
  if (data.extractCode) document.getElementById('extractCode').value = data.extractCode;
  if (data.pageStyle && document.getElementById('pageStyle')) document.getElementById('pageStyle').value = data.pageStyle;
  if (data.adText) {
    const adEnabled = document.getElementById('adEnabled');
    const adSettings = document.getElementById('adSettings');
    if (adEnabled) adEnabled.checked = true;
    if (adSettings) adSettings.style.display = 'block';
    document.getElementById('adText').value = data.adText;
    if (data.adDuration && document.getElementById('adDuration')) document.getElementById('adDuration').value = data.adDuration;
  }
  if (data.wx) fillWxInputs('wxArticleId', data.wx);
  if (data.home) {
    const home = document.getElementById('homePageId');
    if (home) { home.value = data.home; home.style.color = '#10b981'; }
  }
  refreshMarketingSummaries?.();
  return data.targetUrl;
}

function resolveTargetUrlForGeneration(input, options = {}) {
  const existing = parseGeneratedShareLink(input);
  if (existing) {
    if (options.populate) applyGeneratedLinkToSingleForm(existing, { replaceTarget: true });
    return existing.targetUrl;
  }
  return input;
}

// ==================== 输入验证 ====================
// 支持的网盘域名
const VALID_DOMAINS = [
  // 百度网盘
  'pan.baidu.com', 'yun.baidu.com',
  // 夸克网盘
  'pan.quark.cn', 'quark.cn',
  // 阿里云盘
  'aliyundrive.com', 'alipan.com',
  // 迅雷云盘
  'pan.xunlei.com', 'xl.xunlei.com',
  // 115网盘
  '115.com', '115cdn.com',
  // 蓝奏云
  'lanzou.com', 'lanzoui.com', 'lanzoux.com', 'lanzouv.com', 'lanzouy.com', 'lanzoucloud.com',
  // 天翼云盘
  'cloud.189.cn', 'e.189.cn', 'b.189.cn',
  // 腾讯微云
  'weiyun.com', 'share.weiyun.com',
  // 坚果云
  'jianguoyun.com', 'nutstore.net',
  // 中国移动云盘
  'caiyun.139.com', 'yun.139.com', '139.com',
  // 联通云盘
  'pan.wo.cn', 'cloud.wo.cn', 'wo.cn',
  // UC网盘
  'drive.uc.cn', 'uc.cn',
  // PikPak
  'mypikpak.com', 'pikpak.com',
  // 123云盘
  '123pan.com', '123684.com', '123865.com',
  // 城通网盘
  'ctfile.com', 'u.ctfile.com',
  // 飞机盘
  'feijipan.com',
  // 奶牛快传
  'cowtransfer.com',
  // 文叔叔
  'wenshushu.cn',
  // OneDrive
  'onedrive.live.com', '1drv.ms', 'sharepoint.com',
  // Google Drive
  'drive.google.com', 'docs.google.com', 'photos.google.com',
  // Dropbox
  'dropbox.com', 'db.tt',
  // MEGA
  'mega.nz', 'mega.co.nz',
  // MediaFire
  'mediafire.com',
  // Box
  'box.com', 'app.box.com',
  // iCloud
  'icloud.com',
  // pCloud
  'pcloud.com', 'u.pcloud.com',
];

// ==================== 敏感词过滤系统 ====================
// 基础违禁词从外部文件加载（减少主文件体积）
let BASE_BANNED_WORDS = window.BASE_BANNED_WORDS || [];

// 扩展词库（从远程加载）
let extendedBannedWords = [];
let bannedWordsLoaded = false;

// 词库配置
const WORD_LIST_CONFIG = {
  // 可以配置多个词库源（jsdelivr CDN加速GitHub资源）
  sources: [
    // ===== fwwdn/sensitive-stop-words 词库 =====
    // 色情类
    'https://cdn.jsdelivr.net/gh/fwwdn/sensitive-stop-words@master/%E8%89%B2%E6%83%85%E7%B1%BB.txt',
    // 政治类
    'https://cdn.jsdelivr.net/gh/fwwdn/sensitive-stop-words@master/%E6%94%BF%E6%B2%BB%E7%B1%BB.txt',
    // 涉枪涉爆违法信息
    'https://cdn.jsdelivr.net/gh/fwwdn/sensitive-stop-words@master/%E6%B6%89%E6%9E%AA%E6%B6%89%E7%88%86%E8%BF%9D%E6%B3%95%E4%BF%A1%E6%81%AF%E5%85%B3%E9%94%AE%E8%AF%8D.txt',
    // 广告类
    'https://cdn.jsdelivr.net/gh/fwwdn/sensitive-stop-words@master/%E5%B9%BF%E5%91%8A.txt',
    
    // ===== TsingJyujing/sensitive-word 词库 =====
    // 暴恐词库
    'https://cdn.jsdelivr.net/gh/TsingJyujing/sensitive-word@master/%E6%9A%B4%E6%81%90%E8%AF%8D%E5%BA%93.txt',
    // 反动词库
    'https://cdn.jsdelivr.net/gh/TsingJyujing/sensitive-word@master/%E5%8F%8D%E5%8A%A8%E8%AF%8D%E5%BA%93.txt',
    // 民生词库
    'https://cdn.jsdelivr.net/gh/TsingJyujing/sensitive-word@master/%E6%B0%91%E7%94%9F%E8%AF%8D%E5%BA%93.txt',
    // 色情词库
    'https://cdn.jsdelivr.net/gh/TsingJyujing/sensitive-word@master/%E8%89%B2%E6%83%85%E8%AF%8D%E5%BA%93.txt',
    // 贪腐词库
    'https://cdn.jsdelivr.net/gh/TsingJyujing/sensitive-word@master/%E8%B4%AA%E8%85%90%E8%AF%8D%E5%BA%93.txt',
    // 其他词库
    'https://cdn.jsdelivr.net/gh/TsingJyujing/sensitive-word@master/%E5%85%B6%E4%BB%96%E8%AF%8D%E5%BA%93.txt',
    
    // ===== cjh0613/tencent-sensitive-words 腾讯词库 =====
    'https://cdn.jsdelivr.net/gh/cjh0613/tencent-sensitive-words@main/sensitive_words_lines.txt'
  ],
  // 本地缓存key
  cacheKey: 'bannedWordsCache_v2',
  // 缓存有效期（3天，更频繁更新）
  cacheExpiry: 3 * 24 * 60 * 60 * 1000,
  // 是否启用远程词库
  enableRemote: true,
  // 最大词库大小（防止内存溢出）
  maxWords: 50000
};

function loadBannedWordsBase() {
  if (window.BASE_BANNED_WORDS) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'banned-words.js';
    script.defer = true;
    script.onload = () => {
      BASE_BANNED_WORDS = window.BASE_BANNED_WORDS || [];
      resolve();
    };
    script.onerror = () => reject(new Error('banned-words.js load failed'));
    document.head.appendChild(script);
  });
}

function scheduleBannedWordsInit() {
  const run = () => {
    loadBannedWordsBase()
      .then(() => loadRemoteBannedWords())
      .then(() => {
        initBannedWordsWorker();
        setTimeout(() => { if (!bannedWordsWorkerReady) ensureDfaTree(); }, 1500);
      })
      .catch(() => {
        initBannedWordsWorker();
        setTimeout(() => { if (!bannedWordsWorkerReady) ensureDfaTree(); }, 1500);
      });
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 1200);
  }
}

// 加载远程词库
async function loadRemoteBannedWords() {
  if (!WORD_LIST_CONFIG.enableRemote) {
    bannedWordsLoaded = true;
    return;
  }
  
  // 检查缓存
  try {
    const cached = localStorage.getItem(WORD_LIST_CONFIG.cacheKey);
    if (cached) {
      const { words, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < WORD_LIST_CONFIG.cacheExpiry) {
        extendedBannedWords = words;
        invalidateBannedWordsCache();
        bannedWordsLoaded = true;
        console.log(`已从缓存加载 ${words.length} 个敏感词`);
        return;
      }
    }
  } catch (e) {
    console.warn('读取缓存失败:', e);
  }
  
  // 从远程加载（并行请求提高速度）
  const allWords = new Set();
  let loadedCount = 0;
  let failedCount = 0;
  
  const fetchPromises = WORD_LIST_CONFIG.sources.map(async (url) => {
    try {
      const response = await fetch(url, { 
        mode: 'cors',
        cache: 'force-cache'
      });
      if (response.ok) {
        const text = await response.text();
        const words = text.split(/[\n\r]+/)
          .map(w => w.trim().toLowerCase())
          .filter(w => w && w.length >= 2 && w.length <= 30 && !/^\d+$/.test(w));
        words.forEach(w => {
          if (allWords.size < WORD_LIST_CONFIG.maxWords) {
            allWords.add(w);
          }
        });
        loadedCount++;
      }
    } catch (e) {
      failedCount++;
      console.warn(`加载词库失败: ${url.split('/').pop()}`);
    }
  });
  
  // 等待所有请求完成（最多10秒超时）
  await Promise.race([
    Promise.all(fetchPromises),
    new Promise(resolve => setTimeout(resolve, 10000))
  ]);
  
  if (allWords.size > 0) {
    extendedBannedWords = Array.from(allWords);
    invalidateBannedWordsCache();
    // 缓存到本地
    try {
      localStorage.setItem(WORD_LIST_CONFIG.cacheKey, JSON.stringify({
        words: extendedBannedWords,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('缓存词库失败（可能超出存储限制）:', e);
      // 如果存储失败，尝试只存储部分
      try {
        const partialWords = extendedBannedWords.slice(0, 10000);
        localStorage.setItem(WORD_LIST_CONFIG.cacheKey, JSON.stringify({
          words: partialWords,
          timestamp: Date.now()
        }));
      } catch (e2) {
        console.warn('部分缓存也失败:', e2);
      }
    }
    console.log(`词库加载完成: ${loadedCount}/${WORD_LIST_CONFIG.sources.length} 成功, 共 ${extendedBannedWords.length} 个词`);
  }
  
  bannedWordsLoaded = true;
}

// 获取所有违禁词
let cachedAllBannedWords = null;

function invalidateBannedWordsCache() {
  cachedAllBannedWords = null;
  dfaTree = null;
  resetBannedWordsWorker();
}

let bannedWordsWorker = null;
let bannedWordsWorkerReady = false;
let bannedWordsWorkerMsgId = 0;
const bannedWordsWorkerPending = new Map();

function resetBannedWordsWorker() {
  bannedWordsWorkerReady = false;
  if (bannedWordsWorker) {
    bannedWordsWorker.terminate();
    bannedWordsWorker = null;
  }
  bannedWordsWorkerPending.clear();
}

function initBannedWordsWorker() {
  if (!window.Worker) {
    ensureDfaTree();
    return;
  }
  resetBannedWordsWorker();
  try {
    bannedWordsWorker = new Worker('banned-words-worker.js');
    bannedWordsWorker.onmessage = (event) => {
      const msg = event.data || {};
      if (msg.type === 'ready') {
        bannedWordsWorkerReady = true;
        return;
      }
      if (msg.id != null && bannedWordsWorkerPending.has(msg.id)) {
        bannedWordsWorkerPending.get(msg.id)(msg);
        bannedWordsWorkerPending.delete(msg.id);
      }
    };
    bannedWordsWorker.onerror = () => {
      resetBannedWordsWorker();
      ensureDfaTree();
    };
    bannedWordsWorker.postMessage({ type: 'init', words: getAllBannedWords() });
  } catch (e) {
    ensureDfaTree();
  }
}

function sanitizeInputDataBatch(items) {
  if (!bannedWordsWorkerReady || !bannedWordsWorker) {
    return Promise.resolve(items.map((item) => sanitizeInputData(item)));
  }
  const id = ++bannedWordsWorkerMsgId;
  return new Promise((resolve) => {
    bannedWordsWorkerPending.set(id, (msg) => {
      resolve(msg.results || items.map((item) => sanitizeInputData(item)));
    });
    bannedWordsWorker.postMessage({ type: 'sanitizeBatch', id, items });
  });
}

function getAllBannedWords() {
  if (cachedAllBannedWords) return cachedAllBannedWords;
  const allWords = new Set([...BASE_BANNED_WORDS.map(w => w.toLowerCase())]);
  extendedBannedWords.forEach(w => allWords.add(w));
  cachedAllBannedWords = Array.from(allWords);
  return cachedAllBannedWords;
}

// 构建DFA敏感词树（高效匹配）
let dfaTree = null;

function ensureDfaTree() {
  if (!dfaTree) dfaTree = buildDFATree(getAllBannedWords());
  return dfaTree;
}

function buildDFATree(words) {
  const root = {};
  for (const word of words) {
    let node = root;
    for (const char of word) {
      if (!node[char]) node[char] = {};
      node = node[char];
    }
    node.isEnd = true;
    node.word = word;
  }
  return root;
}

function checkTextWithDFA(text, tree) {
  if (!text || !tree) return { valid: true };
  
  const lowerText = text.toLowerCase();
  for (let i = 0; i < lowerText.length; i++) {
    let node = tree;
    let j = i;
    while (j < lowerText.length && node[lowerText[j]]) {
      node = node[lowerText[j]];
      if (node.isEnd) {
        return { valid: false, word: node.word };
      }
      j++;
    }
  }
  return { valid: true };
}

// 验证URL是否为有效网盘链接
function validateUrl(url) {
  if (!url || !url.trim()) {
    return { valid: false, error: '请输入链接' };
  }
  
  url = url.trim();
  
  // 检查是否为有效URL格式
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { valid: false, error: '请输入有效的网址（以 http:// 或 https:// 开头）' };
  }
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // 检查是否为支持的网盘域名
    const isValidDomain = VALID_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (!isValidDomain) {
      return { 
        valid: false, 
        error: '仅支持网盘链接（百度、夸克、阿里云盘、迅雷、115、蓝奏云、天翼、微云、坚果云、移动云盘、联通云盘、UC、PikPak、123云盘、OneDrive、Google Drive、Dropbox、MEGA 等）' 
      };
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, error: '链接格式不正确' };
  }
}

// 检查文本是否包含违禁词（使用DFA高效匹配）
function checkBannedWords(text) {
  if (!text) return { valid: true };
  return checkTextWithDFA(text, ensureDfaTree());
}

// 过滤文本中的违禁词（替换为*）
function filterBannedWords(text) {
  if (!text) return text;
  
  const tree = ensureDfaTree();
  const lowerText = text.toLowerCase();
  let result = text;
  const replacements = [];
  
  for (let i = 0; i < lowerText.length; i++) {
    let node = tree;
    let j = i;
    let lastMatchEnd = -1;
    let lastMatchWord = '';
    
    while (j < lowerText.length && node[lowerText[j]]) {
      node = node[lowerText[j]];
      if (node.isEnd) {
        lastMatchEnd = j;
        lastMatchWord = node.word;
      }
      j++;
    }
    
    if (lastMatchEnd >= 0) {
      replacements.push({
        start: i,
        end: lastMatchEnd + 1,
        word: lastMatchWord
      });
      i = lastMatchEnd;
    }
  }
  
  for (let k = replacements.length - 1; k >= 0; k--) {
    const r = replacements[k];
    const stars = '*'.repeat(r.end - r.start);
    result = result.substring(0, r.start) + stars + result.substring(r.end);
  }
  
  return result;
}

// 移除文本中的违禁词（直接删除）
function removeBannedWords(text) {
  if (!text) return text;
  
  const tree = ensureDfaTree();
  const lowerText = text.toLowerCase();
  let result = text;
  const replacements = [];
  
  for (let i = 0; i < lowerText.length; i++) {
    let node = tree;
    let j = i;
    let lastMatchEnd = -1;
    
    while (j < lowerText.length && node[lowerText[j]]) {
      node = node[lowerText[j]];
      if (node.isEnd) {
        lastMatchEnd = j;
      }
      j++;
    }
    
    if (lastMatchEnd >= 0) {
      replacements.push({ start: i, end: lastMatchEnd + 1 });
      i = lastMatchEnd;
    }
  }
  
  // 从后往前删除
  for (let k = replacements.length - 1; k >= 0; k--) {
    const r = replacements[k];
    result = result.substring(0, r.start) + result.substring(r.end);
  }
  
  return result.trim();
}

// 移除文本中的网址
function removeUrls(text) {
  if (!text) return text;
  return text
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/www\.[^\s]+/gi, '')
    .replace(/[a-z0-9]+\.(com|cn|net|org|io|cc|co|me|tv|info|xyz|top|vip|club|site|online|shop|app)[^\s]*/gi, '')
    .trim();
}

// 清理文本（移除违禁内容）
function cleanText(text, preserveNewlines = false) {
  if (!text) return text;
  
  // 先移除网址
  let cleaned = removeUrls(text);
  // 再移除违禁词
  cleaned = removeBannedWords(cleaned);
  
  // 不再清理空格，保留原始格式
  return cleaned;
}

// 验证提取码格式（只允许字母和数字）
function validateExtractCode(code) {
  if (!code || !code.trim()) return { valid: true }; // 提取码可以为空
  
  const trimmedCode = code.trim();
  // 只允许字母、数字
  if (!/^[a-zA-Z0-9]+$/.test(trimmedCode)) {
    return { valid: false, error: '提取码只能包含字母和数字' };
  }
  
  // 长度限制
  if (trimmedCode.length > 10) {
    return { valid: false, error: '提取码长度不能超过10位' };
  }
  
  return { valid: true };
}

// 检查文本是否包含网址
function containsUrl(text) {
  if (!text) return false;
  // 匹配常见网址格式
  const urlPatterns = [
    /https?:\/\//i,                          // http:// 或 https://
    /www\./i,                                 // www.
    /\.[a-z]{2,6}(\/|$|\s)/i,                // .com .cn .net 等顶级域名
    /[a-z0-9]+(\.com|\.cn|\.net|\.org|\.io|\.cc|\.co|\.me|\.tv|\.info|\.xyz|\.top|\.vip|\.club|\.site|\.online|\.shop|\.app)/i
  ];
  return urlPatterns.some(pattern => pattern.test(text));
}

// 综合验证（只验证URL和提取码格式，其他内容自动清理）
function validateInput(url, name, remark, adText, extractCode) {
  // 验证URL（必须是有效网盘链接）
  const urlResult = validateUrl(url);
  if (!urlResult.valid) {
    return urlResult;
  }
  
  // 验证提取码格式（只允许字母数字）
  if (extractCode) {
    const codeResult = validateExtractCode(extractCode);
    if (!codeResult.valid) {
      return codeResult;
    }
  }
  
  // 其他字段（名称、备注、广告文字）会在生成时自动清理
  return { valid: true };
}

// 处理输入数据（自动清理违禁内容）
function sanitizeInputData(data) {
  const result = { ...data };
  let hasFiltered = false;
  
  // 清理资源名称
  if (result.name) {
    const cleanedName = cleanText(result.name);
    if (cleanedName !== result.name) {
      hasFiltered = true;
      result.name = cleanedName || '资源';
    }
  }
  
  // 清理备注
  if (result.remark) {
    const cleanedRemark = cleanText(result.remark);
    if (cleanedRemark !== result.remark) {
      hasFiltered = true;
      result.remark = cleanedRemark;
    }
  }
  
  // 清理广告文字（保留换行符）
  if (result.adText) {
    const cleanedAd = cleanText(result.adText, true);
    if (cleanedAd !== result.adText) {
      hasFiltered = true;
      result.adText = cleanedAd;
    }
  }
  
  result.hasFiltered = hasFiltered;
  return result;
}

// 刷新词库缓存
async function refreshBannedWordsCache() {
  localStorage.removeItem(WORD_LIST_CONFIG.cacheKey);
  invalidateBannedWordsCache();
  extendedBannedWords = [];
  await loadBannedWordsBase();
  await loadRemoteBannedWords();
  initBannedWordsWorker();
  if (!bannedWordsWorkerReady) ensureDfaTree();
  toast(`词库已更新，共 ${getAllBannedWords().length} 个敏感词`);
}

function detectDiskType(url) {
  if (!url) return DISK_CONFIG.default;
  const lowerUrl = url.toLowerCase();
  for (const [key, config] of Object.entries(DISK_CONFIG)) {
    if (key === 'default') continue;
    if (config.keywords.some(k => lowerUrl.includes(k))) return { ...config, type: key };
  }
  return { ...DISK_CONFIG.default, type: 'default' };
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toast(msg, duration = 2000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function autoExtractCode() {
  const targetInput = document.getElementById('targetUrl');
  const raw = targetInput.value.trim();
  if (!raw) return;

  const generated = parseGeneratedShareLink(raw);
  if (generated) {
    applyGeneratedLinkToSingleForm(generated, { replaceTarget: true });
    toast('已识别旧分享链接，可继续补充备注或营销设置');
    return;
  }

  const parsed = parseShareText(raw);
  if (parsed?.targetUrl) {
    applyShareTextToSingleForm(parsed, { replaceTarget: true });
    return;
  }

  const match = raw.match(/[?&](pwd|password|code)=([^&]+)/i);
  if (match) {
    const cleanCode = match[2].replace(/[^a-zA-Z0-9]/g, '');
    document.getElementById('extractCode').value = cleanCode;
  }
}

function fillSingleExample() {
  document.getElementById('targetUrl').value = 'https://pan.quark.cn/s/example123?pwd=8888';
  document.getElementById('resourceName').value = '示例资源合集';
  document.getElementById('extractCode').value = '8888';
  document.getElementById('remarkText').value = '这里可以写资源说明、使用方法或更新日期。';
  document.getElementById('homePageId').value = 'oslds988';
  const pageStyle = document.getElementById('pageStyle');
  if (pageStyle) pageStyle.value = 'default';
  toast('已填入示例，可以点击预览或生成');
}

function previewExampleFlow() {
  if (!document.getElementById('targetUrl').value.trim()) {
    fillSingleExample();
  }
  previewResult();
}

function fillBatchExample() {
  document.getElementById('batchInput').value = [
    'https://pan.quark.cn/s/example123?pwd=8888|示例资源合集|8888|资料|这里可以写资源说明',
    'https://pan.baidu.com/s/example456|学习资料|5678|学习|PDF格式'
  ].join('\n');
  toast('已填入批量示例，可以直接生成');
}

// 从任意文字中提取微信文章ID
function autoExtractWxId(input) {
  const val = input.value;
  const m = val.match(/mp\.weixin\.qq\.com\/s\/([A-Za-z0-9_-]+)/);
  if (m) {
    input.value = m[1];
    input.style.color = '#07c160';
  } else {
    input.style.color = '';
  }
}

function extractHomePageId(value) {
  const raw = (value || '').trim();
  if (!raw) return '';
  const m = raw.match(/(?:https?:\/\/)?(?:www\.)?vlink\.cc\/([A-Za-z0-9_-]+)/i);
  const id = m ? m[1] : raw;
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : '';
}

function autoExtractHomeId(input) {
  const id = extractHomePageId(input.value);
  if (id) {
    input.value = id;
    input.style.color = '#10b981';
  } else {
    input.style.color = '';
  }
}

function appendMarketingParams(baseLink, wxArticleId, homePageId) {
  const params = [];
  if (wxArticleId) params.push(`wx=${encodeURIComponent(wxArticleId)}`);
  if (homePageId) params.push(`home=${encodeURIComponent(homePageId)}`);
  return params.length ? `${baseLink}&${params.join('&')}` : baseLink;
}

function generateLink(url, name, code, remark) {
  const pageStyle = document.getElementById('pageStyle')?.value || 'default';
  const adEnabled = document.getElementById('adEnabled')?.checked || false;
  const adText = document.getElementById('adText')?.value || '';
  const adDuration = parseInt(document.getElementById('adDuration')?.value) || 2;

  const wxIds = [1, 2, 3].map(i => {
    const raw = (document.getElementById(`wxArticleId${i}`)?.value || '').trim();
    const m = raw.match(/mp\.weixin\.qq\.com\/s\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : (/^[A-Za-z0-9_-]+$/.test(raw) ? raw : '');
  }).filter(Boolean);
  const wxArticleId = wxIds.join(',');
  const homePageId = extractHomePageId(document.getElementById('homePageId')?.value || '');

  // 构建数据对象（提取码 c 传入 encryptData，会被编码进压缩URL）
  const data = { u: url, c: code || '' };
  if (name && name !== '资源') data.n = name;
  if (pageStyle !== 'default') data.t = pageStyle;
  if (adEnabled && adText.trim()) {
    data.a = adText.trim();
    data.at = adDuration;
  }

  const encoded = encryptData(data);
  return appendMarketingParams(`${BASE_URL}?d=${encoded}`, wxArticleId, homePageId);
}

// 带自定义广告设置的链接生成函数（用于批量生成和表格导入）
// 带自定义广告设置的链接生成函数（用于批量生成和表格导入）
// wxPrefix: 'batchWxId' 或 'uploadWxId'，用于读取对应面板的微信文章ID
function generateLinkWithAd(url, name, code, remark, adEnabled, adText, adDuration, wxPrefix) {
  const pageStyle = document.getElementById('pageStyle')?.value || 'default';

  // 读取微信文章ID
  const wxIds = wxPrefix ? [1,2,3].map(i => {
    const raw = (document.getElementById(`${wxPrefix}${i}`)?.value || '').trim();
    const m = raw.match(/mp\.weixin\.qq\.com\/s\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : (/^[A-Za-z0-9_-]+$/.test(raw) ? raw : '');
  }).filter(Boolean) : [];
  const wxArticleId = wxIds.join(',');
  const homeInputId = wxPrefix === 'batchWxId' ? 'batchHomePageId' : (wxPrefix === 'uploadWxId' ? 'uploadHomePageId' : 'homePageId');
  const homePageId = extractHomePageId(document.getElementById(homeInputId)?.value || '');

  const data = { u: url, c: code || '' };
  if (name && name !== '资源') data.n = name;
  if (pageStyle !== 'default') data.t = pageStyle;
  if (adEnabled && adText && adText.trim()) {
    data.a = adText.trim();
    data.at = adDuration;
  }

  const encoded = encryptData(data);
  return appendMarketingParams(`${BASE_URL}?d=${encoded}`, wxArticleId, homePageId);
}

// ==================== Tab切换 ====================
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    const tabNames = ['single', 'batch', 'upload', 'history', 'presets', 'settings'];
    const tabTexts = ['单个', '批量', '表格', '历史', '模板', '设置'];
    t.classList.toggle('active', t.textContent.includes(tabTexts[tabNames.indexOf(tab)]));
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  if (tab === 'history') { renderHistory(); initDragSort(); }
  if (tab === 'settings') loadSettings();
  if (tab === 'presets') renderPresets();
}

// ==================== 单个生成 ====================
function generateSingle() {
  let raw = document.getElementById('targetUrl').value.trim();
  if (!raw) return toast('请输入链接');

  const resolved = resolveShareInput(raw, { populate: true });
  let url = resolved?.targetUrl || resolveTargetUrlForGeneration(raw) || raw;
  if (resolved?.targetUrl) document.getElementById('targetUrl').value = url;
  
  let name = document.getElementById('resourceName').value.trim() || resolved?.resourceName || '资源';
  const code = document.getElementById('extractCode').value.trim() || resolved?.extractCode || '';
  const group = document.getElementById('groupTag').value;
  let remark = document.getElementById('remarkText').value.trim();
  const adEnabled = document.getElementById('adEnabled')?.checked || false;
  let adText = document.getElementById('adText')?.value || '';
  
  // 输入验证（URL和提取码格式）
  const validation = validateInput(url, name, remark, adEnabled ? adText : '', code);
  if (!validation.valid) {
    toast(validation.error);
    return;
  }
  
  // 自动清理违禁内容
  const sanitized = sanitizeInputData({ 
    name, 
    remark, 
    adText: adEnabled ? adText : '' 
  });
  name = sanitized.name;
  remark = sanitized.remark;
  adText = sanitized.adText;
  
  // 更新输入框显示清理后的内容
  if (sanitized.hasFiltered) {
    document.getElementById('resourceName').value = name;
    document.getElementById('remarkText').value = remark;
    if (adEnabled) document.getElementById('adText').value = adText;
    toast('已自动过滤违禁内容');
  }
  
  const link = generateLink(url, name, code, remark);
  const disk = detectDiskType(url);
  
  currentData = { url, name, code, link, disk, group, remark, time: Date.now() };
  saveToHistory(currentData);
  
  const container = document.getElementById('singleResult');
  const qrId = 'qr-single-' + Date.now();
  container.innerHTML = `
    <div class="next-step-card">
      <div>
        <div class="next-step-title">下一步：复制新链接发给用户</div>
        <div class="next-step-desc">电脑用户打开会看到二维码扫码页，手机用户打开会按你的设置进入跳转流程。结果已自动保存到历史记录。</div>
      </div>
      <div class="next-step-actions">
        <button class="btn btn-primary btn-sm" onclick="copyLink(currentData.link)">复制新链接</button>
        <button class="btn btn-secondary btn-sm" onclick="previewResult()">预览效果</button>
        <button class="btn btn-secondary btn-sm" onclick="switchTab('history')">查看历史</button>
      </div>
    </div>
    <div class="result-card">
      <div class="qr" id="${qrId}" style="width:56px;height:56px;"></div>
      <div class="info">
        <div class="name">${name} <span class="tag" style="background:${disk.color}">${disk.name}</span></div>
        <div class="link">${link}</div>
        ${remark ? `<div class="remark">📝 ${remark}</div>` : ''}
      </div>
      <div class="actions">
        <button class="btn btn-primary btn-sm" onclick="showQRModal()">查看</button>
        <button class="btn btn-secondary btn-sm" onclick="copyLink('${link}')">复制</button>
      </div>
    </div>
  `;
  
  // 生成小二维码（使用设置中的样式）
  enqueueQRRender(qrId, url, 56);
  
  toast(sanitized.hasFiltered ? '生成成功（已过滤违禁内容）' : '生成成功！');
}

// ==================== 批量生成 ====================
function generateBatch() {
  const input = document.getElementById('batchInput').value.trim();
  if (!input) return toast('请输入链接');
  
  // 获取批量广告设置
  const batchAdEnabled = document.getElementById('batchAdEnabled')?.checked || false;
  const batchAdText = document.getElementById('batchAdText')?.value || '';
  const batchAdDuration = document.getElementById('batchAdDuration')?.value || '2';
  
  const batchLinesArray = input.split('\n').map(line => line.trim()).filter(Boolean);
  const batchTotalCount = batchLinesArray.length;
  const batchResultContainer = document.getElementById('batchResult');
  batchResultContainer.innerHTML = '';
  batchGeneratedResults = [];

  const maxRenderCount = 200;
  const chunkSize = 80;

  const progressWrapElement = document.createElement('div');
  progressWrapElement.style.cssText = 'padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--bg);margin-bottom:12px;';
  progressWrapElement.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
      <div style="font-size:12px;color:var(--text2);">正在处理批量数据...</div>
      <div style="font-size:11px;color:var(--text3);" id="batchProgressText">0 / ${batchTotalCount}</div>
    </div>
    <div style="height:8px;background:rgba(0,0,0,0.06);border-radius:999px;overflow:hidden;margin-top:10px;">
      <div id="batchProgressBar" style="height:100%;width:0%;background:var(--primary);transition:width .2s;"></div>
    </div>
    <div style="font-size:11px;color:var(--text3);margin-top:10px;" id="batchProgressHint">批量很大时仅展示前 ${maxRenderCount} 条结果</div>
  `;
  batchResultContainer.appendChild(progressWrapElement);

  const batchRenderContainer = document.createElement('div');
  batchResultContainer.appendChild(batchRenderContainer);

  let batchIndex = 0;
  let successCount = 0;
  let errorCount = 0;
  let filteredCount = 0;
  const errors = [];

  const updateBatchProgress = () => {
    const progressTextElement = document.getElementById('batchProgressText');
    const progressBarElement = document.getElementById('batchProgressBar');
    if (progressTextElement) progressTextElement.textContent = `${batchIndex} / ${batchTotalCount}`;
    if (progressBarElement) progressBarElement.style.width = batchTotalCount ? (Math.min(100, (batchIndex / batchTotalCount) * 100) + '%') : '0%';
  };

  const finalizeBatch = () => {
    flushHistory();

    const hintElement = document.getElementById('batchProgressHint');
    if (hintElement) {
      hintElement.textContent = `完成：成功 ${successCount} 条，失败 ${errorCount} 条${filteredCount > 0 ? `，已过滤 ${filteredCount} 条` : ''}`;
    }

    if (batchGeneratedResults.length) {
      const nextStepElement = document.createElement('div');
      nextStepElement.className = 'next-step-card';
      nextStepElement.innerHTML = `
        <div>
          <div class="next-step-title">下一步：复制或导出本次批量链接</div>
          <div class="next-step-desc">已成功生成 ${successCount} 条链接，并保存到历史记录。常用做法是先复制全部链接发给用户，或导出 CSV 方便整理。</div>
        </div>
        <div class="next-step-actions">
          <button class="btn btn-primary btn-sm" onclick="copyAllBatchLinks()">复制全部链接</button>
          <button class="btn btn-secondary btn-sm" onclick="exportBatchResultsCSV()">导出CSV</button>
          <button class="btn btn-secondary btn-sm" onclick="switchTab('history')">查看历史</button>
        </div>
      `;
      batchResultContainer.insertBefore(nextStepElement, batchRenderContainer);

      const exportBarElement = document.createElement('div');
      exportBarElement.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:12px 0;padding:12px;background:var(--bg);border-radius:10px;';
      exportBarElement.innerHTML = `
        <button class="btn btn-success btn-sm" onclick="exportBatchResultsCSV()">📤 导出CSV</button>
        <button class="btn btn-secondary btn-sm" onclick="copyAllBatchLinks()">📋 复制全部链接</button>
      `;
      batchResultContainer.insertBefore(exportBarElement, batchRenderContainer);
    }

    let msg = `已生成 ${successCount} 条链接`;
    if (filteredCount > 0) msg += `（${filteredCount} 条已过滤违禁内容）`;
    if (errorCount > 0) msg = `成功 ${successCount} 条，失败 ${errorCount} 条`;
    toast(msg, 3000);
    if (errors.length) console.warn('批量生成错误:', errors);
  };

  const scheduleNextChunk = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(processChunk, { timeout: 200 });
    } else {
      setTimeout(processChunk, 0);
    }
  };

  const processChunk = async () => {
    const chunkEndIndex = Math.min(batchTotalCount, batchIndex + chunkSize);
    const validRows = [];

    while (batchIndex < chunkEndIndex) {
      const lineIndex = batchIndex;
      batchIndex++;
      const rawLine = batchLinesArray[lineIndex];
      const parts = rawLine.split('|').map(p => p.trim());
      let url = parts[0];
      if (!url) continue;
      const generatedSource = parseGeneratedShareLink(url);
      if (generatedSource) {
        url = generatedSource.targetUrl;
        if (!parts[1] && generatedSource.resourceName) parts[1] = generatedSource.resourceName;
        if (!parts[2] && generatedSource.extractCode) parts[2] = generatedSource.extractCode;
      } else {
        const shareParsed = parseShareText(url);
        if (shareParsed?.targetUrl) {
          url = shareParsed.targetUrl;
          if (!parts[1] && shareParsed.resourceName) parts[1] = shareParsed.resourceName;
          if (!parts[2] && shareParsed.extractCode) parts[2] = shareParsed.extractCode;
        }
      }

      const match = url.match(/[?&](pwd|password|code)=([^&]+)/i);
      let name = parts[1] || '资源' + (lineIndex + 1);
      let code = parts[2] || (match ? match[2] : '');
      code = code.replace(/[^a-zA-Z0-9]/g, '');
      const group = parts[3] || '';
      let remark = parts[4] || '';

      const validation = validateInput(url, name, remark, '', code);
      if (!validation.valid) {
        errorCount++;
        errors.push(`第${lineIndex + 1}行: ${validation.error}`);
        continue;
      }

      validRows.push({ lineIndex, url, name, code, group, remark });
    }

    const sanitizedList = await sanitizeInputDataBatch(
      validRows.map((row) => ({ name: row.name, remark: row.remark, adText: '' }))
    );

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const sanitized = sanitizedList[i];
      const name = sanitized.name || '资源' + (row.lineIndex + 1);
      const remark = sanitized.remark;
      if (sanitized.hasFiltered) filteredCount++;

      const link = generateLinkWithAd(row.url, name, row.code, remark, batchAdEnabled, batchAdText, batchAdDuration, 'batchWxId');
      const disk = detectDiskType(row.url);
      const time = Date.now();

      batchGeneratedResults.push({ url: row.url, name, code: row.code, group: row.group, remark, link, diskName: disk.name, time });
      saveToHistory({ url: row.url, name, code: row.code, link, disk, group: row.group, remark, time }, { deferSave: true });

      if (successCount < maxRenderCount) {
        const qrId = 'qr-batch-' + row.lineIndex + '-' + time;
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
          <div class="qr" id="${qrId}" style="width:56px;height:56px;"></div>
          <div class="info">
            <div class="name">${name} <span class="tag" style="background:${disk.color}">${disk.name}</span></div>
            <div class="link">${link}</div>
            ${remark ? `<div class="remark">📝 ${remark}</div>` : ''}
          </div>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" onclick="copyLink('${link}')">复制</button>
          </div>
        `;
        fragment.appendChild(card);
        enqueueQRRender(qrId, row.url, 56);
      }

      successCount++;
    }

    if (fragment.childNodes.length) batchRenderContainer.appendChild(fragment);
    updateBatchProgress();

    if (batchIndex < batchTotalCount) {
      scheduleNextChunk();
      return;
    }

    finalizeBatch();
  };

  updateBatchProgress();
  scheduleNextChunk();
}

function clearBatch() {
  document.getElementById('batchInput').value = '';
  document.getElementById('batchResult').innerHTML = '';
  batchGeneratedResults = [];
}

function exportBatchResultsCSV() {
  if (!batchGeneratedResults || !batchGeneratedResults.length) return toast('暂无可导出的数据');
  const headers = ['原始链接', '名称', '提取码', '分组', '备注', '生成链接', '网盘类型'];
  const escapeCell = (val) => {
    const str = (val ?? '').toString();
    const escaped = str.replace(/"/g, '""');
    return /[\n\r,\"]/.test(escaped) ? `"${escaped}"` : escaped;
  };
  const headerLine = headers.join(',') + '\n';
  const parts = [headerLine];
  for (const item of batchGeneratedResults) {
    const row = [
      escapeCell(item.url),
      escapeCell(item.name),
      escapeCell(item.code || ''),
      escapeCell(item.group || ''),
      escapeCell(item.remark || ''),
      escapeCell(item.link),
      escapeCell(item.diskName || '')
    ].join(',');
    parts.push(row + '\n');
  }
  const blob = new Blob(parts, { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = '批量生成结果_' + new Date().toLocaleDateString() + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('导出完成');
}

function copyAllBatchLinks() {
  if (!batchGeneratedResults || !batchGeneratedResults.length) return toast('暂无可复制的链接');
  const linksText = batchGeneratedResults.map(item => item.link).join('\n');
  navigator.clipboard.writeText(linksText).then(() => {
    toast('已复制 ' + batchGeneratedResults.length + ' 条链接');
  }).catch(() => {
    toast('复制失败');
  });
}

let uploadGeneratedResults = [];

async function downloadTemplate() {
  if (typeof ensureLib === 'function') await ensureLib('xlsx');
  if (!window.XLSX) return toast('依赖加载失败，请稍后重试');
  const ws = XLSX.utils.aoa_to_sheet([
    ['链接（必填）', '名称', '提取码', '分组', '备注'],
    ['https://pan.quark.cn/s/xxx?pwd=1234', '电影资源', '1234', '娱乐', '高清版本']
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '链接模板');
  XLSX.writeFile(wb, '链接导入模板.xlsx');
}

// 拖拽上传
const uploadZone = document.getElementById('uploadZone');
uploadZone?.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone?.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) {
    handleFileUpload({ target: { files: [file] } });
  }
});

function openUploadPicker() {
  const input = document.getElementById('fileInput');
  if (!input) return;
  input.value = '';
  input.click();
}

function resetUploadPicker() {
  const input = document.getElementById('fileInput');
  if (input) input.value = '';
}

// ==================== 表格导入处理 ====================
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (typeof ensureLib === 'function') await ensureLib('xlsx');
  if (!window.XLSX) {
    resetUploadPicker();
    return toast('XLSX 库加载失败，请刷新重试');
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const wb = XLSX.read(evt.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      const uploadAdEnabled = document.getElementById('uploadAdEnabled')?.checked || false;
      const uploadAdText = document.getElementById('uploadAdText')?.value || '';
      const uploadAdDuration = document.getElementById('uploadAdDuration')?.value || '2';

      const results = [];
      let successCount = 0, errorCount = 0;

      // 跳过标题行（如果第一行是标题）
      const startRow = (rows[0] && typeof rows[0][0] === 'string' && rows[0][0].includes('链接')) ? 1 : 0;

      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        let url = (row[0] || '').toString().trim();
        if (!url) continue;
        const generatedSource = parseGeneratedShareLink(url);
        if (generatedSource) {
          url = generatedSource.targetUrl;
          if (!row[1] && generatedSource.resourceName) row[1] = generatedSource.resourceName;
          if (!row[2] && generatedSource.extractCode) row[2] = generatedSource.extractCode;
        } else {
          const shareParsed = parseShareText(url);
          if (shareParsed?.targetUrl) {
            url = shareParsed.targetUrl;
            if (!row[1] && shareParsed.resourceName) row[1] = shareParsed.resourceName;
            if (!row[2] && shareParsed.extractCode) row[2] = shareParsed.extractCode;
          } else if (!url.startsWith('http')) {
            continue;
          }
        }

        const name = (row[1] || '资源' + (i + 1)).toString().trim();
        let code = (row[2] || '').toString().trim().replace(/[^a-zA-Z0-9]/g, '');
        const group = (row[3] || '').toString().trim();
        const remark = (row[4] || '').toString().trim();

        const validation = validateInput(url, name, remark, '', code);
        if (!validation.valid) { errorCount++; continue; }

        const sanitized = sanitizeInputData({ name, remark, adText: '' });
        const link = generateLinkWithAd(url, sanitized.name || name, code, sanitized.remark || remark, uploadAdEnabled, uploadAdText, uploadAdDuration, 'uploadWxId');
        const disk = detectDiskType(url);
        const time = Date.now();

        results.push({ url, name: sanitized.name || name, code, group, remark: sanitized.remark || remark, link, diskName: disk.name, time });
        saveToHistory({ url, name: sanitized.name || name, code, link, disk, group, remark: sanitized.remark || remark, time }, { deferSave: true });
        successCount++;
      }

      flushHistory();

      const container = document.getElementById('uploadResult');
      if (!results.length) {
        container.innerHTML = `<div style="padding:16px;color:var(--text3);text-align:center;">未识别到有效数据，请检查表格格式</div>`;
        resetUploadPicker();
        return;
      }

      // 导出按钮
      window._uploadResults = results;
      let html = `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <button class="btn btn-success btn-sm" onclick="exportUploadResultsCSV()">📤 导出CSV</button>
        <button class="btn btn-secondary btn-sm" onclick="copyAllUploadLinks()">📋 复制全部链接</button>
      </div>`;

      results.forEach(item => {
        html += `<div class="result-card">
          <div class="info">
            <div class="name">${item.name} <span class="tag" style="background:${detectDiskType(item.url).color}">${item.diskName}</span></div>
            <div class="link">${item.link}</div>
          </div>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" onclick="copyLink('${item.link}')">复制</button>
          </div>
        </div>`;
      });

      container.innerHTML = html;
      toast(`导入完成：成功 ${successCount} 条${errorCount ? '，失败 ' + errorCount + ' 条' : ''}`);
    } catch (err) {
      toast('解析失败：' + err.message);
    } finally {
      resetUploadPicker();
    }
  };
  reader.onerror = function() {
    resetUploadPicker();
    toast('文件读取失败，请重新选择表格');
  };
  reader.readAsArrayBuffer(file);
}

function exportUploadResultsCSV() {
  const results = window._uploadResults;
  if (!results?.length) return toast('暂无数据');
  const headers = ['原始链接','名称','提取码','分组','备注','生成链接','网盘类型'];
  const csv = [headers.join(','), ...results.map(r =>
    [r.url, r.name, r.code||'', r.group||'', r.remark||'', r.link, r.diskName||''].map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')
  )].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = '表格导入结果_' + new Date().toLocaleDateString() + '.csv';
  a.click();
}

function copyAllUploadLinks() {
  const results = window._uploadResults;
  if (!results?.length) return toast('暂无数据');
  navigator.clipboard.writeText(results.map(r => r.link).join('\n'))
    .then(() => toast('已复制 ' + results.length + ' 条链接'))
    .catch(() => toast('复制失败'));
}

// ==================== 历史记录 ====================
function saveToHistory(item, options = {}) {
  history.unshift(item);
  if (history.length > 100) history.pop();
  if (options.deferSave) {
    historyDirty = true;
    return;
  }
  localStorage.setItem('linkHistory', JSON.stringify(history));
}

function flushHistory() {
  if (!historyDirty) return;
  localStorage.setItem('linkHistory', JSON.stringify(history));
  historyDirty = false;
}

function renderHistory() {
  const container = document.getElementById('historyList');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filterG = document.getElementById('filterGroup').value;
  const filterD = document.getElementById('filterDisk').value;
  
  let filtered = history.filter(item => {
    if (search && !item.name.toLowerCase().includes(search) && !item.url.toLowerCase().includes(search) && !(item.remark || '').toLowerCase().includes(search)) return false;
    if (filterG && item.group !== filterG) return false;
    if (filterD && item.disk?.type !== filterD) return false;
    return true;
  });
  
  if (!filtered.length) {
    container.innerHTML = '<div class="empty"><div class="icon">📭</div><div>暂无记录</div></div>';
    return;
  }
  
  container.innerHTML = filtered.map((item) => `
    <div class="history-card">
      <div class="icon" style="background:${item.disk?.color || '#6366f1'}20">
        ${item.disk?.logo ? `<img src="${escapeHtml(item.disk.logo)}" alt="" loading="lazy" decoding="async">` : '🔗'}
      </div>
      <div class="info">
        <div class="name">${escapeHtml(item.name)}</div>
        <div class="meta">${escapeHtml(item.group || '未分组')} · ${new Date(item.time).toLocaleString()}</div>
        <div class="link">${escapeHtml(item.link)}</div>
        ${item.remark ? `<div class="remark" style="font-size:11px;color:var(--text3);margin-top:4px;">📝 ${escapeHtml(item.remark)}</div>` : ''}
      </div>
      <div class="actions">
        <button class="btn btn-secondary btn-sm" onclick="copyLink('${escapeHtml(item.link)}')">复制</button>
        <button class="btn btn-secondary btn-sm" onclick="deleteHistoryByTime(${item.time})">删除</button>
      </div>
    </div>
  `).join('');
}

const filterHistoryDebounced = debounce(() => renderHistory(), 200);
function filterHistory() { filterHistoryDebounced(); }

function deleteHistoryByTime(time) {
  const index = history.findIndex(item => item.time === time);
  if (index === -1) return;
  history.splice(index, 1);
  localStorage.setItem('linkHistory', JSON.stringify(history));
  renderHistory();
  toast('已删除');
}

function deleteHistory(index) {
  history.splice(index, 1);
  localStorage.setItem('linkHistory', JSON.stringify(history));
  renderHistory();
  toast('已删除');
}

function clearHistory() {
  if (!confirm('确定清空所有历史记录？')) return;
  history = [];
  localStorage.setItem('linkHistory', '[]');
  renderHistory();
  toast('已清空');
}

function exportHistory() {
  if (!history.length) return toast('暂无记录');
  const data = history.map(item => ({
    '名称': item.name,
    '原始链接': item.url,
    '生成链接': item.link,
    '提取码': item.code || '',
    '分组': item.group || '',
    '备注': item.remark || '',
    '网盘类型': item.disk?.name || '',
    '创建时间': new Date(item.time).toLocaleString()
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '链接历史');
  XLSX.writeFile(wb, '链接历史_' + new Date().toLocaleDateString() + '.xlsx');
  toast('导出成功');
}

function importHistory(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      history = [...data, ...history].slice(0, 100);
      localStorage.setItem('linkHistory', JSON.stringify(history));
      renderHistory();
      toast('导入成功');
    } catch { toast('导入失败'); }
  };
  reader.readAsText(file);
}

async function exportHistoryQR() {
  if (!history.length) return toast('暂无记录');
  const items = history.slice(0, 50);
  if (history.length > 50) toast('仅导出最近 50 条二维码');
  const zip = new JSZip();
  toast('正在生成...');
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const qrCode = new QRCodeStyling(getQROptions(item.url, 200, true));
    const blob = await qrCode.getRawData('png');
    const safeName = (item.name || '二维码').replace(/[\\/:*?"<>|]/g, '_');
    zip.file(`${safeName}_${i + 1}.png`, blob);
  }
  
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = '二维码_' + new Date().toLocaleDateString() + '.zip';
  a.click();
  toast('导出完成');
}

// ==================== 设置 ====================
function loadSettings() {
  document.getElementById('qrColorDark').value = settings.colorDark || '#1e293b';
  document.getElementById('qrColorLight').value = settings.colorLight || '#ffffff';
  document.getElementById('qrSize').value = settings.size || 180;
  document.getElementById('qrDotStyle').value = settings.dotStyle || 'rounded';
  document.getElementById('qrCornerStyle').value = settings.cornerStyle || 'dot';
  document.getElementById('qrColorMode').value = settings.colorMode || 'solid';
  document.getElementById('qrGradient1').value = settings.gradient1 || '#6366f1';
  document.getElementById('qrGradient2').value = settings.gradient2 || '#8b5cf6';
  document.getElementById('qrGradientType').value = settings.gradientType || 'linear';
  document.getElementById('qrGradientBg').value = settings.gradientBg || '#ffffff';
  
  toggleGradient();
  renderGroups();
  previewQRStyle();
  
  // 更新词库数量显示
  const wordCountInfo = document.getElementById('wordCountInfo');
  if (wordCountInfo) {
    const totalWords = getAllBannedWords().length;
    const baseCount = BASE_BANNED_WORDS.length;
    const remoteCount = extendedBannedWords.length;
    wordCountInfo.textContent = `当前词库：${totalWords} 个敏感词（内置 ${baseCount} + 远程 ${remoteCount}）`;
  }
}

function saveSettings() {
  settings = {
    colorDark: document.getElementById('qrColorDark').value,
    colorLight: document.getElementById('qrColorLight').value,
    size: parseInt(document.getElementById('qrSize').value),
    dotStyle: document.getElementById('qrDotStyle').value,
    cornerStyle: document.getElementById('qrCornerStyle').value,
    colorMode: document.getElementById('qrColorMode').value,
    gradient1: document.getElementById('qrGradient1').value,
    gradient2: document.getElementById('qrGradient2').value,
    gradientType: document.getElementById('qrGradientType').value,
    gradientBg: document.getElementById('qrGradientBg').value
  };
  localStorage.setItem('qrSettings', JSON.stringify(settings));
  toast('设置已保存');
}

function resetSettings() {
  settings = { 
    colorDark: '#1e293b', 
    colorLight: '#ffffff', 
    size: 180,
    dotStyle: 'rounded',
    cornerStyle: 'dot',
    colorMode: 'solid',
    gradient1: '#6366f1',
    gradient2: '#8b5cf6',
    gradientType: 'linear',
    gradientBg: '#ffffff'
  };
  localStorage.setItem('qrSettings', JSON.stringify(settings));
  loadSettings();
  toast('已恢复默认');
}

// 切换渐变/纯色设置显示
function toggleGradient() {
  const mode = document.getElementById('qrColorMode').value;
  document.getElementById('solidColorSettings').style.display = mode === 'solid' ? 'grid' : 'none';
  document.getElementById('gradientColorSettings').style.display = mode === 'gradient' ? 'grid' : 'none';
}

// 二维码预设样式
function applyQRPreset(preset) {
  const presets = {
    classic: { dotStyle: 'square', cornerStyle: 'square', colorMode: 'solid', colorDark: '#000000', colorLight: '#ffffff' },
    blue: { dotStyle: 'rounded', cornerStyle: 'dot', colorMode: 'gradient', gradient1: '#0ea5e9', gradient2: '#2563eb', gradientBg: '#ffffff' },
    purple: { dotStyle: 'dots', cornerStyle: 'extra-rounded', colorMode: 'gradient', gradient1: '#8b5cf6', gradient2: '#d946ef', gradientBg: '#ffffff' },
    sunset: { dotStyle: 'extra-rounded', cornerStyle: 'dot', colorMode: 'gradient', gradient1: '#f97316', gradient2: '#ef4444', gradientBg: '#ffffff' },
    forest: { dotStyle: 'classy-rounded', cornerStyle: 'extra-rounded', colorMode: 'gradient', gradient1: '#22c55e', gradient2: '#14b8a6', gradientBg: '#ffffff' },
    neon: { dotStyle: 'dots', cornerStyle: 'dot', colorMode: 'gradient', gradient1: '#ec4899', gradient2: '#8b5cf6', gradientBg: '#0f172a' }
  };
  
  const p = presets[preset];
  if (!p) return;
  
  document.getElementById('qrDotStyle').value = p.dotStyle;
  document.getElementById('qrCornerStyle').value = p.cornerStyle;
  document.getElementById('qrColorMode').value = p.colorMode;
  
  if (p.colorMode === 'solid') {
    document.getElementById('qrColorDark').value = p.colorDark;
    document.getElementById('qrColorLight').value = p.colorLight;
  } else {
    document.getElementById('qrGradient1').value = p.gradient1;
    document.getElementById('qrGradient2').value = p.gradient2;
    document.getElementById('qrGradientBg').value = p.gradientBg;
  }
  
  toggleGradient();
  previewQRStyle();
  toast('已应用预设：' + preset);
}

// 预览二维码样式（从DOM读取当前设置）
function previewQRStyle() {
  const container = document.getElementById('qrPreviewContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  // 预览时始终使用DOM的值
  const options = getQROptionsFromDOM('https://example.com/preview', 120);
  const qrCode = new QRCodeStyling(options);
  qrCode.append(container);
}

// 从DOM获取二维码配置（用于预览）
function getQROptionsFromDOM(data, size) {
  const colorMode = document.getElementById('qrColorMode')?.value || 'solid';
  const dotStyle = document.getElementById('qrDotStyle')?.value || 'rounded';
  const cornerStyle = document.getElementById('qrCornerStyle')?.value || 'dot';
  
  let dotsOptions = { type: dotStyle };
  
  if (colorMode === 'gradient') {
    const gradient1 = document.getElementById('qrGradient1')?.value || '#6366f1';
    const gradient2 = document.getElementById('qrGradient2')?.value || '#8b5cf6';
    const gradientType = document.getElementById('qrGradientType')?.value || 'linear';
    
    dotsOptions.gradient = {
      type: gradientType,
      rotation: gradientType === 'linear' ? Math.PI / 4 : 0,
      colorStops: [
        { offset: 0, color: gradient1 },
        { offset: 1, color: gradient2 }
      ]
    };
  } else {
    dotsOptions.color = document.getElementById('qrColorDark')?.value || '#1e293b';
  }
  
  const bgColor = colorMode === 'gradient' 
    ? (document.getElementById('qrGradientBg')?.value || '#ffffff')
    : (document.getElementById('qrColorLight')?.value || '#ffffff');
  
  const cornerColor = colorMode === 'gradient' 
    ? (document.getElementById('qrGradient1')?.value || '#6366f1')
    : (document.getElementById('qrColorDark')?.value || '#1e293b');
  
  const cornerDotColor = colorMode === 'gradient'
    ? (document.getElementById('qrGradient2')?.value || '#8b5cf6')
    : cornerColor;
  
  return {
    width: size || 180,
    height: size || 180,
    type: 'canvas',
    data: data,
    dotsOptions: dotsOptions,
    cornersSquareOptions: {
      type: cornerStyle,
      color: cornerColor
    },
    cornersDotOptions: {
      type: cornerStyle === 'square' ? 'square' : 'dot',
      color: cornerDotColor
    },
    backgroundOptions: {
      color: bgColor
    },
    qrOptions: {
      errorCorrectionLevel: 'H'
    }
  };
}

// 获取二维码配置（使用保存的设置，用于生成）
function getQROptions(data, size, useSettings = true) {
  // 如果不使用保存的设置，从DOM读取
  if (!useSettings) {
    return getQROptionsFromDOM(data, size);
  }
  
  const colorMode = settings.colorMode || 'solid';
  const dotStyle = settings.dotStyle || 'rounded';
  const cornerStyle = settings.cornerStyle || 'dot';
  
  let dotsOptions = { type: dotStyle };
  
  if (colorMode === 'gradient') {
    const gradient1 = settings.gradient1 || '#6366f1';
    const gradient2 = settings.gradient2 || '#8b5cf6';
    const gradientType = settings.gradientType || 'linear';
    
    dotsOptions.gradient = {
      type: gradientType,
      rotation: gradientType === 'linear' ? Math.PI / 4 : 0,
      colorStops: [
        { offset: 0, color: gradient1 },
        { offset: 1, color: gradient2 }
      ]
    };
  } else {
    dotsOptions.color = settings.colorDark || '#1e293b';
  }
  
  const bgColor = colorMode === 'gradient' 
    ? (settings.gradientBg || '#ffffff')
    : (settings.colorLight || '#ffffff');
  
  const cornerColor = colorMode === 'gradient' 
    ? (settings.gradient1 || '#6366f1')
    : (settings.colorDark || '#1e293b');
  
  const cornerDotColor = colorMode === 'gradient'
    ? (settings.gradient2 || '#8b5cf6')
    : cornerColor;
  
  return {
    width: size || settings.size || 180,
    height: size || settings.size || 180,
    type: 'canvas',
    data: data,
    dotsOptions: dotsOptions,
    cornersSquareOptions: {
      type: cornerStyle,
      color: cornerColor
    },
    cornersDotOptions: {
      type: cornerStyle === 'square' ? 'square' : 'dot',
      color: cornerDotColor
    },
    backgroundOptions: {
      color: bgColor
    },
    qrOptions: {
      errorCorrectionLevel: 'H'
    }
  };
}

// 生成炫酷二维码（使用保存的设置）
function generateStyledQR(data, container, size) {
  container.innerHTML = '';
  const options = getQROptions(data, size || settings.size || 180, true);
  const qrCode = new QRCodeStyling(options);
  qrCode.append(container);
  return qrCode;
}

function renderGroups() {
  const container = document.getElementById('groupList');
  container.innerHTML = groups.map(g => `
    <div class="group-chip">${g} <span class="del" onclick="removeGroup('${g}')">×</span></div>
  `).join('');
  
  const select = document.getElementById('groupTag');
  select.innerHTML = '<option value="">选择分组</option>' + groups.map(g => `<option value="${g}">${g}</option>`).join('');
  
  const filterSelect = document.getElementById('filterGroup');
  filterSelect.innerHTML = '<option value="">全部分组</option>' + groups.map(g => `<option value="${g}">${g}</option>`).join('');
}

function addGroup() {
  const input = document.getElementById('newGroup');
  const name = input.value.trim();
  if (!name) return;
  if (groups.includes(name)) return toast('分组已存在');
  groups.push(name);
  localStorage.setItem('linkGroups', JSON.stringify(groups));
  input.value = '';
  renderGroups();
  toast('添加成功');
}

function removeGroup(name) {
  groups = groups.filter(g => g !== name);
  localStorage.setItem('linkGroups', JSON.stringify(groups));
  renderGroups();
}

// ==================== 弹窗 ====================
function showQRModal() {
  if (!currentData) return;
  document.getElementById('modalTitle').textContent = currentData.name;
  const qrBox = document.getElementById('modalQr');
  
  // 使用炫酷二维码样式
  qrBox.innerHTML = '';
  currentQRCode = generateStyledQR(currentData.url, qrBox, settings.size || 180);
  
  const remarkBox = document.getElementById('modalRemark');
  if (currentData.remark) {
    remarkBox.textContent = '📝 ' + currentData.remark;
    remarkBox.style.display = 'block';
  } else {
    remarkBox.style.display = 'none';
  }
  
  document.getElementById('qrModal').classList.add('show');
}

function closeModal() { document.getElementById('qrModal').classList.remove('show'); }

function downloadQR() {
  if (!currentQRCode) return toast('请先生成二维码');
  
  currentQRCode.download({
    name: currentData?.name || '二维码',
    extension: 'png'
  });
  toast('下载成功');
}

// 旧的下载方法备用
function downloadQROld() {
  const img = document.querySelector('#modalQr img');
  if (!img) return toast('请先生成二维码');
  
  // 通过canvas下载图片
  const canvas = document.createElement('canvas');
  const size = settings.size || 180;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  const tempImg = new Image();
  tempImg.crossOrigin = 'anonymous';
  tempImg.onload = function() {
    ctx.drawImage(tempImg, 0, 0, size, size);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = (currentData?.name || '二维码') + '.png';
    a.click();
    toast('下载成功');
  };
  tempImg.onerror = function() {
    // 如果跨域失败，直接打开图片
    window.open(img.src, '_blank');
    toast('请右键保存图片');
  };
  tempImg.src = img.src;
}

function copyCurrentLink() {
  if (!currentData) return;
  copyLink(currentData.link);
}

function copyLink(link) {
  navigator.clipboard.writeText(link).then(() => toast('已复制')).catch(() => toast('复制失败'));
}

function shareToSocial() {
  if (!currentData) return;
  const text = `${currentData.name}\n${currentData.link}`;
  if (navigator.share) {
    navigator.share({ title: currentData.name, text, url: currentData.link });
  } else {
    copyLink(currentData.link);
    toast('链接已复制，请手动分享');
  }
}

// ==================== 海报 ====================
const POSTER_STYLES = {
  elegant: { name: '简约白', bg: '#ffffff', text: '#1e293b', accent: '#6366f1' },
  dark: { name: '暗夜黑', bg: '#0f172a', text: '#f1f5f9', accent: '#818cf8' },
  warm: { name: '暖阳橙', bg: '#fff7ed', text: '#9a3412', accent: '#f97316' },
  fresh: { name: '清新绿', bg: '#f0fdf4', text: '#166534', accent: '#22c55e' },
  ocean: { name: '海洋蓝', bg: '#eff6ff', text: '#1e40af', accent: '#3b82f6' }
};

function showPosterModal() {
  if (!currentData) return;
  const grid = document.getElementById('posterGrid');
  grid.innerHTML = Object.entries(POSTER_STYLES).map(([key, style]) => `
    <div class="poster-item ${key === selectedPosterStyle ? 'selected' : ''}" onclick="selectPoster('${key}')" id="poster-${key}">
      <div style="background:${style.bg};padding:24px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:16px;font-weight:600;color:${style.text}">${currentData.name}</div>
          <div style="font-size:12px;color:${style.accent};margin-top:4px;">${currentData.disk?.name || '资源分享'}</div>
        </div>
        <div style="background:#fff;padding:12px;border-radius:8px;display:flex;justify-content:center;" id="posterQr-${key}"></div>
        ${currentData.code ? `<div style="text-align:center;margin-top:12px;font-size:13px;color:${style.text};">提取码：<strong style="color:${style.accent}">${currentData.code}</strong></div>` : ''}
        <div style="text-align:center;margin-top:8px;font-size:11px;color:${style.text};opacity:.7;">扫码获取资源</div>
      </div>
      <div style="text-align:center;padding:8px;font-size:12px;color:var(--text2)">${style.name}</div>
    </div>
  `).join('');
  
  // 使用炫酷二维码样式
  setTimeout(() => {
    Object.keys(POSTER_STYLES).forEach(key => {
      const container = document.getElementById('posterQr-' + key);
      if (container) {
        container.innerHTML = '';
        // 使用QRCodeStyling生成炫酷二维码
        const qrCode = new QRCodeStyling({
          width: 120,
          height: 120,
          type: 'canvas',
          data: currentData.url,
          dotsOptions: {
            type: settings.dotStyle || 'rounded',
            color: settings.colorDark || '#1e293b'
          },
          cornersSquareOptions: {
            type: settings.cornerStyle || 'dot',
            color: settings.colorDark || '#1e293b'
          },
          cornersDotOptions: {
            type: 'dot',
            color: settings.colorDark || '#1e293b'
          },
          backgroundOptions: {
            color: '#ffffff'
          },
          qrOptions: {
            errorCorrectionLevel: 'H'
          }
        });
        qrCode.append(container);
      }
    });
  }, 100);
  
  document.getElementById('posterModal').classList.add('show');
}

function selectPoster(key) {
  selectedPosterStyle = key;
  document.querySelectorAll('.poster-item').forEach(el => el.classList.remove('selected'));
  document.getElementById('poster-' + key).classList.add('selected');
}

function closePosterModal() { document.getElementById('posterModal').classList.remove('show'); }

async function downloadSelectedPoster() {
  const posterEl = document.getElementById('poster-' + selectedPosterStyle);
  if (!posterEl) return;
  
  try {
    // 等待二维码完全渲染
    await new Promise(r => setTimeout(r, 300));
    
    const canvas = await html2canvas(posterEl.querySelector('div'), { 
      scale: 2, 
      backgroundColor: null,
      useCORS: true,
      allowTaint: true
    });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${currentData?.name || '海报'}_${selectedPosterStyle}.png`;
    a.click();
    toast('海报已下载');
  } catch (e) {
    toast('生成失败: ' + e.message);
  }
}

// ==================== 预览 ====================
function previewResult() {
  const raw = document.getElementById('targetUrl').value.trim();
  if (!raw) return toast('请先输入链接');
  const resolved = resolveShareInput(raw, { populate: true });
  const resolvedUrl = resolved?.targetUrl || resolveTargetUrlForGeneration(raw) || raw;
  if (resolved?.targetUrl) document.getElementById('targetUrl').value = resolvedUrl;
  
  const name = document.getElementById('resourceName').value.trim() || resolved?.resourceName || '资源';
  const code = document.getElementById('extractCode').value.trim() || resolved?.extractCode || '';
  const link = generateLink(resolvedUrl, name, code, '');
  
  document.getElementById('previewFrame').src = link;
  setPreviewDevice(localStorage.getItem('previewDeviceMode') || 'desktop');
  document.getElementById('previewModal').classList.add('show');
}

function closePreview() { document.getElementById('previewModal').classList.remove('show'); }

function setPreviewDevice(deviceType) {
  const previewModalElement = document.getElementById('previewModal');
  if (!previewModalElement) return;

  const normalizedDeviceType = deviceType === 'mobile' ? 'mobile' : 'desktop';
  previewModalElement.setAttribute('data-device', normalizedDeviceType);
  localStorage.setItem('previewDeviceMode', normalizedDeviceType);

  const previewDeviceDesktopBtnElement = document.getElementById('previewDeviceDesktopBtn');
  const previewDeviceMobileBtnElement = document.getElementById('previewDeviceMobileBtn');
  if (!previewDeviceDesktopBtnElement || !previewDeviceMobileBtnElement) return;

  const isDesktop = normalizedDeviceType === 'desktop';
  previewDeviceDesktopBtnElement.classList.toggle('btn-primary', isDesktop);
  previewDeviceDesktopBtnElement.classList.toggle('btn-secondary', !isDesktop);
  previewDeviceMobileBtnElement.classList.toggle('btn-primary', !isDesktop);
  previewDeviceMobileBtnElement.classList.toggle('btn-secondary', isDesktop);

  const previewFrameElement = document.getElementById('previewFrame');
  if (!previewFrameElement || !previewFrameElement.src) return;

  try {
    const previewFrameUrl = new URL(previewFrameElement.src);
    if (normalizedDeviceType === 'mobile') {
      previewFrameUrl.searchParams.set('previewDevice', 'mobile');
    } else {
      previewFrameUrl.searchParams.set('previewDevice', 'desktop');
    }
    if (previewFrameElement.src !== previewFrameUrl.toString()) {
      previewFrameElement.src = previewFrameUrl.toString();
    }
  } catch (e) {
    // 如果链接不是标准URL（极少见），则不处理
  }
}

// ==================== 批量导出二维码 ====================
async function exportAllQR() {
  const cards = document.querySelectorAll('#batchResult .result-card');
  if (!cards.length) return toast('请先生成链接');
  
  const zip = new JSZip();
  toast('正在生成...');
  
  for (let i = 0; i < cards.length; i++) {
    const canvas = cards[i].querySelector('canvas');
    if (canvas) {
      const name = cards[i].querySelector('.name')?.textContent?.split(' ')[0] || '二维码' + (i + 1);
      zip.file(`${name}.png`, canvas.toDataURL().split(',')[1], { base64: true });
    }
  }
  
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = '批量二维码_' + new Date().toLocaleDateString() + '.zip';
  a.click();
  toast('导出完成');
}

// ==================== 主题 ====================
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? '' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// ==================== 快捷键 ====================
function showShortcuts() {
  toast('G=生成 P=预览 C=复制 D=主题 1-6=切换标签 ?=帮助');
}

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    if (e.key === 'Escape') closeAllModals();
    return;
  }
  switch(e.key.toLowerCase()) {
    case 'g': generateSingle(); break;
    case 'p': previewResult(); break;
    case 'c': if (currentData) copyCurrentLink(); break;
    case 'd': toggleTheme(); break;
    case '1': switchTab('single'); break;
    case '2': switchTab('batch'); break;
    case '3': switchTab('upload'); break;
    case '4': switchTab('history'); break;
    case '5': switchTab('presets'); break;
    case '6': switchTab('settings'); break;
    case '?': showShortcutsModal(); break;
    case 'escape': closeAllModals(); break;
  }
});

// ==================== 新增功能函数 ====================

// 关闭所有弹窗
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
}

// 多格式复制弹窗
function showCopyFormatsModal() {
  if (!currentData) return toast('请先生成链接');
  const list = document.getElementById('copyFormatsList');
  list.innerHTML = Object.entries(MultiFormatCopy.formats).map(([key, val]) => 
    `<button class="btn btn-secondary" onclick="copyFormat('${key}')" style="display:flex;align-items:center;gap:8px;justify-content:center;">
      <span>${val.icon}</span>
      <span>${val.name}</span>
    </button>`
  ).join('');
  document.getElementById('copyPreview').textContent = currentData.link;
  document.getElementById('copyFormatsModal').classList.add('show');
}

function closeCopyFormatsModal() {
  document.getElementById('copyFormatsModal').classList.remove('show');
}

async function copyFormat(format) {
  if (!currentData) return;
  const result = await MultiFormatCopy.copy(currentData, format);
  document.getElementById('copyPreview').textContent = result.text;
  toast(`已复制 ${MultiFormatCopy.formats[format].name} 格式`);
}

// 快捷键弹窗
function showShortcutsModal() {
  document.getElementById('shortcutsList').innerHTML = KeyboardShortcuts.showHelp();
  document.getElementById('shortcutsModal').classList.add('show');
}

function closeShortcutsModal() {
  document.getElementById('shortcutsModal').classList.remove('show');
}

function applyGuidePreference() {
  const hidden = localStorage.getItem('hideGuidePanel') === 'true';
  document.documentElement.classList.toggle('guide-hidden', hidden);
}

function toggleGuidePanel(hidden) {
  localStorage.setItem('hideGuidePanel', hidden ? 'true' : 'false');
  applyGuidePreference();
}

function setWorkspaceMode(mode) {
  const isSimple = mode === 'simple';
  document.documentElement.classList.toggle('simple-mode', isSimple);

  const fullBtn = document.getElementById('fullModeBtn');
  const simpleBtn = document.getElementById('simpleModeBtn');
  fullBtn?.classList.toggle('active', !isSimple);
  simpleBtn?.classList.toggle('active', isSimple);
  fullBtn?.setAttribute('aria-pressed', String(!isSimple));
  simpleBtn?.setAttribute('aria-pressed', String(isSimple));
}

const ONBOARDING_KEY = 'generatorOnboardingDone';
let onboardingIndex = 0;
let onboardingPopover = null;
let onboardingScrim = null;
let onboardingTarget = null;

const onboardingSteps = [
  {
    selector: '.header h1',
    title: '欢迎使用链接生成器',
    text: '这个网站可以把原始网盘分享链接转换成更适合分发的分享页链接。电脑用户会看到二维码和扫码引导，手机用户可以按设置直接跳转到资源页面。'
  },
  {
    selector: '.tabs',
    title: '这里集中管理常用功能',
    text: '你可以单个生成链接，也可以批量生成、表格导入、查看历史记录、保存模板预设，并在设置里调整二维码样式。'
  },
  {
    selector: '#guidePanel',
    title: '先看新手快速上手',
    text: '不懂怎么生成链接时，可以先按照这里的 4 个步骤操作：粘贴链接、补充信息、预览效果、复制分发。'
  },
  {
    selector: '#guidePanel .guide-toggle',
    title: '说明可以随时隐藏',
    text: '看懂以后可以点这里隐藏说明，页面会更清爽。隐藏后顶部会出现“显示新手说明”按钮。'
  },
  {
    selector: '.workspace-mode-toggle',
    title: '选择适合自己的界面',
    text: '完整版保留广告位和说明；极简版会临时隐藏两侧广告和提示内容，适合专注生成链接。这个选择不会被记住。'
  }
];

function shouldStartOnboarding() {
  return localStorage.getItem(ONBOARDING_KEY) !== 'true';
}

let onboardingPositionHandler = null;

function bindOnboardingListeners() {
  if (onboardingPositionHandler) return;
  onboardingPositionHandler = throttle(() => positionOnboardingPopover(), 80);
  window.addEventListener('resize', onboardingPositionHandler);
  window.addEventListener('scroll', onboardingPositionHandler, true);
}

function unbindOnboardingListeners() {
  if (!onboardingPositionHandler) return;
  window.removeEventListener('resize', onboardingPositionHandler);
  window.removeEventListener('scroll', onboardingPositionHandler, true);
  onboardingPositionHandler = null;
}

function startOnboarding() {
  if (!shouldStartOnboarding() || !document.getElementById('guidePanel')) return;
  setWorkspaceMode('full');
  if (localStorage.getItem('hideGuidePanel') === 'true') {
    toggleGuidePanel(false);
  }
  onboardingIndex = 0;
  bindOnboardingListeners();
  renderOnboardingStep();
}

function renderOnboardingStep() {
  clearOnboardingFocus();
  const step = onboardingSteps[onboardingIndex];
  const target = document.querySelector(step.selector);
  if (!target) return finishOnboarding(false);

  onboardingTarget = target;
  onboardingTarget.classList.add('onboarding-focus');
  onboardingTarget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

  if (!onboardingScrim) {
    onboardingScrim = document.createElement('div');
    onboardingScrim.className = 'onboarding-scrim';
    document.body.appendChild(onboardingScrim);
  }
  if (!onboardingPopover) {
    onboardingPopover = document.createElement('div');
    onboardingPopover.className = 'onboarding-popover';
    document.body.appendChild(onboardingPopover);
  }

  const isLast = onboardingIndex === onboardingSteps.length - 1;
  onboardingPopover.innerHTML = `
    <div class="onboarding-kicker">新手引导</div>
    <div class="onboarding-title">${step.title}</div>
    <div class="onboarding-text">${step.text}</div>
    <div class="onboarding-actions">
      <span class="onboarding-step">${onboardingIndex + 1} / ${onboardingSteps.length}</span>
      <div class="onboarding-buttons">
        <button class="onboarding-btn" type="button" onclick="finishOnboarding(true)">跳过</button>
        <button class="onboarding-btn primary" type="button" onclick="nextOnboardingStep()">${isLast ? '完成' : '下一步'}</button>
      </div>
    </div>
  `;

  requestAnimationFrame(positionOnboardingPopover);
}

function positionOnboardingPopover() {
  if (!onboardingTarget || !onboardingPopover) return;
  const rect = onboardingTarget.getBoundingClientRect();
  const pop = onboardingPopover.getBoundingClientRect();
  const gap = 12;
  let top = rect.bottom + gap;
  let left = rect.left + Math.min(24, Math.max(0, rect.width - pop.width) / 2);

  if (top + pop.height > window.innerHeight - 16) {
    top = Math.max(16, rect.top - pop.height - gap);
  }
  if (left + pop.width > window.innerWidth - 16) {
    left = window.innerWidth - pop.width - 16;
  }
  left = Math.max(16, left);

  onboardingPopover.style.top = `${top}px`;
  onboardingPopover.style.left = `${left}px`;
}

function clearOnboardingFocus() {
  if (onboardingTarget) onboardingTarget.classList.remove('onboarding-focus');
  onboardingTarget = null;
}

function nextOnboardingStep() {
  if (onboardingIndex >= onboardingSteps.length - 1) return finishOnboarding(true);
  onboardingIndex += 1;
  renderOnboardingStep();
}

function finishOnboarding(saveDone) {
  clearOnboardingFocus();
  unbindOnboardingListeners();
  onboardingPopover?.remove();
  onboardingScrim?.remove();
  onboardingPopover = null;
  onboardingScrim = null;
  if (saveDone) localStorage.setItem(ONBOARDING_KEY, 'true');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && onboardingPopover) finishOnboarding(true);
});

// 模板预设
function renderPresets() {
  document.getElementById('presetsList').innerHTML = TemplatePresets.getPresetsHTML();
}

function applyPreset(id) {
  const config = TemplatePresets.apply(id);
  if (!config) return toast('预设不存在');
  
  // 使用新的applyConfig方法应用所有配置
  TemplatePresets.applyConfig(config);
  
  // 更新全局settings变量
  settings = {
    colorDark: config.qrColorDark || '#1e293b',
    colorLight: config.qrColorLight || '#ffffff',
    size: parseInt(config.qrSize) || 180,
    dotStyle: config.qrDotStyle || 'square',
    cornerStyle: config.qrCornerStyle || 'square',
    colorMode: config.qrColorMode || 'solid',
    gradient1: config.qrGradient1 || '#6366f1',
    gradient2: config.qrGradient2 || '#8b5cf6',
    gradientType: config.qrGradientType || 'linear',
    gradientBg: config.qrGradientBg || '#ffffff'
  };
  localStorage.setItem('qrSettings', JSON.stringify(settings));
  
  // 保存表单设置
  saveFormSettings();
  
  // 刷新二维码预览
  setTimeout(() => {
    previewQRStyle();
  }, 100);
  
  toast('已应用预设');
}

function deletePreset(id) {
  if (!confirm('确定删除此预设？')) return;
  TemplatePresets.remove(id);
  renderPresets();
  toast('已删除');
}

function saveCurrentAsPreset() {
  const name = prompt('请输入预设名称：');
  if (!name) return;
  
  const config = TemplatePresets.getCurrentConfig();
  TemplatePresets.add(name, config);
  renderPresets();
  toast('预设已保存');
}

// 拖拽排序初始化
function initDragSort() {
  const container = document.getElementById('historyList');
  if (!container) return;
  
  DragSortable.init(container, {
    itemSelector: '.history-card',
    onSort: (newOrder) => {
      // 重新排序历史记录
      const newHistory = newOrder.map(i => history[i]).filter(Boolean);
      history = newHistory;
      localStorage.setItem('linkHistory', JSON.stringify(history));
      toast('排序已保存');
    }
  });
}

// 批量导出增强
async function exportBatchPDF() {
  const items = history.slice(0, 50); // 最多50个
  if (!items.length) return toast('暂无记录');
  
  toast('正在生成PDF...');
  try {
    const blob = await BatchExporter.exportAsPDF(items);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '二维码合集_' + new Date().toLocaleDateString() + '.pdf';
    a.click();
    toast('PDF导出成功');
  } catch (e) {
    toast('导出失败：' + e.message);
  }
}

// ==================== 初始化 ====================
  document.addEventListener('DOMContentLoaded', async () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    setWorkspaceMode('full');
    applyGuidePreference();
    
    const savedSettings = localStorage.getItem('qrSettings');
    if (savedSettings) {
      try {
        settings = JSON.parse(savedSettings);
      } catch (e) {}
    }
    
    loadFormSettings();
    renderGroups();
    
    const filterDisk = document.getElementById('filterDisk');
    filterDisk.innerHTML = '<option value="">全部网盘</option>' + 
      Object.entries(DISK_CONFIG).filter(([k]) => k !== 'default').map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');
    
    const adEnabled = document.getElementById('adEnabled');
    const adSettings = document.getElementById('adSettings');
    adEnabled?.addEventListener('change', () => {
      adSettings.style.display = adEnabled.checked ? 'block' : 'none';
      saveFormSettings();
    });
    
    const batchAdEnabled = document.getElementById('batchAdEnabled');
    const batchAdSettings = document.getElementById('batchAdSettings');
    batchAdEnabled?.addEventListener('change', () => {
      batchAdSettings.style.display = batchAdEnabled.checked ? 'block' : 'none';
    });
    
    const uploadAdEnabled = document.getElementById('uploadAdEnabled');
    const uploadAdSettings = document.getElementById('uploadAdSettings');
    uploadAdEnabled?.addEventListener('change', () => {
      uploadAdSettings.style.display = uploadAdEnabled.checked ? 'block' : 'none';
    });
    
    setupFormAutoSave();
    setupMarketingSummaryListeners();
    setTimeout(startOnboarding, 450);
    
    if (window.QRBorderStyles) {
      const borderSelect = document.getElementById('qrBorderStyle');
      if (borderSelect) borderSelect.value = QRBorderStyles.current;
    }
    if (window.DynamicBackground) {
      const bgSelect = document.getElementById('bgEffect');
      if (bgSelect) bgSelect.value = DynamicBackground.current;
    }
    
    requestIdleCallback ? requestIdleCallback(() => initSidebarAdQR()) : setTimeout(initSidebarAdQR, 200);
    
    scheduleBannedWordsInit();
    
    window.previewQRStyle = previewQRStyle;
    window.settings = settings;
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) setWorkspaceMode('full');
  });

// ==================== 表单设置保存/加载 ====================
function saveFormSettings() {
  const getWxIds = (prefix) => [1,2,3].map(i => document.getElementById(`${prefix}${i}`)?.value || '');
  const formSettings = {
    pageStyle: document.getElementById('pageStyle')?.value || 'default',
    groupTag: document.getElementById('groupTag')?.value || '',
    adEnabled: document.getElementById('adEnabled')?.checked || false,
    adText: document.getElementById('adText')?.value || '正在为您跳转...',
    adDuration: document.getElementById('adDuration')?.value || '2',
    batchAdEnabled: document.getElementById('batchAdEnabled')?.checked || false,
    batchAdText: document.getElementById('batchAdText')?.value || '正在为您跳转...',
    batchAdDuration: document.getElementById('batchAdDuration')?.value || '2',
    uploadAdEnabled: document.getElementById('uploadAdEnabled')?.checked || false,
    uploadAdText: document.getElementById('uploadAdText')?.value || '正在为您跳转...',
    uploadAdDuration: document.getElementById('uploadAdDuration')?.value || '2',
    wxIds: getWxIds('wxArticleId'),
    batchWxIds: getWxIds('batchWxId'),
    uploadWxIds: getWxIds('uploadWxId'),
    homePageId: document.getElementById('homePageId')?.value || '',
    batchHomePageId: document.getElementById('batchHomePageId')?.value || '',
    uploadHomePageId: document.getElementById('uploadHomePageId')?.value || '',
  };
  localStorage.setItem('formSettings', JSON.stringify(formSettings));
}

function loadFormSettings() {
  const saved = localStorage.getItem('formSettings');
  if (!saved) return;
  
  try {
    const s = JSON.parse(saved);
    
    const pageStyle = document.getElementById('pageStyle');
    if (pageStyle && s.pageStyle) pageStyle.value = s.pageStyle;
    
    setTimeout(() => {
      const groupTag = document.getElementById('groupTag');
      if (groupTag && s.groupTag) groupTag.value = s.groupTag;
    }, 100);
    
    const adEnabled = document.getElementById('adEnabled');
    const adSettings = document.getElementById('adSettings');
    const adText = document.getElementById('adText');
    const adDuration = document.getElementById('adDuration');
    
    if (adEnabled && s.adEnabled !== undefined) {
      adEnabled.checked = s.adEnabled;
      if (adSettings) adSettings.style.display = s.adEnabled ? 'block' : 'none';
    }
    if (adText && s.adText) adText.value = s.adText;
    if (adDuration && s.adDuration) adDuration.value = s.adDuration;

    const restoreAdSettings = (prefix) => {
      const enabled = document.getElementById(`${prefix}AdEnabled`);
      const settingsBox = document.getElementById(`${prefix}AdSettings`);
      const text = document.getElementById(`${prefix}AdText`);
      const duration = document.getElementById(`${prefix}AdDuration`);
      const enabledKey = `${prefix}AdEnabled`;
      const textKey = `${prefix}AdText`;
      const durationKey = `${prefix}AdDuration`;
      if (enabled && s[enabledKey] !== undefined) {
        enabled.checked = !!s[enabledKey];
        if (settingsBox) settingsBox.style.display = enabled.checked ? 'block' : 'none';
      }
      if (text && s[textKey]) text.value = s[textKey];
      if (duration && s[durationKey]) duration.value = s[durationKey];
    };
    restoreAdSettings('batch');
    restoreAdSettings('upload');

    // 恢复微信文章ID
    const restoreWxIds = (prefix, ids) => {
      if (!ids) return;
      ids.forEach((val, i) => {
        const el = document.getElementById(`${prefix}${i+1}`);
        if (el && val) { el.value = val; el.style.color = '#07c160'; }
      });
    };
    restoreWxIds('wxArticleId', s.wxIds);
    restoreWxIds('batchWxId', s.batchWxIds);
    restoreWxIds('uploadWxId', s.uploadWxIds);
    ['homePageId', 'batchHomePageId', 'uploadHomePageId'].forEach(id => {
      const el = document.getElementById(id);
      if (el && s[id]) { el.value = s[id]; el.style.color = '#10b981'; }
    });

  } catch (e) {
    console.warn('加载表单设置失败:', e);
  }
}
function setupFormAutoSave() {
  document.getElementById('pageStyle')?.addEventListener('change', saveFormSettings);
  document.getElementById('groupTag')?.addEventListener('change', saveFormSettings);
  document.getElementById('adEnabled')?.addEventListener('change', saveFormSettings);
  document.getElementById('adText')?.addEventListener('input', debounce(saveFormSettings, 500));
  document.getElementById('adDuration')?.addEventListener('change', saveFormSettings);
  ['batch', 'upload'].forEach(prefix => {
    document.getElementById(`${prefix}AdEnabled`)?.addEventListener('change', saveFormSettings);
    document.getElementById(`${prefix}AdText`)?.addEventListener('input', debounce(saveFormSettings, 500));
    document.getElementById(`${prefix}AdDuration`)?.addEventListener('change', saveFormSettings);
  });
  // 微信文章ID自动保存
  [1,2,3].forEach(i => {
    ['wxArticleId','batchWxId','uploadWxId'].forEach(prefix => {
      document.getElementById(`${prefix}${i}`)?.addEventListener('input', debounce(saveFormSettings, 800));
    });
  });
  ['homePageId', 'batchHomePageId', 'uploadHomePageId'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', debounce(saveFormSettings, 800));
  });
}


function refreshMarketingSummaries() {
  document.querySelectorAll('.marketing-settings').forEach(box => {
    const titleWrap = box.querySelector('.marketing-settings-head > div');
    if (!titleWrap) return;
    let status = titleWrap.querySelector('.marketing-summary-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'marketing-summary-status';
      titleWrap.appendChild(status);
    }

    const wxCount = Array.from(box.querySelectorAll('input[id*="Wx"], input[id^="wxArticleId"]'))
      .filter(input => input.value.trim()).length;
    const homeInput = box.querySelector('#homePageId, #batchHomePageId, #uploadHomePageId');
    const adInput = box.querySelector('#adEnabled, #batchAdEnabled, #uploadAdEnabled');
    const chips = [
      { active: !!adInput?.checked, label: adInput?.checked ? '\u5e7f\u544a\u5df2\u5f00\u542f' : '\u5e7f\u544a\u5173\u95ed' },
      { active: wxCount > 0, label: wxCount > 0 ? `\u516c\u4f17\u53f7 ${wxCount} \u7bc7` : '\u672a\u8bbe\u7f6e\u516c\u4f17\u53f7' },
      { active: !!homeInput?.value.trim(), label: homeInput?.value.trim() ? '\u4e3b\u9875\u5df2\u586b\u5199' : '\u672a\u8bbe\u7f6e\u4e3b\u9875' }
    ];
    status.innerHTML = chips.map(item => `<span class="marketing-summary-chip${item.active ? ' active' : ''}">${item.label}</span>`).join('');
  });
}

const refreshMarketingSummariesDebounced = debounce(refreshMarketingSummaries, 150);

function setupMarketingSummaryListeners() {
  document.querySelectorAll('.marketing-settings input, .marketing-settings textarea, .marketing-settings select')
    .forEach(el => {
      const eventName = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(eventName, refreshMarketingSummariesDebounced);
    });
  refreshMarketingSummaries();
}

// 生成侧边栏广告二维码
function initSidebarAdQR() {
  const leftAdContainer = document.getElementById('leftAdQr');
  if (!leftAdContainer || leftAdContainer.dataset.qrReady === '1') return;

  const render = () => {
    if (leftAdContainer.dataset.qrReady === '1') return;
    leftAdContainer.dataset.qrReady = '1';
    generateSidebarAdQR();
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        render();
        observer.disconnect();
      }
    }, { rootMargin: '120px' });
    observer.observe(leftAdContainer);
  } else {
    render();
  }
}

function generateSidebarAdQR() {
  const leftAdContainer = document.getElementById('leftAdQr');
  if (!leftAdContainer) return;
  
  const adUrl = 'https://dt.bd.cn/#/pages/login/register?invite_code=3617287&qd=self_team_android';
  
  // 使用 qr-code-styling 生成美观的二维码
  const qrCode = new QRCodeStyling({
    width: 120,
    height: 120,
    data: adUrl,
    dotsOptions: {
      color: '#1e293b',
      type: 'rounded'
    },
    cornersSquareOptions: {
      type: 'extra-rounded'
    },
    cornersDotOptions: {
      type: 'dot'
    },
    backgroundOptions: {
      color: '#ffffff'
    }
  });
  
  leftAdContainer.innerHTML = '';
  qrCode.append(leftAdContainer);
}

// 复制微信号
function copyWechatId() {
  const wechatId = 'cxks25180';
  navigator.clipboard.writeText(wechatId).then(() => {
    toast('微信号已复制：' + wechatId);
  }).catch(() => {
    // 降级方案
    const input = document.createElement('input');
    input.value = wechatId;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    toast('微信号已复制：' + wechatId);
  });
}

// 双击放大二维码
function zoomQR(element, title) {
  const modal = document.getElementById('qrZoomModal');
  const titleEl = document.getElementById('qrZoomTitle');
  const content = document.getElementById('qrZoomContent');
  
  titleEl.textContent = title || '二维码';
  content.innerHTML = '';
  
  // 查找二维码内容（canvas 或 img）
  const canvas = element.querySelector('canvas');
  const img = element.querySelector('img');
  
  if (canvas) {
    // 对于 canvas 生成的二维码，重新生成一个更大的版本
    const adUrl = 'https://dt.bd.cn/#/pages/login/register?invite_code=3617287&qd=self_team_android';
    const largeQR = new QRCodeStyling({
      width: 280,
      height: 280,
      data: adUrl,
      dotsOptions: {
        color: '#1e293b',
        type: 'rounded'
      },
      cornersSquareOptions: {
        type: 'extra-rounded'
      },
      cornersDotOptions: {
        type: 'dot'
      },
      backgroundOptions: {
        color: '#ffffff'
      }
    });
    largeQR.append(content);
  } else if (img) {
    // 复制 img 并放大显示
    const newImg = document.createElement('img');
    newImg.src = img.src;
    newImg.alt = img.alt;
    newImg.style.cssText = 'width:280px;height:280px;border-radius:8px;object-fit:contain;';
    content.appendChild(newImg);
  } else {
    content.innerHTML = '<div style="color:var(--text3);padding:40px;">暂无二维码</div>';
  }
  
  modal.classList.add('show');
}

// 关闭二维码放大弹窗
function closeQRZoom() {
  document.getElementById('qrZoomModal').classList.remove('show');
}

function loadScript(localSrc, cdnSrc) {
  return new Promise((resolve, reject) => {
    const attach = (src, allowFallback) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => {
        if (allowFallback && cdnSrc && src !== cdnSrc) attach(cdnSrc, false);
        else reject(new Error('Script load failed: ' + src));
      };
      document.head.appendChild(s);
    };
    attach(localSrc, !!cdnSrc);
  });
}
window._lazyLibs = {
  html2canvas: null,
  jszip: null,
  xlsx: null
};
async function ensureLib(name) {
  if (window._lazyLibs[name]) return;
  const libs = {
    html2canvas: {
      local: 'vendor/html2canvas.min.js',
      cdn: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
    },
    jszip: {
      local: 'vendor/jszip.min.js',
      cdn: 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
    },
    xlsx: {
      local: 'vendor/xlsx.full.min.js',
      cdn: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
    }
  };
  const lib = libs[name];
  if (!lib) return;
  await loadScript(lib.local, lib.cdn);
  window._lazyLibs[name] = true;
}

document.addEventListener('DOMContentLoaded', () => {
  const _origExportAllQR = window.exportAllQR;
  window.exportAllQR = async function() {
    await ensureLib('jszip');
    if (typeof _origExportAllQR === 'function') return _origExportAllQR();
  };
  const _origHandleFileUpload = window.handleFileUpload;
  window.handleFileUpload = async function(e) {
    await ensureLib('xlsx');
    if (typeof _origHandleFileUpload === 'function') return _origHandleFileUpload(e);
  };
  const _origShowPosterModal = window.showPosterModal;
  window.showPosterModal = async function() {
    await ensureLib('html2canvas');
    if (typeof _origShowPosterModal === 'function') return _origShowPosterModal();
  };
  const _origExportHistory = window.exportHistory;
  window.exportHistory = async function() {
    await ensureLib('xlsx');
    if (typeof _origExportHistory === 'function') return _origExportHistory();
  };
  const _origExportHistoryQR = window.exportHistoryQR;
  window.exportHistoryQR = async function() {
    await ensureLib('jszip');
    if (typeof _origExportHistoryQR === 'function') return _origExportHistoryQR();
  };
});
