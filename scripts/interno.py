#!/usr/bin/env python3
"""Aplica o visual premium e os ajustes de acessibilidade no ambiente interno.

Entrada: fonte/interno/index.html (computador) e fonte/interno/app/index.html (celular),
         as exportações da ferramenta de design, sem mexer.
Saída:   interno/index.html e interno/app/index.html (gerados — não edite à mão).

O que faz:
  1. Tema escuro (scripts/tema-interno.css): as variáveis claras da marca são
     redefinidas dentro do app, e todos os componentes acompanham.
  2. Login: o campo de usuário não passa pelo corretor nem pela letra maiúscula automática.
  3. Link "pular para o conteúdo" e foco visível no teclado.
O Painel de Tráfego (interno/trafego/) é uma página à parte e não passa por aqui.

Uso (depois de cada exportação nova do interno):
  cp <exportação>/index.html fonte/interno/index.html      (e o do celular em fonte/interno/app/)
  python3 scripts/interno.py
"""
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGINAS = ["interno/index.html", "interno/app/index.html"]
TEMA_CSS = open(os.path.join(RAIZ, "scripts", "tema-interno.css"), encoding="utf-8").read()
CORTE = r'</head>(\s*)<body([^>]*)>(\s*)<div id="root">'


def troca_obrigatoria(html, antes, depois, descricao, contagem=1):
    novo, n = re.subn(antes, depois, html, count=contagem)
    if n == 0:
        sys.exit("Não achei %s — a exportação mudou; ajuste scripts/interno.py." % descricao)
    return novo


def premium(html):
    # O código do app vem depois do <head>; antes disso há cópias em texto dentro do design system.
    corte = re.search(CORTE, html)
    if not corte:
        sys.exit('Não achei o fim do <head> antes de <div id="root">.')
    cabeca, app = html[:corte.start()], html[corte.start():]
    app = troca_obrigatoria(
        app, r'autoComplete: "username",',
        'autoComplete: "username",\n    spellCheck: false,\n    autoCapitalize: "none",',
        "o campo de usuário do login", contagem=0)
    app = troca_obrigatoria(
        app, CORTE,
        lambda m: ('<style id="yamb-tema">\n' + TEMA_CSS + '</style></head>' + m.group(1) + '<body'
                   + m.group(2) + '>' + m.group(3)
                   + '<a class="yamb-pular" href="#root">Pular para o conteúdo</a><div id="root" tabindex="-1">'),
        "o começo do app")
    return cabeca + app


def main():
    for pagina in PAGINAS:
        fonte = os.path.join(RAIZ, "fonte", pagina)
        html = premium(open(fonte, encoding="utf-8").read())
        with open(os.path.join(RAIZ, pagina), "w", encoding="utf-8") as f:
            f.write(html)
        print("  /%-24s %5d KB" % (os.path.dirname(pagina) + "/", len(html.encode()) // 1024))


if __name__ == "__main__":
    main()
