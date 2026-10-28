#!/usr/bin/env bash
# Testa o Worker do Painel de Tráfego. Pede a senha do painel sem mostrar na tela
# e sem guardar no histórico; mostra só um resumo (nunca o token).
URL="${URL:-https://yamb-trafego.gabrielsocialm21.workers.dev}"
printf "Senha do painel: "
IFS= read -rs SENHA
echo
for rota in token contas "painel?periodo=last_7d"; do
  echo "== /$rota"
  curl -s -H "X-Painel-Senha: $SENHA" "$URL/$rota" | python3 -c '
import json, sys
d = json.load(sys.stdin)
if "erro" in d: print("  ERRO:", d["erro"]); sys.exit()
if "valido" in d: print("  token válido:", d["valido"], "| vence em:", d["venceEm"], "| permissões:", ", ".join(d["permissoes"]))
elif "periodo" in d:
    t = d["totais"]
    print("  campanhas ativas: %d | gasto: %.2f | resultados: %d" % (t["campanhas"], t["gasto"], t["resultados"]))
    for c in d["contas"]:
        print("  - %s: %d campanha(s) ativa(s)%s" % (c["nome"], len(c["campanhas"]), " — ERRO: " + c["erro"] if c.get("erro") else ""))
else:
    cs = d["contas"]
    print("  contas: %d (ativas: %d)" % (len(cs), sum(c["ativa"] for c in cs)))
'
done
unset SENHA
