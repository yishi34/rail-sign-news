import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSchematic } from '../data/metro-schematic.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapData = JSON.parse(fs.readFileSync(path.join(root, 'data', 'map-3d-kml.json'), 'utf8'));

const diagram = buildSchematic(mapData.lines);
const { routes, stations, sheet, totalStops, labelOverlaps, labelMarkerHits, labelLineHits } = diagram;

assert.equal(routes.length, 25, `Expected 25 routes, got ${routes.length}`);
assert.equal(stations.length, 612, `Expected 612 unique nodes, got ${stations.length}`);
assert.equal(totalStops, 650, `Expected 650 total stops, got ${totalStops}`);

// 1. Verify exact station count & names per line
for (let i = 0; i < mapData.lines.length; i++) {
  const kmlLine = mapData.lines[i];
  const r = routes[i];
  assert.equal(r.id, kmlLine.id);
  assert.equal(r.stops.length, kmlLine.stations.length, `${r.id} stop count mismatch`);
  for (let j = 0; j < kmlLine.stations.length; j++) {
    assert.equal(r.stops[j].name, kmlLine.stations[j].name, `${r.id}[${j}] name mismatch`);
  }
}

// 2. Verify finite coordinates inside sheet bounds & strict octilinearity
for (const r of routes) {
  for (const [x, y] of r.path) {
    assert(Number.isFinite(x) && Number.isFinite(y), `Non-finite path coord on ${r.id}`);
    assert(x >= 0 && x <= sheet.width && y >= 330 && y <= 9880, `Out-of-bounds path coord on ${r.id}: ${x},${y}`);
  }
  for (let i = 1; i < r.path.length; i++) {
    const [x1, y1] = r.path[i - 1];
    const [x2, y2] = r.path[i];
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const isOct = dx < 1e-6 || dy < 1e-6 || Math.abs(dx - dy) < 1e-6;
    assert(isOct, `Non-octilinear segment on ${r.id} step ${i}: (${x1},${y1})->(${x2},${y2})`);
  }
}

assert.equal(labelOverlaps, 0, `Expected 0 label overlaps, got ${labelOverlaps}`);
assert.equal(labelMarkerHits, 0, `Expected 0 label marker hits, got ${labelMarkerHits}`);
assert.equal(labelLineHits, 0, `Expected 0 label line hits, got ${labelLineHits}`);
for (const s of stations) {
  assert(Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.label.x) && Number.isFinite(s.label.y));
  assert(s.label.distance <= 62, `Leader-line distance exceeded limit on ${s.name}: ${s.label.distance}`);
  const b = s.label.box;
  assert(b.x >= 35 && b.y >= 360 && b.x + b.w <= sheet.width - 35 && b.y + b.h <= 9850, `Label out of bounds: ${s.name}`);
}

// 3. Verify 11 false-positive same-name pairs are NOT merged
const falsePositives = [
  ['asano', 10, 'hinotama', 1, '上野'],
  ['okumusashi', 56, 'hachioji', 6, '宮沢'],
  ['okumusashi', 39, 'hachioji', 8, '富士見町'],
  ['tokai', 77, 'matsusato', 19, '寿'],
  ['okumusashi', 90, 'tako-branch', 4, '山田'],
  ['musashi-loop', 28, 'hinotama', 6, '川口'],
  ['musashi-loop', 12, 'takasaki', 11, '幸'],
  ['okumusashi', 62, 'asano', 13, '末広町'],
  ['tohoku', 13, 'takasaki', 7, '本町'],
  ['tohoku', 22, 'matsusato', 32, '青柳'],
  ['tako-branch', 1, 'moriya', 3, '高野'],
];

const routeById = new Map(routes.map((r) => [r.id, r]));
for (const [l1, i1, l2, i2, name] of falsePositives) {
  const s1 = routeById.get(l1).stops[i1];
  const s2 = routeById.get(l2).stops[i2];
  assert.equal(s1.name, name);
  assert.equal(s2.name, name);
  assert.notEqual(s1.id, s2.id, `False positive same-name station merged: ${name} (${l1}:${i1} vs ${l2}:${i2})`);
}

