#!/usr/bin/env python3
"""Fase 5 da TROCA.md: o interno novo vira o /interno/ da equipe.

  python3 scripts/virada.py            -> aplica no repositório (interno/ e interno/antigo/)
  python3 scripts/virada.py --ensaio D -> gera tudo numa pasta D (para conferir sem mexer no repo)

O que faz:
  1. interno/index.html atual (interno antigo) -> interno/antigo/ (com caminhos ajustados)
  2. interno/piloto/ (sem faixa laranja e sem a lista do piloto) -> interno/
     + redirecionamento do celular para app/, manifest e ícone,
     + notificações com o interno aberto (como no antigo),
     + avisos das 8h (obrigatórios) depois do login.
Não grava nada em planilha nenhuma.
"""
import pathlib, re, hashlib, shutil, sys

R = pathlib.Path(__file__).resolve().parent.parent
ensaio = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == '--ensaio' else None
SAIDA = pathlib.Path(ensaio) if ensaio else R
I, P = R / 'interno', R / 'interno/piloto'
ARQS = ['base.js', 'base.css', 'extras.js', 'grava.js']

velho = (I / 'index.html').read_text(encoding='utf-8')
if len(velho) < 1_000_000 or 'Avisos de postagens (push às 8h)' not in velho:
    sys.exit('PARADO: interno/index.html não parece o interno antigo (a virada já foi feita?).')

# ---------- 1. interno antigo -> /interno/antigo/ ----------
ant = velho
troca_ant = [
    ("location.replace('app/'", "location.replace('/interno/app/'"),
    ('url(../../assets/', 'url(../../../assets/'),
]
for a, b in troca_ant:
    assert a in ant, a
    ant = ant.replace(a, b)
da = SAIDA / 'interno/antigo'; da.mkdir(parents=True, exist_ok=True)
(da / 'index.html').write_text(ant, encoding='utf-8')
for f in ['sw.js', 'icon.png', 'manifest.webmanifest']:
    shutil.copy2(I / f, da / f)

# ---------- peças do antigo que o novo precisa manter ----------
m = re.search(r"<script>\(function\(\)\{var q=location\.search.*?</script>", velho)
celular = m.group(0)
assert "location.replace('app/'" in celular
links = '<link rel="manifest" href="/interno/manifest.webmanifest"><link rel="icon" type="image/png" href="/interno/icon.png"><link rel="apple-touch-icon" href="/interno/icon.png">'
celular = celular.replace("location.replace('app/'", "location.replace('/interno/app/'")
m = re.search(r"<script>/\* Notificações do ambiente interno.*?</script>", velho, re.S)
push = m.group(0).replace("register('sw.js')", "register('/interno/sw.js')").replace("const ICON='icon.png'", "const ICON='/interno/icon.png'")
m = re.search(r"<script>/\* Avisos de postagens \(push às 8h\).*?</script>", velho, re.S)
avisos = m.group(0)
a = "if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();"
assert a in avisos
avisos = avisos.replace(a, "function depoisDoLogin() { var s = null; try { s = sessionStorage.getItem('yamb-interno-sessao'); } catch (e) {} if (s) iniciar(); else addEventListener('hashchange', depoisDoLogin, { once: true }); }\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', depoisDoLogin); else depoisDoLogin();")
ponte = """<script>/* Notificação do navegador quando chega aviso novo (como no interno antigo). */
(function () {
  var vistos = null;
  addEventListener('grava:mudou', function () {
    setTimeout(function () {
      if (!window.__minhasNotifs || !window.yambNotify) return;
      var l = window.__minhasNotifs() || [], eu = window.__euInterno && window.__euInterno();
      if (vistos === null) { vistos = new Set(l.map(function (n) { return n.id; })); return; }
      l.forEach(function (n) { if (vistos.has(n.id)) return; vistos.add(n.id); if (n.by && n.by === eu) return; window.yambNotify('YAMB · ambiente interno', String(n.text || '').replace(/<[^>]+>/g, ''), String(n.id)); });
    }, 0);
  });
})();
</script>"""

# ---------- 2. piloto -> /interno/ ----------
for f in ARQS + ['index.html']:
    s = (P / f).read_text(encoding='utf-8')
    s = s.replace('/interno/piloto/', '/interno/').replace("'yamb-piloto-sessao'", "'yamb-interno-sessao'")
    s = s.replace('· YAMB (piloto)', '· YAMB').replace('Neste endereço de teste, a "planilha" é a CÓPIA de teste (Worker yamb-interno-teste).', 'Aqui a "planilha" é a planilha da equipe.')
    if f == 'extras.js':
        for a, b in [
            ("\n      if (!PILOTO.includes(al)) { $('lgErro').textContent = 'Você ainda não está no piloto. Use o interno de sempre: yamb.com.br/interno/'; return; }", ''),
            ('return ACESSO[v] && PILOTO.includes(v) ? v : null;', 'return ACESSO[v] ? v : null;'),
        ]:
            assert a in s, a
            s = s.replace(a, b)
        s = re.sub(r'  const PILOTO = \[[^\]]*\];\n', '', s)
        a = "  const minhas = () => {"
        assert a in s
        i = s.index(a); j = s.index('\n', i)
        s = s[:j + 1] + "  window.__minhasNotifs = minhas; window.__euInterno = eu;\n" + s[j + 1:]
        assert 'PILOTO' not in s
    if f == 'index.html':
        s, n = re.subn(r'<div style="position:fixed;top:0;left:50%[^>]*>Piloto do interno novo · grava na planilha da equipe</div>', '', s)
        assert n == 1, 'faixa do piloto'
        assert s.count('<head>') == 1 and s.count('</body>') == 1
        s = s.replace('<head>', '<head>' + celular + links, 1)
        s = s.replace('</body>', push + avisos + ponte + '</body>', 1)
    (SAIDA / 'interno').mkdir(parents=True, exist_ok=True)
    (SAIDA / 'interno' / f).write_text(s, encoding='utf-8')

v = hashlib.sha1(b''.join((SAIDA / 'interno' / f).read_bytes() for f in ARQS)).hexdigest()[:8]
i = SAIDA / 'interno/index.html'; s = i.read_text(encoding='utf-8')
s = re.sub(r'/interno/(base\.js|base\.css|extras\.js|grava\.js)(\?v=[a-z0-9]+)?', r'/interno/\1?v=' + v, s)
i.write_text(s, encoding='utf-8')
tudo = ''.join((SAIDA / 'interno' / f).read_text() for f in ARQS + ['index.html'])
for proibido in ['yamb-interno-teste', '/interno/piloto/', 'Piloto do interno', 'PILOTO']:
    assert proibido not in tudo, proibido
print('ok: virada gerada em', SAIDA / 'interno', '· versão', v)
