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
├── css/
│   ├── index-critical.css      # 分享页首屏（同步）
│   ├── perf-optimized.css      # 分享页非关键（异步）
│   ├── generator-critical.css  # 生成器首屏（同步）
│   ├── generator.css           # 生成器完整（异步）
│   ├── generator-deferred.css  # 生成器弹窗等（异步）
│   ├── resources.css           # 资源页（异步）
│   ├── speed-critical.css      # 限速指南（同步）
│   ├── vip-critical.css        # VIP 页（同步）
│   ├── tools-critical.css      # 工具页（同步）
│   └── poster.css              # 海报（按需）
├── js/
│   ├── disk-data.js        # 网盘代号 / 引导图 / 早渲染共享数据
│   ├── page-guard.js       # 全站页面保护（各页 head 引用）
│   ├── index-early.js      # 分享页 head：meta、preload、移动早跳转
│   ├── index-body-init.js  # 分享页 body：引导图、免责声明
│   ├── generator-early.js  # 生成器 head：guide-hidden 状态
│   ├── app.js              # 分享页主逻辑
│   ├── generator.js        # 生成器主逻辑
│   ├── defer-aux-scripts.js # load 后：prefetch + SW 注册
│   └── sw-register.js      # SW 更新提示与刷新
├── assets/                 # 图片与图标
├── vendor/                 # 第三方库（懒加载）
├── sw.js                   # Service Worker（须保留在根目录，当前 v24）
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

## 性能策略

| 页面 | 同步资源 | 异步资源 |
|------|----------|----------|
| 分享页 | `disk-data.js`, `index-critical.css` | `perf-optimized.css`, `app.js` |
| 生成器 | `disk-data.js`, `generator-critical.css` | `generator.css`, `generator-deferred.css` |
| 资源合集 | `resources-critical.css` | `resources.css` |
| 限速 / VIP / 工具 | `*-critical.css` | — |

- **移动端无广告分享链**：head 内直接跳转网盘，不下载整页
- **引导图 LCP**：`<picture>` WebP + PNG 回退，head preload
- **SW**：空闲注册；新版本显示「点击刷新」提示（`sw-register.js`）
- **全站 prefetch**：`site-prefetch.js` 空闲预取常用子页

详细变更见 [CHANGELOG.md](./CHANGELOG.md)。

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
