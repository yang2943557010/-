/**
 * URL重定向二维码页面 - 主应用脚本
 * @license Proprietary - All Rights Reserved
 * @copyright 2024
 */

// ==================== 加密模块 ====================

const CryptoUtil = {
  SECRET_KEY: 'Qr24',  // 短密钥
  
  /**
   * 加密数据对象为短字符串
  /**
   * 加密数据对象为短字符串
   */
  encryptData(data) {
    try {
      // 紧凑格式：u|n|c|t|a|at 用|分隔
      const parts = [
        data.u || '',
        data.n || '',
        data.c || '',
        data.t || '',
        data.a || '',
        data.at || ''
      ];
      // 去掉末尾空值
      while (parts.length > 1 && !parts[parts.length - 1]) parts.pop();
      const str = parts.join('|');
      
      // XOR加密
      const encrypted = this.xorEncrypt(str);
      // Base64编码
      return this.toBase64Url(encrypted);
    } catch (e) {
      console.error('加密失败:', e);
      return null;
    }
  },
  
  /**
   * 解密字符串为数据对象
   */
  decryptData(str) {
    try {
      if (!str) return null;
      // Base64解码
      const encrypted = this.fromBase64Url(str);
      // XOR解密
      const decrypted = this.xorEncrypt(encrypted);
      // 解析紧凑格式
      const parts = decrypted.split('|');
      return {
        u: parts[0] || '',
        n: parts[1] || '',
        c: parts[2] || '',
        t: parts[3] || '',
        a: parts[4] || '',
        at: parts[5] || ''
      };
    } catch (e) {
      console.error('解密失败:', e);
      return null;
    }
  },
  
  // XOR加密/解密
  xorEncrypt(str) {
    const key = this.SECRET_KEY;
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  },
  
  // 转URL安全Base64
  toBase64Url(str) {
    try {
      // 先转UTF-8字节
      const utf8 = unescape(encodeURIComponent(str));
      const b64 = btoa(utf8);
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
  },
  
  // 从URL安全Base64解码
  fromBase64Url(str) {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    try {
      const utf8 = atob(b64);
      return decodeURIComponent(escape(utf8));
    } catch (e) {
      return atob(b64);
    }
  },
  
  // 兼容旧版
  encrypt(text) {
    const encrypted = this.xorEncrypt(text);
    return this.toBase64Url(encrypted);
  },
  
  decrypt(str) {
    try {
      if (!str) return null;
      const encrypted = this.fromBase64Url(str);
      return this.xorEncrypt(encrypted);
    } catch (e) {
      return null;
    }
  }
};

// ==================== 网盘配置 ====================

const DISK_CONFIG = {
  baidu: {
    name: '百度网盘',
    keywords: ['pan.baidu.com', 'yun.baidu.com'],
    logo: 'https://testlink11.oss-cn-beijing.aliyuncs.com/baidu-logo.png',
    guide: 'https://testlink11.oss-cn-beijing.aliyuncs.com/baidu-guide.png',
    appName: '百度网盘APP',
    color: '#06a7ff'
  },
  quark: {
    name: '夸克网盘',
    keywords: ['pan.quark.cn', 'quark.cn'],
    logo: 'https://testlink11.oss-cn-beijing.aliyuncs.com/quark-logo.png',
    guide: 'https://testlink11.oss-cn-beijing.aliyuncs.com/quark-guide.png',
    appName: '夸克APP',
    color: '#1890ff'
  },
  aliyun: {
    name: '阿里云盘',
    keywords: ['aliyundrive.com', 'alipan.com'],
    logo: 'https://img.alicdn.com/imgextra/i1/O1CN01JDQCi21Hp8ASbOY1a_!!6000000000806-2-tps-512-512.png',
    guide: '',
    appName: '阿里云盘APP',
    color: '#ff6a00'
  },
  xunlei: {
    name: '迅雷云盘',
    keywords: ['pan.xunlei.com'],
    logo: 'https://pan.xunlei.com/favicon.ico',
    guide: '',
    appName: '迅雷APP',
    color: '#0078d4'
  },
  '115': {
    name: '115网盘',
    keywords: ['115.com'],
    logo: 'https://115.com/favicon.ico',
    guide: '',
    appName: '115APP',
    color: '#2b579a'
  },
  lanzou: {
    name: '蓝奏云',
    keywords: ['lanzou', 'lanzoui', 'lanzoux'],
    logo: 'https://www.lanzou.com/favicon.ico',
    guide: '',
    appName: '手机浏览器',
    color: '#0099ff'
  },
  tianyi: {
    name: '天翼云盘',
    keywords: ['cloud.189.cn', 'e.189.cn'],
    logo: 'https://cloud.189.cn/favicon.ico',
    guide: '',
    appName: '天翼云盘APP',
    color: '#21a9e1'
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
    if (shortId && window.ShortLinkGenerator) {
      ShortLinkGenerator.init();
      const data = ShortLinkGenerator.resolve(shortId);
      if (data && data.u) {
        return {
          targetUrl: data.u,
          resourceName: data.n || '资源',
          extractCode: data.c || '无',
          template: data.t || 'default',
          adText: data.a || '',
          adDuration: Math.min(Math.max(parseInt(data.at) || 2, 1), 5),
          isValid: true
        };
      }
    }
    
    // 新版：单参数d包含所有数据
    const compressedData = params.get('d');
    if (compressedData) {
      const data = this.decodeData(compressedData);
      if (data && data.u) {
        return {
          targetUrl: data.u,
          resourceName: data.n || '资源',
          extractCode: data.c || '无',
          template: data.t || 'default',
          adText: data.a || '',
          adDuration: Math.min(Math.max(parseInt(data.at) || 2, 1), 5),
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
  
  generate(url, container) {
    try {
      container.innerHTML = '';
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
      console.error('二维码生成失败:', e);
      container.innerHTML = `<a href="${url}" style="word-break: break-all; color: #1890ff;">${url}</a>`;
    }
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
      siteLogo.src = diskConfig.logo;
      siteLogo.style.display = 'inline-block';
    }
    siteName.textContent = diskConfig.name;
    
    document.getElementById('resourceName').textContent = `资源名称：${resourceName}`;
    document.getElementById('extractCode').textContent = extractCode;
    document.getElementById('scanTip').innerHTML = `打开 <span class="app-name">${diskConfig.appName}</span> - 点击搜索框相机 - 扫码`;
    document.getElementById('bottomAppName').textContent = diskConfig.appName;
    
    const guideRight = document.getElementById('guideRight');
    if (diskConfig.guide) {
      guideRight.innerHTML = `<img src="${diskConfig.guide}" alt="引导图" class="guide-img">`;
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
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      processInit();
    });
  } else {
    processInit();
  }
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
  const resourceInfo = document.getElementById('adResourceInfo');
  const resourceName = document.getElementById('adResourceName');
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
  
  // 设置资源信息
  if (params.resourceName) {
    resourceName.textContent = params.resourceName;
    resourceInfo.style.display = 'block';
  }
  
  // 设置网盘信息
  const diskConfig = detectDiskType(targetUrl);
  if (diskConfig.logo) {
    diskLogo.src = diskConfig.logo;
    diskLogo.style.display = 'inline';
  } else {
    diskLogo.style.display = 'none';
  }
  diskName.textContent = diskConfig.name;
  
  // 根据网盘类型设置图标
  const iconMap = {
    'baidu': '💙',
    'quark': '⚡',
    'aliyun': '☁️',
    'xunlei': '⚡',
    '115': '📦',
    'lanzou': '🔵',
    'tianyi': '☁️',
    'default': '🚀'
  };
  adIcon.textContent = iconMap[diskConfig.type] || '🚀';
  
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

document.addEventListener('DOMContentLoaded', init);

// 导出模块
if (typeof window !== 'undefined') {
  window.UrlHandler = UrlHandler;
  window.CryptoUtil = CryptoUtil;
  window.DeviceDetector = DeviceDetector;
  window.detectDiskType = detectDiskType;
  window.DISK_CONFIG = DISK_CONFIG;
}
