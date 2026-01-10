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
 * 根据URL识别网盘类型
 */
function detectDiskType(url) {
  if (!url) return DISK_CONFIG.default;
  const lowerUrl = url.toLowerCase();
  for (const [key, config] of Object.entries(DISK_CONFIG)) {
    if (key === 'default') continue;
    if (config.keywords.some(keyword => lowerUrl.includes(keyword))) {
      return { ...config, type: key };
    }
  }
  return { ...DISK_CONFIG.default, type: 'default' };
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
          adDuration: Math.min(Math.max(parseInt(data.at) || 2, 2), 5),
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
          adDuration: Math.min(Math.max(parseInt(data.at) || 2, 2), 5),
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
      adDuration: Math.min(Math.max(adDuration, 2), 5),
      isValid: !!targetUrl
    };
  }
};

// ==================== 设备检测模块 ====================

const DeviceDetector = {
  isMobile() {
    const ua = navigator.userAgent.toLowerCase();
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(ua);
    if (isTablet) return false;
    const mobileKeywords = ['iphone', 'android.*mobile', 'mobile', 'phone', 'ipod'];
    return mobileKeywords.some(keyword => new RegExp(keyword, 'i').test(ua));
  },
  
  getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad/i.test(ua)) return 'tablet';
    if (/android/i.test(ua) && !/mobile/i.test(ua)) return 'tablet';
    if (/tablet/i.test(ua)) return 'tablet';
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
      this.qrInstance = new QRCode(container, {
        text: url,
        width: 160,
        height: 160,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
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
  const params = UrlHandler.parseParams();
  if (!params.isValid) {
    PageRenderer.renderErrorPage('链接无效');
    return;
  }
  
  // 应用模板样式
  applyTemplate(params.template);
  
  const isMobile = DeviceDetector.isMobile();
  if (isMobile) {
    // 检查是否有广告设置
    if (params.adText) {
      showAdAndRedirect(params.targetUrl, params.adText, params.adDuration);
    } else {
      PageRenderer.redirect(params.targetUrl);
    }
  } else {
    PageRenderer.renderQRPage(params);
  }
}

// 显示广告并跳转
function showAdAndRedirect(targetUrl, adText, duration) {
  const overlay = document.getElementById('adOverlay');
  const textEl = document.getElementById('adText');
  const countdownEl = document.getElementById('adCountdown');
  const progressBar = document.getElementById('adProgressBar');
  
  if (!overlay) {
    // 如果没有广告元素，直接跳转
    PageRenderer.redirect(targetUrl);
    return;
  }
  
  // 设置广告文字
  textEl.textContent = adText;
  countdownEl.textContent = duration;
  progressBar.style.width = '100%';
  
  // 显示广告
  overlay.style.display = 'flex';
  
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
    }
  }, 50);
  
  // 倒计时结束后跳转
  setTimeout(() => {
    clearInterval(updateInterval);
    overlay.classList.add('fade-out');
    setTimeout(() => {
      PageRenderer.redirect(targetUrl);
    }, 300);
  }, totalMs);
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
