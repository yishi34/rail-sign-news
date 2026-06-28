import Link from "next/link";
import yanaka from "../../../data/yanaka.json";

export const metadata = {
  title: "時刻表 | 谷中日本鉄道 | RAIL SIGN NEWS",
  description:
    "架空鉄道「谷中日本鉄道株式会社(YNR)」の時刻表(イメージ)。実在の鉄道会社とは関係ありません。",
};

function TimetableCard({ timetable, index }) {
  const typeOf = (t) => timetable.types.find((x) => x.id === t) || {};
  const destMarkOf = (k) => (timetable.destMarks || []).find((d) => d.id === k);
  const cardCode = timetable.code || `TT${String(index + 1).padStart(2, "0")}`;

  return (
    <details className="tt-card">
      <summary className="tt-card-summary">
        <span className="tt-card-code en">{cardCode}</span>
        <span className="tt-card-main">
          <span className="tt-card-line">{timetable.lineName}</span>
          <span className="tt-card-line-en en">{timetable.lineNameEn}</span>
        </span>
        <span className="tt-card-meta">
          <span>{timetable.station}駅 発</span>
          <span>{timetable.direction}</span>
        </span>
        <span className="tt-toggle" aria-hidden="true"></span>
      </summary>

      <div className="tt-card-panel">
        <div className="tt-banner">
          <div className="tt-banner-title">
            <h2>{timetable.lineName} 運転時刻表</h2>
            <div className="en">Timetable of {timetable.lineNameEn}</div>
          </div>
          <div className="tt-banner-dir">
            {timetable.direction}
            {timetable.directionEn && <span className="en">{timetable.directionEn}</span>}
          </div>
        </div>

        <div className="tt-subhead">
          <span className="tt-subhead-station">{timetable.station}駅 発</span>
          <span className="tt-subhead-kind">
            {timetable.kind}
            {timetable.kindEn && <span className="en"> {timetable.kindEn}</span>}
          </span>
        </div>

        <div className="tt-board">
          {timetable.rows.map((row) => (
            <div className="tt-row" key={row.h}>
              <div className="tt-hour en">{row.h}</div>
              <div className="tt-mins">
                {row.d.map((dep, i) => {
                  const ty = typeOf(dep.t);
                  const dm = dep.k ? destMarkOf(dep.k) : null;
                  const mark = dm ? dm.mark : ty.mark;
                  const color = dm?.color || ty.color;
                  return (
                    <span className="tt-min en" key={i} style={{ color }}>
                      {mark && <span className="tt-mark">{mark}</span>}
                      {dep.m}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="tt-legendbox">
          <span className="tt-legendbox-label">凡例 Legend</span>
          <span className="tt-legendbox-items">
            {timetable.types.map((t) => (
              <span className="tt-legendbox-item" key={t.id}>
                <span className="tt-mark" style={{ color: t.color }}>
                  {t.mark || "無印"}
                </span>
                ＝{t.label}（{t.dest}ゆき）
              </span>
            ))}
            {(timetable.destMarks || []).map((d) => (
              <span className="tt-legendbox-item" key={d.id}>
                <span className="tt-mark" style={{ color: d.color }}>
                  {d.mark}
                </span>
                ＝{d.dest}ゆき
              </span>
            ))}
          </span>
        </div>
        <p className="tt-imgnote">{timetable.note}</p>
      </div>
    </details>
  );
}

export default function YanakaTimetablePage() {
  const timetableGroup = yanaka.timetable;
  const timetables = timetableGroup.items || [timetableGroup];

  return (
    <>
      <header className="yk-header">
        <div className="station-sign yk-sign">
          <img src={yanaka.page.logo} alt="谷中日本鉄道ロゴマーク" className="yk-logo" />
          <h1>{timetableGroup.title}</h1>
          <div className="romaji en">{timetableGroup.en}</div>
          <span className="fiction-label">{yanaka.label}</span>
          <div className="next">
            <Link href="/yanaka">◀ 谷中日本鉄道トップへもどる</Link>
            <span>YN LINE</span>
          </div>
        </div>
      </header>

      <main className="yk-main">
        <section className="tt-list-section">
          <div className="line-head">
            <span className="line-band" style={{ background: yanaka.color }}></span>
            <h2>路線別時刻表</h2>
            <span className="en-sub en">LINE TIMETABLES</span>
          </div>
          <div className="tt-list">
            {timetables.map((timetable, index) => (
              <TimetableCard timetable={timetable} index={index} key={timetable.id || timetable.lineName} />
            ))}
          </div>
        </section>
      </main>

      <footer>
        谷中日本鉄道株式会社(YNR)は架空の鉄道会社です。実在の鉄道会社・団体とは一切関係ありません。© YANAKA JAPAN RAILWAY (RAIL SIGN NEWS)
      </footer>
    </>
  );
}
