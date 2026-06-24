---
description: Cadastra uma marca (onboarding leve) ou troca a marca ativa do gerador de carrossel.
argument-hint: "[listar | usar <slug> | nova | <url do site>]"
---

Você gerencia os **brand packs** locais do plugin Máquina de Carrossel. Os dados ficam em `~/.maquina-carrossel/` (use `$MAQUINA_CARROSSEL_HOME` se definido), **fora** do plugin. Cada marca = `marcas/<slug>/brand.json`. A marca ativa fica em `config.json` (`{"marca_ativa": "<slug>"}`).

Argumento recebido: `$ARGUMENTS`

## Roteamento

1. **`listar`** → liste as marcas em `~/.maquina-carrossel/marcas/*/brand.json` (nome, handle, `quality.status`) e marque a ativa. Pare.
2. **`usar <slug>`** → se `marcas/<slug>/brand.json` existe, escreva `config.json` com `marca_ativa: <slug>` e confirme em uma linha. Senão, liste as disponíveis. Pare.
3. **`nova`** ou **uma URL** ou **vazio sem nenhuma marca cadastrada** → faça o **onboarding** (abaixo).
4. **vazio com marca já ativa** → mostre a marca ativa + dica de `usar`/`nova`. Pare.

Antes de qualquer coisa, garanta que `~/.maquina-carrossel/marcas/` existe (`mkdir -p`). Se `config.json` não existir, crie `{"marca_ativa": null}`.

## Onboarding (leve, DDD-lite)

Objetivo: capturar o mínimo para gerar conteúdo na voz da marca, com **pouco atrito**. Tom direto, sem bastidor.

### 1. Coleta passiva (atrito mínimo)
Peça uma coisa só: *"Cola o link do site, ou arrasta o logo/brand book/brand guide (imagem ou PDF). Se não tiver nada, tudo bem — a gente monta do zero."*
- Site → use **WebFetch** para ler texto/meta e extrair cores (hex no CSS/inline) e tom.
- Logo/print/PDF/**brand guide** → use **Read** (visão) e leia com atenção: paleta completa (todos os hex), **tipografia** (fontes de título e corpo), estilo/mood, texturas/elementos gráficos.
- Extraia candidatos a: cor primária + paleta inteira, **fontes (headline/body)**, tom de voz, posicionamento, público, e qualquer **assinatura visual** (textura, grid, gradiente, elemento gráfico recorrente).

### 2. DDD-lite (5–7 perguntas, uma por vez)
Faça poucas perguntas, **pré-preenchidas** pelo que a coleta revelou. Sempre 3–4 opções + "Outro (escreva)". Só pergunte o que faltar:
1. **Posicionamento** em 1 frase (confirme/ajuste o que veio do site).
2. **Cliente ideal** (perfil + momento).
3. **Maior dor** do cliente.
4. **Maior desejo** (1 prático + 1 emocional).
5. **Diferencial central + promessa** (aberta — pergunta-chave, não pule).
6. **Tom de voz** (confirme os eixos detectados: formal↔informal, técnico↔acessível...).
7. **Cor primária** — **só pergunte** se a coleta achou cores conflitantes/dispersas; senão confirme a detectada.

Não exponha o processo. Conduza como uma conversa curta.

### 3. Montar o brand pack
Monte o `brand.json` seguindo `${CLAUDE_PLUGIN_ROOT}/schemas/brand-pack.schema.json`. Regras:
- `slug` = kebab-case do nome. `handle` = @ do Instagram (pergunte se não veio).
- `visual_tokens.cores`: `primaria` (#hex confirmado) + `acento`/`sucesso`/`texto`/`bg` quando houver.
- **`visual_tokens.fontes`**: `headline` e `body`. Pool embutido pronto: **Space Grotesk**, **DM Sans**, **JetBrains Mono** (escolha o par que combina com o mood — ex.: mono pra tech/hacker). Se a marca usa outra fonte, registre o nome (o render cai no fallback do sistema até a fonte ser embutida).
- **`render_tokens`**: preencha os tokens exatos da marca (`P`, `PL`, `PD`, `LB`, `DB`, `LR`, `ALERT`, `OK`, `F_HEAD`, `F_BODY`) a partir da paleta real do brand guide. Isso garante que o render use as cores oficiais, não os derivados automáticos.
- `voice_tone`, `rules.aprovados`/`proibidos`, `personas` (ICP), `temas_editoriais`, `icp_ddd` (`promessa_central`, `fala_assim`, `evita` — estes dois alimentam `rules`).
- `fonte_canonica`, e `quality` (`prontidao` 0–100; `status` pronto/quase_la/incompleto; `warnings`).
- **Nunca deixe a marca vazia:** sem brand guide/cor, use uma primária neutra (`#2D6BFF`) e `status: quase_la` + warning — mas com voz e tokens preenchidos o suficiente para o `/carrossel` não cair no default genérico.

### 4. Assinatura visual — gerar `skin.css`
Desenhe a **assinatura visual da marca** num arquivo CSS e salve em `~/.maquina-carrossel/marcas/<slug>/skin.css` (referencie em `brand.skin: "skin.css"`). A skin é injetada **sobre** o design-system base e pode usar as CSS vars (`--P`, `--ALERT`, `--OK`, `--LB`, `--DB`) e o hook `.skin-layer` (camada atrás do conteúdo). Capture o que torna a marca reconhecível, por exemplo:
- textura/grid/padrão de fundo no `.skin-layer` (dos slides escuros e da capa);
- tratamento da capa (`.capa-headline`, `.capa .badge`), cor das `.tag`, destaque do `.body em`;
- glow/gradiente de acento, cor de `.cta-button`, borda dos cards (`.insight-box`, `.data-pill`).
**Contraste é regra dura** (não negocie por estética): texto de corpo sempre legível sobre o fundo do slide. Se a cor primária for clara (ex.: verde-limão, amarelo), **não** use ela como cor de texto em fundo claro nem como destaque (`.body em`) em slide claro — use uma versão escura. Em slide claro, destaque = cor escura; em slide escuro/gradiente, destaque = cor clara/bright. O design-system base já põe um scrim escuro nos slides gradiente/alert — **não** sobrescreva o `.scrim`. Sem brand guide forte, gere uma skin sóbria coerente com a primária (gradiente sutil + acento) — melhor que nada.

### 5. Preview + salvar
1. Grave `brand.json` (+ `skin.css`) em `~/.maquina-carrossel/marcas/<slug>/`.
2. Renderize a **capa de amostra** (já aplica a skin):
   `node "${CLAUDE_PLUGIN_ROOT}/render/scripts/sample.mjs" "<caminho-absoluto-do-brand.json>" "PRÉVIA DA <em>SUA MARCA</em>"` → grava `sample-capa.png`.
3. Mostre a capa (Read da imagem) e pergunte se a identidade está certa. Se não, ajuste paleta/skin e re-renderize.
4. Ao aprovar: defina como marca ativa (`config.json`) e confirme que já dá pra rodar `/maquina-carrossel:carrossel`.

Se faltar setup (deps/Chromium), oriente `bash "${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh"`. O `brand.json`/`skin.css` já ficam salvos.
