// Gera render/assets/fonts.generated.css a partir dos pacotes @fontsource instalados,
// embutindo cada .woff2 em base64 (@font-face). Idempotente. Rodado pelo setup.sh.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, ".."); // render/
const NM = join(ROOT, "node_modules", "@fontsource");
const OUT_DIR = join(ROOT, "assets");
const OUT = join(OUT_DIR, "fonts.generated.css");

// Fontes default do plugin (a marca pode substituir trazendo as suas no onboarding).
const FAMILIES = [
  { pkg: "space-grotesk", family: "Space Grotesk", weights: [300, 400, 500, 700] },
  { pkg: "dm-sans", family: "DM Sans", weights: [400, 500, 700] },
  { pkg: "jetbrains-mono", family: "JetBrains Mono", weights: [400, 700, 800] },
];

function findWoff2(pkg, weight) {
  const dir = join(NM, pkg, "files");
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir);
  const exact = files.find((f) => f === `${pkg}-latin-${weight}-normal.woff2`);
  if (exact) return join(dir, exact);
  const loose = files.find(
    (f) => f.includes(`latin-${weight}-normal`) && f.endsWith(".woff2"),
  );
  return loose ? join(dir, loose) : null;
}

function faceCss(family, weight, file) {
  const b64 = readFileSync(file).toString("base64");
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}

const blocks = [];
const missing = [];
for (const fam of FAMILIES) {
  for (const w of fam.weights) {
    const file = findWoff2(fam.pkg, w);
    if (file) blocks.push(faceCss(fam.family, w, file));
    else missing.push(`${fam.family} ${w}`);
  }
}

if (blocks.length === 0) {
  console.error(
    "!! Nenhuma fonte @fontsource encontrada. Rode `npm install` em render/ antes de build-fonts.",
  );
  process.exit(1);
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  OUT,
  `/* gerado por build-fonts.mjs — fontes embutidas em base64 (render offline) */\n${blocks.join("\n")}\n`,
);
console.log(`==> ${blocks.length} @font-face em assets/fonts.generated.css`);
if (missing.length) console.log(`   (ausentes → fallback do sistema: ${missing.join(", ")})`);
