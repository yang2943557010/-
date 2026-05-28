/**
 * 增强功能模块（仅链接生成器页使用）
 */
if (!/\/pages\/generator\.html$/i.test(location.pathname) && !location.pathname.endsWith('/generator.html') && location.pathname !== '/generator') {
  if (typeof window !== 'undefined') {
    window.__enhancementsSkipped = true;
  }
} else {

// ==================== 1. 二维码边框样式 ====================
const QRBorderStyles = {
  styles: {
    none: { name: '无边框', css: '' },
    simple: { name: '简约', css: 'border: 2px solid var(--primary); border-radius: 12px;' },
    rounded: { name: '圆角', css: 'border: 3px solid #e2e8f0; border-radius: 20px; padding: 8px;' },
    shadow: { name: '阴影', css: 'box-shadow: 0 8px 30px rgba(0,0,0,0.12); border-radius: 16px;' },
    gradient: { name: '渐变', css: 'border: 3px solid transparent; background: linear-gradient(white, white) padding-box, linear-gradient(135deg, #667eea, #764ba2) border-box; border-radius: 16px;' },
    neon: { name: '霓虹', css: 'border: 2px solid #00ff88; box-shadow: 0 0 10px #00ff88, 0 0 20px #00ff8855; border-radius: 12px;' },
    gold: { name: '金边', css: 'border: 3px solid #fbbf24; box-shadow: 0 4px 15px rgba(251,191,36,0.3); border-radius: 12px;' },
    dashed: { name: '虚线', css: 'border: 3px dashed var(--primary); border-radius: 12px; padding: 6px;' }
  },
  
  current: 'none',
  
  apply(style, element) {
    if (!element) return;
    const styleConfig = this.styles[style] || this.styles.none;
    element.style.cssText = styleConfig.css;
    this.current = style;
    localStorage.setItem('qrBorderStyle', style);
  },
  
  init() {
    this.current = localStorage.getItem('qrBorderStyle') || 'none';
  },
  
  getStylesHTML() {
    return Object.entries(this.styles).map(([key, val]) => 
      `<option value="${key}" ${this.current === key ? 'selected' : ''}>${val.name}</option>`
    ).join('');
  }
};

// ==================== 2. 动态背景 ====================
const DynamicBackground = {
  effects: {
    none: { name: '无', init: () => {} },
    particles: { name: '粒子', init: () => DynamicBackground.initParticles() },
    gradient: { name: '渐变流动', init: () => DynamicBackground.initGradient() },
    waves: { name: '波浪', init: () => DynamicBackground.initWaves() },
    stars: { name: '星空', init: () => DynamicBackground.initStars() },
    bubbles: { name: '气泡', init: () => DynamicBackground.initBubbles() }
  },
  
  current: 'none',
  canvas: null,
  ctx: null,
  animationId: null,
  resizeHandler: null,
  visibilityHandler: null,
  
  init() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.current = 'none';
      localStorage.setItem('bgEffect', 'none');
      return;
    }
    this.current = localStorage.getItem('bgEffect') || 'none';
    if (!this.visibilityHandler) {
      this.visibilityHandler = () => {
        if (document.visibilityState === 'hidden') {
          this.stop();
          return;
        }
        if (this.current !== 'none' && this.canvas && this.ctx && !this.animationId) {
          this.resize();
          this.effects[this.current]?.init();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.current !== 'none') {
      this.apply(this.current);
    }
  },
  
  apply(effect) {
    this.stop();
    this.current = effect;
    localStorage.setItem('bgEffect', effect);
    
    if (effect === 'none') {
      this.removeCanvas();
      return;
    }
    
    this.createCanvas();
    this.effects[effect]?.init();
  },
  
  createCanvas() {
    this.removeCanvas();
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'bgCanvas';
    this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    document.body.prepend(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    if (!this.resizeHandler) {
      let resizeTimer = null;
      this.resizeHandler = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => this.resize(), 150);
      };
    }
    window.addEventListener('resize', this.resizeHandler);
  },
  
  removeCanvas() {
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  },
  
  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  },
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  },
  
  // 粒子效果
  initParticles() {
    const particles = [];
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 20 : 50;
    
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
    
    const animate = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
        
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = isDark ? `rgba(129,140,248,${p.opacity})` : `rgba(99,102,241,${p.opacity})`;
        this.ctx.fill();
      });
      
      // 连线（移动端跳过以降低 CPU）
      if (!isMobile) {
        particles.forEach((p1, i) => {
          particles.slice(i + 1).forEach(p2 => {
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (dist < 120) {
              this.ctx.beginPath();
              this.ctx.moveTo(p1.x, p1.y);
              this.ctx.lineTo(p2.x, p2.y);
              this.ctx.strokeStyle = isDark ? `rgba(129,140,248,${0.1 * (1 - dist/120)})` : `rgba(99,102,241,${0.1 * (1 - dist/120)})`;
              this.ctx.stroke();
            }
          });
        });
      }
      
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  },
  
  // 渐变流动
  initGradient() {
    let hue = 0;
    const animate = () => {
      hue = (hue + 0.2) % 360;
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
      
      if (isDark) {
        gradient.addColorStop(0, `hsla(${hue}, 50%, 15%, 1)`);
        gradient.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 50%, 20%, 1)`);
        gradient.addColorStop(1, `hsla(${(hue + 120) % 360}, 50%, 15%, 1)`);
      } else {
        gradient.addColorStop(0, `hsla(${hue}, 70%, 95%, 1)`);
        gradient.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 70%, 92%, 1)`);
        gradient.addColorStop(1, `hsla(${(hue + 120) % 360}, 70%, 95%, 1)`);
      }
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  },
  
  // 波浪效果
  initWaves() {
    let offset = 0;
    const animate = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      
      for (let i = 0; i < 3; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        
        for (let x = 0; x <= this.canvas.width; x += 10) {
          const y = this.canvas.height - 100 - i * 30 + 
                    Math.sin((x + offset + i * 100) * 0.01) * 30 +
                    Math.sin((x + offset * 0.5) * 0.02) * 20;
          this.ctx.lineTo(x, y);
        }
        
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fillStyle = isDark ? `rgba(129,140,248,${0.1 - i * 0.02})` : `rgba(99,102,241,${0.1 - i * 0.02})`;
        this.ctx.fill();
      }
      
      offset += 1;
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  },
  
  // 星空效果
  initStars() {
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2,
        twinkle: Math.random() * Math.PI * 2
      });
    }
    
    const animate = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      stars.forEach(s => {
        s.twinkle += 0.05;
        const opacity = 0.3 + Math.sin(s.twinkle) * 0.3;
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        this.ctx.fill();
      });
      
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  },
  
  // 气泡效果
  initBubbles() {
    const bubbles = [];
    for (let i = 0; i < 20; i++) {
      bubbles.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height + Math.random() * 100,
        size: Math.random() * 30 + 10,
        speed: Math.random() * 1 + 0.5,
        wobble: Math.random() * Math.PI * 2
      });
    }
    
    const animate = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      
      bubbles.forEach(b => {
        b.y -= b.speed;
        b.wobble += 0.02;
        b.x += Math.sin(b.wobble) * 0.5;
        
        if (b.y < -b.size) {
          b.y = this.canvas.height + b.size;
          b.x = Math.random() * this.canvas.width;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        this.ctx.strokeStyle = isDark ? 'rgba(129,140,248,0.3)' : 'rgba(99,102,241,0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      });
      
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  },
  
  getEffectsHTML() {
    return Object.entries(this.effects).map(([key, val]) => 
      `<option value="${key}" ${this.current === key ? 'selected' : ''}>${val.name}</option>`
    ).join('');
  }
};

// ==================== 3. 深色模式 - 使用现有的toggleTheme ====================
// 保留跟随系统功能
const DarkModeEnhanced = {
  init() {
    // 监听系统主题变化
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('themeMode') === 'auto') {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : '');
        }
      });
    }
  }
};


