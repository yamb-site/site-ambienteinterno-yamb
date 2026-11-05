import { buildPushHTTPRequest } from "@pushforge/builder";

// YAMB — serviço intermediário do Painel de Tráfego (Cloudflare Worker).
// Lê campanhas e desempenho na Marketing API do Meta com o token guardado como segredo
// e entrega ao painel /interno/trafego/ só para quem entrou com usuário e senha.
//
// Segredos (definidos pelo dono, nunca no código):
//   META_TOKEN   — token do Meta com ads_read
//   PAINEL_SENHA — chave mestra: entra como usuário "admin" (para o dono criar os acessos na aba Acessos)
//
// Usuários (KV, prefixo usr:) com três papéis:
//   admin   — tudo, inclusive a aba Acessos (criar, trocar senha, bloquear)
//   equipe  — vê todos os clientes, decide sugestões, edita campanhas e recebe avisos
//   cliente — só vê os números das contas dele (sem sugestões, alertas, edição, avisos ou histórico)
// O filtro do cliente é feito aqui no servidor: ele nunca recebe dados de outra conta.
//   POST /entrar {usuario, senha} → {token, usuario} · POST /sair · GET /eu
//   GET /acessos · POST /acessos/salvar {login, nome, papel, contas, senha?, ativo} · POST /acessos/remover {login}  (só admin)
//
// Endereços:
//   /painel?periodo=last_7d          visão geral de todas as contas (com período anterior e plataformas)
//   /cliente?id=act_123&periodo=...  detalhe de uma conta: campanhas, conjuntos, anúncios, público, dia a dia
//   /contas                          lista de contas · /token  validade da chave
//   /sugestoes?periodo=last_7d       sugestões (regras sobre os números de cada conta) + histórico de decisões
//   GET /instagram?periodo=...           relatório do Instagram de cada cliente (números do período e do período anterior)
//   GET /instagram/perfil?id=<ig>&periodo=...  detalhe de um perfil: dia a dia, posts, ideias da YA (só leitura)
//   POST /decidir  {id, decisao}          aceitar (aplica no Meta) ou recusar uma sugestão
//   POST /desfazer {registro, autor}      desfaz uma mudança aplicada
//   POST /editar   {objeto, nivel, acao, valor, autor}  ativar, pausar ou mudar orçamento (campanha, conjunto, anúncio)
//   GET/POST /config                      avisos no celular (as regras das sugestões são da YA e não se editam pelo painel)
//   POST /push/inscrever · /push/sair · /push/teste   notificações no celular (Web Push, sem serviço de terceiros)
//   Agendado (cron, a cada 15 min): urgentes avisam na hora (7h–22h); o resto nas horas configuradas
//
// Escrita no Meta: SÓ por /decidir e /desfazer, com o segredo separado META_TOKEN_GERENCIAR (ads_management),
// só nas ações listadas em ACOES, e sempre conferindo o estado atual da campanha antes de mudar.

