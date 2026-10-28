#!/usr/bin/env python3
"""Otimiza a exportação do site da YAMB para carregar rápido.

Entrada: fonte/index.html (o arquivo exportado da ferramenta de design, sem mexer).
Saída:   index.html, servicos/ processo/ equipe/ contato/, assets/otim/ e
         sitemap.xml (gerados — não edite à mão).

O que faz, sem mudar o visual:
  1. Fontes embutidas → arquivos .woff2 (o navegador só baixa as que a página usa;
     as usadas de fato são pré-carregadas).
  2. Imagens embutidas → arquivos separados, reduzidos ao maior tamanho em que
     aparecem no site (medido no Chrome, em celular, tablet e computador, ×2 para
     telas retina). Imagens que não aparecem na medição ficam no tamanho original.
  3. Scripts embutidos → arquivos .js com `defer` (mesma ordem), para o navegador
     desenhar a página sem esperar o código.
  4. "Fotografia" da página pronta dentro de <div id="root"> (uma por tamanho de
     tela), para o visitante e os buscadores verem o conteúdo antes do React
     terminar; o React substitui pela versão interativa assim que carrega.
  5. SEO: cada tela do menu ganha endereço próprio (/servicos/, /processo/...),
     com título, descrição, canonical, Open Graph e dados estruturados próprios
     (lista PAGINAS), links reais no menu e sitemap.xml com todos os endereços.

Uso (depois de cada exportação nova):
  cp <exportação>/index.html fonte/index.html
  python3 scripts/otimizar.py
Precisa de: Google Chrome, `pip install --user pillow fonttools brotli`.
"""
import base64
import hashlib
import http.server
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
from html.parser import HTMLParser

from fontTools.ttLib import TTFont
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTE = os.path.join(RAIZ, "fonte", "index.html")
SAIDA = os.path.join(RAIZ, "index.html")
OTIM = os.path.join(RAIZ, "assets", "otim")
URL_OTIM = "/assets/otim"
CHROME = os.environ.get("CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")

# Larguras de tela usadas para medir e fotografar (a de 'm' é a do celular).
TELAS = {"d": (1440, 900), "t": (900, 1100), "m": (390, 844)}
# Faixas em que cada fotografia aparece (as mesmas quebras que o código do site usa: 620 e 1160).
FAIXAS = {"d": "(min-width: 1160px)", "t": "(min-width: 621px) and (max-width: 1159.98px)", "m": "(max-width: 620px)"}
PAGINAS_MENU = ["Início", "Serviços", "Processo", "Equipe", "Contato"]