// ==================== 4. 短链接生成 ====================
const ShortLinkGenerator = {
  // 使用更短的编码方案
  chars: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_',
  
  // 生成短ID
  generateShortId(length = 6) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += this.chars[Math.floor(Math.random() * this.chars.length)];
    }
    return result;
  },
  
  // 压缩数据
  compress(data) {
    // 使用更紧凑的格式
    const parts = [
      data.u || '',
      data.n || '',
      data.c || '',
      data.t || '',
      data.a || '',
      data.at || ''
    ];
    // 移除末尾空值
    while (parts.length > 1 && !parts[parts.length - 1]) parts.pop();
    return parts.join('|');
  },
  
  // 本地存储映射（模拟短链接服务）
  storage: null,
  
  init() {
    this.storage = JSON.parse(localStorage.getItem('shortLinks') || '{}');
  },
  
  // 创建短链接
  create(data) {
    const compressed = this.compress(data);
    
    // 检查是否已存在相同内容
    for (const [id, content] of Object.entries(this.storage)) {
      if (content === compressed) {
        return id;
      }
    }
    
    // 生成新ID
    let shortId;
    do {
      shortId = this.generateShortId();
    } while (this.storage[shortId]);
    
    this.storage[shortId] = compressed;
    localStorage.setItem('shortLinks', JSON.stringify(this.storage));
    
    return shortId;
  },
  
  // 解析短链接
  resolve(shortId) {
    const compressed = this.storage[shortId];
    if (!compressed) return null;
    
    const parts = compressed.split('|');
    return {
      u: parts[0] || '',
      n: parts[1] || '',
      c: parts[2] || '',
      t: parts[3] || '',
      a: parts[4] || '',
      at: parts[5] || ''
    };
  },
  
  // 生成完整短链接URL
  getShortUrl(data, baseUrl) {
    const shortId = this.create(data);
    return `${baseUrl}?s=${shortId}`;
  }
};