const PERIODOS = ["today", "yesterday", "last_7d", "last_30d", "this_month", "last_month"];
const METRICAS = "spend,impressions,reach,frequency,clicks,inline_link_clicks,ctr,cpc,cpm,actions";
const CAMPOS_CAMPANHA = "id,name,objective,status,effective_status,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time";
const CAMPOS_CONJUNTO = "id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,optimization_goal,billing_event,start_time,end_time,targeting{age_min,age_max,genders,geo_locations{cities,regions,countries}}";
const CAMPOS_ANUNCIO = "id,name,adset_id,campaign_id,status,effective_status,creative{id,title,body,thumbnail_url,image_url,object_type,call_to_action_type}";
const CAMPOS_CONTA = "id,account_id,name,account_status,currency,business_name,timezone_name,disable_reason";
const ATIVOS = JSON.stringify(["ACTIVE", "IN_PROCESS", "WITH_ISSUES"]);
const ATIVOS_E_PAUSADOS = JSON.stringify(["ACTIVE", "IN_PROCESS", "WITH_ISSUES", "PAUSED", "ADSET_PAUSED", "CAMPAIGN_PAUSED"]);
const NO_AR = new Set(["ACTIVE", "IN_PROCESS", "WITH_ISSUES"]);
const ROTAS_ESCRITA = ["/decidir", "/desfazer", "/editar", "/config", "/push/inscrever", "/push/sair", "/push/teste", "/entrar", "/sair", "/acessos/salvar", "/acessos/remover"];
// O que o cliente pode pedir (tudo só leitura e filtrado pelas contas dele).
const ROTAS_CLIENTE = ["/eu", "/sair", "/contas", "/painel", "/cliente", "/instagram", "/instagram/perfil"];
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
    const escrita = request.method === "POST" && ROTAS_ESCRITA.includes(new URL(request.url).pathname);
    if (request.method !== "GET" && !escrita) return json({ erro: "Só leitura." }, 405, cors);

    const url = new URL(request.url);
    if (!env.YAMB_TRAFEGO) return json({ erro: "Armazenamento (KV) não configurado no Worker." }, 500, cors);
    if (url.pathname === "/entrar") {
      const corpo = await request.json().catch(() => ({}));
      const r = await entrar(env, request, corpo);
      return json(r, r.erro ? (r.status || 401) : 200, cors);
    }
    const quem = await sessao(env, request);
    if (!quem) return json({ erro: "Sessão encerrada. Entre de novo." }, 401, cors);
    if (quem.papel === "cliente" && !ROTAS_CLIENTE.includes(url.pathname)) return json({ erro: "Seu acesso é só de leitura." }, 403, cors);
    if (url.pathname.startsWith("/acessos") && quem.papel !== "admin") return json({ erro: "Só o administrador mexe nos acessos." }, 403, cors);
    if (!env.META_TOKEN) return json({ erro: "META_TOKEN não configurado no Worker." }, 500, cors);

    const periodo = PERIODOS.includes(url.searchParams.get("periodo")) ? url.searchParams.get("periodo") : "last_7d";
    try {
      if (url.pathname === "/eu") return json({ usuario: publico(quem) }, 200, cors);
      if (url.pathname === "/token") return json(await statusToken(env), 200, cors);
      if (url.pathname === "/sugestoes") return json(await listarSugestoes(env, ctx, periodo), 200, cors);
      if (url.pathname === "/acessos" && !escrita) return json(await listarAcessos(env, ctx), 200, cors);
      if (url.pathname === "/config" && !escrita) return json({ config: await lerConfig(env), vapid: env.VAPID_PUBLIC || null, inscritos: await contarInscritos(env) }, 200, cors);
      if (escrita) {
        const corpo = await request.json().catch(() => ({}));
        corpo.autor = quem.nome; // quem decide é sempre quem entrou, nunca um nome digitado
        const rotas = { "/decidir": () => decidir(env, ctx, corpo), "/desfazer": () => desfazer(env, corpo), "/editar": () => editar(env, ctx, corpo),
          "/config": () => salvarConfig(env, corpo), "/push/inscrever": () => inscrever(env, corpo), "/push/sair": () => sairPush(env, corpo), "/push/teste": () => pushTeste(env),
          "/sair": () => sairSessao(env, request), "/acessos/salvar": () => salvarAcesso(env, quem, corpo), "/acessos/remover": () => removerAcesso(env, quem, corpo) };
        return json(await rotas[url.pathname](), 200, cors);
      }
      if (url.pathname === "/contas") {
        const c = await comCache(ctx, "contas", () => contas(env));
        return json(quem.papel === "cliente" ? { ...c, contas: c.contas.filter((x) => quem.contas.includes(x.id)) } : c, 200, cors);
      }
      if (url.pathname === "/painel") {
        const g = await comCache(ctx, "painel4:" + periodo, () => painel(env, periodo));
        return json(quem.papel === "cliente" ? painelDoCliente(g, quem.contas) : g, 200, cors);
      }
      if (url.pathname === "/instagram") {
        const g = await comCache(ctx, "ig1:" + periodo, () => instagramGeral(env, ctx, periodo));
        return json(quem.papel === "cliente" ? instagramDoCliente(g, quem.contas) : g, 200, cors);
      }
      if (url.pathname === "/instagram/perfil") {
        const id = url.searchParams.get("id") || "";
        if (!/^\d+$/.test(id)) return json({ erro: "Perfil inválido." }, 400, cors);
        const g = await comCache(ctx, "ig1:" + periodo, () => instagramGeral(env, ctx, periodo));
        const perfil = (quem.papel === "cliente" ? instagramDoCliente(g, quem.contas) : g).perfis.find((x) => x.id === id);
        if (!perfil) return json({ erro: "Esse perfil não é do seu acesso." }, 403, cors);
        const det = await comCache(ctx, "ig2:" + id + ":" + periodo, () => instagramPerfil(env, perfil, periodo));
        return json(quem.papel === "cliente" ? { ...det, ideias: [] } : det, 200, cors); // as ideias da YA são da equipe
      }
      if (url.pathname === "/cliente") {
        const id = url.searchParams.get("id") || "";
        if (!/^act_\d+$/.test(id)) return json({ erro: "Conta inválida." }, 400, cors);
        if (quem.papel === "cliente" && !quem.contas.includes(id)) return json({ erro: "Essa conta não é do seu acesso." }, 403, cors);
        const d = await comCache(ctx, "cliente3:" + id + ":" + periodo, () => cliente(env, id, periodo));
        return json(quem.papel === "cliente" ? semAnalise(d) : d, 200, cors);
      }
      return json({ erro: "Endereço desconhecido.", enderecos: ["/painel?periodo=last_7d", "/cliente?id=act_...", "/contas", "/token"] }, 404, cors);
    } catch (e) {
      return json({ erro: String(e.message || e) }, 502, cors);
    }
  },

  // Checagem automática (cron a cada 15 minutos, ver wrangler.toml).
  async scheduled(evento, env, ctx) {
    ctx.waitUntil(checagemAgendada(env, ctx).catch((e) => console.log("checagem falhou:", e.message)));
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
    rel(`${c.id}/insights`, { level: "campaign", time_range: faixa(r.anterior), fields: "campaign_id,spend,actions", limit: "500" }),
  ]);
  const resp = await lote(env, consultas);
  const porConta = ativas.map((c, i) => {
    const [camp, ins, ant, plat, insAnt] = resp.slice(i * 5, i * 5 + 5);
    const erro = [camp, ins, ant, plat, insAnt].find((x) => x.erro);
    if (erro) return { ...c, erro: erro.erro, campanhas: [], totais: somar([]), anterior: null, plataformas: [], saude: null };
    return montarConta(c, camp.data, ins.data, ant.data, plat.data, insAnt.data, r.dias);
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

function montarConta(conta, campanhas, ins, anterior, plat, insAnt, dias) {
  const lista = juntarCampanhas(campanhas, ins, conta);
  const ant = Object.fromEntries((insAnt || []).map((i) => [i.campaign_id, metricas(i)]));
  for (const k of lista) { const a = ant[k.id]; k.anterior = a ? { gasto: a.gasto, resultados: a.resultados, custoPorResultado: a.custoPorResultado } : null; }
  const c = {
    ...conta, campanhas: lista, totais: somar(lista), ativas: lista.filter((k) => k.ativaAgora).length, dias: dias || 7,
    anterior: anterior[0] ? metricas(anterior[0]) : metricas({}),
    plataformas: plat.map((p) => ({ nome: NOMES_PLATAFORMA[p.publisher_platform] || p.publisher_platform, ...metricas(p) })),
  };
  c.saude = saude(c);
  return c;
}

// Nota de saúde da conta (0–100): começa em 100 e perde pontos pelo que está ruim no período.
function saude(c) {
  let nota = 100; const motivos = [];
  const t = c.totais, a = c.anterior || {};
  const tira = (p, m) => { nota -= p; motivos.push(m); };
  if (t.gasto > 0 && !t.resultados) tira(40, "Investimento sem nenhum resultado no período");
  if (a.custoPorResultado && t.custoPorResultado && t.custoPorResultado > a.custoPorResultado * 1.3) tira(20, `Custo por resultado subiu ${Math.round((t.custoPorResultado / a.custoPorResultado - 1) * 100)}%`);
  if (a.resultados >= 5 && t.resultados < a.resultados * 0.7) tira(15, `Resultados caíram ${Math.round((1 - t.resultados / a.resultados) * 100)}%`);
  const altos = c.campanhas.reduce((n, k) => n + k.alertas.filter((x) => x.nivel === "alto").length, 0);
  const medios = c.campanhas.reduce((n, k) => n + k.alertas.filter((x) => x.nivel === "medio").length, 0);
  if (altos) tira(Math.min(30, altos * 15), `${altos} alerta(s) urgente(s)`);
  if (medios) tira(Math.min(20, medios * 7), `${medios} alerta(s) de atenção`);
  if (t.impressoes > 2000 && t.ctr != null && t.ctr < 0.6) tira(10, "CTR geral baixo");
  if (!c.ativas) tira(0, "Sem campanhas ativas");
  nota = Math.max(0, Math.min(100, Math.round(nota)));
  return { nota, rotulo: !c.ativas && !t.gasto ? "Sem veiculação" : nota >= 80 ? "Saudável" : nota >= 60 ? "Atenção" : "Crítica", motivos };
}

// Campanhas ativas agora + campanhas que gastaram no período e já não estão ativas
// (pausadas ou encerradas). Assim o total bate com o do Gerenciador de Anúncios.
function juntarCampanhas(campanhas, ins, conta) {
  const porId = Object.fromEntries(ins.map((i) => [i.campaign_id, i]));
  const lista = campanhas.map((c) => ({ ...linhaCampanha(c, porId[c.id] || {}, conta), ativaAgora: NO_AR.has(c.effective_status), statusConfig: c.status }));
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
    todasPaginas(env, `${id}/campaigns`, { fields: CAMPOS_CAMPANHA, effective_status: ATIVOS_E_PAUSADOS }),
    todasPaginas(env, `${id}/adsets`, { fields: CAMPOS_CONJUNTO, effective_status: ATIVOS_E_PAUSADOS }),
    todasPaginas(env, `${id}/ads`, { fields: CAMPOS_ANUNCIO, effective_status: ATIVOS_E_PAUSADOS }, 5),
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
      id: s.id, nome: s.name, campanha: nomeCamp[s.campaign_id] || null, campanhaId: s.campaign_id, status: s.effective_status, statusConfig: s.status, ativaAgora: NO_AR.has(s.effective_status),
      otimizacao: s.optimization_goal || null, inicio: s.start_time || null, fim: s.end_time || null, orcamentoDiario: centavos(s.daily_budget), orcamentoTotal: centavos(s.lifetime_budget),
      publico: resumoPublico(t), ...m, alertas: alertas(s, m, null),
    };
  }).sort((a, b) => b.gasto - a.gasto);
  const anuns = anuncios.map((a) => {
    const m = metricas(ia[a.id] || {});
    const cr = a.creative || {};
    return {
      id: a.id, nome: a.name, conjunto: nomeConj[a.adset_id] || null, campanha: nomeCamp[a.campaign_id] || null, status: a.effective_status, statusConfig: a.status, ativaAgora: NO_AR.has(a.effective_status),
      titulo: cr.title || null, texto: cr.body ? cr.body.slice(0, 240) : null, miniatura: cr.thumbnail_url || cr.image_url || null,
      tipo: cr.object_type || null, botao: cr.call_to_action_type || null, ...m, alertas: alertas(a, m, null),
    };
  }).sort((a, b) => (b.ativaAgora - a.ativaAgora) || (b.gasto - a.gasto));
  conjs.sort((a, b) => (b.ativaAgora - a.ativaAgora) || (b.gasto - a.gasto));
  camps.sort((a, b) => (b.ativaAgora - a.ativaAgora) || (b.gasto - a.gasto));

  return {
    atualizado: new Date().toISOString(), periodo, intervalo: r, conta, podeEditar: !!env.META_TOKEN_GERENCIAR,
    totais: somar(camps.filter((k) => k.gasto > 0 || k.ativaAgora)), ativas: camps.filter((k) => k.ativaAgora).length, anterior: anterior[0] ? metricas(anterior[0]) : metricas({}),
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
  const ver = async (token) => {
    const x = (await pegar(env, "debug_token", { input_token: token })).data || {};
    return { valido: !!x.is_valid, venceEm: x.expires_at ? new Date(x.expires_at * 1000).toISOString() : "sem vencimento", permissoes: x.scopes || [] };
  };
  const leitura = await ver(env.META_TOKEN);
  if (env.META_TOKEN_GERENCIAR) leitura.gerenciar = await ver(env.META_TOKEN_GERENCIAR).catch((e) => ({ valido: false, erro: String(e.message || e) }));
  return leitura;
}


// ---------------------------------------------------------------- sugestões
//
// A YA sugere; a equipe aceita (podendo ajustar o valor do orçamento) ou recusa. Regras fixas (não se editam pelo painel),
// sobre os números da própria conta (a referência é a média do cliente no período, não um benchmark externo).
// Ações que o painel pode aplicar no Meta ao aceitar. Qualquer outra sugestão vira tarefa para a equipe.
const ACOES = { pausar: "Pausar campanha", orcamento: "Ajustar orçamento diário" };
const LIMITE_AJUSTE = 0.2; // nunca muda orçamento mais de 20% de uma vez
const DIAS_RECUSA = 7;

const PADRAO = {
  regras: {
    pausar: { ativa: true, rotulo: "Pausar campanha sem resultado", minimo: 30 },
    orcamentoMais: { ativa: true, rotulo: "Aumentar orçamento da mais eficiente" },
    orcamentoMenos: { ativa: true, rotulo: "Reduzir orçamento de campanha cara" },
    piora: { ativa: true, rotulo: "Custo por resultado subiu", percentual: 30 },
    semEntrega: { ativa: true, rotulo: "Campanha ativa sem entrega" },
    subutilizado: { ativa: true, rotulo: "Entrega abaixo do orçamento" },
    criativo: { ativa: true, rotulo: "Público cansado (frequência alta)", frequencia: 4 },
    ctr: { ativa: true, rotulo: "CTR baixo", minimo: 0.6 },
    problema: { ativa: true, rotulo: "Problema apontado pelo Meta" },
    fim: { ativa: true, rotulo: "Orçamento total no fim" },
  },
  notificacoes: { ativo: true, horas: [8, 13, 18], nivelMinimo: "medio" },
};

