#!/usr/bin/env bash
# Instalador da Máquina de Carrossel — faz tudo: baixa, prepara o render e registra no Claude Code.
# Uso: curl -fsSL https://raw.githubusercontent.com/pedromagnago/maquina-carrossel/main/install.sh | bash
set -euo pipefail

MKT_NAME="maquina-carrossel-marketplace"
PLUGIN="maquina-carrossel"
REPO="https://github.com/pedromagnago/maquina-carrossel.git"
PLUGINS_DIR="$HOME/.claude/plugins"
MKT_DIR="$PLUGINS_DIR/marketplaces/$MKT_NAME"

echo "==> Máquina de Carrossel — instalador"

if [ ! -d "$HOME/.claude" ]; then
  echo "!! ~/.claude não existe. Você precisa ter o Claude Code instalado e aberto ao menos uma vez."
  exit 1
fi
command -v git >/dev/null 2>&1 || { echo "!! git não encontrado."; exit 1; }
if ! command -v node >/dev/null 2>&1; then
  echo "!! Node 18+ não encontrado. Instale em https://nodejs.org (ou 'brew install node') e rode de novo."
  exit 1
fi
echo "==> Node: $(node --version)"

mkdir -p "$PLUGINS_DIR/marketplaces" "$PLUGINS_DIR/cache/$MKT_NAME"

echo "==> Baixando o plugin..."
rm -rf "$MKT_DIR"
git clone -q "$REPO" "$MKT_DIR"

VERSION="$(node -e "console.log(require('$MKT_DIR/plugins/$PLUGIN/.claude-plugin/plugin.json').version || '0.1.0')")"
SHA="$(git -C "$MKT_DIR" rev-parse HEAD)"
CACHE="$PLUGINS_DIR/cache/$MKT_NAME/$PLUGIN/$VERSION"
rm -rf "$CACHE"; mkdir -p "$(dirname "$CACHE")"; cp -R "$MKT_DIR/plugins/$PLUGIN" "$CACHE"

echo "==> Preparando o render (Playwright + Chromium ~150MB, só na primeira vez)..."
bash "$CACHE/scripts/setup.sh"

echo "==> Registrando no Claude Code..."
node - "$MKT_NAME" "$PLUGIN" "$MKT_DIR" "$CACHE" "$VERSION" "$SHA" <<'NODE'
const fs = require("fs"), os = require("os");
const [, , name, plugin, mktDir, cache, version, sha] = process.argv;
const dir = os.homedir() + "/.claude/plugins";
const now = new Date().toISOString();
const kmPath = dir + "/known_marketplaces.json";
const ipPath = dir + "/installed_plugins.json";
const km = fs.existsSync(kmPath) ? JSON.parse(fs.readFileSync(kmPath, "utf8")) : {};
km[name] = { source: { source: "github", repo: "pedromagnago/maquina-carrossel" }, installLocation: mktDir, lastUpdated: now };
fs.writeFileSync(kmPath, JSON.stringify(km, null, 2) + "\n");
const ip = fs.existsSync(ipPath) ? JSON.parse(fs.readFileSync(ipPath, "utf8")) : { version: 2, plugins: {} };
if (!ip.plugins) ip.plugins = {};
ip.plugins[plugin + "@" + name] = [{ scope: "user", installPath: cache, version, installedAt: now, lastUpdated: now, gitCommitSha: sha }];
fs.writeFileSync(ipPath, JSON.stringify(ip, null, 2) + "\n");
console.log("   registrado: " + plugin + "@" + name + " v" + version);
NODE

echo ""
echo "==> Pronto! Agora FECHE e ABRA o Claude Code (no Mac: Cmd+Q e abrir de novo)."
echo "    Depois é só usar:"
echo "      /maquina-carrossel:marca           (cadastra sua marca, uma vez)"
echo "      /maquina-carrossel:carrossel <tema>"
