// ニュース自動収集スクリプト
//
// data/sources.json に登録されたRSSフィードから「見出し・URL・配信元・日付」
// だけを取得し、data/auto-articles.json に追記する。本文の取得・転載・要約は行わない。
// 手動記事 data/manual-articles.json には一切書き込まない(重複チェックの参照のみ)。
//
// 使い方: node scripts/collect-news.mjs
// 依存パッケージなし(Node.js 標準機能のみ)

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));

const config = readJson("data/sources.json");
const keywords = readJson("data/keywords.json");
const autoArticlesPath = path.join(root, "data", "auto-articles.json");
const existingArticles = readJson("data/auto-articles.json");
const manualArticles = readJson("data/manual-articles.json");

const USER_AGENT =
  "RailSignNewsBot/1.0 (+https://github.com/yishi34/rail-sign-news; RSS headline collector)";

// ---- XMLテキスト処理(見出し・URL・日付の抽出だけなので簡易パーサで足りる) ----

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripCdata(s) {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1] : s;
}

function textOf(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(stripCdata(m[1]).trim()).trim() : "";
}

function linkOf(block) {
  // RSS 1.0 / 2.0: <link>URL</link>
  const t = textOf(block, "link");
  if (t && /^https?:/.test(t)) return t;
  // Atom: <link rel="alternate" href="URL"/>
  const m =
    block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i) ||
    block.match(/<link[^>]*href="([^"]+)"/i);
  return m ? decodeEntities(m[1]) : "";
}

// 日付文字列 → 日本時間の "YYYY-MM-DD"
function toJstDate(s) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// RSS 1.0(RDF) / RSS 2.0 / Atom のどれでも記事一覧を取り出す
function parseFeed(xml) {
  const blocks =
    xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ||
    xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ||
    [];
  return blocks.map((block) => ({
    title: textOf(block, "title"),
    link: linkOf(block),
    date: toJstDate(
      textOf(block, "pubDate") ||
        textOf(block, "dc:date") ||
        textOf(block, "published") ||
        textOf(block, "updated")
    ),
  }));
}

// ---- フィルタとカテゴリ分類(ルールは data/keywords.json で管理) ----

function isRailTitle(title) {
  // 「道の駅」など紛らわしい語句を除いたうえで鉄道キーワードと照合する
  let t = title;
  for (const ex of keywords.excludeKeywords) t = t.replaceAll(ex, "");
  return keywords.railKeywords.some((k) => t.includes(k));
}

function classify(title) {
  for (const [category, words] of Object.entries(keywords.categories)) {
    if (words.some((w) => title.includes(w))) return category;
  }
  return "news";
}

// ---- 収集本体 ----

async function fetchFeed(url) {
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// 重複チェックは自動記事と手動記事の両方のURLが対象
const knownUrls = new Set(
  [...existingArticles, ...manualArticles].map((a) => a.source.url)
);
const collected = [];

for (const src of config.sources) {
  try {
    const items = parseFeed(await fetchFeed(src.feedUrl));
    let added = 0;
    for (const item of items) {
      // 必須項目(タイトル・URL・日付)が欠けた記事は採用しない
      if (!item.title || !item.link || !item.date) continue;
      // 重複(同じURL)は追加しない
      if (knownUrls.has(item.link)) continue;
      // 鉄道関連キーワードのフィルタ
      if (src.filterRequired && !isRailTitle(item.title)) continue;
      collected.push({
        title: item.title,
        category: classify(item.title),
        date: item.date,
        source: { name: src.name, url: item.link },
      });
      knownUrls.add(item.link);
      added++;
    }
    console.log(`✓ ${src.name}: フィード${items.length}件中 ${added}件を追加`);
  } catch (e) {
    // 1つのソースが落ちていても他のソースの収集は続ける
    console.error(`✗ ${src.name}: 取得失敗 (${e.message})`);
  }
}

// 新しい順に並べ、上限件数を超えた古い記事は間引く
const merged = [...existingArticles, ...collected].sort((a, b) =>
  b.date.localeCompare(a.date)
);
const pruned = merged.slice(0, config.maxArticles ?? 200);

writeFileSync(autoArticlesPath, JSON.stringify(pruned, null, 2) + "\n");
console.log(
  `今回追加 ${collected.length}件 / 合計 ${pruned.length}件 (上限 ${config.maxArticles ?? 200}件)`
);
