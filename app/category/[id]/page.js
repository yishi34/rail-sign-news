import Link from "next/link";
import autoArticles from "../../../data/auto-articles.json";
import manualArticles from "../../../data/manual-articles.json";
import categories from "../../../data/categories.json";

// 日付 "2026-06-13" → 駅サイン風表記 "2026.06.13"
function formatDate(date) {
  return date.replaceAll("-", ".");
}

// 記事番号 1 → "01"
function formatNum(n) {
  return String(n).padStart(2, "0");
}

// 駅ナンバリング風バッジ
function Badge({ code, num }) {
  return (
    <span className="badge small-badge">
      <span className="code en">{code}</span>
      <span className="num en">{num}</span>
    </span>
  );
}

// このカテゴリの記事を新しい順に全件(速報サインの記事は除く)
function articlesFor(id) {
  return [...manualArticles, ...autoArticles]
    .filter((a) => !a.breaking && a.category === id)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// 静的書き出し(output: "export")用に、全カテゴリぶんのページを生成する
export function generateStaticParams() {
  return categories.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const cat = categories.find((c) => c.id === id);
  const label = cat ? cat.label : "ニュース";
  return {
    title: `${label}の過去のニュース | RAIL SIGN NEWS`,
    description: `${label}カテゴリの過去のニュース一覧。各記事は一次ソースへのリンクです。`,
  };
}

export default async function CategoryArchive({ params }) {
  const { id } = await params;
  const cat = categories.find((c) => c.id === id);
  const items = articlesFor(id);

  return (
    <>
      <header>
        <div className="station-sign">
          <h1>{cat ? cat.label : "ニュース"}</h1>
          <div className="romaji en">{cat ? cat.en : ""}</div>
          <div className="next">
            <Link href="/">◀ トップへもどる</Link>
            <span>全{items.length}件</span>
          </div>
        </div>
      </header>

      <main className="archive-main">
        <section className={id}>
          <div className="line-head">
            <span className="line-band"></span>
            <h2>過去のニュース</h2>
            <span className="en-sub en">ARCHIVE</span>
          </div>

          {items.length === 0 ? (
            <p className="archive-empty">まだ記事がありません。</p>
          ) : (
            <div className="cards">
              {items.map((article, i) => (
                <a
                  className="card"
                  href={article.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={`${id}-${i}`}
                >
                  <div className="top-band"></div>
                  <div className="body">
                    <Badge code={cat ? cat.code : "N"} num={formatNum(i + 1)} />
                    <h3>{article.title}</h3>
                  </div>
                  <div className="meta">
                    <span className="src">出典: {article.source.name} ↗</span>
                    <span className="en">{formatDate(article.date)}</span>
                  </div>
                  <div className="bottom-band"></div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        各記事は一次ソース(公式サイト・公式SNS)へのリンクを掲載します。© RAIL SIGN NEWS
      </footer>
    </>
  );
}
