/**
 * Cloudflare Worker - 微信文章代理 + 短链接服务
 *
 * 部署步骤（Cloudflare Pages 静态站点 + 独立 Worker）：
 * 1. Pages：连接 GitHub 或 `npx wrangler pages deploy . --project-name=xxx`
 *    根目录需包含 _headers / _redirects / wrangler.toml
 * 2. Worker（本文件）：Workers & Pages → Create Worker → Deploy
 * 3. KV Binding：Variable name = KV
 * 4. 将 Worker 域名填入 app.js 的 WX_PROXY_URL
 *
 * 原步骤：
 * 1. 登录 https://dash.cloudflare.com
 * 2. Workers & Pages → Create Worker → 粘贴本文件内容 → Deploy
 * 3. 进入 Worker → Settings → Bindings → KV Namespace Bindings
 *    → Add binding，Variable name 填 KV，选择或新建一个 KV namespace
 * 4. 把 Worker URL 填入 app.js 的 WX_PROXY_URL
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ── 短链接创建：POST /shorten  body: { params: "d=xxx&wx=yyy" } ──
    if (request.method === 'POST' && path === '/shorten') {
      try {
        const { params } = await request.json();
        if (!params) return json({ error: '缺少 params' }, 400);

        const code = genCode();
        await env.KV.put(`sl:${code}`, params, { expirationTtl: 60 * 60 * 24 * 365 }); // 1年
        return json({ success: true, code });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    // ── 短链接解析：GET /resolve?c=XXXXXX ──
    if (path === '/resolve') {
      const code = url.searchParams.get('c');
      if (!code) return json({ error: '缺少 c 参数' }, 400);
      const params = await env.KV.get(`sl:${code}`);
      if (!params) return json({ error: '短链接不存在或已过期' }, 404);
      return json({ success: true, params });
    }

    // ── 批量文章抓取：GET /?urls=id1,id2,id3 ──
    const urlsParam = url.searchParams.get('urls');
    if (urlsParam) {
      const ids = urlsParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
      const results = await Promise.all(ids.map(async id => {
        const articleUrl = `https://mp.weixin.qq.com/s/${id}`;
        try {
          const html = await fetchArticle(articleUrl);
          const data = parseArticle(html, articleUrl);
          return data.title ? { success: true, ...data } : { success: false, url: articleUrl };
        } catch (e) {
          return { success: false, url: articleUrl };
        }
      }));
      return json({ success: true, articles: results });
    }

    // ── 单篇文章抓取：GET /?url=... ──
    const articleUrl = url.searchParams.get('url');
    if (articleUrl) {
      if (!articleUrl.includes('mp.weixin.qq.com')) return json({ error: '仅支持微信公众号文章链接' }, 403);
      try {
        const html = await fetchArticle(articleUrl);
        const data = parseArticle(html, articleUrl);
        if (!data.title) return json({ error: '无法解析文章' }, 404);
        return json({ success: true, ...data });
      } catch (e) {
        return json({ error: '抓取失败: ' + e.message }, 500);
      }
    }

    return json({ error: '缺少参数' }, 400);
  }
};

// 生成6位随机短码（字母+数字）
function genCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function fetchArticle(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': 'https://mp.weixin.qq.com/',
    },
    redirect: 'follow',
  });
  return res.text();
}

function parseArticle(html, url) {
  const getMeta = (prop) => {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
    return m ? decodeHtml(m[1]) : '';
  };

  const title =
    getMeta('og:title') ||
    extract(html, /<h1[^>]*class="[^"]*rich_media_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
    extract(html, /<title>([\s\S]*?)<\/title>/i)?.replace(/\s*[-–|].*$/, '').trim();

  let desc = getMeta('og:description') || getMeta('description');
  if (!desc || desc.includes('document.') || desc.includes('function(') || /<[a-z]/i.test(desc) || desc.length < 5) {
    desc = extractCleanText(html);
  }
  desc = desc.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);

  const cover = getMeta('og:image') || getMeta('twitter:image');
  const account = getMeta('og:site_name') ||
    extract(html, /<strong[^>]*class="[^"]*account_nickname_inner[^"]*"[^>]*>([\s\S]*?)<\/strong>/i) ||
    '微信公众号';

  let publishTime = extract(html, /<em[^>]*id="publish_time"[^>]*>([\s\S]*?)<\/em>/i);
  if (!publishTime) {
    const tsMatch = html.match(/var ct\s*=\s*"(\d+)"/);
    if (tsMatch) {
      const d = new Date(parseInt(tsMatch[1]) * 1000);
      publishTime = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
  }

  return { title, desc, cover, account, publishTime, url };
}

function extract(html, regex) {
  const m = html.match(regex);
  return m ? decodeHtml(m[1].replace(/<[^>]+>/g, '').trim()) : '';
}

function extractCleanText(html) {
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const m = clean.match(/<div[^>]+id="js_content"[^>]*>([\s\S]{0,3000})/i);
  if (!m) return '';
  return m[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function decodeHtml(str) {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' } });
}