# SEO (YA - SEO): cada tela do menu ganha endereço, título e descrição próprios.
# chave = nome da tela no código do site (go('servicos')), caminho = endereço publicado.
SITE = "https://yamb.com.br"
PAGINAS = [
    {"chave": "home", "caminho": "/", "nome": "Início",
     "titulo": "YAMB | Agência de Marketing e Branding em Aracaju, SE",
     "descricao": "Agência de marketing e branding em Aracaju (SE): posicionamento, identidade visual, conteúdo para redes sociais, tráfego pago e estrutura comercial. Viva o Processo."},
    {"chave": "servicos", "caminho": "/servicos/", "nome": "Serviços",
     "titulo": "Serviços de Marketing e Branding em Aracaju | YAMB",
     "descricao": "Branding, conteúdo para redes sociais, tráfego pago e estrutura comercial no mesmo lugar. Todo projeto começa pelo diagnóstico. Atendimento presencial em Aracaju, SE."},
    {"chave": "processo", "caminho": "/processo/", "nome": "Processo",
     "titulo": "Processo YAMB: as 12 Pétalas da Marca | Aracaju, SE",
     "descricao": "O método da YAMB: 12 dimensões que conectam identidade, estratégia, posicionamento, conteúdo e resultados, em sete etapas sempre na mesma ordem."},
    {"chave": "equipe", "caminho": "/equipe/", "nome": "Equipe",
     "titulo": "Equipe YAMB | Marketing e Branding em Aracaju, SE",
     "descricao": "Conheça a equipe da YAMB: direção, branding, planejamento, conteúdo, design e audiovisual trabalhando de forma integrada em Aracaju, SE."},
    {"chave": "contato", "caminho": "/contato/", "nome": "Contato",
     "titulo": "Contato | Fale com a YAMB em Aracaju, SE",
     "descricao": "Conte o momento da sua marca e receba um diagnóstico inicial. WhatsApp (79) 99161-5056, diretoria@yamb.com.br. Seg. a sex., 8h às 18h, em Aracaju."},
]
SERVICOS = [
    ("Branding", "Diagnóstico da marca, identidade visual, brandbook e tom de voz."),
    ("Conteúdo para redes sociais", "Planejamento mensal, posts e carrosséis, roteiros e Reels, stories."),
    ("Tráfego pago", "Campanhas, segmentação, otimização e relatórios."),
    ("Estrutura comercial", "Scripts de atendimento, funil e CRM, treinamentos e padronização."),
]
NEGOCIO = {
    "@type": "ProfessionalService", "@id": SITE + "/#yamb", "name": "YAMB",
    "alternateName": ["YAMB · Viva o Processo", "YA Marketing & Branding"],
    "url": SITE + "/", "logo": SITE + "/assets/logo-yamb-lockup-flower-gold.png",
    "image": SITE + "/assets/logo-yamb-lockup-flower-gold.png",
    "description": "Agência de marketing e branding em Aracaju, Sergipe. Analisa o negócio, organiza o posicionamento e desenvolve a comunicação, da identidade aos resultados.",
    "slogan": "Viva o Processo", "email": "diretoria@yamb.com.br", "telephone": "+55 79 99161-5056",
    "address": {"@type": "PostalAddress", "addressLocality": "Aracaju", "addressRegion": "SE", "addressCountry": "BR"},
    "areaServed": [{"@type": "City", "name": "Aracaju"}, {"@type": "State", "name": "Sergipe"}],
    "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "08:00", "closes": "18:00"}],
    "sameAs": ["https://www.instagram.com/yamb_______/"],
    "knowsAbout": ["Branding", "Identidade visual", "Posicionamento de marca", "Social media", "Produção de conteúdo", "Tráfego pago", "Estruturação comercial"],
    "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Serviços", "itemListElement": [
        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": n, "description": d, "areaServed": "Aracaju, SE"}} for n, d in SERVICOS]},
}

DATA_URI = re.compile(r"data:(image/(?:webp|png|jpeg|gif|svg\+xml)|font/(?:ttf|otf|woff2?)|application/font-woff);base64,([A-Za-z0-9+/=]+)")
FONT_FORMAT = re.compile(r"""(url\(\s*["']?%s/fontes/[^"')]+["']?\s*\))\s*format\(\s*["']?(?:truetype|opentype|woff)["']?\s*\)""" % re.escape(URL_OTIM))


def h(b):
    return hashlib.sha256(b).hexdigest()[:12]


def grava(caminho, dados):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, "wb") as f:
        f.write(dados)


# ---------------------------------------------------------------- blocos <script>/<style>

def blocos(html):
    """Blocos <script>/<style> de nível superior, do jeito que o navegador separa
    (o conteúdo termina no primeiro </script> ou </style>)."""
    abre = re.compile(r"<(script|style)\b([^>]*)>", re.I)
    i, out = 0, []
    baixo = html.lower()
    while True:
        m = abre.search(html, i)
        if not m:
            return out
        fim = baixo.find("</" + m.group(1).lower(), m.end())
        fecha = html.find(">", fim) + 1
        out.append((m.start(), fecha, m.group(1).lower(), m.group(2), html[m.end():fim]))
        i = fecha


# ---------------------------------------------------------------- 1. fontes

