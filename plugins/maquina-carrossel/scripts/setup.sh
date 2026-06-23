#!/usr/bin/env bash
# Máquina de Carrossel — setup (uma vez). Idempotente.
# Instala deps do render, baixa o Chromium, gera fontes base64 e cria a pasta de dados do usuário.
set -euo pipefail

# Resolve a raiz do plugin a partir da localização deste script (funciona via /comando ou direto).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RENDER_DIR="$ROOT/render"
DATA_DIR="${MAQUINA_CARROSSEL_HOME:-$HOME/.maquina-carrossel}"

echo "==> Máquina de Carrossel — setup"

if ! command -v node >/dev/null 2>&1; then
  echo "!! Node não encontrado. Instale Node 18+ (https://nodejs.org) e rode de novo." >&2
  exit 1
fi
echo "==> Node: $(node --version)"

# 1. dependências do render (playwright + culori)
echo "==> Instalando dependências do render..."
( cd "$RENDER_DIR" && npm install --no-fund --no-audit )

# 2. Chromium headless (apenas o engine) — ~150MB, baixado uma vez
echo "==> Baixando Chromium para o render (uma vez só)..."
( cd "$RENDER_DIR" && npx playwright install chromium )

# 3. fontes default embutidas em base64 (render 100% offline)
echo "==> Gerando fontes base64..."
node "$RENDER_DIR/scripts/build-fonts.mjs"

# 4. pasta de dados do usuário (marcas + saídas), FORA do plugin (nunca versionada)
mkdir -p "$DATA_DIR/marcas" "$DATA_DIR/saidas"
[ -f "$DATA_DIR/config.json" ] || printf '{\n  "marca_ativa": null\n}\n' > "$DATA_DIR/config.json"

echo ""
echo "==> Pronto."
echo "    Dados (marcas + saídas): $DATA_DIR"
echo "    Próximo passo: cadastre uma marca com  /maquina-carrossel:marca"
