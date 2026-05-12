/**
 * URL处理模块
 */

const CryptoUtil = require('./crypto');

const UrlHandler = {
  // 编码数据
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

  // 解析参数
  parseParams(options) {
    // 新版：单参数d包含所有数据
    const compressedData = options.d;
    if (compressedData) {
      let data = this.decodeData(compressedData);
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
          wxArticleId: options.wx || data.wx || '',
          isValid: true
        };
      }
    }

    // 旧版兼容：多参数模式
    const encodedUrl = options.u;
    const name = options.n || '资源';
    const code = options.c || '无';
    const template = options.t || 'default';
    const adText = options.ad || '';
    const adDuration = parseInt(options.ad_t) || 2;
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

module.exports = UrlHandler;