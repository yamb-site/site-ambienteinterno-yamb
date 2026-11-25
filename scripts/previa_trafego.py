#!/usr/bin/env python3
"""Gera a prévia do Painel de Tráfego no visual novo: interno/previa/trafego/index.html.

Parte do painel real (interno/trafego/index.html) e:
  - troca o visual para o da prévia do interno (menu lateral, fundo, cartões, abas, login escuro);
  - deixa SÓ LEITURA: qualquer envio ao servidor, menos o login, é barrado no navegador
    (nada pausa, ativa, muda orçamento, aceita sugestão, mexe em acessos ou ajustes);
  - não registra service worker nem manifest (não mexe nos avisos do painel real);
  - links de volta apontam para /interno/previa/.
Rodar de novo sempre que o painel real mudar:  python3 scripts/previa_trafego.py
"""
import pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ORIG = RAIZ / 'interno/trafego/index.html'
DEST = RAIZ / 'interno/previa/trafego/index.html'

s = ORIG.read_text(encoding='utf-8')

def troca(a, b, n=1):
    global s
    c = s.count(a)
    if c != n:
        sys.exit(f'Não achei (achei {c}x, esperava {n}x): {a[:80]!r}')
    s = s.replace(a, b)

# --- só leitura: barra todo envio que não seja o login ---
troca("  function enviar(rota, corpo) {\n",
      "  function enviar(rota, corpo) {\n"
      "    if (rota !== '/entrar') { previaAviso(); return Promise.reject(new Error('Prévia: nada é alterado aqui. Na versão final este botão funciona.')); }\n")
troca("  function lerLocal(k) {",
      "  function previaAviso() { var t = document.getElementById('previa-toast'); if (!t) return; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('on'); }, 3500); }\n"
      "  function lerLocal(k) {")
# sem service worker nem manifest
troca('<link rel="manifest" href="/interno/trafego/manifest.webmanifest">', '')
s = s.replace("navigator.serviceWorker.register('/interno/trafego/sw.js', { scope: '/interno/trafego/' })",
              "Promise.reject(new Error('Prévia: os avisos do celular ficam no painel real.'))")
# links de volta
s = s.replace('href="/interno/"', 'href="/interno/previa/"')
s = s.replace('<title>Painel de Tráfego · YAMB</title>', '<title>Tráfego · YAMB (prévia)</title>')
if '<meta name="robots"' not in s:
    s = s.replace('<head>', '<head><meta name="robots" content="noindex, nofollow">', 1)

