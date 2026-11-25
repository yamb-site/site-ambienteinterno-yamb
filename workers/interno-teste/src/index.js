// Cópia de TESTE dos dados do ambiente interno (fase 0 da troca para o visual novo).
// Mesmo formato do Apps Script real: GET -> {rev, data}; POST {data} -> {ok, rev}.
// Nunca grava na planilha real e não manda notificação para ninguém.
// Recarregar com os dados reais de agora (só LÊ a planilha real):
//   curl -X POST "https://yamb-interno-teste.diretoria-c5d.workers.dev/recarregar" -H "Authorization: Bearer $RECARREGAR_TOKEN"
const json = (o, cors, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url), origem = req.headers.get('Origin') || '';
    const ok = env.ORIGENS.split(',').includes(origem) || /^https:\/\/[a-z0-9-]+\.site-yamb-csc\.pages\.dev$/.test(origem);
    const cors = ok ? { 'Access-Control-Allow-Origin': origem, 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' } : {};
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (url.pathname === '/recarregar' && req.method === 'POST') {
      if (req.headers.get('Authorization') !== 'Bearer ' + env.RECARREGAR_TOKEN) return json({ ok: false, erro: 'sem permissão' }, cors, 401);
      const r = await fetch(env.SHEET_URL + '?t=' + Date.now()); // só leitura da planilha real
      const j = await r.json();
      if (!j || !j.data || !Array.isArray(j.data.items)) return json({ ok: false, erro: 'planilha real não respondeu' }, cors, 502);
      const rev = Date.now();
      await env.DADOS.put('banco', JSON.stringify({ rev, data: j.data }));
      return json({ ok: true, rev, itens: j.data.items.length }, cors);
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/exec')) {
      const s = await env.DADOS.get('banco');
      return json(s ? JSON.parse(s) : { rev: 0, data: null }, cors);
    }

    if (req.method === 'POST' && (url.pathname === '/' || url.pathname === '/exec')) {
      let body; try { body = JSON.parse(await req.text() || '{}'); } catch (e) { return json({ ok: false, erro: 'corpo inválido' }, cors, 400); }
      if (!body.data) return json({ ok: true }, cors);
      if (!Array.isArray(body.data.items)) return json({ ok: false, erro: 'dados sem itens' }, cors, 400);
      const antes = await env.DADOS.get('banco');
      if (antes) await env.DADOS.put('anterior', antes); // uma versão de volta, para conferir testes
      const rev = Date.now();
      await env.DADOS.put('banco', JSON.stringify({ rev, data: body.data }));
      return json({ ok: true, rev }, cors);
    }
    return json({ ok: false, erro: 'não encontrado' }, cors, 404);
  },
};
