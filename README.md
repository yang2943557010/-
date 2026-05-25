# 网盘页面展示

网盘分享链接生成、扫码落地页、资源搜索中转与解除限速指南的静态站点。部署到 [Cloudflare Pages](https://pages.cloudflare.com/)（方案一：Git 直连，无构建命令）。

## 项目结构

```
├── index.html              # 扫码落地页
├── generator.html          # 链接生成器
├── resources.html          # 资源搜索中转
├── speed.html              # 解除限速指南
├── vip.html / tools.html   # 福利与工具页
├── app.js / generator.js / enhancements.js
├── resources.js / resources.css
├── banned-words.js / banned-words-worker.js
├── styles.css / generator.css / generator-deferred.css / perf-optimized.css
├── assets/ / vendor/         # 图片与第三方库（懒加载）
├── sw.js / sw-register.js    # Service Worker
├── _headers / _redirects     # Cloudflare Pages 缓存与路由
└── scripts/                  # 本地 Git 推送脚本（不部署到线上）
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
| `/generator` | 链接生成器 |
| `/resources` | 资源搜索 |
| `/speed` | 解除限速 |
| `/vip` | 会员福利 |
| `/tools` | 实用工具 |

## 推送到 GitHub

```powershell
cd "D:\刘立样\OneDrive\桌面\网盘页面展示"
$env:Path = "C:\Program Files\GitHub CLI;$env:Path"
.\scripts\push-github.ps1
```

仓库：https://github.com/yang2943557010/-

## 技术说明

- 纯静态前端，无后端；网盘搜索为 iframe 跳转第三方
- 微信文章代理使用 `app.js` 中的 `WX_PROXY_URL`（外部服务）
- 分享人主页支持 [VLink](https://vlink.cc/)

## 许可证

仅供学习与交流，请遵守各平台用户协议与法律法规。
