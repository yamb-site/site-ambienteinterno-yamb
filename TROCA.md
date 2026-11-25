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

## Fase 3 · passo 8 — etapa, material e capa (2026-11-24)
- Ligadas de verdade (na cópia de teste), iguais ao `yambAcoesDe` do antigo, com as mesmas notificações: mover etapa, sem material, material recebido, marcar/desfazer capa pronta, precisa / não precisa de capa, quem faz a capa, quem faz a demanda (produção).
- Ficam no painel de detalhes (abre ao clicar em qualquer cartão, inclusive em Meus painéis).
- Testado: as 8 ações gravaram certo; o antigo (desatualizado) gravou outra demanda no meio e nada se perdeu; planilha real intacta.

## Fase 3 · passo 9 — aprovar e pedir ajuste (2026-11-24)
- Aprovar = mover para Aprovado com `{data, por: nome, obs}` (igual ao antigo). Pedir ajuste = Ajustar + `nota` (motivo obrigatório) + notificação "Solicitação de ajuste" (igual ao `setAjuste`).
- No painel de detalhes (clicar no cartão em Aprovações). Testado com a sessão da Brisa: aprovação com observação e ajuste com motivo gravados, histórico com quem e quando, notificações certas; o antigo gravou outra demanda no meio sem perda; planilha real intacta.

## Fase 3 · passos 10 a 15 (2026-11-24, feitos sem pausa a pedido do dono)
- 10 checklist (cada marcação grava; postar não fica travado, igual ao antigo), marcar postado, não postado com motivo.
- 11 cadastrar e notificar (igual ao `addItem`: Pendente, social Brisa, capa do Reels, "Nova demanda cadastrada").
- 12 stories: marcar publicado (toque na bolinha do dia da rotina) e salvar rotina (dias + conteúdo fixo).
- 13 planejamento: seletor de situação por cliente.
- 14 financeiro: marcar pago / desfazer (só direção, com qtd, valor e lista de vídeos) e comprovante que abre a impressão para salvar PDF.
- 15 avaliação do dia (estrelas + comentário no Painel), editar demanda, trocar formato, excluir.
- Teste completo na cópia com o antigo gravando por cima: tudo preservado.
- **Defeito achado e corrigido no motor:** se a releitura automática (15 s) caísse nos 300 ms entre a mudança e a gravação, a mudança local podia ser descartada. Agora a mudança fica marcada como pendente na hora e a releitura junta em vez de substituir. Testado forçando releituras no meio.
- **Trava de segurança:** o motor se recusa a gravar se o resultado tiver menos demandas, planejamentos ou stories marcados do que a planilha já tem.

## Fase 4 — piloto (preparado em 2026-11-24, esperando a equipe)
- Endereço: https://yamb.com.br/interno/piloto/ — o interno novo gravando na PLANILHA REAL (faixa laranja "Piloto do interno novo · grava na planilha da equipe"). Gerado de `interno/novo/` por `python3 scripts/gera_piloto.py` (rodar de novo a cada mudança no novo).
- Conferido: abre pedindo login e só LÊ a planilha até alguém agir; nenhuma gravação foi feita na planilha real pelos testes (rev 1795567171654).
- Para começar: 2–3 pessoas entram em /interno/piloto/ no computador, com o mesmo login, por alguns dias; o resto segue no /interno/. Conferir todo dia a planilha contra o backup.

## Fase 5 — virada (checklist)
1. Backup conferido no dia.  2. `interno/index.html` atual → `interno/antigo/index.html` (e ajustar caminhos relativos).  3. Conteúdo do piloto vira `interno/index.html` (+ base/extras/grava em `interno/`), mantendo o redirecionamento de celular para `app/`, o manifest, o `sw.js` do OneSignal e o bloco dos avisos das 8h após o login.  4. Publicar, limpar cache, conferir.  5. Voltar = repor o `interno/index.html` antigo (minutos).
