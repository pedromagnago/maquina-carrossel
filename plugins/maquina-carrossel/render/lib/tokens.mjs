// Derivação de paleta a partir de UMA cor primária da marca.
// Porta a lógica do brand_intake/colors.py (HSL warm/cool + mistura) para JS com culori.
// Regra dura: a primária nunca é fundo de texto corrido — só accent/headline/borda/progress.

import { converter, formatHex, interpolate, parse } from "culori";

const toHsl = converter("hsl");

const DEFAULTS = {
  P: "#2D6BFF",      // primária neutra profissional (quando a marca não tem cor)
  ALERT: "#FF6B35",  // laranja de alerta
  OK: "#00C853",     // verde de resultado
  DT: "#1A2332",     // texto em fundo claro
  LT: "#F5F7FA",     // texto em fundo escuro
  F_HEAD: "Space Grotesk",
  F_BODY: "DM Sans",
};

function mix(a, b, t) {
  // mistura perceptual em oklab; devolve hex
  return formatHex(interpolate([a, b], "oklab")(t));
}

function safeHex(value, fallback) {
  if (!value) return fallback;
  const p = parse(value);
  return p ? formatHex(p) : fallback;
}

// Lê a cor primária e tokens do brand pack (aceita render_tokens OU visual_tokens).
function readBrand(brand) {
  const rt = brand?.render_tokens || {};
  const vt = brand?.visual_tokens || {};
  const cores = vt.cores || {};
  const fontes = vt.fontes || {};
  return {
    P: rt.P || cores.primaria || cores.primary || DEFAULTS.P,
    ALERT: rt.ALERT || cores.acento || cores.accent || DEFAULTS.ALERT,
    OK: rt.OK || cores.sucesso || cores.success || DEFAULTS.OK,
    F_HEAD: rt.F_HEAD || fontes.headline || fontes.titulo || DEFAULTS.F_HEAD,
    F_BODY: rt.F_BODY || fontes.body || fontes.corpo || DEFAULTS.F_BODY,
    // se a marca já trouxe derivados explícitos, respeitamos:
    PL: rt.PL,
    PD: rt.PD,
    LB: rt.LB,
    DB: rt.DB,
    LR: rt.LR,
  };
}

export function deriveTokens(brand = {}) {
  const b = readBrand(brand);
  const P = safeHex(b.P, DEFAULTS.P);
  const ALERT = safeHex(b.ALERT, DEFAULTS.ALERT);
  const OK = safeHex(b.OK, DEFAULTS.OK);

  const hue = toHsl(P).h ?? 220;
  const warm = hue < 90 || hue > 330; // vermelho/laranja/amarelo

  const PL = safeHex(b.PL, mix(P, "#ffffff", 0.18));
  const PD = safeHex(b.PD, mix(P, "#000000", 0.28));
  const LB = safeHex(b.LB, warm ? "#F7F5F2" : "#F4F5F7");
  const DB = safeHex(b.DB, warm ? "#16120D" : "#0E1320");
  const LR = b.LR || "rgba(26,35,50,0.10)";
  const ALERT_D = mix(ALERT, "#000000", 0.32);

  return {
    P, PL, PD, LB, DB, LR,
    ALERT, ALERT_D, OK,
    DT: DEFAULTS.DT,
    LT: DEFAULTS.LT,
    F_HEAD: b.F_HEAD,
    F_BODY: b.F_BODY,
    warm,
  };
}

// Bloco :root CSS a injetar no <head>, com as vars que o design-system.css consome.
export function rootCss(brand = {}) {
  const t = deriveTokens(brand);
  return `:root{
  --P:${t.P}; --PL:${t.PL}; --PD:${t.PD};
  --LB:${t.LB}; --LR:${t.LR}; --DB:${t.DB};
  --DT:${t.DT}; --LT:${t.LT};
  --ALERT:${t.ALERT}; --ALERT-D:${t.ALERT_D}; --OK:${t.OK};
  --G: linear-gradient(165deg, ${t.PD} 0%, ${t.P} 50%, ${t.PL} 100%);
  --G-ALERT: linear-gradient(165deg, ${t.ALERT_D} 0%, ${t.ALERT} 100%);
  --F-HEAD: '${t.F_HEAD}', 'Space Grotesk', system-ui, sans-serif;
  --F-BODY: '${t.F_BODY}', 'DM Sans', system-ui, sans-serif;
}`;
}