// ==================== 5. 批量导出 PDF/图片 ====================
const BatchExporter = {
  // 导出为图片合集
  async exportAsImages(items, options = {}) {
    const { format = 'png', quality = 0.92 } = options;
    const zip = new JSZip();
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const canvas = await this.createQRCanvas(item.url, item.name, options);  // 使用原始链接
      const dataUrl = canvas.toDataURL(`image/${format}`, quality);
      const base64 = dataUrl.split(',')[1];
      zip.file(`${item.name || '二维码' + (i + 1)}.${format}`, base64, { base64: true });
    }
    
    return await zip.generateAsync({ type: 'blob' });
  },
  
  // 创建带样式的二维码Canvas
  async createQRCanvas(link, name, options = {}) {
    const { size = 300, style = 'simple', colorDark = '#000', colorLight = '#fff' } = options;
    
    const canvas = document.createElement('canvas');
    const padding = 40;
    const textHeight = name ? 50 : 0;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + textHeight;
    
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = colorLight;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (style === 'rounded') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      this.roundRect(ctx, 10, 10, canvas.width - 20, canvas.height - 20, 20);
      ctx.stroke();
    } else if (style === 'shadow') {
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 5;
    }
    
    const qrImg = await this.renderQRImage(link, size, colorDark, colorLight);
    ctx.drawImage(qrImg, padding, padding, size, size);
    
    if (name) {
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = colorDark;
      ctx.font = 'bold 16px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, canvas.width / 2, canvas.height - 15);
    }
    
    return canvas;
  },

  async renderQRImage(link, size, colorDark, colorLight) {
    if (typeof QRCodeStyling !== 'undefined') {
      const qr = new QRCodeStyling({
        width: size,
        height: size,
        type: 'canvas',
        data: link,
        dotsOptions: { color: colorDark, type: 'rounded' },
        cornersSquareOptions: { type: 'extra-rounded', color: colorDark },
        cornersDotOptions: { type: 'dot', color: colorDark },
        backgroundOptions: { color: colorLight },
        qrOptions: { errorCorrectionLevel: 'H' }
      });
      const blob = await qr.getRawData('png');
      return await this.blobToImage(blob);
    }

    const qrCanvas = document.createElement('canvas');
    new QRCode(qrCanvas, {
      text: link,
      width: size,
      height: size,
      colorDark,
      colorLight,
      correctLevel: QRCode.CorrectLevel.H
    });
    await new Promise(r => setTimeout(r, 50));
    return qrCanvas.querySelector('canvas') || qrCanvas;
  },

  blobToImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  },
  
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },
  
  // 导出为PDF（使用html2canvas + jsPDF）
  async exportAsPDF(items, options = {}) {
    // 动态加载jsPDF
    if (!window.jspdf) {
      await this.loadScript('/vendor/jspdf.umd.min.js', 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
    }
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const qrSize = 50;
    const cols = 3;
    const rows = 4;
    const itemsPerPage = cols * rows;
    
    for (let i = 0; i < items.length; i++) {
      if (i > 0 && i % itemsPerPage === 0) {
        pdf.addPage();
      }
      
      const pageIndex = i % itemsPerPage;
      const col = pageIndex % cols;
      const row = Math.floor(pageIndex / cols);
      
      const x = margin + col * ((pageWidth - margin * 2) / cols);
      const y = margin + row * ((pageHeight - margin * 2) / rows);
      
      const canvas = await this.createQRCanvas(items[i].url, items[i].name, { size: 150 });  // 使用原始链接
      const imgData = canvas.toDataURL('image/png');
      
      pdf.addImage(imgData, 'PNG', x, y, qrSize, qrSize + 10);
    }
    
    return pdf.output('blob');
  },
  
  loadScript(localSrc, cdnSrc) {
    return new Promise((resolve, reject) => {
      const attach = (src, allowFallback) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => {
          if (allowFallback && cdnSrc && src !== cdnSrc) attach(cdnSrc, false);
          else reject(new Error('Script load failed: ' + src));
        };
        document.head.appendChild(script);
      };
      attach(localSrc, !!cdnSrc);
    });
  }
};

