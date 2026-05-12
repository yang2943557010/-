// pages/index/index.js
const UrlHandler = require('../../utils/url-handler');
const { detectDiskType } = require('../../utils/disk-config');
const config = require('../../config');

Page({
  data: {
    // 页面状态
    showCard: false,
    showError: false,
    showAd: false,
    showSkipBtn: false,
    showGuide: false,
    adVisible: false,
    
    // 设备信息
    isMobile: true,
    
    // 资源信息
    resourceName: '加载中...',
    extractCode: '--',
    targetUrl: '',
    
    // 网盘信息
    diskName: '资源分享',
    diskLogo: '',
    diskType: 'default',
    appName: '手机浏览器',
    guideImage: '',
    
    // 广告相关
    adText: '',
    adCountdown: 3,
    adHint: '请稍候，正在为您准备资源...',
    adThemeClass: 'theme-gradient',
    adOpacity: 0,
    progressWidth: 0,
    skipBtnText: '跳过',
    
    // 背景色
    bgColor: '#f8fafc',
    
    // 动画状态
    cardFadeIn: false,
    qrFadeIn: false,
    
    // 错误信息
    errorMessage: '链接无效'
  },

  onLoad(options) {
    // 检测设备类型
    const systemInfo = wx.getSystemInfoSync();
    const isMobile = systemInfo.platform === 'ios' || systemInfo.platform === 'android';
    
    this.setData({ isMobile });
    
    // 设置动画延迟
    setTimeout(() => {
      this.initPage(options);
    }, 300);
  },

  // 初始化页面
  initPage(options) {
    const params = UrlHandler.parseParams(options);
    
    if (!params.isValid) {
      this.showErrorPage('😕 链接无效');
      return;
    }

    // 应用模板样式
    this.applyTemplate(params.template);

    // 检查是否有广告设置
    if (params.adText) {
      this.showAdAndRedirect(params.targetUrl, params.adText, params.adDuration, {
        resourceName: params.resourceName,
        template: params.template
      });
    } else {
      // 直接显示二维码页面
      this.renderQRPage(params);
    }
  },

  // 显示二维码页面
  renderQRPage(params) {
    const { targetUrl, resourceName, extractCode } = params;
    const diskConfig = detectDiskType(targetUrl);

    this.setData({
      showCard: true,
      showError: false,
      resourceName: resourceName,
      extractCode: extractCode,
      targetUrl: targetUrl,
      diskName: diskConfig.name,
      diskLogo: diskConfig.logo || '',
      diskType: diskConfig.type || 'default',
      appName: diskConfig.appName,
      guideImage: diskConfig.guide || '',
      showGuide: !!diskConfig.guide,
      cardFadeIn: true
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: diskConfig.name
    });

    // 生成二维码
    setTimeout(() => {
      this.generateQRCode(targetUrl);
      
      setTimeout(() => {
        this.setData({ qrFadeIn: true });
      }, 200);
    }, 100);
  },

  // 生成二维码
  generateQRCode(url) {
    const query = wx.createSelectorQuery();
    query.select('#qrcode')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 设置canvas尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          ctx.scale(dpr, dpr);
          
          // 绘制二维码
          this.drawQRCode(ctx, url, res[0].width, res[0].height);
        }
      });
  },

  // 绘制二维码
  drawQRCode(ctx, url, width, height) {
    // 清空画布
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制二维码占位符
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.8;
    
    // 绘制三个定位图案
    this.draw定位图案(ctx, centerX - size / 2, centerY - size / 2, size * 0.25);
    this.draw定位图案(ctx, centerX + size / 2 - size * 0.25, centerY - size / 2, size * 0.25);
    this.draw定位图案(ctx, centerX - size / 2, centerY + size / 2 - size * 0.25, size * 0.25);
    
    // 绘制中间的图案
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(centerX - size * 0.1, centerY - size * 0.1, size * 0.2, size * 0.2);
    
    // 绘制数据点
    ctx.fillStyle = '#4f46e5';
    const dotSize = size * 0.03;
    for (let i = 0; i < 100; i++) {
      const x = centerX - size / 2 + Math.random() * size;
      const y = centerY - size / 2 + Math.random() * size;
      ctx.fillRect(x, y, dotSize, dotSize);
    }
    
    // 绘制文字
    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('扫码访问资源', centerX, height - 15);
  },

  // 绘制定位图案
  draw定位图案(ctx, x, y, size) {
    // 外框
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(x, y, size, size);
    
    // 内框（白色）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + size * 0.15, y + size * 0.15, size * 0.7, size * 0.7);
    
    // 中心
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(x + size * 0.3, y + size * 0.3, size * 0.4, size * 0.4);
  },

  // 显示广告并跳转
  showAdAndRedirect(targetUrl, adText, duration, params = {}) {
    const diskConfig = detectDiskType(targetUrl);
    
    // 设置主题
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
    const adThemeClass = themeMap[template] || 'theme-gradient';
    
    // 设置提示文字
    const hints = [
      '请稍候，正在为您准备资源...',
      '即将为您打开资源页面...',
      '资源加载中，请耐心等待...',
      '正在连接资源服务器...'
    ];
    const adHint = hints[Math.floor(Math.random() * hints.length)];
    
    this.setData({
      showAd: true,
      adVisible: false,
      adText: adText,
      adCountdown: duration,
      adHint: adHint,
      adThemeClass: adThemeClass,
      diskLogo: diskConfig.logo || '',
      diskName: diskConfig.name,
      progressWidth: 0,
      showSkipBtn: false,
      skipBtnText: '跳过',
      adOpacity: 0
    });

    // 保存跳转目标
    this._targetUrl = targetUrl;
    this._duration = duration;

    // 1秒后显示跳过按钮
    setTimeout(() => {
      this.setData({ 
        showSkipBtn: true,
        adVisible: true
      });
    }, 1000);

    // 淡入动画
    setTimeout(() => {
      this.setData({ adOpacity: 1 });
    }, 100);

    // 开始倒计时
    this.startCountdown(duration);
  },

  // 开始倒计时
  startCountdown(duration) {
    let remaining = duration;
    const startTime = Date.now();
    const totalMs = duration * 1000;

    // 更新进度条和倒计时
    this._countdownTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.max(0, 100 - (elapsed / totalMs * 100));
      
      const newRemaining = Math.ceil((totalMs - elapsed) / 1000);
      if (newRemaining !== remaining && newRemaining >= 0) {
        remaining = newRemaining;
        this.setData({
          adCountdown: remaining,
          progressWidth: progress
        });
      }

      if (elapsed >= totalMs) {
        clearInterval(this._countdownTimer);
        this.doRedirect();
      }
    }, 50);
  },

  // 执行跳转
  doRedirect() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
    }
    
    // 淡出动画
    this.setData({ adOpacity: 0 });
    
    setTimeout(() => {
      this.setData({ showAd: false });
      
      if (this._targetUrl) {
        this.redirectToUrl(this._targetUrl);
      }
    }, 500);
  },

  // 跳过广告
  skipAd() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
    }
    
    this.doRedirect();
  },

  // 跳转到目标URL
  redirectToUrl(url) {
    wx.showModal({
      title: '提示',
      content: '即将跳转到资源页面，是否继续？',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: url,
            success: () => {
              wx.showToast({
                title: '链接已复制，请在浏览器中打开',
                icon: 'none',
                duration: 3000
              });
            }
          });
        }
      }
    });
  },

  // 显示错误页面
  showErrorPage(message) {
    this.setData({
      showCard: false,
      showError: true,
      errorMessage: message
    });
  },

  // 应用模板样式
  applyTemplate(template) {
    const bgMap = {
      'default': '#f8fafc',
      'minimal': '#ffffff',
      'gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'sunset': 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #f6d365 100%)',
      'ocean': 'linear-gradient(135deg, #0c3483 0%, #a2b6df 50%, #6b8dd6 100%)',
      'forest': 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      'cherry': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)',
      'midnight': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      'aurora': 'linear-gradient(135deg, #00c6fb 0%, #005bea 25%, #a855f7 50%, #ec4899 75%, #f97316 100%)',
      'candy': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%)',
      'card': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    };
    
    const bgColor = bgMap[template] || '#f8fafc';
    this.setData({ bgColor });
  },

  // 复制链接
  copyLink() {
    if (this.data.targetUrl) {
      wx.setClipboardData({
        data: this.data.targetUrl,
        success: () => {
          wx.showToast({
            title: '链接已复制',
            icon: 'success',
            duration: 2000
          });
        }
      });
    }
  },

  // 复制提取码
  copyExtractCode() {
    if (this.data.extractCode && this.data.extractCode !== '--') {
      wx.setClipboardData({
        data: this.data.extractCode,
        success: () => {
          wx.showToast({
            title: '提取码已复制',
            icon: 'success',
            duration: 2000
          });
        }
      });
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: this.data.resourceName || '资源分享',
      path: '/pages/index/index'
    };
  },

  onUnload() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
    }
  }
});