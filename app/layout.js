import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://rail-sign-news.vercel.app"),
  title: {
    default: "鉄道ニュースまとめ | RAIL SIGN NEWS（谷中日本鉄道）",
    template: "%s | RAIL SIGN NEWS",
  },
  description:
    "「駅の案内サインで読むニュース」— 鉄道ニュースを一次ソース付きでまとめるサイト。架空鉄道「谷中日本鉄道（YNR）」の全国路線図・首都圏路線図・時刻表・車両紹介も公開中。",
  keywords: [
    "鉄道ニュース",
    "RAIL SIGN NEWS",
    "谷中日本鉄道",
    "谷鉄",
    "全国路線図",
    "首都圏路線図",
    "架空鉄道",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://rail-sign-news.vercel.app",
    siteName: "RAIL SIGN NEWS / 谷中日本鉄道",
    title: "鉄道ニュースまとめ | RAIL SIGN NEWS（谷中日本鉄道）",
    description:
      "鉄道ニュースを駅の案内サイン風にまとめるサイト。谷中日本鉄道の全国路線図・首都圏路線図・車両紹介も掲載。",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    rating: "general",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Barlow+Semi+Condensed:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
