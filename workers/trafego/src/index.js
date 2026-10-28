// YAMB — serviço intermediário do Painel de Tráfego (Cloudflare Worker).
// Lê campanhas e desempenho na Marketing API do Meta com o token guardado como segredo
// e entrega ao painel /interno/trafego/ só para quem envia a senha do painel.
// Só leitura: este Worker nunca cria, pausa ou edita nada no Meta.
//
// Segredos (definidos pelo dono, nunca no código):
//   META_TOKEN   — token do Meta com ads_read
//   PAINEL_SENHA — senha que a equipe digita no painel
//
// Endereços:
//   /painel?periodo=last_7d          visão geral de todas as contas (com período anterior e plataformas)
//   /cliente?id=act_123&periodo=...  detalhe de uma conta: campanhas, conjuntos, anúncios, público, dia a dia
//   /contas                          lista de contas · /token  validade da chave

const PERIODOS = ["today", "yesterday", "last_7d", "last_30d", "this_month", "last_month"];
const METRICAS = "spend,impressions,reach,frequency,clicks,inline_link_clicks,ctr,cpc,cpm,actions";
const CAMPOS_CAMPANHA = "id,name,objective,status,effective_status,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time";
const CAMPOS_CONJUNTO = "id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,optimization_goal,billing_event,targeting{age_min,age_max,genders,geo_locations{cities,regions,countries}}";
const CAMPOS_ANUNCIO = "id,name,adset_id,campaign_id,status,effective_status,creative{id,title,body,thumbnail_url,image_url,object_type,call_to_action_type}";
const CAMPOS_CONTA = "id,account_id,name,account_status,currency,business_name,timezone_name,disable_reason";
const ATIVOS = JSON.stringify(["ACTIVE", "IN_PROCESS", "WITH_ISSUES"]);
// Resultados que o painel destaca, na ordem de prioridade (o primeiro encontrado vira "resultado").
const RESULTADOS = [
  ["onsite_conversion.messaging_conversation_started_7d", "Conversas iniciadas"],
  ["lead", "Leads"],
  ["onsite_conversion.lead_grouped", "Leads"],
  ["offsite_conversion.fb_pixel_purchase", "Compras"],
  ["purchase", "Compras"],
  ["onsite_web_lead", "Leads"],
  ["link_click", "Cliques no link"],
  ["post_engagement", "Engajamento"],
  ["video_view", "Visualizações de vídeo"],
];
const CATEGORIAS = {
  OUTCOME_LEADS: "Leads", LEAD_GENERATION: "Leads",
  MESSAGES: "Mensagens",
  OUTCOME_TRAFFIC: "Tráfego", LINK_CLICKS: "Tráfego",
  OUTCOME_ENGAGEMENT: "Engajamento", POST_ENGAGEMENT: "Engajamento", PAGE_LIKES: "Engajamento", VIDEO_VIEWS: "Engajamento",
  OUTCOME_SALES: "Vendas", CONVERSIONS: "Vendas", PRODUCT_CATALOG_SALES: "Vendas",
  OUTCOME_AWARENESS: "Reconhecimento", BRAND_AWARENESS: "Reconhecimento", REACH: "Reconhecimento",
  OUTCOME_APP_PROMOTION: "App", APP_INSTALLS: "App",
};

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
      if (url.pathname === "/painel") return json(await comCache(ctx, "painel3:" + periodo, () => painel(env, periodo)), 200, cors);
      if (url.pathname === "/cliente") {
        const id = url.searchParams.get("id") || "";
        if (!/^act_\d+$/.test(id)) return json({ erro: "Conta inválida." }, 400, cors);
        return json(await comCache(ctx, "cliente2:" + id + ":" + periodo, () => cliente(env, id, periodo)), 200, cors);
      }
      return json({ erro: "Endereço desconhecido.", enderecos: ["/painel?periodo=last_7d", "/cliente?id=act_...", "/contas", "/token"] }, 404, cors);
    } catch (e) {
      return json({ erro: String(e.message || e) }, 502, cors);
    }
  },
};

// ---------------------------------------------------------------- períodos

