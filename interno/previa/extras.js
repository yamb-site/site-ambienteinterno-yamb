/* Prévia do interno: detalhes da demanda, notificações, exportar lista, Planejamento e avaliação do dia.
   Mesmas regras do interno da equipe. Só leitura: nada aqui grava na planilha. */
(() => {
  const { $, esc, p2, parse, titulo, hoje0, somaDias, diasNaEtapa, atraso, LIMITE_DIAS, FLUXO, COR, DIAS, MESES } = Y;
  const TEAM = {
    vitoria: ['Vitória Almeida', 'vitoria-almeida', ['geral', 'indicadores', 'semana', 'stories', 'cadastro', 'video', 'aprovacao']],
    gabriel: ['Gabriel Santos', 'gabriel-santos', ['geral', 'indicadores', 'semana', 'stories', 'cadastro', 'design', 'video', 'aprovacao']],
    yasmim: ['Yasmim Bárbara', 'yasmim-barbara', ['geral', 'indicadores', 'semana', 'stories', 'cadastro', 'video', 'aprovacao']],
    anny: ['Anny Vitória', 'anny-vitoria', ['geral', 'indicadores', 'semana', 'stories', 'cadastro', 'planejamento']],
    brisa: ['Brisa França', 'brisa-franca', ['geral', 'indicadores', 'semana', 'stories', 'cadastro', 'social', 'aprovacao']],
    marcus: ['Marcus Fontes', 'marcus-fontes', ['geral', 'indicadores', 'semana', 'stories', 'cadastro', 'design']],
    camille: ['Camille e Danylo', 'camille-danylo', ['geral', 'indicadores', 'semana', 'stories', 'cadastro', 'video']],
    yngra: ['Yngra Lyriel', 'yngra-lyriel', ['geral', 'indicadores', 'semana', 'stories', 'cadastro']],
    vitor: ['Vitor Nascimento', 'vitor-nascimento', ['geral', 'indicadores', 'semana', 'stories', 'cadastro']],
  };
  const PAPEL_ = { vitoria: 'Direção de Conteúdo', gabriel: 'COO / Branding', yasmim: 'CEO / Diretora Geral', anny: 'Planejamento', brisa: 'Social Media', marcus: 'Designer Gráfico', camille: 'Edição de Vídeo', yngra: 'Secretária', vitor: 'Administrativo' };
  const nome = (id) => (TEAM[id] || [id ? titulo(id) : '—'])[0];
  const primeiro = (id) => nome(id).split(' ')[0];
  const STATUS_DESC = { 'Pendente': 'Demanda registrada, aguardando início', 'Produção': 'Material em desenvolvimento', 'Pronto': 'Material finalizado, pronto para enviar', 'Enviado': 'Encaminhado para avaliação', 'Ajustar': 'A avaliação pediu ajuste: corrigir e reenviar', 'Aprovado': 'Material liberado', 'Não postado': 'Aprovado, mas ainda não publicado', 'Postado': 'Publicado no Instagram' };
  const CHECKLIST = ['Conteúdo correto', 'Cliente correto', 'Formato correto', 'Legenda conferida', 'Informações revisadas', 'Identidade visual conferida', 'Marcação de perfis verificada', 'Data e horário da postagem confirmados', 'Aprovação do cliente registrada', 'Postagem realizada no Instagram'];
  const CHECKLIST_N = CHECKLIST.length;
  const PADRAO = { design: 'marcus', video: 'camille' };
  const produtorDe = (t) => (t === 'Vídeo' || t === 'Reels') ? 'video' : 'design';
  const produtorPara = (tipo, id) => { const r = produtorDe(tipo); return TEAM[id] && TEAM[id][2].includes(r) ? id : PADRAO[r]; };
  const precisaCapa = (i) => i.tipo === 'Reels' && ['Pendente', 'Produção', 'Pronto'].includes(i.status) && !(i.capa && i.capa.precisa === false);
  const capaDesigner = (i) => { const id = i.capa && i.capa.designer; return TEAM[id] && TEAM[id][2].includes('design') ? id : PADRAO.design; };
  const eu = () => ($('euSel') && $('euSel').value) || 'gabriel';
  const dias = (ms) => Math.max(0, Math.floor((Date.now() - ms) / 864e5));
  const plural = (n, s, p) => n + ' ' + (n === 1 ? s : p);
  const I = (p, w = 21) => '<svg width="' + w + '" height="' + w + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + p + '"/></svg>';
  let banco = null;

  /* ---------- gaveta de detalhes ---------- */
  const fundo = document.createElement('div'); fundo.className = 'gav-fundo'; fundo.hidden = true;
  const gav = document.createElement('aside'); gav.className = 'gaveta'; gav.hidden = true; gav.setAttribute('role', 'dialog'); gav.setAttribute('aria-modal', 'true'); gav.setAttribute('aria-labelledby', 'gavTit');
  document.body.append(fundo, gav);
  let voltaFoco = null;
  function fecha() { gav.hidden = true; fundo.hidden = true; document.body.classList.remove('gav-aberta'); if (voltaFoco) voltaFoco.focus(); }
  fundo.onclick = fecha;
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!gav.hidden) fecha(); fechaPops(); } });

  function abre(id, origem) {
    const i = banco && (banco.items || []).find((x) => String(x.id) === String(id));
    if (!i) return false;
    voltaFoco = origem || document.activeElement;
    const H = i.historico || {}, k = FLUXO.indexOf(i.status), d = parse(i.data), at = atraso(i);
    const pill = (t, c) => '<span class="gpill" style="--c:' + c + '">' + esc(t) + '</span>';
    const linha = (k, v) => '<div><span>' + k + '</span><b>' + v + '</b></div>';
    const avisos = [];
    if (i.aprovacao && i.aprovacao.data) avisos.push(['ok', 'Aprovado em ' + esc(i.aprovacao.data) + ' por ' + esc(i.aprovacao.por || '—') + (i.aprovacao.obs ? ' · ' + esc(i.aprovacao.obs) : '')]);
    if (i.semMaterial) avisos.push(['ruim', 'Sem material há ' + plural(dias(i.semMaterial.desde), 'dia', 'dias') + ' · Falta: ' + esc(i.semMaterial.falta || '—') + (i.semMaterial.por ? ' · avisado por ' + esc(primeiro(i.semMaterial.por)) : '')]);
    if (precisaCapa(i)) avisos.push([i.capa && i.capa.pronta ? 'ok' : 'ouro', 'Capa do Reels ' + (i.capa && i.capa.pronta ? 'pronta' : 'pendente') + ' · quem faz: ' + esc(primeiro(capaDesigner(i)))]);
    if (i.status === 'Não postado' && i.naoPostado) avisos.push(['ruim', 'Não postado há ' + plural(dias(i.naoPostado.desde), 'dia', 'dias') + ' · ' + esc(i.naoPostado.motivo || 'sem motivo') + ' · por ' + esc(primeiro(i.naoPostado.por))]);
    if (at) avisos.push(['ruim', 'Parado em ' + esc(i.status) + ' há ' + at + ' dias (limite: ' + (i.semMaterial ? LIMITE_DIAS['Sem material'] : LIMITE_DIAS[i.status]) + ').']);
    if (i.adiadoDe) avisos.push(['ruim', 'Adiado de ' + esc(String(i.adiadoDe).slice(0, 5)) + (i.adiado > 1 ? ' · ' + i.adiado + 'x' : '')]);
    if (i.nota) avisos.push(['ruim', 'Ajuste: ' + esc(i.nota)]);
    gav.innerHTML =
      '<div class="gtopo">' + pill(i.status, COR[i.status] || 'var(--ink-300)') + pill(i.tipo, 'var(--gold-300)') +
      (i.trello ? '<a class="gtrello" href="' + esc(i.trello) + '" target="_blank" rel="noopener">Abrir no Trello →</a>' : '<span class="mut" style="font-size:12px">Sem link do Trello</span>') +
      '<button class="gfecha" type="button" aria-label="Fechar detalhes">' + I('M6 6l12 12M18 6L6 18', 18) + '</button></div>' +
      '<div><div class="gcli">' + esc(titulo(i.cliente)) + '</div><h2 id="gavTit">' + esc(i.titulo || '(sem título)') + '</h2></div>' +
      '<section><h3>Etapa · <span>' + esc(STATUS_DESC[i.status] || '') + '</span></h3><div class="getapas">' +
      FLUXO.map((s, j) => { const h = H[s]; return '<div class="' + (j === k ? 'on' : h ? 'feito' : '') + '"><b>' + esc(s) + '</b><span>' + (h ? esc(String(h.em || '').replace(' · ', ' ')) : '—') + (h && h.por ? '<br>' + esc(primeiro(h.por)) : '') + '</span></div>'; }).join('') + '</div></section>' +
      '<section class="ginfo">' +
      linha('Plataforma', 'Instagram') +
      linha('Data prevista', esc(i.data || '—') + (d ? ' · ' + DIAS[d.getDay()] : '')) +
      linha('Horário', esc(i.hora || '—')) +
      linha(produtorDe(i.tipo) === 'video' ? 'Edição' : 'Design', esc(nome(produtorPara(i.tipo, i.produtor)))) +
      linha('Postagem', esc(nome(i.social))) +
      linha('Cadastrado por', esc(nome(i.cadastradoPor))) +
      linha('Checklist', (i.checklist || []).length + '/' + CHECKLIST_N) +
      linha('Na etapa há', (diasNaEtapa(i) != null ? plural(diasNaEtapa(i), 'dia', 'dias') : '—')) +
      '</section>' +
      (avisos.length ? '<section class="gavisos">' + avisos.map(([t, x]) => '<p class="' + t + '">' + x + '</p>').join('') + '</section>' : '') +
      (['Aprovado', 'Não postado', 'Postado'].includes(i.status) || (i.checklist || []).length ? '<section><h3>Checklist de postagem · <span>' + (CHECKLIST_N - (i.checklist || []).length ? 'faltam ' + plural(CHECKLIST_N - (i.checklist || []).length, 'item', 'itens') + ' na conferência' : 'tudo conferido') + '</span></h3><ul class="gchk">' + CHECKLIST.map((c, j) => { const ok = (i.checklist || []).map(Number).includes(j); return '<li class="' + (ok ? 'ok' : '') + '"><i></i>' + c + '</li>'; }).join('') + '</ul></section>' : '') +
      '<p class="gnota">Orientações completas, referências, arquivos e prazos estão no Trello. Na versão final, é aqui que se move a etapa, troca formato e responsável e marca a capa. Na prévia, só leitura.</p>';
    gav.querySelector('.gfecha').onclick = fecha;
    gav.hidden = false; fundo.hidden = false; document.body.classList.add('gav-aberta');
    gav.scrollTop = 0; gav.querySelector('.gfecha').focus();
    return true;
  }
  window.abreItem = abre;
  document.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const el = e.target.closest('[data-item]');
    if (!el || gav.contains(el)) return;
    const a = e.target.closest('a'); if (a && a !== el) return; // links internos (ex.: Abrir no Trello) seguem normais
    if (abre(el.dataset.item, el)) e.preventDefault();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest && e.target.closest('[data-item]');
    if (el && e.target === el && abre(el.dataset.item, el)) e.preventDefault();
  });
  // deixa os cartões alcançáveis pelo teclado
  new MutationObserver(() => document.querySelectorAll('[data-item]:not([tabindex]):not(a)').forEach((el) => { el.tabIndex = 0; el.setAttribute('role', 'button'); })).observe(document.body, { childList: true, subtree: true });

  /* ---------- trilho: contadores, notificações, exportar ---------- */
  // menu recolhido; abre sozinho com o mouse (ou ao navegar pelo teclado) e recolhe ao sair
  document.body.classList.add('menu-curto');
  const trilho = document.querySelector('.trilho');
  let tFecha = null;
  const abreMenu = () => { clearTimeout(tFecha); document.body.classList.add('menu-aberto'); };
  const fechaMenu = () => { clearTimeout(tFecha); tFecha = setTimeout(() => { if (!trilho.matches(':focus-within') && !trilho.querySelector('.rpop:not([hidden])')) document.body.classList.remove('menu-aberto'); }, 180); };
  trilho.addEventListener('mouseenter', abreMenu); trilho.addEventListener('mouseleave', fechaMenu);
  trilho.addEventListener('focusin', abreMenu); trilho.addEventListener('focusout', () => setTimeout(() => { if (!trilho.matches(':hover')) fechaMenu(); }, 0));

  // ---- botões do pé do menu: notificações e troca de usuário, cada um com sua janela ao lado do menu ----
  const euBox = document.querySelector('.trilho .eu');
  const extra = document.createElement('div'); extra.className = 'trilho-extra';
  extra.innerHTML = '<button class="ico" type="button" id="btNotif" aria-label="Notificações" aria-expanded="false" aria-controls="popNotif">' + I('M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 003.4 0') + '<span class="cont" id="notifN" hidden></span><span class="dica">Notificações</span></button>';
  euBox.parentNode.insertBefore(extra, euBox);
  const btEu = document.createElement('button'); btEu.type = 'button'; btEu.className = 'bt-eu'; btEu.id = 'btEu'; btEu.setAttribute('aria-expanded', 'false'); btEu.setAttribute('aria-controls', 'popEu');
  euBox.prepend(btEu); btEu.appendChild($('euFoto'));
  btEu.insertAdjacentHTML('beforeend', '<span class="eu-txt"><b id="euNome"></b><em id="euPapel"></em></span>' + I('M8 9l4-4 4 4M8 15l4 4 4-4', 15));
  const pop = document.createElement('div'); pop.className = 'rpop pop-notif'; pop.hidden = true; pop.id = 'popNotif'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Notificações');
  const popEu = document.createElement('div'); popEu.className = 'rpop pop-eu'; popEu.hidden = true; popEu.id = 'popEu'; popEu.setAttribute('role', 'dialog'); popEu.setAttribute('aria-label', 'Trocar usuário');
  trilho.append(pop, popEu);
  const visto = () => { try { return +localStorage.getItem('yamb-previa-notif-' + eu()) || 0; } catch (x) { return 0; } };
  const marcaLidas = () => { try { localStorage.setItem('yamb-previa-notif-' + eu(), String(Date.now())); } catch (x) {} contadores(); };
  function fechaPops() {
    if (!pop.hidden) marcaLidas();
    pop.hidden = true; popEu.hidden = true;
    $('btNotif').setAttribute('aria-expanded', 'false'); btEu.setAttribute('aria-expanded', 'false');
    if (!trilho.matches(':hover')) { if (trilho.contains(document.activeElement)) document.activeElement.blur(); fechaMenu(); }
  }
  const alterna = (p, bt, pinta) => (e) => { e.stopPropagation(); const abrir = p.hidden; fechaPops(); if (abrir) { pinta(); p.hidden = false; bt.setAttribute('aria-expanded', 'true'); abreMenu(); const f = p.querySelector('button'); if (f) f.focus(); } };
  $('btNotif').onclick = alterna(pop, $('btNotif'), () => pintaNotif());
  btEu.onclick = alterna(popEu, btEu, () => pintaEu());
  document.addEventListener('click', (e) => { if ((!pop.hidden && !pop.contains(e.target)) || (!popEu.hidden && !popEu.contains(e.target))) fechaPops(); });
  const minhas = () => { const pn = (TEAM[eu()] || TEAM.gabriel)[2]; return (banco && banco.notifs || []).filter((n) => (n.to || []).some((t) => t === 'geral' || pn.includes(t))); };
  const tsNotif = (n) => { const m = String(n.id).match(/^n(\d{13})/); return m ? +m[1] : 0; };
  const ICO_N = { 'Capa pronta': ['M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5', 'var(--ok)'], 'Demanda editada': ['M4 20h4L19 9l-4-4L4 16zM13 7l4 4', 'var(--gold-300)'], 'Falta material': ['M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z', 'var(--bad)'], 'Conteúdo excluído': ['M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13', 'var(--bad)'], 'Nova demanda': ['M12 5v14M5 12h14', 'var(--gold-300)'] };
  const quando = (n) => { const t = tsNotif(n); if (!t) return esc(n.ts || ''); const m = Math.floor((Date.now() - t) / 6e4); return m < 1 ? 'agora' : m < 60 ? 'há ' + m + ' min' : m < 1440 ? 'há ' + Math.floor(m / 60) + ' h' : esc(String(n.ts || '').split(',')[0]); };
  let nFil = 'todas';
  function pintaNotif() {
    const l = minhas(), v = visto(), novas = l.filter((n) => tsNotif(n) > v);
    const lista = nFil === 'novas' ? novas : l;
    const h0 = +hoje0(), grupo = (n) => { const t = tsNotif(n); return !t ? 'Antes' : t >= h0 ? 'Hoje' : t >= h0 - 864e5 ? 'Ontem' : 'Antes'; };
    let g = '', html = '';
    lista.forEach((n) => {
      const gr = grupo(n); if (gr !== g) { g = gr; html += '<div class="pn-g">' + gr + '</div>'; }
      const [ic, cor] = ICO_N[n.kind] || ['M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9', 'var(--gold-300)'];
      const nova = tsNotif(n) > v, por = TEAM[n.by];
      html += '<div class="pn' + (nova ? ' nova' : '') + '"><span class="pn-i" style="color:' + cor + '">' + I(ic, 16) + '</span><div class="pn-c"><span class="k">' + esc(n.kind) + '<em>' + quando(n) + '</em></span><span class="pn-t">' + esc(String(n.text).replace(/ · por .*$/, '')) + '</span>' +
        (por ? '<span class="pn-por"><img src="/assets/team/' + por[1] + '.png" alt="">' + esc(primeiro(n.by)) + '</span>' : '') + '</div></div>';
    });
    pop.innerHTML = '<div class="ptit">Notificações' + (novas.length ? '<span class="pn-nv">' + novas.length + ' nova' + (novas.length === 1 ? '' : 's') + '</span>' : '') + '<button type="button" class="pn-x" aria-label="Fechar">' + I('M6 6l12 12M18 6L6 18', 15) + '</button></div>' +
      '<div class="pn-abas" role="tablist"><button type="button" role="tab" data-f="todas" aria-selected="' + (nFil === 'todas') + '" class="' + (nFil === 'todas' ? 'on' : '') + '">Todas <b>' + l.length + '</b></button><button type="button" role="tab" data-f="novas" aria-selected="' + (nFil === 'novas') + '" class="' + (nFil === 'novas' ? 'on' : '') + '">Novas <b>' + novas.length + '</b></button>' +
      (novas.length ? '<button type="button" class="pn-lidas">Marcar como lidas</button>' : '') + '</div>' +
      '<div class="pn-lista">' + (html || '<p class="mut" style="margin:16px 0;font-size:13px;text-align:center">' + (nFil === 'novas' ? 'Nada novo por aqui.' : 'Nenhuma notificação.') + '</p>') + '</div>' +
      '<p class="pn-rod">Na versão final, os avisos também chegam no celular e no computador.</p>';
    pop.querySelector('.pn-x').onclick = (e) => { e.stopPropagation(); fechaPops(); };
    pop.querySelectorAll('[data-f]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); nFil = b.dataset.f; pintaNotif(); }; });
    const ml = pop.querySelector('.pn-lidas'); if (ml) ml.onclick = (e) => { e.stopPropagation(); marcaLidas(); pintaNotif(); };
  }
  function pintaEuBt() { const u = eu(); $('euNome').textContent = primeiro(u); $('euPapel').textContent = PAPEL_[u] || ''; $('euFoto').src = '/assets/team/' + TEAM[u][1] + '.png'; $('euFoto').alt = ''; btEu.setAttribute('aria-label', 'Usuário: ' + TEAM[u][0] + '. Trocar usuário'); }
  function pintaEu() {
    const u = eu();
    popEu.innerHTML = '<div class="ptit">Trocar usuário<span class="pn-nv" style="background:rgba(247,228,206,.08);color:var(--ink-300)">prévia</span></div>' +
      '<div class="eu-lista">' + Object.keys(TEAM).map((k) => '<button type="button" class="eu-op' + (k === u ? ' on' : '') + '" data-k="' + k + '" aria-pressed="' + (k === u) + '"><img src="/assets/team/' + TEAM[k][1] + '.png" alt=""><span><b>' + esc(TEAM[k][0]) + '</b><em>' + esc(PAPEL_[k]) + '</em></span>' + (k === u ? I('M5 12l5 5L20 7', 16) : '') + '</button>').join('') + '</div>' +
      '<a class="eu-sair" href="#login">' + I('M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3', 16) + 'Sair (ver login)</a>' +
      '<p class="pn-rod">Na versão final, cada pessoa entra com seu login e não troca de usuário.</p>';
    popEu.querySelectorAll('[data-k]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); const sel = $('euSel'); sel.value = b.dataset.k; sel.dispatchEvent(new Event('change')); fechaPops(); }; });
    popEu.querySelector('.eu-sair').onclick = () => fechaPops();
  }

  window.exportarLista = (lista) => {
    const its = lista || (banco && banco.items || []).filter((i) => !i.excluido);
    const c = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = [['Cliente', 'Conteúdo', 'Formato', 'Postagem', 'Produção', 'Social', 'Status', 'Trello'], ...its.map((i) => [i.cliente, i.titulo, i.tipo, i.data, nome(i.produtor), nome(i.social), i.status, i.trello || ''])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + rows.map((r) => r.map(c).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = 'YAMB conteudos ' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') + '.csv';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  function contadores() {
    if (!banco) return;
    const v = (banco.items || []).filter((i) => !i.excluido), u = eu(), pn = (TEAM[u] || TEAM.gabriel)[2];
    const seg = (() => { const h = hoje0(); return somaDias(h, -((h.getDay() + 6) % 7)); })();
    const sem = new Set([0, 1, 2, 3, 4, 5, 6].map((n) => { const d = somaDias(seg, n); return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear(); }));
    const meu = (r) => (i) => produtorDe(i.tipo) === r && produtorPara(i.tipo, i.produtor) === u;
    let paineis = 0;
    if (pn.includes('design')) paineis += v.filter((i) => meu('design')(i) && !i.semMaterial && ['Pendente', 'Produção', 'Ajustar'].includes(i.status)).length + v.filter((i) => precisaCapa(i) && capaDesigner(i) === u && !(i.capa && i.capa.pronta) && !i.semMaterial).length;
    if (pn.includes('video')) paineis += v.filter((i) => meu('video')(i) && ['Pendente', 'Produção', 'Ajustar'].includes(i.status)).length;
    if (pn.includes('social')) paineis += v.filter((i) => i.status === 'Aprovado').length;
    const N = {
      semana: v.filter((i) => sem.has(i.data) && !['Aprovado', 'Postado'].includes(i.status)).length,
      paineis,
      aprovacoes: v.filter((i) => i.status === 'Enviado').length,
      planejamento: (banco.planos || []).filter((p) => p.status === 'Sem planejamento').length,
    };
    Object.entries(N).forEach(([t, n]) => {
      const a = document.querySelector('.trilho [data-tela="' + t + '"]'); if (!a) return;
      let c = a.querySelector('.cont'); if (!c) { c = document.createElement('span'); c.className = 'cont'; a.appendChild(c); }
      c.hidden = !n; c.textContent = n > 99 ? '99+' : n;
      a.setAttribute('aria-label', a.querySelector('.dica').textContent + (n ? ' (' + n + ')' : ''));
    });
    let visto = 0; try { visto = +localStorage.getItem('yamb-previa-notif-' + u) || 0; } catch (x) {}
    const nv = minhas().filter((n) => tsNotif(n) > visto).length;
    $('notifN').hidden = !nv; $('notifN').textContent = nv > 99 ? '99+' : nv;
  }

  /* ---------- Planejamento ---------- */
  const PORDER = ['Sem planejamento', 'Ajustes', 'Em desenvolvimento', 'Aguardando aprovação', 'Concluído'];
  const PCOR = { 'Concluído': 'var(--ok)', 'Em desenvolvimento': 'var(--gold-300)', 'Aguardando aprovação': 'var(--gold-200)', 'Ajustes': 'var(--bad)', 'Sem planejamento': 'var(--bad)' };
  let pFil = 'Todos';
  function pintaPlan() {
    const pl = (banco && banco.planos) || [], c = (s) => pl.filter((p) => p.status === s).length, h = new Date();
    const mes = MESES[h.getMonth()].slice(0, 3); const Mes = mes.charAt(0).toUpperCase() + mes.slice(1);
    $('plKpi').innerHTML = [['Clientes', pl.length], ['Planejamento pronto', c('Concluído')], ['Em desenvolvimento', c('Em desenvolvimento')], ['Aguardando aprovação', c('Aguardando aprovação')], ['Sem planejamento', c('Sem planejamento')]]
      .map(([k, n], j) => '<div class="card pk' + (j === 4 && n ? ' alerta' : '') + '"><span class="num">' + n + '</span><span class="mut">' + k + '</span></div>').join('');
    const sp = c('Sem planejamento');
    $('plAlerta').hidden = !sp;
    $('plAlerta').innerHTML = I('M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z', 18) + '<span><b>' + plural(sp, 'cliente', 'clientes') + ' sem planejamento de ' + Mes + '/' + h.getFullYear() + '.</b> Prioridade da semana.</span>';
    $('plFil').innerHTML = ['Todos', ...PORDER].map((s) => '<button type="button" class="chip' + (pFil === s ? ' on' : '') + '" data-s="' + s + '">' + s + (s !== 'Todos' ? ' <b>' + c(s) + '</b>' : '') + '</button>').join('');
    $('plFil').querySelectorAll('button').forEach((b) => { b.onclick = () => { pFil = b.dataset.s; pintaPlan(); }; });
    const l = (pFil === 'Todos' ? pl : pl.filter((p) => p.status === pFil)).slice().sort((a, b) => PORDER.indexOf(a.status) - PORDER.indexOf(b.status) || a.cliente.localeCompare(b.cliente));
    $('plTab').innerHTML = l.map((p) => '<tr><td><span class="plcli"><span class="plav">' + esc(titulo(p.cliente).slice(0, 1)) + '</span>' + esc(titulo(p.cliente)) + '</span></td><td>' + esc(p.periodo || '—') + '</td><td>' + esc(p.responsavel || '—') + '</td><td><span class="gpill" style="--c:' + (PCOR[p.status] || 'var(--ink-300)') + '">' + esc(p.status) + '</span></td><td>' + (p.trello ? '<a href="' + esc(p.trello) + '" target="_blank" rel="noopener">Trello →</a>' : '<span class="mut">—</span>') + '</td></tr>').join('') ||
      '<tr><td colspan="5" class="mut">Nenhum cliente nessa situação.</td></tr>';
  }

  /* ---------- Avaliação do dia ---------- */
  const AV_ROT = ['', 'Dia difícil', 'Dia puxado', 'Dia ok', 'Dia bom', 'Dia excelente'];
  const GESTAO = ['gabriel', 'yasmim', 'vitoria'];
  const pAv = $('avDia') || document.createElement('div');
  let avDia = hoje0();
  const est = (n) => '<span class="est">' + [1, 2, 3, 4, 5].map((k) => '<i class="' + (k <= n ? 'on' : '') + '">★</i>').join('') + '</span>';
  const f1 = (n) => n.toFixed(1).replace('.', ',');
  function pintaAval() {
    const av = (banco && banco.avaliacoes) || [], u = eu(), ds = p2(avDia.getDate()) + '/' + p2(avDia.getMonth() + 1) + '/' + avDia.getFullYear();
    const doDia = av.filter((a) => a.data === ds), minha = doDia.find((a) => a.usuario === u);
    const seg = somaDias(avDia, -((avDia.getDay() + 6) % 7));
    const daSem = av.filter((a) => { const d = parse(a.data); return d && d >= seg && d < somaDias(seg, 7); });
    const med = (l) => l.reduce((s, a) => s + (+a.nota || 0), 0) / (l.length || 1);
    const gestao = GESTAO.includes(u), ehHoje = +avDia === +hoje0();
    const faltam = Object.keys(TEAM).filter((k) => !doDia.some((a) => a.usuario === k));
    let h = '<p style="margin:0;font-size:13px">Oi, ' + esc(primeiro(u)) + '! De 1 a 5 estrelas, como foi seu dia de trabalho ' + (ehHoje ? 'hoje' : 'em ' + ds.slice(0, 5)) + '?</p>' +
      (minha ? '<div class="minha">' + est(minha.nota) + '<b>' + AV_ROT[minha.nota] + '</b><span class="mut">registrada às ' + esc(minha.ts || '—') + '</span>' + (minha.comentario ? '<p>“' + esc(minha.comentario) + '”</p>' : '') + '</div>'
        : '<div class="minha vazia">' + est(0) + '<span class="mut">' + (ehHoje ? 'Ainda sem avaliação. Na versão final, é só tocar nas estrelas e enviar.' : 'Sem avaliação neste dia.') + '</span></div>');
    if (gestao) {
      h += '<div class="avnav"><button type="button" class="chip" id="avAnt" aria-label="Dia anterior">←</button><b>' + DIAS[avDia.getDay()].split('-')[0] + ', ' + ds.slice(0, 5) + '</b><button type="button" class="chip" id="avProx" aria-label="Próximo dia"' + (ehHoje ? ' disabled' : '') + '>→</button></div>' +
        '<div class="avkpi"><div><span class="num">' + (doDia.length ? f1(med(doDia)) : '—') + '</span><span class="mut">Média do dia</span></div><div><span class="num">' + (daSem.length ? f1(med(daSem)) : '—') + '</span><span class="mut">Média da semana</span></div><div><span class="num">' + doDia.length + '/' + Object.keys(TEAM).length + '</span><span class="mut">avaliaram</span></div></div>' +
        (doDia.length ? doDia.slice().sort((a, b) => b.nota - a.nota).map((a) => '<div class="avl"><img class="av" src="/assets/team/' + ((TEAM[a.usuario] || [])[1] || 'gabriel-santos') + '.png" alt=""><span class="elip"><b>' + esc(primeiro(a.usuario)) + '</b> · ' + AV_ROT[a.nota] + (a.comentario ? '<br><span class="mut">“' + esc(a.comentario) + '”</span>' : '') + '</span>' + est(a.nota) + '</div>').join('') : '<p class="mut" style="margin:0">Ninguém avaliou este dia.</p>') +
        (faltam.length && doDia.length ? '<p class="mut" style="margin:0;font-size:11.5px">Sem avaliação: ' + faltam.map(primeiro).join(', ') + '</p>' : '');
    }
    pAv.innerHTML = h;
    if (gestao) {
      $('avAnt').onclick = (e) => { avDia = somaDias(avDia, -1); pintaAval(); };
      $('avProx').onclick = (e) => { if (!ehHoje) { avDia = somaDias(avDia, 1); pintaAval(); } };
    }
  }

  /* ---------- Login (prévia: não confere nem envia a senha) ---------- */
  const PAPEL = { vitoria: 'Direção de Conteúdo', gabriel: 'COO / Branding', yasmim: 'CEO / Diretora Geral', anny: 'Planejamento', brisa: 'Social Media', marcus: 'Designer Gráfico', camille: 'Edição de Vídeo', yngra: 'Secretária', vitor: 'Administrativo' };
  const loginDe = (k) => TEAM[k][1].replace('-', '.');
  const alvoDe = (u) => { u = String(u || '').trim().toLowerCase().replace(/@yamb\.com\.br$/, ''); return Object.keys(TEAM).find((k) => loginDe(k) === u || k === u); };
  const lgUsr = $('lgUsr'), lgPwd = $('lgPwd');
  function pintaLogin() {
    const al = alvoDe(lgUsr.value);
    $('lgEntrar').textContent = al ? 'Entrar como ' + primeiro(al) + ' →' : 'Entrar →';
    $('lgEquipe').innerHTML = Object.keys(TEAM).map((k) => '<button type="button" class="lg-p' + (k === al ? ' on' : '') + '" data-k="' + k + '" aria-pressed="' + (k === al) + '"><img src="/assets/team/' + TEAM[k][1] + '.png" alt=""><span><b>' + esc(TEAM[k][0]) + '</b><em>' + esc(PAPEL[k]) + '</em></span></button>').join('');
  }
  if (lgUsr) {
    pintaLogin();
    lgUsr.addEventListener('input', () => { $('lgErro').textContent = ''; pintaLogin(); });
    lgPwd.addEventListener('input', () => { $('lgErro').textContent = ''; });
    $('lgEquipe').onclick = (e) => { const b = e.target.closest('[data-k]'); if (!b) return; lgUsr.value = loginDe(b.dataset.k); lgPwd.value = ''; $('lgErro').textContent = ''; pintaLogin(); lgPwd.focus(); };
    $('lgVer').onclick = () => { const v = lgPwd.type === 'password'; lgPwd.type = v ? 'text' : 'password'; $('lgVer').setAttribute('aria-pressed', String(v)); $('lgVer').setAttribute('aria-label', v ? 'Ocultar senha' : 'Mostrar senha'); };
    $('lgForm').onsubmit = (e) => {
      e.preventDefault();
      const al = alvoDe(lgUsr.value);
      if (!lgUsr.value.trim() || !lgPwd.value) { $('lgErro').textContent = 'Informe usuário e senha.'; return; }
      if (!al) { $('lgErro').textContent = 'Usuário ou senha incorretos.'; return; }
      lgPwd.value = ''; // a prévia não guarda nem envia a senha
      const sel = $('euSel'); if (sel && sel.querySelector('option[value="' + al + '"]')) { sel.value = al; sel.dispatchEvent(new Event('change')); }
      location.hash = '#aviso-8h'; // na versão final o aviso das 8h aparece logo depois do login
    };
  }

  /* ---------- Aviso das 8h (os estados que a pessoa pode ver ao entrar) ---------- */
  const SINO = 'M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 003.4 0';
  const AV8 = {
    pedir: [SINO, '', 'Ligue os avisos de postagens', 'Todo dia às <b>8h</b> você recebe aqui o que precisa ser postado hoje: posts e stories. Sem os avisos ligados, o ambiente interno não abre.', 'Ligar avisos agora', '', true],
    bloq: ['M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z', 'ruim', 'Os avisos estão bloqueados neste navegador', 'Clique no <b>cadeado</b> ao lado do endereço, em <b>Notificações</b> escolha <b>Permitir</b> e depois recarregue a página.', 'Já liberei, recarregar', ''],
    iphone: ['M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2', '', 'Instale o ambiente interno no iPhone', 'No iPhone os avisos só funcionam com o ambiente na tela inicial. Toque em <b>Compartilhar</b> (quadrado com seta) › <b>Adicionar à Tela de Início</b>, depois abra pelo ícone novo e ligue os avisos.', 'Entendi', ''],
    sem: ['M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z', 'ruim', 'Este navegador não recebe avisos', 'Abra o ambiente interno no <b>Chrome</b>, <b>Edge</b> ou <b>Safari</b> atualizado para ligar os avisos de postagens.', 'Copiar o endereço', ''],
    rede: ['M1 1l22 22M16.7 11.1A10.9 10.9 0 0119 12.5M5 12.5a10.9 10.9 0 015.2-2.7M10.7 5.1A16 16 0 0122.6 9M1.4 9a16 16 0 014.3-2.8M8.5 16.1a6 6 0 016.9 0M12 20h.01', 'ruim', 'Não consegui ligar os avisos agora', 'O servidor de avisos não respondeu. Tente de novo; se continuar, dá para entrar nesta vez e ligar depois.', 'Tentar de novo', 'Entrar sem avisos desta vez'],
  };
  function pintaAv8(k) {
    av8 = k;
    const [ic, cl, t, x, b1, b2, horas] = AV8[k];
    $('av8Caixa').innerHTML = '<span class="av8-ico ' + cl + '">' + I(ic, 26) + '</span><span class="av8-tag">Obrigatório</span><h2 id="av8Tit">' + t + '</h2><p>' + x + '</p>' +
      (horas ? '<div class="av8-horas"><div><b>8h</b><span>chega a lista de posts do dia</span></div><div><b>8h–12h</b><span>janela dos stories</span></div></div>' : '') +
      '<button type="button" class="botao">' + b1 + '</button>' + (b2 ? '<button type="button" class="botao sec">' + b2 + '</button>' : '') +
      '<p class="mut" style="font-size:11.5px">Prévia: os botões não ligam nada.</p>';
    document.querySelectorAll('.av8-estados [data-e]').forEach((c) => { c.classList.toggle('on', c.dataset.e === k); c.setAttribute('aria-pressed', String(c.dataset.e === k)); });
  }
  let av8 = 'pedir';
  if ($('av8Caixa')) $('av8Caixa').addEventListener('click', (e) => { const b = e.target.closest('.botao'); if (!b) return; if ((av8 === 'pedir' && !b.classList.contains('sec')) || (av8 === 'rede' && b.classList.contains('sec'))) location.hash = '#painel'; });
  if ($('av8Caixa')) { pintaAv8('pedir'); document.querySelector('.av8-estados').onclick = (e) => { const c = e.target.closest('[data-e]'); if (c) pintaAv8(c.dataset.e); }; }

  window.pintaExtras = (b) => { banco = b; contadores(); pintaPlan(); if (!pop.hidden) pintaNotif(); pintaAval(); };
  pintaEuBt();
  $('euSel').addEventListener('change', () => { pintaEuBt(); contadores(); pintaAval(); if (banco) ['pintaIndicadores', 'pintaPaineis', 'pintaAprov', 'pintaCadastro'].forEach((f) => window[f] && window[f](banco)); });
})();
