/* Motor de gravação do interno novo — MESMA regra do interno antigo (e do app do celular):
   1. lê a planilha;  2. junta registro a registro: em cada um, vence o que tem o _u (hora da mudança) mais novo;
   3. grava tudo de volta ({data}).  Assim uma mudança feita no celular não apaga a feita no computador, e vice-versa.
   Também aplica as mesmas normalizações que o antigo grava (status antigos, apelidos de clientes, lista fixa de clientes).
   Aqui a "planilha" é a planilha da equipe. */
(() => {
  const URL_DADOS = window.Y && Y.SHEET;
  const CLIENTS = ['AMELYS', 'CLÍNICA CAE', 'DANI NUTRI', 'EDNA', 'EU GOSTO SEX SHOP', 'LITO LAVANDERIA'];
  // a lista completa vem do interno antigo (data.js); completada na primeira leitura com os clientes de planos
  const ALIAS = { 'THAIANE FONSECA': 'THAIANE', 'ERIKA OLIVEIRA': 'ERICA OLIVEIRA', 'VIVI QUENDEIRA': 'VIVI KENDERA', 'DANI REIS': 'DANY REIS', 'EU GOSTO SEXSHOP': 'EU GOSTO SEX SHOP' };
  const NOMES = { vitoria: 'Vitória Almeida', gabriel: 'Gabriel Santos', yasmim: 'Yasmim Bárbara', anny: 'Anny Vitória', brisa: 'Brisa França', marcus: 'Marcus Fontes', camille: 'Camille e Danylo', yngra: 'Yngra Lyriel', vitor: 'Vitor Nascimento' };
  const NOTIF_BY_STATUS = { 'Pendente': 'Material voltou para Pendente', 'Produção': 'Material em produção', 'Pronto': 'Material pronto', 'Enviado': 'Material enviado para avaliação', 'Ajustar': 'Material em ajuste', 'Aprovado': 'Material aprovado · liberado', 'Não postado': 'Material não postado', 'Postado': 'Material postado' };

  const normStatus = (s) => ({ 'Em produção': 'Produção', 'Ajustes': 'Ajustar', 'Postagem': 'Postado', 'Aguardando aprovação': 'Enviado', 'Finalizado': 'Postado' })[s] || s;
  const statusDe = (i) => { const s = normStatus(i.status); return s === 'Produção' && i.nota ? 'Ajustar' : s; };
  const normCliente = (c) => { const u = String(c || '').trim().toUpperCase(); return ALIAS[u] || u; };
  let clientes = CLIENTS.slice();
  function normClientes(db) {
    if (!db || !db.items) return db;
    const fix = (l, base) => { const m = new Map(); (l || []).forEach((x) => { const c = normCliente(x.cliente); if (clientes.includes(c) && !m.has(c)) m.set(c, x.cliente === c ? x : { ...x, cliente: c }); }); return clientes.map((c) => m.get(c) || base(c)); };
    const items = db.items.map((i) => { const c = normCliente(i.cliente); return c === i.cliente ? i : { ...i, cliente: c }; });
    const out = { ...db, items, planos: fix(db.planos, (c) => ({ cliente: c, status: 'Sem planejamento', periodo: '', responsavel: '', trello: '' })) };
    if (db.stories) out.stories = fix(db.stories, (c) => ({ cliente: c, dias: [], fixo: '' }));
    if (db.storiesFeitos) out.storiesFeitos = db.storiesFeitos.map((f) => { const [c, ...r] = String(f.id).split('|'); const n = normCliente(c); return n === c ? f : { ...f, id: [n, ...r].join('|') }; });
    return JSON.stringify(out) === JSON.stringify(db) ? db : out;
  }
  const normDb0 = (d) => d && d.items && d.items.some((i) => statusDe(i) !== i.status) ? { ...d, items: d.items.map((i) => { const s = statusDe(i); return s === i.status ? i : { ...i, status: s }; }) } : d;
  const normDb = (d) => normClientes(normDb0(d));

  // mesma junção do interno antigo
  const mergeList = (l, r, key) => {
    const m = new Map();
    (r || []).forEach((x) => m.set(x[key], x));
    (l || []).forEach((x) => { const o = m.get(x[key]); if (!o || (x._u || 0) > (o._u || 0)) m.set(x[key], x); });
    const order = [], seen = new Set();
    [...(l || []), ...(r || [])].forEach((x) => { if (!seen.has(x[key])) { seen.add(x[key]); order.push(m.get(x[key])); } });
    return order;
  };
  const merge = (l, r) => {
    if (!r || !r.items) return l;
    if (!l || !l.items) return normDb(r);
    const notifs = mergeList(l.notifs, r.notifs, 'id').sort((a, b) => (parseFloat(String(b.id).slice(1)) || 0) - (parseFloat(String(a.id).slice(1)) || 0)).slice(0, 30);
    return normDb({ ...r, items: mergeList(l.items, r.items, 'id'), planos: mergeList(l.planos, r.planos, 'cliente'), stories: mergeList(l.stories || [], r.stories || [], 'cliente'),
      storiesFeitos: mergeList(l.storiesFeitos || [], r.storiesFeitos || [], 'id'), avaliacoes: mergeList(l.avaliacoes || [], r.avaliacoes || [], 'id'), pagosVideos: mergeList(l.pagosVideos || [], r.pagosVideos || [], 'id'), notifs });
  };
  const strip = (x) => JSON.stringify({ ...x, _u: undefined });
  // marca _u em todo registro que mudou (igual ao "stamp" do antigo)
  function stamp(cur, prev, key) {
    const pm = {}; (prev || []).forEach((x) => { pm[x[key]] = x; });
    const now = Date.now();
    (cur || []).forEach((x) => { const p = pm[x[key]]; if (!p || strip(p) !== strip(x)) x._u = now; });
  }
  const copia = (o) => JSON.parse(JSON.stringify(o));

  let cru = null, rev = 0, sujo = false, gravando = false, ouvintes = [], estado = 'ok', tentar = null;
  const avisa = () => ouvintes.forEach((f) => { try { f(estado); } catch (e) {} });
  const muda = (e) => { estado = e; avisa(); };

  async function lerRemoto() { const r = await fetch(URL_DADOS + '?t=' + Date.now(), { cache: 'no-store' }); const j = await r.json(); return j; }

  async function ler() {
    const j = await lerRemoto();
    const d = j && j.data;
    if (d && Array.isArray(d.planos) && d.planos.length) clientes = d.planos.map((p) => normCliente(p.cliente)).filter((c, k, a) => a.indexOf(c) === k);
    if (!gravando && !sujo) { cru = normDb(d); rev = j.rev || rev; }
    else if (d) cru = merge(cru, d); // há mudança local ainda não gravada: junta sem perder nada
    return copia(cru);
  }

  async function gravar() {
    if (gravando) { sujo = true; return; }
    gravando = true; sujo = false; muda('salvando');
    try {
      const j = await lerRemoto();
      const junto = merge(cru, j && j.data);
      // trava de segurança: nunca gravar algo menor que o que já está na planilha (a junção só soma)
      const rem = (j && j.data) || {};
      if (!junto || !Array.isArray(junto.items) || junto.items.length < (rem.items || []).length || (junto.planos || []).length < (rem.planos || []).length || (junto.storiesFeitos || []).length < (rem.storiesFeitos || []).length)
        throw new Error('gravação barrada pela trava de segurança');
      cru = junto;
      const r = await fetch(URL_DADOS, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ data: junto }) });
      const o = await r.json();
      if (!o || !o.rev) throw new Error(o && o.erro || 'sem resposta');
      rev = o.rev; muda('ok');
    } catch (e) {
      sujo = true; muda('erro');
    } finally {
      gravando = false;
      if (sujo) { clearTimeout(tentar); tentar = setTimeout(gravar, estado === 'erro' ? 4000 : 300); }
      window.dispatchEvent(new CustomEvent('grava:salvo', { detail: copia(cru) }));
    }
  }

  // aplica uma mudança local e grava (fn recebe o banco cru e altera o que precisar)
  function mudar(fn) {
    if (!cru) throw new Error('dados ainda não carregados');
    const antes = copia(cru);
    fn(cru);
    stamp(cru.items, antes.items, 'id'); stamp(cru.planos, antes.planos, 'cliente'); stamp(cru.stories, antes.stories, 'cliente');
    stamp(cru.storiesFeitos, antes.storiesFeitos, 'id'); stamp(cru.avaliacoes, antes.avaliacoes, 'id'); stamp(cru.pagosVideos, antes.pagosVideos, 'id');
    sujo = true; // mudança local pendente: a releitura automática junta em vez de substituir
    window.dispatchEvent(new CustomEvent('grava:mudou', { detail: copia(cru) }));
    clearTimeout(tentar); tentar = setTimeout(gravar, 300);
    return new Promise((res) => { const f = (e) => { if (e !== 'salvando') { ouvintes = ouvintes.filter((x) => x !== f); res(e === 'ok'); } }; ouvintes.push(f); });
  }

  // id no mesmo formato das notificações que sobrevivem na lista (n + hora + número aleatório).
  // Com só "n + hora" a notificação cai para o fim da lista e é cortada ao gravar (acontece no interno antigo).
  const idNotif = () => 'n' + Date.now() + Math.random();
  const tsCurto = () => new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const stampHist = (i, to, by) => ({ ...(i.historico || {}), [to]: { em: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·'), por: by || '', ts: Date.now() } });

  // mover etapa — igual ao advance0 do interno antigo
  function moverEtapa(id, to, quem, extra) {
    return mudar((d) => {
      const i = d.items.find((x) => x.id === id); if (!i) throw new Error('demanda não encontrada');
      i.status = to; i.nota = to === 'Ajustar' ? i.nota : ''; i.historico = stampHist(i, to, quem);
      if (to === 'Postado') { delete i.adiadoDe; delete i.adiado; }
      if (to === 'Aprovado') i.aprovacao = { data: new Date().toLocaleDateString('pt-BR'), por: (extra && extra.por) || '—', obs: (extra && extra.obs) || '' };
      if (NOTIF_BY_STATUS[to]) d.notifs = [{ id: idNotif(), to: ['geral'], kind: NOTIF_BY_STATUS[to], by: quem, text: i.tipo + ' de ' + i.cliente + ' — ' + i.titulo + ' · por ' + (NOMES[quem] || quem), ts: tsCurto() }, ...(d.notifs || [])].slice(0, 30);
    });
  }

  // mesmas ações do interno antigo (data.js · yambAcoesDe): muda a demanda e, quando é o caso, cria a notificação
  function upd(id, fn, kind, txt, quem) {
    return mudar((d) => {
      const k = d.items.findIndex((i) => i.id === id); if (k < 0) throw new Error('demanda não encontrada');
      d.items[k] = fn(d.items[k]); const it = d.items[k];
      if (kind) d.notifs = [{ id: idNotif(), to: ['geral'], kind, by: quem, text: it.tipo + ' de ' + it.cliente + ' — ' + it.titulo + txt(it) + ' · por ' + (NOMES[quem] || quem), ts: tsCurto() }, ...(d.notifs || [])].slice(0, 30);
    });
  }
  // pedir ajuste — igual ao setAjuste do antigo (vai para Ajustar com o motivo; notificação "Solicitação de ajuste")
  function pedirAjuste(id, motivo, quem) {
    return mudar((d) => {
      const i = d.items.find((x) => x.id === id); if (!i) throw new Error('demanda não encontrada');
      i.status = 'Ajustar'; i.nota = motivo; i.historico = stampHist(i, 'Ajustar', quem);
      d.notifs = [{ id: idNotif(), to: ['geral'], kind: 'Solicitação de ajuste', by: quem, text: i.cliente + ' — ' + motivo + ' · por ' + (NOMES[quem] || quem), ts: tsCurto() }, ...(d.notifs || [])].slice(0, 30);
    });
  }
  // checklist — igual ao toggleCheck do antigo (cada item marcado/desmarcado grava na hora)
  const marcarChecklist = (id, k) => mudar((d) => {
    const i = d.items.find((x) => x.id === id); if (!i) throw new Error('demanda não encontrada');
    const l = i.checklist || []; i.checklist = l.includes(k) ? l.filter((x) => x !== k) : [...l, k];
  });
  // não postado — igual ao antigo: vai para "Não postado" com {motivo, desde, por} e o motivo entra no texto da notificação
  function naoPostado(id, motivo, quem) {
    motivo = String(motivo || '').trim() || 'Sem motivo informado';
    return mudar((d) => {
      const i = d.items.find((x) => x.id === id); if (!i) throw new Error('demanda não encontrada');
      i.status = 'Não postado'; i.nota = ''; i.historico = stampHist(i, 'Não postado', quem);
      i.naoPostado = { motivo, desde: Date.now(), por: quem };
      d.notifs = [{ id: idNotif(), to: ['geral'], kind: NOTIF_BY_STATUS['Não postado'], by: quem, text: i.tipo + ' de ' + i.cliente + ' — ' + i.titulo + ' · por ' + (NOMES[quem] || quem) + ' · motivo: ' + motivo, ts: tsCurto() }, ...(d.notifs || [])].slice(0, 30);
    });
  }
  // cadastrar — igual ao addItem do antigo (entra em Pendente, social = Brisa, notificação "Nova demanda cadastrada")
  const PAD = { design: 'marcus', video: 'camille' }, PODE = { design: ['gabriel', 'marcus'], video: ['vitoria', 'gabriel', 'yasmim', 'camille'] };
  const produtorDe = (t) => (t === 'Vídeo' || t === 'Reels') ? 'video' : 'design';
  const produtorPara = (tipo, id) => { const r = produtorDe(tipo); return PODE[r].includes(id) ? id : PAD[r]; };
  function cadastrar(form, quem) {
    return mudar((d) => {
      const prod = produtorPara(form.tipo, form.produtor);
      const it = { id: 'c' + Date.now(), cliente: form.cliente, tipo: form.tipo, data: form.data, titulo: form.titulo, trello: form.trello || 'https://trello.com/c/yamb-novo', status: 'Pendente',
        produtor: prod, social: 'brisa', cadastradoPor: quem, checklist: [], aprovacao: null, nota: '', historico: stampHist({}, 'Pendente', quem) };
      if (form.tipo === 'Reels') it.capa = { precisa: form.precisaCapa !== false, pronta: false, designer: PODE.design.includes(form.capaDesigner) ? form.capaDesigner : PAD.design };
      d.items = [...d.items, it];
      d.notifs = [{ id: idNotif(), to: ['geral'], kind: 'Nova demanda cadastrada', by: quem, text: form.tipo + ' de ' + form.cliente + ' — postagem ' + form.data + ' · produção: ' + (NOMES[prod] || '—') + ' · por ' + (NOMES[quem] || quem), ts: tsCurto() }, ...(d.notifs || [])].slice(0, 30);
    });
  }
  // stories — iguais ao setStory e ao toggleFeito do antigo (id do feito: "CLIENTE|dd/mm/aaaa")
  const setStory = (cliente, patch) => mudar((d) => {
    const l = d.stories || [], cur = l.find((x) => x.cliente === cliente) || { cliente, dias: [], fixo: '' }, n = { ...cur, ...patch };
    d.stories = l.some((x) => x.cliente === cliente) ? l.map((x) => x.cliente === cliente ? n : x) : [...l, n];
  });
  const marcarStory = (id) => mudar((d) => {
    const l = d.storiesFeitos || [], cur = l.find((f) => f.id === id);
    d.storiesFeitos = cur ? l.map((f) => f.id === id ? { ...f, ok: !f.ok } : f) : [...l, { id, ok: true }];
  });
  // planejamento — igual ao setPlano
  const setPlano = (cliente, status) => mudar((d) => { d.planos = d.planos.map((p) => p.cliente === cliente ? { ...p, status } : p); });
  // pagamento dos vídeos — igual ao setPagoVideo (só a direção)
  const FIN = ['yasmim', 'gabriel', 'vitor'];
  const setPagoVideo = (mes, pago, info, quem) => {
    if (!FIN.includes(quem)) return Promise.reject(new Error('só a direção marca pagamento'));
    return mudar((d) => {
      const l = d.pagosVideos || [], n = { id: mes, pago, por: quem, em: new Date().toLocaleDateString('pt-BR'), ...(info || {}) };
      d.pagosVideos = l.some((x) => x.id === mes) ? l.map((x) => x.id === mes ? (pago ? n : { ...x, pago: false, por: quem, em: n.em }) : x) : [...l, n];
    });
  };
  // avaliação do dia — igual ao salvarAvaliacao (id "pessoa|dd/mm/aaaa")
  const salvarAvaliacao = (nota, comentario, quem) => mudar((d) => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const av = { id: quem + '|' + hoje, usuario: quem, nome: NOMES[quem] || quem, data: hoje, nota, comentario: String(comentario || '').trim(), ts: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
    const l = d.avaliacoes || []; d.avaliacoes = l.some((x) => x.id === av.id) ? l.map((x) => x.id === av.id ? av : x) : [...l, av];
  });
  // formato — igual ao setTipo
  function setTipo(id, tipo, quem) {
    return mudar((d) => {
      const i = d.items.find((x) => x.id === id); if (!i || i.tipo === tipo) return;
      const antes = i.tipo; i.tipo = tipo; i.produtor = produtorPara(tipo, i.produtor);
      d.notifs = [{ id: idNotif(), to: ['geral'], kind: 'Formato alterado', by: quem, text: i.cliente + ' — ' + i.titulo + ': ' + antes + ' → ' + tipo + ' · por ' + (NOMES[quem] || quem), ts: tsCurto() }, ...(d.notifs || [])].slice(0, 30);
    });
  }
  // aprovar — igual ao antigo: mover para Aprovado com {obs, por: nome de quem aprovou}
  const aprovar = (id, obs, quem) => moverEtapa(id, 'Aprovado', quem, { obs: String(obs || ''), por: NOMES[quem] || quem });
  const acoes = (quem) => ({
    semMaterial: (id, falta) => upd(id, (i) => ({ ...i, semMaterial: { falta: String(falta || '').trim() || 'Material não informado', desde: Date.now(), por: quem } }), 'Falta material', (i) => ': falta ' + i.semMaterial.falta, quem),
    materialRecebido: (id) => upd(id, (i) => { const n = { ...i }; delete n.semMaterial; return n; }, 'Material recebido', () => ' · pode produzir', quem),
    capaPronta: (id, ok) => upd(id, (i) => ({ ...i, capa: { ...(i.capa || {}), precisa: true, pronta: ok, por: quem, em: Date.now() } }), ok ? 'Capa pronta' : null, () => '', quem),
    precisaCapa: (id, sim) => upd(id, (i) => ({ ...i, capa: { ...(i.capa || {}), precisa: sim, pronta: false } }), null, () => '', quem),
    capaDesigner: (id, pid) => upd(id, (i) => ({ ...i, capa: { ...(i.capa || {}), precisa: true, designer: pid } }), 'Responsável pela capa alterado', () => ' · capa: ' + (NOMES[pid] || '—'), quem),
    produtor: (id, pid) => upd(id, (i) => ({ ...i, produtor: pid }), 'Responsável alterado', (i) => ' · produção: ' + (NOMES[i.produtor] || '—'), quem),
    editar: (id, patch) => { let mud = ''; const R = { cliente: 'cliente', titulo: 'conteúdo', data: 'data', hora: 'horário', trello: 'link do Trello' };
      return upd(id, (i) => { const n = { ...i, ...patch }; mud = Object.keys(R).filter((k) => (i[k] || '') !== (n[k] || '')).map((k) => R[k]).join(', '); return n; }, 'Demanda editada', () => mud ? ' · alterado: ' + mud : '', quem); },
    excluir: (id) => upd(id, (i) => ({ ...i, excluido: { por: quem, em: Date.now() } }), 'Conteúdo excluído', () => '', quem),
  });

  addEventListener('beforeunload', (e) => { if (sujo || gravando) { e.preventDefault(); e.returnValue = ''; } });
  window.Grava = { ler, mudar, cadastrar, setStory, marcarStory, setPlano, setPagoVideo, salvarAvaliacao, setTipo, moverEtapa, acoes, aprovar, pedirAjuste, marcarChecklist, naoPostado, estado: () => estado, ouvir: (f) => { ouvintes.push(f); }, rev: () => rev, _merge: merge };
})();
