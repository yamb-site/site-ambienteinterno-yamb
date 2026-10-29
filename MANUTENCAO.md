# Manutenção do site — registro

Memória do agente `ya-manutencao` entre revisões. Mais recente primeiro.

## Correções feitas no HTML exportado (reaplicar a cada exportação nova)

Todas automáticas em `scripts/otimizar.py` (rode depois de cada exportação). Nenhuma manual.

## Revisões

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
