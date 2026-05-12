/**
 * 小程序配置文件
 * 请根据实际情况修改以下配置
 */

const config = {
  // 服务器域名（用于生成分享链接）
  // 请替换为你的实际域名
  baseUrl: 'https://your-domain.com',
  
  // 分享链接页面路径
  sharePagePath: '/index.html',
  
  // 是否启用广告功能
  enableAd: true,
  
  // 默认广告时长（秒）
  defaultAdDuration: 3,
  
  // 默认页面风格
  // 可选值: default, gradient, sunset, ocean, forest, cherry, midnight, aurora, candy, card
  defaultTemplate: 'default',
  
  // 是否启用微信文章展示
  enableWxArticle: false,
  
  // 微信文章代理地址（如果启用）
  wxArticleProxy: 'https://wx.251800.xyz',
  
  // 小程序AppID（在微信公众平台获取）
  appId: 'your-appid-here',
  
  // 小程序名称
  appName: '网盘资源分享',
  
  // 小程序描述
  appDescription: '网盘资源分享二维码页面',
  
  // 版本号
  version: '1.0.0'
};

module.exports = config;