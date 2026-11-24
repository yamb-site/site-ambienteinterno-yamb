#!/usr/bin/env python3
"""Gera a VERSÃO DE TESTE completa do ambiente interno em interno/previa/app/.

Entrada: interno/index.html (o interno atual, já com o tema).
Saída:   interno/previa/app/index.html — todas as telas, no visual futurista do painel novo,
         em MODO TESTE: lê os dados reais, mas nada do que for feito é gravado na planilha.

O que faz:
  1. Antes de o app rodar, troca o envio (POST) para a planilha por uma resposta falsa de "ok":
     dá para clicar, cadastrar e mudar status à vontade, só que nada sai do navegador.
  2. Tira o bloco dos avisos obrigatórios (não faz sentido pedir notificação no teste).
  3. Camada visual extra: grade de fundo, luzes douradas, cartões em vidro mais arredondados.
  4. Faixa fixa "Modo teste · nada é salvo" com o atalho de volta ao painel novo (/interno/previa/).

Uso: python3 scripts/previa.py   (rodar de novo sempre que o interno mudar)
"""
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARES = [  # (interno atual, cópia de teste) — computador e celular (o do computador manda celulares para "app/")
    (os.path.join(RAIZ, "interno", "index.html"), os.path.join(RAIZ, "interno", "previa", "app", "index.html")),
    (os.path.join(RAIZ, "interno", "app", "index.html"), os.path.join(RAIZ, "interno", "previa", "app", "app", "index.html")),
]

SHIM = """<script>/* modo teste: nada é gravado */(function(){var f=window.fetch;window.fetch=function(u,o){try{var url=String(u&&u.url||u);var m=String((o&&o.method)||(u&&u.method)||'GET').toUpperCase();if(m==='POST'&&/script\\.google(usercontent)?\\.com/.test(url)){return Promise.resolve(new Response(JSON.stringify({ok:true,rev:Date.now(),teste:true}),{status:200,headers:{'Content-Type':'application/json'}}));}}catch(e){}return f.apply(this,arguments);};window.YAMB_MODO_TESTE=true;})();</script>"""

