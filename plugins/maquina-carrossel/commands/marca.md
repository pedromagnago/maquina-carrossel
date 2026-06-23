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
Peça uma coisa só: *"Cola o link do site, ou arrasta o logo/brand book (imagem ou PDF). Se não tiver nada, tudo bem — a gente monta do zero."*
- Site → use **WebFetch** para ler texto/meta e extrair cores (hex no CSS/inline) e tom.
- Logo/print/PDF → use **Read** (visão) para descrever cores dominantes, estilo e mood.
- Extraia candidatos a: cor primária, paleta, tom de voz, posicionamento, público.

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
- `visual_tokens.cores.primaria` = a cor confirmada (#hex). Inclua `acento`/`sucesso` se houver; senão deixe o render usar os defaults.
- `voice_tone`, `rules.aprovados`/`proibidos` (do que a marca usa/evita), `personas` (do ICP), `temas_editoriais`.
- `icp_ddd` com `promessa_central`, `fala_assim`, `evita` (estes dois também alimentam `rules`).
- `fonte_canonica` = "onboarding".
- `quality`: calcule `prontidao` (0–100) pelos fundamentais presentes (paleta, logo, tom, posicionamento, público/ICP). `status` = `pronto` (≥70 e todos fundamentais), `quase_la` (50–69) ou `incompleto` (<50). Liste `warnings` (ex.: "paleta dispersa — confirme a cor oficial", "sem brand book — tokens default").
- Sem brand book/cor → use a primária default `#2D6BFF` e marque `status: quase_la` + warning.

### 4. Preview + salvar
1. Grave o `brand.json` em `~/.maquina-carrossel/marcas/<slug>/brand.json`.
2. Renderize a **capa de amostra** com os tokens da marca:
   `node "${CLAUDE_PLUGIN_ROOT}/render/scripts/sample.mjs" "<caminho-absoluto-do-brand.json>" "PRÉVIA DA <em>SUA MARCA</em>"`
   Isso grava `marcas/<slug>/sample-capa.png`.
3. Mostre a capa gerada ao usuário (via Read da imagem) e pergunte se a cor/identidade está certa. Se não, ajuste a primária no `brand.json` e re-renderize.
4. Ao aprovar: defina como marca ativa (`config.json`), confirme em 1–2 linhas e diga que já dá pra rodar `/maquina-carrossel:carrossel`.

Se `setup.sh` não foi rodado (faltam deps/Chromium), o render da amostra vai falhar — nesse caso, oriente: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh"` e tente de novo. O `brand.json` já fica salvo de qualquer forma.