// ==================== 6. 社交分享优化（合并到海报功能） ====================
// 海报功能已在 generator.html 中实现，这里只保留分享格式优化


// ==================== 7. 微信/QQ分享优化 ====================
const SocialShareOptimizer = {
  // 生成分享数据
  getShareData(data) {
    return {
      title: data.name || '资源分享',
      desc: data.code ? `提取码：${data.code}` : '点击获取资源',
      link: data.link,
      imgUrl: '' // 可以设置分享图标
    };
  },
  
  // 复制为微信格式
  copyForWeChat(data) {
    const text = `📦 ${data.name || '资源分享'}
${data.code ? `🔑 提取码：${data.code}` : ''}
🔗 ${data.link}

长按复制链接，在浏览器中打开`;
    return text;
  },
  
  // 复制为QQ格式
  copyForQQ(data) {
    const text = `【${data.name || '资源分享'}】
${data.code ? `提取码：${data.code}` : ''}
链接：${data.link}`;
    return text;
  },
  
  // 生成分享链接（带预览）
  generateShareUrl(data, platform) {
    const shareData = this.getShareData(data);
    const encodedTitle = encodeURIComponent(shareData.title);
    const encodedDesc = encodeURIComponent(shareData.desc);
    const encodedUrl = encodeURIComponent(shareData.link);
    
    switch (platform) {
      case 'weibo':
        return `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}`;
      case 'qq':
        return `https://connect.qq.com/widget/shareqq/index.html?url=${encodedUrl}&title=${encodedTitle}&desc=${encodedDesc}`;
      case 'qzone':
        return `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodedUrl}&title=${encodedTitle}&desc=${encodedDesc}`;
      case 'douban':
        return `https://www.douban.com/share/service?url=${encodedUrl}&title=${encodedTitle}`;
      default:
        return data.link;
    }
  },
  
  // 调用系统分享
  async nativeShare(data) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.name || '资源分享',
          text: data.code ? `提取码：${data.code}` : '',
          url: data.link
        });
        return true;
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('分享失败:', e);
        }
        return false;
      }
    }
    return false;
  }
};

