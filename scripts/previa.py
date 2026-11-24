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
.yamb-teste{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;display:flex;align-items:center;gap:12px;
  padding:9px 10px 9px 16px;border-radius:999px;background:rgba(18,18,18,.92);border:1px solid rgba(243,172,47,.45);
  box-shadow:0 0 24px rgba(243,172,47,.25);font:500 12.5px Sora,system-ui,sans-serif;color:#F7E4CE;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.yamb-teste b{color:#F5C86F;font-weight:600}
.yamb-teste a{padding:7px 14px;border-radius:999px;background:#E09A24;color:#121212;text-decoration:none;font-weight:600}
</style>"""

FAIXA = """<div class="yamb-teste" role="status"><span><b>Modo teste</b> · dados reais, nada é salvo</span><a href="/interno/previa/">← Painel novo</a></div>"""


def gera(ORIGEM, DESTINO):
    s = open(ORIGEM, encoding="utf-8").read()
    corte = list(re.finditer(r'</head>(\s*)<body([^>]*)>', s))
    if not corte:
        sys.exit("Não achei o fim do <head> do interno.")
    c = corte[-1]
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
