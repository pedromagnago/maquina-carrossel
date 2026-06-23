# Máquina de Carrossel

Marketplace de Claude Code com o plugin **maquina-carrossel**: transforma um insumo (texto, link, print ou transcrição) em um **carrossel de Instagram pronto pra postar** — PNGs 1080×1350, preview no frame do Instagram e legenda. **Local-first** (sem conta, sem API key, sem servidor) e **multi-marca**.

## Pré-requisitos

- **Claude Code** instalado.
- **Node 18+** na máquina (o render usa Node + Chromium headless).
- ~150 MB de disco para o Chromium do render (baixado uma vez no setup).

## Instalação (qualquer pessoa)

No Claude Code, cole na ordem:

```
/plugin marketplace add pedromagnago/maquina-carrossel
/plugin install maquina-carrossel@maquina-carrossel-marketplace
/maquina-carrossel:setup
```

1. adiciona o marketplace (repo público — sem login)
2. instala o plugin
3. prepara as dependências, uma vez (instala o Playwright + baixa o Chromium ~150 MB)

> ⚠️ **Tem o plugin antigo instalado?** Se você usou uma versão anterior (`maquina-conteudo`, com MCP), **desinstale antes** — os dois brigam: `/plugin uninstall maquina-conteudo` (e remova o marketplace dele). Confirme com `/plugin list` que só `maquina-carrossel` está ativo.

## Uso

```bash
# cadastrar a sua marca (uma vez): cola o site / arrasta o logo, responde poucas perguntas
/maquina-carrossel:marca

# gerar um carrossel
/maquina-carrossel:carrossel <tema, link ou texto>
```

O fluxo é guiado: insumo → **triagem** → **10 headlines** → **espinha dorsal** → escolher framework → copy → render + validação. Os arquivos saem em `~/.maquina-carrossel/saidas/<data>-<marca>-<tema>/` (PNGs, `preview.html`, `legenda.txt`).

## Estrutura do repositório

```
.claude-plugin/marketplace.json     # catálogo (lista o plugin)
plugins/maquina-carrossel/          # o plugin
├── .claude-plugin/plugin.json
├── commands/  (carrossel, marca, setup)
├── agents/    (pesquisador, redator, revisor-qa, validador-visual)
├── knowledge/ (metodologia editorial + design system, neutros)
├── render/    (toolkit Node: slides.json → PNG via Playwright)
├── schemas/   ·  scripts/setup.sh
```

## Atualizar

Publicada uma versão nova (bump em `plugins/maquina-carrossel/.claude-plugin/plugin.json`):

```bash
/plugin marketplace update maquina-carrossel-marketplace
/plugin install maquina-carrossel
```