// ==================== 8. 一键复制多格式 ====================
const MultiFormatCopy = {
  formats: {
    plain: {
      name: '纯文本',
      icon: '📝',
      generate: (data) => data.link
    },
    withCode: {
      name: '带提取码',
      icon: '🔑',
      generate: (data) => `${data.link}${data.code ? `\n提取码：${data.code}` : ''}`
    },
    markdown: {
      name: 'Markdown',
      icon: '📋',
      generate: (data) => `[${data.name || '资源链接'}](${data.link})${data.code ? ` (提取码: ${data.code})` : ''}`
    },
    html: {
      name: 'HTML',
      icon: '🌐',
      generate: (data) => `<a href="${data.link}" target="_blank">${data.name || '资源链接'}</a>${data.code ? ` <small>提取码: ${data.code}</small>` : ''}`
    },
    bbcode: {
      name: 'BBCode',
      icon: '💬',
      generate: (data) => `[url=${data.link}]${data.name || '资源链接'}[/url]${data.code ? ` 提取码: ${data.code}` : ''}`
    },
    wechat: {
      name: '微信格式',
      icon: '💚',
      generate: (data) => SocialShareOptimizer.copyForWeChat(data)
    },
    full: {
      name: '完整信息',
      icon: '📦',
      generate: (data) => `资源名称：${data.name || '未命名'}
链接地址：${data.link}
${data.code ? `提取码：${data.code}` : ''}
${data.disk?.name ? `网盘类型：${data.disk.name}` : ''}
${data.remark ? `备注：${data.remark}` : ''}`
    }
  },
  
  async copy(data, format = 'plain') {
    const formatter = this.formats[format] || this.formats.plain;
    const text = formatter.generate(data);
    
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, text };
    } catch (e) {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return { success: true, text };
    }
  },
  
  getFormatsHTML() {
    return Object.entries(this.formats).map(([key, val]) => 
      `<button class="btn btn-secondary btn-sm" onclick="copyFormat('${key}')" title="${val.name}">
        ${val.icon} ${val.name}
      </button>`
    ).join('');
  },
  
  getSelectHTML() {
    return Object.entries(this.formats).map(([key, val]) => 
      `<option value="${key}">${val.icon} ${val.name}</option>`
    ).join('');
  }
};

// ==================== 9. 快捷键（使用现有实现，仅提供帮助显示） ====================
const KeyboardShortcuts = {
  shortcuts: {
    'G': { desc: '生成链接' },
    'P': { desc: '预览效果' },
    'C': { desc: '复制链接' },
    'D': { desc: '切换主题' },
    '1-6': { desc: '切换标签页' },
    '?': { desc: '显示帮助' },
    'Esc': { desc: '关闭弹窗' }
  },
  
  showHelp() {
    const html = Object.entries(this.shortcuts).map(([key, val]) => 
      `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
        <kbd style="background:var(--bg);padding:4px 10px;border-radius:6px;font-family:monospace;font-weight:600;">${key}</kbd>
        <span style="color:var(--text2)">${val.desc}</span>
      </div>`
    ).join('');
    
    return `<div style="max-height:400px;overflow-y:auto;">${html}</div>`;
  }
};

