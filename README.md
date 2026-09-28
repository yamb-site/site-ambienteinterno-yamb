# YAMB — site institucional + ambiente interno

Site estático, sem build. Cada página é um arquivo HTML autocontido (fontes, CSS e imagens embutidos).

## Estrutura

```
index.html          → site institucional  (yamb.com.br)
interno/index.html  → ambiente interno    (yamb.com.br/interno)
.htaccess           → HTTPS, sem www, cache
.cpanel.yml         → deploy automático via cPanel Git Version Control
.github/workflows/  → deploy alternativo via FTP (GitHub Actions)
```

## Publicar pela primeira vez

```bash
git clone git@github.com:yamb-site/site-ambienteinterno-yamb.git
cd site-ambienteinterno-yamb
# copie os arquivos desta pasta para dentro
git add .
git commit -m "site institucional + ambiente interno"
git push -u origin main
```

## Deploy automático — opção A (recomendada, cPanel)

1. cPanel > **Git™ Version Control** > *Create*
2. Marque **Clone a Repository**
   - URL: `https://github.com/yamb-site/site-ambienteinterno-yamb.git`
   - Repository Path: `/home/usuario/repos/yamb`
3. Edite `.cpanel.yml` trocando `usuario` pelo seu usuário do cPanel
4. Depois de cada push: cPanel > Git Version Control > **Update from Remote** > **Deploy HEAD Commit**

## Deploy automático — opção B (FTP)

Crie os secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` no GitHub
(Settings > Secrets and variables > Actions). Cada push na `main` publica sozinho.

## Ambiente interno

Hoje `/interno` é público. Para proteger com senha:
cPanel > **Directory Privacy** > `public_html/interno` > marcar proteção e criar usuário.
