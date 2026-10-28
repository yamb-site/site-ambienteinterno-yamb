#!/usr/bin/env bash
# Checagem de saúde do site da YAMB. Só lê (GET/HEAD) — não altera nada.
# Uso: bash scripts/saude.sh [endereço-base ...]
# Sai com erro se algo essencial falhar (o GitHub avisa por e-mail).
set -uo pipefail

BASES=("$@")
# yamb.com.br ainda está no servidor antigo (fora deste repositório); quando o domínio
# for ligado à Cloudflare Pages, troque o padrão para https://yamb.com.br.
[ ${#BASES[@]} -eq 0 ] && BASES=(https://site-yamb.pages.dev)

falhas=0
avisos=0
falha() { echo "  ❌ $*"; falhas=$((falhas + 1)); }
aviso() { echo "  ⚠️  $*"; avisos=$((avisos + 1)); }
ok()    { echo "  ✅ $*"; }

for base in "${BASES[@]}"; do
  echo "== $base"

  # Páginas: código 200, tamanho mínimo e tempo de resposta
  for p in / /servicos/ /processo/ /equipe/ /contato/ /interno/ /interno/app/ /robots.txt /sitemap.xml /llms.txt; do
    read -r code size tempo < <(curl -sL -o /dev/null --max-time 60 -w "%{http_code} %{size_download} %{time_total}" "$base$p")
    minimo=100; case $p in /|/interno/*|/servicos/|/processo/|/equipe/|/contato/) minimo=50000 ;; esac
    if [ "$code" != 200 ]; then falha "$p respondeu $code"
    elif [ "${size%.*}" -lt "$minimo" ]; then falha "$p veio quase vazio ($size bytes)"
    elif awk "BEGIN{exit !($tempo > 8)}"; then aviso "$p lento (${tempo}s)"
    else ok "$p ($code, $((${size%.*} / 1024)) KB, ${tempo}s)"; fi
  done

  # Imagens e fontes de amostra
  for a in /assets/logo-yamb-wordmark-gold.png /assets/flower-gold-min.png /assets/fonts/Sora-Regular.ttf; do
    code=$(curl -s -o /dev/null -I --max-time 30 -w "%{http_code}" "$base$a")
    [ "$code" = 200 ] || falha "$a respondeu $code"
  done

  # SEO básico na página inicial
  home=$(curl -sL --max-time 60 "$base/")
  grep -q '<title>[^<]\{5,\}' <<<"$home" || falha "página inicial sem <title>"
  grep -q 'name="description"' <<<"$home" || falha "página inicial sem meta description"
  grep -q 'rel="canonical"' <<<"$home" || aviso "página inicial sem canonical"
  grep -q 'application/ld+json' <<<"$home" || aviso "página inicial sem dados estruturados"

  # Cada página com título, canonical e <h1> próprios
  for p in / /servicos/ /processo/ /equipe/ /contato/; do
    pg=$(curl -sL --max-time 60 "$base$p")
    grep -q "rel=\"canonical\" href=\"https://yamb.com.br$p\"" <<<"$pg" || aviso "$p sem canonical próprio"
    [ "$(grep -o '<h1[ >]' <<<"$pg" | wc -l | tr -d ' ')" -ge 1 ] || aviso "$p sem <h1>"
    rel=$(grep -oE '(href|src)="[a-z][^":]*"' <<<"$pg" | grep -vE '="(mailto|tel|https?|data)' | sort -u | head -3 | tr '\n' ' ')
    [ -z "$rel" ] || falha "$p tem endereço relativo (quebra nas páginas internas): $rel"
  done
  [ "$(curl -sL --max-time 30 "$base/sitemap.xml" | grep -c '<loc>')" -ge 5 ] || aviso "sitemap.xml com menos de 5 endereços"

  # Interno fora do Google
  curl -sI --max-time 30 "$base/interno/" | grep -qi 'x-robots-tag: *noindex' \
    || grep -q 'noindex' <(curl -sL --max-time 60 "$base/interno/" | head -c 20000) \
    || aviso "/interno/ sem noindex"
  grep -q 'Disallow: /interno/' <(curl -sL --max-time 30 "$base/robots.txt") || falha "robots.txt não bloqueia /interno/"

  # Robôs de busca com IA liberados
  robots=$(curl -sL --max-time 30 "$base/robots.txt")
  for bot in GPTBot ClaudeBot PerplexityBot; do
    awk -v b="$bot" 'tolower($0) ~ "user-agent: *"tolower(b) {f=1; next} /^user-agent/ {f=0} f && /^Disallow: *\/$/ {exit 1}' <<<"$robots" \
      || falha "robots.txt bloqueia $bot"
  done

  # Arquivos internos do repositório não podem aparecer
  for p in /README.md /CLAUDE.md /.claude/agents/ya-guardiao.md /.github/workflows/saude.yml /MANUTENCAO.md /SEO.md /TRAFEGO.md /.claude/agents/ya-seo.md; do
    body=$(curl -sL --max-time 30 "$base$p" | head -c 3000)
    grep -qE 'ya-guardiao|ya-manutencao|ya-seo|ya-trafego|YA - SEO|YA - Tráfego|name: |^# YAMB —' <<<"$body" && falha "$p está público"
  done

  # Versão otimizada no ar (scripts/otimizar.py) e exportação original escondida
  tam=$(curl -s -o /dev/null --max-time 60 -w "%{size_download}" "$base/")
  [ "${tam%.*}" -lt 400000 ] || aviso "página inicial com $((${tam%.*} / 1024)) KB — o otimizador rodou na última exportação?"
  code=$(curl -s -o /dev/null --max-time 30 -w "%{http_code}" "$base/fonte/index.html")
  [ "$code" = 200 ] && falha "/fonte/index.html está público"

  # HTTPS
  code=$(curl -s -o /dev/null --max-time 30 -w "%{http_code}" "${base/https:/http:}/")
  case $code in 301|302|307|308) ok "http redireciona para https" ;; *) aviso "http:// não redireciona para https ($code)" ;; esac
done

echo
echo "Resultado: $falhas falha(s), $avisos aviso(s)"
[ "$falhas" -eq 0 ]
