import { Fragment } from "react";
import Link from "next/link";
import yanaka from "../../../data/yanaka.json";

export const metadata = {
  title: "社史 | 谷中日本鉄道 | RAIL SIGN NEWS",
  description:
    "架空鉄道「谷中日本鉄道株式会社(YNR)」の社史。実在の鉄道会社とは関係ありません。",
};

// 1つの枠(時代)の中の、西暦+できごとの並び
function Events({ items }) {
  return (
    <>
      {items.map((e, i) => (
        <div className="ev" key={i}>
          <span className="yr en">{e.year}</span>
          <span className="tx">{e.text}</span>
        </div>
      ))}
    </>
  );
}

export default function YanakaHistoryPage() {
  const history = yanaka.history;
  const col = history.columns;

  return (
    <>
      <header className="yk-header">
        <div className="station-sign yk-sign">
          <img src={yanaka.page.logo} alt="谷中日本鉄道ロゴマーク" className="yk-logo" />
          <h1>{history.title}</h1>
          <div className="romaji en">{history.en}</div>
          <span className="fiction-label">{yanaka.label}</span>
          <div className="next">
            <Link href="/yanaka">◀ 谷中日本鉄道トップへもどる</Link>
            <span>YN LINE</span>
          </div>
        </div>
      </header>

      <main className="yk-main">
        <section>
          <p className="yk-history-intro">{history.intro}</p>

          <div className="yk-eras">
            <div className="th th-co">{col.company}</div>
            <div className="th th-jp">{col.japan}</div>
            {history.bands.map((band, i) => (
              <Fragment key={i}>
                <div className="era-label">{band.era}</div>
                <div className="era era-co">
                  <Events items={band.company} />
                </div>
                <div className="era era-jp">
                  <Events items={band.japan} />
                </div>
              </Fragment>
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