async function lerConfig(env) {
  const salvo = env.YAMB_TRAFEGO ? await env.YAMB_TRAFEGO.get("config", "json") : null;
  const c = JSON.parse(JSON.stringify(PADRAO));
  if (salvo) Object.assign(c.notificacoes, salvo.notificacoes || {});
  return c;
}

async function salvarConfig(env, corpo) {
  const autor = limpaAutor(corpo.autor);
  if (!autor) return { erro: "Informe quem está mudando os ajustes." };
  const atual = await lerConfig(env), novo = corpo.config || {};
  // As regras são da YA: o painel só muda os avisos.
  const n = novo.notificacoes || {};
  if ("ativo" in n) atual.notificacoes.ativo = !!n.ativo;
  if (Array.isArray(n.horas)) atual.notificacoes.horas = [...new Set(n.horas.map(Number).filter((h) => h >= 0 && h <= 23))].sort((a, b) => a - b);
  if (["alto", "medio", "baixo"].includes(n.nivelMinimo)) atual.notificacoes.nivelMinimo = n.nivelMinimo;
  await env.YAMB_TRAFEGO.put("config", JSON.stringify({ notificacoes: atual.notificacoes }));
  await registrar(env, { estado: "ajustes", autor, sugestao: { titulo: "Avisos no celular alterados" } });
  return { ok: true, config: atual };
}

// O que fazer em cada sugestão. Nas que a YA aplica, o primeiro passo é o que ela faz; os seguintes, o que acompanhar.
function passos(x) {
  const m = x.moeda, de = x.acao && dinheiro(x.acao.de, m), para = x.acao && dinheiro(x.acao.para, m);
  const p = {
    "pausar": [
      "A YA pausa a campanha no Meta assim que você aceitar: o gasto para na hora.",
      "Com o cliente, revise o que não funcionou: criativo, público ou oferta.",
      "Para voltar a veicular, use Desfazer no histórico ou peça à YA uma nova versão da campanha.",
    ],
    "orcamento-mais": [
      `A YA sobe o orçamento diário de ${de} para ${para}.`,
      "Acompanhe os próximos 3 dias: é normal o custo oscilar um pouco enquanto o Meta se ajusta.",
      "Se o custo por resultado subir mais de 30%, use Desfazer no histórico.",
    ],
    "orcamento-menos": [
      `A YA baixa o orçamento diário de ${de} para ${para}.`,
      "Enquanto isso, revise os anúncios da campanha: pause o de pior custo e teste um criativo novo.",
      "Quando o custo voltar para perto da média da conta, a YA sugere aumentar de novo.",
    ],
    "piora": [
      "No Gerenciador de Anúncios, abra a campanha e compare os anúncios: ache o que mais encareceu.",
      "Veja se a frequência subiu (público cansado) ou se o CTR caiu (criativo perdendo força).",
      "Teste o caminho do cliente: o link, o formulário ou o WhatsApp precisam estar respondendo.",
      "Pause o anúncio com pior custo e suba uma variação nova no mesmo conjunto.",
    ],
    "sem-entrega": [
      "No Gerenciador, abra a campanha e procure anúncio \"Reprovado\" ou conjunto pausado.",
      "Confira a forma de pagamento da conta em Configurações de pagamento.",
      "Se estiver tudo ativo, o público pode estar pequeno demais: amplie idade, região ou interesses.",
    ],
    "subutilizado": [
      "Amplie o público do conjunto: mais cidades, faixa de idade maior ou público Advantage+.",
      "Se o conjunto usa limite de custo ou de lance, aumente ou remova o limite.",
      "Suba um criativo novo: anúncios com pouca relevância recebem menos entrega.",
    ],
    "criativo": [
      "Produza 2 ou 3 criativos novos com a mesma mensagem: outra imagem, um vídeo curto ou um carrossel.",
      "Suba no mesmo conjunto e pause os criativos antigos com pior resultado.",
      "Se o público for pequeno, amplie um pouco para as pessoas não verem sempre o mesmo anúncio.",
    ],
    "ctr": [
      "Troque a imagem e a primeira frase: o anúncio precisa prender a atenção nos 2 primeiros segundos.",
      "Use uma chamada mais direta, por exemplo \"Chame no WhatsApp\" ou \"Peça seu orçamento\".",
      "Confira o público: amplo demais ou fora do perfil do cliente também derruba o CTR.",
    ],
    "problema": [
      "Abra a campanha no Gerenciador de Anúncios e leia o aviso em vermelho.",
      "Anúncio reprovado: ajuste o texto ou a imagem conforme o motivo e envie para revisão de novo.",
      "Problema de pagamento: atualize a forma de pagamento da conta do cliente.",
    ],
    "fim": [
      "Fale com o cliente: renovar, aumentar ou encerrar a campanha.",
      "Se renovar, ajuste o orçamento total ou a data de término no Gerenciador.",
    ],
  };
  return p[x.id.split(":")[0]] || [];
}

function regras(conta, cfg) {
  const R = (cfg || PADRAO).regras;
  const s = [];
  const m = conta.moeda;
  const comResultado = conta.campanhas.filter((k) => k.ativaAgora && k.resultados > 0);
  const cprConta = conta.totais.custoPorResultado;
  for (const k of conta.campanhas) {
    if (!k.ativaAgora) continue;
    const base = { contaId: conta.id, conta: conta.nome, campanhaId: k.id, campanha: k.nome, moeda: m };
    const limitePausa = cprConta ? Math.max(R.pausar.minimo, cprConta * 2) : Math.max(R.pausar.minimo, 50);
    if (R.pausar.ativa && k.gasto >= limitePausa && !k.resultados) {
      s.push({ ...base, id: "pausar:" + k.id, tipo: "pausar", nivel: "alto",
        titulo: "Pausar campanha sem resultado",
        motivo: `Investiu ${dinheiro(k.gasto, m)} no período sem nenhum resultado${cprConta ? ` (a média da conta é ${dinheiro(cprConta, m)} por resultado)` : ""}.`,
        acao: { tipo: "pausar", de: "Ativa", para: "Pausada" },
        impacto: `Para de gastar cerca de ${dinheiro(k.gasto / 7, m)} por dia sem retorno.` });
      continue;
    }
    if (k.orcamentoDiario && cprConta && comResultado.length >= 2) {
      if (R.orcamentoMais.ativa && k.resultados >= 5 && k.custoPorResultado <= cprConta * 0.7 && k.frequencia < 3) {
        const para = Math.round(k.orcamentoDiario * (1 + LIMITE_AJUSTE));
        if (para > k.orcamentoDiario) s.push({ ...base, id: "orcamento-mais:" + k.id, tipo: "orcamento", nivel: "baixo",
          titulo: "Aumentar orçamento da campanha mais eficiente",
          motivo: `${N(k.resultados)} resultados a ${dinheiro(k.custoPorResultado, m)} cada, ${Math.round((1 - k.custoPorResultado / cprConta) * 100)}% abaixo da média da conta (${dinheiro(cprConta, m)}), e o público ainda não está saturado (frequência ${k.frequencia.toFixed(1)}).`,
          acao: { tipo: "orcamento", de: k.orcamentoDiario, para },
          impacto: `Mais ${dinheiro(para - k.orcamentoDiario, m)}/dia onde cada resultado sai mais barato.` });
      } else if (R.orcamentoMenos.ativa && k.resultados > 0 && k.custoPorResultado >= cprConta * 1.8 && k.gasto >= 50) {
        const para = Math.max(1, Math.round(k.orcamentoDiario * (1 - LIMITE_AJUSTE)));
        if (para < k.orcamentoDiario) s.push({ ...base, id: "orcamento-menos:" + k.id, tipo: "orcamento", nivel: "medio",
          titulo: "Reduzir orçamento de campanha cara",
          motivo: `Cada resultado custa ${dinheiro(k.custoPorResultado, m)}, ${Math.round((k.custoPorResultado / cprConta - 1) * 100)}% acima da média da conta (${dinheiro(cprConta, m)}).`,
          acao: { tipo: "orcamento", de: k.orcamentoDiario, para },
          impacto: `Economiza ${dinheiro(k.orcamentoDiario - para, m)}/dia enquanto a campanha é revisada.` });
      }
    }
    const a = k.anterior;
    if (R.piora.ativa && a && a.resultados >= 3 && k.resultados >= 3 && k.custoPorResultado > a.custoPorResultado * (1 + R.piora.percentual / 100)) s.push({ ...base, id: "piora:" + k.id, tipo: "tarefa", nivel: "medio",
      titulo: "Custo por resultado subiu",
      motivo: `Passou de ${dinheiro(a.custoPorResultado, m)} para ${dinheiro(k.custoPorResultado, m)} por resultado (${Math.round((k.custoPorResultado / a.custoPorResultado - 1) * 100)}% a mais que no período anterior).`,
      acao: null, impacto: "Ver o que mudou: criativo, público, concorrência ou página de destino." });
    if (R.semEntrega.ativa && k.status === "ACTIVE" && !k.impressoes && (k.orcamentoDiario || k.orcamentoTotal)) s.push({ ...base, id: "sem-entrega:" + k.id, tipo: "tarefa", nivel: "alto",
      titulo: "Campanha ativa sem entrega",
      motivo: "Está ativa mas não teve nenhuma impressão no período: pode haver anúncio reprovado, conjunto pausado, público pequeno demais ou problema de pagamento.",
      acao: null, impacto: "Conferir no Gerenciador de Anúncios os conjuntos e anúncios dessa campanha." });
    if (R.subutilizado.ativa && k.orcamentoDiario && conta.dias >= 3 && k.impressoes > 0 && k.gasto < k.orcamentoDiario * conta.dias * 0.5) s.push({ ...base, id: "subutilizado:" + k.id, tipo: "tarefa", nivel: "baixo",
      titulo: "Entrega abaixo do orçamento",
      motivo: `Gastou ${dinheiro(k.gasto, m)} de ${dinheiro(k.orcamentoDiario * conta.dias, m)} possíveis (${Math.round(k.gasto / (k.orcamentoDiario * conta.dias) * 100)}%) em ${conta.dias} dias.`,
      acao: null, impacto: "Público pequeno, lance limitado ou anúncio com pouca qualidade: o dinheiro está parado." });
    if (R.criativo.ativa && k.frequencia >= R.criativo.frequencia) s.push({ ...base, id: "criativo:" + k.id, tipo: "tarefa", nivel: "medio",
      titulo: "Trocar o criativo (público cansado)",
      motivo: `Frequência ${k.frequencia.toFixed(1)}: cada pessoa viu o anúncio mais de ${R.criativo.frequencia} vezes no período.`,
      acao: null, impacto: "Criativo novo costuma baixar o custo quando a frequência passa de 4." });
    if (R.ctr.ativa && k.impressoes > 2000 && k.ctr > 0 && k.ctr < R.ctr.minimo) s.push({ ...base, id: "ctr:" + k.id, tipo: "tarefa", nivel: "medio",
      titulo: "Revisar criativo ou público (CTR baixo)",
      motivo: `CTR de ${k.ctr.toFixed(2).replace(".", ",")}% em ${N(k.impressoes)} impressões: poucas pessoas clicam.`,
      acao: null, impacto: "Testar outra chamada, imagem ou público." });
    if (R.problema.ativa && k.status === "WITH_ISSUES") s.push({ ...base, id: "problema:" + k.id, tipo: "tarefa", nivel: "alto",
      titulo: "Resolver problema apontado pelo Meta", motivo: "A campanha está com problema no Meta (anúncio reprovado, pagamento ou configuração).",
      acao: null, impacto: "Abrir no Gerenciador de Anúncios e ver o aviso." });
    if (R.fim.ativa && k.orcamentoTotal && k.orcamentoRestante != null && k.orcamentoRestante / k.orcamentoTotal < 0.1) s.push({ ...base, id: "fim:" + k.id, tipo: "tarefa", nivel: "baixo",
      titulo: "Orçamento total quase no fim", motivo: `Restam ${dinheiro(k.orcamentoRestante, m)} de ${dinheiro(k.orcamentoTotal, m)}.`,
      acao: null, impacto: "Decidir com o cliente se renova ou encerra." });
  }
  for (const x of s) x.passos = passos(x);
  return s;
}

