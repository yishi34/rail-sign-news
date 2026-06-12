# 鉄道ニュースまとめ | RAIL SIGN NEWS

「駅の案内サインで読むニュース」— カテゴリ=路線、記事=駅。
鉄道ニュースを一次ソース(公式サイト・公式SNS)へのリンク付きでまとめる静的サイトです。

Next.js の静的書き出し(SSG)で動作し、Vercel での公開を想定しています。

## フォルダ構成

```
rail-sign-news/
├── app/
│   ├── layout.js      … ページ全体の枠(タイトル・フォント読み込み)
│   ├── page.js        … トップページ。data/ のJSONから一覧を生成する
│   └── globals.css    … デザイン(design-tokens.md に基づくスタイル)
├── data/
│   ├── articles.json       … 記事データ(ここを編集すると記事が増減する)
│   ├── categories.json     … カテゴリ(路線)の定義
│   ├── official-links.json … 「公式サイトへのりかえ」のリンク集
│   └── yanaka.json         … 谷中鉄道(架空鉄道)セクションの内容
└── next.config.mjs    … 静的書き出し(output: "export")の設定
```

## 記事の追加・更新

`data/articles.json` に1記事=1オブジェクトで追記します。全項目必須です
(将来は自動収集スクリプトがこのファイルを更新する想定)。

```json
{
  "title": "記事タイトル",
  "category": "news",
  "date": "2026-06-13",
  "source": { "name": "公式サイト", "url": "https://example.com/..." }
}
```

- `category` … `news`(ニュース) / `cars`(車両) / `service`(運行・ダイヤ) /
  `travel`(旅行・観光) / `tech`(技術・新線)。定義は `data/categories.json`
- `date` … `YYYY-MM-DD` 形式。表示時に `YYYY.MM.DD` に変換される
- `source` … 一次ソース(公式サイト・公式SNS)の名称とURL。**リンク必須**
- `"breaking": true` を付けた記事は、ページ上部の黒い「方面案内サイン(速報)」に
  表示され、カード一覧には出ません

記事番号(N-01 など)は、カテゴリ内の並び順から自動で振られます。

## 開発・ビルド

```bash
npm install     # 初回のみ: 部品のインストール
npm run dev     # 開発サーバー起動 → http://localhost:3000
npm run build   # 静的書き出し → out/ フォルダに完成品が生成される
```

## デザイン

`design-tokens.md`(プロトタイプ付属のデザイン設計書)に基づきます。

- カラー: 路線カラー5色 + サイン白/墨/ホーム灰
- フォント: Noto Sans JP(和文)+ Barlow Semi Condensed(英数字・DIN風)
- 著作権リスクのある画像は使わず、色とタイポグラフィで見せる

## 公開(Vercel)

リポジトリを Vercel にインポートするだけで、自動検出された設定のまま公開できます。
