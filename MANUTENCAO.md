# Manutenção do site — registro

Memória do agente `ya-manutencao` entre revisões. Mais recente primeiro.

## 2026-11-24 — robô: artes do Trello → ambiente interno (Worker yamb-trafego)
- Cron `7 * * * *` (roda 6h–22h de Brasília) chama `sincronizarArtes` em `workers/trafego/src/index.js`.
- Busca no Trello (uma busca por dia, `name:"DD/MM"`) os cards "DD/MM DIA - …" dos próximos 7 dias, em todas as áreas de trabalho; ignora quadros EQUIPE/GESTÃO e listas de publicados, reuniões, ideias, finalizados, não gravados.
- Só acrescenta no interno o que falta (compara pelo link do card, por cliente+data+título e pela lista `artes:criados` no KV, para não recriar o que a equipe apagou). Nunca altera nem apaga.
- Padrão: tipo Arte, 12h, Pendente, social brisa, produtor marcus (Caju Gastrô → gabriel), cadastradoPor gabriel. Ajustar em `ARTES_RESPONSAVEL`.
- Antes de gravar guarda cópia no KV (`artes:backup:<ts>`, 14 dias). Último relatório: `GET /artes` (admin); simular: `/artes?rodar=1`; gravar já: `/artes?rodar=1&gravar=1`.
- Segredos: `TRELLO_KEY` (app YAMB em trello.com/power-ups/admin) e `TRELLO_TOKEN` (só leitura, sem validade). Deploy com `CLOUDFLARE_ACCOUNT_ID=c5df7978f2050db99ed01c1c92d04ba6`.
- Limite do plano grátis: ~50 chamadas por rodada — por isso a busca por dia, não quadro a quadro.

## 2026-11-10 — avisos de postagens obrigatórios (push às 8h) no ambiente interno
- Bloco `<script>/* Avisos de postagens …` injetado no fim de `interno/index.html` e `interno/app/index.html`: tela que trava o app até a pessoa ligar as notificações; service worker próprio `interno/sw-avisos.js` (escopo `/interno/avisos-postagens/`, separado do `sw.js` do OneSignal). **Reaplicar o bloco depois de cada exportação nova do interno.**
- Servidor: Worker `yamb-trafego` (rotas `/avisos/*`, segredo `AVISOS_TOKEN`, variável `SHEET_URL`). Todo dia às 8h (cron */15, primeira checagem da hora) envia push com postagens do dia ainda não "Postado" e stories do dia ainda não marcados.

## Correções feitas no HTML exportado (reaplicar a cada exportação nova)

Todas automáticas em `scripts/otimizar.py` (rode depois de cada exportação). Nenhuma manual.

## Revisões

### 2026-11-04 — projeto fora do OneDrive
- O repositório saiu da pasta sincronizada pelo OneDrive (`Área de Trabalho/Claude/PROJETOS/yamb`) para `~/Projetos/yamb`. Motivo: o OneDrive travava o `.git` ("Operation timed out"), deixava `index.lock` e trocava as permissões de 128 arquivos (644→755), o que quase entrou num commit. `core.fileMode=false` fica ligado por segurança.
- Os links `~/.claude/agents/ya-*.md` (exceto o do Guardião, que está no `yamb-backup`) e o `~/.claude/CLAUDE.md` apontam para o lugar novo. A cópia antiga está desatualizada e não deve ser usada.
- O backup das planilhas (`yamb-backup`) continua na pasta do OneDrive; vale mudar também se der problema.

### 2026-10-29 — visual premium (site + interno)
- Site: `scripts/tema-premium.css` (mesmo visual do Painel de Tráfego) entra pelo `otimizar.py`; as seções claras ganham `data-tema` e as variáveis da marca são redefinidas dentro delas. Campos de formulário escuros.
- Conteúdo: depoimentos de exemplo removidos; Yngra Lyriel (Diretora de Brand Culture) na Equipe; fotos da equipe em sépia, como no interno.
- Peso: ícones lucide só os usados (349 → 25 KB); removido o script que recarregava a página a cada 1 min e desinstalava os service workers (inclusive o do push do painel).
- Acessibilidade: foco visível no teclado, link "Pular para o conteúdo".
- Compartilhamento: `assets/og-yamb.jpg` 1200×630 com `og:image:width/height/alt` e `twitter:image`.
- Cuidado no `otimizar.py`: o pacote do design system traz uma cópia em texto do código do site. As trocas de código só valem depois de `</head>…<div id="root">` (senão quebram o pacote).
- Interno: originais em `fonte/interno/` (computador) e `fonte/interno/app/` (celular); `python3 scripts/interno.py` gera `interno/` e `interno/app/` com `scripts/tema-interno.css`, login sem corretor/maiúscula no usuário, foco visível e link de pular. Conferido no modo demonstração do celular (`/interno/app/?demo=<id>&tela=inicio|semana|indicadores`); telas internas do computador só com login — conferir depois de entrar.
- Pendente: restos de deck-stage/TweaksPanel dentro do pacote do design system (mexer é arriscado; melhor na ferramenta de design).

