import { metroRoutes } from './metro-geography.js';

export const sheet = { width: 4460, height: 4020 };
const hubs = {
  '谷鉄品川':[2700,2600], '谷鉄渋谷':[2000,1900], '谷鉄東京':[3100,1700],
  '汐留':[3100,1950], '新浜松町':[3100,2200], '谷鉄川崎':[2300,2900],
  '新大船':[1300,3250], '小田原':[300,3450], '谷鉄上野':[3100,700],
  '谷鉄府中':[1000,1800], '谷鉄調布':[1400,2000], '谷鉄横浜':[1800,3100],
  '国分寺':[1000,1200], '秋葉原':[3100,1050], '神田':[3100,1400], '武蔵村山':[600,900],
};
const aliases = { '上野':'谷鉄上野', '東京駅北口':'谷鉄東京', '新神田':'神田' };
const canonical = name => aliases[name] || name;
// North is up and east is right; schematic distances leave room for station names.
// Shared anchors fix interchange topology; intermediate stops use equal path distances.
const plans = {
  'yanaka-line': [['谷鉄品川'],['谷鉄渋谷'],['高田馬場',2000,1000],['谷中',2800,600,[[2400,600]]]],
  tokai: [['谷鉄東京'],['汐留'],['新浜松町'],['谷鉄品川'],['谷鉄川崎'],['新大船'],['小田原']],
  tohoku: [['谷鉄上野'],['大宮',2700,200,[[3100,600]]]],
  'musashi-loop': [['谷鉄府中',964,1800],['新ひばりが丘',1400,450,[[820,650],[1020,450]]],['草加',3550,450],['小岩',3850,750],['谷鉄東京',null,null,[[3850,1700]]],['谷鉄渋谷',null,null,[[2900,1900]]],['谷鉄調布'],['谷鉄府中',964,1800,[[1020,2000]]]],
  okumusashi: [['谷鉄横浜'],['国分寺',964,1200,[[1800,2400]]],['武蔵村山'],['新飯能',400,700],['熊谷',800,200],['秩父',250,400]],
  'musashimurayama-branch': [['武蔵村山'],['奈良橋',1050,1000,[[700,1000]]]],
  tama: [['新百合ヶ丘',1300,2600],['谷鉄府中',1036,1800,[[1120,2420]]],['国分寺',1036,1200]],
  'yamanote-west': [['谷鉄渋谷',1964,1900],['武蔵境',1400,900,[[1880,900]]],['谷鉄調布',1436,2000,[[1520,1020]]],['谷鉄府中',1000,1764,[[1220,1700]]]],
  'sagami-tanzawa': [['橋本',700,2500],['小田原']],
  hamasaki: [['谷鉄川崎',2300,2864],['谷鉄横浜',1800,3064]],
  'zushi-hayama': [['新大船'],['逗子・葉山',2050,3450,[[1500,3450]]]],
  tono: [['谷鉄東京'],['神田'],['秋葉原'],['谷鉄上野']],
  'bay-monorail': [['谷鉄品川'],['新浜松町',null,null,[[3600,2600],[3600,2200]]]],
  rinkai: [['汐留'],['谷中帝都国立臨海公園',4120,2800,[[3275,1950]]]],
  asano: [['三ノ輪橋',4100,500],['浅草',4100,850],['上野',3136,700,[[3370,850]]],['秋葉原',3136,1050],['新神田',3136,1400],['東京駅北口',3136,1700],['銀座一丁目',3136,1850]],
};

function octilinear(points) {
  const result = [points[0]];
  for (const end of points.slice(1)) {
    const start = result.at(-1), dx = end[0]-start[0], dy = end[1]-start[1];
    const diagonal = Math.min(Math.abs(dx),Math.abs(dy));
    if (diagonal && Math.abs(dx)!==Math.abs(dy)) result.push([start[0]+Math.sign(dx)*diagonal,start[1]+Math.sign(dy)*diagonal]);
    if (dx || dy) result.push(end);
  }
  return result;
}
function along(points,t) {
  const lengths = points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  let distance = lengths.reduce((a,b)=>a+b,0)*t;
  for(let i=0;i<lengths.length;i++) {
    if(distance<=lengths[i] || i===lengths.length-1) {
      const ratio = lengths[i] ? distance/lengths[i] : 0;
      return {x:points[i][0]+(points[i+1][0]-points[i][0])*ratio,y:points[i][1]+(points[i+1][1]-points[i][1])*ratio+250,dx:points[i+1][0]-points[i][0],dy:points[i+1][1]-points[i][1]};
    }
    distance-=lengths[i];
  }
  throw new Error('Empty schematic segment');
}
const overlap = (a,b) => a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;

