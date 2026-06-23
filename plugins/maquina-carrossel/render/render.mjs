// render.mjs — slides.json -> PNG 1080x1350 + preview (frame do Instagram) + contact-sheet + report.json
// Uso: node render.mjs <pasta-da-peça>   (a pasta contém slides.json)
// Determinístico: só desenha o que está no slides.json. Offline (fontes base64).

import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fontFaceCss, fontsEmbedded } from "./lib/fonts.mjs";
import { rootCss } from "./lib/tokens.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(__dirname, "components", "design-system.css"), "utf8");
const W = 420, H = 525, SCALE = 1080 / 420; // 2.5714 -> 1080x1350

function fail(msg) { console.error("ERRO: " + msg); process.exit(1); }
const pad2 = (n) => String(n).padStart(2, "0");

// ---------- args ----------
const arg = process.argv[2];
if (!arg) fail("uso: node render.mjs <pasta-da-peça> (contém slides.json)");
const pecaDir = resolve(process.cwd(), arg);
const slidesPath = join(pecaDir, "slides.json");
if (!existsSync(slidesPath)) fail("slides.json não encontrado em " + pecaDir);

let data;
try { data = JSON.parse(readFileSync(slidesPath, "utf8")); }
catch (e) { fail("slides.json inválido: " + e.message); }

// ---------- brand ----------
let brand = {};
if (data.brand_pack_ref) {
  const bp = isAbsolute(data.brand_pack_ref) ? data.brand_pack_ref : join(pecaDir, data.brand_pack_ref);
  if (existsSync(bp)) { try { brand = JSON.parse(readFileSync(bp, "utf8")); } catch (e) { console.warn("aviso: brand pack inválido: " + e.message); } }
  else console.warn("aviso: brand_pack_ref não encontrado (" + bp + "); usando tokens default.");
}

// ---------- validação estrutural (espelha o superRefine do schema.ts v01) ----------
function validate(d) {
  const errs = [];
  if (!Array.isArray(d.slides) || d.slides.length < 4) errs.push("precisa de ao menos 4 slides");
  const slides = [...(d.slides || [])].sort((a, b) => a.ordem - b.ordem);
  slides.forEach((s, i) => {
    if (s.ordem !== i + 1) errs.push(`ordem deve ser sequencial 1..N sem buracos (achei ordem=${s.ordem} na posição ${i + 1})`);
    if (!["light", "dark", "gradient", "alert"].includes(s.bg)) errs.push(`slide ${s.ordem}: bg inválido (${s.bg})`);
  });
  const first = slides[0], last = slides[slides.length - 1];
  const tipoOf = (s, idx, n) => s.tipo || (idx === 0 ? "capa" : idx === n - 1 ? "fechamento" : "conteudo");
  if (first && tipoOf(first, 0, slides.length) !== "capa") errs.push("o primeiro slide deve ser a capa");
  if (last && tipoOf(last, slides.length - 1, slides.length) !== "fechamento") errs.push("o último slide deve ser o fechamento");
  slides.forEach((s, i) => {
    const isLast = i === slides.length - 1;
    const hasCta = s.cta && (s.cta.instrucao || s.cta.palavra);
    if (hasCta && !isLast) errs.push(`slide ${s.ordem}: cta só é permitido no fechamento`);
  });
  if (errs.length) fail("slides.json não passou na validação:\n - " + errs.join("\n - "));
  return slides;
}
const slides = validate(data);
const total = slides.length;
const meta = data.meta || {};
const handle = meta.handle || "@marca";

