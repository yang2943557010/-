const LIANWU_ORIGIN = 'https://yourenjia.top';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function isAllowedHost(hostname) {
  return hostname === '251800.xyz'
    || hostname === 'www.251800.xyz'
    || hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname.endsWith('.pages.dev')
    || hostname.endsWith('.workers.dev');
}

function isAllowedRequest(request) {
  const site = (request.headers.get('Sec-Fetch-Site') || '').toLowerCase();
  if (site === 'same-origin' || site === 'same-site') return true;

  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  try {
    if (origin) return isAllowedHost(new URL(origin).hostname);
    if (referer) return isAllowedHost(new URL(referer).hostname);
  } catch (_) {}

  // 部分浏览器同源 POST 可能不带 Origin/Referer，只靠 Host 判断不安全，
  // 但配合 Sec-Fetch-Mode 可再放宽一层。
  const mode = (request.headers.get('Sec-Fetch-Mode') || '').toLowerCase();
  const dest = (request.headers.get('Sec-Fetch-Dest') || '').toLowerCase();
  if ((mode === 'cors' || mode === 'same-origin') && (dest === 'empty' || dest === '')) {
    try {
      return isAllowedHost(new URL(request.url).hostname);
    } catch (_) {}
  }
  return false;
}

function buildRawText(url, pwd) {
  const link = String(url || '').trim();
  const code = String(pwd || '').trim();
  if (!link) return '';
  if (!code) return link;
  const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`[?&](?:pwd|password|code)=${escaped}(?:&|$)`, 'i').test(link)) return link;
  return `${link} 提取码: ${code}`;
}

function uploadKey(env) {
  return String(env?.LIANWU_UPLOAD_KEY || 'N--sP50uX9E1TElYWY69gcFTd8JKdhsP').trim();
}

async function uploadOne(resource, key) {
  const response = await fetch(`${LIANWU_ORIGIN}/api/upload`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'X-Upload-Key': key,
    },
    body: JSON.stringify(resource),
  });
  const data = await response.json().catch(() => null);
  return { httpStatus: response.status, data };
}

async function handleUpload(request, env) {
  if (!isAllowedRequest(request)) {
    return jsonResponse({ code: 403, message: '来源不被允许', data: null }, 403);
  }

  const key = uploadKey(env);
  if (!key) {
    return jsonResponse({ code: 500, message: '链坞上传密钥未配置', data: null }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return jsonResponse({ code: 400, message: '请求格式不正确', data: null }, 400);
  }

  const items = Array.isArray(body?.items) ? body.items.slice(0, 80) : [];
  const resources = [];
  for (const item of items) {
    const title = String(item?.title || '').trim().slice(0, 120);
    const rawText = buildRawText(item?.url, item?.pwd).slice(0, 5000);
    if (!title || !rawText) continue;
    const resource = { title, raw_text: rawText };
    const description = String(item?.description || '').trim().slice(0, 500);
    const tag = String(item?.tag || '').trim().slice(0, 32);
    if (description) resource.description = description;
    if (tag) resource.tags = [tag];
    resources.push(resource);
  }

  if (!resources.length) {
    return jsonResponse({ code: 400, message: '没有可上传的资源', data: null }, 400);
  }

  const summary = { created: 0, skipped: 0, errors: [] };
  let rateLimited = false;
  for (const resource of resources) {
    const result = await uploadOne(resource, key);
    const data = result.data;
    const code = data && typeof data.code === 'number' ? data.code : result.httpStatus;
    const message = (data && data.message) || '链坞没有返回结果';
    if (code === 401 || result.httpStatus === 401) {
      return jsonResponse({ code: 401, message, data: null }, 401);
    }
    if (code === 404 && /未开启/.test(message)) {
      return jsonResponse({ code: 404, message, data: null }, 404);
    }
    if (code === 429 || result.httpStatus === 429) {
      rateLimited = true;
      summary.errors.push({ title: resource.title, error: message });
      break;
    }
    if (!data || typeof data.code !== 'number') {
      summary.errors.push({ title: resource.title, error: message });
      continue;
    }
    if (data.code === 0 && data.data && data.data.id) {
      summary.created += 1;
      continue;
    }
    if (data.code === 409 || /已存在/.test(message)) {
      summary.skipped += 1;
      summary.errors.push({ title: resource.title, error: message });
      continue;
    }
    summary.errors.push({ title: resource.title, error: message });
  }

  if (rateLimited && summary.created === 0 && summary.skipped === 0) {
    return jsonResponse({ code: 429, message: '超过每小时限速', data: summary }, 429);
  }
  return jsonResponse({ code: 0, message: 'ok', data: summary }, 200);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/lianwu') {
      if (request.method !== 'POST') {
        return jsonResponse({ code: 405, message: '只接受 POST', data: null }, 405);
      }
      return handleUpload(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
