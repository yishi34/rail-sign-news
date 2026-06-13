/**
 * 谷鉄 奥武蔵線 路線図 SVG生成スクリプト
 *
 * 使い方:
 * 1. routemap-data.json を読み込む
 * 2. generateRoutemap(data) を呼び出してSVGコードを生成
 * 3. SVGをファイルまたはHTMLに出力
 *
 * 他のAI・ツールでも使えるよう、依存なしで動作します
 */

function generateRoutemap(data) {
  const NS = "http://www.w3.org/2000/svg";

  // レイアウト定数(単位: ピクセル)
  const X0 = 104;        // 左の余白(「急行」「普通」ラベル用)
  const GAP = 60;        // 駅と駅の間隔
  const Y_EXP = 64;      // 急行線のY座標
  const Y_LOC = 104;     // 普通線のY座標(上下段の間隔: 40px)
  const NAME_TOP = Y_LOC + 14;  // 駅名の開始Y
  const NAME_CH = 17;    // 駅名1文字の高さ
  const TR_GAP = 10;     // 駅名と乗換表記のあいだ
  const TR_LH = 13;      // 乗換表記の行高
  const HEADER = 92;     // ヘッダー(路線名+凡例)の高さ

  // SVG出力用のヘルパー関数
  const el = (name, attrs = {}) => {
    const e = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
    return e;
  };

  // テキスト要素を作成
  const textEl = (x, y, str, className) => {
    const t = el("text", { x, y, class: className });
    t.textContent = str;
    return t;
  };

  // 円形マーク(駅マーク)を作成
  const circleEl = (cx, cy, r, fill, stroke, strokeWidth) =>
    el("circle", { cx, cy, r, fill, stroke, "stroke-width": strokeWidth });

  // ========== SVGルートを組み立て開始 ==========
  const stations = data.stations;
  const n = stations.length;
  const xAt = (i) => X0 + i * GAP;

  // 駅の下端Y(駅名+乗換表記を含めた高さを計算)
  const stationBottom = (s) => {
    const nameEnd = NAME_TOP + s.name.length * NAME_CH;
    const tr = s.transfer ? TR_GAP + s.transfer.length * TR_LH : 0;
    return nameEnd + tr;
  };

  const baseH = Math.max(...stations.map(stationBottom)) + 16;
  const totalH = baseH + HEADER;
  const totalW = X0 + (n - 1) * GAP + 48;
  const firstX = xAt(0);
  const lastX = xAt(n - 1);

  // ========== ルートSVG作成 ==========
  const svg = el("svg", {
    xmlns: NS,
    viewBox: `0 0 ${totalW} ${totalH}`,
    width: totalW,
    height: totalH
  });

  // スタイル埋め込み(SVGに文字情報を埋め込む場合)
  const style = document.createElementNS(NS, "style");
  style.textContent = `
    .rm-tier { font-weight: 900; font-size: 15px; font-family: 'Noto Sans JP', sans-serif; }
    .rm-name { font-size: 15px; font-weight: 600; fill: #6e7479; font-family: 'Noto Sans JP', sans-serif; }
    .rm-name-exp { font-weight: 900; fill: #1a1a1a; }
    .rm-transfer { font-size: 9.5px; font-weight: 600; fill: #0072bc; font-family: 'Noto Sans JP', sans-serif; }
    .ex-title { font-size: 22px; font-weight: 900; fill: #1a1a1a; font-family: 'Noto Sans JP', sans-serif; }
    .ex-title-en { font-size: 12px; font-weight: 600; fill: #6e7479; font-family: 'Barlow Semi Condensed', sans-serif; }
    .ex-leg { font-size: 13px; font-weight: 700; fill: #1a1a1a; font-family: 'Noto Sans JP', sans-serif; }
    .ex-note { font-size: 12px; font-weight: 600; fill: #6e7479; font-family: 'Noto Sans JP', sans-serif; }
  `;
  svg.appendChild(style);

  // ========== ヘッダー部分 ==========

  // 背景(全体が白)
  svg.appendChild(el("rect", {
    x: 0, y: 0, width: totalW, height: totalH, fill: "#ffffff"
  }));

  // 路線名の帯(黄→白→緑, コーポレートカラー)
  svg.appendChild(el("rect", { x: 6, y: 12, width: 8, height: 10, fill: "#f5a900" }));
  svg.appendChild(el("rect", { x: 6, y: 30, width: 8, height: 10, fill: "#1b7a40" }));

  // 路線名テキスト
  svg.appendChild(textEl(24, 34, data.line.nameJa, "ex-title"));
  svg.appendChild(textEl(190, 33, data.line.nameEn, "ex-title-en"));

  // セパレータライン
  svg.appendChild(el("line", {
    x1: 16, y1: 50, x2: totalW - 16, y2: 50,
    stroke: "#1b7a40", "stroke-width": 2
  }));

  // ========== 凡例 ==========

  // 急行マーク
  svg.appendChild(circleEl(24, 71, 7, "#fff", "#f5a900", 3));
  svg.appendChild(textEl(37, 75, "急行停車駅", "ex-leg"));

  // 普通マーク
  svg.appendChild(circleEl(122, 71, 7, "#fff", "#1b7a40", 3));
  svg.appendChild(textEl(135, 75, "普通停車駅", "ex-leg"));

  // 注釈
  svg.appendChild(textEl(220, 75, "これはイメージ路線図です。", "ex-note"));

  // ========== 路線本体 ==========

  // グループを作成(ヘッダーぶん下へ移動)
  const g = el("g", { transform: `translate(0 ${HEADER})` });

  // ステージラベル(「急行」「普通」)
  g.appendChild(textEl(20, Y_EXP + 5, "急行", "rm-tier"));
  g.appendChild(textEl(20, Y_LOC + 5, "普通", "rm-tier"));

  // 普通線(全駅をつなぐ)
  g.appendChild(el("line", {
    x1: firstX, y1: Y_LOC, x2: lastX, y2: Y_LOC,
    stroke: data.colors.local, "stroke-width": 10, "stroke-linecap": "round"
  }));

  // 急行線(全駅をつなぐ。通過駅は素通り)
  g.appendChild(el("line", {
    x1: firstX, y1: Y_EXP, x2: lastX, y2: Y_EXP,
    stroke: data.colors.express, "stroke-width": 8, "stroke-linecap": "round"
  }));

  // ========== 各駅 ==========

  stations.forEach((station, i) => {
    const x = xAt(i);

    // 急行停車駅は、上下の線をつなぐ縦線を引く
    if (station.express) {
      g.appendChild(el("line", {
        x1: x, y1: Y_EXP, x2: x, y2: Y_LOC,
        stroke: "#e0b441", "stroke-width": 3
      }));
    }

    // 普通駅マーク(全駅)
    g.appendChild(circleEl(x, Y_LOC, 6, "#fff", data.colors.local, 3));

    // 急行停車駅マーク(○)
    if (station.express) {
      g.appendChild(circleEl(x, Y_EXP, 8, "#fff", data.colors.express, 3.5));
    }

    // 駅名(縦書き)
    g.appendChild(textEl(x, NAME_TOP, station.name, station.express ? "rm-name rm-name-exp" : "rm-name"));

    // 乗換路線(駅名の下)
    if (station.transfer) {
      station.transfer.forEach((transfer, j) => {
        g.appendChild(textEl(
          x,
          NAME_TOP + station.name.length * NAME_CH + TR_GAP + j * TR_LH,
          transfer,
          "rm-transfer"
        ));
      });
    }
  });

  svg.appendChild(g);

  return svg;
}

// ========== 使用例(Node.js環境での想定) ==========
/*
// データを読み込み
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('routemap-data.json', 'utf-8'));

// SVGを生成
const svg = generateRoutemap(data);

// ファイルに出力
fs.writeFileSync('routemap.svg', new XMLSerializer().serializeToString(svg));
console.log('SVGを出力しました: routemap.svg');
*/

module.exports = { generateRoutemap };