export function buildSchematic(source) {
  const inputs = metroRoutes.flatMap(config=>{
    const line=source.find(l=>l.id===config.id);
    if(!line) throw new Error(`Missing route ${config.id}`);
    const last=config.last?line.stations.findIndex(s=>s.name===config.last):line.stations.length-1;
    if(last<0) throw new Error(`Missing endpoint ${config.last}`);
    return [{...line,color:config.color,name:line.name.replace('谷鉄 ','')+(config.suffix||''),stations:line.stations.slice(0,last+1)},...(line.branches||[]).map(b=>({...b,color:config.color,stations:[{name:b.from},...b.stations]}))];
  });
  const nodes=new Map();
  const routes=inputs.map((line,index)=>{
    const plan=plans[line.id];
    if(!plan) throw new Error(`Missing layout ${line.id}`);
    const anchors=plan.map(([name,x,y,via=[]],i)=>{
      const stationIndex=line.shape==='loop' && i===plan.length-1?line.stations.length:line.stations.findIndex(s=>s.name===name);
      if(stationIndex<0) throw new Error(`Missing anchor ${name}`);
      const point=x!=null && y!=null ? [x,y] : hubs[canonical(name)];
      return {stationIndex,point,via};
    });
    const path=[],stops=[];
    for(let i=1;i<anchors.length;i++) {
      const a=anchors[i-1],b=anchors[i];
      if(b.stationIndex<=a.stationIndex) throw new Error(`Anchor order ${line.id}`);
      const segment=octilinear([a.point,...b.via,b.point]);
      path.push(...segment.slice(i===1?0:1).map(([x,y])=>[x,y+250]));
      for(let n=a.stationIndex;n<=b.stationIndex;n++) {
        if(n>=line.stations.length || stops.some(s=>s.index===n)) continue;
        const station=line.stations[n],id=canonical(station.name),p=along(segment,(n-a.stationIndex)/(b.stationIndex-a.stationIndex));
        stops.push({id,index:n,...p});
        const center=hubs[id];
        if(!nodes.has(id)) nodes.set(id,{id,name:id,names:[],routes:[],...p,...(center?{x:center[0],y:center[1]+250}:{}),platforms:[],endpoint:false});
        const node=nodes.get(id);
        node.platforms.push({route:line.id,x:p.x,y:p.y});
        if(!node.names.includes(station.name)) node.names.push(station.name);
        if(!node.routes.includes(line.id)) node.routes.push(line.id);
        node.endpoint ||= line.shape!=='loop' && (n===0 || n===line.stations.length-1);
      }
    }
    if(stops.length!==line.stations.length) throw new Error(`Missing stops ${line.id}`);
    return {id:line.id,name:line.name,color:line.color,code:String(index+1).padStart(2,'0'),path,stops};
  });
  const stations=[...nodes.values()].sort((a,b)=>b.routes.length-a.routes.length || Number(b.endpoint)-Number(a.endpoint));
  const occupied=[],markers=stations.flatMap(s=>s.platforms.map(p=>({x:p.x-16,y:p.y-16,w:32,h:32})));
  for(const s of stations) {
    const size=s.routes.length>1?32:26;
    const width=[...s.name].reduce((n,c)=>n+size*(c.charCodeAt(0)<128?0.65:1),0)+10;
    let best;
    for(const distance of [24,38,56,80,110,150,200,270,350]) {
      for(const [vx,vy] of [[1,-1],[1,1],[-1,-1],[-1,1],[1,0],[-1,0],[0,-1],[0,1]]) {
        const x=s.x+vx*distance,y=s.y+vy*distance;
        const anchor=vx<0?'end':vx===0?'middle':'start';
        const box={x:x-(anchor==='end'?width:anchor==='middle'?width/2:0)-4,y:y-size/2-4,w:width+8,h:size+8};
        if(box.x<50 || box.y<330 || box.x+box.w>4410 || box.y+box.h>3690) continue;
        const collisions=occupied.filter(b=>overlap(box,b)).length;
        const markerHits=markers.filter(b=>overlap(box,b)).length;
        const score=collisions*1e7+markerHits*1e5+distance+(vx===0?5:0);
        if(!best || score<best.score) best={x,y,anchor,box,score,size,distance,collisions};
      }
      if(best && best.score<1e5) break;
    }
    if(!best) throw new Error(`No label space ${s.name}`);
    s.label=best;
    occupied.push(best.box);
  }
  return {routes,stations,sheet,labelOverlaps:stations.reduce((n,s)=>n+s.label.collisions,0)};
}
