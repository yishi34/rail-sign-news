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
const TR_GAP = 10; // 駅名と乗換表記のあいだ
const TR_LH = 13; // 乗換表記の行の高さ

const tierY = (i) => TIER_Y0 + i * TIER_STEP;

// 種別(types)は rank の大きい順=上の段。stop条件: 駅の rank >= 種別の rank
function RouteSvg({ line }) {
  const { types, stations } = line;
  const n = stations.length;
  const xAt = (i) => X0 + i * GAP;
  const bottomIndex = types.length - 1;
  const bottomY = tierY(bottomIndex);
  const nameTop = bottomY + 14;
  const maxRank = Math.max(...types.map((t) => t.rank));
  const maxNameLen = Math.max(...stations.map((s) => s.name.length));
  const maxTransfer = Math.max(0, ...stations.map((s) => (s.transfer ? s.transfer.length : 0)));
  const CONT_W = line.continuesTo ? 210 : 0; // 「この先へ続く」表示ぶんの余白
  const width = X0 + (n - 1) * GAP + 48 + CONT_W;
  const height = nameTop + maxNameLen * NAME_CH + (maxTransfer ? TR_GAP + maxTransfer * TR_LH : 0) + 16;
  const firstX = xAt(0);
  const lastX = xAt(n - 1);

  // その駅が停まる一番上の段(=types で最初に rank が条件を満たすindex)
  const topTierIndex = (s) => types.findIndex((t) => s.rank >= t.rank);

  // 「この先へ続く」: 終点(普通=下段)の丸の外側から、灰色の細い水平線を伸ばし、つづく路線名を添える
  const cont = line.continuesTo;
  const BOTTOM_R = 6; // 下段(普通)の駅マークの半径(この外側から線を出す)

  return (
    <svg
      className="rm-svg"
      id={`rm-svg-${line.id}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${line.name} 路線図`}
    >
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
            {/* 乗換路線(駅名の下に小さく) */}
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
                      {t.label}停車駅
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