const fmtCache = {};
function dinheiro(v, m) { m = m || "BRL"; if (!fmtCache[m]) fmtCache[m] = new Intl.NumberFormat("pt-BR", { style: "currency", currency: m }); return v == null ? "—" : fmtCache[m].format(v); }
const N = (v) => new Intl.NumberFormat("pt-BR").format(Math.round(v || 0));
const PESO = { alto: 0, medio: 1, baixo: 2 };

async function listarSugestoes(env, ctx, periodo) {
  const g = await comCache(ctx, "painel4:" + periodo, () => painel(env, periodo));
  const cfg = await lerConfig(env);
  const todas = g.contas.flatMap((c) => (c.erro ? [] : regras(c, cfg)));
  const kv = env.YAMB_TRAFEGO;
  const decisoes = kv ? await Promise.all(todas.map((x) => kv.get("dec:" + x.id, "json"))) : [];
  const abertas = todas.filter((x, i) => !decisoes[i]).sort((a, b) => PESO[a.nivel] - PESO[b.nivel]);
  return { atualizado: g.atualizado, periodo, podeAplicar: !!env.META_TOKEN_GERENCIAR, sugestoes: abertas, historico: await historico(env) };
}

async function historico(env, limite = 40) {
  if (!env.YAMB_TRAFEGO) return [];
  const l = await env.YAMB_TRAFEGO.list({ prefix: "log:", limit: 200 });
  const nomes = l.keys.map((k) => k.name).sort().reverse().slice(0, limite);
  return (await Promise.all(nomes.map((n) => env.YAMB_TRAFEGO.get(n, "json")))).filter(Boolean);
}

async function registrar(env, item) {
  const chave = `log:${new Date().toISOString()}:${Math.random().toString(36).slice(2, 8)}`;
  const reg = { registro: chave, em: new Date().toISOString(), ...item };
  await env.YAMB_TRAFEGO.put(chave, JSON.stringify(reg));
  return reg;
}

