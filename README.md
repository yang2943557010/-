# 网盘页面展示

网盘分享链接生成、扫码落地页、资源搜索中转与解除限速指南的静态站点项目。可部署到 [Cloudflare Pages](https://pages.cloudflare.com/)。

## 项目结构

```
├── index.html              # 扫码落地页（用户打开分享链接）
├── generator.html          # 链接生成器（主工具）
├── resources.html          # 更多资源 / 全网网盘搜索中转
├── speed.html              # 网盘解除限速（GitHub 开源工具指南）
├── vip.html                # 免费会员福利页
├── tools.html              # 实用工具合集
│
├── app.js                  # 落地页核心逻辑
├── generator.js            # 生成器核心逻辑
├── enhancements.js         # 增强功能（主题、动效等）
├── resources.js / .css     # 资源页脚本与样式
├── banned-words.js         # 基础敏感词库
├── banned-words-worker.js  # 敏感词检测 Worker
│
├── styles.css              # 落地页样式
├── generator.css           # 生成器主样式
├── generator-deferred.css  # 生成器非关键样式（异步加载）
├── perf-optimized.css      # 落地页性能优化样式
│
├── assets/                 # 图片、网盘 Logo、引导图
├── vendor/                 # 第三方库（QR、导出 Excel 等，按需懒加载）
│
├── sw.js / sw-register.js  # Service Worker（配合 CF 边缘缓存）
├── _headers / _redirects   # Cloudflare Pages 缓存与路由
├── wrangler.toml           # Cloudflare Pages 部署配置
├── cloudflare-worker.js    # 可选：微信代理 / 短链 API（单独部署）
│
├── miniprogram/            # 微信小程序源码
└── extras/
    └── captcha-page/      # 验证码演示页
```

## 本地预览

直接用浏览器打开 `index.html` 或 `generator.html`，或使用本地静态服务：

```bash
npx serve .
```

## 部署到 Cloudflare Pages

```bash
npm install -g wrangler
wrangler login
npx wrangler pages deploy . --project-name=netdisk-pages
```

Dashboard 建议开启：**Speed → Auto Minify**、**Brotli**。

### 连接 GitHub 自动部署（重要）

| 配置项 | 正确填写 |
|--------|----------|
| 构建命令 | **留空** |
| 部署命令 | `npx wrangler pages deploy . --project-name=netdisk-pages` |
| 或 | `npm run deploy` |

**不要**使用 `npx wrangler deploy`（那是 Worker，会导致 `Missing entry-point` 报错）。

可选 API Worker（短链 / 微信文章代理）：

```bash
npx wrangler deploy cloudflare-worker.js
```

并在 Worker 中绑定 KV（变量名 `KV`），将 Worker 地址写入 `app.js` 的 `WX_PROXY_URL`。

## 主要页面路由

| 路径 | 说明 |
|------|------|
| `/` | 扫码落地页 |
| `/generator` | 链接生成器 |
| `/resources` | 资源搜索 |
| `/speed` | 解除限速 |
| `/vip` | 会员福利 |
| `/tools` | 实用工具 |

（由 `_redirects` 提供友好 URL。）

## 技术说明

- 纯静态前端，无自建后端；网盘搜索为 iframe 跳转第三方引擎
- 敏感词库支持本地缓存 + 远程更新（jsDelivr）
- 分享人主页支持 [VLink](https://vlink.cc/) 个人聚合页

## 推送到 GitHub

仓库名：**网盘页面展示**（账号 `yang2943557010`）

若提示 **「无法将 gh 识别为 cmdlet」**：先关闭并重新打开终端，或执行：

```powershell
$env:Path = "C:\Program Files\GitHub CLI;$env:Path"
```

1. 登录 GitHub（首次需授权）：

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" auth login
```

2. 一键创建仓库并推送：

```powershell
.\scripts\push-github.ps1
```

### 若 `gh auth login` 连接超时

说明本机访问 `github.com:443` 不稳定，可改用 **Token + HTTPS**（无需 gh 浏览器登录）：

1. 浏览器打开 https://github.com/new ，仓库名 **网盘页面展示**，Public，**不要**勾选 README  
2. https://github.com/settings/tokens → Generate new token (classic) → 勾选 **repo**  
3. PowerShell 执行：

```powershell
cd "D:\刘立样\OneDrive\桌面\网盘页面展示"
git remote set-url github https://github.com/yang2943557010/网盘页面展示.git
git push -u github main
```

- 用户名：`yang2943557010`  
- 密码：粘贴 **Token**（不是 QQ 邮箱密码）

### 若提示 Permission denied (publickey)

说明误用了 SSH 地址，请执行：

```powershell
git remote set-url github https://github.com/yang2943557010/网盘页面展示.git
```

## 许可证

仅供学习与交流使用，请遵守各网盘平台用户协议与当地法律法规。
