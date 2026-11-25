#!/usr/bin/env python3
"""Conferência diária do piloto do interno novo (fase 4 da TROCA.md).

Só LÊ a planilha da equipe (GET). Guarda uma foto por dia em ~/.yamb-piloto/
e compara com a foto anterior: avisa se alguma demanda, planejamento,
rotina, story marcado, avaliação ou pagamento SUMIU (notifs ficam de fora:
o interno guarda só as 30 mais novas, então elas saem sozinhas).
Sai com código 1 se algo sumiu.
"""
import json, os, sys, urllib.request, datetime, glob

SHEET = 'https://script.google.com/macros/s/AKfycbyPxkrBAfkxtYeqvce4heiS6zqFl6J702Ab_qR2k3EdYooglJ9ZInXmlY4Md2K4JJXi/exec'
PASTA = os.path.expanduser('~/.yamb-piloto')
CHAVE = {'items': 'id', 'planos': 'cliente', 'stories': 'cliente', 'storiesFeitos': 'id',
         'avaliacoes': 'id', 'pagosVideos': 'id'}

os.makedirs(PASTA, exist_ok=True)
anteriores = sorted(glob.glob(os.path.join(PASTA, 'foto-*.json')))
with urllib.request.urlopen(SHEET, timeout=60) as r:
    atual = json.load(r)
agora = datetime.datetime.now().strftime('%Y-%m-%d_%H%M')
with open(os.path.join(PASTA, f'foto-{agora}.json'), 'w') as f:
    json.dump(atual, f, ensure_ascii=False)

d = atual['data']
print(f'Planilha rev {atual["rev"]} · ' + ', '.join(f'{k} {len(v)}' for k, v in d.items()))
if not anteriores:
    print('Primeira foto do piloto guardada.')
    sys.exit(0)

ant = json.load(open(anteriores[-1]))['data']
print(f'Comparando com {os.path.basename(anteriores[-1])}')
sumiu = []
for lista, chave in CHAVE.items():
    antes = {str(x.get(chave)) for x in ant.get(lista, [])}
    agora_ = {str(x.get(chave)) for x in d.get(lista, [])}
    fora = antes - agora_
    novos = agora_ - antes
    print(f'  {lista}: {len(antes)} → {len(agora_)} (+{len(novos)} / -{len(fora)})')
    for k in sorted(fora):
        sumiu.append((lista, k))

if sumiu:
    print('\nATENÇÃO: sumiram registros (pode ser exclusão de propósito; conferir):')
    for lista, k in sumiu:
        item = next((x for x in ant[lista] if str(x.get(CHAVE[lista])) == k), {})
        print(f'  - {lista} {k}: {item.get("cliente", "")} {item.get("titulo", "")}'.rstrip())
    sys.exit(1)
print('\nOK: nada sumiu.')
