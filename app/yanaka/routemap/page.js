import Link from "next/link";
import yanaka from "../../../data/yanaka.json";

export const metadata = {
  title: "路線図 | 谷中日本鉄道 | RAIL SIGN NEWS",
  description:
    "架空鉄道「谷中日本鉄道株式会社(YNR)」奥武蔵線のイメージ路線図。実在の鉄道会社とは関係ありません。",
};

// レイアウト定数
const X0 = 104; // 左の余白(急行/普通ラベル用)
const GAP = 60; // 駅の間隔
const Y_EXP = 64; // 急行(上段)の線のy
const Y_LOC = 104; // 普通(下段)の線のy(上下段の間隔は40)
const NAME_TOP = Y_LOC + 14; // 駅名の開始y
const NAME_CH = 17; // 駅名1文字ぶんの高さ
const TR_GAP = 10; // 駅名と乗換表記のあいだ
const TR_LH = 13; // 乗換表記の行の高さ
const COLOR_EXP = "#f5a900"; // 黄(急行)
const COLOR_LOC = "#1b7a40"; // 緑(普通)

// 各駅の、駅名+乗換表記をふくめた下端y
function stationBottom(s) {
  const nameEnd = NAME_TOP + s.name.length * NAME_CH;
  const tr = s.transfer ? TR_GAP + s.transfer.length * TR_LH : 0;
  return nameEnd + tr;
}

function RouteSvg({ stations }) {
  const n = stations.length;
  const xAt = (i) => X0 + i * GAP;
  const width = X0 + (n - 1) * GAP + 48;
  const height = Math.max(...stations.map(stationBottom)) + 16;
  const firstX = xAt(0);
  const lastX = xAt(n - 1);

  return (
    <svg
      className="rm-svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="奥武蔵線 路線図(上段=急行、下段=普通)"
    >
      {/* 段のラベル */}
      <text x="20" y={Y_EXP + 5} className="rm-tier" fill={COLOR_EXP}>急行</text>
      <text x="20" y={Y_LOC + 5} className="rm-tier" fill={COLOR_LOC}>普通</text>

      {/* 普通の線(全駅) */}
      <line x1={firstX} y1={Y_LOC} x2={lastX} y2={Y_LOC} stroke={COLOR_LOC} strokeWidth="10" strokeLinecap="round" />
      {/* 急行の線(急行停車駅を結ぶ。通過駅の上は素通り) */}
      <line x1={firstX} y1={Y_EXP} x2={lastX} y2={Y_EXP} stroke={COLOR_EXP} strokeWidth="8" strokeLinecap="round" />

      {stations.map((s, i) => {
        const x = xAt(i);
        return (
          <g key={s.name}>
            {/* 急行停車駅は上下をつなぐ */}
            {s.express && (
              <line x1={x} y1={Y_EXP} x2={x} y2={Y_LOC} stroke="#e0b441" strokeWidth="3" />
            )}
            {/* 普通の駅マーク(全駅) */}
            <circle cx={x} cy={Y_LOC} r="6" fill="#fff" stroke={COLOR_LOC} strokeWidth="3" />
            {/* 急行停車駅マーク(○) */}
            {s.express && (
              <circle cx={x} cy={Y_EXP} r="8" fill="#fff" stroke={COLOR_EXP} strokeWidth="3.5" />
            )}
            {/* 駅名(縦書き) */}
            <text
              x={x}
              y={NAME_TOP}
              className={s.express ? "rm-name rm-name-exp" : "rm-name"}
              writingMode="vertical-rl"
              textAnchor="start"
            >
              {s.name}
            </text>
            {/* 乗換路線(駅名の下に小さく) */}
            {s.transfer &&
              s.transfer.map((t, j) => (
                <text
                  key={j}
                  x={x}
                  y={NAME_TOP + s.name.length * NAME_CH + TR_GAP + j * TR_LH}
                  className="rm-transfer"
                  textAnchor="middle"
                >
                  {t}
                </text>
              ))}
          </g>
        );
      })}
    </svg>
  );
}

export default function YanakaRouteMapPage() {
  const rm = yanaka.routemap;

  return (
    <>
      <header className="yk-header">
        <div className="station-sign yk-sign">
          <img src={yanaka.page.logo} alt="谷中日本鉄道ロゴマーク" className="yk-logo" />
          <h1>{rm.title}</h1>
          <div className="romaji en">{rm.lineEn}</div>
          <span className="fiction-label">{yanaka.label}</span>
          <div className="next">
            <Link href="/yanaka">◀ 谷中日本鉄道トップへもどる</Link>
            <span>YN LINE</span>
          </div>
        </div>
      </header>

      <main className="yk-main">
        <section>
          {rm.lines.map((line) => (
            <div className="rm-card" key={line.id}>
              <div className="rm-card-head">
                {/* 路線名 */}
                <div className="rm-line">
                  <span className="rm-line-band"></span>
                  <h2 className="rm-line-title">谷鉄 {line.name}</h2>
                  <span className="rm-line-en en">{rm.lineEn}</span>
                </div>
                {/* 凡例 */}
                <div className="rm-legend">
                  <span className="rm-legend-item"><span className="rm-chip rm-chip-exp"></span>急行停車駅</span>
                  <span className="rm-legend-item"><span className="rm-chip rm-chip-loc"></span>普通停車駅</span>
                  <span className="rm-note">{rm.note}</span>
                </div>
              </div>
              {/* 路線図(駅数が多いので横スクロール) */}
              <div className="rm-scroll">
                <RouteSvg stations={line.stations} />
              </div>
            </div>
          ))}
          <p className="rm-hint">← 横にスクロールできます →</p>
        </section>
      </main>

      <footer>
        谷中日本鉄道株式会社(YNR)は架空の鉄道会社です。実在の鉄道会社・団体とは一切関係ありません。© YANAKA JAPAN RAILWAY (RAIL SIGN NEWS)
      </footer>
    </>
  );
}
