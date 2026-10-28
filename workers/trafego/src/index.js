// YAMB — serviço intermediário do Painel de Tráfego (Cloudflare Worker).
// Lê campanhas e desempenho na Marketing API do Meta com o token guardado como segredo
// e entrega ao painel /interno/trafego/ só para quem envia a senha do painel.
// Só leitura: este Worker nunca cria, pausa ou edita nada no Meta.
//
// Segredos (definidos pelo dono, nunca no código):
//   META_TOKEN   — token do Meta com ads_read
//   PAINEL_SENHA — senha que a equipe digita no painel

const PERIODOS = ["today", "yesterday", "last_7d", "last_30d", "this_month", "last_month"];
const CAMPOS_INSIGHTS = [
  "campaign_id", "campaign_name", "objective", "spend", "impressions", "reach", "frequency",
  "clicks", "inline_link_clicks", "ctr", "cpc", "cpm", "actions", "cost_per_action_type",
].join(",");
const CAMPOS_CAMPANHA = "id,name,objective,status,effective_status,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time";
const CAMPOS_CONTA = "id,account_id,name,account_status,currency,business_name,amount_spent,disable_reason";
// Resultados que o painel destaca, na ordem de prioridade (o primeiro encontrado vira "resultado").
const RESULTADOS = [
  ["onsite_conversion.messaging_conversation_started_7d", "Conversas iniciadas"],
  ["lead", "Leads"],
  ["onsite_conversion.lead_grouped", "Leads"],
  ["offsite_conversion.fb_pixel_purchase", "Compras"],
  ["purchase", "Compras"],
  ["link_click", "Cliques no link"],
  ["post_engagement", "Engajamento"],
  ["video_view", "Visualizações de vídeo"],
];

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return json({ erro: "Só leitura." }, 405, cors);

    if (!(await senhaOk(request.headers.get("X-Painel-Senha") || "", env.PAINEL_SENHA))) {
      return json({ erro: "Senha do painel incorreta." }, 401, cors);
    }
    if (!env.META_TOKEN) return json({ erro: "META_TOKEN não configurado no Worker." }, 500, cors);

    const url = new URL(request.url);
    const periodo = PERIODOS.includes(url.searchParams.get("periodo")) ? url.searchParams.get("periodo") : "last_7d";
    try {
      if (url.pathname === "/token") return json(await statusToken(env), 200, cors);
      if (url.pathname === "/contas") return json(await comCache(ctx, "contas", () => contas(env)), 200, cors);
      if (url.pathname === "/painel") return json(await comCache(ctx, "painel:" + periodo, () => painel(env, periodo)), 200, cors);
      return json({ erro: "Endereço desconhecido.", enderecos: ["/painel?periodo=last_7d", "/contas", "/token"] }, 404, cors);
    } catch (e) {
      return json({ erro: String(e.message || e) }, 502, cors);
    }
  },
};

// ---------------------------------------------------------------- Meta

function graph(env, caminho, params = {}) {
  const v = env.GRAPH_VERSION || "v25.0";
  const u = new URL(`https://graph.facebook.com/${v}/${caminho.replace(/^\//, "")}`);
  for (const [k, val] of Object.entries(params)) u.searchParams.set(k, val);
  return u;
}

async function pegar(env, caminho, params) {
  const resp = await fetch(graph(env, caminho, params), { headers: { Authorization: `Bearer ${env.META_TOKEN}` } });
  const dados = await resp.json();
  if (dados.error) {
    const e = dados.error;
    const venceu = e.code === 190;
    throw new Error(venceu ? "O token do Meta venceu ou foi revogado — gere um novo e atualize META_TOKEN." : `Meta: ${e.message} (código ${e.code})`);
  }
  return dados;
}

async function todasPaginas(env, caminho, params, limite = 10) {
  const itens = [];
  let dados = await pegar(env, caminho, { limit: "200", ...params });
  for (let i = 0; ; i++) {
    itens.push(...(dados.data || []));
    const proxima = dados.paging && dados.paging.next;
    if (!proxima || i >= limite) break;
    const resp = await fetch(proxima, { headers: { Authorization: `Bearer ${env.META_TOKEN}` } });
    dados = await resp.json();
    if (dados.error) throw new Error(`Meta: ${dados.error.message}`);
  }
  return itens;
}

const STATUS_CONTA = { 1: "Ativa", 2: "Desativada", 3: "Pagamento pendente", 7: "Em análise de risco", 8: "Liquidação pendente", 9: "Em período de carência", 100: "Fechamento pendente", 101: "Fechada" };

async function contas(env) {
  const lista = await todasPaginas(env, "me/adaccounts", { fields: CAMPOS_CONTA });
  return {
    atualizado: new Date().toISOString(),
    contas: lista.map((c) => ({
      id: c.id, nome: c.name, empresa: c.business_name || null, moeda: c.currency,
      status: STATUS_CONTA[c.account_status] || String(c.account_status), ativa: c.account_status === 1,
    })),
  };
}

