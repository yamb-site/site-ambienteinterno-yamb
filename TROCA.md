# Troca do interno para o visual novo

Plano aprovado pelo dono em 2026-11-24. Nada muda no interno da equipe (`/interno/`) até a fase 5.

## Fases
0. Segurança — backup conferido, cópia de teste dos dados, endereço de teste `/interno/novo/`. **Feita em 2026-11-24.**
1. Motor de gravação igual ao do interno antigo: ler, juntar registro a registro pelo `_u` (mais recente vence), gravar `{data}`; notificações. Teste de edição simultânea celular antigo × computador novo (na cópia de teste).
2. Login com os mesmos usuários/senhas (`window.TEAM` + `yambEntrar`). Sai a troca de usuário da prévia.
3. Ações de verdade, uma tela por vez (cada uma testada na cópia e aprovada): mover etapa/sem material/capa → aprovar/ajuste → checklist/postado/não postado → cadastrar → stories → planejamento → financeiro → avaliação/editar/excluir.
4. Piloto com a planilha real (2–3 pessoas), antigo segue no ar; conferência diária contra o backup.
5. Virada: `/interno/` abre o novo; antigo em `/interno/antigo/` por 2–4 semanas. Celular continua indo para `app/`; avisos das 8h mantidos.
6. Opcional: login único com o Tráfego (mudar o Worker) e fechar a planilha (token no Apps Script).

## Peças da fase 0
- Backup: Action `yamb-backup` disparada (commit fa5520d, 2026-11-25 01:17 UTC) = planilha real no mesmo `rev` 1795567171654 (714 itens).
- Cópia de teste: Worker `yamb-interno-teste` (conta diretoria) → https://yamb-interno-teste.diretoria-c5d.workers.dev — mesmo formato do Apps Script (GET `{rev,data}`, POST `{data}` → `{ok,rev}`), KV `DADOS` (chaves `banco` e `anterior`). Não manda push e nunca grava na planilha real. Código em `workers/interno-teste/`.
  - Recarregar com os dados reais de agora (só lê a planilha real): `curl -X POST https://yamb-interno-teste.diretoria-c5d.workers.dev/recarregar -H "Authorization: Bearer $(cat ~/.yamb-interno-teste-token)"`
- Endereço de teste: `/interno/novo/` = cópia da prévia lendo a cópia de teste, com faixa "Ambiente de teste". Ainda só leitura (gravação entra na fase 1).

## Pendências de decisão do dono
- Quem faz o piloto (sugestão: Gabriel, Marcus, Brisa).
- Fechar a planilha (token) agora ou depois.
- Login único com o Tráfego agora ou depois.
