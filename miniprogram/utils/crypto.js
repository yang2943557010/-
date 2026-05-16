/**
 * 加密模块 - 适配微信小程序
 */

// Base64 字符集
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// 自定义 Base64 编码
function base64Encode(str) {
  let output = '';
  let i = 0;
  const bytes = new TextEncoder().encode(str);
  
  while (i < bytes.length) {
    const a = bytes[i++];
    const b = i < bytes.length ? bytes[i++] : 0;
    const c = i < bytes.length ? bytes[i++] : 0;
    
    const idx1 = a >> 2;
    const idx2 = ((a & 3) << 4) | (b >> 4);
    const idx3 = ((b & 15) << 2) | (c >> 6);
    const idx4 = c & 63;
    
    output += BASE64_CHARS[idx1];
    output += BASE64_CHARS[idx2];
    output += i - 2 < bytes.length ? BASE64_CHARS[idx3] : '=';
    output += i - 1 < bytes.length ? BASE64_CHARS[idx4] : '=';
  }
  
  return output;
}

// 自定义 Base64 解码
function base64Decode(str) {
  str = str.replace(/[^A-Za-z0-9+/=]/g, '');
  
  const bytes = [];
  let i = 0;
  
  while (i < str.length) {
    const idx1 = BASE64_CHARS.indexOf(str[i++]);
    const idx2 = BASE64_CHARS.indexOf(str[i++]);
    const idx3 = BASE64_CHARS.indexOf(str[i++]);
    const idx4 = BASE64_CHARS.indexOf(str[i++]);
    
    const a = (idx1 << 2) | (idx2 >> 4);
    const b = ((idx2 & 15) << 4) | (idx3 >> 2);
    const c = ((idx3 & 3) << 6) | idx4;
    
    bytes.push(a);
    if (idx3 !== 64) bytes.push(b);
    if (idx4 !== 64) bytes.push(c);
  }
  
  return new Uint8Array(bytes);
}

const CryptoUtil = {
  // 网盘代号表
  DISK_CODES: {
    B: { domain: 'pan.baidu.com', prefix: '/s/' },
    Q: { domain: 'pan.quark.cn', prefix: '/s/' },
    A: { domain: 'alipan.com', prefix: '/s/' },
    X: { domain: 'pan.xunlei.com', prefix: '/s/' },
    E: { domain: '115.com', prefix: '/s/' },
    L: { domain: 'lanzou.com', prefix: '/b/' },
    T: { domain: 'cloud.189.cn', prefix: '/t/' },
    W: { domain: 'weiyun.com', prefix: '/s/' },
    J: { domain: 'jianguoyun.com', prefix: '/d/' },
    M: { domain: 'caiyun.139.com', prefix: '/s/' },
    U: { domain: 'pan.wo.cn', prefix: '/s/' },
    C: { domain: 'drive.uc.cn', prefix: '/s/' },
    P: { domain: 'mypikpak.com', prefix: '/s/' },
    N: { domain: '123pan.com', prefix: '/s/' },
    F: { domain: 'ctfile.com', prefix: '/f/' },
    O: { domain: '1drv.ms', prefix: '/' },
    G: { domain: 'drive.google.com', prefix: '/file/d/' },
    D: { domain: 'dropbox.com', prefix: '/s/' },
    Z: { domain: 'mega.nz', prefix: '/#!' },
    R: { domain: 'mediafire.com', prefix: '/file/' },
    K: { domain: 'box.com', prefix: '/s/' },
    I: { domain: 'icloud.com', prefix: '/share/' },
    V: { domain: 'pcloud.com', prefix: '/share/' },
  },

  // 页面风格缩写
  STYLE_CODES: {
    m: 'minimal', g: 'gradient', s: 'sunset', o: 'ocean',
    f: 'forest', c: 'cherry', n: 'midnight', a: 'aurora',
    k: 'candy', r: 'card',
  },

  STYLE_ENCODE: {
    minimal: 'm', gradient: 'g', sunset: 's', ocean: 'o',
    forest: 'f', cherry: 'c', midnight: 'n', aurora: 'a',
    candy: 'k', card: 'r',
  },

  // 压缩 URL
  compressUrl(url, extractCode) {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase().replace(/^www\./, '');
      const entry = Object.entries(this.DISK_CODES).find(([, v]) =>
        host === v.domain || host.endsWith('.' + v.domain)
      );
      if (!entry) return null;
      const [code, { prefix }] = entry;
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
  },

  // 还原 URL
  decompressUrl(str) {
    if (!str) return str;
    const m = str.match(/^([A-Z])([^:]+)(?::(.*))?$/);
    if (!m) return str;
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

  // 编码数据
  encryptData(data) {
    try {
      const compressed = this.compressUrl(data.u || '', data.c || '');
      const u = compressed || data.u || '';
      const t = this.STYLE_ENCODE[data.t] || '';
      const parts = [u, data.n || '', t, data.a || '', data.at || ''];
      while (parts.length > 1 && !parts[parts.length - 1]) parts.pop();
      return this.toBase64Url(parts.join('|'));
    } catch (e) {
      console.error('加密失败:', e);
      return null;
    }
  },

  // 解码数据
  decryptData(str) {
    try {
      if (!str) return null;
      const decoded = this.fromBase64Url(str);
      const parts = decoded.split('|');
      const rawU = parts[0] || '';
      const isCompressed = /^[A-Z]/.test(rawU) && !rawU.startsWith('http');
      const u = isCompressed ? this.decompressUrl(rawU) : rawU;
      const c = isCompressed ? this.extractCodeFromCompressed(rawU) : (parts[2] || '');
      const tCode = parts[2] || '';
      const t = this.STYLE_CODES[tCode] || tCode || 'default';
      return {
        u,
        n: parts[1] || '',
        c: c || parts[2] || '',
        t,
        a: parts[3] || '',
        at: parts[4] || '',
        wx: parts[5] || ''
      };
    } catch (e) {
      console.error('解密失败:', e);
      return null;
    }
  },

  // 旧版兼容解码
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
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return base64Encode(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      console.error('toBase64Url error:', e);
      return null;
    }
  },

  // 从URL安全Base64解码
  fromBase64Url(str) {
    try {
      let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const bytes = base64Decode(b64);
      return new TextDecoder().decode(bytes);
    } catch (e) {
      console.error('fromBase64Url error:', e);
      return '';
    }
  },

  // 旧版兼容
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

module.exports = CryptoUtil;