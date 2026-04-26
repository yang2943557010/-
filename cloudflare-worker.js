/**
 * Cloudflare Worker - 微信文章信息抓取代理
 * 
 * 部署步骤：
 * 1. 登录 https://dash.cloudflare.com
 * 2. 左侧菜单 → Workers & Pages → Create Worker
 * 3. 把本文件全部内容粘贴进去，点击 Deploy
 * 4. 复制 Worker 的 URL（如 https://wx-article.你的名字.workers.dev）
 * 5. 把该 URL 填入 app.js 的 WX_PROXY_URL 变量
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // 批量模式：?urls=id1,id2,id3
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

    // 单篇模式：?url=...
    const articleUrl = url.searchParams.get('url');
    if (!articleUrl) return json({ error: '缺少 url 参数' }, 400);
    if (!articleUrl.includes('mp.weixin.qq.com')) return json({ error: '仅支持微信公众号文章链接' }, 403);

    try {
      const html = await fetchArticle(articleUrl);
      const data = parseArticle(html, articleUrl);
      if (!data.title) return json({ error: '无法解析文章，可能已过期' }, 404);
      return json({ success: true, ...data });
    } catch (e) {
      return json({ error: '抓取失败: ' + e.message }, 500);
    }
  }
};

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

  // desc 优先用 og:description，避免混入 JS 代码
  let desc = getMeta('og:description') || getMeta('description');
  // 如果 desc 包含 JS 特征或 HTML 标签则丢弃，重新从正文提取
  if (!desc || desc.includes('document.') || desc.includes('function(') || /<[a-z]/i.test(desc) || desc.length < 5) {
    desc = extractCleanText(html);
  }
  // 最终再清理一遍残留标签和多余空白
  desc = desc.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  const cover = getMeta('og:image') || getMeta('twitter:image');

  const account =
    getMeta('og:site_name') ||
    extract(html, /<strong[^>]*class="[^"]*account_nickname_inner[^"]*"[^>]*>([\s\S]*?)<\/strong>/i) ||
    '微信公众号';

  // 时间戳转可读日期
  let publishTime = extract(html, /<em[^>]*id="publish_time"[^>]*>([\s\S]*?)<\/em>/i);
  if (!publishTime) {
    const tsMatch = html.match(/var ct\s*=\s*"(\d+)"/);
    if (tsMatch) {
      const d = new Date(parseInt(tsMatch[1]) * 1000);
      publishTime = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
  }

  return { title, desc: (desc || '').replace(/<[^>]*>/g, '').trim().slice(0, 200), cover, account, publishTime, url };
}

// 从正文提取干净文本（去掉脚本和标签）
function extractCleanText(html) {
  // 去掉 script/style 块
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  // 取 js_content 区域
  const m = clean.match(/<div[^>]+id="js_content"[^>]*>([\s\S]{0,3000})/i);
  if (!m) return '';
  return m[1]
    .replace(/<[^>]+>/g, ' ')   // 标签替换为空格
    .replace(/&[a-z]+;/gi, ' ') // HTML 实体
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function extract(html, regex) {
  const m = html.match(regex);
  return m ? decodeHtml(m[1].replace(/<[^>]+>/g, '').trim()) : '';
}

function extractText(html, regex) {
  const m = html.match(regex);
  if (!m) return '';
  return m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}
