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
`;

const NS = "http://www.w3.org/2000/svg";

// 画面のSVGを複製し、白背景とスタイルを埋め込んだ文字列にする
function buildSvg() {
  const svg = document.querySelector(".rm-svg");
  if (!svg) return null;
  const w = Number(svg.getAttribute("width"));
  const h = Number(svg.getAttribute("height"));
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", NS);

  const style = document.createElementNS(NS, "style");
  style.textContent = SVG_STYLE;
  const bg = document.createElementNS(NS, "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", String(w));
  bg.setAttribute("height", String(h));
  bg.setAttribute("fill", "#ffffff");
  clone.insertBefore(bg, clone.firstChild);
  clone.insertBefore(style, clone.firstChild);

  return { str: new XMLSerializer().serializeToString(clone), w, h };
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
