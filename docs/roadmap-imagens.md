# Roadmap — Imagens no carrossel (planejado, não implementado)

> Status: **desenhado, não construído** (decisão do Pedro: testar o fluxo atual primeiro). Hoje o plugin não gera imagem — o visual vem de tipografia + componentes + ritmo de cores; `imagem.tipo ∈ {none (default), local}`. Este doc é o blueprint pra quando formos implementar.

## Por que o BrandsDecoded falhava (e como atacamos)
1. **Default errado** — foto onde o conteúdo era informação (compete com a tipografia). → Default vira `none` (já é).
2. **Prompt cego** — geração sem contexto do slide/marca → imagem genérica. → Prompt montado do contexto + `style_lock` por marca.
3. **Gate sem imagem** — ninguém checava relevância/qualidade. → `validador-visual` ganha **Bloco D — Imagem**, com regeneração e degradação.

## Estratégia em camadas (ordem de preferência)
- **(a) none** (default) — só design system. Maioria dos slides (método, contexto, insight, CTA).
- **(b) data-viz** — gráfico gerado do **próprio dado** do slide, na paleta da marca. **Zero chave, local, sempre fiel ao número.** Maior ROI. Caminho recomendado: **SVG inline desenhado no render** (não imagem externa) — vira só mais um componente.
- **(c) gerada (IA)** — só na **capa**, opcional, atrás da **chave própria** do usuário (env var, nunca salva). Teto 1/carrossel.
- **(d) local** — arquivo do usuário; vence (c) quando existe.

### Default por framework
- **Dados que Decidem** → capa/comparação = **data-viz**.
- **Armadilha** → slide do custo = **data-viz**; capa = `none`/`alert` (ou IA clima, se key).
- **Raio-X** → tudo `none` (é método).
- **Caso na Prática** → `local` se houver print/foto; "resultado" = data-viz (antes/depois).
- **Nicho Attack** → "prova" = data-viz; capa = IA clima (se key) ou `none`.

## O loop anti-"fora de contexto"
Prompt (camada c) montado por um diretor-de-arte (estender `designer-render`): `[sujeito da copy] + [tese/ângulo] + [mood da marca] + [paleta #hex] + [style_lock da marca] + [negativos: sem texto/logo/pessoas reconhecíveis/cliché] + [4:5, sujeito no terço superior]`.

**Bloco D — Imagem** (novo, no `validador-visual` + `checklist-validacao.md`), só nos slides com imagem:
- Relevância (representa o assunto? não "serviria pra qualquer carrossel").
- Qualidade técnica (sem artefato de IA, sem blur/pixelização).
- Sem texto/logo dentro da imagem.
- Harmonia com a paleta/mood da marca.
- Legibilidade da headline sobre a imagem (com overlay/gradiente).
- (data-viz) fidelidade ao dado — valores batem com a copy; `source` presente.
- Sem cara de stock/cliché.

Veredito ganha 3ª classe de correção: **`imagem`** (além de `copy`/`layout`), com diretiva de regeneração. Máx **2 regenerações** por imagem; esgotou → **degrada pra `none`** (ou data-viz → `table`/`data-pill`). Re-render só do slide afetado.

## Mudanças concretas (quando construir)
1. **`slides.schema.json`** — `imagem.tipo += "gerada" | "data-viz"`; adicionar `papel_visual` (capa-fundo/interna-dark/grafico), `prompt`/`negativos` (gerada), `spec` (data-viz: `chart`, `series[{label,value,cor}]`, `unidade`, `fonte`), `_meta` (auditoria/cache). Validação: `gerada` exige `prompt`; `data-viz` exige `spec`; `interna-dark` exige `bg:dark`.
2. **`render.mjs`** — passo async de materialização de imagem antes do screenshot; `chartHtml(spec)` desenha SVG com `--P/--ALERT/--OK`; cache por hash; fallback `none` quando sem provider. data-viz = componente de render (sem arquivo externo).
3. **`render/image/`** (novo) — interface única `ImageProvider {name, available(), supports(tipo), generate(spec)}`. Implementações: `dataviz-local.mjs` (sem key, default) e `ia-generativa.mjs` (key opcional, `fetch` nativo, modelo-agnóstico). `index.mjs` → `pickProvider()` ou `null`.
4. **`brand-pack.schema.json`** — bloco `image_gen { enabled:false, provider, endpoint, model, api_key_env:"MAQUINA_IMG_API_KEY", style_lock, negativos_default, max_por_carrossel:1 }`. **A chave nunca no arquivo — só o nome da env var.**
5. **`/marca`** — pergunta opcional "habilitar IA de imagem na capa? (precisa de chave própria)" default N; **`/carrossel`** mostra estado ("IA de imagem: ligada/desligada"); flag `--imagens=off|dataviz|ia`.
6. **`checklist-validacao.md` + `validador-visual.md`** — Bloco D + classe `imagem`. **`frameworks-slide.md`/`componentes.md`** — documentar default de imagem por framework + data-viz.

**Ordem sugerida:** (1) data-viz local + Bloco D — maior ganho, zero key; (2) schema/brand pack + módulo provider; (3) IA na capa opcional.

## Provider de IA — escolha do Pedro
**Padrão: Google Gemini 2.5 Flash Image ("nano-banana").** Motivos: **500 imagens grátis/dia** (ótimo pra começar sem cartão), 2–5s de latência. Texto-na-imagem é fraco, mas **a gente proíbe texto na imagem mesmo** (tipografia é do render). Endpoint: `generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image` (SDK `@google/genai` ou REST + `fetch`). Como o módulo é agnóstico, dá pra trocar por Recraft V4 (mais "design taste") ou FLUX.2 (fotorrealismo) depois sem mexer no código.

## Local-first preservado
Default `none` (sem rede). data-viz = SVG local (sem key) — cobre a maior parte do "queremos imagem". IA = só se o usuário ligar + exportar a própria chave. A decisão "sem key obrigatória" continua intacta.
