// sample.mjs — renderiza UMA capa de amostra com os tokens de um brand pack.
// Uso: node sample.mjs <brand.json> ["Texto da capa"] [saida.png]
// Serve ao onboarding mostrar a paleta/fontes da marca antes de salvar.

import { chromium } from "playwright";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fontFaceCss } from "../lib/fonts.mjs";
import { rootCss } from "../lib/tokens.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(__dirname, "..", "components", "design-system.css"), "utf8");

const brandArg = process.argv[2];
const texto = process.argv[3] || "SUA HEADLINE <em>FORTE</em> AQUI";
if (!brandArg) { console.error("uso: node sample.mjs <brand.json> [texto] [saida.png]"); process.exit(1); }
const brandPath = resolve(process.cwd(), brandArg);
if (!existsSync(brandPath)) { console.error("brand.json não encontrado: " + brandPath); process.exit(1); }
const brand = JSON.parse(readFileSync(brandPath, "utf8"));
const out = process.argv[4]
  ? resolve(process.cwd(), process.argv[4])
  : join(dirname(brandPath), "sample-capa.png");

const handle = brand.handle || "@marca";
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${fontFaceCss()}\n${CSS}\n${rootCss(brand)}\nbody{background:#2a2a2a;padding:24px;display:flex;justify-content:center;}</style></head>
<body><div class="slide capa dark" id="slide-1">
  <div class="brand-bar"><span>${handle}</span><span class="counter">1/6</span></div>
  <div class="swipe">›</div>
  <div class="content"><div class="badge">ANÁLISE</div><div class="capa-headline">${texto}</div></div>
  <div class="progress"><div class="fill" style="width:16%"></div></div>
</div></body></html>`;

const browser = await chromium.launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 420, height: 525 }, deviceScaleFactor: 1080 / 420 })).newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}
  const el = await page.$("#slide-1");
  await el.screenshot({ path: out });
  console.log("capa de amostra: " + out);
} finally {
  await browser.close();
}
