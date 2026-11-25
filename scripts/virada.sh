#!/bin/bash
# Fase 5 (TROCA.md): vira o interno novo para a equipe, publica e confere.
# Voltar: bash scripts/virada.sh --voltar
set -euo pipefail
cd ~/Projetos/yamb
export CLOUDFLARE_API_TOKEN=$(cat ~/.cf-yamb-token) CLOUDFLARE_ACCOUNT_ID=c5df7978f2050db99ed01c1c92d04ba6

publicar() {
  D=$(mktemp -d)
  rsync -a --exclude .git --exclude fonte --exclude workers --exclude scripts --exclude rascunhos --exclude '*.md' --exclude .claude ./ "$D/"
  npx -y wrangler pages deploy "$D" --project-name site-yamb --branch main --commit-dirty=true 2>&1 | tail -1
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/d002b128bdd3037c7c2c87250ca5f3a7/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
    --data '{"files":["https://yamb.com.br/interno/","https://yamb.com.br/interno/index.html","https://yamb.com.br/interno/antigo/","https://yamb.com.br/interno/antigo/index.html"]}' \
    | python3 -c "import json,sys;print('cache limpo:',json.load(sys.stdin)['success'])"
  git push -q origin HEAD; git push -q pages HEAD
}

if [ "${1:-}" = "--voltar" ]; then
  C=$(git log --format=%H --grep='^Virada: interno novo' -1)
  [ -n "$C" ] || { echo "Nenhuma virada para desfazer."; exit 1; }
  git revert --no-edit "$C"
  publicar
  sleep 20
  curl -s https://yamb.com.br/interno/ | grep -q 'Avisos de postagens (push às 8h)' && echo "VOLTOU: /interno/ é o interno antigo de novo." || { echo "ERRO: conferir /interno/"; exit 1; }
  exit 0
fi

echo "== 1. Conferência da planilha antes da virada"
python3 scripts/piloto_confere.py || { echo "PARADO: algo sumiu da planilha; virada adiada."; exit 1; }
echo "== 2. Gerar"
[ -z "$(git status --porcelain interno)" ] || { echo "PARADO: há mudanças não salvas em interno/."; exit 1; }
python3 scripts/virada.py
echo "== 3. Salvar e publicar"
git add interno
git commit -qm "Virada: interno novo vira o /interno/ da equipe (antigo em /interno/antigo/)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
publicar
echo "== 4. Conferir no ar"
sleep 20
H=$(curl -s https://yamb.com.br/interno/)
V=$(echo "$H" | grep -o 'extras.js?v=[a-z0-9]*' | head -1)
echo "$H" | grep -q "location.replace('/interno/app/'" || { echo "ERRO: sem redirecionamento do celular"; exit 1; }
echo "$H" | grep -q 'Avisos de postagens (push às 8h)' || { echo "ERRO: sem avisos das 8h"; exit 1; }
echo "$H" | grep -q 'Piloto do interno' && { echo "ERRO: faixa do piloto no ar"; exit 1; }
curl -s "https://yamb.com.br/interno/$V" | grep -q 'yamb-interno-sessao' || { echo "ERRO: extras.js novo não está no ar"; exit 1; }
curl -s https://yamb.com.br/interno/antigo/ | grep -q "location.replace('/interno/app/'" || { echo "ERRO: /interno/antigo/ não está no ar"; exit 1; }
echo "PRONTO: interno novo no ar em /interno/, antigo em /interno/antigo/."
