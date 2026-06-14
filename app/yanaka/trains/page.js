import Link from "next/link";
import yanaka from "../../../data/yanaka.json";

export const metadata = {
  title: "車両紹介 | 谷中日本鉄道 | RAIL SIGN NEWS",
  description:
    "架空鉄道「谷中日本鉄道株式会社(YNR)」の車両紹介。実在の鉄道会社とは関係ありません。",
};

export default function YanakaTrainsPage() {
  const trains = yanaka.trains;

  return (
    <>
      <header className="yk-header">
        <div className="station-sign yk-sign">
          <img src={yanaka.page.logo} alt="谷中日本鉄道ロゴマーク" className="yk-logo" />
          <h1>{trains.title}</h1>
          <div className="romaji en">{trains.en}</div>
          <span className="fiction-label">{yanaka.label}</span>
          <div className="next">
            <Link href="/yanaka">◀ 谷中日本鉄道トップへもどる</Link>
            <span>YN LINE</span>
          </div>
        </div>
      </header>

      <main className="yk-main">
        <section>
          <div className="tr-grid">
            {trains.items.map((car) => {
              const multi = car.photos.length > 1;
              return (
                <div className={multi ? "tr-card tr-wide" : "tr-card"} key={car.name}>
                  <div className="tr-band"></div>
                  <div className="tr-head">
                    <h2 className="tr-name">{car.name}</h2>
                  </div>
                  <div className={multi ? "tr-photos tr-photos-multi" : "tr-photos"}>
                    {car.photos.map((p, i) => (
                      <figure className="tr-figure" key={i}>
                        <img className="tr-photo" src={p.image} alt={p.imageAlt} />
                        {(p.caption || p.built) && (
                          <figcaption className="tr-cap">
                            {p.caption && <span className="tr-cap-name">{p.caption}</span>}
                            {p.built && <span className="tr-cap-built">{p.built}</span>}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                  {car.description && <p className="tr-desc">{car.description}</p>}
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
