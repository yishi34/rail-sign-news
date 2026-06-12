# RAIL SIGN NEWS — 引き継ぎ書

鉄道ニュースまとめサイト。コンセプトは「駅の案内サインで読むニュース」
(カテゴリ=路線、記事=駅)。オーナーはプログラミング未経験なので、
作業時は各ステップで何をしているか日本語で一言ずつ説明すること。

## 絶対に守る運用ルール

1. **作業開始前に必ず `git pull` でGitHubから最新を取得する。**
   GitHub Actions が毎日2回 `data/auto-articles.json` に自動コミットしている。
   pull せずに作業すると競合する。
2. **手動記事の追加・編集は `data/manual-articles.json` のみ。**
   `data/auto-articles.json` は自動収集専用で、人間とAIは直接編集しない
   (壊れたときの修復を除く)。
3. **記事は見出し・URL・配信元名・日付のみ扱う。**
   記事本文の取得・転載・AI要約は一切行わない。リンクは元記事に直接飛ばす。
4. **GitHubへのプッシュなど外部に影響する操作は、実行前に必ずオーナーの承認を得る。**
5. **新しい情報源を追加するときは、公式RSSであること・robots.txtと利用規約に
   反しないことを確認する。** Yahoo!ニュースのRSSは「個人利用のみ・サイトでの
   利用禁止」と規約に明記されているため使用不可(調査済み)。

## プロジェクト構成

```
rail-sign-news/
├── CLAUDE.md          … この引き継ぎ書
├── app/
│   ├── layout.js      … ページの枠組み(タイトル、Googleフォント読み込み)
│   ├── page.js        … トップページ。data/ のJSONから一覧を生成
│   └── globals.css    … デザイン(プロトタイプ index.html から移植)
├── data/
│   ├── manual-articles.json … 手動掲載記事(人間が編集する唯一の記事ファイル)
│   ├── auto-articles.json   … 自動収集記事(自動処理専用・編集禁止)
│   ├── sources.json         … 自動収集の情報源RSS一覧と上限件数(maxArticles)
│   ├── keywords.json        … 鉄道キーワードフィルタとカテゴリ分類ルール
│   ├── categories.json      … カテゴリ(路線)定義: news/cars/service/travel/tech
│   ├── official-links.json  … 「公式サイトへのりかえ」リンク集(自動処理の対象外)
│   ├── channels.json        … サイドパネルの動画チャンネルリンク(Raha鐵など)
│   └── yanaka.json          … 谷中鉄道=架空鉄道セクション(自動処理の対象外)
├── scripts/
│   └── collect-news.mjs     … ニュース収集スクリプト(依存パッケージなし)
├── .github/workflows/
│   └── collect-news.yml     … 定時実行(毎日 6:00 / 18:00 JST)
└── next.config.mjs    … 静的書き出し(output: "export")設定
```

- レイアウト: 2カラム(左=ニュース各カテゴリ+谷中鉄道、右=サイドパネルに
  動画チャンネルと公式リンク集)。各カテゴリの表示は最新6件まで
  (app/page.js の `MAX_PER_CATEGORY` で変更可)
- 記事の必須項目: `title` / `category` / `date`(YYYY-MM-DD) / `source.name` / `source.url`
- 手動記事に `"breaking": true` を付けると、ページ上部の黒い「速報」サインに表示される
- サイト表示時は manual + auto を統合して日付の新しい順に表示(app/page.js)

## 自動収集の仕組み

1. GitHub Actions(collect-news.yml)が毎日 6:00 / 18:00 JST に起動
   (cron はUTC指定: `0 21 * * *` と `0 9 * * *`)
2. `scripts/collect-news.mjs` が sources.json の各RSSを取得
3. タイトルを keywords.json の鉄道キーワードで絞り込み、カテゴリを自動分類
4. 同じURLの記事(auto/manual両方と照合)は追加しない
5. 新しい順に並べて200件(sources.json の maxArticles)を超えた古い記事は削除
6. 変更があれば auto-articles.json だけを自動コミット・プッシュ

ローカルでの手動実行: `node scripts/collect-news.mjs`
GitHub上での手動実行: リポジトリの Actions タブ →「ニュース自動収集」→ Run workflow

## 壊れたときの確認ポイント

- **記事が増えない** → GitHubの Actions タブで最新の実行ログを確認。
  「✗ (ソース名): 取得失敗」が出ていれば、そのRSSのURL変更・配信停止を疑い、
  sources.json を見直す。1ソースの失敗では全体は止まらない設計
- **関係ない記事が混ざる / 拾ってほしい記事が落ちる** → keywords.json の
  railKeywords / excludeKeywords / categories を調整(例:「京浜急行バス」が
  「急行」に一致する誤検出が既知)
- **auto-articles.json が壊れた(JSONエラー)** → `npm run build` が失敗する。
  GitHubの履歴から正常な版に戻すのが安全:
  `git checkout <正常だったコミット> -- data/auto-articles.json`
- **ビルドが失敗する** → `npm run build` のエラーを読む。親フォルダ名が日本語の
  ため `next.config.mjs` の `turbopack.root` 設定が必須(削除しないこと)

## 開発コマンド

```bash
npm install      # 初回のみ
npm run dev      # 開発サーバー → http://localhost:3000
npm run build    # 静的書き出し(out/ に生成)
```

## 公開まわり

- リポジトリ: https://github.com/yishi34/rail-sign-news (公開)
- ホスティング: Vercel を想定(main へのプッシュで自動デプロイ)
- デザインの原典: 親フォルダの `index.html`(プロトタイプ)と `design-tokens.md`
