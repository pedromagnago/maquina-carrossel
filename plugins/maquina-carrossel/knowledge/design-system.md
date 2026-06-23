# Design System (referência interna)

Material lido pelo `redator` (para saber o que cabe em cada slide) e pelo `designer-render` (para montar o `slides.json`). A implementação CSS real vive em `render/components/`. **Genérico** — todas as cores e fontes são tokens vindos do brand pack ativo; aqui só há placeholders e regras.

## Formato

- **Carrossel Instagram:** 4:5. Design no viewport **420×525px**, exportado a **1080×1350px** (deviceScaleFactor ≈ 2,571). O render usa os valores de px deste documento na escala 420.
- Margens internas (safe area): ~28px horizontal, ~32px vertical no design 420 (escalam junto).

## Sistema de cores (tokens da marca → `:root`)

Derivados de **uma** cor primária da marca (ver `render/lib/tokens.mjs`). Mapeiam nas CSS vars:

```
--P     BRAND_PRIMARY    cor primária da marca (autoridade)
--PL    BRAND_LIGHT      primária clareada ~12–20%
--PD    BRAND_DARK       primária escurecida ~15–30% (CTA, gradientes)
--ALERT ACCENT_ALERT     destaque de alerta / números que chocam
--OK    ACCENT_SUCCESS   destaque de resultado positivo
--LB    LIGHT_BG         off-white com leve temperatura da primária
--LR    LIGHT_BORDER     divisores em slides claros
--DB    DARK_BG          near-black com tint da primária
--DT    DARK_TEXT        texto em fundo claro
--LT    LIGHT_TEXT       texto em fundo escuro
```

Gradientes:
- **Brand gradient:** `linear-gradient(165deg, var(--PD) 0%, var(--P) 50%, var(--PL) 100%)`
- **Alert gradient:** `linear-gradient(165deg, <alert-dark> 0%, var(--ALERT) 100%)`

Regra dura: a primária **nunca** é fundo de texto corrido — só accent (palavra-chave, borda de card, fill de progress, headline de capa, número de impacto).

## Tipografia

Fontes vêm do brand pack (`render_tokens.F_HEAD` / `F_BODY`); default neutro do plugin = **Space Grotesk** (headings/dados) + **DM Sans** (corpo). Sempre embutidas em base64 (`@font-face`), nunca `<link>` Google Fonts.

| Elemento | Fonte | Tamanho (design 420) | Peso | Notas |
|---|---|---|---|---|
| Headline capa | HEAD | 28–36px | 700 | letter-spacing −0.5px |
| Subheadline | HEAD | 20–24px | 600 | letter-spacing −0.3px |
| Corpo | BODY | 14–15px | 400 | line-height 1.55 |
| Tags/labels | BODY | 10px | 600 | uppercase, tracking 2px |
| Número/dado | HEAD | 42–60px | 700 | estatística de impacto |
| Small/fonte | BODY | 11–12px | 400 | disclaimers, source-badge |
| Step number | HEAD | 26px | 300 | numeração de passos |

## Arquitetura do slide (presente em todo slide)

1. **Progress bar** (rodapé): barra fina (~3px) que preenche conforme avança. `--P` em fundo claro, `--PL` em fundo escuro. Último slide = 100%.
2. **Swipe arrow** (borda direita): seta discreta com pulse em **todos os slides exceto o último**.
3. **Brand watermark** (topo): handle da marca pequeno (~10px, uppercase, tracking 2px) em todo slide.

## Ritmo visual

- Alternar `light` ↔ `dark` para contraste; usar `gradient` em slides de virada/direção; `alert` em slides de "armadilha"/número negativo.
- **Nunca 3 slides consecutivos com o mesmo fundo.**
- Slides de resultado positivo usam `--OK`; slides de custo/risco usam `--ALERT`.
- 1 ideia por slide; no máximo 2 blocos de texto; máximo ~3 elementos por slide.
- Conteúdo gravita para o terço inferior/médio (respiro no topo).

## Frame do Instagram (preview / validation view)

O render gera um `preview.html` que envolve os slides num mock do post (largura 420px):

```
┌──────────────────────────────┐
│ [logo] handle           •••  │  ← header: avatar/logo + handle
├──────────────────────────────┤
│        [SLIDE 4:5]           │  ← 420×525
├──────────────────────────────┤
│ ♡  💬  ✈️            🔖       │  ← ícones de ação
│ • ○ ○ ○ ○ ○ ○               │  ← bolinhas (slide atual)
│ handle [legenda preview]     │
└──────────────────────────────┘
```

É a "visão de validação": confere se o carrossel saiu como pedido. O `validador-visual` abre este preview e compara com o insumo/brief + `checklist-validacao.md`.

## Exportação (resumo; detalhe em `render/render.mjs`)

- Viewport 420×525, `deviceScaleFactor` ~2,571 → PNG 1080×1350.
- Esperar `document.fonts.ready` antes do screenshot (fontes base64, sem espera de rede).
- Um screenshot por slide → `slide-01.png` … `slide-NN.png`; + `contact-sheet.png` (grade) + `preview.html`.
- Imagens nos slides embutidas em base64; default sem imagem (`none`).
