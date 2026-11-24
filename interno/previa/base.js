/* Base das telas novas do interno (versão de teste, só leitura). Usada por cada tela em /interno/previa/<tela>/ */
(() => {
  const SHEET = 'https://script.google.com/macros/s/AKfycbyPxkrBAfkxtYeqvce4heiS6zqFl6J702Ab_qR2k3EdYooglJ9ZInXmlY4Md2K4JJXi/exec';
  const EQUIPE = { gabriel: ['Gabriel', 'gabriel-santos'], marcus: ['Marcus', 'marcus-fontes'], camille: ['Camille', 'camille-danylo'], yasmim: ['Yasmim', 'yasmim-barbara'], vitoria: ['Vitória', 'vitoria-almeida'], brisa: ['Brisa', 'brisa-franca'], anny: ['Anny', 'anny-vitoria'], vitor: ['Vitor', 'vitor-nascimento'], yngra: ['Yngra', 'yngra-lyriel'] };
  const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const DIAS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  const CURTO = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const FLUXO = ['Pendente', 'Produção', 'Pronto', 'Enviado', 'Ajustar', 'Aprovado', 'Não postado', 'Postado'];
  const COR = { 'Pronto': 'var(--ok)', 'Postado': 'var(--ok)', 'Aprovado': 'var(--ok)', 'Pendente': 'var(--ink-300)', 'Produção': 'var(--gold-300)', 'Enviado': 'var(--gold-200)', 'Ajustar': 'var(--bad)', 'Não postado': 'var(--bad)' };
  // mesmo prazo por etapa do ambiente interno (dias parado na etapa até contar como atrasado)
  const LIMITE_DIAS = { 'Sem material': 2, 'Pendente': 3, 'Produção': 3, 'Pronto': 1, 'Enviado': 2, 'Aprovado': 1, 'Não postado': 1 };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const p2 = (n) => String(n).padStart(2, '0');
  const fmt = (d) => p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear();
  const parse = (s) => { const m = String(s || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
  const somaDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const MIN = new Set(['e','de','da','do','das','dos','a','o','em','para','com']);
  const titulo = (s) => String(s || '').toLowerCase().split(/\s+/).map((w, k) => (k && MIN.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const hoje0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

  // mesma conta do ambiente interno (window.diasNaEtapa / window.atrasoDe)
  function diasNaEtapa(i) {
    const h = (i.historico || {})[i.status];
    if (!h) return null;
    let t = h.ts;
    if (!t && h.em) {
      const m = String(h.em).match(/(\d{2})\/(\d{2})/);
      if (m) { const d = new Date(new Date().getFullYear(), +m[2] - 1, +m[1]); if (d > new Date()) d.setFullYear(d.getFullYear() - 1); t = d.getTime(); }
    }
    return t ? Math.floor((Date.now() - t) / 864e5) : null;
  }
  function atraso(i) {
    if (i.semMaterial && i.semMaterial.desde) { const d = Math.floor((Date.now() - i.semMaterial.desde) / 864e5); return d >= LIMITE_DIAS['Sem material'] ? d : 0; }
    const lim = LIMITE_DIAS[i.status];
    if (lim == null) return 0;
    const n = diasNaEtapa(i);
    return n != null && n >= lim ? n : 0;
  }

  const I = (p) => '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + p + '"/></svg>';
  const MENU = [
    ['painel', 'Painel', '/interno/previa/', 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z'],
    ['visao', 'Visão geral', '/interno/previa/visao-geral/', 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01'],
    ['semana', 'Semana de postagem', '/interno/previa/app/', 'M4 7h16v13H4zM4 11h16M9 3v4M15 3v4'],
    ['stories', 'Stories', '/interno/previa/app/', 'M12 3a9 9 0 109 9M12 7v5l3 2'],
    ['indicadores', 'Indicadores', '/interno/previa/app/', 'M4 20V10M10 20V4M16 20v-7M22 20H2'],
    ['cadastrar', 'Cadastrar conteúdo', '/interno/previa/app/', 'M12 5v14M5 12h14'],
    ['trafego', 'Tráfego', '/interno/trafego/', 'M3 17l6-6 4 4 8-8M15 7h6v6'],
  ];

  let eu = (() => { try { return new URLSearchParams(location.search).get('u') || localStorage.getItem('yamb-previa-eu') || 'gabriel'; } catch (e) { return 'gabriel'; } })();
  if (!EQUIPE[eu]) eu = 'gabriel';

  function montaTrilho(ativo, aoTrocar) {
    const nav = $('trilho');
    nav.innerHTML = '<img class="flor" src="/assets/flower-gold-512.png" alt="YAMB">' +
      MENU.map(([k, n, h, p]) => '<a class="ico' + (k === ativo ? ' on' : '') + '" href="' + h + '" aria-label="' + n + '"' + (k === ativo ? ' aria-current="page"' : '') + '>' + I(p) + '<span class="dica">' + n + '</span></a>').join('') +
      '<div class="eu"><img id="euFoto" src="/assets/team/' + EQUIPE[eu][1] + '.png" alt="' + EQUIPE[eu][0] + '">' +
      '<label><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Ver como</span><select id="euSel" aria-label="Ver como">' +
      Object.entries(EQUIPE).map(([k, v]) => '<option value="' + k + '"' + (k === eu ? ' selected' : '') + '>' + v[0] + '</option>').join('') + '</select></label></div>';
    $('euSel').onchange = (e) => {
      eu = e.target.value; Y.eu = eu;
      try { localStorage.setItem('yamb-previa-eu', eu); } catch (x) {}
      $('euFoto').src = '/assets/team/' + EQUIPE[eu][1] + '.png'; $('euFoto').alt = EQUIPE[eu][0];
      aoTrocar && aoTrocar();
    };
  }

  async function carrega(aoChegar) {
    const av = $('aviso');
    try {
      const r = await fetch(SHEET + '?t=' + Date.now());
      const j = await r.json();
      const banco = j.data || j;
      const a = new Date();
      if (av) av.textContent = 'Dados ao vivo do interno · atualizado às ' + p2(a.getHours()) + ':' + p2(a.getMinutes()) + ' · só leitura';
      aoChegar(banco);
    } catch (e) {
      if (av) av.textContent = 'Não consegui ler o interno agora. Tento de novo em 1 minuto.';
    }
  }

  function inicia({ tela, pinta }) {
    montaTrilho(tela, () => Y.banco && pinta(Y.banco));
    const vai = () => carrega((b) => { Y.banco = b; pinta(b); });
    vai(); setInterval(vai, 60000);
  }

  const Y = window.Y = { SHEET, EQUIPE, MESES, DIAS, CURTO, FLUXO, COR, LIMITE_DIAS, $, esc, p2, fmt, parse, somaDias, titulo, hoje0, diasNaEtapa, atraso, inicia, eu, banco: null };
})();