// Datas no fuso de Brasília. O período anterior tem o mesmo número de dias, logo antes.
function intervalos(periodo) {
  const hoje = new Date(Date.now() - 3 * 3600e3);
  const d = (base, dias) => { const x = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate())); x.setUTCDate(x.getUTCDate() + dias); return x; };
  const iso = (x) => x.toISOString().slice(0, 10);
  let ini, fim;
  if (periodo === "today") { ini = fim = d(hoje, 0); }
  else if (periodo === "yesterday") { ini = fim = d(hoje, -1); }
  else if (periodo === "last_30d") { ini = d(hoje, -30); fim = d(hoje, -1); }
  else if (periodo === "this_month") { ini = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1)); fim = d(hoje, 0); }
  else if (periodo === "last_month") { ini = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 1, 1)); fim = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 0)); }
  else { ini = d(hoje, -7); fim = d(hoje, -1); }
  const dias = Math.round((fim - ini) / 864e5) + 1;
  const antFim = d(ini, -1), antIni = d(ini, -dias);
  return {
    atual: { since: iso(ini), until: iso(fim) },
    anterior: { since: iso(antIni), until: iso(antFim) },
    dias,
  };
}
const faixa = (r) => JSON.stringify(r);

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
    if (e.code === 190) throw new Error("O token do Meta venceu ou foi revogado — gere um novo e atualize META_TOKEN.");
    if (e.code === 17 || e.code === 80004 || e.code === 613) throw new Error("O Meta limitou as consultas por alguns minutos. Tente de novo daqui a pouco.");
    throw new Error(`Meta: ${e.message} (código ${e.code})`);
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

const insights = (env, conta, params) => todasPaginas(env, `${conta}/insights`, { fields: METRICAS, ...params });

const STATUS_CONTA = { 1: "Ativa", 2: "Desativada", 3: "Pagamento pendente", 7: "Em análise de risco", 8: "Liquidação pendente", 9: "Em período de carência", 100: "Fechamento pendente", 101: "Fechada" };

async function contas(env) {
  const lista = await todasPaginas(env, "me/adaccounts", { fields: CAMPOS_CONTA });
  return {
    atualizado: new Date().toISOString(),
    contas: lista.map((c) => ({
      id: c.id, nome: c.name, empresa: c.business_name || null, moeda: c.currency, fuso: c.timezone_name || null,
      status: STATUS_CONTA[c.account_status] || String(c.account_status), ativa: c.account_status === 1,
    })),
  };
}

// ---------------------------------------------------------------- visão geral

async function painel(env, periodo) {
  const r = intervalos(periodo);
  const { contas: lista } = await contas(env);
  const ativas = lista.filter((c) => c.ativa);
  // 4 consultas por conta, todas num lote só: o Worker gratuito aceita no máximo 50 pedidos externos por vez.
  const consultas = ativas.flatMap((c) => [
    rel(`${c.id}/campaigns`, { fields: CAMPOS_CAMPANHA, effective_status: ATIVOS, limit: "200" }),
    rel(`${c.id}/insights`, { level: "campaign", time_range: faixa(r.atual), fields: "campaign_id,campaign_name,objective," + METRICAS, limit: "500" }),
    rel(`${c.id}/insights`, { level: "account", time_range: faixa(r.anterior), fields: METRICAS }),
    rel(`${c.id}/insights`, { level: "account", time_range: faixa(r.atual), fields: METRICAS, breakdowns: "publisher_platform" }),
  ]);
  const resp = await lote(env, consultas);
  const porConta = ativas.map((c, i) => {
    const [camp, ins, ant, plat] = resp.slice(i * 4, i * 4 + 4);
    const erro = [camp, ins, ant, plat].find((x) => x.erro);
    if (erro) return { ...c, erro: erro.erro, campanhas: [], totais: somar([]), anterior: null, plataformas: [] };
    return montarConta(c, camp.data, ins.data, ant.data, plat.data);
  });
  const campanhas = porConta.flatMap((c) => c.campanhas);
  return {
    atualizado: new Date().toISOString(), periodo, intervalo: r,
    totais: somar(campanhas),
    anterior: somarMetricas(porConta.map((c) => c.anterior).filter(Boolean)),
    categorias: agrupar(campanhas, (k) => k.categoria),
    plataformas: juntarPlataformas(porConta.flatMap((c) => c.plataformas)),
    contas: porConta,
    contasInativas: lista.filter((c) => !c.ativa),
  };
}

function montarConta(conta, campanhas, ins, anterior, plat) {
  const lista = juntarCampanhas(campanhas, ins, conta);
  return {
    ...conta, campanhas: lista, totais: somar(lista), ativas: lista.filter((k) => k.ativaAgora).length,
    anterior: anterior[0] ? metricas(anterior[0]) : metricas({}),
    plataformas: plat.map((p) => ({ nome: NOMES_PLATAFORMA[p.publisher_platform] || p.publisher_platform, ...metricas(p) })),
  };
}

