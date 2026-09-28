# YAMB — site institucional + ambiente interno

Site estático, sem build. Cada página é um arquivo HTML autocontido (fontes, CSS e imagens embutidos).
Hospedagem: servidor próprio com **DirectAdmin**, domínio `yamb.com.br`.

## Estrutura

```
index.html          → site institucional  (yamb.com.br)
interno/index.html  → ambiente interno    (yamb.com.br/interno)
.htaccess           → HTTPS, sem www, cache
.github/workflows/deploy.yml → publica no servidor a cada push na main
```

## Passo 1 — subir os arquivos pro GitHub

Sem terminal: abra o repositório vazio no GitHub, use **uploading an existing file**
e arraste `index.html`, a pasta `interno` e `README.md`.
Arquivos que começam com ponto (`.htaccess`, `.github/workflows/deploy.yml`) o navegador
não deixa arrastar — crie com **Add file › Create new file**, digitando o nome completo
(inclusive as barras, que criam as pastas) e colando o conteúdo.

Com terminal:

```bash
git clone https://github.com/yamb-site/site-ambienteinterno-yamb.git
cd site-ambienteinterno-yamb
# copie os arquivos desta pasta para dentro
git add .
git commit -m "site institucional + ambiente interno"
git push -u origin main
```

## Passo 2 — criar o usuário FTP no DirectAdmin

DirectAdmin → **Contas de FTP** → **Criar conta de FTP**:

- usuário: `deploy` (fica `deploy@yamb.com.br`)
- senha: gere e **copie antes de clicar em CRIAR**
- tipo: **Domínio**

Host do FTP: `ftp.yamb.com.br` (ou o IP do servidor, se o FTP falhar).

## Passo 3 — guardar as credenciais no GitHub

Repositório → **Settings › Secrets and variables › Actions › New repository secret**.
Crie três: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.

Pronto: a partir daí, todo push na `main` publica sozinho.
Acompanhe em **Actions** no GitHub — verde é publicado.

## Se publicar na pasta errada

Ajuste `server-dir` em `.github/workflows/deploy.yml`:
`public_html/` (conta tipo Domínio) ou `domains/yamb.com.br/public_html/` (usuário principal).

## Ambiente interno

Hoje `/interno` é público. Para proteger com senha:
DirectAdmin → **Proteção de diretório por senha** → apontar para `public_html/interno`.
