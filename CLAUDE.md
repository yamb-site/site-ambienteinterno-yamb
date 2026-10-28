# YAMB — site + ambiente interno

Para qualquer tarefa neste repositório (publicar o site, trocar o interno, conferir o deploy, backup), use o agente `yamb-guardiao` (`.claude/agents/yamb-guardiao.md`) — ele tem as regras e os comandos.

Resumo das regras:
- Tudo que está aqui é publicado na internet. Nunca coloque planilhas, dados ou senhas neste repositório — dados vão só para o `yamb-backup` (privado).
- Publicar = push em `main` nos dois remotes: `pages` (HTTPS com o `gh`) e `origin`.
- Se o interno trocar de planilha ou script, atualize também o `backup.sh` do `yamb-backup`.
