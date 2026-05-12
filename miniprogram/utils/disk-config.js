/**
 * 网盘配置模块
 */

const DISK_CONFIG = {
  // 国内主流网盘
  baidu: {
    name: '百度网盘',
    keywords: ['pan.baidu.com', 'yun.baidu.com'],
    logo: '/assets/logos/baidu.png',
    guide: '/assets/images/guides/baidu-guide.png',
    appName: '百度网盘APP',
    color: '#06a7ff'
  },
  quark: {
    name: '夸克网盘',
    keywords: ['pan.quark.cn', 'quark.cn'],
    logo: '/assets/logos/quark.png',
    guide: '/assets/images/guides/quark-guide.png',
    appName: '夸克APP',
    color: '#1890ff'
  },
  aliyun: {
    name: '阿里云盘',
    keywords: ['aliyundrive.com', 'alipan.com'],
    logo: '/assets/logos/aliyun.ico',
    guide: '/assets/images/guides/aliyun-guide.svg',
    appName: '阿里云盘APP',
    color: '#ff6a00'
  },
  xunlei: {
    name: '迅雷云盘',
    keywords: ['pan.xunlei.com', 'xl.xunlei.com'],
    logo: '/assets/logos/xunlei.ico',
    guide: '/assets/images/guides/xunlei-guide.svg',
    appName: '迅雷APP',
    color: '#0078d4'
  },
  '115': {
    name: '115网盘',
    keywords: ['115.com', '115cdn.com'],
    logo: '/assets/logos/115.ico',
    guide: '/assets/images/guides/115-guide.svg',
    appName: '115APP',
    color: '#2b579a'
  },
  lanzou: {
    name: '蓝奏云',
    keywords: ['lanzou', 'lanzoui', 'lanzoux', 'lanzoucloud'],
    logo: '/assets/logos/lanzou.ico',
    guide: '/assets/images/guides/lanzou-guide.svg',
    appName: '手机浏览器',
    color: '#0099ff'
  },
  tianyi: {
    name: '天翼云盘',
    keywords: ['cloud.189.cn', 'e.189.cn', 'b.189.cn'],
    logo: '/assets/logos/tianyi.ico',
    guide: '/assets/images/guides/tianyi-guide.svg',
    appName: '天翼云盘APP',
    color: '#21a9e1'
  },
  weiyun: {
    name: '腾讯微云',
    keywords: ['weiyun.com', 'share.weiyun.com'],
    logo: '/assets/logos/weiyun.ico',
    guide: '/assets/images/guides/weiyun-guide.svg',
    appName: '微云APP',
    color: '#07c160'
  },
  jianguoyun: {
    name: '坚果云',
    keywords: ['jianguoyun.com', 'nutstore.net'],
    logo: '/assets/logos/jianguoyun.ico',
    guide: '/assets/images/guides/jianguoyun-guide.svg',
    appName: '坚果云APP',
    color: '#f5a623'
  },
  caiyun: {
    name: '中国移动云盘',
    keywords: ['caiyun.139.com', 'yun.139.com', '139.com/w'],
    logo: '/assets/logos/caiyun.ico',
    guide: '/assets/images/guides/caiyun-guide.svg',
    appName: '中国移动云盘APP',
    color: '#00a0e9'
  },
  wocloud: {
    name: '联通云盘',
    keywords: ['pan.wo.cn', 'cloud.wo.cn', 'wo.cn/pan'],
    logo: '/assets/logos/wocloud.ico',
    guide: '/assets/images/guides/wocloud-guide.svg',
    appName: '联通云盘APP',
    color: '#e60012'
  },
  uc: {
    name: 'UC网盘',
    keywords: ['drive.uc.cn', 'uc.cn/pan'],
    logo: '/assets/logos/uc.ico',
    guide: '/assets/images/guides/uc-guide.svg',
    appName: 'UC浏览器',
    color: '#ff6600'
  },
  pikpak: {
    name: 'PikPak',
    keywords: ['mypikpak.com', 'pikpak.com'],
    logo: '/assets/logos/pikpak.ico',
    guide: '/assets/images/guides/pikpak-guide.svg',
    appName: 'PikPak APP',
    color: '#7c3aed'
  },
  '123pan': {
    name: '123云盘',
    keywords: ['123pan.com', '123684.com', '123865.com'],
    logo: '/assets/logos/123pan.ico',
    guide: '/assets/images/guides/123pan-guide.svg',
    appName: '123云盘APP',
    color: '#ff4d4f'
  },
  ctfile: {
    name: '城通网盘',
    keywords: ['ctfile.com', 'u.ctfile.com'],
    logo: '/assets/logos/ctfile.ico',
    guide: '',
    appName: '手机浏览器',
    color: '#1677ff'
  },
  // 国际主流网盘
  onedrive: {
    name: 'OneDrive',
    keywords: ['onedrive.live.com', '1drv.ms', 'sharepoint.com'],
    logo: '/assets/logos/onedrive.png',
    guide: '/assets/images/guides/onedrive-guide.svg',
    appName: 'OneDrive APP',
    color: '#0078d4'
  },
  googledrive: {
    name: 'Google Drive',
    keywords: ['drive.google.com', 'docs.google.com', 'photos.google.com'],
    logo: '/assets/logos/googledrive.png',
    guide: '/assets/images/guides/googledrive-guide.svg',
    appName: 'Google Drive APP',
    color: '#4285f4'
  },
  dropbox: {
    name: 'Dropbox',
    keywords: ['dropbox.com', 'db.tt'],
    logo: '/assets/logos/dropbox.ico',
    guide: '/assets/images/guides/dropbox-guide.svg',
    appName: 'Dropbox APP',
    color: '#0061ff'
  },
  mega: {
    name: 'MEGA',
    keywords: ['mega.nz', 'mega.co.nz'],
    logo: '/assets/logos/mega.ico',
    guide: '/assets/images/guides/mega-guide.svg',
    appName: 'MEGA APP',
    color: '#d9272e'
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

module.exports = {
  DISK_CONFIG,
  detectDiskType
};