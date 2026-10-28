# SEO — registro

Memória do **YA - SEO** entre conversas. Mais recente primeiro.

## Situação em 2026-10-28

- Lighthouse celular: SEO 100, desempenho ~87 (depois do `scripts/otimizar.py`).
- Pronto: title, description, canonical, Open Graph, `ProfessionalService` em ld+json, robots com robôs de IA liberados, sitemap (só a página inicial), llms.txt, `<h1>` no HTML publicado.
- Bloqueio: `yamb.com.br` ainda está no servidor antigo (sem as melhorias); o domínio está em outra conta da Cloudflare.
- Maior oportunidade: Serviços, Processo, Equipe e Contato não têm endereço próprio — para o Google existe uma página só.
- Pendente do dono: Google Search Console, Perfil da Empresa no Google, endereço completo para os dados estruturados.

## 2026-10-28 — pesquisa inicial (YA - SEO)

**Conteúdo atual por tela** (medido no site publicado):
| Tela | Título principal | Palavras | Cita cidade/estado? |
|---|---|---|---|
| Início | H1 "Marketing não é só publicar. É construir marca." | ~430 | não |
| Serviços | H2 "Estratégia, criação e execução no mesmo lugar" — frentes Branding (diagnóstico, identidade visual, brandbook, tom de voz), Conteúdo (planejamento, posts/carrosséis, roteiros/Reels, stories), Tráfego (campanhas, segmentação, otimização, relatórios), Comercial (scripts, funil/CRM, treinamentos, padronização) | ~290 | não |
| Processo | H2 "Cada pétala é uma dimensão do processo" + "Sete etapas" | ~340 | não |
| Equipe | H2 "Doze pessoas, uma comunicação só" — 9 nomes com cargo | ~150 | não |
| Contato | H2 "Conte sobre o momento da sua marca" — formulário | ~150 | não |

- Nenhuma tela menciona Aracaju ou Sergipe no texto visível (só os metadados e o rodapé com DDD 79).
- Inconsistência: `llms.txt` e os dados estruturados citam "fotografia"; o site não tem frente de fotografia (o formulário tem "Audiovisual"). O formulário também lista "Site" e "Consultoria", que não aparecem em Serviços.
- A YAMB não aparece em nenhuma busca na web por "YAMB" ou "Viva o Processo" — presença externa zero.

**Concorrência** (busca em 2026-10-28; a ferramenta de busca usada não reproduz o Google local, então serve como indício):
- Quem ocupa as buscas são diretórios e listas: oHub (Marketing Digital / Mídias sociais em Aracaju), Econodata, Reportei (agências por cidade), Telelistas, GetNinjas, Cronoshare, e posts "melhores agências de Sergipe" (agenciamaisresultado.com.br, blog.automarticles.com).
- Agências citadas: DIVIA (páginas próprias "agência de marketing digital em Aracaju"), Negócios Locais, Trends Propaganda, Wxw.digital, HB Marketing, Kapsula, Arcos, Moove, Mídia Forma, 3x, Caixa Criativa, IA Soluções Digitais.
- Referência de preço (nacional, Cronoshare): identidade visual R$ 2.000–20.000; só logotipo R$ 800–2.500.

## 2026-10-28 — fase 1 (publicada em site-yamb.pages.dev com OK do dono)

- Dono confirmou: Aracaju, SE, atendimento presencial; serviços = 4 frentes do site.
- Endereços próprios: `/servicos/`, `/processo/`, `/equipe/`, `/contato/` (gerados pelo `otimizar.py`, lista `PAGINAS`), cada um com título, descrição, canonical, Open Graph, um `<h1>` (primeiro título da tela) e `@graph` (ProfessionalService em Aracaju/SE com catálogo dos 4 serviços, WebSite, WebPage, BreadcrumbList).
- Menu e rodapé com links reais; voltar do navegador funciona; link do ambiente interno corrigido para `/interno/`.
- `sitemap.xml` com 5 endereços; `llms.txt` reescrito (Aracaju, serviços, páginas); "fotografia" removida dos dados (não é serviço oferecido).
- Conferido: página inicial idêntica pixel a pixel à atual (1440 e 390 px); `saude.sh` na prévia sem falhas nem avisos; sem erros no console.
- Ainda não visível no texto do site: a cidade (Aracaju) — só nos títulos/descrições/dados. Colocar no texto exige mudança na ferramenta de design ou aprovação para editar textos.

## 2026-10-28 — fase 2 (rascunhos em `rascunhos/servicos.md`, aguardando aprovação)

- 4 rascunhos: Branding, Social media, Tráfego pago, Estrutura comercial (290–410 palavras, título ≤ 60 e descrição ≤ 160 caracteres), só com o que o site já afirma.
- Pendências do dono: 5 `[confirmar]`; se Audiovisual e Sites são serviços (a página inicial lista 6 frentes); se os depoimentos da página inicial são reais (parecem de exemplo: "FOTO OU VÍDEO", Clínica Lumière, Casa Brasa…); onde montar as páginas (ferramenta de design ou otimizador).

## Progresso do plano (ver `.claude/agents/ya-seo.md`)

- [ ] 1. Base de medição
- [~] 2. Palavras-chave — pesquisa inicial feita; mapa proposto ao dono em 2026-10-28
- [~] 3. Uma página por tela feita (fase 1, na prévia); páginas por serviço (`/servicos/branding/` etc.) dependem de textos novos — fase 2
- [ ] 4. SEO local
- [ ] 5. Conteúdo e autoridade
- [ ] 6. SEO técnico avançado
- [ ] 7. Buscas com IA
- [ ] 8. Concorrentes