// Campanhas ativas agora + campanhas que gastaram no período e já não estão ativas
// (pausadas ou encerradas). Assim o total bate com o do Gerenciador de Anúncios.
function juntarCampanhas(campanhas, ins, conta) {
  const porId = Object.fromEntries(ins.map((i) => [i.campaign_id, i]));
  const lista = campanhas.map((c) => ({ ...linhaCampanha(c, porId[c.id] || {}, conta), ativaAgora: true }));
  const vistas = new Set(campanhas.map((c) => c.id));
  for (const i of ins) {
    if (vistas.has(i.campaign_id) || !num(i.spend)) continue;
    lista.push({ ...linhaCampanha({ id: i.campaign_id, name: i.campaign_name, objective: i.objective, effective_status: "INATIVA" }, i, conta), ativaAgora: false });
  }
  return lista.sort((a, b) => b.gasto - a.gasto);
}

// Graph API em lote: até 50 consultas por pedido. Devolve, na ordem, {data} ou {erro} de cada uma.
const rel = (caminho, params) => caminho + "?" + new URLSearchParams(params).toString();
async function lote(env, consultas) {
  const v = env.GRAPH_VERSION || "v25.0";
  const saida = [];
  for (let i = 0; i < consultas.length; i += 50) {
    const corpo = new URLSearchParams({ access_token: env.META_TOKEN, include_headers: "false", batch: JSON.stringify(consultas.slice(i, i + 50).map((u) => ({ method: "GET", relative_url: `${v}/${u}` }))) });
    const resp = await fetch("https://graph.facebook.com/", { method: "POST", body: corpo });
    const dados = await resp.json();
    if (dados.error) {
      if (dados.error.code === 190) throw new Error("O token do Meta venceu ou foi revogado — gere um novo e atualize META_TOKEN.");
      throw new Error(`Meta: ${dados.error.message} (código ${dados.error.code})`);
    }
    for (const r of dados) {
      let b = {};
      try { b = JSON.parse((r && r.body) || "{}"); } catch (e) {}
      saida.push(b.error ? { erro: (b.error.code === 17 || b.error.code === 80004 || b.error.code === 613) ? "O Meta limitou as consultas desta conta por alguns minutos." : `Meta: ${b.error.message}` } : { data: b.data || [] });
    }
  }
  return saida;
}

// ---------------------------------------------------------------- detalhe do cliente

