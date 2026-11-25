// app.yamb.com.br = ambiente interno no celular.
// Entrega o mesmo app publicado no site (yamb.com.br/interno/app/), sem cópia:
//   /                      -> /interno/app/
//   /manifest.webmanifest, /sw.js, /icon.png -> /interno/app/...
//   o resto (/interno/..., /assets/...) passa igual.
const ORIGEM = 'https://site-yamb-csc.pages.dev';
const DO_APP = new Set(['/manifest.webmanifest', '/sw.js', '/icon.png']);

export default {
  async fetch(req) {
    const url = new URL(req.url);
    let caminho = url.pathname;
    if (caminho === '/' || caminho === '/index.html') caminho = '/interno/app/';
    else if (DO_APP.has(caminho)) caminho = '/interno/app' + caminho;
    else if (!caminho.startsWith('/interno/') && !caminho.startsWith('/assets/')) {
      return Response.redirect('https://app.yamb.com.br/', 302);
    }
    const alvo = new URL(caminho + url.search, ORIGEM);
    const resp = await fetch(alvo, { method: req.method, headers: req.headers, redirect: 'manual' });
    const h = new Headers(resp.headers);
    const loc = h.get('Location');
    if (loc) h.set('Location', loc.replace(ORIGEM, 'https://app.yamb.com.br'));
    if (caminho === '/interno/app/sw.js') h.set('Service-Worker-Allowed', '/');
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
  },
};