CSS = """<style>/* visual futurista (versão de teste) */
html,body{background:#050505}
#root{position:relative;background:
  radial-gradient(760px 760px at 100% 45%, rgba(224,154,36,.22), transparent 62%),
  radial-gradient(620px 620px at 15% -10%, rgba(245,200,111,.10), transparent 60%),
  linear-gradient(rgba(247,228,206,.035) 1px, transparent 1px) 0 0/56px 56px,
  linear-gradient(90deg, rgba(247,228,206,.035) 1px, transparent 1px) 0 0/56px 56px,
  #050505 !important}
#root [style*="background: var(--white)"],#root [style*="background: rgb(255, 255, 255)"]{
  background:linear-gradient(160deg, rgba(34,34,34,.66), rgba(14,14,14,.66)) !important;
  border:1px solid rgba(247,228,206,.10) !important;border-radius:24px !important;
  box-shadow:inset 0 1px 0 rgba(247,228,206,.07), 0 24px 60px -24px rgba(0,0,0,.8) !important}
#root button[style*="var(--gold-500)"],#root button[style*="rgb(224, 154, 36)"]{box-shadow:0 0 22px rgba(243,172,47,.35) !important}
/* — trilho lateral: só ícones, abre ao passar o mouse — */
@media (min-width:900px){
#root > aside{flex:0 0 88px !important;width:88px !important;margin:18px !important;border-radius:26px !important;overflow:hidden !important;z-index:60 !important;
  background:linear-gradient(180deg,rgba(30,30,30,.80),rgba(10,10,10,.80)) !important;border:1px solid rgba(247,228,206,.10) !important;
  box-shadow:inset 0 1px 0 rgba(247,228,206,.08) !important;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);
  transition:width .38s cubic-bezier(.2,.8,.2,1),margin-right .38s cubic-bezier(.2,.8,.2,1),box-shadow .3s}
#root > aside:hover{width:256px !important;margin-right:-150px !important;box-shadow:0 30px 80px -20px rgba(0,0,0,.92),0 0 0 1px rgba(243,172,47,.22),inset 0 1px 0 rgba(247,228,206,.08) !important}
#root > aside::before{content:"";position:absolute;left:23px;top:22px;width:42px;height:42px;background:url(/assets/flower-gold-512.png) center/contain no-repeat;filter:drop-shadow(0 0 14px rgba(243,172,47,.6));transition:opacity .25s}
#root > aside:hover::before{opacity:0}
#root > aside > div > div:nth-child(1),#root > aside > div > div:nth-child(2){transition:opacity .25s}
#root > aside:not(:hover) > div > div:nth-child(1),#root > aside:not(:hover) > div > div:nth-child(2){opacity:0}
#root > aside button{position:relative;white-space:nowrap;min-height:48px;transition:all .25s}
#root > aside button > span:nth-child(2){transition:opacity .2s}
#root > aside:not(:hover) button > span:nth-child(2){opacity:0}
#root > aside:not(:hover) button{padding-left:22px !important}
#root > aside:not(:hover) button > span:nth-child(3){position:absolute;left:36px;top:5px;min-width:16px !important;padding:1px 4px !important;font-size:9px !important}
#root > aside button[style*="rgba(224, 154, 36, 0.12)"]{background:rgba(243,172,47,.16) !important;color:#F5C86F !important;
  box-shadow:0 0 22px rgba(243,172,47,.35),inset 0 0 0 1px rgba(243,172,47,.45) !important;border-color:transparent !important}
#root > aside:not(:hover) > div > div:last-child > div:first-child{opacity:0}
#root > aside > span,#root > aside > img{display:none}
}
/* — cabeçalho de cada tela em vidro, título na fonte da marca — */
#root main header{margin:18px 18px 0 0;border-radius:26px;padding:32px 150px 30px 34px !important;overflow:hidden;
  background:linear-gradient(160deg,rgba(36,36,36,.62),rgba(12,12,12,.62));border:1px solid rgba(247,228,206,.10);
  box-shadow:inset 0 1px 0 rgba(247,228,206,.07),0 24px 60px -24px rgba(0,0,0,.8);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
#root main header::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,transparent,#E09A24 30%,#F5C86F 50%,#E09A24 70%,transparent);opacity:.6;box-shadow:0 0 18px rgba(243,172,47,.8)}
#root main header h1{font-family:var(--font-display) !important;font-weight:800 !important;letter-spacing:-.02em !important;font-size:clamp(28px,2.8vw,42px) !important;line-height:1 !important}
#root main > div[style*="position: absolute"]{top:36px !important;right:40px !important}
#root main > div[style*="position: absolute"] button{background:rgba(28,28,28,.8) !important;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
#root [data-tb="rail"] > div{overflow-x:auto;padding-bottom:4px}
#root [data-tb="rail"] > div > span{flex-shrink:0}
#root [data-tb="rail"] > div > span[style*="flex-direction: column"]{padding:0 8px}
#root [data-tb="rail"] > div > span[style*="height: 1px"]{min-width:18px}
@media (max-width:1100px){#root main header{padding:28px 24px 26px 26px !important;margin-right:0}}
/* — tabelas — */
#root main table th{color:#F3AC2F !important;opacity:.85}
#root main table tbody tr{transition:background .2s}
#root main table tbody tr:hover{background:rgba(243,172,47,.07) !important;box-shadow:inset 3px 0 0 #E09A24}
/* — botões em pílula, filtros e campos — */
#root main button[style*="border-radius: 999px"][style*="transparent"]:hover{border-color:rgba(243,172,47,.55) !important;box-shadow:0 0 14px rgba(243,172,47,.22)}
#root main button[style*="background: var(--bone)"],#root main button[style*="background: var(--ink-900)"][style*="border-radius: 999px"]{box-shadow:0 0 18px rgba(243,172,47,.25)}
#root main input[type="search"],#root main input[type="text"]{caret-color:#F3AC2F}
#root main [style*="border-radius: var(--radius-md)"][style*="background: var(--ink-900)"]{border:1px solid rgba(240,165,148,.35);box-shadow:0 0 24px -6px rgba(194,69,44,.35)}
#root [style*="font-family: var(--font-display)"]{text-shadow:0 0 22px rgba(243,172,47,.28)}
.yamb-teste{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;display:flex;align-items:center;gap:12px;
  padding:9px 10px 9px 16px;border-radius:999px;background:rgba(18,18,18,.92);border:1px solid rgba(243,172,47,.45);
  box-shadow:0 0 24px rgba(243,172,47,.25);font:500 12.5px Sora,system-ui,sans-serif;color:#F7E4CE;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.yamb-teste b{color:#F5C86F;font-weight:600}
.yamb-teste a{padding:7px 14px;border-radius:999px;background:#E09A24;color:#121212;text-decoration:none;font-weight:600}
</style>"""

FAIXA = """<div class="yamb-teste" role="status"><span><b>Modo teste</b> · dados reais, nada é salvo</span><a href="/interno/previa/">← Painel novo</a></div>"""


def gera(ORIGEM, DESTINO):
    s = open(ORIGEM, encoding="utf-8").read()
    # o fim real do <head> é o que vem antes do link "pular" e do #root (há outros dentro de scripts)
    c = re.search(r'</head>(\s*)<body([^>]*)>(\s*)<a class="yamb-pular"', s)
    if not c:
        sys.exit("Não achei o fim do <head> do interno.")
    s = s[:c.start()] + SHIM + CSS + s[c.start():]
    # avisos obrigatórios fora
    s, n = re.subn(r'<script>/\* Avisos de postagens[\s\S]*?</script>', '', s, count=1)
    i = s.rfind('</body>')  # só o último: há "</body>" escritos dentro de scripts
    s = s[:i] + FAIXA + s[i:] if i != -1 else s + FAIXA
    # título
    s = re.sub(r'<title>[^<]*</title>', '<title>YAMB · Interno (teste)</title>', s, count=1)
    os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
    open(DESTINO, "w", encoding="utf-8").write(s)
    print("gerado:", os.path.relpath(DESTINO, RAIZ), "| avisos removidos:", n, "| %.1f MB" % (len(s) / 1e6))


def main():
    for o, d in PARES:
        gera(o, d)


if __name__ == "__main__":
    main()