async function cliente(env, id, periodo) {
  const r = intervalos(periodo);
  const tr = faixa(r.atual);
  const info = await pegar(env, id, { fields: CAMPOS_CONTA });
  const conta = { id: info.id, nome: info.name, empresa: info.business_name || null, moeda: info.currency, fuso: info.timezone_name || null, status: STATUS_CONTA[info.account_status] || String(info.account_status) };
  const [campanhas, conjuntos, anuncios, insCamp, insConj, insAnun, anterior, diario, idadeGenero, posicionamentos, regioes] = await Promise.all([
    todasPaginas(env, `${id}/campaigns`, { fields: CAMPOS_CAMPANHA, effective_status: ATIVOS }),
    todasPaginas(env, `${id}/adsets`, { fields: CAMPOS_CONJUNTO, effective_status: ATIVOS }),
    todasPaginas(env, `${id}/ads`, { fields: CAMPOS_ANUNCIO, effective_status: ATIVOS }, 5),
    insights(env, id, { level: "campaign", time_range: tr, fields: "campaign_id,campaign_name,objective," + METRICAS }),
    insights(env, id, { level: "adset", time_range: tr, fields: "adset_id," + METRICAS }),
    insights(env, id, { level: "ad", time_range: tr, fields: "ad_id," + METRICAS }, 5),
    insights(env, id, { level: "account", time_range: faixa(r.anterior) }),
    insights(env, id, { level: "account", time_range: tr, time_increment: "1" }),
    insights(env, id, { level: "account", time_range: tr, breakdowns: "age,gender" }),
    insights(env, id, { level: "account", time_range: tr, breakdowns: "publisher_platform,platform_position" }),
    insights(env, id, { level: "account", time_range: tr, breakdowns: "region" }).catch(() => []),
  ]);
  const ij = Object.fromEntries(insConj.map((i) => [i.adset_id, i]));
  const ia = Object.fromEntries(insAnun.map((i) => [i.ad_id, i]));
  const nomeCamp = Object.fromEntries(campanhas.map((c) => [c.id, c.name]));
  const nomeConj = Object.fromEntries(conjuntos.map((c) => [c.id, c.name]));

  const camps = juntarCampanhas(campanhas, insCamp, conta);
  const conjs = conjuntos.map((s) => {
    const m = metricas(ij[s.id] || {});
    const t = s.targeting || {};
    return {
      id: s.id, nome: s.name, campanha: nomeCamp[s.campaign_id] || null, campanhaId: s.campaign_id, status: s.effective_status,
      otimizacao: s.optimization_goal || null, orcamentoDiario: centavos(s.daily_budget), orcamentoTotal: centavos(s.lifetime_budget),
      publico: resumoPublico(t), ...m, alertas: alertas(s, m, null),
    };
  }).sort((a, b) => b.gasto - a.gasto);
  const anuns = anuncios.map((a) => {
    const m = metricas(ia[a.id] || {});
    const cr = a.creative || {};
    return {
      id: a.id, nome: a.name, conjunto: nomeConj[a.adset_id] || null, campanha: nomeCamp[a.campaign_id] || null, status: a.effective_status,
      titulo: cr.title || null, texto: cr.body ? cr.body.slice(0, 240) : null, miniatura: cr.thumbnail_url || cr.image_url || null,
      tipo: cr.object_type || null, botao: cr.call_to_action_type || null, ...m, alertas: alertas(a, m, null),
    };
  }).sort((a, b) => b.gasto - a.gasto);

  return {
    atualizado: new Date().toISOString(), periodo, intervalo: r, conta,
    totais: somar(camps), ativas: camps.filter((k) => k.ativaAgora).length, anterior: anterior[0] ? metricas(anterior[0]) : metricas({}),
    categorias: agrupar(camps, (k) => k.categoria),
    campanhas: camps, conjuntos: conjs, anuncios: anuns,
    diario: diario.map((d) => ({ dia: d.date_start, ...metricas(d) })).sort((a, b) => a.dia.localeCompare(b.dia)),
    idadeGenero: idadeGenero.map((x) => ({ idade: x.age, genero: GENEROS[x.gender] || x.gender, ...metricas(x) })),
    posicionamentos: posicionamentos.map((x) => ({ plataforma: NOMES_PLATAFORMA[x.publisher_platform] || x.publisher_platform, posicao: NOMES_POSICAO[x.platform_position] || x.platform_position, ...metricas(x) })).sort((a, b) => b.gasto - a.gasto),
    regioes: regioes.map((x) => ({ regiao: x.region, ...metricas(x) })).sort((a, b) => b.gasto - a.gasto).slice(0, 15),
  };
}

// ---------------------------------------------------------------- montagem

const centavos = (v) => (v == null ? null : Number(v) / 100);
const num = (v) => (v == null || v === "" ? 0 : Number(v));
const NOMES_PLATAFORMA = { facebook: "Facebook", instagram: "Instagram", messenger: "Messenger", audience_network: "Audience Network", threads: "Threads", whatsapp: "WhatsApp" };
const NOMES_POSICAO = { feed: "Feed", story: "Stories", instagram_stories: "Stories", facebook_stories: "Stories", reels: "Reels", instagram_reels: "Reels", facebook_reels: "Reels", instagram_explore: "Explorar", instagram_explore_grid_home: "Explorar", marketplace: "Marketplace", right_hand_column: "Coluna direita", video_feeds: "Vídeos", search: "Pesquisa", messenger_inbox: "Caixa de entrada", an_classic: "Rede de público", instream_video: "Vídeo in-stream", profile_feed: "Perfil", facebook_reels_overlay: "Reels (sobreposição)", instagram_profile_feed: "Perfil" };
const GENEROS = { male: "Homens", female: "Mulheres", unknown: "Não informado" };

function metricas(i) {
  const res = resultado(i);
  const gasto = num(i.spend);
  return {
    gasto, impressoes: num(i.impressions), alcance: num(i.reach), frequencia: num(i.frequency),
    cliques: num(i.clicks), cliquesLink: num(i.inline_link_clicks), ctr: num(i.ctr), cpc: num(i.cpc), cpm: num(i.cpm),
    resultado: res.nome, resultados: res.valor, custoPorResultado: res.valor ? gasto / res.valor : null,
  };
}

function linhaCampanha(c, i, conta) {
  const m = metricas(i);
  return {
    id: c.id, nome: c.name, conta: conta.nome, contaId: conta.id, moeda: conta.moeda,
    objetivo: c.objective, categoria: CATEGORIAS[c.objective] || "Outros", status: c.effective_status,
    orcamentoDiario: centavos(c.daily_budget), orcamentoTotal: centavos(c.lifetime_budget), orcamentoRestante: centavos(c.budget_remaining),
    inicio: c.start_time || null, fim: c.stop_time || null, ...m, alertas: alertas(c, m, c),
  };
}

