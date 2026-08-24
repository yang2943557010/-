// 百度站长文件验证：直接 200 返回，避免 CF 去 .html 的 307 跳转
export function onRequest() {
  return new Response('a9787a33c58bb56cb035fff9ada21679', {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