### 2026-10-28 — velocidade
- `scripts/otimizar.py` criado. A exportação original fica em `fonte/index.html`; o `index.html` publicado é gerado.
- HTML da página inicial: 2.776 KB → 177 KB. Fontes ttf/otf embutidas → woff2 (≈690 → 236 KB; o navegador só baixa as usadas). Imagens embutidas → arquivos no tamanho medido (742 → 496 KB). Scripts → arquivos com `defer`.
- "Fotografia" da página pronta no HTML (3 faixas de tela): sem JavaScript, a página antes ficava vazia e agora aparece inteira; título principal (`<h1>`) agora está no HTML para os buscadores.
- Cache de 1 ano para `assets/otim/*` (nomes mudam quando o conteúdo muda).
- Imagem da abertura (flor) com `fetchpriority="high"`.
- **Resultado (Lighthouse celular, 3 medições): desempenho 26 → 78/93/87**, primeiro conteúdo 6,9 s → 0,9–1,3 s, maior elemento 13,2 s → 3,3–5,6 s, bloqueio 3.160 → 30–100 ms, peso 2,3 MB → 0,8 MB. Acessibilidade 89, boas práticas 100, SEO 100 (iguais).
- O que ainda pesa no maior elemento: a flor da abertura entra com animação; o restante do JavaScript (React + design system + ícones lucide) só reduz na ferramenta de design.
- Pendente (acessibilidade, muda o visual — precisa de OK): contraste de alguns textos e alvos de toque pequenos.
- Pendente (arquitetura/SEO): Serviços, Processo, Equipe e Contato não têm endereço próprio (são trocas de tela no mesmo endereço), então o Google só enxerga a página inicial.
- Conferido: capturas em 1440/900/390 px idênticas ao original (diferença só no redimensionamento do logo, invisível); sem erros no console.

### 2026-10-28 — configuração inicial
- Checagem diária automática criada (`scripts/saude.sh` + GitHub Actions *Saúde do site*): site-yamb.pages.dev ok.
- `yamb.com.br` (servidor antigo): `README.md` público, `http://` sem redirecionar para `https://`, `/interno/` sem cabeçalho `noindex`. Resolvem-se ao ligar o domínio à Cloudflare Pages.
- Lighthouse (celular, site-yamb.pages.dev): desempenho **26**, acessibilidade 89, boas práticas 100, SEO 100. LCP 13,2 s, FCP 6,9 s, bloqueio 3,2 s, 2,3 MB. Acessibilidade: contraste insuficiente e alvos de toque pequenos.
- Pendente (🔴 desempenho): página demora ~13 s para mostrar o conteúdo principal no celular — HTML de 2,8 MB com React e imagens embutidas, tudo processado antes de desenhar.
- Pendente: o HTML inicial da página não tem `<h1>` (o texto é montado por JavaScript) — avaliar versão do conteúdo principal em HTML puro.

## 2026-11-24 — notificações de troca de etapa sumiam
- Causa: algumas notificações eram criadas com id `'n' + Date.now()` (13 dígitos); as demais usam `'n' + Date.now() + Math.random()` (14+). Ao gravar, a lista é ordenada pelo número do id e cortada em 30, então essas caíam para o fim e eram cortadas antes de salvar (e o push delas não saía).
- Afetava no computador: mover etapa, pedir ajuste, nova demanda e mais um aviso; no celular: todas as notificações criadas pelo app (`note`).
- Correção: id com `+ Math.random()` em `interno/index.html` (4 pontos), `interno/app/index.html` (1) e nos mesmos arquivos de `fonte/`. **Reaplicar depois de cada exportação nova do interno.**