async function painel(env, periodo) {
  const { contas: lista } = await contas(env);
  const ativas = lista.filter((c) => c.ativa);
  const porConta = await Promise.all(ativas.map((c) => dadosDaConta(env, c, periodo).catch((e) => ({ ...c, erro: String(e.message || e), campanhas: [] }))));
  const totais = somar(porConta.flatMap((c) => c.campanhas));
  return { atualizado: new Date().toISOString(), periodo, totais, contas: porConta, contasInativas: lista.filter((c) => !c.ativa) };
}

async function dadosDaConta(env, conta, periodo) {
  const [campanhas, insights] = await Promise.all([
    todasPaginas(env, `${conta.id}/campaigns`, {
      fields: CAMPOS_CAMPANHA,
      effective_status: JSON.stringify(["ACTIVE", "IN_PROCESS", "WITH_ISSUES"]),
    }),
    todasPaginas(env, `${conta.id}/insights`, { level: "campaign", date_preset: periodo, fields: CAMPOS_INSIGHTS }),
  ]);
  const ins = Object.fromEntries(insights.map((i) => [i.campaign_id, i]));
  const centavos = (v) => (v == null ? null : Number(v) / 100);
  const lista = campanhas.map((c) => {
    const i = ins[c.id] || {};
    const res = resultado(i);
    const gasto = num(i.spend);
    return {
      id: c.id, nome: c.name, objetivo: c.objective, status: c.effective_status,
      orcamentoDiario: centavos(c.daily_budget), orcamentoTotal: centavos(c.lifetime_budget), orcamentoRestante: centavos(c.budget_remaining),
      inicio: c.start_time || null, fim: c.stop_time || null,
      gasto, impressoes: num(i.impressions), alcance: num(i.reach), frequencia: num(i.frequency),
      cliques: num(i.clicks), cliquesLink: num(i.inline_link_clicks), ctr: num(i.ctr), cpc: num(i.cpc), cpm: num(i.cpm),
      resultado: res.nome, resultados: res.valor, custoPorResultado: res.valor ? gasto / res.valor : null,
      alertas: alertas(c, i, res, gasto),
    };
  });
  lista.sort((a, b) => b.gasto - a.gasto);
  return { ...conta, campanhas: lista, totais: somar(lista) };
}

function resultado(i) {
  const acoes = Object.fromEntries((i.actions || []).map((a) => [a.action_type, num(a.value)]));
  for (const [tipo, nome] of RESULTADOS) if (acoes[tipo]) return { nome, valor: acoes[tipo] };
  return { nome: null, valor: 0 };
}

function alertas(c, i, res, gasto) {
  const a = [];
  if (c.effective_status === "WITH_ISSUES") a.push("Campanha com problema no Meta");
  if (gasto > 0 && !res.valor) a.push("Gastando sem resultado no período");
  if (num(i.frequency) >= 4) a.push("Frequência alta: o público está vendo muito o mesmo anúncio");
  const restante = Number(c.budget_remaining || 0) / 100, total = Number(c.lifetime_budget || 0) / 100;
  if (total > 0 && restante / total < 0.1) a.push("Orçamento total quase no fim");
  return a;
}

function somar(campanhas) {
  const t = { campanhas: campanhas.length, gasto: 0, impressoes: 0, alcance: 0, cliques: 0, resultados: 0 };
  for (const c of campanhas) for (const k of ["gasto", "impressoes", "alcance", "cliques", "resultados"]) t[k] += c[k] || 0;
  t.ctr = t.impressoes ? (t.cliques / t.impressoes) * 100 : null;
  t.cpc = t.cliques ? t.gasto / t.cliques : null;
  t.custoPorResultado = t.resultados ? t.gasto / t.resultados : null;
  return t;
}

async function statusToken(env) {
  const d = await pegar(env, "debug_token", { input_token: env.META_TOKEN });
  const x = d.data || {};
  return { valido: !!x.is_valid, venceEm: x.expires_at ? new Date(x.expires_at * 1000).toISOString() : "sem vencimento", permissoes: x.scopes || [] };
}

// ---------------------------------------------------------------- utilidades

const num = (v) => (v == null || v === "" ? 0 : Number(v));

async function comCache(ctx, chave, fn) {
  const cache = caches.default;
  const req = new Request(`https://cache.yamb-trafego/${encodeURIComponent(chave)}`);
  const hit = await cache.match(req);
  if (hit) return hit.json();
  const dados = await fn();
  ctx.waitUntil(cache.put(req, new Response(JSON.stringify(dados), { headers: { "Cache-Control": "max-age=600" } })));
  return dados;
}

async function senhaOk(enviada, certa) {
  if (!certa) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(enviada)), crypto.subtle.digest("SHA-256", enc.encode(certa))]);
  return crypto.subtle.timingSafeEqual(a, b);
}

function corsHeaders(request, env) {
  const origem = request.headers.get("Origin") || "";
  const permitidas = (env.ORIGENS || "https://yamb.com.br,https://www.yamb.com.br,https://site-yamb.pages.dev").split(",");
  const ok = permitidas.includes(origem) || /^https:\/\/[a-z0-9-]+\.site-yamb\.pages\.dev$/.test(origem) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origem);
  return {
    "Access-Control-Allow-Origin": ok ? origem : "https://yamb.com.br",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "X-Painel-Senha",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(dados, status, headers) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