def extrai_fontes(html, arquivos):
    familias = {}  # url -> (familia, peso)

    def troca(m):
        tipo, b64 = m.group(1), m.group(2)
        if not (tipo.startswith("font/") or "font" in tipo):
            return m.group(0)
        bruto = base64.b64decode(b64)
        fonte = TTFont(io.BytesIO(bruto), recalcTimestamp=False)  # mesmo arquivo a cada execução (cache)
        fonte.flavor = "woff2"
        buf = io.BytesIO()
        fonte.save(buf)
        dados = buf.getvalue()
        nome = "fontes/%s.woff2" % h(dados)
        arquivos[nome] = dados
        return "%s/%s" % (URL_OTIM, nome)

    html = DATA_URI.sub(troca, html)
    html = FONT_FORMAT.sub(lambda m: m.group(1) + " format('woff2')", html)
    for bloco in re.findall(r"@font-face\s*{([^}]*)}", html):
        url = re.search(r"%s/fontes/[0-9a-f]+\.woff2" % re.escape(URL_OTIM), bloco)
        fam = re.search(r"font-family:\s*['\"]?([^;'\"]+)", bloco)
        peso = re.search(r"font-weight:\s*(\d+)", bloco)
        if url and fam:
            familias[url.group(0)] = (fam.group(1).strip(), peso.group(1) if peso else "400")
    return html, familias


# ---------------------------------------------------------------- 2. imagens

def extrai_imagens(html, arquivos, tamanhos=None):
    """Troca imagens embutidas por arquivos. `tamanhos`: {hash_original: largura_px}."""
    origem = {}  # url -> hash do original (para casar com a medição)

    def troca(m):
        tipo, b64 = m.group(1), m.group(2)
        if not tipo.startswith("image/"):
            return m.group(0)
        bruto = base64.b64decode(b64)
        if len(bruto) < 2048:
            return m.group(0)  # ícones minúsculos ficam embutidos
        id_orig = h(bruto)
        ext = {"image/svg+xml": "svg", "image/jpeg": "jpg", "image/gif": "gif"}.get(tipo, "webp")
        dados = bruto
        alvo = (tamanhos or {}).get(id_orig)
        if alvo and ext == "webp":
            img = Image.open(io.BytesIO(bruto))
            if img.width > alvo:
                img = img.resize((alvo, max(1, round(img.height * alvo / img.width))), Image.LANCZOS)
                buf = io.BytesIO()
                img.save(buf, "WEBP", quality=86, method=6)
                if buf.tell() < len(bruto):
                    dados = buf.getvalue()
        elif ext == "webp" and tipo == "image/png":
            buf = io.BytesIO()
            Image.open(io.BytesIO(bruto)).save(buf, "WEBP", lossless=True, method=6)
            dados = buf.getvalue() if buf.tell() < len(bruto) else bruto
            if dados is bruto:
                ext = "png"
        nome = "img/%s.%s" % (h(dados), ext)
        arquivos[nome] = dados
        url = "%s/%s" % (URL_OTIM, nome)
        origem[url] = id_orig
        return url

    return DATA_URI.sub(troca, html), origem


# ---------------------------------------------------------------- 3. scripts

def externaliza_scripts(html, arquivos):
    """Scripts embutidos grandes → arquivos com defer, no <head>, na ordem original."""
    pedacos, i, tags = [], 0, []
    for ini, fim, tipo, attrs, corpo in blocos(html):
        if tipo != "script" or "src=" in attrs or "json" in attrs or len(corpo) < 300:
            continue
        if "serviceWorker" in corpo and len(corpo) < 5000:
            continue  # o script do topo que limpa versões antigas em cache precisa rodar antes de tudo
        dados = corpo.encode("utf-8")
        nome = "js/%s.js" % h(dados)
        arquivos[nome] = dados
        tags.append('<script defer src="%s/%s"></script>' % (URL_OTIM, nome))
        pedacos.append(html[i:ini])
        i = fim
    pedacos.append(html[i:])
    html = "".join(pedacos)
    fim_head = re.search(r"</head>\s*<body", html)
    return html[:fim_head.start()] + "\n".join(tags) + "\n" + html[fim_head.start():]