function resultado(i) {
  const acoes = Object.fromEntries((i.actions || []).map((a) => [a.action_type, num(a.value)]));
  for (const [tipo, nome] of RESULTADOS) if (acoes[tipo]) return { nome, valor: acoes[tipo] };
  return { nome: null, valor: 0 };
}

function resumoPublico(t) {
  const partes = [];
  if (t.age_min || t.age_max) partes.push(`${t.age_min || 18}–${t.age_max || 65}+ anos`);
  if (t.genders && t.genders.length === 1) partes.push(t.genders[0] === 1 ? "homens" : "mulheres");
  const g = t.geo_locations || {};
  const cidades = (g.cities || []).map((c) => c.name).filter(Boolean);
  const regioes = (g.regions || []).map((r) => r.name).filter(Boolean);
  if (cidades.length) partes.push(cidades.slice(0, 3).join(", ") + (cidades.length > 3 ? ` +${cidades.length - 3}` : ""));
  else if (regioes.length) partes.push(regioes.slice(0, 3).join(", "));
  else if ((g.countries || []).length) partes.push(g.countries.join(", "));
  return partes.join(" · ") || null;
}

function alertas(obj, m, campanha) {
  const a = [];
  if (obj.effective_status === "WITH_ISSUES") a.push({ nivel: "alto", texto: "Com problema no Meta" });
  if (m.gasto > 0 && !m.resultados) a.push({ nivel: "alto", texto: "Gastando sem resultado no período" });
  if (m.frequencia >= 4) a.push({ nivel: "medio", texto: "Frequência alta: o público está vendo muito o mesmo anúncio" });
  if (m.impressoes > 1000 && m.ctr > 0 && m.ctr < 0.5) a.push({ nivel: "medio", texto: "CTR baixo (menos de 0,5%): revisar criativo ou público" });
  if (campanha) {
    const restante = Number(campanha.budget_remaining || 0) / 100, total = Number(campanha.lifetime_budget || 0) / 100;
    if (total > 0 && restante / total < 0.1) a.push({ nivel: "medio", texto: "Orçamento total quase no fim" });
    if (campanha.stop_time && new Date(campanha.stop_time) - Date.now() < 3 * 864e5 && new Date(campanha.stop_time) > Date.now()) a.push({ nivel: "baixo", texto: "Termina em menos de 3 dias" });
  }
  return a;
}

const CHAVES = ["gasto", "impressoes", "alcance", "cliques", "cliquesLink", "resultados"];

function somar(lista) {
  const t = { campanhas: lista.length };
  for (const k of CHAVES) t[k] = 0;
  for (const c of lista) for (const k of CHAVES) t[k] += c[k] || 0;
  return derivadas(t);
}

function somarMetricas(lista) {
  const t = {};
  for (const k of CHAVES) t[k] = 0;
  for (const c of lista) for (const k of CHAVES) t[k] += c[k] || 0;
  return derivadas(t);
}

function derivadas(t) {
  t.ctr = t.impressoes ? (t.cliques / t.impressoes) * 100 : null;
  t.cpc = t.cliques ? t.gasto / t.cliques : null;
  t.cpm = t.impressoes ? (t.gasto / t.impressoes) * 1000 : null;
  t.custoPorResultado = t.resultados ? t.gasto / t.resultados : null;
  return t;
}

function agrupar(lista, chave) {
  const g = {};
  for (const c of lista) (g[chave(c)] = g[chave(c)] || []).push(c);
  return Object.entries(g).map(([nome, cs]) => ({ nome, ...somar(cs) })).sort((a, b) => b.gasto - a.gasto);
}

function juntarPlataformas(lista) {
  const g = {};
  for (const p of lista) {
    const t = (g[p.nome] = g[p.nome] || Object.fromEntries(CHAVES.map((k) => [k, 0])));
    for (const k of CHAVES) t[k] += p[k] || 0;
  }
  return Object.entries(g).map(([nome, t]) => ({ nome, ...derivadas(t) })).sort((a, b) => b.gasto - a.gasto);
}

async function statusToken(env) {
  const d = await pegar(env, "debug_token", { input_token: env.META_TOKEN });
  const x = d.data || {};
  return { valido: !!x.is_valid, venceEm: x.expires_at ? new Date(x.expires_at * 1000).toISOString() : "sem vencimento", permissoes: x.scopes || [] };
}

// ---------------------------------------------------------------- utilidades

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
