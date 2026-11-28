import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNationalSchematic } from '../data/national-schematic.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapData = JSON.parse(fs.readFileSync(path.join(root, 'data', 'map-national-kml.json'), 'utf8'));

const diagram = buildNationalSchematic(mapData.lines);
const { routes, stations, sheet, totalStops, labelOverlaps, labelMarkerHits, labelLineHits } = diagram;

assert.equal(routes.length, 41, `Expected 41 routes, got ${routes.length}`);
assert.equal(totalStops, 1685, `Expected 1685 total stops, got ${totalStops}`);

for (let i = 0; i < mapData.lines.length; i++) {
  const kmlLine = mapData.lines[i];
  const r = routes[i];
  assert.equal(r.id, kmlLine.id);
  assert.equal(r.stops.length, kmlLine.stations.length, `${r.id} stop count mismatch`);
  for (let j = 0; j < kmlLine.stations.length; j++) {
    assert.equal(r.stops[j].name, kmlLine.stations[j].name, `${r.id}[${j}] name mismatch`);
  }
}

for (const r of routes) {
  for (const [x, y] of r.path) {
    assert(Number.isFinite(x) && Number.isFinite(y), `Non-finite path coord on ${r.id}`);
    assert(x >= 0 && x <= sheet.width && y >= 420 && y <= 24700, `Out-of-bounds path coord on ${r.id}: ${x},${y}`);
  }
  for (let i = 1; i < r.path.length; i++) {
    const [x1, y1] = r.path[i - 1];
    const [x2, y2] = r.path[i];
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    assert(dx < 1e-6 || dy < 1e-6 || Math.abs(dx - dy) < 1e-6, `Non-octilinear segment on ${r.id} step ${i}: (${x1},${y1})->(${x2},${y2})`);
  }
}

console.log(`Routes: ${routes.length}, Unique nodes: ${stations.length}, Total stops: ${totalStops}`);
console.log(`Overlaps=${labelOverlaps}, MarkerHits=${labelMarkerHits}, LineHits=${labelLineHits}`);

const bad = stations.filter((s) => s.label.collisions || s.label.markerHits || s.label.lineHits);
if (bad.length > 0) {
  console.log(`Stations with issues (${bad.length}):`);
  for (const s of bad.slice(0, 40)) {
    console.log(`  ${s.name} (${s.id}) c=${s.label.collisions} m=${s.label.markerHits} l=${s.label.lineHits} pos=(${Math.round(s.x)},${Math.round(s.y)})`);
  }
}

console.log('\nPer-route min/avg spacing (non-Kanto + trunk):');
for (const r of routes.slice(0, 18)) {
  const dists = [];
  for (let i = 1; i < r.stops.length; i++) {
    dists.push(Math.hypot(r.stops[i].x - r.stops[i - 1].x, r.stops[i].y - r.stops[i - 1].y));
  }
  const minD = Math.min(...dists);
  const avgD = dists.reduce((a, b) => a + b, 0) / dists.length;
  console.log(`  ${r.id.padEnd(16)} (${String(r.stops.length).padStart(3)}駅) | min=${minD.toFixed(1).padStart(5)}px avg=${avgD.toFixed(1).padStart(5)}px`);
}

assert.equal(labelOverlaps, 0, `Expected 0 label overlaps, got ${labelOverlaps}`);
assert.equal(labelMarkerHits, 0, `Expected 0 label marker hits, got ${labelMarkerHits}`);
assert.equal(labelLineHits, 0, `Expected 0 label line hits, got ${labelLineHits}`);

// Key geographic invariants
const routeById = new Map(routes.map((r) => [r.id, r]));
const findStop = (id, i) => routeById.get(id).stops[i];
const kagoshima = findStop('kyushu', 111);
const moji = findStop('kyushu', 0);
const hiroshima = findStop('sanyo', 79);
const okayama = findStop('sanyo', 46);
const matsuyama = findStop('setouchi', 63);
const osaka = findStop('tokai', 277);
const nagoya = findStop('tokai', 214);
const toyama = findStop('toyama', 110);
const nagano = findStop('nagano', 23);
const tokyo = findStop('tokai', 0);
const sendai = findStop('tohoku', 95);
const morioka = findStop('tohoku', 155);

assert(kagoshima.y > moji.y, '鹿児島中央 must be south of 門司港');
assert(moji.x < hiroshima.x && hiroshima.x < okayama.x && okayama.x < osaka.x && osaka.x < nagoya.x && nagoya.x < tokyo.x, 'West-to-East trunk order');
assert(matsuyama.y > okayama.y && matsuyama.x < okayama.x, '松山 must be SW of 岡山');
assert(toyama.x < nagano.x && nagano.y < osaka.y, '富山 must be west of 長野');
assert(morioka.y < sendai.y && sendai.y < tokyo.y && sendai.x > tokyo.x, '仙台・盛岡 must be NE of 東京');

// External transfer checks (major stations only, no false-positive Fujisawa in Iwate)
for (const id of ['谷鉄東京', '谷鉄品川', 'yanaka-line:7', 'sagami-tanzawa:0', '小田原', 'tokai:52']) {
  const st = stations.find((s) => s.id === id);
  assert(st && st.externalTransfers?.length > 0, `Expected external transfers on ${id}`);
}
const iwateFujisawa = stations.find((s) => s.id === 'tohoku:139');
assert.equal(iwateFujisawa?.externalTransfers?.length || 0, 0, 'Iwate Fujisawa must not get Kanagawa Fujisawa transfers');
assert(diagram.externalThroughLines?.some((t) => t.id === 'keio-sagamihara-through'), 'Expected Keio through-line from Hashimoto');
