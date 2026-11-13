#!/bin/bash
# Renova o token do Meta sem colar nada à mão.
# 1) No Depurador de Token do Meta, estenda o token e copie o NOVO token longo (a caixa que aparece
#    sob "Este novo token de acesso de vida longa expirará em ...", não o campo do topo).
# 2) Rode:  ./token.sh
# O script lê o token da área de transferência, confere no Meta e, se estiver bom, guarda nos
# segredos META_TOKEN e META_TOKEN_GERENCIAR do Worker. O token nunca aparece na tela:
# só tamanho, validade e permissões.
cd "$(dirname "$0")" || exit 1
T=$(printf %s "${TOKEN_IN:-$(pbpaste)}" | tr -d '[:space:]')
if [ -z "$T" ]; then echo "A área de transferência está vazia. Copie o token longo e rode de novo."; exit 1; fi
RESP=$(curl -s -G "https://graph.facebook.com/v25.0/debug_token" --data-urlencode "input_token=$T" --data-urlencode "access_token=$T")
python3 - "$RESP" "${#T}" <<'EOF'
import json, sys, time
d = json.loads(sys.argv[1]); n = sys.argv[2]
x = d.get("data")
if not x:
    print("O Meta recusou o texto copiado como token (tamanho %s):" % n, (d.get("error") or {}).get("message", "sem detalhes"))
    print("Provável causa: foi copiado o texto errado. Copie de novo o token longo e rode ./token.sh.")
    sys.exit(2)
exp = x.get("expires_at") or 0
dias = (exp - time.time()) / 86400 if exp else 9999
escopos = x.get("scopes") or []
precisa = ["ads_read", "ads_management", "instagram_basic", "instagram_manage_insights", "pages_read_engagement"]
falta = [p for p in precisa if p not in escopos]
print("Tamanho: %s caracteres · válido: %s · tipo: %s · app: %s" % (n, x.get("is_valid"), x.get("type"), x.get("application")))
print("Vence em: %s" % ("sem vencimento" if not exp else "%.0f dias (%s)" % (dias, time.strftime("%d/%m/%Y", time.localtime(exp)))))
print("Permissões: %s" % ", ".join(escopos))
if not x.get("is_valid"):
    print("O token NÃO é válido. Gere outro."); sys.exit(2)
if dias < 20:
    print("Este token é curto (vence em menos de 20 dias). Falta estender no Depurador e copiar o token longo."); sys.exit(2)
if falta:
    print("Faltam permissões: %s. Gere o token de novo com elas marcadas." % ", ".join(falta)); sys.exit(2)
print("Token conferido.")
EOF
if [ $? -ne 0 ]; then echo "Nada foi guardado."; exit 1; fi
printf %s "$T" | npx -y wrangler@4 secret put META_TOKEN && printf %s "$T" | npx -y wrangler@4 secret put META_TOKEN_GERENCIAR && echo "Pronto: token novo guardado nos dois segredos."
