# Manutenção do site — registro

Memória do agente `yamb-manutencao` entre revisões. Mais recente primeiro.

## Correções feitas no HTML exportado (reaplicar a cada exportação nova)

_Nenhuma ainda._

## Revisões

### 2026-10-28 — configuração inicial
- Checagem diária automática criada (`scripts/saude.sh` + GitHub Actions *Saúde do site*): site-yamb.pages.dev ok.
- `yamb.com.br` (servidor antigo): `README.md` público, `http://` sem redirecionar para `https://`, `/interno/` sem cabeçalho `noindex`. Resolvem-se ao ligar o domínio à Cloudflare Pages.
- Pendente: o HTML inicial da página não tem `<h1>` (o texto é montado por JavaScript) — avaliar versão do conteúdo principal em HTML puro.
