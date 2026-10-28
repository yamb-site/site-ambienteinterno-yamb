# Tráfego — registro

Memória do **YA - Tráfego**. Mais recente primeiro. **Sem tokens e sem dados de clientes** — este repositório é público.

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
