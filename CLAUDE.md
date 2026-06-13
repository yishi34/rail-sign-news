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
│   ├── icon.png / apple-icon.png … サイトのアイコン(115系)。タブ・ホーム画面用
│   ├── yanaka/icon.png / yanaka/apple-icon.png … /yanaka配下のアイコン(社紋YNR)で上書き
│   ├── page.js        … トップページ。data/ のJSONから一覧を生成
│   ├── yanaka/page.js … 谷中日本鉄道(架空鉄道)のページ。内容は data/yanaka.json の page で管理
│   ├── yanaka/history/page.js … 谷中日本鉄道の社史ページ(独立ページ)。内容は data/yanaka.json の history で管理
│   ├── yanaka/routemap/page.js … 谷中日本鉄道の路線図ページ(SVGで生成)。内容は data/yanaka.json の routemap で管理
│   ├── yanaka/routemap/Downloads.js … 路線図の PNG/PDF/SVG ダウンロードボタン(クライアント部品)
│   └── globals.css    … デザイン(プロトタイプ index.html から移植。yk-〜 は谷中鉄道用)
├── public/yanaka/     … 谷中鉄道の画像(logo.jpg=YNRロゴ, cocks.jpg=コッコーズ優勝エンブレム)
├── public/channels/   … 動画チャンネルのサムネ画像(raha.jpg=Raha鐵のチャンネルアイコン)
├── data/
│   ├── manual-articles.json … 手動掲載記事(人間が編集する唯一の記事ファイル)
│   ├── auto-articles.json   … 自動収集記事(自動処理専用・編集禁止)
│   ├── sources.json         … 自動収集の情報源RSS一覧と上限件数(maxArticles)
│   ├── keywords.json        … 鉄道キーワードフィルタとカテゴリ分類ルール
│   ├── categories.json      … カテゴリ(路線)定義: news/cars/service/travel/tech
│   ├── official-links.json  … 「公式サイトへのりかえ」リンク集(自動処理の対象外)
│   ├── channels.json        … サイドパネルの動画チャンネルリンク(Raha鐵など)
│   └── yanaka.json          … 谷中日本鉄道=架空鉄道セクション(自動処理の対象外)
├── scripts/
│   └── collect-news.mjs     … ニュース収集スクリプト(依存パッケージなし)
├── .github/workflows/
│   └── collect-news.yml     … 定時実行(毎日 6:00 / 18:00 JST)
└── next.config.mjs    … 静的書き出し(output: "export")設定
```

- 架空鉄道の正式名称は「谷中日本鉄道株式会社」(英語表記: YANAKA JAPAN RAILWAY、略称: YNR。
  YJRだと実在のJRと略称が被るためYNRとしている)。コーポレートカラーは
  黄・白・緑で、帯は必ず「黄 → 白 → 緑」の順(白は混色防止の仕切り。CSS変数 --ynr-band)
- 社史は /yanaka のパネルからリンクする独立ページ(/yanaka/history)。
  「西暦 / 谷中日本鉄道のあゆみ / 日本のおもなできごと」の3列を1枚の年表で表示(枠で囲わない)。
  データは data/yanaka.json の history.timeline 配列。1行 = `{year, company?, japan?}` で、
  company は自社のできごと(うっすら緑で強調)、japan は同時代の有名な日本のできごと。
  行を追記するだけで増やせる構成(西暦の小さい順に並べる)
- 路線図は /yanaka のパネルからリンクする独立ページ(/yanaka/routemap)。
  上段=急行(黄)/下段=普通(緑)の2段式をSVGで生成。データは data/yanaka.json の routemap。
  routemap.lines[].stations の各駅 `{name, express}` を並べるだけで描画され、
  express:true の駅が急行停車駅(○・上段にも停車)になる。駅を増減しても自動でレイアウトされる
  各駅に `"transfer": ["路線名", ...]` を足すと駅名の下に乗換路線(青字)が出る。
  路線図は PNG/PDF/SVG でダウンロード可(routemap/Downloads.js。追加パッケージ不使用、
  ブラウザの canvas でSVGを画像化し、PDFはJPEGを埋め込んで自前生成)
- レイアウト: 2カラム(左=ニュース各カテゴリ+谷中日本鉄道、右=サイドパネルに
  動画チャンネルと公式リンク集)。各カテゴリの表示は最新6件まで
  (app/page.js の `MAX_PER_CATEGORY` で変更可)
- 記事の必須項目: `title` / `category` / `date`(YYYY-MM-DD) / `source.name` / `source.url`
- 手動記事に `"breaking": true` を付けると、ページ上部の黒い「速報」サインに表示される
- サイト表示時は manual + auto を統合して日付の新しい順に表示(app/page.js)
- アイコン: Next.jsのファイル規約(app/icon.png, app/apple-icon.png)を使用。
  /yanaka配下は app/yanaka/icon.png・apple-icon.png が親を上書き(社紋になる)。
  元画像は親フォルダの 115系.jpg と 谷中鉄道ロゴマーク.jpg を正方形PNGに変換したもの

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
