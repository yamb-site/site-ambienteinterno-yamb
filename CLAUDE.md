# YAMB — site + ambiente interno

Dois agentes em `.claude/agents/`:
- `yamb-guardiao` — publicar o site, trocar o interno, conferir o deploy, backup.
- `yamb-manutencao` — erros e falhas, desempenho, acessibilidade, SEO, buscas com IA, arquitetura. Registra o que fez em `MANUTENCAO.md`.

Resumo das regras:
- Tudo que está aqui é publicado na internet. Nunca coloque planilhas, dados ou senhas neste repositório — dados vão só para o `yamb-backup` (privado).
- Publicar = push em `main` nos dois remotes: `pages` (HTTPS com o `gh`) e `origin`.
- Se o interno trocar de planilha ou script, atualize também o `backup.sh` do `yamb-backup`.
