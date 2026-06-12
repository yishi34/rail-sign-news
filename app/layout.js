import "./globals.css";

export const metadata = {
  title: "鉄道ニュースまとめ | RAIL SIGN NEWS",
  description:
    "「駅の案内サインで読むニュース」— 鉄道ニュースを一次ソース(公式サイト・公式SNS)へのリンク付きでまとめるサイト。",
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
