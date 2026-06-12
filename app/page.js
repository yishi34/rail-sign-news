import autoArticles from "../data/auto-articles.json";
import manualArticles from "../data/manual-articles.json";
import categories from "../data/categories.json";
import officialLinks from "../data/official-links.json";
import channels from "../data/channels.json";
import yanaka from "../data/yanaka.json";

// 各カテゴリに表示する記事の最大数(データ自体は data/ に最大200件保持)
const MAX_PER_CATEGORY = 6;

// 日付 "2026-06-13" → 駅サイン風表記 "2026.06.13"
function formatDate(date) {
  return date.replaceAll("-", ".");
}

// 記事番号 1 → "01"
function formatNum(n) {
  return String(n).padStart(2, "0");
}

// 駅ナンバリング風バッジ (例: N-01)
function Badge({ code, num, small }) {
  return (
    <span className={small ? "badge small-badge" : "badge"}>
      <span className="code en">{code}</span>
      <span className="num en">{num}</span>
    </span>
  );
}

// カテゴリ1つぶんのセクション(路線帯+記事カード一覧)
function CategorySection({ category, items }) {
  if (items.length === 0) return null;
  return (
    <section className={category.id}>
      <div className="line-head">
        <span className="line-band"></span>
        <h2>{category.label}</h2>
        <span className="en-sub en">{category.en}</span>
      </div>
      <div className="cards">
        {items.map((article, i) => (
          <a
            className="card"
            href={article.source.url}
            target="_blank"
            rel="noopener noreferrer"
            key={`${category.id}-${i}`}
          >
            <div className="top-band"></div>
            <div className="body">
              <Badge code={category.code} num={formatNum(i + 1)} small />
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
    </section>
  );
}

export default function Home() {
  // 手動記事(manual-articles.json)と自動収集記事(auto-articles.json)を
  // 統合し、新しい順に並べる(同じ日付なら速報を先頭に)
  const articles = [...manualArticles, ...autoArticles].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.breaking ? 1 : 0) - (a.breaking ? 1 : 0)
  );

  // 速報: "breaking": true の記事を方面案内サインに表示(カード一覧には載せない)
  const breaking = articles.find((a) => a.breaking);
  const normal = articles.filter((a) => !a.breaking);
  const byCategory = (id) =>
    normal.filter((a) => a.category === id).slice(0, MAX_PER_CATEGORY);
  const cat = (id) => categories.find((c) => c.id === id);

  return (
    <>
      <header>
        <div className="station-sign">
          <h1>鉄道ニュースまとめ</h1>
          <div className="romaji en">RAIL SIGN NEWS — Tetsudō News Matome</div>
          <div className="next">
            <span>◀ きのう Yesterday</span>
            <span>あした Tomorrow ▶</span>
          </div>
        </div>
      </header>

      {breaking && (
        <a
          className="direction-sign"
          href={breaking.source.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="direction-inner">
            <Badge code="BR" num="01" />
            <span className="label">速報</span>
            <span className="headline">
              {breaking.title}(一次ソース: {breaking.source.name})
            </span>
            <span className="arrow">➜</span>
          </div>
        </a>
      )}

      <main>
        {/* 左カラム: ニュース各カテゴリと谷中鉄道 */}
        <div className="primary">
          {["news", "cars", "service"].map((id) => (
            <CategorySection key={id} category={cat(id)} items={byCategory(id)} />
          ))}

          {/* 谷中鉄道(架空鉄道) */}
          <section>
            <div className="line-head">
              <span className="line-band" style={{ background: yanaka.color }}></span>
              <h2>{yanaka.headingJa}</h2>
              <span className="en-sub en">{yanaka.headingEn}</span>
            </div>
            {/* サイト内の谷中鉄道ページ(/yanaka)へ */}
            <a className="yanaka" href={yanaka.url}>
              <div className="band"></div>
              <div className="inner">
                <Badge code={yanaka.code} num={yanaka.num} />
                <div>
                  <span className="fiction-label">{yanaka.label}</span>
                  <h3>{yanaka.title}</h3>
                  <p>{yanaka.description}</p>
                </div>
              </div>
              <div className="band"></div>
            </a>
          </section>

          {["travel", "tech"].map((id) => (
            <CategorySection key={id} category={cat(id)} items={byCategory(id)} />
          ))}
        </div>

        {/* 右カラム: サイドパネル */}
        <aside className="sidebar">
          {/* 動画チャンネル */}
          <section>
            <div className="line-head">
              <span className="line-band" style={{ background: "#ff0033" }}></span>
              <h2>動画チャンネル</h2>
              <span className="en-sub en">VIDEO</span>
            </div>
            <div className="transfer">
              {channels.map((ch) => (
                <a href={ch.url} target="_blank" rel="noopener noreferrer" key={ch.name}>
                  <span className="chip" style={{ background: ch.color }}></span>
                  <span>
                    {ch.name}
                    <small className="en">{ch.sub}</small>
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* 公式サイトへのりかえ */}
          <section>
            <div className="line-head">
              <span className="line-band" style={{ background: "var(--sign-ink)" }}></span>
              <h2>公式サイトへのりかえ</h2>
              <span className="en-sub en">TRANSFER</span>
            </div>
            <div className="transfer">
              {officialLinks.map((link) => (
                <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.name}>
                  <span className="chip" style={{ background: link.color }}></span>
                  <span>
                    {link.name}
                    <small className="en">Official Site ↗</small>
                  </span>
                </a>
              ))}
            </div>
          </section>
        </aside>
      </main>

      <footer>
        各記事は一次ソース(公式サイト・公式SNS)へのリンクを掲載します。© RAIL SIGN NEWS
      </footer>
    </>
  );
}
