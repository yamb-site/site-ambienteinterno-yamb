#!/usr/bin/env python3
"""Otimiza a exportação do site da YAMB para carregar rápido.

Entrada: fonte/index.html (o arquivo exportado da ferramenta de design, sem mexer).
Saída:   index.html + assets/otim/ (gerados — não edite à mão).

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
        fonte = TTFont(io.BytesIO(bruto))
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


# ---------------------------------------------------------------- principal

def monta(fonte_html, tamanhos=None):
    arquivos = {}
    html, familias = extrai_fontes(fonte_html, arquivos)
    html, origem = extrai_imagens(html, arquivos, tamanhos)
    html = externaliza_scripts(html, arquivos)
    return html, arquivos, familias, origem


def publica(pasta, html, arquivos):
    destino = os.path.join(pasta, "assets", "otim")
    if os.path.isdir(destino):
        shutil.rmtree(destino)
    for nome, dados in arquivos.items():
        grava(os.path.join(destino, nome), dados)
    grava(os.path.join(pasta, "index.html"), html.encode("utf-8"))


def main():
    if not os.path.exists(FONTE):
        sys.exit("Falta fonte/index.html (copie a exportação para lá).")
    fonte_html = open(FONTE, encoding="utf-8").read()
    tmp = tempfile.mkdtemp(prefix="yamb-otim-")
    perfil = os.path.join(tmp, "chrome")
    site = os.path.join(tmp, "site")
    shutil.copytree(os.path.join(RAIZ, "assets"), os.path.join(site, "assets"), ignore=shutil.ignore_patterns("otim"))
    srv = servidor(site)
    base = "http://127.0.0.1:%d" % srv.server_address[1]
    try:
        # Passo 1: versão com imagens no tamanho original, para medir.
        html, arquivos, familias, origem = monta(fonte_html)
        publica(site, html.replace("</body>", MEDIR_JS % json.dumps(PAGINAS_MENU) + "</body>", 1), arquivos)
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
        publica(site, html, arquivos)

        # Passo 3: fotografias da página pronta, uma por faixa de tela.
        fotos, css = [], []
        for chave, tela in TELAS.items():
            interno = raiz_renderizada(chrome_dump(base + "/", tela, perfil))
            if len(interno) < 2000:
                sys.exit("Fotografia da página veio vazia (tela %s)." % chave)
            fotos.append('<div class="yamb-foto yamb-foto-%s">%s</div>' % (chave, interno))
            css.append("@media not all and %s{.yamb-foto-%s{display:none}}" % (FAIXAS[chave], chave))
        html = html.replace('<div id="root"></div>', '<div id="root">%s</div>' % "".join(fotos), 1)
        html = re.sub(r"</head>(\s*<body)", "<style>%s</style>\n</head>\\1" % "".join(css), html, count=1)
        publica(RAIZ, html, arquivos)
        kb = lambda n: n // 1024
        print("index.html: %d KB (era %d KB) · assets/otim: %d arquivos, %d KB"
              % (kb(len(html.encode())), kb(len(fonte_html.encode())), len(arquivos), kb(sum(map(len, arquivos.values())))))
    finally:
        srv.shutdown()
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
