# YAMB — site + ambiente interno

## "YA, faça…" — os agentes YA

Quando o dono começar um pedido com **"YA"** (ex.: "YA, faz um backup", "YA, o site está lento", "YA, melhora o Google"), escolha o agente YA da área e execute com ele (ferramenta Agent, `subagent_type` = nome abaixo). Não pergunte qual — decida pelo assunto.

| Agente | Chame quando o pedido for sobre |
|---|---|
| **YA - Guardião** (`ya-guardiao`) | publicar/subir o site, exportação nova, ambiente interno, GitHub, Cloudflare, backup das planilhas (fazer, conferir, restaurar) |
| **YA - Manutenção** (`ya-manutencao`) | erro, falha, fora do ar, lento, quebrado, revisão técnica, velocidade, acessibilidade, checagem de saúde |
| **YA - SEO** (`ya-seo`) | SEO, Google, Maps, aparecer nas buscas, palavras-chave, IA citar a YAMB, concorrentes, conteúdo para o site, páginas novas |
| **YA - Tráfego** (`ya-trafego`) | tráfego pago, anúncios, campanhas, Meta/Facebook/Instagram Ads, Google Ads, painel de tráfego no interno, gasto, leads, CPC, CPL |

- Pedido que toca duas áreas: chame os dois em sequência (ex.: exportação nova → Guardião publica, Manutenção confere).
- Pedido que nenhum YA cobre: diga ao dono, em uma frase, que não há um YA para isso e proponha criar um novo (nome "YA - <área>", arquivo `.claude/agents/ya-<area>.md`, mesmo formato dos outros). Só crie com o OK dele.
- Ao responder, diga qual YA fez o trabalho ("YA - SEO: …").

## Regras do repositório

- Tudo que está aqui é publicado na internet. Nunca coloque planilhas, dados ou senhas neste repositório — dados vão só para o `yamb-backup` (privado).
- O site é gerado: `fonte/index.html` → `python3 scripts/otimizar.py` → `index.html`, `servicos/`, `processo/`, `equipe/`, `contato/`, `assets/otim/` e `sitemap.xml`. Não edite esses arquivos à mão.
- OneDrive: às vezes trava arquivos do `.git` por alguns segundos ("Operation timed out"). Espere e tente de novo; não apague nada do `.git`.
- Publicar = push em `main` nos dois remotes: `pages` (HTTPS com o `gh`) e `origin`.
- Se o interno trocar de planilha ou script, atualize também o `backup.sh` do `yamb-backup`.
- Registros: `MANUTENCAO.md` (YA - Manutenção), `SEO.md` (YA - SEO) e `TRAFEGO.md` (YA - Tráfego — sem tokens nem dados de clientes; o repositório é público).