// 4. Verify geographic relative positions of key hubs and terminals
const findStop = (lineId, idx) => routeById.get(lineId).stops[idx];
const tokyo = findStop('tokai', 0);
const shinagawa = findStop('tokai', 7);
const shibuya = findStop('yanaka-line', 5);
const ueno = findStop('tohoku', 0);
const omiya = findStop('tohoku', 15);
const utsunomiya = findStop('tohoku', 36);
const takasaki = findStop('takasaki', 31);
const kumagaya = findStop('okumusashi', 73);
const chichibu = findStop('okumusashi', 94);
const yokohama = findStop('okumusashi', 0);
const ofuna = findStop('tokai', 49);
const odawara = findStop('tokai', 80);
const fuchu = findStop('yamanote-west', 24);
const hachioji = findStop('hachioji', 0);
const jinguji = findStop('hinotama', 15);
const abiko = findStop('matsusato', 20);
const itako = findStop('matsusato', 55);
const mito = findStop('matsusato', 78);
const shirosato = findStop('matsusato', 87);
const tatesawa = findStop('tako-branch', 0);
const tako = findStop('tako-branch', 11);

assert(utsunomiya.y < omiya.y, '宇都宮 must be north of 大宮');
assert(takasaki.y < omiya.y && takasaki.x < omiya.x, '高崎 must be NW of 大宮');
assert(chichibu.y > kumagaya.y && chichibu.x < kumagaya.x, '秩父 must be SW of 熊谷');
assert(shirosato.y < mito.y && shirosato.x < mito.x, '城里中央 must be NW of 水戸');
assert(mito.y < itako.y, '水戸 must be north of 潮来');
assert(itako.x > abiko.x, '潮来 must be east of 我孫子');
assert(tako.x > tatesawa.x, '多古町 must be east of 立沢');
assert(odawara.x < ofuna.x && odawara.y >= ofuna.y, '小田原 must be W/SW of 大船');
assert(ofuna.x < yokohama.x && ofuna.y > yokohama.y, '大船 must be SW of 横浜');
assert(shinagawa.y > tokyo.y && shinagawa.x <= tokyo.x, '品川 must be south of 東京');
assert(shibuya.x < tokyo.x, '渋谷 must be west of 東京');
assert(hachioji.x < fuchu.x, '八王子 must be west of 府中');
assert(jinguji.x < hachioji.x && jinguji.y < hachioji.y, '神宮寺 must be NW of 八王子');
assert(ueno.y < tokyo.y, '上野 must be north of 東京');

// 4b. Verify 谷鉄国分寺 vs 新国分寺 separation and 奥武蔵線/武蔵支線 colors
assert.equal(findStop('okumusashi', 31).id, '谷鉄国分寺');
assert.equal(findStop('tama', 16).id, '谷鉄国分寺');
const shinkokubunjiStop = findStop('musashi-loop', 13);
assert.notEqual(shinkokubunjiStop.id, '谷鉄国分寺');
const kokubunjiNode = stations.find((s) => s.id === '谷鉄国分寺');
const shinkokubunjiNode = stations.find((s) => s.id === shinkokubunjiStop.id);
assert(kokubunjiNode, 'Missing 谷鉄国分寺 node');
assert.equal(kokubunjiNode.name, '谷鉄国分寺');
assert.deepEqual([...kokubunjiNode.routes].sort(), ['okumusashi', 'tama']);
assert(shinkokubunjiNode, 'Missing 新国分寺 node');
assert.equal(shinkokubunjiNode.name, '新国分寺');
assert.deepEqual(shinkokubunjiNode.routes, ['musashi-loop']);
assert(
  shinkokubunjiNode.x > kokubunjiNode.x && shinkokubunjiNode.y < kokubunjiNode.y,
  '新国分寺 must be NE of 谷鉄国分寺'
);
assert.equal(routeById.get('okumusashi').color, '#f8b500');
assert.equal(routeById.get('musashi-branch').color, '#d99100');

