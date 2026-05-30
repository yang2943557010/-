# 更新日志

## 2026-05-24 — 性能与结构优化（SW v18 → v24）

### 修复
- **提取码解码**：`decryptData` 不再将风格码误当作提取码；非压缩链接从 URL 的 `pwd` 参数读取
- **生成链接失效**：修复 `generator.js` 语法错误与 onboarding 遮罩挡按钮问题
- **移动端早跳转**：分享页 head 内解析链接，无广告时直接 `location.replace`，跳过整页下载
- **SW 更新**：新版本就绪时显示底部提示条，用户点击后再刷新

### 性能
- **首页 LCP**：引导图 `<picture>` WebP/PNG 回退；head 预加载引导图；移动端跳过引导图 preload
- **HTML 瘦身**：内联 CSS/JS 外置为可缓存文件，首页约 1000 行 → 184 行
- **CSS 策略**：各页 `*-critical.css` 同步加载 + 完整样式异步加载
- **生成器**：`generator.css` 非阻塞；`enhancements.js` / 海报库按需加载
- **共享模块**：`disk-data.js` 统一网盘代号与早渲染逻辑；`page-guard.js` 统一页面保护

### 新增文件

| 类型 | 文件 |
|------|------|
| CSS | `index-critical.css`, `generator-critical.css`, `speed-critical.css`, `resources-critical.css`, `vip-critical.css`, `tools-critical.css` |
| JS | `disk-data.js`, `index-early.js`, `index-body-init.js`, `generator-early.js`, `page-guard.js` |

### 基础设施
- `_redirects`：补全 `disk-data.js`、`page-guard.js`、`defer-aux-scripts.js` 等旧路径
- `_headers`：各页 Link preload 头与缓存策略
- `sw.js`：预缓存 critical 资源与引导图 PNG 回退

---

## 更早版本

- 目录重构：`css/`、`js/`、`pages/`、`assets/`
- Cloudflare Pages 部署与边缘缓存
- 推广海报、批量生成、表格导入等功能
