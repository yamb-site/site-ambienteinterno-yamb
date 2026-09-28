# YAMB — site institucional + ambiente interno

Site estático, sem build. Cada página é um arquivo HTML autocontido (fontes, CSS e imagens embutidos).
Hospedagem: **Cloudflare Pages**, ligado a este repositório. Domínio `yamb.com.br` (DNS na Cloudflare).

## Estrutura

```
index.html          → site institucional  (yamb.com.br)
interno/index.html  → ambiente interno    (yamb.com.br/interno)
_headers            → cabeçalhos de cache e segurança (Cloudflare Pages)
_redirects          → redirecionamentos (Cloudflare Pages)
```

## Publicar

Todo push na `main` publica sozinho. Acompanhe em Cloudflare › Workers & Pages › projeto › Deployments.

```bash
git add .
git commit -m "descrição da mudança"
git push origin main
```

## Configuração inicial (uma vez)

1. Cloudflare › **Workers & Pages** › **Create** › **Pages** › **Connect to Git**
2. Escolha `yamb-site/site-ambienteinterno-yamb`, branch `main`
3. Framework preset: **None** · Build command: *(vazio)* · Build output directory: `/`
4. Depois do primeiro deploy: projeto › **Custom domains** › adicionar `yamb.com.br` e `www.yamb.com.br`
5. Sem www: Cloudflare › yamb.com.br › **Rules › Redirect Rules** › modelo *Redirect from WWW to root*
6. HTTPS: Cloudflare › yamb.com.br › **SSL/TLS › Edge Certificates** › *Always Use HTTPS* ligado

## Ambiente interno

Para proteger `/interno` com login: Cloudflare **Zero Trust › Access › Applications › Add › Self-hosted**,
domínio `yamb.com.br`, caminho `interno`, política liberando os e-mails da equipe.
