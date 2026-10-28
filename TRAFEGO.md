# Tráfego — registro

Memória do **YA - Tráfego**. Mais recente primeiro. **Sem tokens e sem dados de clientes** — este repositório é público.

## 2026-10-28 — passo a passo e edição de volta
- Cada sugestão traz "O que fazer" (tarefas) ou "O que a YA vai fazer" (aplicáveis), com o que acompanhar depois.
- Pedido do dono: botão de edição de volta nas campanhas, conjuntos e anúncios (Pausar/Ativar/Orçamento) e "Editar valor" nas sugestões de orçamento, já preenchido com o valor indicado pela YA. O histórico mostra quando o valor foi ajustado.

## 2026-10-28 — só a YA sugere
- Decisão do dono: nenhuma sugestão é feita por pessoas. Removidos a edição manual (ativar/pausar/orçamento) e o ajuste de regras; a equipe só aceita ou recusa. Aba Ajustes virou Avisos (só notificações). Sugestões, histórico e push assinados pela YA.

## 2026-10-28 — ajustes, edição, push e novas regras
- Aba Ajustes: liga/desliga cada regra e muda os limites; horários e nível dos avisos. Salvo no KV (`config`).
- Edição manual (campanha, conjunto, anúncio): ativar, pausar, orçamento diário (limite de 3× para cima ou para baixo de uma vez), com histórico e Desfazer.
- Nota de saúde (0–100) por cliente.
- Regras novas: custo por resultado subiu (vs período anterior), campanha ativa sem entrega, entrega abaixo do orçamento.
- Push no celular: Web Push próprio (sem serviço de terceiros). Cada pessoa ativa em Ajustes › "Receber neste aparelho" (no iPhone, antes adicionar o painel à Tela de Início). Checagem de hora em hora (cron do Worker); avisa só nas horas marcadas e só o que for novo (não repete por 3 dias).

## 2026-10-28 — sugestões com aceitar/recusar
- Aba Sugestões: regras sobre a média de cada conta (pausar campanha sem resultado; +20% de orçamento na mais eficiente; −20% na cara; tarefas: criativo cansado, CTR baixo, problema no Meta, orçamento total no fim).
- Aceitar aplica no Meta com `META_TOKEN_GERENCIAR` (ads_management), conferindo o estado atual; recusar esconde por 7 dias; histórico com Desfazer no KV `YAMB_TRAFEGO`.
- `META_TOKEN_GERENCIAR` configurado em 2026-10-28 (válido até 2026-12-27). Atenção: no Meta as permissões valem por usuário+app, então o `META_TOKEN` (leitura) também passou a ter `ads_management`. A proteção é o código (só escreve via /decidir e /desfazer). Separação real exigiria um segundo app só para gerenciar, ou portfólio da YAMB com usuários do sistema.

## 2026-10-28 — painel com abas e detalhe por cliente
- App do Meta "YAMB Painel de Trafego" (ID 1871489147340430), sem portfólio, acesso pelo token pessoal do dono (`ads_read`, 60 dias — renovar antes de vencer; o painel avisa com 10 dias).
- Worker `yamb-trafego` (https://yamb-trafego.gabrielsocialm21.workers.dev): `/painel`, `/cliente`, `/contas`, `/token`; segredos `META_TOKEN` e `PAINEL_SENHA` só no cofre da Cloudflare.
- Painel `/interno/trafego/`: abas Visão geral · Clientes · Campanhas · Alertas; por cliente: Resumo · Campanhas · Conjuntos · Anúncios · Público · Dia a dia; categorias por objetivo e plataforma; comparação com o período anterior (mesmo número de dias, logo antes).
- Limite do Worker gratuito: 50 pedidos externos por chamada. A visão geral usa a API em lote (Graph API batch, 50 consultas por pedido). Com mais de ~12 clientes por lote, ainda cabe (1 pedido por 50 consultas).
- Totais incluem campanhas que gastaram no período e já não estão ativas (aparecem como "Sem veiculação agora"), para bater com o Gerenciador de Anúncios. Conferido em 2026-10-28: últimos 7 dias = R$ 520,71, 19 campanhas ativas, 13 contas.

## 2026-10-28 — início
- Decisão: painel em `/interno/trafego/`, dados pela Meta Marketing API (só leitura) através de um Cloudflare Worker que guarda o token como segredo. Google Ads depois.
- Em andamento: criação do app no Meta for Developers (tipo Empresa) + usuário do sistema com `ads_read`.
