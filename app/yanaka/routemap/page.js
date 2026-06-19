import Link from "next/link";
import yanaka from "../../../data/yanaka.json";
import Downloads from "./Downloads";

export const metadata = {
  title: "路線図 | 谷中日本鉄道 | RAIL SIGN NEWS",
  description:
    "架空鉄道「谷中日本鉄道株式会社(YNR)」のイメージ路線図。実在の鉄道会社とは関係ありません。",
};

// レイアウト定数
const X0 = 104; // 左の余白(種別ラベル用)
const GAP = 60; // 駅の間隔
const TIER_Y0 = 64; // 一番上の段(最優等種別)のy
const TIER_STEP = 40; // 段と段の間隔
const NAME_CH = 17; // 駅名1文字ぶんの高さ
const TR_GAP = 18; // 駅名の最後の文字と乗換表記のあいだ(約1文字ぶん)
const TR_LH = 13; // 乗換表記の行の高さ

const BRANCH_NAME_GAP = 20; // 本線の駅名の下端から支線の線までの余白
const BRANCH_CORNER_R = 16; // 支線の曲がり角の丸み(カーブ)

// 種別(types)は rank の大きい順=上の段。stop条件: 駅の rank >= 種別の rank
function RouteSvg({ line }) {
  const { types, stations, branches } = line;
  const hasBranch = branches && branches.length > 0;
  const n = stations.length;
  // 種別ラベル(急行/特急アルプス等)が長い場合、線の開始位置を右へずらして駅と重ならないようにする
  const labelMaxLen = Math.max(...types.map((t) => t.label.length));
  const leftBase = Math.max(X0, labelMaxLen * 15 + 40);
  const xAt = (i) => leftBase + i * GAP;
  const tierY = (i) => TIER_Y0 + i * TIER_STEP;
  const bottomIndex = types.length - 1;
  const bottomY = tierY(bottomIndex);
  const nameTop = bottomY + 14;
  const maxRank = Math.max(...types.map((t) => t.rank));
  // 各駅の、駅名+乗換表記をふくめた下端までの深さ(駅名の長さに追従)
  const stationDepth = (s) =>
    s.name.length * NAME_CH + (s.transfer ? TR_GAP + s.transfer.length * TR_LH : 0);
  const maxMainDepth = Math.max(...stations.map(stationDepth));
  const CONT_W = line.continuesTo ? 210 : 0; // 「この先へ続く」表示ぶんの余白
  // 支線の配置情報(分岐駅の次駅との中間で下へ折れ、本線駅名の下を右へのびる)
  const branchInfos = (branches || []).map((b) => {
    const fromIndex = stations.findIndex((s) => s.name === b.from);
    const fromX = xAt(fromIndex);
    const midX = fromX + GAP / 2;
    const bx = (j) => fromX + (j + 1) * GAP;
    const lastBx = bx(b.stations.length - 1);
    return { b, fromIndex, fromX, midX, bx, lastBx };
  });
  // 支線が右にのびる場合、本線より右に出る分の幅も確保する
  const branchExtra = branchInfos.reduce(
    (max, bi) => Math.max(max, bi.lastBx - (leftBase + (n - 1) * GAP)),
    0
  );
  const width = leftBase + (n - 1) * GAP + 48 + CONT_W + branchExtra;
  // 支線が走る区間にかかる本線駅の名前の深さだけで高さを決める(左の長い駅名に引っぱられて下がりすぎないように)
  const branchSpanDepth = branchInfos.reduce((max, bi) => {
    const d = stations.reduce((m, s, i) => {
      const x = xAt(i);
      return x >= bi.fromX - GAP / 2 && x <= bi.lastBx + GAP / 2
        ? Math.max(m, stationDepth(s))
        : m;
    }, 0);
    return Math.max(max, d);
  }, 0);
  // 支線の本線(普通)駅名の下を走らせる
  const branchLineY = nameTop + branchSpanDepth + BRANCH_NAME_GAP;
  const maxBranchNameLen = branchInfos.reduce(
    (m, bi) => Math.max(m, ...bi.b.stations.map((s) => s.name.length)),
    0
  );
  const branchBandDepth = hasBranch
    ? branchLineY - nameTop + maxBranchNameLen * NAME_CH + 16
    : 0;
  const height =
    nameTop + Math.max(maxMainDepth, branchBandDepth, line.continuesFrom ? 90 : 0) + 16;
  const firstX = xAt(0);
  const lastX = xAt(n - 1);
  const branchColor = types[types.length - 1].color; // 各駅停車のみ=普通色

  // その駅が停まる一番上の段(=types で最初に rank が条件を満たすindex)
  const topTierIndex = (s) => types.findIndex((t) => s.rank >= t.rank);

  // 「この先へ続く」: 終点(普通=下段)の丸の外側から、灰色の細い水平線を伸ばし、つづく路線名を添える
  const cont = line.continuesTo;
  // 「ここまで続いてくる」: 始点(下段)の外側から左へ灰色の細線を伸ばし、続いてくる路線名を添える
  const contFrom = line.continuesFrom;
  const BOTTOM_R = 6; // 下段(普通)の駅マークの半径(この外側から線を出す)
  // 斜め線の先端に置く水平テキストが左にはみ出すぶん、描画領域を左へ広げる(駅位置は動かさない)
  const minX = contFrom ? -76 : 0;

  return (
    <svg
      className="rm-svg"
      id={`rm-svg-${line.id}`}
      viewBox={`${minX} 0 ${width - minX} ${height}`}
      width={width - minX}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${line.name} 路線図`}
    >
      {/* 支線: 分岐駅の少し先で本線の下にもぐり、カーブで下へ降りて右へのびる(各駅停車のみ)。
          本線・駅名より先に描いて、分岐部を本線の帯の下に隠す */}
      {branchInfos.map(({ b, fromX, midX, bx, lastBx }) => {
        const R = BRANCH_CORNER_R;
        const d =
          `M ${fromX} ${bottomY}` +
          ` L ${midX - R} ${bottomY}` +
          ` Q ${midX} ${bottomY} ${midX} ${bottomY + R}` +
          ` L ${midX} ${branchLineY - R}` +
          ` Q ${midX} ${branchLineY} ${midX + R} ${branchLineY}` +
          ` L ${lastBx} ${branchLineY}`;
        return (
          <g key={b.id}>
            <path
              d={d}
              fill="none"
              stroke={branchColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 支線名ラベル */}
            <text x={fromX - 10} y={branchLineY + 5} className="rm-tier" fill={branchColor} textAnchor="end">{b.name}</text>
            {b.stations.map((bs, j) => (
              <g key={bs.name}>
                <circle cx={bx(j)} cy={branchLineY} r="6" fill="#fff" stroke={branchColor} strokeWidth="3" />
                <text x={bx(j)} y={branchLineY + 12} className="rm-name" writingMode="vertical-rl" textAnchor="start">
                  {bs.name}
                </text>
              </g>
            ))}
          </g>
        );
      })}

      {/* 各段: ラベル + 横線(その種別が走る線) */}
      {types.map((t, ti) => (
        <g key={t.id}>
          <text x="20" y={tierY(ti) + 5} className="rm-tier" fill={t.color}>{t.label}</text>
          <line
            x1={firstX}
            y1={tierY(ti)}
            x2={lastX}
            y2={tierY(ti)}
            stroke={t.color}
            strokeWidth={ti === bottomIndex ? 10 : 8}
            strokeLinecap="round"
          />
        </g>
      ))}

      {stations.map((s, i) => {
        const x = xAt(i);
        const topI = topTierIndex(s);
        return (
          <g key={`${s.name}-${i}`}>
            {/* 停車する段どうしを縦線でつなぐ(上端の段→一番下の段) */}
            {topI < bottomIndex && (
              <line x1={x} y1={tierY(topI)} x2={x} y2={bottomY} stroke="#c2c6c9" strokeWidth="3" />
            )}
            {/* その駅に停まる種別の段すべてに駅マーク */}
            {types.map((t, ti) =>
              s.rank >= t.rank ? (
                <circle
                  key={t.id}
                  cx={x}
                  cy={tierY(ti)}
                  r={ti === bottomIndex ? 6 : 8}
                  fill="#fff"
                  stroke={t.color}
                  strokeWidth={ti === bottomIndex ? 3 : 3.5}
                />
              ) : null
            )}
            {/* 駅名(縦書き)。最優等種別が停まる駅は太字 */}
            <text
              x={x}
              y={nameTop}
              className={s.rank === maxRank ? "rm-name rm-name-exp" : "rm-name"}
              writingMode="vertical-rl"
              textAnchor="start"
            >
              {s.name}
            </text>
            {/* 乗換路線(駅名の下に小さく)。開始位置は全駅そろえる(一番長い駅名の下) */}
            {s.transfer &&
              s.transfer.map((tr, j) => (
                <text
                  key={j}
                  x={x}
                  y={nameTop + s.name.length * NAME_CH + TR_GAP + j * TR_LH}
                  className="rm-transfer"
                  textAnchor="middle"
                >
                  {tr}
                </text>
              ))}
          </g>
        );
      })}

      {/* この先へ続く(上段の丸の外側から、灰色の細い水平線を伸ばし、つづく路線名を添える) */}
      {cont && (
        <g>
          <line
            x1={lastX + BOTTOM_R + 3}
            y1={bottomY}
            x2={lastX + 84}
            y2={bottomY}
            stroke="#9aa0a4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <text x={lastX + 92} y={bottomY - 3} className="rm-cont">{cont.name}</text>
          <text x={lastX + 92} y={bottomY + 14} className="rm-cont-sub">（{cont.area}）へ続く</text>
        </g>
      )}

      {/* ここまで続いてくる(始点の丸から左下45度へ灰色の斜め線。その先端に路線名を水平で添える) */}
      {contFrom && (
        <g>
          <line
            x1={firstX - BOTTOM_R}
            y1={bottomY + BOTTOM_R}
            x2={firstX - 55}
            y2={bottomY + 55}
            stroke="#9aa0a4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <text x={firstX - 59} y={bottomY + 51} className="rm-cont" textAnchor="end">{contFrom.name}</text>
          <text x={firstX - 59} y={bottomY + 66} className="rm-cont-sub" textAnchor="end">（{contFrom.area}）から続く</text>
        </g>
      )}
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
          <h1>路線図</h1>
          <div className="romaji en">ROUTE MAP</div>
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
                  <h2 className="rm-line-title">{line.name}</h2>
                  <span className="rm-line-en en">{line.nameEn}</span>
                </div>
                {/* 凡例(種別ぶん) */}
                <div className="rm-legend">
                  {line.types.map((t) => (
                    <span className="rm-legend-item" key={t.id}>
                      <span className="rm-chip" style={{ borderColor: t.color }}></span>
                      {t.label.includes("停車") ? t.label : `${t.label}停車駅`}
                    </span>
                  ))}
                  <span className="rm-note">{line.note || rm.note}</span>
                </div>
              </div>
              {/* 路線図(駅数が多いので横スクロール) */}
              <div className="rm-scroll">
                <RouteSvg line={line} />
              </div>
              <p className="rm-hint">← 横にスクロールできます →</p>
              <Downloads line={line} />
            </div>
          ))}
        </section>
      </main>

      <footer>
        谷中日本鉄道株式会社(YNR)は架空の鉄道会社です。実在の鉄道会社・団体とは一切関係ありません。© YANAKA JAPAN RAILWAY (RAIL SIGN NEWS)
      </footer>
    </>
  );
}