# ---------------------------------------------------------------- Chrome

class _Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def servidor(pasta):
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), lambda *a, **k: _Silencioso(*a, directory=pasta, **k))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def chrome_dump(url, tela, perfil, tempo=15000):
    w, hgt = tela
    r = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
                        "--window-size=%d,%d" % (w, hgt), "--virtual-time-budget=%d" % tempo,
                        "--user-data-dir=" + perfil, "--dump-dom", url],
                       capture_output=True, text=True, timeout=180)
    return r.stdout


MEDIR_JS = r"""
<script>
(function(){
  var med={}, fontes={};
  function guarda(src, px){ if(!src) return; var k=src.split('#')[0]; med[k]=Math.max(med[k]||0, Math.ceil(px)); }
  function medir(){
    document.querySelectorAll('img').forEach(function(im){
      var r=im.getBoundingClientRect(); if(r.width<1) return;
      var fit=getComputedStyle(im).objectFit, nw=im.naturalWidth||r.width, nh=im.naturalHeight||r.height;
      var px=(fit==='cover') ? Math.max(r.width, r.height*nw/nh) : r.width;
      guarda(im.currentSrc||im.src, px);
    });
    document.querySelectorAll('body *').forEach(function(el){
      var cs=getComputedStyle(el), bg=cs.backgroundImage;
      if(bg && bg!=='none'){ var r=el.getBoundingClientRect(); if(r.width<1) return;
        (bg.match(/url\(["']?([^"')]+)/g)||[]).forEach(function(u){ guarda(u.replace(/url\(["']?/,''), Math.max(r.width, r.height*1.78)); }); }
      if(el.childNodes.length && [].some.call(el.childNodes,function(n){return n.nodeType===3&&n.textContent.trim();}))
        fontes[cs.fontFamily.split(',')[0].replace(/["']/g,'').trim()+'|'+cs.fontWeight]=1;
    });
  }
  var paginas=%s, passo=0;
  function rolar(cb){
    var y=0, max=document.documentElement.scrollHeight;
    (function vai(){ window.scrollTo(0,y); window.dispatchEvent(new Event('scroll')); setTimeout(function(){ medir(); y+=innerHeight*0.5; if(y<max+innerHeight) vai(); else { window.scrollTo(0,0); cb(); } }, 120); })();
  }
  function proxima(){
    if(passo>=paginas.length){ document.documentElement.setAttribute('data-medidas', JSON.stringify({img:med, fontes:Object.keys(fontes)})); return; }
    var alvo=paginas[passo++];
    var bt=[].find.call(document.querySelectorAll('a,button,[role=button],nav *'),function(e){return e.textContent.trim()===alvo;});
    if(bt) bt.click();
    setTimeout(function(){ rolar(proxima); }, 1200);
  }
  setTimeout(proxima, 2500);
})();
</script>
"""


def raiz_renderizada(dump):
    """innerHTML de <div id="root"> no DOM exportado pelo Chrome, sem <script>."""
    ini = dump.find('<div id="root">')
    if ini < 0:
        return ""

    class P(HTMLParser):
        vazios = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

        def __init__(s):
            super().__init__(convert_charrefs=False)
            s.nivel, s.fim = 0, None

        def handle_starttag(s, tag, a):
            if tag not in s.vazios:
                s.nivel += 1

        def handle_endtag(s, tag):
            if tag not in s.vazios:
                s.nivel -= 1
                if s.nivel == 0 and s.fim is None:
                    s.fim = s.getpos()

    p = P()
    trecho = dump[ini:]
    p.feed(trecho)
    if not p.fim:
        return ""
    linhas = trecho.split("\n")
    pos = sum(len(l) + 1 for l in linhas[:p.fim[0] - 1]) + p.fim[1]
    interno = trecho[len('<div id="root">'):pos]
    return re.sub(r"<script\b.*?</script>", "", interno, flags=re.S | re.I)