const limpaAutor = (a) => String(a || "").replace(/[^\p{L}\p{N} .'-]/gu, "").trim().slice(0, 60);

async function escrever(env, objeto, campos) {
  const corpo = new URLSearchParams({ ...campos, access_token: env.META_TOKEN_GERENCIAR });
  const resp = await fetch(graph(env, objeto), { method: "POST", body: corpo });
  const dados = await resp.json();
  if (dados.error) throw new Error(`O Meta recusou a mudança: ${dados.error.error_user_msg || dados.error.message}`);
  return dados;
}

async function decidir(env, ctx, corpo) {
  const autor = limpaAutor(corpo.autor);
  if (!autor) return { erro: "Informe quem está decidindo." };
  if (!env.YAMB_TRAFEGO) return { erro: "Armazenamento de decisões não configurado." };
  const periodo = PERIODOS.includes(corpo.periodo) ? corpo.periodo : "last_7d";
  // A sugestão é recalculada aqui no servidor: o painel só manda o id, nunca a mudança.
  const { sugestoes } = await listarSugestoes(env, ctx, periodo);
  const sug = sugestoes.find((x) => x.id === corpo.id);
  if (!sug) return { erro: "Essa sugestão não está mais aberta. Atualize o painel." };
  const ttl = { expirationTtl: DIAS_RECUSA * 86400 };

  if (corpo.decisao === "recusar") {
    const motivo = String(corpo.motivo || "").slice(0, 300);
    await env.YAMB_TRAFEGO.put("dec:" + sug.id, JSON.stringify({ estado: "recusada", autor, em: new Date().toISOString() }), ttl);
    return { ok: true, registro: await registrar(env, { estado: "recusada", autor, motivo, sugestao: sug }) };
  }
  if (corpo.decisao !== "aceitar") return { erro: "Decisão inválida." };

  if (!sug.acao) {
    await env.YAMB_TRAFEGO.put("dec:" + sug.id, JSON.stringify({ estado: "tarefa", autor, em: new Date().toISOString() }), ttl);
    return { ok: true, registro: await registrar(env, { estado: "tarefa", autor, sugestao: sug }) };
  }
  if (!ACOES[sug.acao.tipo]) return { erro: "Ação não permitida." };
  if (!env.META_TOKEN_GERENCIAR) return { erro: "A chave de gerenciar ainda não foi configurada. Por enquanto, aceite como tarefa ou peça ao YA - Tráfego para configurar." };

  // Confere o estado atual da campanha antes de mudar.
  const atual = await pegar(env, sug.campanhaId, { fields: "id,name,status,effective_status,daily_budget,account_id" });
  if ("act_" + atual.account_id !== sug.contaId) return { erro: "A campanha não pertence a essa conta." };
  let antes, depois, editado = null;
  if (sug.acao.tipo === "pausar") {
    if (atual.status !== "ACTIVE") return { erro: "A campanha já não está ativa." };
    antes = { status: "ACTIVE" }; depois = { status: "PAUSED" };
  } else if (acao === "termino") {
    // valor vazio ou "sem" = rodar sem data de término; senão uma data futura AAAA-MM-DD (vale até o fim desse dia, fuso de Brasília)
    const v = String(corpo.valor ?? "").trim();
    const de = atual[CAMPO_FIM] || null;
    const fmt = (t) => new Date(t).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    if (!v || v === "sem") {
      if (!de) return { erro: "Já está sem data de término." };
      antes = { [CAMPO_FIM]: de }; depois = { [CAMPO_FIM]: 0 };
      descricao = `Tirou a data de término (era ${fmt(de)})`;
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return { erro: "Data inválida." };
      const novo = `${v}T23:59:59-0300`;
      if (!(new Date(novo) > new Date())) return { erro: "A data de término precisa ser futura." };
      if (de && new Date(de).getTime() === new Date(novo).getTime()) return { erro: "O término já é essa data." };
      antes = de ? { [CAMPO_FIM]: de } : { [CAMPO_FIM]: 0 }; depois = { [CAMPO_FIM]: novo };
      descricao = de ? `Término ${fmt(de)} → ${fmt(novo)}` : `Definiu término em ${fmt(novo)}`;
    }
  } else {
    const deMinor = Number(atual.daily_budget || 0);
    if (Math.round(deMinor / 100) !== Math.round(sug.acao.de)) return { erro: "O orçamento mudou desde a sugestão. Atualize o painel." };
    let paraMinor = Math.round(sug.acao.para * 100);
    if (corpo.valor != null && corpo.valor !== "") {
      // A pessoa ajustou o valor sugerido pela YA antes de aceitar.
      paraMinor = Math.round(Number(corpo.valor) * 100);
      if (!(paraMinor >= 100)) return { erro: "Orçamento inválido." };
      if (paraMinor > deMinor * 3 || paraMinor < deMinor / 3) return { erro: "Mudança grande demais de uma vez (mais de 3 vezes). Faça em etapas." };
      if (paraMinor === deMinor) return { erro: "O orçamento já é esse." };
      editado = { sugerido: sug.acao.para, escolhido: paraMinor / 100 };
    } else if (Math.abs(paraMinor - deMinor) > deMinor * LIMITE_AJUSTE + 100) return { erro: "Ajuste acima do limite de 20%." };
    antes = { daily_budget: String(deMinor) }; depois = { daily_budget: String(paraMinor) };
  }
  await escrever(env, sug.campanhaId, depois);
  await env.YAMB_TRAFEGO.put("dec:" + sug.id, JSON.stringify({ estado: "aplicada", autor, em: new Date().toISOString() }), ttl);
  return { ok: true, registro: await registrar(env, { estado: "aplicada", autor, sugestao: sug, campanhaId: sug.campanhaId, antes, depois, editado }) };
}

async function desfazer(env, corpo) {
  const autor = limpaAutor(corpo.autor);
  if (!autor) return { erro: "Informe quem está desfazendo." };
  if (!env.YAMB_TRAFEGO || !env.META_TOKEN_GERENCIAR) return { erro: "Desfazer não está configurado." };
  const chave = String(corpo.registro || "");
  if (!chave.startsWith("log:")) return { erro: "Registro inválido." };
  const reg = await env.YAMB_TRAFEGO.get(chave, "json");
  if (!reg || !["aplicada", "editada"].includes(reg.estado)) return { erro: "Só dá para desfazer mudanças aplicadas no Meta." };
  if (reg.desfeitoEm) return { erro: "Essa mudança já foi desfeita." };
  await escrever(env, reg.objetoId || reg.campanhaId, reg.antes);
  reg.desfeitoEm = new Date().toISOString(); reg.desfeitoPor = autor;
  await env.YAMB_TRAFEGO.put(chave, JSON.stringify(reg));
  await registrar(env, { estado: "desfeita", autor, sugestao: reg.sugestao, campanhaId: reg.campanhaId, objetoId: reg.objetoId, antes: reg.depois, depois: reg.antes });
  return { ok: true };
}

// ---------------------------------------------------------------- edição manual
const NIVEIS = { campanha: "Campanha", conjunto: "Conjunto", anuncio: "Anúncio" };
async function editar(env, ctx, corpo) {
  const autor = limpaAutor(corpo.autor);
  if (!autor) return { erro: "Informe quem está editando." };
  if (!env.META_TOKEN_GERENCIAR || !env.YAMB_TRAFEGO) return { erro: "A edição ainda não está configurada (falta a chave de gerenciar)." };
  const objeto = String(corpo.objeto || ""), nivel = corpo.nivel, acao = corpo.acao;
  if (!/^\d+$/.test(objeto) || !NIVEIS[nivel]) return { erro: "Item inválido." };
  if (!["ativar", "pausar", "orcamento", "termino"].includes(acao)) return { erro: "Ação inválida." };
  if (acao === "orcamento" && nivel === "anuncio") return { erro: "Anúncio não tem orçamento próprio." };
  if (acao === "termino" && nivel === "anuncio") return { erro: "Anúncio não tem data de término própria (vale a do conjunto)." };
  const CAMPO_FIM = nivel === "campanha" ? "stop_time" : "end_time";
  const atual = await pegar(env, objeto, { fields: "id,name,status,effective_status,account_id" + (nivel === "anuncio" ? "" : ",daily_budget," + CAMPO_FIM) });
  const { contas: lista } = await comCache(ctx, "contas", () => contas(env));
  const conta = lista.find((c) => c.id === "act_" + atual.account_id);
  if (!conta) return { erro: "Esse item não é de uma conta que o painel acompanha." };
  let antes, depois, descricao;
  if (acao === "ativar" || acao === "pausar") {
    const para = acao === "ativar" ? "ACTIVE" : "PAUSED";
    if (atual.status === para) return { erro: acao === "ativar" ? "Já está ativo." : "Já está pausado." };
    antes = { status: atual.status }; depois = { status: para };
    descricao = `${acao === "ativar" ? "Ativou" : "Pausou"} ${NIVEIS[nivel].toLowerCase()}`;
  } else {
    const deMinor = Number(atual.daily_budget || 0);
    if (!deMinor) return { erro: "Esse item não tem orçamento diário próprio (o orçamento fica no outro nível)." };
    const paraMinor = Math.round(Number(corpo.valor) * 100);
    if (!(paraMinor >= 100)) return { erro: "Orçamento inválido." };
    if (paraMinor > deMinor * 3 || paraMinor < deMinor / 3) return { erro: "Mudança grande demais de uma vez (mais de 3 vezes). Faça em etapas." };
    if (paraMinor === deMinor) return { erro: "O orçamento já é esse." };
    antes = { daily_budget: String(deMinor) }; depois = { daily_budget: String(paraMinor) };
    descricao = `Orçamento diário ${dinheiro(deMinor / 100, conta.moeda)} → ${dinheiro(paraMinor / 100, conta.moeda)}`;
  }
  await escrever(env, objeto, depois);
  return { ok: true, registro: await registrar(env, { estado: "editada", autor, objetoId: objeto, antes, depois,
    sugestao: { titulo: descricao, conta: conta.nome, campanha: `${NIVEIS[nivel]}: ${atual.name}` } }) };
}

// ---------------------------------------------------------------- notificações no celular (Web Push)
const hashCurto = async (t) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");

async function inscrever(env, corpo) {
  const sub = corpo.subscription || {};
  if (!sub.endpoint || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) return { erro: "Inscrição inválida." };
  const nome = limpaAutor(corpo.nome) || "Sem nome";
  await env.YAMB_TRAFEGO.put("push:" + (await hashCurto(sub.endpoint)), JSON.stringify({ subscription: { endpoint: sub.endpoint, keys: sub.keys }, nome, em: new Date().toISOString(), aparelho: String(corpo.aparelho || "").slice(0, 80) }));
  return { ok: true, inscritos: await contarInscritos(env) };
}
async function sairPush(env, corpo) {
  if (corpo.endpoint) await env.YAMB_TRAFEGO.delete("push:" + (await hashCurto(String(corpo.endpoint))));
  return { ok: true, inscritos: await contarInscritos(env) };
}
async function contarInscritos(env) {
  if (!env.YAMB_TRAFEGO) return 0;
  return (await env.YAMB_TRAFEGO.list({ prefix: "push:" })).keys.length;
}

async function enviarPush(env, mensagem) {
  if (!env.VAPID_PRIVATE_JWK || !env.YAMB_TRAFEGO) return { enviados: 0, erro: "Push não configurado." };
  const chaves = (await env.YAMB_TRAFEGO.list({ prefix: "push:" })).keys;
  let enviados = 0;
  for (const k of chaves) {
    const reg = await env.YAMB_TRAFEGO.get(k.name, "json");
    if (!reg) continue;
    try {
      const req = await buildPushHTTPRequest({ privateJWK: env.VAPID_PRIVATE_JWK, subscription: reg.subscription,
        message: { payload: mensagem, options: { ttl: 6 * 3600, urgency: "high", topic: "yamb-trafego" }, adminContact: "mailto:diretoria@yamb.com.br" } });
      const r = await fetch(req.endpoint, { method: "POST", headers: req.headers, body: req.body });
      if (r.status === 404 || r.status === 410) await env.YAMB_TRAFEGO.delete(k.name); // inscrição expirada
      else if (r.ok) enviados++;
    } catch (e) { console.log("push falhou:", e.message); }
  }
  return { enviados, total: chaves.length };
}

async function pushTeste(env) {
  const r = await enviarPush(env, { title: "YA · Painel de Tráfego", body: "Avisos ligados neste aparelho. A YA vai mandar as sugestões de tráfego aqui.", url: "/interno/trafego/#aba=sugestoes", tag: "yamb-teste" });
  return r.erro ? { erro: r.erro } : { ok: true, ...r };
}

async function checagemAgendada(env, ctx) {
  const cfg = await lerConfig(env);
  const n = cfg.notificacoes;
  const agora = new Date(Date.now() - 3 * 3600e3); // Brasília
  const hora = agora.getUTCHours(), minuto = agora.getUTCMinutes();
  if (!n.ativo) return;
  // Roda a cada 15 min. Nas horas marcadas (primeira checagem da hora): tudo a partir do nível escolhido.
  // Fora delas, entre 7h e 22h: só os urgentes, na hora.
  const horaMarcada = n.horas.includes(hora) && minuto < 15;
  if (!horaMarcada && (hora < 7 || hora > 22)) return;
  const { sugestoes } = await listarSugestoes(env, ctx, "last_7d");
  const limite = horaMarcada ? PESO[n.nivelMinimo] : PESO.alto;
  const relevantes = sugestoes.filter((x) => PESO[x.nivel] <= limite);
  const novas = [];
  for (const x of relevantes) if (!(await env.YAMB_TRAFEGO.get("notif:" + x.id))) novas.push(x);
  if (!novas.length) return;
  const urgentes = novas.filter((x) => x.nivel === "alto").length;
  const primeira = novas[0];
  await enviarPush(env, {
    title: urgentes ? `YA · ${urgentes} alerta${urgentes > 1 ? "s" : ""} urgente${urgentes > 1 ? "s" : ""} no tráfego` : `YA · ${novas.length} sugest${novas.length > 1 ? "ões" : "ão"} no tráfego`,
    body: `A YA sugere em ${primeira.conta}: ${primeira.titulo.toLowerCase()}.` + (novas.length > 1 ? ` E mais ${novas.length - 1}.` : "") + " Toque para aceitar ou recusar.",
    url: "/interno/trafego/#aba=sugestoes", tag: "yamb-trafego",
  });
  for (const x of novas) await env.YAMB_TRAFEGO.put("notif:" + x.id, "1", { expirationTtl: 3 * 86400 });
}

// ---------------------------------------------------------------- Instagram (relatórios, só leitura)
// Dados da Graph API do Instagram com o mesmo META_TOKEN (precisa de instagram_basic e instagram_manage_insights).
// Cada conta de anúncio é ligada ao(s) perfil(is) pela conta de anúncio no Meta (edge instagram_accounts).
const IG_PERFIL = "id,username,name,followers_count,follows_count,media_count,profile_picture_url";
const IG_TOTAIS = ["reach", "views", "profile_views", "accounts_engaged", "total_interactions"];
const FORMATOS = { REELS: "Reels", CAROUSEL_ALBUM: "Carrossel", IMAGE: "Foto", VIDEO: "Vídeo", FEED: "Feed" };
const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

// Graph API em lote que devolve o corpo inteiro de cada resposta ({corpo} ou {erro, codigo}).
async function loteBruto(env, consultas) {
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
      saida.push(b.error ? { erro: erroIG(b.error), codigo: b.error.code } : { corpo: b });
    }
  }
  return saida;
}
function erroIG(e) {
  const msg = String(e.message || "");
  if ([10, 200, 283].includes(e.code) || /permission|permiss/i.test(msg)) return "Falta permissão do Instagram no token do Meta (instagram_basic e instagram_manage_insights). Gere um token novo com essas permissões.";
  if (e.code === 17 || e.code === 80004 || e.code === 613 || e.code === 4) return "O Meta limitou as consultas por alguns minutos. Tente de novo daqui a pouco.";
  if (e.code === 100 && /instagram_manage_insights|metric/i.test(msg)) return "O Meta não liberou essa métrica para este perfil.";
  return `Meta: ${msg}`;
}

