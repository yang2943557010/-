# 网盘页面展示

网盘分享链接生成、扫码落地页、资源搜索中转与解除限速指南的静态站点。部署到 [Cloudflare Pages](https://pages.cloudflare.com/)（方案一：Git 直连，无构建命令）。

## 项目结构

```
├── index.html              # 扫码落地页（根目录入口）
├── pages/                  # 子页面 HTML
│   ├── generator.html      # 链接生成器
│   ├── resources.html      # 资源搜索中转
│   ├── speed.html          # 解除限速指南
│   ├── vip.html            # 会员福利
│   └── tools.html          # 实用工具
├── css/                    # 样式表
├── js/                     # 脚本（app、generator、site-prefetch、vip 等）
├── assets/                 # 图片与图标
├── vendor/                 # 第三方库（懒加载）
├── sw.js                   # Service Worker（须保留在根目录）
├── _headers / _redirects   # Cloudflare Pages 缓存、预加载与旧路径重定向
├── scripts/                # 本地 Git 推送脚本（不部署）
└── extras/                 # 小程序等待部署附属项目（SW 不缓存）
```

## 本地预览

```bash
npx serve .
```

## 部署 Cloudflare Pages（推荐）

1. **Workers 和 Pages → Pages → 创建 → 连接 Git**
2. 选择仓库 `yang2943557010/-`
3. 配置：

| 配置项 | 填写 |
|--------|------|
| 框架预设 | **None** |
| 构建命令 | **留空** |
| 构建输出目录 | **`/`** |
| 部署命令 | **留空**（不要填 wrangler） |

4. Dashboard → **Speed → Optimization**：开启 **Auto Minify**、**Brotli**

部署完成后访问：`https://<你的项目>.pages.dev`

## 主要路由

| 路径 | 页面 |
|------|------|
| `/` | 扫码落地 |
| `/pages/generator.html` | 链接生成器 |
| `/pages/resources.html` | 资源搜索 |
| `/pages/speed.html` | 解除限速 |
| `/pages/vip.html` | 会员福利 |
| `/pages/tools.html` | 实用工具 |

旧路径（如 `/generator.html`、`/generator`、`/app.js`）会通过 `_redirects` 自动 301 到新位置。

## 性能与缓存（近期）

- 首页不再加载 `enhancements.js`（仅生成器需要）
- Service Worker 预缓存仅保留首页关键资源；`/vendor/`、`/assets/` 使用 cache-first（`CACHE_VERSION` 见 `sw.js`）
- 全站 `site-prefetch.js`：空闲时预取常用子页，悬停链接时预取 HTML
- 首页优先生成二维码，微信文章 idle 后再加载
- 子页 CSS 异步加载；生成器增强脚本 idle 后加载
- Cloudflare Dashboard 建议开启 **Auto Minify**、**Brotli**

## 推送到 GitHub

```powershell
cd "D:\刘立样\OneDrive\桌面\网盘页面展示"
$env:Path = "C:\Program Files\GitHub CLI;$env:Path"
.\scripts\push-github.ps1
```

仓库：https://github.com/yang2943557010/-

## 技术说明

- 纯静态前端，无后端；网盘搜索为 iframe 跳转第三方
- 微信文章代理使用 `js/app.js` 中的 `WX_PROXY_URL`（外部服务）
- 分享人主页支持 [VLink](https://vlink.cc/)

## 许可证

仅供学习与交流，请遵守各平台用户协议与法律法规。
