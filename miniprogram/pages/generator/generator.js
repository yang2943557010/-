// pages/generator/generator.js
const UrlHandler = require('../../utils/url-handler');

Page({
  data: {
    url: '',
    resourceName: '',
    extractCode: '',
    styleIndex: 0,
    styles: ['默认', '渐变', '日落', '海洋', '森林', '樱桃', '午夜', '极光', '糖果', '卡片'],
    styleValues: ['default', 'gradient', 'sunset', 'ocean', 'forest', 'cherry', 'midnight', 'aurora', 'candy', 'card'],
    adText: '',
    adDuration: 3,
    generatedUrl: '',
    showQRCode: false
  },

  onLoad() {
    // 页面加载
  },

  // URL输入
  onUrlInput(e) {
    this.setData({ url: e.detail.value });
  },

  // 资源名称输入
  onNameInput(e) {
    this.setData({ resourceName: e.detail.value });
  },

  // 提取码输入
  onCodeInput(e) {
    this.setData({ extractCode: e.detail.value });
  },

  // 风格选择
  onStyleChange(e) {
    this.setData({ styleIndex: e.detail.value });
  },

  // 广告文字输入
  onAdTextInput(e) {
    this.setData({ adText: e.detail.value });
  },

  // 广告时长改变
  onAdDurationChange(e) {
    this.setData({ adDuration: e.detail.value });
  },

  // 生成链接
  generateLink() {
    const { url, resourceName, extractCode, styleIndex, styleValues, adText, adDuration } = this.data;

    if (!url) {
      wx.showToast({
        title: '请输入网盘链接',
        icon: 'none'
      });
      return;
    }

    // 验证URL格式
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      wx.showToast({
        title: '请输入有效的链接',
        icon: 'none'
      });
      return;
    }

    // 构建数据对象
    const data = {
      u: url,
      n: resourceName || '资源',
      c: extractCode || '',
      t: styleValues[styleIndex],
      a: adText || '',
      at: adDuration.toString()
    };

    // 编码数据
    const encoded = UrlHandler.encodeData(data);

    if (encoded) {
      // 生成完整链接
      const baseUrl = 'https://your-domain.com/index.html'; // 替换为你的域名
      const generatedUrl = `${baseUrl}?d=${encoded}`;

      this.setData({ generatedUrl });

      wx.showToast({
        title: '链接已生成',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '生成失败，请检查链接格式',
        icon: 'none'
      });
    }
  },

  // 复制链接
  copyLink() {
    if (this.data.generatedUrl) {
      wx.setClipboardData({
        data: this.data.generatedUrl,
        success: () => {
          wx.showToast({
            title: '链接已复制',
            icon: 'success'
          });
        }
      });
    }
  },

  // 生成二维码
  generateQRCode() {
    if (!this.data.generatedUrl) {
      wx.showToast({
        title: '请先生成链接',
        icon: 'none'
      });
      return;
    }

    this.setData({ showQRCode: true });

    // 延迟生成二维码，确保canvas已渲染
    setTimeout(() => {
      this.drawQRCode();
    }, 100);
  },

  // 绘制二维码
  drawQRCode() {
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
          
          // 绘制二维码占位符
          this.drawQRPlaceholder(ctx, this.data.generatedUrl, res[0].width, res[0].height);
        }
      });
  },

  // 绘制二维码占位符
  drawQRPlaceholder(ctx, url, width, height) {
    // 清空画布
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制边框
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // 绘制二维码图案（简化版）
    this.drawSimpleQRPattern(ctx, width, height);
    
    // 绘制文字
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('扫码访问', width / 2, height - 30);
  },

  // 绘制简单的二维码图案
  drawSimpleQRPattern(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const size = 120;
    
    // 绘制三个定位图案
    this.draw定位图案(ctx, centerX - size / 2, centerY - size / 2, 30);
    this.draw定位图案(ctx, centerX + size / 2 - 30, centerY - size / 2, 30);
    this.draw定位图案(ctx, centerX - size / 2, centerY + size / 2 - 30, 30);
    
    // 绘制中间的图案
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 15, centerY - 15, 30, 30);
    
    // 绘制一些随机点
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 50; i++) {
      const x = centerX - size / 2 + Math.random() * size;
      const y = centerY - size / 2 + Math.random() * size;
      const dotSize = 2 + Math.random() * 4;
      ctx.fillRect(x, y, dotSize, dotSize);
    }
  },

  // 绘制定位图案
  draw定位图案(ctx, x, y, size) {
    // 外框
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, size, size);
    
    // 内框（白色）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
    
    // 中心
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 8, y + 8, size - 16, size - 16);
  },

  // 预览链接
  previewLink() {
    if (this.data.generatedUrl) {
      // 在小程序中预览链接
      wx.showModal({
        title: '预览链接',
        content: this.data.generatedUrl,
        showCancel: false,
        confirmText: '确定'
      });
    }
  }
});