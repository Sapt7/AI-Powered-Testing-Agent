// Renders the Notion case-study covers and page icons in the Workbench style.
// Usage: node scripts/notion-site-assets.mjs  →  docs/notion-site/{covers,icons}/*.png
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve("docs/notion-site");
mkdirSync(`${OUT}/covers`, { recursive: true });
mkdirSync(`${OUT}/icons`, { recursive: true });

const INDIGO = "#32389F";
const INDIGO_HI = "#4A52D6";
const INDIGO_LO = "#262A82";

/* ---------- Icons: the brand tile, one white line glyph per page ---------- */

const s = 'fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
const glyphs = {
  home: `<path d="M8.5 16.5 l3.4 3.4 6.6-7.6" ${s} stroke-width="2.6"/><path d="M21 13h3.5M21 19h3.5" ${s} stroke-opacity=".6" stroke-width="2.2"/>`,
  problem: `<circle cx="16" cy="16" r="8" ${s}/><circle cx="16" cy="16" r="3.6" ${s}/><circle cx="16" cy="16" r=".9" fill="#fff"/>`,
  product: `<rect x="7" y="8.5" width="18" height="15" rx="2.6" ${s}/><path d="M7 12.6h18" ${s}/><path d="M10.5 16.6h6M10.5 20h9" ${s} stroke-opacity=".7"/>`,
  how: `<circle cx="9.5" cy="16" r="2.6" ${s}/><circle cx="22.5" cy="10" r="2.6" ${s}/><circle cx="22.5" cy="22" r="2.6" ${s}/><path d="M12 15l8-4M12 17l8 4" ${s}/>`,
  proof: `<path d="M8 23.5h16" ${s}/><path d="M11 23.5v-6M16 23.5v-11" ${s} stroke-width="3.2"/><path d="M19.6 13.4l1.9 1.9 3.4-4" ${s}/>`,
  decisions: `<path d="M16 8v16M11 24h10M9 11h14" ${s}/><path d="M9 11l-3 6.5h6zM23 11l-3 6.5h6z" ${s} stroke-width="2"/>`,
  leftout: `<rect x="8" y="8" width="16" height="16" rx="2.6" ${s} stroke-dasharray="3 2.6"/><path d="M12.5 16h7" ${s}/>`,
  design: `<circle cx="12" cy="12" r="3.2" ${s}/><circle cx="20" cy="12" r="3.2" ${s}/><circle cx="12" cy="20" r="3.2" ${s}/><circle cx="20" cy="20" r="3.2" fill="#fff" stroke="none"/>`,
  unknown: `<path d="M12.6 12.4a3.6 3.6 0 1 1 5 3.3c-1 .5-1.6 1.2-1.6 2.3v.8" ${s}/><circle cx="16" cy="22.6" r="1.25" fill="#fff"/>`,
  log: `<path d="M10 9.5v13" ${s} stroke-opacity=".55"/><circle cx="10" cy="10" r="1.6" fill="#fff"/><circle cx="10" cy="16" r="1.6" fill="#fff"/><circle cx="10" cy="22" r="1.6" fill="#fff"/><path d="M14.5 10h9M14.5 16h7M14.5 22h8" ${s}/>`,
};

const iconSvg = (glyph) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="256" height="256">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${INDIGO_HI}"/><stop offset="1" stop-color="${INDIGO_LO}"/></linearGradient></defs>
  <rect width="32" height="32" rx="8" fill="url(#g)"/>${glyph}</svg>`;

/* ---------- Covers: the bench ground with floating windows ---------- */

// A window: white, rounded, deep soft shadow, a title bar, rows. One row may be selected (indigo).
function windowEl({ x, y, w, rows = 4, selected = -1, title = 0.42, rowW = [0.62, 0.48, 0.7, 0.55, 0.66, 0.5], tilt = 0, opacity = 1, dots = false }) {
  const rowH = 46;
  const head = 64;
  const h = head + 22 + rows * (rowH + 10) + 12;
  let inner = `<div style="height:${head}px;border-bottom:1px solid rgba(13,21,33,.07);display:flex;align-items:center;gap:14px;padding:0 26px">
    <span style="width:14px;height:14px;border-radius:4px;background:${INDIGO};opacity:.9"></span>
    <span style="height:12px;width:${Math.round(w * title)}px;border-radius:6px;background:#0D1521;opacity:.78"></span>
    ${dots ? `<span style="margin-left:auto;display:flex;gap:8px"><i style="width:44px;height:20px;border-radius:10px;background:#EEEFFC"></i><i style="width:28px;height:20px;border-radius:10px;background:#F1F4F8"></i></span>` : ""}
  </div><div style="padding:22px 18px 12px">`;
  for (let i = 0; i < rows; i++) {
    const sel = i === selected;
    inner += `<div style="height:${rowH}px;margin-bottom:10px;border-radius:12px;display:flex;align-items:center;gap:14px;padding:0 16px;
      background:${sel ? INDIGO : "transparent"};box-shadow:${sel ? "0 2px 4px rgba(38,42,130,.3),0 16px 30px -14px rgba(50,56,159,.6)" : "none"}">
      <span style="font:600 15px/1 'IBM Plex Mono',ui-monospace,monospace;color:${sel ? "rgba(255,255,255,.75)" : "#8A93A3"}">${String(i + 1).padStart(2, "0")}</span>
      <span style="height:11px;width:${Math.round((w - 140) * rowW[i % rowW.length])}px;border-radius:6px;background:${sel ? "#fff" : "#0D1521"};opacity:${sel ? 0.95 : 0.16}"></span>
      <span style="margin-left:auto;height:20px;width:52px;border-radius:6px;background:${sel ? "rgba(255,255,255,.18)" : ["#FEEDEC", "#FEF2DC", "#E8F6FC"][i % 3]}"></span>
    </div>`;
  }
  inner += `</div>`;
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;opacity:${opacity};transform:rotate(${tilt}deg);
    background:#fff;border-radius:22px;border:1px solid rgba(13,21,33,.08);
    box-shadow:0 2px 4px rgba(13,21,33,.05),0 24px 56px -20px rgba(13,21,33,.18),0 80px 140px -50px rgba(50,56,159,.32)">${inner}</div>`;
}

