import Link from "next/link";
import yanaka from "../../data/yanaka.json";

export const metadata = {
  title: "谷中日本鉄道公式サイト | RAIL SIGN NEWS",
  description:
    "架空鉄道「谷中日本鉄道株式会社(YNR)」の公式ページ。実在の鉄道会社とは関係ありません。",
};

// 日付 "2026-08-23" → 駅サイン風表記 "2026.08.23"
function formatDate(date) {
  return date.replaceAll("-", ".");
}

// 駅ナンバリング風バッジ(谷中鉄道カラー)
function Badge({ code, num }) {
  return (
    <span className="badge yk-badge">
      <span className="code en">{code}</span>
      <span className="num en">{num}</span>
    </span>
  );
}

export default function YanakaPage() {
  const page = yanaka.page;

  return (
    <>
      <header className="yk-header">
        <div className="station-sign yk-sign">
          <img src={page.logo} alt="谷中日本鉄道ロゴマーク" className="yk-logo" />
          <h1>谷中日本鉄道公式サイト</h1>
          <div className="romaji en">{page.companyEn}</div>
          <span className="fiction-label">{yanaka.label}</span>
          <div className="next">
            <Link href="/">◀ 鉄道ニュースまとめへもどる</Link>
            <span>YN LINE</span>
          </div>
        </div>
      </header>

      <main className="yk-main">
        {/* トップニュース: 谷中コッコーズ優勝 */}
        <section>
          <div className="line-head">
            <span className="line-band" style={{ background: yanaka.color }}></span>
            <h2>{page.topNews.label}</h2>
            <span className="en-sub en">TOP NEWS</span>
          </div>
          <div className="yk-news">
            <div className="yk-news-band"></div>
            <div className="yk-news-inner">
              <img src={page.topNews.image} alt={page.topNews.imageAlt} />
              <div className="yk-news-text">
                <span className="yk-flag">{page.topNews.flag}</span>
                <h3>{page.topNews.title}</h3>
                <p>{page.topNews.body}</p>
                {page.topNews.info && (
                  <dl className="yk-info">
                    {page.topNews.info.map((row) => (
                      <div className="yk-info-row" key={row.label}>
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {page.topNews.highlights && (
                  <div className="yk-highlights">
                    <span className="yk-highlights-label">{page.topNews.highlights.label}</span>
                    <ul>
                      {page.topNews.highlights.items.map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {page.topNews.note && (
                  <p className="yk-note">{page.topNews.note}</p>
                )}
                {page.topNews.subImage && (
                  <div className="yk-news-sub">
                    <img src={page.topNews.subImage} alt={page.topNews.subImageAlt} />
                    <p className="yk-news-sub-text">{page.topNews.subCaption}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="yk-news-band"></div>
          </div>
        </section>

        {/* お知らせ(谷中鉄道のニュース一覧) */}
        {page.news && (
          <section>
            <div className="line-head">
              <span className="line-band" style={{ background: yanaka.color }}></span>
              <h2>{page.news.label}</h2>
              <span className="en-sub en">{page.news.en}</span>
            </div>
            <div className="yk-notice-list">
              {page.news.items.map((item, i) => (
                <article className="yk-notice" key={i}>
                  {item.image && (
                    <img className="yk-notice-img" src={item.image} alt={item.imageAlt} />
                  )}
                  <div className="yk-notice-text">
                    <div className="yk-notice-head">
                      {item.flag && <span className="yk-flag">{item.flag}</span>}
                      {item.date && <span className="yk-notice-date en">{formatDate(item.date)}</span>}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    {item.subImage && (
                      <div className="yk-news-sub">
                        <img src={item.subImage} alt={item.subImageAlt} />
                        <p className="yk-news-sub-text">{item.subCaption}</p>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 路線図・社史・時刻表(準備中パネル) */}
        <section>
          <div className="line-head">
            <span className="line-band" style={{ background: yanaka.color }}></span>
            <h2>ごあんない</h2>
            <span className="en-sub en">INFORMATION</span>
          </div>
          <div className="cards">
            {page.panels.map((panel) => {
              const inner = (
                <>
                  <div className="top-band"></div>
                  <div className="body">
                    <Badge code={panel.code} num={panel.num} />
                    <div>
                      <h3>{panel.title}</h3>
                      <span className="en-sub en">{panel.en}</span>
                    </div>
                  </div>
                  <div className="meta">
                    <span className="src">{panel.status}</span>
                    <span className="en">{panel.href ? "VIEW MORE" : "COMING SOON"}</span>
                  </div>
                  <div className="bottom-band"></div>
                </>
              );
              return panel.href ? (
                <Link className="card yk-panel yk-panel-link" href={panel.href} key={panel.title}>
                  {inner}
                </Link>
              ) : (
                <div className="card yk-panel" key={panel.title}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer>
        谷中日本鉄道株式会社(YNR)は架空の鉄道会社です。実在の鉄道会社・団体とは一切関係ありません。© YANAKA JAPAN RAILWAY (RAIL SIGN NEWS)
      </footer>
    </>
  );
}