// ---------- helpers de HTML ----------
function imgData(ref) {
  if (!ref) return null;
  const p = isAbsolute(ref) ? ref : join(pecaDir, ref);
  if (!existsSync(p)) { console.warn("aviso: imagem não encontrada: " + p); return null; }
  const ext = p.split(".").pop().toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${readFileSync(p).toString("base64")}`;
}

function componenteHtml(c) {
  switch (c.tipo) {
    case "data-pill":
      return `<div class="data-pill ${c.variante || "neutral"}"><span class="number">${c.number || ""}</span><span class="label">${c.label || ""}</span></div>`;
    case "strike-pill":
      return `<div class="strike-pill"><span class="before">${c.before || ""}</span><span class="after">${c.after || ""}</span></div>`;
    case "insight-box":
      return `<div class="insight-box">${c.icon ? `<span class="icon">${c.icon}</span>` : ""}<p>${c.texto || ""}</p>${c.fonte ? `<span class="source">${c.fonte}</span>` : ""}</div>`;
    case "feature-list":
      return `<div class="feature-list">${(c.itens || []).map((it) => `<div class="feature-item"><span class="icon">${it.icon || "✓"}</span><div><strong>${it.titulo || ""}</strong><p>${it.texto || ""}</p></div></div>`).join("")}</div>`;
    case "numbered-steps":
      return (c.passos || []).map((p, i) => `<div class="step"><span class="step-number">${p.numero || pad2(i + 1)}</span><div><strong>${p.titulo || ""}</strong><p>${p.texto || ""}</p></div></div>`).join("");
    case "table": {
      const head = (c.colunas || []).map((h) => `<th>${h}</th>`).join("");
      const rows = (c.linhas || []).map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
      return `<table class="data-table">${head ? `<tr>${head}</tr>` : ""}${rows}</table>`;
    }
    case "cta-button":
      return `<div class="cta-button"><span>${c.label || "SAIBA MAIS"}</span></div>`;
    default:
      return "";
  }
}

function slideHtml(s, i) {
  const isLast = i === total - 1;
  const isCapa = (s.tipo || (i === 0 ? "capa" : "")) === "capa" || i === 0;
  const fillPct = isLast ? 100 : Math.round(((i + 1) / total) * 100);
  const bar = `<div class="brand-bar"><span>${handle}</span><span class="counter">${i + 1}/${total}</span></div>`;
  const progress = `<div class="progress"><div class="fill" style="width:${fillPct}%"></div></div>`;
  const swipe = isLast ? "" : `<div class="swipe">›</div>`;

  if (isCapa) {
    const bg = s.imagem && s.imagem.tipo === "local" ? imgData(s.imagem.ref) : null;
    const badge = meta.tipo_badge ? `<div class="badge">${meta.tipo_badge}</div>` : "";
    return `<div class="slide capa ${s.bg}" id="slide-${i + 1}">
      ${bg ? `<div class="capa-bg" style="background-image:url('${bg}')"></div><div class="capa-grad"></div>` : ""}
      ${bar}${swipe}
      <div class="content">${badge}<div class="capa-headline">${s.headline || ""}</div></div>
      ${progress}
    </div>`;
  }

  const tag = s.tag ? `<div class="tag${/nicho/i.test(s.papel || "") ? " niche" : ""}">${s.tag}</div>` : "";
  const head = s.headline ? `<div class="h1">${s.headline}</div>` : "";
  const blocos = (s.blocos || []).map((b) => `<div class="body">${b}</div>`).join("");
  const comps = (s.componentes || []).map(componenteHtml).join("");
  const source = s.source ? `<div class="source-badge">${s.source}</div>` : "";
  let cta = "";
  if (isLast && s.cta && (s.cta.instrucao || s.cta.palavra)) {
    const label = [s.cta.instrucao, s.cta.palavra ? `"${s.cta.palavra}"` : "", "→"].filter(Boolean).join(" ");
    cta = `<div class="cta-button"><span>${label}</span></div>${s.cta.beneficio ? `<div class="body">${s.cta.beneficio}</div>` : ""}`;
  }
  return `<div class="slide ${s.bg}" id="slide-${i + 1}">
    ${bar}${swipe}
    <div class="content">${tag}${comps}${head}${blocos}${cta}${source}</div>
    ${progress}
  </div>`;
}

function docHtml(bodyInner, extraCss = "") {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
  <style>${fontFaceCss()}\n${CSS}\n${rootCss(brand)}\n${extraCss}</style></head>
  <body>${bodyInner}</body></html>`;
}

// ---------- saída ----------
const pngDir = join(pecaDir, "png");
mkdirSync(pngDir, { recursive: true });