// Each cover is a composition of windows centred in the band Notion actually shows (middle ~35%).
const covers = {
  home: [
    { x: 760, y: 360, w: 620, rows: 5, selected: 3, opacity: 0.55, tilt: -2 },
    { x: 1620, y: 330, w: 620, rows: 5, selected: 1, opacity: 0.55, tilt: 2 },
    { x: 1150, y: 290, w: 700, rows: 6, selected: 2, dots: true },
  ],
  problem: [
    { x: 900, y: 340, w: 560, rows: 5, selected: -1, opacity: 0.6, tilt: -3, rowW: [0.3, 0.8, 0.45, 0.2, 0.7] },
    { x: 1540, y: 340, w: 560, rows: 5, selected: -1, opacity: 0.6, tilt: 3, rowW: [0.7, 0.25, 0.6, 0.85, 0.35] },
    { x: 1230, y: 300, w: 560, rows: 5, selected: 2 },
  ],
  product: [{ x: 960, y: 290, w: 1080, rows: 6, selected: 1, dots: true }],
  how: [
    { x: 620, y: 380, w: 520, rows: 4, selected: -1, opacity: 0.7 },
    { x: 1240, y: 330, w: 520, rows: 4, selected: 1 },
    { x: 1860, y: 380, w: 520, rows: 4, selected: 2, opacity: 0.7 },
  ],
  proof: [
    { x: 880, y: 320, w: 600, rows: 5, selected: -1, opacity: 0.7, rowW: [0.4, 0.3, 0.45, 0.25, 0.35] },
    { x: 1540, y: 320, w: 600, rows: 5, selected: 0, rowW: [0.8, 0.66, 0.74, 0.7, 0.82] },
  ],
  decisions: [
    { x: 1000, y: 300, w: 1000, rows: 6, selected: 4, rowW: [0.5, 0.62, 0.44, 0.7, 0.58, 0.4] },
  ],
  leftout: [
    { x: 1050, y: 300, w: 900, rows: 6, selected: -1, rowW: [0.6, 0.5, 0.7, 0.45, 0.62, 0.52] },
  ],
  design: [
    { x: 820, y: 360, w: 560, rows: 4, selected: 0, opacity: 0.45, tilt: -2 },
    { x: 1620, y: 360, w: 560, rows: 4, selected: 3, opacity: 0.45, tilt: 2 },
    { x: 1200, y: 300, w: 600, rows: 5, selected: 1, dots: true },
  ],
  unknown: [
    { x: 1080, y: 300, w: 840, rows: 6, selected: -1, opacity: 0.85, rowW: [0.55, 0.2, 0.62, 0.18, 0.5, 0.15] },
  ],
  log: [
    { x: 760, y: 420, w: 520, rows: 4, selected: -1, opacity: 0.5 },
    { x: 1240, y: 360, w: 520, rows: 4, selected: -1, opacity: 0.75 },
    { x: 1720, y: 300, w: 520, rows: 4, selected: 0 },
  ],
};

// Dashed "cut" rows for the left-out cover are drawn as an overlay.
const extras = {
  leftout: `<div style="position:absolute;left:1068px;top:386px;width:864px;height:340px;pointer-events:none">
    ${[1, 3, 5].map((r) => `<div style="position:absolute;left:0;right:0;top:${(r - 1) * 56 + 2}px;height:46px;border:2.5px dashed ${INDIGO};border-radius:12px;background:rgba(255,255,255,.86)"></div>`).join("")}
  </div>`,
  unknown: `<div style="position:absolute;left:1820px;top:250px;width:150px;height:150px;border-radius:40px;background:linear-gradient(135deg,${INDIGO_HI},${INDIGO_LO});box-shadow:0 30px 60px -20px rgba(50,56,159,.6);display:flex;align-items:center;justify-content:center">
    <svg viewBox="0 0 32 32" width="96" height="96">${glyphs.unknown}</svg></div>`,
};

const coverHtml = (key) => `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@600&display=swap" rel="stylesheet">
<style>html,body{margin:0}body{width:3000px;height:1200px;overflow:hidden;position:relative;
background:
  radial-gradient(1400px 900px at 14% -10%, rgba(255,255,255,.95), transparent 60%),
  radial-gradient(1300px 900px at 92% 8%, rgba(214,217,250,.75), transparent 62%),
  radial-gradient(1100px 700px at 50% 120%, rgba(200,222,240,.6), transparent 60%),
  linear-gradient(180deg,#EEF4F9,#E3ECF3)}</style></head><body>
${covers[key].map(windowEl).join("")}${extras[key] ?? ""}</body></html>`;

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const [key, glyph] of Object.entries(glyphs)) {
  await page.setViewportSize({ width: 256, height: 256 });
  await page.setContent(`<body style="margin:0;background:transparent">${iconSvg(glyph)}</body>`);
  await page.screenshot({ path: `${OUT}/icons/${key}.png`, omitBackground: true, clip: { x: 0, y: 0, width: 256, height: 256 } });
}

for (const key of Object.keys(covers)) {
  await page.setViewportSize({ width: 3000, height: 1200 });
  await page.setContent(coverHtml(key), { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/covers/${key}.png`, type: "png" });
}

await browser.close();
console.log("done");
