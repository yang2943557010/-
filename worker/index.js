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
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  try {
    if (origin) return isAllowedHost(new URL(origin).hostname);
    if (referer) return isAllowedHost(new URL(referer).hostname);
  } catch (_) {}
  return false;
}

function readSession(response) {
  const cookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [];
  for (const cookie of cookies) {
    const matched = /(?:^|;\s*)lw_session=([^;]+)/.exec(cookie);
    if (matched) return matched[1];
  }
  const raw = response.headers.get('set-cookie') || '';
  const matched = /lw_session=([^;]+)/.exec(raw);
  return matched ? matched[1] : '';
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

async function loginLianwu(env) {
  const username = env?.LIANWU_USERNAME || 'admin';
  const password = env?.LIANWU_PASSWORD || '';
  if (!password) {
    return { ok: false, session: '', message: '链坞密码未配置' };
  }
  const response = await fetch(`${LIANWU_ORIGIN}/api/admin/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ username, password, remember: true }),
  });
  const data = await response.json().catch(() => null);
  const session = readSession(response);
  if (!data || data.code !== 0) {
    return { ok: false, session: '', message: (data && data.message) || '链坞登录失败' };
  }
  if (!session) {
    return { ok: false, session: '', message: '链坞登录成功但没有拿到会话' };
  }
  return { ok: true, session, message: data.message || 'ok' };
}

async function handleUpload(request, env) {
  if (!isAllowedRequest(request)) {
    return jsonResponse({ code: 403, message: '来源不被允许', data: null }, 403);
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
    const url = String(item?.url || '').trim();
    const rawText = buildRawText(url, item?.pwd);
    if (!title || !rawText) continue;
    const resource = {
      title,
      description: String(item?.description || '').trim().slice(0, 500),
      raw_text: rawText.slice(0, 5000),
      status: 'published',
    };
    const tag = String(item?.tag || '').trim().slice(0, 32);
    if (tag) resource.tags = [tag];
    resources.push(resource);
  }

  if (!resources.length) {
    return jsonResponse({ code: 400, message: '没有可上传的资源', data: null }, 400);
  }

  const auth = await loginLianwu(env);
  if (!auth.ok) {
    const status = auth.message === '链坞密码未配置' ? 500 : 401;
    return jsonResponse({ code: status, message: auth.message, data: null }, status);
  }

  const upstream = await fetch(`${LIANWU_ORIGIN}/api/admin/import-json`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      cookie: `lw_session=${auth.session}`,
    },
    body: JSON.stringify({ resources }),
  });
  const data = await upstream.json().catch(() => null);
  if (!data || typeof data.code !== 'number') {
    return jsonResponse({ code: 502, message: '链坞没有返回结果', data: null }, 502);
  }
  const status = data.code === 0 ? 200 : (upstream.status || data.code || 500);
  return jsonResponse(data, status >= 200 && status < 600 ? status : 500);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/lianwu') {
      return jsonResponse({ code: 404, message: 'not found', data: null }, 404);
    }
    if (request.method !== 'POST') {
      return jsonResponse({ code: 405, message: '只接受 POST', data: null }, 405);
    }
    return handleUpload(request, env);
  },
};
