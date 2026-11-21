import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildSchematic } from '../data/metro-schematic.js';

const data=JSON.parse(await readFile(new URL('../data/yanaka.json',import.meta.url),'utf8'));
const diagram=buildSchematic(data.routemap.lines);
assert.equal(diagram.routes.length,15);
assert.equal(diagram.labelOverlaps,0,'Station labels overlap');
// Keep the broad compass directions even when station spacing is schematic.
for(const [from,to,east,south] of [
  ['谷鉄川崎','谷鉄横浜',-1,1],
  ['谷鉄府中','新百合ヶ丘',1,1],
  ['熊谷','秩父',-1,1],
  ['谷鉄渋谷','谷中',1,-1],
  ['武蔵村山','奈良橋',1,1],
  ['汐留','谷中帝都国立臨海公園',1,1],
  ['谷鉄上野','大宮',-1,-1],
  ['新大船','小田原',-1,1],
]) {
  const a=diagram.stations.find(s=>s.name===from),b=diagram.stations.find(s=>s.name===to);
  assert.ok(a&&b,`Missing direction anchor: ${from} / ${to}`);
  assert.ok((b.x-a.x)*east>0 && (b.y-a.y)*south>0,`Wrong direction: ${from} -> ${to}`);
}
// Crossings and shared station endpoints are allowed, shared track-length is not.
for(let i=0;i<diagram.routes.length;i++)for(let j=i+1;j<diagram.routes.length;j++){
  const a=diagram.routes[i],b=diagram.routes[j];
  for(let k=1;k<a.path.length;k++)for(let l=1;l<b.path.length;l++){
    const p=a.path[k-1],q=a.path[k],r=b.path[l-1],s=b.path[l];
    const dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy);
    if(!length)continue;
    if(Math.abs(dx*(s[1]-r[1])-dy*(s[0]-r[0]))>0.01 || Math.abs(dx*(r[1]-p[1])-dy*(r[0]-p[0]))>0.01)continue;
    const project=v=>((v[0]-p[0])*dx+(v[1]-p[1])*dy)/length;
    const shared=Math.min(length,Math.max(project(r),project(s)))-Math.max(0,Math.min(project(r),project(s)));
    assert.ok(shared<0.01,`Overlapping routes: ${a.id} / ${b.id} (${shared})`);
  }
}
for(const route of diagram.routes){
  for(let i=1;i<route.path.length;i++){
    const dx=Math.abs(route.path[i][0]-route.path[i-1][0]);
    const dy=Math.abs(route.path[i][1]-route.path[i-1][1]);
    assert.ok(dx===0 || dy===0 || Math.abs(dx-dy)<0.001,`${route.id}: non-octilinear path`);
  }
  assert.equal(new Set(route.stops.map(s=>s.index)).size,route.stops.length);
}
assert.equal(diagram.routes.find(r=>r.id==='tohoku').stops.length,4);
assert.equal(diagram.routes.find(r=>r.id==='tohoku').stops[0].id,'谷鉄上野');
assert.equal(diagram.routes.find(r=>r.id==='asano').stops.length,25);
assert.equal(diagram.routes.find(r=>r.id==='musashi-loop').stops.length,40);
assert.deepEqual(diagram.routes.find(r=>r.id==='musashi-loop').path[0],diagram.routes.find(r=>r.id==='musashi-loop').path.at(-1));
assert.ok(diagram.stations.find(s=>s.name==='谷鉄東京').names.includes('東京駅北口'));
for(const station of diagram.stations){
  assert.ok(Number.isFinite(station.x)&&Number.isFinite(station.y));
  const b=station.label.box;
  assert.ok(b.x>=0 && b.y>=250 && b.x+b.w<=diagram.sheet.width && b.y+b.h<3730,`Label outside map: ${station.name}`);
}
console.log(`Validated ${diagram.routes.length} routes, ${diagram.stations.length} stations, no label overlaps.`);
