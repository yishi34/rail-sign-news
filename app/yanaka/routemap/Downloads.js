"use client";

// 路線図(.rm-svg)を PNG / PDF / SVG でダウンロードするボタン。
// 追加パッケージは使わず、ブラウザの canvas だけで生成する。

// SVGの文字色・サイズはCSS(globals.css)で当てているため、
// 書き出し時はSVGの中に同じスタイルを直接埋め込む(外部CSSは画像化されない)。
const SVG_STYLE = `
.rm-tier{font-weight:900;font-size:15px;font-family:'Noto Sans JP',sans-serif}
.rm-name{font-size:15px;font-weight:600;fill:#6e7479;font-family:'Noto Sans JP',sans-serif}
.rm-name-exp{font-weight:900;fill:#1a1a1a}
.rm-transfer{font-size:9.5px;font-weight:600;fill:#0072bc;font-family:'Noto Sans JP',sans-serif}
.ex-title{font-size:22px;font-weight:900;fill:#1a1a1a;font-family:'Noto Sans JP',sans-serif}
.ex-title-en{font-size:12px;font-weight:600;fill:#6e7479;font-family:'Barlow Semi Condensed',sans-serif}
.ex-leg{font-size:13px;font-weight:700;fill:#1a1a1a;font-family:'Noto Sans JP',sans-serif}
.ex-note{font-size:12px;font-weight:600;fill:#6e7479;font-family:'Noto Sans JP',sans-serif}
`;

const NS = "http://www.w3.org/2000/svg";

// 画面の路線図SVGの上に「路線名+凡例」のヘッダーを足して、
// 1枚の完成した路線図SVG(白背景・スタイル埋め込み)を組み立てる
function buildSvg() {
  const svg = document.querySelector(".rm-svg");
  if (!svg) return null;
  const w = Number(svg.getAttribute("width"));
  const baseH = Number(svg.getAttribute("height"));
  const HEADER = 92; // ヘッダー(路線名+凡例)の高さ
  const h = baseH + HEADER;

  const el = (name, attrs) => {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, String(attrs[k]));
    return e;
  };
  const textEl = (x, y, str, cls) => {
    const t = el("text", { x, y, class: cls });
    t.textContent = str;
    return t;
  };
  const ringEl = (cx, cy, r, stroke) =>
    el("circle", { cx, cy, r, fill: "#fff", stroke, "stroke-width": 3 });

  const out = el("svg", { xmlns: NS, viewBox: `0 0 ${w} ${h}`, width: w, height: h });

  const style = document.createElementNS(NS, "style");
  style.textContent = SVG_STYLE;
  out.appendChild(style);

  // 背景(白)
  out.appendChild(el("rect", { x: 0, y: 0, width: w, height: h, fill: "#ffffff" }));

  // ヘッダー: 路線名(黄→白→緑の帯つき)
  out.appendChild(el("rect", { x: 6, y: 12, width: 8, height: 10, fill: "#f5a900" }));
  out.appendChild(el("rect", { x: 6, y: 30, width: 8, height: 10, fill: "#1b7a40" }));
  out.appendChild(textEl(24, 34, "谷鉄 奥武蔵線", "ex-title"));
  out.appendChild(textEl(190, 33, "OKU-MUSASHI LINE", "ex-title-en"));
  out.appendChild(el("line", { x1: 16, y1: 50, x2: w - 16, y2: 50, stroke: "#1b7a40", "stroke-width": 2 }));

  // ヘッダー: 凡例
  out.appendChild(ringEl(24, 71, 7, "#f5a900"));
  out.appendChild(textEl(37, 75, "急行停車駅", "ex-leg"));
  out.appendChild(ringEl(122, 71, 7, "#1b7a40"));
  out.appendChild(textEl(135, 75, "普通停車駅", "ex-leg"));
  out.appendChild(textEl(220, 75, "これはイメージ路線図です。", "ex-note"));

  // 路線図本体(ヘッダーのぶん下にずらして配置)
  const g = el("g", { transform: `translate(0 ${HEADER})` });
  Array.from(svg.childNodes).forEach((n) => g.appendChild(n.cloneNode(true)));
  out.appendChild(g);

  return { str: new XMLSerializer().serializeToString(out), w, h };
}

// SVG → canvas(scale倍の高解像度)
async function toCanvas(scale = 2) {
  const info = buildSvg();
  if (!info) return null;
  const blob = new Blob([info.str], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = info.w * scale;
    canvas.height = info.h * scale;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// JPEG画像1枚を埋め込んだ最小のPDFを組み立てる(依存パッケージなし)
function buildPdf(jpeg, iw, ih) {
  const W = (iw / 2).toFixed(2);
  const H = (ih / 2).toFixed(2);
  const enc = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const xref = [];
  const push = (bytes) => {
    chunks.push(bytes);
    offset += bytes.length;
  };
  const pushStr = (s) => push(enc.encode(s));

  const content = `q\n${W} 0 0 ${H} 0 0 cm\n/Im0 Do\nQ`;

  pushStr("%PDF-1.3\n");
  xref[1] = offset;
  pushStr("1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n");
  xref[2] = offset;
  pushStr("2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n");
  xref[3] = offset;
  pushStr(
    `3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${W} ${H}]/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>\nendobj\n`
  );
  xref[4] = offset;
  pushStr(
    `4 0 obj\n<</Type/XObject/Subtype/Image/Width ${iw}/Height ${ih}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpeg.length}>>\nstream\n`
  );
  push(jpeg);
  pushStr("\nendstream\nendobj\n");
  xref[5] = offset;
  pushStr(`5 0 obj\n<</Length ${content.length}>>\nstream\n${content}\nendstream\nendobj\n`);

  const xrefOffset = offset;
  let xrefStr = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    xrefStr += String(xref[i]).padStart(10, "0") + " 00000 n \n";
  }
  pushStr(xrefStr);
  pushStr(`trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF`);

  const total = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

export default function Downloads({ baseName = "谷鉄_奥武蔵線_路線図" }) {
  async function onPng() {
    const canvas = await toCanvas(2);
    if (!canvas) return;
    canvas.toBlob((blob) => blob && triggerDownload(blob, `${baseName}.png`), "image/png");
  }

  async function onPdf() {
    const canvas = await toCanvas(2);
    if (!canvas) return;
    const jpeg = dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.92));
    const pdf = buildPdf(jpeg, canvas.width, canvas.height);
    triggerDownload(new Blob([pdf], { type: "application/pdf" }), `${baseName}.pdf`);
  }

  function onSvg() {
    const info = buildSvg();
    if (!info) return;
    const blob = new Blob([info.str], { type: "image/svg+xml;charset=utf-8" });
    triggerDownload(blob, `${baseName}.svg`);
  }

  return (
    <div className="rm-downloads">
      <span className="rm-dl-label">ダウンロード:</span>
      <button type="button" className="rm-dl-btn" onClick={onPng}>PNG画像</button>
      <button type="button" className="rm-dl-btn" onClick={onPdf}>PDF</button>
      <button type="button" className="rm-dl-btn" onClick={onSvg}>SVG</button>
    </div>
  );
}
