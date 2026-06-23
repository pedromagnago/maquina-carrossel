# Máquina de Carrossel

Plugin de Claude Code que transforma um **insumo** (texto, link, print ou transcrição) em um **carrossel de Instagram pronto pra postar** — slides em PNG 1080×1350, com preview no frame do Instagram e legenda.

É **local-first**: roda na sua máquina, sem conta, sem API key cloud, sem servidor. É **multi-marca**: cada pessoa cadastra a própria marca uma vez e gera conteúdo na voz dela.

## Como funciona (resumo)

O fluxo é editorial e guiado — você aprova o **raciocínio** antes de qualquer slide:

```
insumo → Triagem → 10 headlines → Espinha Dorsal → escolher framework
       → copy dos slides → QA → render (PNG + preview no frame do Instagram)
       → validação visual → legenda
```

- **Cérebro de copy:** metodologia editorial (triagem, banco de headlines, anti-AI-slop, 7 parâmetros de QA).
- **Render visual:** HTML/CSS → PNG via Chromium headless, com biblioteca de componentes e o frame do Instagram para validar.
- **Marca:** cada marca é um "brand pack" local (voz, regras, paleta, tipografia, ICP).

## Requisitos

- Claude Code
- Node 18+
- ~150 MB de disco para o Chromium do render (baixado uma vez no setup)

## Instalação

```bash
# adicionar o marketplace local e instalar
/plugin marketplace add <caminho-deste-repo>
/plugin install maquina-carrossel
```

Depois, rode o setup **uma vez** (instala deps do render + Chromium + fontes):

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh"
```

## Uso

1. **Cadastre sua marca** (uma vez):
   ```
   /maquina-carrossel:marca
   ```
   Cole o site / arraste o logo, responda poucas perguntas. Gera o brand pack em `~/.maquina-carrossel/marcas/<slug>/`.

2. **Gere um carrossel:**
   ```
   /maquina-carrossel:carrossel
   ```
   Siga as etapas (intenção → insumo → triagem → headlines → espinha → framework). Os PNGs e o preview saem em `~/.maquina-carrossel/saidas/<data>-<marca>-<tema>/`.

   Atalhos: `/maquina-carrossel:carrossel <link ou texto>` entra direto como insumo; adicione `--auto` para o modo rápido (1 confirmação).

## Onde ficam as coisas

- **Código do plugin** (neutro, sem marca): este repositório.
- **Suas marcas e saídas** (dados): `~/.maquina-carrossel/` — fora do repositório, nunca versionado.

## Arquitetura

Sem MCP, sem Python, sem cloud. Runtime único Node, só para o render. Skills/agentes em markdown; o render é um script Node chamado via Bash. Ver o plano de implementação para detalhes.