// Segundos de início/fim do dia no fuso de Brasília (UTC-3). O Instagram aceita no máximo 30 dias por consulta.
function janelaIG(intervalo) {
  const ini = Date.parse(intervalo.since + "T03:00:00Z") / 1000;
  const fim = Date.parse(intervalo.until + "T03:00:00Z") / 1000 + 86400;
  return { since: Math.max(ini, fim - 30 * 86400), until: fim };
}

async function perfisInstagram(env, ctx) {
  const { contas: lista } = await comCache(ctx, "contas", () => contas(env));
  const ativas = lista.filter((c) => c.ativa);
  const liga = await loteBruto(env, ativas.map((c) => rel(`${c.id}/instagram_accounts`, { fields: "id,username", limit: "25" })));
  const porPerfil = {}, erros = [];
  ativas.forEach((c, i) => {
    const r = liga[i];
    if (r.erro) { erros.push({ contaId: c.id, conta: c.nome, erro: r.erro, codigo: r.codigo }); return; }
    for (const x of (r.corpo.data || [])) (porPerfil[x.id] = porPerfil[x.id] || { id: x.id, contas: [] }).contas.push({ id: c.id, nome: c.nome });
  });
  const ids = Object.keys(porPerfil);
  const comPerfil = new Set(Object.values(porPerfil).flatMap((x) => x.contas.map((c) => c.id)));
  const semPerfil = ativas.filter((c) => !comPerfil.has(c.id) && !erros.some((e) => e.contaId === c.id)).map((c) => ({ id: c.id, nome: c.nome }));
  const dets = await loteBruto(env, ids.map((id) => rel(id, { fields: IG_PERFIL })));
  const perfis = ids.map((id, i) => {
    const d = dets[i];
    if (d.erro) return { id, usuario: null, nome: null, erro: d.erro, contas: porPerfil[id].contas };
    const b = d.corpo;
    return { id, usuario: b.username || null, nome: b.name || b.username || null, foto: b.profile_picture_url || null, seguidores: num(b.followers_count), seguindo: num(b.follows_count), posts: num(b.media_count), contas: porPerfil[id].contas };
  });
  return { perfis, erros, semPerfil };
}

// Totais do período para vários perfis de uma vez; se o Meta recusar alguma métrica, tenta uma por uma.
async function totaisIG(env, perfis, janela) {
  const base = { period: "day", metric_type: "total_value", since: String(janela.since), until: String(janela.until) };
  const r = await loteBruto(env, perfis.map((p) => rel(`${p.id}/insights`, { ...base, metric: IG_TOTAIS.join(",") })));
  const saida = [];
  for (let i = 0; i < perfis.length; i++) {
    let dados = r[i].corpo && r[i].corpo.data, erro = r[i].erro || null;
    if (!dados) {
      const un = await loteBruto(env, IG_TOTAIS.map((m) => rel(`${perfis[i].id}/insights`, { ...base, metric: m })));
      dados = un.flatMap((x) => (x.corpo && x.corpo.data) || []);
      erro = dados.length ? null : (un[0].erro || erro);
    }
    const t = {}; for (const m of dados) t[m.name] = num(m.total_value && m.total_value.value);
    saida.push(erro ? { erro } : montarTotais(t));
  }
  return saida;
}
function montarTotais(t) {
  return {
    alcance: t.reach || 0, visualizacoes: t.views || 0, visitasPerfil: t.profile_views || 0, contasEngajadas: t.accounts_engaged || 0, interacoes: t.total_interactions || 0,
    taxaEngajamento: t.reach ? (t.total_interactions || 0) / t.reach * 100 : null,
  };
}

async function instagramGeral(env, ctx, periodo) {
  const r = intervalos(periodo);
  const { perfis, erros, semPerfil } = await comCache(ctx, "igperfis", () => perfisInstagram(env, ctx));
  const ok = perfis.filter((p) => !p.erro);
  const [atual, anterior] = ok.length ? await Promise.all([totaisIG(env, ok, janelaIG(r.atual)), totaisIG(env, ok, janelaIG(r.anterior))]) : [[], []];
  const resultado = perfis.map((p) => {
    const i = ok.indexOf(p);
    if (i < 0) return p;
    const a = atual[i], b = anterior[i];
    return { ...p, ...(a.erro ? { erro: a.erro } : { totais: a }), anterior: b && !b.erro ? b : null };
  });
  const faltaPermissao = (resultado.length && resultado.every((p) => p.erro && /permiss/i.test(p.erro))) || (!perfis.length && erros.length && erros.every((e) => /permiss/i.test(e.erro)));
  return { atualizado: new Date().toISOString(), periodo, intervalo: r, perfis: resultado, semPerfil, erros: faltaPermissao ? [] : erros.slice(0, 5), faltaPermissao: !!faltaPermissao };
}
function instagramDoCliente(g, ids) {
  const perfis = g.perfis.filter((p) => p.contas.some((c) => ids.includes(c.id))).map((p) => ({ ...p, contas: p.contas.filter((c) => ids.includes(c.id)) }));
  return { ...g, perfis, erros: [], semPerfil: (g.semPerfil || []).filter((c) => ids.includes(c.id)) };
}

