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
  let hashAntes = '';
  function fecha() {
    gav.hidden = true; fundo.hidden = true; document.body.classList.remove('gav-aberta');
    if (location.hash.startsWith('#demanda/')) history.replaceState(null, '', location.pathname + location.search + (hashAntes && !hashAntes.startsWith('#demanda/') ? hashAntes : '#painel'));
    if (voltaFoco && voltaFoco.focus) voltaFoco.focus();
  }
  fundo.onclick = fecha;
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!gav.hidden) fecha(); fechaPops(); } });

  function abre(id, origem) {
    const i = banco && (banco.items || []).find((x) => String(x.id) === String(id));
    if (!i) return false;
    voltaFoco = origem || document.activeElement;
    if (!location.hash.startsWith('#demanda/')) hashAntes = location.hash;
    history.replaceState(null, '', location.pathname + location.search + '#demanda/' + encodeURIComponent(i.id));
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
      '<button class="glink" type="button" title="Copia o endereço desta demanda para mandar a alguém da equipe">' + I('M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1', 15) + '<span>Copiar link</span></button>' +
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
      '<section><h3>Ações</h3><div class="gacoes">' + acoesDe(i).map(([k, t, prim]) => '<button type="button" class="botao' + (prim ? '' : ' sec') + '" data-acao="' + k + '">' + t + '</button>').join('') + '</div></section>' +
      '<p class="gnota">Orientações completas, referências, arquivos e prazos estão no Trello.</p>';
    gav.querySelector('.gfecha').onclick = fecha;
    gav.querySelectorAll('[data-acao]').forEach((b) => { b.onclick = () => acao(b.dataset.acao, i); });
    gav.querySelector('.glink').onclick = (e) => { const b = e.currentTarget, url = location.origin + location.pathname + '#demanda/' + encodeURIComponent(i.id);
      const ok = () => { b.querySelector('span').textContent = 'Link copiado'; setTimeout(() => { b.querySelector('span').textContent = 'Copiar link'; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, () => prompt('Copie o link:', url)); else prompt('Copie o link:', url); };
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

  /* ---------- janelas de ação (prévia: mostram como vai ser, nada é salvo) ---------- */
  const jFundo = document.createElement('div'); jFundo.className = 'jan-fundo'; jFundo.hidden = true;
  const jan = document.createElement('div'); jan.className = 'janela'; jan.hidden = true; jan.setAttribute('role', 'dialog'); jan.setAttribute('aria-modal', 'true'); jan.setAttribute('aria-labelledby', 'janTit');
  document.body.append(jFundo, jan);
  let janVolta = null;
  function fechaJan() { jan.hidden = true; jFundo.hidden = true; if (janVolta && janVolta.focus) janVolta.focus(); }
  jFundo.onclick = fechaJan;
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !jan.hidden) { e.stopImmediatePropagation(); fechaJan(); } }, true);
  const toast = (t) => { let el = document.querySelector('.jtoast'); if (!el) { el = document.createElement('div'); el.className = 'jtoast'; el.setAttribute('role', 'status'); document.body.append(el); } el.innerHTML = '<b>✓</b> ' + t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 3200); };
  // abre uma janela: {ic, cor, tit, sub, corpo, ok, okCor, valida(jan) -> erro|'' , feito}
  function janela(o) {
    janVolta = document.activeElement;
    jan.innerHTML = '<div class="jcab"><span class="jic" style="color:' + (o.cor || 'var(--gold-300)') + '">' + I(o.ic, 20) + '</span><div><h2 id="janTit">' + o.tit + '</h2>' + (o.sub ? '<p class="jsub">' + o.sub + '</p>' : '') + '</div><button type="button" class="gfecha jx" aria-label="Fechar">' + I('M6 6l12 12M18 6L6 18', 16) + '</button></div>' +
      '<div class="jcorpo">' + o.corpo + '</div><p class="jerro" role="alert"></p>' +
      '<div class="jbt"><button type="button" class="botao sec jcanc">Cancelar</button>' + (o.ok ? '<button type="button" class="botao jok"' + (o.okCor ? ' style="background:' + o.okCor + '"' : '') + '>' + o.ok + '</button>' : '') + '</div>' +
      '<p class="jprev">' + (o.faz ? 'Grava na planilha da equipe.' : 'Ainda não ligado: nada é salvo.') + '</p>';
    jan.querySelector('.jx').onclick = fechaJan; jan.querySelector('.jcanc').onclick = fechaJan;
    const ok = jan.querySelector('.jok');
    if (ok) ok.onclick = async () => {
      const er = o.valida ? o.valida(jan) : ''; if (er) { jan.querySelector('.jerro').textContent = er; return; }
      if (!o.faz) { fechaJan(); toast(o.feito || 'Feito.'); return; }
      ok.disabled = true; ok.textContent = 'Salvando…';
      try { const salvo = await o.faz(jan); fechaJan(); if (!gav.hidden) fecha(); toast(salvo ? o.feito : 'Guardado aqui; a gravação vai tentar de novo sozinha.'); }
      catch (e) { ok.disabled = false; ok.textContent = o.ok; jan.querySelector('.jerro').textContent = 'Não deu para salvar: ' + (e.message || e); }
    };
    if (o.monta) o.monta(jan);
    jan.hidden = false; jFundo.hidden = false;
    const f = jan.querySelector('textarea, input, .jok'); if (f) f.focus();
  }
  const resumo = (i) => '<div class="jitem"><b>' + esc(titulo(i.cliente)) + '</b><span>' + esc(i.titulo || '(sem título)') + '</span><em>' + esc(i.tipo) + ' · ' + esc(i.data || '') + (i.hora ? ' · ' + esc(i.hora) : '') + '</em></div>';
  const IC = { ok: 'M5 12l5 5L20 7', ajuste: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4', falta: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z', nao: 'M12 3a9 9 0 100 18 9 9 0 000-18zM5.6 5.6l12.8 12.8', editar: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4', check: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11', capa: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5', lixo: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13', rotina: 'M12 3a9 9 0 109 9M12 7v5l3 2', pago: 'M3 7h18v10H3zM7 12h.01M17 12h.01M12 10a2 2 0 100 4 2 2 0 000-4z', recibo: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6' };
  const proxima = (st) => { const k = FLUXO.indexOf(st); return st === 'Ajustar' ? 'Enviado' : st === 'Não postado' ? 'Postado' : k >= 0 && k < FLUXO.length - 1 ? FLUXO[k === 3 ? 5 : k + 1] : null; };
  function acoesDe(i) {
    const l = [], nx = proxima(i.status);
    if (i.status === 'Enviado') l.push(['aprovar', 'Aprovar', true], ['ajuste', 'Pedir ajuste']);
    else if (i.status === 'Aprovado') l.push(['checklist', 'Checklist e postar', true], ['naopostado', 'Não foi postado']);
    else if (nx) l.push(['mover', 'Mover para ' + nx, true]);
    if (['Pendente', 'Produção'].includes(i.status)) l.push(i.semMaterial ? ['recebido', 'Material recebido'] : ['semmaterial', 'Sem material?']);
    if (i.tipo === 'Reels' && precisaCapa(i)) l.push(i.capa && i.capa.pronta ? ['capadesfaz', 'Desfazer capa pronta'] : ['capa', 'Marcar capa pronta'], ['capaquem', 'Quem faz a capa'], ['semcapa', 'Não precisa de capa']);
    else if (i.tipo === 'Reels' && ['Pendente', 'Produção', 'Pronto'].includes(i.status)) l.push(['precisacapa', 'Precisa de capa']);
    if (!['Postado', 'Não postado'].includes(i.status)) l.push(['produtor', 'Quem faz']);
    l.push(['formato', 'Formato'], ['editar', 'Editar demanda'], ['excluir', 'Excluir']);
    return l;
  }
  function acao(k, i) {
    const nx = proxima(i.status);
    const J = {
      mover: () => janela({ ic: 'M5 12h14M13 6l6 6-6 6', tit: 'Mover para ' + nx, sub: 'A equipe recebe uma notificação.', corpo: resumo(i) + '<p class="jtxt">De <b>' + esc(i.status) + '</b> para <b>' + esc(nx) + '</b>.' + (precisaCapa(i) && !(i.capa && i.capa.pronta) && nx === 'Enviado' ? '<br><span style="color:var(--bad)">Este Reels precisa da capa pronta antes de ser enviado.</span>' : '') + '</p>', ok: 'Mover', feito: 'Movido para ' + nx + '.', valida: () => (nx === 'Enviado' && precisaCapa(i) && !(i.capa && i.capa.pronta)) ? 'Este Reels precisa da capa pronta antes de ser enviado.' : '', faz: () => window.Grava.moverEtapa(i.id, nx, eu()) }),
      aprovar: () => janela({ ic: IC.ok, cor: 'var(--ok)', tit: 'Aprovar material', sub: 'Aprovar libera o material para postagem.', corpo: resumo(i) + '<label class="jcampo"><span>Observações (opcional)</span><textarea rows="3" placeholder="Ex.: pode postar às 19h."></textarea></label>', ok: 'Aprovar e liberar', okCor: 'var(--ok)', feito: 'Aprovado e liberado.', faz: (j) => window.Grava.aprovar(i.id, j.querySelector('textarea').value.trim(), eu()) }),
      ajuste: () => janela({ ic: IC.ajuste, cor: 'var(--bad)', tit: 'Pedir ajuste', sub: 'O material vai para Ajustar com o motivo anotado, e a equipe recebe uma notificação. Depois de corrigido, volta para Enviado.', corpo: resumo(i) + '<label class="jcampo"><span>Motivo do ajuste</span><textarea rows="3" placeholder="Cliente pediu para trocar a foto de capa."></textarea></label>', ok: 'Pedir ajuste', okCor: 'var(--bad)', valida: (j) => j.querySelector('textarea').value.trim() ? '' : 'Escreva o motivo do ajuste.', feito: 'Ajuste pedido.', faz: (j) => window.Grava.pedirAjuste(i.id, j.querySelector('textarea').value.trim(), eu()) }),
      semmaterial: () => janela({ ic: IC.falta, cor: 'var(--bad)', tit: 'Que material está faltando?', sub: 'A demanda fica marcada como "Sem material" e o prazo da etapa para de contar.', corpo: resumo(i) + '<div class="jchips">' + ['Fotos do produto', 'Texto da campanha', 'Gravação', 'Aprovação do cliente'].map((c) => '<button type="button" class="chip" data-v="' + c + '">' + c + '</button>').join('') + '</div><label class="jcampo"><span>O que falta</span><input placeholder="ex.: fotos do produto, texto da campanha, gravação"></label>', ok: 'Avisar falta de material', okCor: 'var(--bad)', monta: (j) => j.querySelectorAll('[data-v]').forEach((c) => { c.onclick = () => { j.querySelector('input').value = c.dataset.v; }; }), valida: (j) => j.querySelector('input').value.trim() ? '' : 'Diga o que está faltando.', feito: 'Falta de material avisada.', faz: (j) => window.Grava.acoes(eu()).semMaterial(i.id, j.querySelector('input').value) }),
      recebido: () => janela({ ic: IC.ok, cor: 'var(--ok)', tit: 'Material recebido?', corpo: resumo(i) + '<p class="jtxt">Falta anotada: <b>' + esc((i.semMaterial || {}).falta || '—') + '</b>. A demanda volta ao fluxo normal.</p>', ok: 'Material recebido', okCor: 'var(--ok)', feito: 'Material recebido.', faz: () => window.Grava.acoes(eu()).materialRecebido(i.id) }),
      naopostado: () => janela({ ic: IC.nao, cor: 'var(--bad)', tit: 'Por que não foi postado?', sub: 'O conteúdo vai para "Não postado" com o motivo.', corpo: resumo(i) + '<div class="jchips">' + ['Cliente pediu para segurar', 'Erro na publicação', 'Mudou a data'].map((c) => '<button type="button" class="chip" data-v="' + c + '">' + c + '</button>').join('') + '</div><label class="jcampo"><span>Motivo</span><textarea rows="2" placeholder="ex.: cliente pediu para segurar, erro na publicação"></textarea></label>', ok: 'Marcar como não postado', okCor: 'var(--bad)', monta: (j) => j.querySelectorAll('[data-v]').forEach((c) => { c.onclick = () => { j.querySelector('textarea').value = c.dataset.v; }; }), feito: 'Marcado como não postado.', faz: (j) => window.Grava.naoPostado(i.id, j.querySelector('textarea').value, eu()) }),
      checklist: () => janela({ ic: IC.check, tit: 'Checklist de postagem', sub: 'Cada item marcado já fica salvo.', corpo: resumo(i) + '<div class="jchk">' + CHECKLIST.map((c, j) => '<label><input type="checkbox" data-k="' + j + '"' + ((i.checklist || []).map(Number).includes(j) ? ' checked' : '') + '><span>' + c + '</span></label>').join('') + '</div><p class="jtxt jfalta"></p>', ok: 'Marcar como postado', okCor: 'var(--ok)',
        monta: (j) => { const at = () => { const f = [...j.querySelectorAll('.jchk input')].filter((x) => !x.checked).length; j.querySelector('.jfalta').innerHTML = f ? '<span style="color:var(--bad)">Faltam ' + plural(f, 'item', 'itens') + ' na conferência.</span>' : 'Tudo conferido.'; };
          j.querySelectorAll('.jchk input').forEach((x) => { x.onchange = () => { at(); window.Grava.marcarChecklist(i.id, Number(x.dataset.k)); }; }); at(); },
        feito: 'Marcado como postado.', faz: () => window.Grava.moverEtapa(i.id, 'Postado', eu()) }),
      capa: () => janela({ ic: IC.capa, cor: 'var(--ok)', tit: 'Marcar capa pronta', corpo: resumo(i) + '<p class="jtxt">Quem faz a capa: <b>' + esc(primeiro(capaDesigner(i))) + '</b>. A edição recebe o aviso de que a capa está pronta.</p>', ok: 'Capa pronta', okCor: 'var(--ok)', feito: 'Capa marcada como pronta.', faz: () => window.Grava.acoes(eu()).capaPronta(i.id, true) }),
      capadesfaz: () => janela({ ic: IC.capa, tit: 'Desfazer capa pronta?', corpo: resumo(i), ok: 'Desfazer', feito: 'Capa voltou para pendente.', faz: () => window.Grava.acoes(eu()).capaPronta(i.id, false) }),
      semcapa: () => janela({ ic: IC.capa, tit: 'Este Reels não precisa de capa?', sub: 'Ele sai da lista de Capas de Reels do design.', corpo: resumo(i), ok: 'Não precisa de capa', feito: 'Este Reels ficou sem capa.', faz: () => window.Grava.acoes(eu()).precisaCapa(i.id, false) }),
      precisacapa: () => janela({ ic: IC.capa, tit: 'Este Reels precisa de capa', sub: 'Ele entra em Capas de Reels de quem fizer a capa.', corpo: resumo(i), ok: 'Precisa de capa', feito: 'Reels marcado: precisa de capa.', faz: () => window.Grava.acoes(eu()).precisaCapa(i.id, true) }),
      produtor: () => { const r = produtorDe(i.tipo), op = Object.keys(TEAM).filter((k) => TEAM[k][2].includes(r)), at = produtorPara(i.tipo, i.produtor);
        janela({ ic: 'M12 8a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0', tit: (r === 'video' ? 'Edição' : 'Design') + ' · quem faz esta demanda', sub: 'A equipe recebe uma notificação da troca.', corpo: resumo(i) + '<div class="jpessoas">' + op.map((k) => '<button type="button" class="' + (k === at ? 'on' : '') + '" data-p="' + k + '" aria-pressed="' + (k === at) + '"><img src="/assets/team/' + TEAM[k][1] + '.png" alt="">' + esc(TEAM[k][0]) + '</button>').join('') + '</div>', ok: 'Trocar', feito: 'Responsável trocado.',
          monta: (j) => j.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => { j.querySelectorAll('[data-p]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); }; }),
          valida: (j) => { const b = j.querySelector('[data-p].on'); return !b ? 'Escolha quem faz.' : b.dataset.p === at ? 'Essa pessoa já é a responsável.' : ''; },
          faz: (j) => window.Grava.acoes(eu()).produtor(i.id, j.querySelector('[data-p].on').dataset.p) }); },
      capaquem: () => { const op = Object.keys(TEAM).filter((k) => TEAM[k][2].includes('design')), at = capaDesigner(i);
        janela({ ic: IC.capa, tit: 'Capa · quem faz', sub: 'A capa aparece só em Capas de Reels de quem for indicado.', corpo: resumo(i) + '<div class="jpessoas">' + op.map((k) => '<button type="button" class="' + (k === at ? 'on' : '') + '" data-p="' + k + '" aria-pressed="' + (k === at) + '"><img src="/assets/team/' + TEAM[k][1] + '.png" alt="">' + esc(TEAM[k][0]) + '</button>').join('') + '</div>', ok: 'Trocar', feito: 'Responsável pela capa trocado.',
          monta: (j) => j.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => { j.querySelectorAll('[data-p]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); }; }),
          valida: (j) => { const b = j.querySelector('[data-p].on'); return !b ? 'Escolha quem faz a capa.' : b.dataset.p === at ? 'Essa pessoa já faz a capa.' : ''; },
          faz: (j) => window.Grava.acoes(eu()).capaDesigner(i.id, j.querySelector('[data-p].on').dataset.p) }); },
      editar: () => { const cls = ((banco && banco.planos) || []).map((p) => p.cliente); const d0 = parse(i.data);
        janela({ ic: IC.editar, tit: 'Editar demanda', sub: 'Formato e etapa mudam nos botões do painel. Salvar avisa a equipe.', corpo: '<div class="jgrade"><label class="jcampo"><span>Cliente</span><select class="jsel" data-f="cliente">' + cls.map((c) => '<option value="' + esc(c) + '"' + (c === i.cliente ? ' selected' : '') + '>' + esc(titulo(c)) + '</option>').join('') + '</select></label><label class="jcampo"><span>Data prevista</span><input type="date" data-f="data" value="' + (d0 ? d0.getFullYear() + '-' + p2(d0.getMonth() + 1) + '-' + p2(d0.getDate()) : '') + '"></label><label class="jcampo l2j"><span>Conteúdo</span><input data-f="titulo" value="' + esc(i.titulo || '') + '"></label><label class="jcampo"><span>Horário</span><input data-f="hora" value="' + esc(i.hora || '') + '" placeholder="ex.: 19h"></label><label class="jcampo"><span>Link do Trello</span><input data-f="trello" value="' + esc(i.trello || '') + '" placeholder="https://trello.com/c/…"></label></div>', ok: 'Salvar alterações', feito: 'Alterações salvas.',
          valida: (j) => { const t = j.querySelector('[data-f="titulo"]').value.trim(), dt = j.querySelector('[data-f="data"]').value, tr = j.querySelector('[data-f="trello"]').value.trim(); return !t ? 'O conteúdo não pode ficar vazio.' : !dt ? 'Escolha a data.' : tr && !/^https:\/\/trello\.com\//.test(tr) ? 'O link precisa começar com https://trello.com/' : ''; },
          faz: (j) => { const v = (k) => j.querySelector('[data-f="' + k + '"]').value.trim(), [a, m, dd] = v('data').split('-'); return window.Grava.acoes(eu()).editar(i.id, { cliente: v('cliente'), titulo: v('titulo'), data: dd + '/' + m + '/' + a, hora: v('hora'), trello: v('trello') }); } }); },
      formato: () => { const TIPOS = ['Vídeo', 'Reels', 'Foto', 'Carrossel', 'Arte', 'Stories'];
        janela({ ic: 'M4 5h16v14H4z', tit: 'Formato', sub: 'Alterar o formato avisa toda a equipe; o responsável segue a área do novo formato.', corpo: resumo(i) + '<div class="jchips jtipos">' + TIPOS.map((t) => '<button type="button" class="chip' + (t === i.tipo ? ' on' : '') + '" data-t="' + t + '" aria-pressed="' + (t === i.tipo) + '">' + t + '</button>').join('') + '</div>', ok: 'Trocar formato', feito: 'Formato trocado.',
          monta: (j) => j.querySelectorAll('[data-t]').forEach((b) => { b.onclick = () => j.querySelectorAll('[data-t]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); }),
          valida: (j) => j.querySelector('[data-t].on').dataset.t === i.tipo ? 'Escolha um formato diferente.' : '',
          faz: (j) => window.Grava.setTipo(i.id, j.querySelector('[data-t].on').dataset.t, eu()) }); },
      excluir: () => janela({ ic: IC.lixo, cor: 'var(--bad)', tit: 'Excluir este conteúdo?', sub: 'Ele sai de todas as listas, painéis e indicadores, para toda a equipe.', corpo: resumo(i), ok: 'Excluir', okCor: 'var(--bad)', feito: 'Conteúdo excluído.', faz: () => window.Grava.acoes(eu()).excluir(i.id) }),
    };
    (J[k] || (() => {}))();
  }
  // rotina de stories: clicar no cliente na grade de Stories
  const DIAS_R = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  function abreRotina(cli) {
    const r = ((banco && banco.stories) || []).find((x) => x.cliente === cli) || { cliente: cli, dias: [], fixo: '' };
    janela({ ic: IC.rotina, tit: 'Rotina de stories', sub: 'Toque nos dias para incluir ou tirar da rotina. A rotina vale para todas as semanas.', corpo: '<div class="jitem"><b>' + esc(titulo(cli)) + '</b><span>' + ((r.dias || []).length ? plural(r.dias.length, 'dia', 'dias') + ' por semana' : 'Sem rotina') + '</span></div>' +
      '<div class="jdias">' + DIAS_R.map((d, k) => '<button type="button" class="' + ((r.dias || []).includes(k) ? 'on' : '') + '" aria-pressed="' + (r.dias || []).includes(k) + '">' + d + '</button>').join('') + '</div>' +
      '<label class="jcampo"><span>Conteúdo fixo</span><input value="' + esc(r.fixo || '') + '" placeholder="ex.: bastidores, cardápio do dia, depoimento"></label>', ok: 'Salvar rotina', feito: 'Rotina salva.', faz: (j) => window.Grava.setStory(cli, { dias: [...j.querySelectorAll('.jdias button')].map((b, k) => b.classList.contains('on') ? k : -1).filter((k) => k >= 0), fixo: j.querySelector('.jcampo input').value.trim() }),
      monta: (j) => j.querySelectorAll('.jdias button').forEach((b) => { b.onclick = () => { b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on')); }; }) });
  }
  document.addEventListener('click', (e) => { const c = e.target.closest('[data-rotina]'); if (c) abreRotina(c.dataset.rotina); });
  // marcar story publicado (igual ao antigo: um toque marca, outro desmarca; só nos dias da rotina)
  document.addEventListener('click', async (e) => { const b = e.target.closest('[data-story]'); if (!b) return; b.disabled = true; const ok = await window.Grava.marcarStory(b.dataset.story); toast((ok ? 'Story atualizado: ' : 'Guardado: ') + titulo(b.dataset.story.split('|')[0]) + ' · ' + b.dataset.story.split('|')[1].slice(0, 5)); });
  document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-rotina]')) { e.preventDefault(); abreRotina(e.target.dataset.rotina); } });
  // financeiro: marcar pago e comprovante
  const BRL = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  document.addEventListener('click', (e) => {
    const f = window.finAtual;
    if (e.target.closest('#finPagar')) {
      if (!f) return toast('A planilha de vídeos ainda está carregando.');
      janela(f.pg ? { ic: IC.pago, tit: 'Desfazer pagamento de ' + f.rot + '?', sub: 'O mês volta para "Em aberto".', corpo: '<p class="jtxt">Registrado por ' + esc(primeiro(f.pg.por)) + ' em ' + esc(f.pg.em || '') + '.</p>', ok: 'Desfazer pagamento', okCor: 'var(--bad)', feito: 'Pagamento desfeito.', faz: () => window.Grava.setPagoVideo(f.mk, false, null, eu()) }
        : { ic: IC.pago, cor: 'var(--ok)', tit: 'Marcar ' + f.rot + ' como pago?', sub: 'Fica registrado quem marcou e quando. Se a planilha mudar depois, o painel avisa.', corpo: '<div class="jpag"><div><span>Vídeos</span><b>' + f.q + '</b></div><div><span>Por vídeo</span><b>' + BRL(f.VAL) + '</b></div><div><span>Total</span><b class="ouro">' + BRL(f.valor) + '</b></div></div><p class="jtxt">Edição: <b>Camille e Danylo</b>.</p>', ok: 'Marcar como pago', okCor: 'var(--ok)', feito: f.rot + ' marcado como pago.', faz: () => window.Grava.setPagoVideo(f.mk, true, { qtd: f.q, valor: f.valor, ids: f.ids }, eu()) });
    }
    if (e.target.closest('#finComp')) {
      if (!f) return toast('A planilha de vídeos ainda está carregando.');
      const grupos = {}; f.per.forEach((v) => { (grupos[v.cliente] = grupos[v.cliente] || []).push(v); });
      janela({ ic: IC.recibo, tit: 'Comprovante · ' + f.rot, sub: 'Comprovante de edição de vídeos, pronto para salvar em PDF.', corpo: '<div class="jrecibo"><div class="jr-cab"><div><span>Comprovante de edição de vídeos</span><b>' + f.rot + '</b></div><img src="/assets/flower-gold-512.png" alt="YAMB"></div>' +
        '<div class="jpag"><div><span>Editora</span><b>Camille e Danylo</b></div><div><span>Vídeos</span><b>' + f.q + '</b></div><div><span>Total</span><b class="ouro">' + BRL(f.valor) + '</b></div></div>' +
        '<table><thead><tr><th>Entrega</th><th>Vídeo</th><th>Qtd.</th><th>Valor</th></tr></thead><tbody>' + Object.entries(grupos).map(([c, l]) => '<tr class="g"><td colspan="2">' + esc(titulo(c)) + '</td><td>' + l.reduce((a, v) => a + v.qtd, 0) + '</td><td>' + BRL(l.reduce((a, v) => a + v.qtd, 0) * f.VAL) + '</td></tr>' + l.map((v) => '<tr><td>' + (v.data ? p2(v.data.getDate()) + '/' + p2(v.data.getMonth() + 1) : '—') + '</td><td>' + esc(v.titulo || v.link || '—') + '</td><td>' + v.qtd + '</td><td>' + BRL(v.qtd * f.VAL) + '</td></tr>').join('')).join('') + '</tbody></table><p class="jr-rod">YAMB · Marketing &amp; Branding</p></div>',
        ok: 'Salvar em PDF', feito: 'Abri a impressão: escolha "Salvar como PDF".', faz: () => { const w = window.open('', '_blank'); if (!w) throw new Error('libere as janelas pop-up para gerar o comprovante');
          w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Comprovante · Vídeos ' + f.rot + '</title><style>body{font:14px system-ui,sans-serif;margin:40px;color:#121212}h1{margin:4px 0 18px;font-size:26px}.ov{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#A86B1B}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{text-align:left;padding:6px 4px;border-bottom:1px solid #ddd}td:nth-child(3),td:nth-child(4),th:nth-child(3),th:nth-child(4){text-align:right}tr.g td{font-weight:600;background:#faf3e6}.res{display:flex;gap:28px}.res b{display:block;font-size:18px}footer{margin-top:24px;font-size:12px;color:#666}</style></head><body>' +
            '<span class="ov">Comprovante de edição de vídeos</span><h1>' + f.rot + '</h1><div class="res"><div>Editora<b>Camille e Danylo</b></div><div>Vídeos<b>' + f.q + '</b></div><div>Total<b>' + BRL(f.valor) + '</b></div>' + (f.pg ? '<div>Situação<b>Pago em ' + esc(f.pg.em || '') + '</b></div>' : '') + '</div>' +
            jan.querySelector('table').outerHTML + '<footer>YAMB · Marketing &amp; Branding · gerado em ' + new Date().toLocaleString('pt-BR') + '</footer><scr' + 'ipt>window.onload=()=>setTimeout(()=>window.print(),300)</scr' + 'ipt></body></html>');
          w.document.close(); return true; } });
    }
  });

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
  // acha a demanda citada na notificação ("Reels de CLIENTE — título · ...")
  const itemDaNotif = (n) => {
    const m = String(n.text || '').match(/^(.+?) de (.+?) — (.+?)(?: · .*)?$/); if (!m || !banco) return null;
    const cli = m[2].trim().toLowerCase(), tit = m[3].trim().toLowerCase();
    const l = (banco.items || []).filter((i) => !i.excluido && String(i.cliente).toLowerCase() === cli && String(i.titulo || '').trim().toLowerCase() === tit);
    return l.length ? l[l.length - 1] : null;
  };
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
      const it = itemDaNotif(n);
      html += '<div class="pn' + (nova ? ' nova' : '') + (it ? ' abre' : '') + '"' + (it ? ' data-abre="' + esc(it.id) + '" role="button" tabindex="0" title="Abrir a demanda"' : '') + '><span class="pn-i" style="color:' + cor + '">' + I(ic, 16) + '</span><div class="pn-c"><span class="k">' + esc(n.kind) + '<em>' + quando(n) + '</em></span><span class="pn-t">' + esc(String(n.text).replace(/ · por .*$/, '')) + '</span>' +
        (por ? '<span class="pn-por"><img src="/assets/team/' + por[1] + '.png" alt="">' + esc(primeiro(n.by)) + '</span>' : '') + '</div></div>';
    });
    pop.innerHTML = '<div class="ptit">Notificações' + (novas.length ? '<span class="pn-nv">' + novas.length + ' nova' + (novas.length === 1 ? '' : 's') + '</span>' : '') + '<button type="button" class="pn-x" aria-label="Fechar">' + I('M6 6l12 12M18 6L6 18', 15) + '</button></div>' +
      '<div class="pn-abas" role="tablist"><button type="button" role="tab" data-f="todas" aria-selected="' + (nFil === 'todas') + '" class="' + (nFil === 'todas' ? 'on' : '') + '">Todas <b>' + l.length + '</b></button><button type="button" role="tab" data-f="novas" aria-selected="' + (nFil === 'novas') + '" class="' + (nFil === 'novas' ? 'on' : '') + '">Novas <b>' + novas.length + '</b></button>' +
      (novas.length ? '<button type="button" class="pn-lidas">Marcar como lidas</button>' : '') + '</div>' +
      '<div class="pn-lista">' + (html || '<p class="mut" style="margin:16px 0;font-size:13px;text-align:center">' + (nFil === 'novas' ? 'Nada novo por aqui.' : 'Nenhuma notificação.') + '</p>') + '</div>' +
      '<p class="pn-rod">Na versão final, os avisos também chegam no celular e no computador.</p>';
    pop.querySelector('.pn-x').onclick = (e) => { e.stopPropagation(); fechaPops(); };
    pop.querySelectorAll('[data-f]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); nFil = b.dataset.f; pintaNotif(); }; });
    pop.querySelectorAll('[data-abre]').forEach((d) => { const vai = (e) => { e.stopPropagation(); const id = d.dataset.abre; fechaPops(); abre(id); }; d.onclick = vai; d.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vai(e); } }; });
    const ml = pop.querySelector('.pn-lidas'); if (ml) ml.onclick = (e) => { e.stopPropagation(); marcaLidas(); pintaNotif(); };
  }
  function pintaEuBt() { const u = eu(); $('euNome').textContent = primeiro(u); $('euPapel').textContent = PAPEL_[u] || ''; $('euFoto').src = '/assets/team/' + TEAM[u][1] + '.png'; $('euFoto').alt = ''; btEu.setAttribute('aria-label', 'Você: ' + TEAM[u][0] + '. Opções da conta'); }
  function pintaEu() {
    const u = eu();
    popEu.innerHTML = '<div class="ptit">Você</div>' +
      '<div class="eu-lista"><div class="eu-op on"><img src="/assets/team/' + TEAM[u][1] + '.png" alt=""><span><b>' + esc(TEAM[u][0]) + '</b><em>' + esc(PAPEL_[u]) + '</em></span></div></div>' +
      '<button type="button" class="eu-sair">' + I('M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3', 16) + 'Sair</button>';
    popEu.querySelector('.eu-sair').onclick = (e) => { e.stopPropagation(); fechaPops(); window.sairDoInterno(); };
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

  // menu por pessoa: cada um vê só as áreas dele; a direção vê tudo
  const GESTAO_M = ['gabriel', 'yasmim', 'vitoria'];
  const AREA_TELA = { paineis: ['design', 'video', 'social'], aprovacoes: ['aprovacao'], planejamento: ['planejamento'] };
  function menuPorPessoa() {
    const u = eu(), pn = (TEAM[u] || TEAM.gabriel)[2], tudo = GESTAO_M.includes(u);
    Object.entries(AREA_TELA).forEach(([t, ar]) => { const a = document.querySelector('.trilho [data-tela="' + t + '"]'); if (a) a.hidden = !(tudo || ar.some((x) => pn.includes(x))); });
    const atual = (location.hash || '').slice(1), a = document.querySelector('.trilho [data-tela="' + atual + '"]');
    if (a && a.hidden) location.hash = '#painel';
  }
  menuPorPessoa();
  addEventListener('hashchange', menuPorPessoa);
  $('euSel').addEventListener('change', menuPorPessoa);
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
    $('plTab').innerHTML = l.map((p) => '<tr><td><span class="plcli"><span class="plav">' + esc(titulo(p.cliente).slice(0, 1)) + '</span>' + esc(titulo(p.cliente)) + '</span></td><td>' + esc(p.periodo || '—') + '</td><td>' + esc(p.responsavel || '—') + '</td><td><label class="plsel" style="--c:' + (PCOR[p.status] || 'var(--ink-300)') + '"><span class="sr">Situação de ' + esc(titulo(p.cliente)) + '</span><select data-plano="' + esc(p.cliente) + '">' + PORDER.map((o) => '<option' + (o === p.status ? ' selected' : '') + '>' + o + '</option>').join('') + '</select></label></td><td>' + (p.trello ? '<a href="' + esc(p.trello) + '" target="_blank" rel="noopener">Trello →</a>' : '<span class="mut">—</span>') + '</td></tr>').join('') ||
      '<tr><td colspan="5" class="mut">Nenhum cliente nessa situação.</td></tr>';
    $('plTab').querySelectorAll('[data-plano]').forEach((sel) => { sel.onchange = async () => { sel.disabled = true; const ok = await window.Grava.setPlano(sel.dataset.plano, sel.value); toast(titulo(sel.dataset.plano) + ': ' + sel.value + (ok ? '.' : ' (vai tentar de novo).')); }; });
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
        : '<div class="minha vazia">' + est(0) + '<span class="mut">' + (ehHoje ? 'Ainda sem avaliação.' : 'Sem avaliação neste dia.') + '</span></div>') +
      (ehHoje ? '<div class="av-form"><div class="av-est" role="radiogroup" aria-label="Nota do dia">' + [1, 2, 3, 4, 5].map((n) => '<button type="button" role="radio" data-n="' + n + '" aria-checked="' + (!!minha && minha.nota === n) + '" aria-label="' + n + ' estrela' + (n > 1 ? 's' : '') + ' · ' + AV_ROT[n] + '" class="' + (minha && n <= minha.nota ? 'on' : '') + '">★</button>').join('') + '</div>' +
        '<input class="av-txt" maxlength="200" placeholder="Quer contar algo? (opcional)" value="' + esc(minha ? minha.comentario || '' : '') + '"><button type="button" class="botao av-env">' + (minha ? 'Alterar avaliação' : 'Enviar avaliação') + '</button></div>' : '');
    if (gestao) {
      h += '<div class="avnav"><button type="button" class="chip" id="avAnt" aria-label="Dia anterior">←</button><b>' + DIAS[avDia.getDay()].split('-')[0] + ', ' + ds.slice(0, 5) + '</b><button type="button" class="chip" id="avProx" aria-label="Próximo dia"' + (ehHoje ? ' disabled' : '') + '>→</button></div>' +
        '<div class="avkpi"><div><span class="num">' + (doDia.length ? f1(med(doDia)) : '—') + '</span><span class="mut">Média do dia</span></div><div><span class="num">' + (daSem.length ? f1(med(daSem)) : '—') + '</span><span class="mut">Média da semana</span></div><div><span class="num">' + doDia.length + '/' + Object.keys(TEAM).length + '</span><span class="mut">avaliaram</span></div></div>' +
        (doDia.length ? doDia.slice().sort((a, b) => b.nota - a.nota).map((a) => '<div class="avl"><img class="av" src="/assets/team/' + ((TEAM[a.usuario] || [])[1] || 'gabriel-santos') + '.png" alt=""><span class="elip"><b>' + esc(primeiro(a.usuario)) + '</b> · ' + AV_ROT[a.nota] + (a.comentario ? '<br><span class="mut">“' + esc(a.comentario) + '”</span>' : '') + '</span>' + est(a.nota) + '</div>').join('') : '<p class="mut" style="margin:0">Ninguém avaliou este dia.</p>') +
        (faltam.length && doDia.length ? '<p class="mut" style="margin:0;font-size:11.5px">Sem avaliação: ' + faltam.map(primeiro).join(', ') + '</p>' : '');
    }
    pAv.innerHTML = h;
    let nota = minha ? minha.nota : 0;
    pAv.querySelectorAll('.av-est [data-n]').forEach((b) => { b.onclick = () => { nota = +b.dataset.n; pAv.querySelectorAll('.av-est [data-n]').forEach((x) => { x.classList.toggle('on', +x.dataset.n <= nota); x.setAttribute('aria-checked', String(+x.dataset.n === nota)); }); }; });
    const env = pAv.querySelector('.av-env');
    if (env) env.onclick = async () => { if (!nota) return toast('Toque nas estrelas primeiro.'); env.disabled = true; env.textContent = 'Enviando…'; const ok = await window.Grava.salvarAvaliacao(nota, pAv.querySelector('.av-txt').value, u); toast(ok ? 'Obrigado! Avaliação registrada.' : 'Guardado; a gravação vai tentar de novo.'); };
    if (gestao) {
      $('avAnt').onclick = (e) => { avDia = somaDias(avDia, -1); pintaAval(); };
      $('avProx').onclick = (e) => { if (!ehHoje) { avDia = somaDias(avDia, 1); pintaAval(); } };
    }
  }

  /* ---------- Login de verdade: mesmo usuário e senha do interno de hoje ----------
     Igual ao antigo: confere o resumo SHA-256 de "usuário|senha" no próprio navegador; a senha não é guardada nem enviada.
     A sessão vale enquanto a aba estiver aberta (sessionStorage), como cada pessoa entrava no antigo. */
  const PILOTO = ["gabriel", "vitoria", "yasmim", "vitor"];
  const ACESSO = { vitoria: ['vitoria.almeida', 'b366765602fdb2dc5d61389e83de17aeb6da7d5369850cbd04bcdbb7fc7e8f73'], gabriel: ['gabriel.santos', 'ef855223e5b55d6649a30cd2d607b30c063a2088afebc8470dfd679a0f0a5895'], yasmim: ['yasmim.barbara', 'b2f5cba45c9d33c38aa68dc6451fe020dcd1321702a24ac9969035eede67bc99'], anny: ['anny.vitoria', '9cf2a2bbd0cf39bca6fd04fb8301f198020a1a9e96aea9ad1b307cb1e9cb6a24'], brisa: ['brisa.franca', 'f8cbb523f6e1af7e08c4e8e6969007936d9238301e2fa7b9f364bb757e471af4'], marcus: ['marcus.fontes', '62fbab857890fe44b1a5579e4d17c0e912512ada5ccbadfae8aa99057cae53f9'], camille: ['camille.danylo', '10910c847e101ef6b9e1f24e2b1c56c82bfef4a9d7c893676330b9f3f5d707dc'], yngra: ['yngra.lyriel', '41d2b7ec2f0d0c1bcc8092869ac7d636b4c9f6b69d0f4b2493499a562423247f'], vitor: ['vitor.nascimento', 'a4859f403fed0d324001a307a02aa771520b8d6eb823c39e73999d1d54209495'] };
  const sha = async (t) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const sessao = { ler: () => { try { const v = sessionStorage.getItem('yamb-piloto-sessao'); return ACESSO[v] && PILOTO.includes(v) ? v : null; } catch (x) { return null; } },
    gravar: (v) => { try { v ? sessionStorage.setItem('yamb-piloto-sessao', v) : sessionStorage.removeItem('yamb-piloto-sessao'); } catch (x) {} } };
  const fixaEu = (id) => { const sel = $('euSel'); if (sel && sel.value !== id) { sel.value = id; sel.dispatchEvent(new Event('change')); } };
  function porteiro() {
    const quem = sessao.ler(), aqui = (location.hash || '#painel').slice(1);
    if (!quem) { if (aqui !== 'login') location.hash = '#login'; return; }
    fixaEu(quem);
    if (aqui === 'login' || aqui === 'aviso-8h') location.hash = '#painel';
  }
  window.sairDoInterno = () => { sessao.gravar(null); location.hash = '#login'; };
  const PAPEL = { vitoria: 'Direção de Conteúdo', gabriel: 'COO / Branding', yasmim: 'CEO / Diretora Geral', anny: 'Planejamento', brisa: 'Social Media', marcus: 'Designer Gráfico', camille: 'Edição de Vídeo', yngra: 'Secretária', vitor: 'Administrativo' };
  const loginDe = (k) => ACESSO[k][0];
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
    $('lgForm').onsubmit = async (e) => {
      e.preventDefault();
      const al = alvoDe(lgUsr.value), senha = lgPwd.value;
      if (!lgUsr.value.trim() || !senha) { $('lgErro').textContent = 'Informe usuário e senha.'; return; }
      const certo = al && (await sha(ACESSO[al][0] + '|' + senha)) === ACESSO[al][1];
      lgPwd.value = ''; // a senha não fica guardada em lugar nenhum
      if (!certo) { $('lgErro').textContent = 'Usuário ou senha incorretos.'; lgPwd.focus(); return; }
      if (!PILOTO.includes(al)) { $('lgErro').textContent = 'Você ainda não está no piloto. Use o interno de sempre: yamb.com.br/interno/'; return; }
      sessao.gravar(al); lgUsr.value = ''; pintaLogin();
      porteiro();
    };
  }
  addEventListener('hashchange', porteiro);
  porteiro();

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

  const abrePeloEndereco = () => { const m = location.hash.match(/^#demanda\/(.+)$/); if (m && banco && gav.hidden) { if (!abre(decodeURIComponent(m[1]))) history.replaceState(null, '', location.pathname + '#painel'); } };
  addEventListener('hashchange', abrePeloEndereco);
  window.pintaExtras = (b) => { banco = b; abrePeloEndereco(); contadores(); if (!$('plTab').contains(document.activeElement)) pintaPlan(); if (!pop.hidden) pintaNotif(); if (!pAv.contains(document.activeElement)) pintaAval(); };
  pintaEuBt();
  $('euSel').addEventListener('change', () => { pintaEuBt(); contadores(); pintaAval(); if (banco) ['pintaIndicadores', 'pintaPaineis', 'pintaAprov', 'pintaCadastro'].forEach((f) => window[f] && window[f](banco)); });
})();
