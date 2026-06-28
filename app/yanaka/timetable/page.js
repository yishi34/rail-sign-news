import Link from "next/link";
import yanaka from "../../../data/yanaka.json";

export const metadata = {
  title: "時刻表 | 谷中日本鉄道 | RAIL SIGN NEWS",
  description:
    "架空鉄道「谷中日本鉄道株式会社(YNR)」の時刻表(イメージ)。実在の鉄道会社とは関係ありません。",
};

export default function YanakaTimetablePage() {
  const tt = yanaka.timetable;
  const typeOf = (t) => tt.types.find((x) => x.id === t) || {};
  const destMarkOf = (k) => (tt.destMarks || []).find((d) => d.id === k);

  return (
    <>
      <header className="yk-header">
        <div className="station-sign yk-sign">
          <img src={yanaka.page.logo} alt="谷中日本鉄道ロゴマーク" className="yk-logo" />
          <h1>{tt.title}</h1>
          <div className="romaji en">{tt.en}</div>
          <span className="fiction-label">{yanaka.label}</span>
          <div className="next">
            <Link href="/yanaka">◀ 谷中日本鉄道トップへもどる</Link>
            <span>YN LINE</span>
          </div>
        </div>
      </header>

      <main className="yk-main">
        <section>
          {/* 緑のヘッダー帯(運転時刻表) */}
          <div className="tt-banner">
            <div className="tt-banner-title">
              <h2>{tt.lineName} 運転時刻表</h2>
              <div className="en">Timetable of {tt.lineNameEn}</div>
            </div>
            <div className="tt-banner-dir">
              {tt.direction}
              {tt.directionEn && <span className="en">{tt.directionEn}</span>}
            </div>
          </div>

          {/* 駅名・平日 */}
          <div className="tt-subhead">
            <span className="tt-subhead-station">{tt.station}駅 発</span>
            <span className="tt-subhead-kind">
              {tt.kind}
              {tt.kindEn && <span className="en"> {tt.kindEn}</span>}
            </span>
          </div>

          {/* 発車時刻ボード(時×分・しま模様) */}
          <div className="tt-board">
            {tt.rows.map((row) => (
              <div className="tt-row" key={row.h}>
                <div className="tt-hour en">{row.h}</div>
                <div className="tt-mins">
                  {row.d.map((dep, i) => {
                    const ty = typeOf(dep.t);
                    const dm = dep.k ? destMarkOf(dep.k) : null;
                    const mark = dm ? dm.mark : ty.mark;
                    return (
                      <span className="tt-min en" key={i} style={{ color: ty.color }}>
                        {mark && <span className="tt-mark">{mark}</span>}
                        {dep.m}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 凡例 */}
          <div className="tt-legendbox">
            <span className="tt-legendbox-label">凡例 Legend</span>
            <span className="tt-legendbox-items">
              {tt.types.map((t) => (
                <span className="tt-legendbox-item" key={t.id}>
                  <span className="tt-mark" style={{ color: t.color }}>
                    {t.mark || "無印"}
                  </span>
                  ＝{t.label}（{t.dest}ゆき）
                </span>
              ))}
              {(tt.destMarks || []).map((d) => (
                <span className="tt-legendbox-item" key={d.id}>
                  <span className="tt-mark" style={{ color: d.color }}>
                    {d.mark}
                  </span>
                  ＝{d.dest}ゆき
                </span>
              ))}
            </span>
          </div>
          <p className="tt-imgnote">{tt.note}</p>
        </section>
      </main>

      <footer>
        谷中日本鉄道株式会社(YNR)は架空の鉄道会社です。実在の鉄道会社・団体とは一切関係ありません。© YANAKA JAPAN RAILWAY (RAIL SIGN NEWS)
      </footer>
    </>
  );
}