// ==================== 10. 拖拽排序 ====================
const DragSortable = {
  init(container, options = {}) {
    const { onSort, itemSelector = '.history-card' } = options;
    
    let draggedItem = null;
    let placeholder = null;
    
    container.addEventListener('dragstart', (e) => {
      const item = e.target.closest(itemSelector);
      if (!item) return;
      
      draggedItem = item;
      item.classList.add('dragging');
      
      // 创建占位符
      placeholder = document.createElement('div');
      placeholder.className = 'drag-placeholder';
      placeholder.style.cssText = `height:${item.offsetHeight}px;background:var(--primary);opacity:0.1;border-radius:12px;margin-bottom:10px;`;
      
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
      
      setTimeout(() => item.style.opacity = '0.5', 0);
    });
    
    container.addEventListener('dragend', (e) => {
      if (!draggedItem) return;
      
      draggedItem.classList.remove('dragging');
      draggedItem.style.opacity = '';
      
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
      
      // 获取新顺序
      const items = Array.from(container.querySelectorAll(itemSelector));
      const newOrder = items.map(item => parseInt(item.dataset.index));
      
      if (onSort) onSort(newOrder);
      
      draggedItem = null;
      placeholder = null;
    });
    
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const afterElement = this.getDragAfterElement(container, e.clientY, itemSelector);
      
      if (placeholder) {
        if (afterElement) {
          container.insertBefore(placeholder, afterElement);
        } else {
          container.appendChild(placeholder);
        }
      }
    });
    
    container.addEventListener('drop', (e) => {
      e.preventDefault();
      
      if (draggedItem && placeholder && placeholder.parentNode) {
        placeholder.parentNode.insertBefore(draggedItem, placeholder);
      }
    });
    
    // 为每个项目添加draggable属性
    container.querySelectorAll(itemSelector).forEach((item, index) => {
      item.draggable = true;
      item.dataset.index = index;
    });
  },
  
  getDragAfterElement(container, y, itemSelector) {
    const draggableElements = [...container.querySelectorAll(`${itemSelector}:not(.dragging)`)];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  },
  
  // 添加拖拽样式
  addStyles() {
    if (document.getElementById('dragSortStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'dragSortStyles';
    style.textContent = `
      .history-card { cursor: grab; transition: transform 0.2s, box-shadow 0.2s; }
      .history-card:active { cursor: grabbing; }
      .history-card.dragging { opacity: 0.5; transform: scale(1.02); box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
      .drag-placeholder { transition: all 0.2s; }
      .history-card[draggable="true"]:hover { transform: translateX(4px); }
    `;
    document.head.appendChild(style);
  }
};

// ==================== 11. 模板预设 ====================
const TemplatePresets = {
  presets: [],
  
  init() {
    const saved = localStorage.getItem('templatePresets');
    if (saved) {
      try {
        this.presets = JSON.parse(saved);
        // 检查并更新旧预设的结构（添加缺失的字段）
        this.presets = this.presets.map(p => ({
          ...p,
          config: this.mergeWithDefaults(p.config)
        }));
        this.save();
      } catch (e) {
        this.presets = [];
      }
    }
    
    // 添加默认预设
    if (this.presets.length === 0) {
      this.presets = this.getDefaultPresets();
      this.save();
    }
  },
  
  // 默认配置
  getDefaultConfig() {
    return {
      pageStyle: 'default',
      groupTag: '',
      adEnabled: false,
      adText: '正在为您跳转...',
      adDuration: '2',
      qrBorder: 'none',
      bgEffect: 'none',
      qrDotStyle: 'square',
      qrCornerStyle: 'square',
      qrColorMode: 'solid',
      qrColorDark: '#1e293b',
      qrColorLight: '#ffffff',
      qrGradient1: '#6366f1',
      qrGradient2: '#8b5cf6',
      qrGradientType: 'linear',
      qrGradientBg: '#ffffff',
      qrSize: '180'
    };
  },
  
  // 合并配置，补充缺失字段
  mergeWithDefaults(config) {
    return { ...this.getDefaultConfig(), ...config };
  },
  
  // 默认预设列表
  getDefaultPresets() {
    return [
      {
        id: 'default',
        name: '默认配置',
        config: this.getDefaultConfig()
      },
      {
        id: 'promo',
        name: '推广模式',
        config: {
          ...this.getDefaultConfig(),
          pageStyle: 'gradient',
          adEnabled: true,
          adText: '正在为您跳转...',
          adDuration: '3',
          qrBorder: 'gradient',
          bgEffect: 'particles',
          qrDotStyle: 'rounded',
          qrCornerStyle: 'extra-rounded',
          qrColorMode: 'gradient'
        }
      },
      {
        id: 'minimal',
        name: '极简模式',
        config: {
          ...this.getDefaultConfig(),
          pageStyle: 'minimal',
          adEnabled: false,
          adText: '',
          qrBorder: 'simple',
          qrColorDark: '#000000'
        }
      }
    ];
  },
  
  save() {
    localStorage.setItem('templatePresets', JSON.stringify(this.presets));
  },
  
  add(name, config) {
    const id = 'preset_' + Date.now();
    this.presets.push({ id, name, config: this.mergeWithDefaults(config) });
    this.save();
    return id;
  },
  
  update(id, name, config) {
    const preset = this.presets.find(p => p.id === id);
    if (preset) {
      preset.name = name;
      preset.config = this.mergeWithDefaults(config);
      this.save();
    }
  },
  
  remove(id) {
    this.presets = this.presets.filter(p => p.id !== id);
    this.save();
  },
  
  apply(id) {
    const preset = this.presets.find(p => p.id === id);
    if (!preset) return null;
    return preset.config;
  },
  
  getCurrentConfig() {
    return {
      // 基础设置
      pageStyle: document.getElementById('pageStyle')?.value || 'default',
      groupTag: document.getElementById('groupTag')?.value || '',
      // 广告设置
      adEnabled: document.getElementById('adEnabled')?.checked || false,
      adText: document.getElementById('adText')?.value || '正在为您跳转...',
      adDuration: document.getElementById('adDuration')?.value || '2',
      // 边框和背景
      qrBorder: QRBorderStyles?.current || 'none',
      bgEffect: DynamicBackground?.current || 'none',
      // 二维码样式
      qrDotStyle: document.getElementById('qrDotStyle')?.value || 'square',
      qrCornerStyle: document.getElementById('qrCornerStyle')?.value || 'square',
      qrColorMode: document.getElementById('qrColorMode')?.value || 'solid',
      qrColorDark: document.getElementById('qrColorDark')?.value || '#1e293b',
      qrColorLight: document.getElementById('qrColorLight')?.value || '#ffffff',
      qrGradient1: document.getElementById('qrGradient1')?.value || '#6366f1',
      qrGradient2: document.getElementById('qrGradient2')?.value || '#8b5cf6',
      qrGradientType: document.getElementById('qrGradientType')?.value || 'linear',
      qrGradientBg: document.getElementById('qrGradientBg')?.value || '#ffffff',
      qrSize: document.getElementById('qrSize')?.value || '180'
    };
  },
  
  applyConfig(config) {
    // 基础设置
    const pageStyle = document.getElementById('pageStyle');
    if (pageStyle && config.pageStyle) pageStyle.value = config.pageStyle;
    
    const groupTag = document.getElementById('groupTag');
    if (groupTag && config.groupTag !== undefined) groupTag.value = config.groupTag;
    
    // 广告设置
    const adEnabled = document.getElementById('adEnabled');
    const adSettings = document.getElementById('adSettings');
    if (adEnabled) {
      adEnabled.checked = config.adEnabled || false;
      if (adSettings) adSettings.style.display = config.adEnabled ? 'block' : 'none';
    }
    
    const adText = document.getElementById('adText');
    if (adText && config.adText !== undefined) adText.value = config.adText;
    
    const adDuration = document.getElementById('adDuration');
    if (adDuration && config.adDuration) adDuration.value = config.adDuration;
    
    // 边框和背景
    if (typeof QRBorderStyles !== 'undefined' && config.qrBorder) {
      QRBorderStyles.apply(config.qrBorder);
      const borderSelect = document.getElementById('qrBorderStyle');
      if (borderSelect) borderSelect.value = config.qrBorder;
    }
    
    if (typeof DynamicBackground !== 'undefined' && config.bgEffect) {
      DynamicBackground.apply(config.bgEffect);
      const bgSelect = document.getElementById('bgEffect');
      if (bgSelect) bgSelect.value = config.bgEffect;
    }
    
    // 二维码样式 - 更新表单
    const qrFields = ['qrDotStyle', 'qrCornerStyle', 'qrColorMode', 'qrColorDark', 'qrColorLight', 
                      'qrGradient1', 'qrGradient2', 'qrGradientType', 'qrGradientBg', 'qrSize'];
    qrFields.forEach(field => {
      const el = document.getElementById(field);
      if (el && config[field] !== undefined) el.value = config[field];
    });
    
    // 切换颜色模式显示
    const colorMode = config.qrColorMode || 'solid';
    const solidSettings = document.getElementById('solidColorSettings');
    const gradientSettings = document.getElementById('gradientColorSettings');
    if (solidSettings) solidSettings.style.display = colorMode === 'solid' ? 'grid' : 'none';
    if (gradientSettings) gradientSettings.style.display = colorMode === 'gradient' ? 'grid' : 'none';
    
    // 更新全局 settings 变量并保存到 localStorage
    if (typeof window.settings !== 'undefined') {
      window.settings = {
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
      localStorage.setItem('qrSettings', JSON.stringify(window.settings));
    }
    
    // 刷新二维码预览
    if (typeof previewQRStyle === 'function') {
      setTimeout(previewQRStyle, 100);
    }
  },
  
  getPresetsHTML() {
    return this.presets.map(p => {
      const c = p.config || {};
      
      // 构建详细信息
      const details = [];
      details.push(`风格: ${c.pageStyle || 'default'}`);
      if (c.groupTag) details.push(`分组: ${c.groupTag}`);
      details.push(`广告: ${c.adEnabled ? '开' : '关'}${c.adEnabled && c.adDuration ? ` (${c.adDuration}秒)` : ''}`);
      if (c.adEnabled && c.adText) details.push(`广告词: "${c.adText.substring(0, 10)}${c.adText.length > 10 ? '...' : ''}"`);
      
      // 二维码样式
      const qrInfo = [];
      qrInfo.push(c.qrDotStyle || 'square');
      if (c.qrColorMode === 'gradient') qrInfo.push('渐变');
      details.push(`二维码: ${qrInfo.join(' ')}`);
      
      // 边框和背景
      if (c.qrBorder && c.qrBorder !== 'none') details.push(`边框: ${c.qrBorder}`);
      if (c.bgEffect && c.bgEffect !== 'none') details.push(`背景: ${c.bgEffect}`);
      
      return `
      <div class="preset-card" data-id="${p.id}" style="background:var(--bg);padding:14px;border-radius:12px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="font-weight:600;font-size:14px;">${p.name}</div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-primary btn-sm" onclick="applyPreset('${p.id}')">应用</button>
            ${p.id.startsWith('preset_') ? `<button class="btn btn-secondary btn-sm" onclick="deletePreset('${p.id}')">删除</button>` : ''}
          </div>
        </div>
        <div style="font-size:11px;color:var(--text3);line-height:1.6;">
          ${details.join(' · ')}
        </div>
        ${c.qrColorMode === 'gradient' ? `
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
          <span style="font-size:10px;color:var(--text3);">颜色:</span>
          <span style="width:16px;height:16px;border-radius:4px;background:${c.qrGradient1 || '#6366f1'};border:1px solid var(--border);"></span>
          <span style="font-size:10px;color:var(--text3);">→</span>
          <span style="width:16px;height:16px;border-radius:4px;background:${c.qrGradient2 || '#8b5cf6'};border:1px solid var(--border);"></span>
        </div>
        ` : `
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
          <span style="font-size:10px;color:var(--text3);">颜色:</span>
          <span style="width:16px;height:16px;border-radius:4px;background:${c.qrColorDark || '#1e293b'};border:1px solid var(--border);"></span>
        </div>
        `}
      </div>
    `}).join('');
  }
};

// ==================== 初始化所有增强功能 ====================
function initEnhancements() {
  if (window.__enhancementsSkipped) return;
  QRBorderStyles.init();
  DarkModeEnhanced.init();
  ShortLinkGenerator.init();
  TemplatePresets.init();
  
  requestIdleCallback ? requestIdleCallback(() => {
    DynamicBackground.init();
    DragSortable.addStyles();
  }) : setTimeout(() => {
    DynamicBackground.init();
    DragSortable.addStyles();
  }, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEnhancements);
} else {
  initEnhancements();
}

// 导出模块
if (typeof window !== 'undefined') {
  window.QRBorderStyles = QRBorderStyles;
  window.DynamicBackground = DynamicBackground;
  window.DarkModeEnhanced = DarkModeEnhanced;
  window.ShortLinkGenerator = ShortLinkGenerator;
  window.BatchExporter = BatchExporter;
  window.SocialShareOptimizer = SocialShareOptimizer;
  window.MultiFormatCopy = MultiFormatCopy;
  window.KeyboardShortcuts = KeyboardShortcuts;
  window.DragSortable = DragSortable;
  window.TemplatePresets = TemplatePresets;
}
}
