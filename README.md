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
│   ├── manual-articles.json … 手動掲載の記事(人間が編集するのはこちら)
│   ├── auto-articles.json   … 自動収集の記事(自動処理専用・編集しない)
│   ├── sources.json         … 自動収集の情報源RSS一覧
│   ├── keywords.json        … 鉄道フィルタ・分類のキーワードルール
│   ├── categories.json      … カテゴリ(路線)の定義
│   ├── official-links.json  … 「公式サイトへのりかえ」のリンク集
│   └── yanaka.json          … 谷中鉄道(架空鉄道)セクションの内容
└── next.config.mjs    … 静的書き出し(output: "export")の設定
```

## 記事の追加・更新

記事データは2ファイルに分かれています。サイトには両方が日付順に統合表示されます。

- **手動で載せたい記事** → `data/manual-articles.json` に追記(人間が編集するのはここだけ)
- **自動収集の記事** → `data/auto-articles.json`(スクリプト専用。手で編集しない)

1記事=1オブジェクトで、全項目必須です。

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

## ニュース自動収集

RSSフィードから鉄道関連ニュースの「見出し・URL・配信元・日付」だけを収集し、
`data/auto-articles.json` に自動追記します。**記事本文の取得・転載・要約は行いません。**
手動記事 `data/manual-articles.json` には触れません(重複チェックの参照のみ)。

```bash
node scripts/collect-news.mjs   # 手動実行
```

- **実行スケジュール**: GitHub Actions で毎日 6:00 / 18:00(日本時間)に自動実行
  (`.github/workflows/collect-news.yml`)。GitHubの「Actions」タブから手動実行も可能
- **情報源**: `data/sources.json` で管理(追加・削除はこのファイルを編集)。
  各サイトのRSSは公式配信のもので、robots.txt で取得が禁止されていないことを確認済み。
  Yahoo!ニュースはRSS利用規約(個人利用限定)のため不採用
- **フィルタと分類**: `data/keywords.json` のキーワードルールでタイトルを判定。
  鉄道キーワードを含む記事だけを採用し、カテゴリ(車両/運行・ダイヤ/旅行・観光、
  それ以外はニュース)に自動分類。精度を上げたいときはこのファイルを編集
- **重複と上限**: 同じURLの記事は追加しない。新しい順に並べ、200件
  (`data/sources.json` の `maxArticles`)を超えた古い記事は自動で間引く

※キーワード判定のため、「急行」を含むバス記事など鉄道以外の記事がまれに混ざることが
あります。気になる場合は `data/keywords.json` のキーワードを調整してください。

## デザイン

`design-tokens.md`(プロトタイプ付属のデザイン設計書)に基づきます。

- カラー: 路線カラー5色 + サイン白/墨/ホーム灰
- フォント: Noto Sans JP(和文)+ Barlow Semi Condensed(英数字・DIN風)
- 著作権リスクのある画像は使わず、色とタイポグラフィで見せる

## 公開(Vercel)

リポジトリを Vercel にインポートするだけで、自動検出された設定のまま公開できます。
