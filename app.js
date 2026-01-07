/**
 * URL重定向二维码页面 - 主应用脚本
 */

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
 * @param {string} url - 目标URL
 * @returns {Object} - 网盘配置
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
  /**
   * 编码URL（用于生成分享链接）
   * 使用Base64编码，支持Unicode字符
   * @param {string} url - 原始URL
   * @returns {string} - Base64编码后的字符串
   */
  encode(url) {
    try {
      // 先进行URI编码处理特殊字符，再Base64编码
      const encoded = btoa(encodeURIComponent(url));
      // 使URL安全的Base64（替换+/为-_）
      return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      console.error('URL编码失败:', e);
      return null;
    }
  },

  /**
   * 解码URL参数
   * @param {string} encodedUrl - Base64编码的URL
   * @returns {string|null} - 解码后的URL，失败返回null
   */
  decode(encodedUrl) {
    try {
      if (!encodedUrl) return null;
      // 还原URL安全的Base64
      let base64 = encodedUrl.replace(/-/g, '+').replace(/_/g, '/');
      // 补齐Base64填充
      while (base64.length % 4) {
        base64 += '=';
      }
      // Base64解码后再URI解码
      return decodeURIComponent(atob(base64));
    } catch (e) {
      console.error('URL解码失败:', e);
      return null;
    }
  },

  /**
   * 解析URL参数
   * @returns {Object} - 包含url, name, code的对象
   */
  parseParams() {
    const params = new URLSearchParams(window.location.search);
    const encodedUrl = params.get('u');
    const name = params.get('n') || '资源';
    const code = params.get('c') || '无';

    const targetUrl = this.decode(encodedUrl);

    return {
      targetUrl,
      resourceName: decodeURIComponent(name),
      extractCode: decodeURIComponent(code),
      isValid: !!targetUrl
    };
  }
};


// ==================== 设备检测模块 ====================

const DeviceDetector = {
  /**
   * 检测是否为手机设备
   * @returns {boolean} - 是否为手机
   */
  isMobile() {
    const ua = navigator.userAgent.toLowerCase();
    
    // 排除平板设备
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(ua);
    if (isTablet) return false;
    
    // 检测手机设备
    const mobileKeywords = [
      'iphone',
      'android.*mobile',
      'mobile',
      'phone',
      'ipod'
    ];
    
    return mobileKeywords.some(keyword => new RegExp(keyword, 'i').test(ua));
  },

  /**
   * 获取设备类型
   * @returns {'mobile'|'tablet'|'desktop'} - 设备类型
   */
  getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    
    // 检测平板
    if (/ipad/i.test(ua)) return 'tablet';
    if (/android/i.test(ua) && !/mobile/i.test(ua)) return 'tablet';
    if (/tablet/i.test(ua)) return 'tablet';
    
    // 检测手机
    if (this.isMobile()) return 'mobile';
    
    // 默认为桌面
    return 'desktop';
  }
};


// ==================== 二维码生成模块 ====================

const QRCodeGenerator = {
  /**
   * 生成二维码到指定容器
   * @param {string} url - 目标URL
   * @param {HTMLElement} container - 容器元素
   */
  generate(url, container) {
    try {
      // 清空容器
      container.innerHTML = '';
      
      // 使用QRCode.js库生成二维码
      new QRCode(container, {
        text: url,
        width: 180,
        height: 180,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (e) {
      console.error('二维码生成失败:', e);
      // 显示备用文本链接
      container.innerHTML = `<a href="${url}" style="word-break: break-all; color: #1890ff;">${url}</a>`;
    }
  }
};

// ==================== 页面渲染模块 ====================

const PageRenderer = {
  /**
   * 渲染二维码页面
   * @param {Object} params - 解析后的参数
   */
  renderQRPage(params) {
    const { targetUrl, resourceName, extractCode } = params;
    
    // 识别网盘类型
    const diskConfig = detectDiskType(targetUrl);
    
    // 更新页面标题
    document.title = diskConfig.name;
    
    // 更新顶部Logo
    const siteLogo = document.getElementById('siteLogo');
    const siteName = document.getElementById('siteName');
    if (diskConfig.logo) {
      siteLogo.src = diskConfig.logo;
      siteLogo.style.display = 'inline-block';
    }
    siteName.textContent = diskConfig.name;
    
    // 更新资源名称
    document.getElementById('resourceName').textContent = `资源名称：${resourceName}`;
    
    // 更新提取码
    document.getElementById('extractCode').textContent = extractCode;
    
    // 更新扫码提示
    document.getElementById('scanTip').innerHTML = `打开 <span class="app-name">${diskConfig.appName}</span> - 点击搜索框相机 - 扫码`;
    
    // 更新底部APP名称
    document.getElementById('bottomAppName').textContent = diskConfig.appName;
    
    // 更新引导图
    const guideRight = document.getElementById('guideRight');
    if (diskConfig.guide) {
      guideRight.innerHTML = `<img src="${diskConfig.guide}" alt="引导图" class="guide-img">`;
    }
    
    // 生成二维码
    const qrContainer = document.getElementById('qrContainer');
    QRCodeGenerator.generate(targetUrl, qrContainer);
    
    // 显示二维码卡片，隐藏错误页面
    document.getElementById('qrCard').style.display = 'block';
    document.getElementById('errorContainer').style.display = 'none';
  },

  /**
   * 渲染错误页面
   * @param {string} message - 错误信息
   */
  renderErrorPage(message = '链接无效') {
    document.getElementById('qrCard').style.display = 'none';
    document.getElementById('guideRight').style.display = 'none';
    document.getElementById('errorContainer').style.display = 'block';
    document.querySelector('.error-container h2').textContent = message;
  },

  /**
   * 执行跳转
   * @param {string} url - 目标URL
   */
  redirect(url) {
    window.location.href = url;
  }
};


// ==================== 主程序入口 ====================

/**
 * 页面初始化
 */
function init() {
  // 解析URL参数
  const params = UrlHandler.parseParams();
  
  // 检查参数有效性
  if (!params.isValid) {
    PageRenderer.renderErrorPage('链接无效');
    return;
  }
  
  // 检测设备类型
  const isMobile = DeviceDetector.isMobile();
  
  if (isMobile) {
    // 手机设备：自动跳转
    PageRenderer.redirect(params.targetUrl);
  } else {
    // 电脑/平板：显示二维码页面
    PageRenderer.renderQRPage(params);
  }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', init);

// 导出模块供外部使用（如生成链接工具）
if (typeof window !== 'undefined') {
  window.UrlHandler = UrlHandler;
  window.DeviceDetector = DeviceDetector;
  window.detectDiskType = detectDiskType;
  window.DISK_CONFIG = DISK_CONFIG;
}