async function instagramPerfil(env, perfil, periodo) {
  const r = intervalos(periodo), j = janelaIG(r.atual);
  const fim = j.until;
  const dia = { period: "day", since: String(j.since), until: String(j.until) };
  const [serie, novos, midiaResp] = await Promise.all([
    loteBruto(env, [rel(`${perfil.id}/insights`, { ...dia, metric: "reach" })]),
    loteBruto(env, [rel(`${perfil.id}/insights`, { ...dia, metric: "follower_count" })]),
    pegar(env, `${perfil.id}/media`, { fields: "id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count", limit: "50" }).catch((e) => ({ erro: e.message })),
  ]);
  const valores = (x) => ((x.corpo && x.corpo.data && x.corpo.data[0] && x.corpo.data[0].values) || []);
  const diario = valores(serie[0]).map((v) => ({ dia: String(v.end_time).slice(0, 10), alcance: num(v.value) }));
  const seguidoresNovos = novos[0].erro ? null : valores(novos[0]).reduce((s, v) => s + num(v.value), 0);
  const seguidoresDia = valores(novos[0]).map((v) => ({ dia: String(v.end_time).slice(0, 10), novos: num(v.value) }));

  let posts = [], aviso = null;
  if (midiaResp.erro) aviso = "Não foi possível ler os posts: " + midiaResp.erro;
  else {
    const noPeriodo = (midiaResp.data || []).filter((m) => { const t = Date.parse(m.timestamp) / 1000; return t >= j.since && t < fim; }).slice(0, 30);
    const ins = await loteBruto(env, noPeriodo.map((m) => rel(`${m.id}/insights`, { metric: "reach,saves,shares,total_interactions,views" })));
    const reler = noPeriodo.map((m, i) => ins[i].erro ? i : -1).filter((i) => i >= 0);
    const ins2 = reler.length ? await loteBruto(env, reler.map((i) => rel(`${noPeriodo[i].id}/insights`, { metric: "reach,total_interactions" }))) : [];
    reler.forEach((i, k) => { ins[i] = ins2[k]; });
    posts = noPeriodo.map((m, i) => {
      const t = {}; for (const x of ((ins[i].corpo && ins[i].corpo.data) || [])) t[x.name] = num(x.values && x.values[0] && x.values[0].value);
      const formato = m.media_product_type === "REELS" ? "Reels" : (FORMATOS[m.media_type] || "Feed");
      const inter = t.total_interactions != null ? t.total_interactions : num(m.like_count) + num(m.comments_count);
      return {
        id: m.id, legenda: (m.caption || "").slice(0, 160), formato, link: m.permalink, miniatura: m.thumbnail_url || (m.media_type === "IMAGE" ? m.media_url : null) || null, publicado: m.timestamp,
        alcance: t.reach || 0, visualizacoes: t.views || 0, curtidas: num(m.like_count), comentarios: num(m.comments_count), salvamentos: t.saves || 0, compartilhamentos: t.shares || 0, interacoes: inter,
        taxaEngajamento: t.reach ? inter / t.reach * 100 : null,
      };
    }).sort((a, b) => b.interacoes - a.interacoes);
  }
  const [totais] = await totaisIG(env, [perfil], j);
  const anterior = perfil.anterior || null;
  return {
    atualizado: new Date().toISOString(), periodo, intervalo: r, perfil: { id: perfil.id, usuario: perfil.usuario, nome: perfil.nome, foto: perfil.foto, seguidores: perfil.seguidores, seguindo: perfil.seguindo, posts: perfil.posts, contas: perfil.contas },
    totais: totais.erro ? null : totais, erroTotais: totais.erro || null, anterior, seguidoresNovos, seguidoresDia, diario, posts, aviso,
    ideias: ideiasInstagram({ posts, totais: totais.erro ? null : totais, anterior, dias: r.dias, seguidoresNovos }),
  };
}

// Ideias de conteúdo da YA a partir dos próprios números do perfil. Só sugere: nada é publicado.
function ideiasInstagram({ posts, totais, anterior, dias, seguidoresNovos }) {
  const ideias = [], media = (l, f) => l.length ? l.reduce((s, x) => s + f(x), 0) / l.length : 0;
  const arred = (v) => Math.round(v).toLocaleString("pt-BR");
  if (!posts.length) {
    ideias.push({ nivel: "alto", titulo: "Nenhum post no período", motivo: "O perfil não publicou neste período, então o alcance depende só do que já está no ar.",
      passos: ["Definir 3 posts por semana para as próximas 2 semanas.", "Começar com 1 Reels, 1 carrossel e 1 foto ou bastidor.", "Combinar com o cliente os dias e os horários de publicação."] });
    return ideias;
  }
  // 1. melhor formato
  const porFormato = {};
  for (const p of posts) (porFormato[p.formato] = porFormato[p.formato] || []).push(p);
  const formatos = Object.entries(porFormato).map(([nome, l]) => ({ nome, n: l.length, alcance: media(l, (x) => x.alcance), inter: media(l, (x) => x.interacoes) })).sort((a, b) => b.alcance - a.alcance);
  if (formatos.length > 1 && formatos[0].n >= 2 && formatos[0].alcance > formatos[1].alcance * 1.3) {
    ideias.push({ nivel: "medio", titulo: `${formatos[0].nome} alcança mais gente neste perfil`, motivo: `Cada ${formatos[0].nome.toLowerCase()} alcançou em média ${arred(formatos[0].alcance)} pessoas, contra ${arred(formatos[1].alcance)} de ${formatos[1].nome.toLowerCase()}.`,
      passos: [`Aumentar a quantidade de ${formatos[0].nome.toLowerCase()} na próxima semana.`, "Manter 1 post de outro formato para não perder variedade.", "Comparar o alcance de novo daqui a 2 semanas."] });
  }
  // 2. melhor dia e horário (Brasília)
  if (posts.length >= 6) {
    const dias7 = {}, horas = {};
    for (const p of posts) { const d = new Date(Date.parse(p.publicado) - 3 * 3600e3); (dias7[d.getUTCDay()] = dias7[d.getUTCDay()] || []).push(p); const h = d.getUTCHours(); (horas[h] = horas[h] || []).push(p); }
    const melhorDia = Object.entries(dias7).filter(([, l]) => l.length >= 2).map(([d, l]) => ({ d: Number(d), inter: media(l, (x) => x.interacoes) })).sort((a, b) => b.inter - a.inter)[0];
    const melhorHora = Object.entries(horas).filter(([, l]) => l.length >= 2).map(([h, l]) => ({ h: Number(h), inter: media(l, (x) => x.interacoes) })).sort((a, b) => b.inter - a.inter)[0];
    if (melhorDia && melhorHora) ideias.push({ nivel: "baixo", titulo: `Melhor momento para postar: ${DIAS_SEMANA[melhorDia.d]}, por volta das ${melhorHora.h}h`, motivo: "Os posts desse dia e horário tiveram mais interações em média no período.",
      passos: [`Agendar o próximo post importante para ${DIAS_SEMANA[melhorDia.d]} perto das ${melhorHora.h}h.`, "Testar mais um horário na semana seguinte para confirmar."] });
  }
  // 3. repetir o melhor post
  const top = posts[0];
  if (top && top.interacoes > 0) ideias.push({ nivel: "medio", titulo: "Repetir o tema do post que mais funcionou", motivo: `O post “${(top.legenda || "sem legenda").slice(0, 70)}” teve ${arred(top.interacoes)} interações e alcançou ${arred(top.alcance)} pessoas.`,
    passos: ["Fazer uma continuação do mesmo assunto, com outro ângulo.", "Reaproveitar o gancho da primeira frase da legenda.", "Chamar a ação que mais funcionou (comentar, salvar ou enviar para alguém)."] });
  // 4. salvamentos e compartilhamentos
  const salv = posts.reduce((s, p) => s + p.salvamentos, 0), comp = posts.reduce((s, p) => s + p.compartilhamentos, 0), alc = posts.reduce((s, p) => s + p.alcance, 0);
  if (alc > 0 && (salv + comp) / alc > 0.03) ideias.push({ nivel: "baixo", titulo: "O público salva e compartilha: faça mais conteúdo útil", motivo: `${arred(salv)} salvamentos e ${arred(comp)} compartilhamentos mostram que o conteúdo está sendo guardado e repassado.`,
    passos: ["Produzir mais dicas, passo a passo e listas.", "Terminar o post pedindo para salvar ou enviar a alguém."] });
  // 5. queda de alcance
  if (anterior && anterior.alcance > 100 && totais && totais.alcance < anterior.alcance * 0.8) ideias.push({ nivel: "alto", titulo: "O alcance do perfil caiu", motivo: `Caiu ${Math.round((1 - totais.alcance / anterior.alcance) * 100)}% em relação ao período anterior (${arred(totais.alcance)} contra ${arred(anterior.alcance)} pessoas).`,
    passos: ["Conferir se a frequência de posts diminuiu.", "Publicar mais Reels nesta semana.", "Revisar os horários e testar os de melhor resultado."] });
  // 6. frequência
  const porSemana = posts.length / Math.max(1, dias / 7);
  if (porSemana < 2) ideias.push({ nivel: "medio", titulo: "Poucos posts por semana", motivo: `Foram ${posts.length} post${posts.length > 1 ? "s" : ""} em ${dias} dias (cerca de ${porSemana.toFixed(1).replace(".", ",")} por semana).`,
    passos: ["Subir para pelo menos 3 posts por semana.", "Montar um calendário simples de 2 semanas com os temas."] });
  // 7. seguidores
  if (seguidoresNovos != null && seguidoresNovos < 0) ideias.push({ nivel: "medio", titulo: "O perfil perdeu seguidores no período", motivo: `Saldo de ${arred(seguidoresNovos)} seguidores. Pode ser sinal de conteúdo fora do que o público espera.`,
    passos: ["Rever os últimos posts antes da queda.", "Fazer 1 post de enquete ou pergunta para entender o que o público quer ver."] });
  const peso = { alto: 0, medio: 1, baixo: 2 };
  return ideias.sort((a, b) => peso[a.nivel] - peso[b.nivel]);
}

