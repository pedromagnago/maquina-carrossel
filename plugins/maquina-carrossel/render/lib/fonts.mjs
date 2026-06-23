// Carrega as fontes embutidas (base64) geradas por scripts/build-fonts.mjs.
// Render 100% offline: as fontes vão dentro do HTML, nunca via <link> Google Fonts.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATED = join(__dirname, "..", "assets", "fonts.generated.css");

export function fontFaceCss() {
  if (existsSync(GENERATED)) return readFileSync(GENERATED, "utf8");
  return "/* fonts.generated.css ausente — rode scripts/build-fonts.mjs (ou scripts/setup.sh). Caindo para fontes do sistema. */";
}

export function fontsEmbedded() {
  return existsSync(GENERATED);
}
