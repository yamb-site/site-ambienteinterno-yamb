# Troca do interno para o visual novo

Plano aprovado pelo dono em 2026-11-24. Nada muda no interno da equipe (`/interno/`) até a fase 5.

## Fases
0. Segurança — backup conferido, cópia de teste dos dados, endereço de teste `/interno/novo/`. **Feita em 2026-11-24.**
   1 (motor) **feita em 2026-11-24** — ver "Fase 1" abaixo.
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

## Fase 1 — motor de gravação (2026-11-24)
- `interno/novo/grava.js`: mesma regra do antigo (lê → junta registro a registro pelo `_u` → grava `{data}`), mesmas normalizações gravadas (status antigos, apelidos de cliente, lista fixa de clientes via `planos`). As telas mostram uma cópia; só o motor mexe nos dados crus. Releitura a cada 15 s com a aba visível. Aviso ao sair com gravação pendente.
- Ação ligada para teste: **Mover etapa** (igual ao `advance0` do antigo: histórico, nota, aprovação, notificação).
- `interno/novo/antigo/` = interno ANTIGO apontando para a cópia de teste (gerado por `scripts/novo_antigo_teste.py`; sem aviso das 8h e sem OneSignal).
- Teste de edição simultânea (`scripts/teste-gravacao/`, simula o antigo com o código de junção copiado do app.js real): antigo muda X → novo move Y sem recarregar → antigo, desatualizado, muda Z. Resultado: X, Y e Z preservados, e a notificação do novo também. Planilha real intacta (rev 1795567171654).
- Mesmo item mexido nos dois ao mesmo tempo: vence a mudança mais recente (igual a hoje entre dois aparelhos).
- **Achado no interno ANTIGO (em produção):** as notificações de troca de etapa usam id `'n' + Date.now()` (13 dígitos), enquanto as outras usam `'n' + Date.now() + Math.random()` (14+ dígitos). Ao gravar, a lista é ordenada pelo número do id e cortada em 30 — as de etapa caem para o fim e são cortadas antes de salvar. Por isso a lista real só tem "Capa pronta", "Demanda editada", "Falta material" e "Conteúdo excluído", e o push de troca de etapa não sai. O novo já usa o formato certo. **Corrigido também no interno da equipe (computador e celular) em 2026-11-24** — ver MANUTENCAO.md.

## Fase 2 — login (2026-11-24)
- `/interno/novo/` só abre com login. Mesmos usuários e resumos de senha do antigo (`data.js`: SHA-256 de "usuário|senha", conferido no navegador; a senha não é guardada nem enviada). Sessão vale enquanto a aba estiver aberta (sessionStorage `yamb-novo-sessao`).
- Saiu a troca de usuário: a janela do usuário mostra só quem está e "Sair". O menu por pessoa e o financeiro só para a direção seguem o usuário logado.
- Testado: senha errada recusada e campo limpo; sem login, qualquer tela volta para o login; sessão aberta cai no Painel da pessoa certa; Sair encerra. O cálculo do resumo confere com o padrão (teste com valor de referência). Não foi testado com senha real (só a equipe digita).
- Pendente para a fase 5: o bloqueio do aviso das 8h (bloco `Avisos de postagens` do antigo) entra depois do login.
- Ainda não: a chave da planilha financeira privada (`__finTok`) — o novo lê a planilha de vídeos pelo link público, como a prévia.