// ---------------------------------------------------------------- usuários e sessões
// Senha guardada só como PBKDF2-SHA256 (100 mil voltas, sal próprio). Sessão: token aleatório de 30 dias.
// Trocar a senha, bloquear ou apagar o usuário derruba as sessões dele na hora (campo "versao").
const PAPEIS = { admin: "Administrador", equipe: "Equipe YAMB", cliente: "Cliente" };
const DIAS_SESSAO = 30;
const TENTATIVAS = 8; // erros seguidos por usuário antes de esperar 15 min
const limpaLogin = (l) => String(l || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const aleatorio = (n) => crypto.getRandomValues(new Uint8Array(n));
const publico = (u) => ({ login: u.login, nome: u.nome, papel: u.papel, contas: u.papel === "cliente" ? u.contas : null });

async function hashSenha(senha, sal) {
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: 100000 }, chave, 256);
  return new Uint8Array(bits);
}
async function senhaConfere(senha, u) {
  const sal = Uint8Array.from(atob(u.sal), (c) => c.charCodeAt(0));
  const a = await hashSenha(senha, sal), b = Uint8Array.from(atob(u.hash), (c) => c.charCodeAt(0));
  return a.length === b.length && crypto.subtle.timingSafeEqual(a, b);
}

async function entrar(env, request, corpo) {
  const login = limpaLogin(corpo.usuario), senha = String(corpo.senha || "");
  if (!login || !senha) return { erro: "Digite usuário e senha." };
  const kvT = "tent:" + login, erros = Number(await env.YAMB_TRAFEGO.get(kvT)) || 0;
  if (erros >= TENTATIVAS) return { erro: "Muitas tentativas erradas. Espere 15 minutos.", status: 429 };
  let u = null;
  if (login === "admin") {
    // Chave mestra do dono (segredo PAINEL_SENHA), para criar os primeiros acessos.
    if (await senhaOk(senha, env.PAINEL_SENHA)) u = { login: "admin", nome: "Administrador", papel: "admin", versao: 0, ativo: true };
  } else {
    const salvo = await env.YAMB_TRAFEGO.get("usr:" + login, "json");
    if (salvo && salvo.ativo && (await senhaConfere(senha, salvo))) u = salvo;
  }
  if (!u) {
    await env.YAMB_TRAFEGO.put(kvT, String(erros + 1), { expirationTtl: 900 });
    return { erro: "Usuário ou senha incorretos." };
  }
  await env.YAMB_TRAFEGO.delete(kvT);
  const token = [...aleatorio(32)].map((b) => b.toString(16).padStart(2, "0")).join("");
  await env.YAMB_TRAFEGO.put("ses:" + (await hashCurto(token)), JSON.stringify({ login: u.login, versao: u.versao || 0, em: new Date().toISOString() }), { expirationTtl: DIAS_SESSAO * 86400 });
  return { token, usuario: publico(u) };
}

async function sessao(env, request) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const s = await env.YAMB_TRAFEGO.get("ses:" + (await hashCurto(token)), "json");
  if (!s) return null;
  if (s.login === "admin") return { login: "admin", nome: "Administrador", papel: "admin", contas: [] };
  const u = await env.YAMB_TRAFEGO.get("usr:" + s.login, "json");
  if (!u || !u.ativo || (u.versao || 0) !== s.versao) return null;
  return { ...u, contas: u.contas || [] };
}

async function sairSessao(env, request) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (/^[0-9a-f]{64}$/.test(token)) await env.YAMB_TRAFEGO.delete("ses:" + (await hashCurto(token)));
  return { ok: true };
}

async function listarAcessos(env, ctx) {
  const l = await env.YAMB_TRAFEGO.list({ prefix: "usr:" });
  const usuarios = (await Promise.all(l.keys.map((k) => env.YAMB_TRAFEGO.get(k.name, "json")))).filter(Boolean)
    .map((u) => ({ ...publico(u), contas: u.contas || [], ativo: u.ativo, criadoEm: u.criadoEm, alteradoEm: u.alteradoEm, alteradoPor: u.alteradoPor }))
    .sort((a, b) => a.papel.localeCompare(b.papel) || a.nome.localeCompare(b.nome));
  const { contas: lista } = await comCache(ctx, "contas", () => contas(env));
  return { usuarios, contas: lista.map((c) => ({ id: c.id, nome: c.nome, ativa: c.ativa })), papeis: PAPEIS };
}

async function salvarAcesso(env, quem, corpo) {
  const login = limpaLogin(corpo.login);
  if (login.length < 3 || login === "admin") return { erro: "Usuário inválido (mínimo 3 letras; use letras, números, ponto ou traço)." };
  const nome = limpaAutor(corpo.nome);
  if (!nome) return { erro: "Escreva o nome." };
  if (!PAPEIS[corpo.papel]) return { erro: "Tipo de acesso inválido." };
  const atual = await env.YAMB_TRAFEGO.get("usr:" + login, "json");
  if (corpo.novo && atual) return { erro: "Já existe um usuário com esse nome." };
  const contasEscolhidas = corpo.papel === "cliente" ? [...new Set((corpo.contas || []).map(String).filter((c) => /^act_\d+$/.test(c)))] : [];
  if (corpo.papel === "cliente" && !contasEscolhidas.length) return { erro: "Escolha pelo menos uma conta de anúncio para o cliente." };
  const senha = corpo.senha == null ? "" : String(corpo.senha);
  if (!atual && !senha) return { erro: "Defina a senha do usuário novo." };
  if (senha && senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  const u = atual || { login, criadoEm: new Date().toISOString(), versao: 0 };
  const ativo = corpo.ativo !== false;
  // Trocar senha, papel ou contas, ou bloquear, encerra as sessões abertas desse usuário.
  const derruba = !!senha || (atual && (atual.papel !== corpo.papel || String(atual.contas) !== String(contasEscolhidas) || (atual.ativo && !ativo)));
  Object.assign(u, { nome, papel: corpo.papel, contas: contasEscolhidas, ativo, alteradoEm: new Date().toISOString(), alteradoPor: quem.nome });
  if (senha) { const sal = aleatorio(16); u.sal = b64(sal); u.hash = b64(await hashSenha(senha, sal)); }
  if (derruba && atual) u.versao = (u.versao || 0) + 1;
  await env.YAMB_TRAFEGO.put("usr:" + login, JSON.stringify(u));
  await registrar(env, { estado: "ajustes", autor: quem.nome, sugestao: { titulo: `${atual ? "Acesso alterado" : "Acesso criado"}: ${nome} (${PAPEIS[u.papel]})${senha && atual ? ", senha trocada" : ""}${!ativo ? ", bloqueado" : ""}` } });
  return { ok: true, usuario: publico(u) };
}

async function removerAcesso(env, quem, corpo) {
  const login = limpaLogin(corpo.login);
  const atual = await env.YAMB_TRAFEGO.get("usr:" + login, "json");
  if (!atual) return { erro: "Usuário não encontrado." };
  await env.YAMB_TRAFEGO.delete("usr:" + login);
  await registrar(env, { estado: "ajustes", autor: quem.nome, sugestao: { titulo: `Acesso apagado: ${atual.nome}` } });
  return { ok: true };
}

// O cliente vê os números das contas dele, sem a análise interna da YA (alertas, nota de saúde).
function semAnalise(d) {
  const tira = (l) => (l || []).map((x) => ({ ...x, alertas: [] }));
  return { ...d, podeEditar: false, campanhas: tira(d.campanhas), conjuntos: tira(d.conjuntos), anuncios: tira(d.anuncios), saude: null };
}
function painelDoCliente(g, ids) {
  const porConta = g.contas.filter((c) => ids.includes(c.id)).map((c) => ({ ...semAnalise(c), saude: null }));
  const campanhas = porConta.flatMap((c) => c.campanhas);
  return {
    ...g, contas: porConta, contasInativas: (g.contasInativas || []).filter((c) => ids.includes(c.id)),
    totais: somar(campanhas), anterior: somarMetricas(porConta.map((c) => c.anterior).filter(Boolean)),
    categorias: agrupar(campanhas, (k) => k.categoria), plataformas: juntarPlataformas(porConta.flatMap((c) => c.plataformas)),
  };
}

// ---------------------------------------------------------------- utilidades

// Dados do Meta guardados por até 5 minutos: o Meta atualiza o desempenho com ~15 min de atraso,
// e consultar mais vezes só gasta o limite de chamadas do app.
const CACHE_SEGUNDOS = 300;
async function comCache(ctx, chave, fn) {
  const cache = caches.default;
  const req = new Request(`https://cache.yamb-trafego/${encodeURIComponent(chave)}`);
  const hit = await cache.match(req);
  if (hit) return hit.json();
  const dados = await fn();
  ctx.waitUntil(cache.put(req, new Response(JSON.stringify(dados), { headers: { "Cache-Control": "max-age=" + CACHE_SEGUNDOS } })));
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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
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
