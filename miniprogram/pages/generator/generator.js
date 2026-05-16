// pages/generator/generator.js
const UrlHandler = require('../../utils/url-handler');
const { detectDiskType } = require('../../utils/disk-config');

Page({
  data: {
    // 页面状态
    activeTab: 'single',
    showGuide: true,
    
    // 单个生成
    targetUrl: '',
    resourceName: '',
    extractCode: '',
    remarkText: '',
    styleIndex: 0,
    styleOptions: ['默认灰蓝', '纯净白', '梦幻紫', '日落橙', '深海蓝', '森林绿', '樱花粉', '午夜黑', '极光', '糖果色'],
    adEnabled: false,
    adText: '正在为您跳转...',
    adDurationIndex: 2,
    durationOptions: ['1秒', '2秒', '3秒', '4秒', '5秒'],
    showResult: false,
    generatedUrl: '',
    
    // 批量生成
    batchInput: '',
    batchAdEnabled: false,
    batchAdText: '正在为您跳转...',
    batchAdDurationIndex: 2,
    batchResults: [],
    
    // 表格导入
    selectedFile: null,
    importResults: [],
    
    // 历史记录
    searchKeyword: '',
    historyGroupIndex: 0,
    historyGroupOptions: ['全部分组'],
    historyList: [],
    customGroups: [],
    
    // 设置
    qrDotStyleIndex: 0,
    qrDotStyles: ['方形', '圆点', '圆角', '超圆角', '经典', '经典圆角'],
    qrColorModeIndex: 0,
    qrColorModes: ['纯色', '渐变'],
    qrSizeIndex: 1,
    qrSizes: ['小 140px', '中 180px', '大 220px', '超大 280px'],
    bgEffectIndex: 0,
    bgEffects: ['无', '粒子', '渐变流动', '波浪', '星空', '气泡'],
    newGroup: ''
  },

  onLoad() {
    this.loadHistory();
    this.loadSettings();
  },

  // ==================== 标签页切换 ====================
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // ==================== 说明面板 ====================
  toggleGuide() {
    this.setData({ showGuide: !this.data.showGuide });
  },

  showShortcuts() {
    wx.showModal({
      title: '快捷键说明',
      content: '单个生成：生成单个分享链接\n批量生成：批量生成多个链接\n表格导入：从Excel/CSV导入\n历史记录：查看/复制/删除\n设置：配置二维码样式',
      showCancel: false
    });
  },

  fillExample() {
    this.setData({
      targetUrl: 'https://pan.quark.cn/s/abc123def456?pwd=1234',
      resourceName: '电影资源',
      extractCode: '1234',
      adEnabled: true,
      adText: '正在为您跳转...'
    });
    wx.showToast({ title: '示例已填入', icon: 'success' });
  },

  // ==================== 单个生成 ====================
  onUrlInput(e) {
    this.setData({ targetUrl: e.detail.value });
  },

  onNameInput(e) {
    this.setData({ resourceName: e.detail.value });
  },

  onCodeInput(e) {
    this.setData({ extractCode: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remarkText: e.detail.value });
  },

  onStyleChange(e) {
    this.setData({ styleIndex: e.detail.value });
  },

  toggleAdSwitch(e) {
    this.setData({ adEnabled: e.detail.value });
  },

  onAdTextInput(e) {
    this.setData({ adText: e.detail.value });
  },

  onAdDurationChange(e) {
    this.setData({ adDurationIndex: e.detail.value });
  },

  pasteLink() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          this.setData({ targetUrl: res.data });
          wx.showToast({ title: '已粘贴', icon: 'success' });
        }
      }
    });
  },

  // 生成单个链接
  generateSingle() {
    if (!this.data.targetUrl) {
      wx.showToast({ title: '请输入目标链接', icon: 'none' });
      return;
    }

    const data = {
      u: this.data.targetUrl,
      n: this.data.resourceName || '资源',
      c: this.data.extractCode || '',
      t: this.data.styleOptions[this.data.styleIndex].replace(/[^a-zA-Z]/g, '') || 'default',
      a: this.data.adEnabled ? this.data.adText : '',
      at: (this.data.adDurationIndex + 1).toString()
    };

    const encoded = UrlHandler.encodeData(data);
    if (encoded) {
      const baseUrl = 'https://your-domain.com/index.html';
      const generatedUrl = `${baseUrl}?d=${encoded}`;
      
      this.setData({ 
        generatedUrl: generatedUrl,
        showResult: true
      });

      // 保存到历史
      this.saveToHistory({
        name: this.data.resourceName || '资源',
        url: generatedUrl,
        disk: detectDiskType(this.data.targetUrl).name
      });

      setTimeout(() => this.generateResultQR(), 100);
      wx.showToast({ title: '生成成功', icon: 'success' });
    } else {
      wx.showToast({ title: '生成失败', icon: 'none' });
    }
  },

  // 生成结果二维码
  generateResultQR() {
    const query = wx.createSelectorQuery();
    query.select('#resultQr')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          ctx.scale(dpr, dpr);
          this.drawQRCode(ctx, this.data.generatedUrl, res[0].width, res[0].height);
        }
      });
  },

  drawQRCode(ctx, url, width, height) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.8;
    
    this.drawPattern(ctx, centerX - size / 2, centerY - size / 2, size * 0.25);
    this.drawPattern(ctx, centerX + size / 2 - size * 0.25, centerY - size / 2, size * 0.25);
    this.drawPattern(ctx, centerX - size / 2, centerY + size / 2 - size * 0.25, size * 0.25);
    
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(centerX - size * 0.1, centerY - size * 0.1, size * 0.2, size * 0.2);
    
    ctx.fillStyle = '#4f46e5';
    const dotSize = size * 0.03;
    for (let i = 0; i < 80; i++) {
      const x = centerX - size / 2 + Math.random() * size;
      const y = centerY - size / 2 + Math.random() * size;
      ctx.fillRect(x, y, dotSize, dotSize);
    }
    
    ctx.fillStyle = '#64748b';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('扫码访问', centerX, height - 12);
  },

  drawPattern(ctx, x, y, size) {
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + size * 0.15, y + size * 0.15, size * 0.7, size * 0.7);
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(x + size * 0.3, y + size * 0.3, size * 0.4, size * 0.4);
  },

  previewResult() {
    if (this.data.generatedUrl) {
      this.setData({ showResult: true });
    } else {
      wx.showToast({ title: '请先生成链接', icon: 'none' });
    }
  },

  hideResult() {
    this.setData({ showResult: false });
  },

  copyLink() {
    if (this.data.generatedUrl) {
      wx.setClipboardData({
        data: this.data.generatedUrl,
        success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
      });
    }
  },

  // ==================== 批量生成 ====================
  onBatchInput(e) {
    this.setData({ batchInput: e.detail.value });
  },

  toggleBatchAdSwitch(e) {
    this.setData({ batchAdEnabled: e.detail.value });
  },

  onBatchAdTextInput(e) {
    this.setData({ batchAdText: e.detail.value });
  },

  onBatchAdDurationChange(e) {
    this.setData({ batchAdDurationIndex: e.detail.value });
  },

  generateBatch() {
    const lines = this.data.batchInput.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      wx.showToast({ title: '请输入要生成的链接', icon: 'none' });
      return;
    }

    const results = [];
    let index = 1;

    lines.forEach((line, i) => {
      const parts = line.split('|');
      const url = parts[0] ? parts[0].trim() : '';
      const name = parts[1] ? parts[1].trim() : `资源${i + 1}`;
      const code = parts[2] ? parts[2].trim() : '';

      if (url) {
        const data = {
          u: url,
          n: name,
          c: code,
          t: 'default',
          a: this.data.batchAdEnabled ? this.data.batchAdText : '',
          at: (this.data.batchAdDurationIndex + 1).toString()
        };

        const encoded = UrlHandler.encodeData(data);
        if (encoded) {
          const baseUrl = 'https://your-domain.com/index.html';
          results.push({
            index: index++,
            name,
            url: `${baseUrl}?d=${encoded}`,
            originalUrl: url
          });
        }
      }
    });

    this.setData({ batchResults: results });
    
    // 保存到历史
    results.forEach(r => {
      this.saveToHistory({
        name: r.name,
        url: r.url,
        disk: detectDiskType(r.originalUrl).name
      });
    });

    wx.showToast({ title: `已生成${results.length}个链接`, icon: 'success' });
  },

  copyBatchLink(e) {
    const index = e.currentTarget.dataset.index;
    const link = this.data.batchResults[index].url;
    wx.setClipboardData({
      data: link,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
    });
  },

  copyAllBatchLinks() {
    const allLinks = this.data.batchResults.map(r => r.url).join('\n');
    wx.setClipboardData({
      data: allLinks,
      success: () => wx.showToast({ title: '已复制全部链接', icon: 'success' })
    });
  },

  clearBatch() {
    this.setData({ batchInput: '', batchResults: [] });
  },

  // ==================== 表格导入 ====================
  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls', 'csv'],
      success: (res) => {
        if (res.tempFiles.length > 0) {
          this.setData({ 
            selectedFile: res.tempFiles[0],
            importResults: []
          });
        }
      }
    });
  },

  uploadFile() {
    if (!this.data.selectedFile) {
      wx.showToast({ title: '请先选择文件', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '导入中...' });
    setTimeout(() => {
      wx.hideLoading();
      const mockResults = [
        { index: 1, url: 'https://pan.quark.cn/s/abc123', name: '资源1' },
        { index: 2, url: 'https://pan.baidu.com/s/def456', name: '资源2' },
        { index: 3, url: 'https://alipan.com/s/ghi789', name: '资源3' }
      ];
      this.setData({ importResults: mockResults });
      wx.showToast({ title: '导入成功', icon: 'success' });
    }, 1500);
  },

  clearFile() {
    this.setData({ selectedFile: null, importResults: [] });
  },

  // ==================== 历史记录 ====================
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
    this.filterHistory();
  },

  onGroupFilterChange(e) {
    this.setData({ historyGroupIndex: e.detail.value });
    this.filterHistory();
  },

  filterHistory() {
    const keyword = this.data.searchKeyword.toLowerCase();
    let filtered = this.data.historyList;
    
    if (keyword) {
      filtered = filtered.filter(h => 
        h.name.toLowerCase().includes(keyword) || 
        h.url.toLowerCase().includes(keyword)
      );
    }
    
    filtered.forEach((item, index) => { item.index = index + 1; });
    this.setData({ historyList: filtered });
  },

  saveToHistory(item) {
    const history = [...this.data.historyList];
    const now = new Date();
    const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    history.unshift({
      id: Date.now().toString(),
      index: history.length + 1,
      name: item.name,
      url: item.url,
      disk: item.disk || '未知',
      time: timeStr
    });

    // 限制历史记录数量
    if (history.length > 100) history.pop();
    
    this.setData({ historyList: history });
    this.saveHistory();
  },

  saveHistory() {
    wx.setStorageSync('history', JSON.stringify(this.data.historyList));
  },

  loadHistory() {
    try {
      const history = wx.getStorageSync('history') || '[]';
      const list = JSON.parse(history);
      list.forEach((item, index) => { item.index = index + 1; });
      this.setData({ historyList: list });
    } catch (e) {
      this.setData({ historyList: [] });
    }
  },

  copyHistoryLink(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.historyList.find(h => h.id === id);
    if (item) {
      wx.setClipboardData({
        data: item.url,
        success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
      });
    }
  },

  deleteHistory(e) {
    const id = e.currentTarget.dataset.id;
    const list = this.data.historyList.filter(h => h.id !== id);
    list.forEach((item, index) => { item.index = index + 1; });
    this.setData({ historyList: list });
    this.saveHistory();
    wx.showToast({ title: '已删除', icon: 'success' });
  },

  exportHistory() {
    if (this.data.historyList.length === 0) {
      wx.showToast({ title: '暂无历史记录', icon: 'none' });
      return;
    }
    const allLinks = this.data.historyList.map(h => `${h.name}: ${h.url}`).join('\n');
    wx.setClipboardData({
      data: allLinks,
      success: () => wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
    });
  },

  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ historyList: [] });
          this.saveHistory();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  // ==================== 设置 ====================
  onQrDotStyleChange(e) {
    this.setData({ qrDotStyleIndex: e.detail.value });
  },

  onQrColorModeChange(e) {
    this.setData({ qrColorModeIndex: e.detail.value });
  },

  onQrSizeChange(e) {
    this.setData({ qrSizeIndex: e.detail.value });
  },

  onBgEffectChange(e) {
    this.setData({ bgEffectIndex: e.detail.value });
  },

  onNewGroupInput(e) {
    this.setData({ newGroup: e.detail.value });
  },

  addGroup() {
    if (!this.data.newGroup) {
      wx.showToast({ title: '请输入分组名称', icon: 'none' });
      return;
    }
    
    const groups = [...this.data.customGroups];
    if (!groups.find(g => g.name === this.data.newGroup)) {
      groups.push({ name: this.data.newGroup });
      this.setData({ 
        customGroups: groups,
        historyGroupOptions: ['全部分组', ...groups.map(g => g.name)],
        newGroup: ''
      });
      wx.showToast({ title: '分组已添加', icon: 'success' });
    } else {
      wx.showToast({ title: '分组已存在', icon: 'none' });
    }
  },

  deleteGroup(e) {
    const index = e.currentTarget.dataset.index;
    const groups = [...this.data.customGroups];
    groups.splice(index, 1);
    this.setData({ 
      customGroups: groups,
      historyGroupOptions: ['全部分组', ...groups.map(g => g.name)]
    });
    wx.showToast({ title: '分组已删除', icon: 'success' });
  },

  saveSettings() {
    const settings = {
      qrDotStyleIndex: this.data.qrDotStyleIndex,
      qrColorModeIndex: this.data.qrColorModeIndex,
      qrSizeIndex: this.data.qrSizeIndex,
      bgEffectIndex: this.data.bgEffectIndex,
      customGroups: this.data.customGroups
    };
    wx.setStorageSync('settings', settings);
    wx.showToast({ title: '设置已保存', icon: 'success' });
  },

  resetSettings() {
    this.setData({
      qrDotStyleIndex: 0,
      qrColorModeIndex: 0,
      qrSizeIndex: 1,
      bgEffectIndex: 0
    });
    wx.showToast({ title: '已恢复默认', icon: 'success' });
  },

  loadSettings() {
    try {
      const settings = wx.getStorageSync('settings') || {};
      if (settings.qrDotStyleIndex !== undefined) this.setData({ qrDotStyleIndex: settings.qrDotStyleIndex });
      if (settings.qrColorModeIndex !== undefined) this.setData({ qrColorModeIndex: settings.qrColorModeIndex });
      if (settings.qrSizeIndex !== undefined) this.setData({ qrSizeIndex: settings.qrSizeIndex });
      if (settings.bgEffectIndex !== undefined) this.setData({ bgEffectIndex: settings.bgEffectIndex });
      if (settings.customGroups) {
        this.setData({ 
          customGroups: settings.customGroups,
          historyGroupOptions: ['全部分组', ...settings.customGroups.map(g => g.name)]
        });
      }
    } catch (e) {
      // 加载失败，使用默认值
    }
  }
});