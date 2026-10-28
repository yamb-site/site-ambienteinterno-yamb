# Manutenção do site — registro

Memória do agente `yamb-manutencao` entre revisões. Mais recente primeiro.

## Correções feitas no HTML exportado (reaplicar a cada exportação nova)

_Nenhuma ainda._

## Revisões

### 2026-10-28 — configuração inicial
- Checagem diária automática criada (`scripts/saude.sh` + GitHub Actions *Saúde do site*): site-yamb.pages.dev ok.
- `yamb.com.br` (servidor antigo): `README.md` público, `http://` sem redirecionar para `https://`, `/interno/` sem cabeçalho `noindex`. Resolvem-se ao ligar o domínio à Cloudflare Pages.
- Lighthouse (celular, site-yamb.pages.dev): desempenho **26**, acessibilidade 89, boas práticas 100, SEO 100. LCP 13,2 s, FCP 6,9 s, bloqueio 3,2 s, 2,3 MB. Acessibilidade: contraste insuficiente e alvos de toque pequenos.
- Pendente (🔴 desempenho): página demora ~13 s para mostrar o conteúdo principal no celular — HTML de 2,8 MB com React e imagens embutidas, tudo processado antes de desenhar.
- Pendente: o HTML inicial da página não tem `<h1>` (o texto é montado por JavaScript) — avaliar versão do conteúdo principal em HTML puro.