# ---------------------------------------------------------------- 5. endereços próprios (SEO)

ROTAS_JS = """<script>
(function(){
  var P=%s;
  window.__yambHref=function(k){ for(var i=0;i<P.length;i++) if(P[i].chave===k) return P[i].caminho; return '/'; };
  window.__yambPagina=function(){ var c=location.pathname.replace(/index\\.html$/,''); if(c.slice(-1)!=='/') c+='/';
    for(var i=0;i<P.length;i++) if(P[i].caminho===c) return P[i].chave; return 'home'; };
  window.__yambMeta=function(k){ for(var i=0;i<P.length;i++) if(P[i].chave===k){ var p=P[i]; document.title=p.titulo;
    var d=document.querySelector('meta[name="description"]'); if(d) d.setAttribute('content',p.descricao);
    var c=document.querySelector('link[rel="canonical"]'); if(c) c.setAttribute('href','%s'+p.caminho); } };
})();
</script>
"""

APP_ANTES = re.compile(r"const \[page, setPage\] = React\.useState\('home'\);\s*const go = p => \{\s*setPage\(p\);\s*window\.scrollTo\(0, 0\);\s*\};")
APP_DEPOIS = """const [page, setPage] = React.useState(window.__yambPagina());
  React.useEffect(() => {
    const f = () => { const k = window.__yambPagina(); setPage(k); window.__yambMeta(k); };
    window.addEventListener('popstate', f);
    return () => window.removeEventListener('popstate', f);
  }, []);
  const go = p => {
    setPage(p);
    const u = window.__yambHref(p);
    if (location.pathname !== u) history.pushState(null, '', u);
    window.__yambMeta(p);
    window.scrollTo(0, 0);
  };"""
# Links do menu/rodapé que chamam go(...): href real em vez de "#", para buscadores seguirem.
LINK_GO = re.compile(r'href: "#",(\s*onClick: e => \{\s*e\.preventDefault\(\);\s*(?:setMenu\(false\);\s*)?go\(([^()]+)\);)')


# Primeiro título (SectionHeading) de cada tela interna vira <h1> — a página inicial já tem o seu.
# Os títulos têm estilo próprio no código, então a troca não muda o visual.
H1_ANTES = re.compile(r"(function SectionHeading\(\{[^}]*\}\) \{\s*const center = align === 'center';)(.*?)React\.createElement\(\"h2\", \{", re.S)
H1_DEPOIS = r"""\1
  const __yambTag = React.useRef(null);
  if (__yambTag.current === null) __yambTag.current = window.__yambTemH1 ? 'h2' : (window.__yambTemH1 = true, 'h1');\2React.createElement(__yambTag.current, {"""
APP_H1 = "const P = {"


def rotas(fonte_html):
    html, n = APP_ANTES.subn(APP_DEPOIS, fonte_html, count=1)
    if n != 1:
        sys.exit("Não achei a troca de telas (function App / React.useState('home')) — a exportação mudou; ajuste APP_ANTES.")
    html, n = H1_ANTES.subn(H1_DEPOIS, html, count=1)
    if n != 1:
        sys.exit("Não achei o <h2> do SectionHeading — a exportação mudou; ajuste H1_ANTES.")
    inicio = html.find(APP_H1, html.find("window.__yambHref(p)"))
    html = (html[:inicio] + "if (window.__yambPaginaH1 !== page) { window.__yambPaginaH1 = page; window.__yambTemH1 = page === 'home'; }\n  "
            + html[inicio:])
    # O link do ambiente interno vem relativo ("interno/") e quebraria em /servicos/ etc.
    html, n = re.subn(r'("\.\./internal/index\.html":)"interno/"', r'\1"/interno/"', html)
    if n == 0 and '"interno/"' in html:
        sys.exit('Link "interno/" relativo encontrado em formato novo — ajuste a troca para "/interno/".')
    html, links = LINK_GO.subn(lambda m: "href: window.__yambHref(%s),%s" % (m.group(2), m.group(1)), html)
    dados = json.dumps([{k: p[k] for k in ("chave", "caminho", "titulo", "descricao")} for p in PAGINAS], ensure_ascii=False)
    html = html.replace("<head>", "<head>\n" + ROTAS_JS % (dados, SITE), 1)
    print("endereços próprios: %d telas, %d links do menu com endereço real" % (len(PAGINAS), links))
    return html