// 4c. Verify 谷鉄東京 vs 東京北口 (asano) and 神田 (tono) vs 新神田 (asano) separation
const tokyoNode = stations.find((s) => s.id === '谷鉄東京');
assert(tokyoNode, 'Missing 谷鉄東京 node');
assert.deepEqual([...tokyoNode.routes].sort(), ['musashi-loop', 'tokai', 'tono', 'yoto']);
const asanoTokyoStop = findStop('asano', 23);
assert.notEqual(asanoTokyoStop.id, '谷鉄東京');
const tokyoKitaguchiNode = stations.find((s) => s.id === asanoTokyoStop.id);
assert(tokyoKitaguchiNode, 'Missing 東京北口 node');
assert.equal(tokyoKitaguchiNode.name, '東京北口');
assert.deepEqual(tokyoKitaguchiNode.routes, ['asano']);
assert(tokyoKitaguchiNode.y < tokyoNode.y, '東京北口 must be north of 谷鉄東京');

const tonoKandaStop = findStop('tono', 1);
const asanoKandaStop = findStop('asano', 18);
assert.notEqual(tonoKandaStop.id, asanoKandaStop.id);
const tonoKandaNode = stations.find((s) => s.id === tonoKandaStop.id);
const asanoKandaNode = stations.find((s) => s.id === asanoKandaStop.id);
assert(tonoKandaNode && tonoKandaNode.name === '神田');
assert.deepEqual(tonoKandaNode.routes, ['tono']);
assert(asanoKandaNode && asanoKandaNode.name === '新神田');
assert.deepEqual(asanoKandaNode.routes, ['asano']);

// 4d. Verify matsusato つくし野 vs 新つくし野 and 布施 vs 新布施 distinction
const tsukushinoNode = stations.find((s) => s.id === 'matsusato:22');
const shinTsukushinoNode = stations.find((s) => s.id === 'matsusato:23');
assert.equal(tsukushinoNode?.name, 'つくし野');
assert.equal(shinTsukushinoNode?.name, '新つくし野');
const fuseNode = stations.find((s) => s.id === 'matsusato:25');
const shinFuseNode = stations.find((s) => s.id === 'matsusato:26');
assert.equal(fuseNode?.name, '布施');
assert.equal(shinFuseNode?.name, '新布施');

// 5. Report spacing and overlaps per route
console.log(`Routes: ${routes.length}, Unique nodes: ${stations.length}, Total stops: ${totalStops}`);
console.log(`Computed labelOverlaps: ${labelOverlaps}`);

const overlapPairs = [];
for (let i = 0; i < stations.length; i++) {
  if (stations[i].label.collisions > 0) {
    overlapPairs.push(`${stations[i].name}(${stations[i].id}, dist=${stations[i].label.distance}, cols=${stations[i].label.collisions})`);
  }
}
if (overlapPairs.length > 0) {
  console.log('Stations with label overlaps:', overlapPairs.join(', '));
}

console.log('\nPer-route spacing summary (min / avg px):');
for (const r of routes) {
  const dists = [];
  for (let i = 1; i < r.stops.length; i++) {
    dists.push(Math.hypot(r.stops[i].x - r.stops[i - 1].x, r.stops[i].y - r.stops[i - 1].y));
  }
  const minD = Math.min(...dists);
  const avgD = dists.reduce((a, b) => a + b, 0) / dists.length;
  const maxD = Math.max(...dists);
  console.log(
    `  ${r.id.padEnd(16)} (${String(r.stops.length).padStart(2)}駅) | min=${minD.toFixed(1).padStart(5)}px avg=${avgD.toFixed(1).padStart(5)}px max=${maxD.toFixed(1).padStart(5)}px`
  );
}

const farLabels = stations.filter((s) => s.label.distance > 90).map((s) => `${s.name}(${s.label.distance})`);
console.log(`\nLabels with distance > 90px (${farLabels.length}):`, farLabels.slice(0, 30).join(', '));
