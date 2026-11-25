#!/usr/bin/env python3
"""Cópia do interno ANTIGO apontando para a cópia de TESTE dos dados: interno/novo/antigo/index.html.
Serve para testar o interno novo e o antigo gravando ao mesmo tempo, sem tocar na planilha real.
Tira o aviso das 8h e o OneSignal (nada de push nem de inscrição de aparelho a partir do teste)."""
import pathlib, re, sys
R = pathlib.Path(__file__).resolve().parent.parent
s = (R / 'interno/index.html').read_text(encoding='utf-8')
REAL = 'https://script.google.com/macros/s/AKfycbyPxkrBAfkxtYeqvce4heiS6zqFl6J702Ab_qR2k3EdYooglJ9ZInXmlY4Md2K4JJXi/exec'
TESTE = 'https://yamb-interno-teste.diretoria-c5d.workers.dev/'
n = s.count(REAL); s = s.replace(REAL, TESTE)
if n < 1: sys.exit('não achei a planilha real no interno')
i = s.find('<script>/* Avisos de postagens')
if i >= 0:
    j = s.index('</script>', i) + len('</script>'); s = s[:i] + s[j:]
s = s.replace('https://cdn.onesignal.com', 'https://onesignal.invalid')
s = s.replace('<title>YAMB — Ambiente interno</title>', '<title>Interno ANTIGO · teste</title>')
# não manda o computador para app/ (não existe cópia do app aqui)
s = s.replace("location.replace('app/'", "void(0")
s = s.replace('<body', '<body data-teste', 1)
s = s.replace('</body>', '<div style="position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:99999;padding:5px 14px;border-radius:0 0 12px 12px;background:#F0A594;color:#121212;font:600 11px system-ui;letter-spacing:.12em;text-transform:uppercase">Interno ANTIGO · cópia de teste dos dados</div></body>', 1)
d = R / 'interno/novo/antigo'; d.mkdir(parents=True, exist_ok=True)
(d / 'index.html').write_text(s, encoding='utf-8')
print('ok: planilha trocada', n, 'x; avisos 8h', 'removido' if i >= 0 else 'não achado')