def esc(t):
    return t.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


def cabecalho(html, pag):
    """Título, descrição, canonical, Open Graph e dados estruturados próprios da página."""
    url = SITE + pag["caminho"]
    trocas = [
        (r"<title>[^<]*</title>", "<title>%s</title>" % esc(pag["titulo"])),
        (r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % esc(pag["descricao"])),
        (r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s">' % url),
        (r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s">' % esc(pag["titulo"])),
        (r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="%s">' % esc(pag["descricao"])),
        (r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s">' % url),
    ]
    for padrao, novo in trocas:
        html, n = re.subn(padrao, lambda m: novo, html, count=1)
        if n != 1:
            sys.exit("Não achei %s no <head> da exportação." % padrao)
    grafo = [NEGOCIO, {"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "YAMB", "inLanguage": "pt-BR", "publisher": {"@id": SITE + "/#yamb"}},
             {"@type": "WebPage", "@id": url + "#pagina", "url": url, "name": pag["titulo"], "description": pag["descricao"],
              "inLanguage": "pt-BR", "isPartOf": {"@id": SITE + "/#site"}, "about": {"@id": SITE + "/#yamb"}}]
    if pag["caminho"] != "/":
        grafo.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Início", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": pag["nome"], "item": url}]})
    ld = json.dumps({"@context": "https://schema.org", "@graph": grafo}, ensure_ascii=False, separators=(",", ":"))
    html, n = re.subn(r'(<script type="application/ld\+json">).*?(</script>)', lambda m: m.group(1) + ld + m.group(2), html, count=1, flags=re.S)
    if n != 1:
        sys.exit("Não achei o bloco application/ld+json na exportação.")
    return html


def sitemap():
    import datetime
    hoje = datetime.date.today().isoformat()
    urls = "".join("<url><loc>%s%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>\n"
                   % (SITE, p["caminho"], hoje, "1.0" if p["caminho"] == "/" else "0.8") for p in PAGINAS)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n' % urls)


# ---------------------------------------------------------------- principal

def monta(fonte_html, tamanhos=None):
    arquivos = {}
    html, familias = extrai_fontes(fonte_html, arquivos)
    html, origem = extrai_imagens(html, arquivos, tamanhos)
    html = externaliza_scripts(html, arquivos)
    return html, arquivos, familias, origem


def publica(pasta, paginas, arquivos):
    """paginas: {caminho publicado ('/', '/servicos/'...): html}."""
    destino = os.path.join(pasta, "assets", "otim")
    if os.path.isdir(destino):
        shutil.rmtree(destino)
    for nome, dados in arquivos.items():
        grava(os.path.join(destino, nome), dados)
    for caminho, html in paginas.items():
        grava(os.path.join(pasta, caminho.strip("/"), "index.html"), html.encode("utf-8"))


def em_todas(html):
    return {p["caminho"]: html for p in PAGINAS}


def main():
    if not os.path.exists(FONTE):
        sys.exit("Falta fonte/index.html (copie a exportação para lá).")
    fonte_original = open(FONTE, encoding="utf-8").read()
    fonte_html = rotas(fonte_original)
    tmp = tempfile.mkdtemp(prefix="yamb-otim-")
    perfil = os.path.join(tmp, "chrome")
    site = os.path.join(tmp, "site")
    shutil.copytree(os.path.join(RAIZ, "assets"), os.path.join(site, "assets"), ignore=shutil.ignore_patterns("otim"))
    srv = servidor(site)
    base = "http://127.0.0.1:%d" % srv.server_address[1]
    try:
        # Passo 1: versão com imagens no tamanho original, para medir.
        html, arquivos, familias, origem = monta(fonte_html)
        publica(site, em_todas(html.replace("</body>", MEDIR_JS % json.dumps(PAGINAS_MENU) + "</body>", 1)), arquivos)
        larguras, usadas = {}, set()
        for chave, tela in TELAS.items():
            dump = chrome_dump(base + "/", tela, perfil, tempo=60000)
            m = re.search(r"data-medidas=\"([^\"]*)\"", dump)
            if not m:
                sys.exit("A medição no Chrome não terminou (tela %s)." % chave)
            med = json.loads(m.group(1).replace("&quot;", '"').replace("&amp;", "&"))
            for url, px in med["img"].items():
                caminho = url.split(base, 1)[-1]
                if caminho in origem:
                    id_orig = origem[caminho]
                    larguras[id_orig] = max(larguras.get(id_orig, 0), px)
            usadas.update(med["fontes"])
        tamanhos = {k: max(64, int(v * 2)) for k, v in larguras.items()}
        print("imagens medidas: %d de %d" % (len(tamanhos), len(origem)))

        # Passo 2: imagens no tamanho certo + pré-carregamento das fontes usadas.
        html, arquivos, familias, origem = monta(fonte_html, tamanhos)
        preload = []
        for url, (fam, peso) in sorted(familias.items()):
            if "%s|%s" % (fam, peso) in usadas:
                preload.append('<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' % url)
        print("fontes pré-carregadas:", ", ".join(sorted(usadas)))
        html = html.replace("<head>", "<head>\n" + "\n".join(preload), 1) if "<head>" in html else html
        publica(site, em_todas(html), arquivos)

        # Passo 3: fotografias da página pronta — uma por endereço e por faixa de tela.
        css = "".join("@media not all and %s{.yamb-foto-%s{display:none}}" % (FAIXAS[c], c) for c in TELAS)
        base_html = re.sub(r"</head>(\s*<body)", "<style>%s</style>\n</head>\\1" % css, html, count=1)
        paginas = {}
        for pag in PAGINAS:
            fotos = []
            for chave, tela in TELAS.items():
                interno = raiz_renderizada(chrome_dump(base + pag["caminho"], tela, perfil))
                if len(interno) < 2000:
                    sys.exit("Fotografia veio vazia (%s, tela %s)." % (pag["caminho"], chave))
                # A maior imagem da fotografia (a da abertura) é o maior elemento da tela: prioridade alta.
                imgs = [(int(w.group(1)), m.start()) for m in re.finditer(r"<img\b[^>]*>", interno)
                        for w in [re.search(r"width:\s*(\d+)px", m.group(0))] if w]
                if imgs and pag["caminho"] == "/":
                    pos = max(imgs)[1]
                    interno = interno[:pos] + '<img fetchpriority="high"' + interno[pos + 4:]
                fotos.append('<div class="yamb-foto yamb-foto-%s">%s</div>' % (chave, interno))
            h1 = len(re.findall(r"<h1\b", fotos[0]))
            pagina = base_html.replace('<div id="root"></div>', '<div id="root">%s</div>' % "".join(fotos), 1)
            paginas[pag["caminho"]] = cabecalho(pagina, pag)
            print("  %-12s %3d KB · <h1>: %d" % (pag["caminho"], len(paginas[pag["caminho"]].encode()) // 1024, h1))
        publica(RAIZ, paginas, arquivos)
        grava(os.path.join(RAIZ, "sitemap.xml"), sitemap().encode("utf-8"))
        kb = lambda n: n // 1024
        print("página inicial: %d KB (era %d KB) · assets/otim: %d arquivos, %d KB · sitemap: %d endereços"
              % (kb(len(paginas["/"].encode())), kb(len(fonte_original.encode())), len(arquivos), kb(sum(map(len, arquivos.values()))), len(PAGINAS)))
    finally:
        srv.shutdown()
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
