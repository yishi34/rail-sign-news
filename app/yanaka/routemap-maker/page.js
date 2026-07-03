import Link from "next/link";
import yanaka from "../../../data/yanaka.json";
import RouteMapMaker from "./RouteMapMaker";

export const metadata = {
  title: "路線図メーカー | 谷中日本鉄道 | RAIL SIGN NEWS",
  description:
    "架空鉄道「谷中日本鉄道株式会社(YNR)」の路線図をブラウザ上で作れるサンプルツール。",
};

export default function RouteMapMakerPage() {
  return (
    <>
      <header className="yk-header">
        <div className="station-sign yk-sign">
          <img src={yanaka.page.logo} alt="谷中日本鉄道ロゴマーク" className="yk-logo" />
          <h1>路線図メーカー</h1>
          <div className="romaji en">ROUTE MAP MAKER</div>
          <span className="fiction-label">{yanaka.label}</span>
          <div className="next">
            <Link href="/yanaka">◀ 谷中日本鉄道トップへもどる</Link>
            <span>YN LINE</span>
          </div>
        </div>
      </header>

      <main className="yk-main maker-main">
        <RouteMapMaker />
      </main>

      <footer>
        谷中日本鉄道株式会社(YNR)は架空の鉄道会社です。実在の鉄道会社・団体とは一切関係ありません。© YANAKA JAPAN RAILWAY (RAIL SIGN NEWS)
      </footer>
    </>
  );
}