# --- menu lateral igual ao da prévia ---
def ico(p):
    return ('<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + p + '"/></svg>')
MENU = [
    ('painel', 'Painel', 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z'),
    ('visao-geral', 'Visão geral', 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01'),
    ('semana', 'Semana', 'M4 7h16v13H4zM4 11h16M9 3v4M15 3v4'),
    ('stories', 'Stories', 'M12 3a9 9 0 109 9M12 7v5l3 2'),
    ('indicadores', 'Indicadores', 'M4 20V10M10 20V4M16 20v-7M22 20H2'),
    ('paineis', 'Meus painéis', 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4'),
    ('aprovacoes', 'Aprovações', 'M9 12l2 2 4-4M12 3a9 9 0 100 18 9 9 0 000-18z'),
    ('planejamento', 'Planejamento', 'M4 7h16v13H4zM4 11h16M9 3v4M15 3v4M9 16l2 2 4-4'),
    ('cadastrar', 'Cadastrar conteúdo', 'M12 5v14M5 12h14'),
]
trilho = ('<nav class="yr" aria-label="Menu do ambiente interno"><img class="yr-flor" src="/assets/flower-gold-512.png" alt="YAMB">' +
          ''.join(f'<a class="yr-i" href="/interno/previa/#{k}">{ico(p)}<span>{n}</span></a>' for k, n, p in MENU) +
          f'<a class="yr-i on" href="/interno/previa/trafego/" aria-current="page">{ico("M3 17l6-6 4 4 8-8M15 7h6v6")}<span>Tráfego</span></a>'
          '</nav>')
troca('<main class="wrap">', trilho + '\n<main class="wrap">')
troca('</body>', '<div id="previa-toast" role="status">Prévia: nada é alterado aqui. Na versão final este botão funciona.</div>\n'
      '<script>(function(){var n=document.querySelector(".yr"),t=null;function a(){clearTimeout(t);document.body.classList.add("yr-aberto")}'
      'function f(){clearTimeout(t);t=setTimeout(function(){if(!n.matches(":focus-within"))document.body.classList.remove("yr-aberto")},180)}'
      'n.addEventListener("mouseenter",a);n.addEventListener("mouseleave",f);n.addEventListener("focusin",a);n.addEventListener("focusout",function(){setTimeout(function(){if(!n.matches(":hover"))f()},0)});'
      'function m(){document.body.classList.toggle("yr-app",!document.getElementById("painel").hidden)}m();new MutationObserver(m).observe(document.getElementById("painel"),{attributes:true,attributeFilter:["hidden"]});})();</script>\n</body>')

# --- sem a aba "Visão geral": o painel abre direto em Clientes ---
troca("e.aba = e.aba || (e.cliente ? 'cliente' : 'geral');", "e.aba = e.aba || (e.cliente ? 'cliente' : 'clientes'); if (e.aba === 'geral') e.aba = 'clientes';")
troca("'relatorios'].indexOf(e.aba) < 0) e.aba = 'geral';", "'relatorios'].indexOf(e.aba) < 0) e.aba = 'clientes';")
troca("if (e.aba === 'acessos' && !ehAdmin()) e.aba = 'geral';", "if (e.aba === 'acessos' && !ehAdmin()) e.aba = 'clientes';")
troca("!(k === 'aba' && e[k] === 'geral')", "!(k === 'aba' && e[k] === 'clientes')")
troca("var abas = ehCliente() ? [['geral', 'Visão geral'], ", "var abas = ehCliente() ? [")
troca("      : [['geral', 'Visão geral'], ['sugestoes',", "      : [['sugestoes',")
troca("var it = ehCliente() ? [['geral', 'Visão geral', IC.resumo, 0], ", "var it = ehCliente() ? [")
troca("      : [['geral', 'Visão geral', IC.resumo, 0], ['sugestoes',", "      : [['sugestoes',")
troca("(x[0] === 'geral' ? ' aria-current=\"page\"' : '')", "(x[0] === 'clientes' ? ' aria-current=\"page\"' : '')")
troca("link({ aba: ehCliente() ? 'clientes' : 'geral' })", "link({ aba: 'clientes' })")

# --- abre só no painel do cliente (Overview Meta Ads); as abas de antes saem ---
troca("    if (e.aba === 'acessos' && !ehAdmin()) e.aba = 'clientes';\n    return e;",
      "    if (e.aba === 'acessos' && !ehAdmin()) e.aba = 'clientes';\n    e.aba = 'cliente'; e.sub = e.sub || 'resumo'; // prévia: sempre o painel do cliente\n    return e;")
troca("      if (estado.aba === 'cliente' && estado.cliente) return carregarCliente(estado.cliente).then(telaCliente);",
      "      if (!estado.cliente || !g.contas.some(function (c) { return c.id === estado.cliente; })) { var maior = g.contas.slice().sort(function (a, b) { return ((b.totais || {}).gasto || 0) - ((a.totais || {}).gasto || 0); })[0]; if (maior) { estado.cliente = maior.id; history.replaceState(null, '', link({ cliente: maior.id, sub: estado.sub })); } }\n"
      "      if (estado.aba === 'cliente' && estado.cliente) return carregarCliente(estado.cliente).then(telaCliente);")
troca("}).join('') + '<hr><a href=\"' + link({ aba: 'clientes' }) + '\">' + IC.painel + '<span>' + (ehCliente() ? 'Suas contas' : 'Todos') + '</span></a></nav>'",
      "}).join('') + '</nav>'")

# --- modo embutido: quando abre dentro do ambiente interno (?embed=1), some o menu próprio e o fundo ---
troca('<head>', '<head><script>if(/[?&]embed\\b/.test(location.search))document.documentElement.classList.add("embed")</script>')

# --- visual novo ---
CSS = r'''
/* ===== visual novo (prévia) ===== */
@font-face{font-family:"Monument Extended";src:url("/assets/fonts/MonumentExtended-Ultrabold.otf") format("opentype");font-weight:800;font-display:swap}
html{zoom:.9;background:#050505}
body{background:#050505}
body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(247,228,206,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(247,228,206,.035) 1px,transparent 1px);background-size:56px 56px}
/* menu lateral (só dentro do painel) */
.yr{display:none}
body.yr-app .yr{position:fixed;left:26px;top:26px;bottom:auto;z-index:30;width:84px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:18px 0;border-radius:26px;background:linear-gradient(180deg,rgba(28,28,28,.92),rgba(12,12,12,.92));border:1px solid rgba(247,228,206,.10);box-shadow:inset 0 1px 0 rgba(247,228,206,.08);backdrop-filter:blur(18px);transition:width .22s cubic-bezier(.2,.8,.2,1)}
body.yr-app.yr-aberto .yr{width:236px;align-items:stretch;padding:18px 12px;box-shadow:inset 0 1px 0 rgba(247,228,206,.08),30px 0 60px rgba(0,0,0,.6)}
.yr-flor{width:38px;height:38px;margin:0 0 14px;filter:drop-shadow(0 0 14px rgba(243,172,47,.55));align-self:center}
body.yr-aberto .yr-flor{align-self:flex-start;margin-left:10px}
.yr-i{display:flex;align-items:center;gap:12px;height:42px;width:48px;justify-content:center;border-radius:13px;color:#9A9A9A;text-decoration:none;font-size:13.5px;transition:background .2s,color .2s}
body.yr-aberto .yr-i{width:auto;justify-content:flex-start;padding:0 12px}
.yr-i span{display:none;white-space:nowrap}
body.yr-aberto .yr-i span{display:inline}
.yr-i:hover{color:var(--bone,#F7E4CE);background:rgba(247,228,206,.06)}
.yr-i.on{background:rgba(243,172,47,.16);color:#F5C86F;box-shadow:0 0 22px rgba(243,172,47,.35),inset 0 0 0 1px rgba(243,172,47,.45)}
body.yr-app .wrap{max-width:1560px;padding:26px 26px 72px 136px}
/* topo: título grande como nas outras telas */
.barra-topo .logo,.barra-topo .sep{display:none}
.barra-topo .nome{font-size:11px;letter-spacing:.22em;color:var(--gold)}
.abertura{border-radius:24px;background:linear-gradient(160deg,rgba(34,34,34,.66),rgba(14,14,14,.66));box-shadow:inset 0 1px 0 rgba(247,228,206,.07),0 24px 60px -24px rgba(0,0,0,.8)}
.abertura h1,.titulo-luz{font-family:"Monument Extended","Arial Black",sans-serif;font-weight:800;letter-spacing:-.02em;line-height:1.02}
.abertura h1 em,.titulo-luz em{font-weight:800}
.abertura h1{font-size:clamp(28px,3vw,40px);max-width:22ch}
.periodos button[aria-pressed=true]{background:#E09A24;color:#121212;box-shadow:0 0 18px rgba(243,172,47,.35)}
/* abas como chips da prévia */
.abas{background:none;border:0;padding:0;gap:8px;backdrop-filter:none;-webkit-backdrop-filter:none;flex-wrap:wrap;width:auto}
.abas a{height:38px;display:inline-flex;align-items:center;padding:0 16px;border:1px solid rgba(247,228,206,.14);font-size:13px;color:var(--ink-200,#C6C6C6)}
.abas a[aria-current=page]{background:rgba(243,172,47,.16);border-color:rgba(243,172,47,.55);color:#F5C86F;box-shadow:0 0 18px rgba(243,172,47,.28);font-weight:600}
/* cartões de vidro iguais aos da prévia */
.vidro{border-radius:24px;background:linear-gradient(160deg,rgba(34,34,34,.66),rgba(14,14,14,.66));box-shadow:inset 0 1px 0 rgba(247,228,206,.07),0 24px 60px -24px rgba(0,0,0,.8)}
.kpi .num,.kpi strong,.kpi b{font-family:"Monument Extended","Arial Black",sans-serif;font-weight:800;letter-spacing:-.02em}
.botao-ouro{background:#E09A24!important;color:#121212!important;box-shadow:0 0 22px rgba(243,172,47,.35)}
/* entrada escura, como o login da prévia */
.cartao-entrar{background:linear-gradient(160deg,rgba(34,34,34,.82),rgba(14,14,14,.82));color:var(--bone,#F7E4CE);border:1px solid rgba(247,228,206,.12);box-shadow:0 34px 90px rgba(0,0,0,.6);backdrop-filter:blur(18px)}
.cartao-entrar .over{color:#F3AC2F}
.cartao-entrar h2{font-family:"Monument Extended","Arial Black",sans-serif;font-weight:800;font-size:30px}
.cartao-entrar p{color:#C6C6C6}
.cartao-entrar .campo{color:#9A9A9A}
.cartao-entrar .entrada input{background:rgba(18,18,18,.7);border-color:rgba(247,228,206,.14);color:#F7E4CE;color-scheme:dark}
.cartao-entrar .entrada input::placeholder{color:#7a7a7a}
.cartao-entrar .entrada svg{color:#9A9A9A}
.cartao-entrar .erro{color:#F0A594}
.cartao-entrar .volta{color:#F5C86F}
/* aviso de só leitura */
html.embed{zoom:1;background:transparent}
html.embed body{background:transparent;min-height:0}
html.embed body::before,html.embed body::after{display:none}
html.embed .yr{display:none!important}
html.embed .wrap,html.embed body.yr-app .wrap{max-width:none;padding:0 4px 40px!important}
html.embed #ir-interno,html.embed .cartao-entrar .volta{display:none}
html.embed .entrar-arte{display:none}
html.embed #entrar:not([hidden]){display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 48px);padding:0;grid-template-columns:none}
html.embed .cartao-entrar{justify-self:center;margin:0 auto}
html.embed .cartao-entrar::before{content:"Para ver as campanhas, entre uma vez com o seu acesso do Tráfego. Na versão final, o login do ambiente interno já vale aqui.";display:block;margin:0 0 18px;padding:12px 14px;border-radius:14px;background:rgba(243,172,47,.08);border:1px solid rgba(243,172,47,.3);color:#F5C86F;font-size:12.5px;line-height:1.5}
#previa-toast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,20px);z-index:80;padding:12px 18px;border-radius:999px;background:rgba(18,18,18,.96);border:1px solid rgba(243,172,47,.45);color:#F7E4CE;font-size:13px;opacity:0;pointer-events:none;transition:all .25s}
#previa-toast.on{opacity:1;transform:translate(-50%,0)}
.yr-selo{display:none}
'''
troca('</style>', CSS + '</style>')

DEST.parent.mkdir(parents=True, exist_ok=True)
DEST.write_text(s, encoding='utf-8')
print('ok:', DEST.relative_to(RAIZ), len(s), 'bytes')
