/* Interno novo no celular (app): topo com avisos, barra de baixo e menu completo em folha. */
(function () {
  const ico = (d) => '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  const ABAS = [
    ['painel', 'Painel', 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z'],
    ['semana', 'Semana', 'M4 7h16v13H4zM4 11h16M9 3v4M15 3v4'],
    ['cadastrar', 'Cadastrar', 'M12 5v14M5 12h14'],
    ['stories', 'Stories', 'M12 3a9 9 0 109 9M12 7v5l3 2'],
  ];
  const topo = document.createElement('header'); topo.className = 'topo-app';
  topo.innerHTML = '<img src="/assets/flower-gold-512.png" alt=""><b id="appTit">YAMB</b><button type="button" id="appNotif" aria-label="Notificações">' + ico('M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 003.4 0') + '<span class="cont" id="appNotifN" hidden></span></button>';
  const abas = document.createElement('nav'); abas.className = 'abas-app'; abas.setAttribute('aria-label', 'Atalhos');
  abas.innerHTML = ABAS.map(([t, n, d]) => '<a href="#' + t + '" data-aba="' + t + '"' + (t === 'cadastrar' ? ' class="meio"' : '') + '>' + ico(d) + '<span>' + n + '</span></a>').join('') +
    '<button type="button" id="appMenu" aria-label="Menu completo" aria-expanded="false">' + ico('M4 7h16M4 12h16M4 17h16') + '<span>Menu</span></button>';
  const veu = document.createElement('div'); veu.className = 'veu-app';
  document.body.append(topo, abas);
  const tr = document.querySelector('.trilho'); tr.parentNode.insertBefore(veu, tr); // mesmo nível do menu, para ficar atrás dele

  const fecha = () => { document.body.classList.remove('gaveta'); document.getElementById('appMenu').setAttribute('aria-expanded', 'false'); };
  document.getElementById('appMenu').onclick = () => { const a = !document.body.classList.contains('gaveta'); document.body.classList.toggle('gaveta', a); document.getElementById('appMenu').setAttribute('aria-expanded', String(a)); };
  veu.onclick = () => { fecha(); const p = document.querySelector('.rpop:not([hidden])'); if (p) document.body.click(); };
  document.addEventListener('click', (e) => { if (e.target.closest('.trilho a.ico')) fecha(); });
  document.getElementById('appNotif').onclick = (e) => { e.stopPropagation(); const b = document.getElementById('btNotif'); if (!b) return; document.body.classList.add('gaveta'); if (document.getElementById('popNotif').hidden) b.click(); };
  // fechar a janela de avisos/usuário também fecha a folha
  new MutationObserver(() => { if (document.body.classList.contains('gaveta') && !document.querySelector('.rpop:not([hidden])') && document.body.dataset.viaSino) { delete document.body.dataset.viaSino; fecha(); } })
    .observe(document.querySelector('.trilho'), { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  document.getElementById('appNotif').addEventListener('click', () => { document.body.dataset.viaSino = '1'; });

  function sincroniza() {
    const t = (location.hash || '#painel').slice(1);
    abas.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.aba === t));
    const n = document.querySelector('.trilho a.ico[data-tela="' + t + '"] .dica');
    document.getElementById('appTit').textContent = n ? n.textContent : (document.title.split('·')[0].trim() || 'YAMB');
    fecha();
    if (t === 'semana') { let n = 0; const vaiHoje = () => { const q = document.querySelector('#tela-semana .quadro'), h = q && q.querySelector('.cab.hoje'); if (!h) { if (++n < 20) setTimeout(vaiHoje, 250); return; } if (matchMedia('(max-width:760px)').matches) q.scrollLeft = h.closest('.dcol').offsetLeft - q.offsetLeft - 18; }; setTimeout(vaiHoje, 150); }
  }
  addEventListener('hashchange', () => { sincroniza(); if (matchMedia('(max-width:760px)').matches) scrollTo(0, 0); });
  addEventListener('load', () => { if (matchMedia('(max-width:760px)').matches) setTimeout(() => scrollTo(0, 0), 0); });
  // contador de avisos acompanha o do menu
  const copiaCont = () => {
    const o = document.getElementById('notifN'), d = document.getElementById('appNotifN'); if (!o || !d) return;
    if (d.hidden !== o.hidden) d.hidden = o.hidden;
    if (d.textContent !== o.textContent) d.textContent = o.textContent;
  };
  const vigia = () => { const o = document.getElementById('notifN'); if (!o) return setTimeout(vigia, 500); new MutationObserver(copiaCont).observe(o, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden'] }); copiaCont(); };
  sincroniza(); vigia();
})();