const slidesInner = slides.map((s, i) => slideHtml(s, i)).join("\n");
const slidesDoc = docHtml(`<div style="display:flex;flex-direction:column;gap:24px;align-items:center;padding:24px;">${slidesInner}</div>`);
writeFileSync(join(pecaDir, "render.html"), slidesDoc); // debug

if (!fontsEmbedded()) console.warn("aviso: fontes base64 ausentes (rode build-fonts.mjs); preview pode usar fonte do sistema.");

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
  const page = await ctx.newPage();
  await page.setContent(slidesDoc, { waitUntil: "networkidle" });
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}

  // overflow por slide (mede antes do screenshot)
  const report = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll(".slide").forEach((el) => {
      const c = el.querySelector(".content") || el;
      const excesso = Math.max(0, c.scrollHeight - c.clientHeight);
      out.push({ id: el.id, overflow: excesso > 6, excesso_px: excesso });
    });
    return out;
  });

  // screenshot por slide
  for (let i = 0; i < total; i++) {
    const el = await page.$(`#slide-${i + 1}`);
    if (!el) { console.warn("slide não encontrado: #slide-" + (i + 1)); continue; }
    await el.screenshot({ path: join(pngDir, `slide-${pad2(i + 1)}.png`) });
  }

  // contact-sheet (grade 3 col), escala 1
  const sheetDoc = docHtml(`<div class="sheet">${slidesInner}</div>`);
  const sheetPage = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage();
  await sheetPage.setContent(sheetDoc, { waitUntil: "networkidle" });
  try { await sheetPage.evaluate(() => document.fonts && document.fonts.ready); } catch {}
  const sheetEl = await sheetPage.$(".sheet");
  if (sheetEl) await sheetEl.screenshot({ path: join(pecaDir, "contact-sheet.png") });

  // report.json
  const overflowSlides = report.filter((r) => r.overflow);
  writeFileSync(join(pecaDir, "report.json"), JSON.stringify({
    ok: overflowSlides.length === 0,
    slides: total,
    dimensao: "1080x1350",
    fonts_embedded: fontsEmbedded(),
    overflow: overflowSlides,
  }, null, 2));

  // preview.html (frame do Instagram, referencia os PNGs)
  const legendaPath = join(pecaDir, "legenda.txt");
  const legenda = existsSync(legendaPath) ? readFileSync(legendaPath, "utf8").split("\n")[0] : (meta.tema || "");
  const inicial = (handle.replace(/^@/, "")[0] || "?").toUpperCase();
  const dots = slides.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("");
  const imgs = slides.map((_, i) => `<img src="./png/slide-${pad2(i + 1)}.png" style="width:420px;display:block;flex:0 0 auto;scroll-snap-align:start;">`).join("");
  const previewDoc = docHtml(
    `<div style="display:flex;justify-content:center;padding:24px;">
      <div class="ig-frame">
        <div class="ig-header"><div class="ava">${inicial}</div><div class="who">${handle.replace(/^@/, "")}<small>${meta.tema || ""}</small></div><div class="more">•••</div></div>
        <div style="display:flex;overflow-x:auto;scroll-snap-type:x mandatory;">${imgs}</div>
        <div class="ig-actions"><span>♡</span><span>💬</span><span>✈️</span><span class="save">🔖</span></div>
        <div class="ig-dots">${dots}</div>
        <div class="ig-caption"><b>${handle.replace(/^@/, "")}</b> ${legenda}</div>
      </div>
    </div>`,
    `body{background:#fafafa;}`,
  );
  writeFileSync(join(pecaDir, "preview.html"), previewDoc);

  console.log(JSON.stringify({
    ok: overflowSlides.length === 0,
    pasta: pecaDir,
    pngs: total,
    overflow: overflowSlides.map((o) => o.id),
    arquivos: ["png/slide-01..%02d.png".replace("%02d", pad2(total)), "preview.html", "contact-sheet.png", "report.json", "render.html"],
  }, null, 2));
} finally {
  await browser.close();
}
