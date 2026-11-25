#!/usr/bin/env python3
"""Gera o interno novo do PILOTO (fase 4): interno/piloto/ = interno/novo/ gravando na PLANILHA REAL.
Rodar sempre depois de mudar o interno/novo:  python3 scripts/gera_piloto.py"""
import pathlib, re, hashlib
R = pathlib.Path(__file__).resolve().parent.parent
REAL = 'https://script.google.com/macros/s/AKfycbyPxkrBAfkxtYeqvce4heiS6zqFl6J702Ab_qR2k3EdYooglJ9ZInXmlY4Md2K4JJXi/exec'
TESTE = 'https://yamb-interno-teste.diretoria-c5d.workers.dev/'
PILOTO = ['gabriel', 'vitoria', 'yasmim', 'vitor']  # quem usa o piloto
src, dst = R / 'interno/novo', R / 'interno/piloto'; dst.mkdir(exist_ok=True)
arqs = ['base.js', 'base.css', 'extras.js', 'grava.js', 'app.css', 'app.js']
for f in arqs + ['index.html']:
    s = (src / f).read_text(encoding='utf-8')
    s = s.replace(TESTE, REAL).replace('/interno/novo/', '/interno/piloto/')
    s = s.replace('Cópia de TESTE dos dados', 'Planilha da equipe').replace('Cópia de TESTE', 'Planilha da equipe')
    s = s.replace('Grava na CÓPIA DE TESTE dos dados (não é a planilha da equipe).', 'Grava na planilha da equipe.')
    s = s.replace('· YAMB (teste)', '· YAMB (piloto)').replace("'yamb-novo-sessao'", "'yamb-piloto-sessao'")
    s = s.replace('Ambiente de teste · cópia dos dados · não é o interno da equipe', 'Piloto do interno novo · grava na planilha da equipe')
    s = s.replace('background:#F0A594;color:#121212', 'background:#E09A24;color:#121212')
    if f == 'extras.js':  # só quem está no piloto entra; o resto segue no /interno/
        a = "if (!certo) { $('lgErro').textContent = 'Usuário ou senha incorretos.'; lgPwd.focus(); return; }"
        b = a + "\n      if (!PILOTO.includes(al)) { $('lgErro').textContent = 'Você ainda não está no piloto. Use o interno de sempre: yamb.com.br/interno/'; return; }"
        c = "return ACESSO[v] ? v : null;"
        assert a in s and c in s
        s = s.replace(a, b).replace(c, "return ACESSO[v] && PILOTO.includes(v) ? v : null;")
        s = s.replace('  const ACESSO = {', '  const PILOTO = ' + repr(PILOTO).replace("'", '"') + ';\n  const ACESSO = {', 1)
    (dst / f).write_text(s, encoding='utf-8')
v = hashlib.sha1(b''.join((dst / f).read_bytes() for f in arqs)).hexdigest()[:8]
i = dst / 'index.html'; s = i.read_text(encoding='utf-8')
s = re.sub(r'/interno/piloto/(base\.js|base\.css|extras\.js|grava\.js|app\.css|app\.js)(\?v=[a-z0-9]+)?', r'/interno/piloto/\1?v=' + v, s)
i.write_text(s, encoding='utf-8')
assert TESTE not in ''.join((dst / f).read_text() for f in arqs + ['index.html'])
print('ok: interno/piloto gerado, versão', v)
