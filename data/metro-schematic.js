export const sheet = { width: 7400, height: 6320 };
const Y_OFFSET = 260;

// 地理的相対位置（北=上・南=下・東=右・西=左）を保持した乗換ハブの基準座標（Y_OFFSET加算前）
const hubs = {
  // 都心コア
  '谷鉄東京': [3640, 3300],
  '神田': [3640, 3000],
  '秋葉原': [3640, 2800],
  '谷鉄上野': [3640, 2500],
  '汐留': [3640, 3500],
  '新浜松町': [3640, 3680],
  '谷鉄品川': [3360, 3960],
  '大井町': [3360, 4460],
  '谷鉄渋谷': [2880, 3480],
  // 多摩・西東京
  '谷鉄調布': [2260, 3540],
  '谷鉄府中': [1840, 3360],
  '国分寺': [1840, 3040],
  '菅仙谷': [2140, 3780],
  '仲町': [1840, 2760],
  '谷鉄小平': [1840, 2620],
  '奈良橋': [1420, 2620],
  '武蔵村山': [1100, 2620],
  '谷鉄八王子': [960, 3460],
  // 神奈川・湘南
  '谷鉄川崎': [2820, 4800],
  '谷鉄横浜': [2460, 5020],
  '新大船': [1860, 5220],
  '酒匂': [560, 5220],
  '小田原': [320, 5460],
  // 北部（埼玉・栃木・群馬）
  '新戸田': [3260, 1980],
  '谷鉄大宮': [2960, 1680],
  '大成': [2960, 1560],
  // 東部・北東（千葉・茨城）
  '谷鉄松戸': [4440, 2120],
  '谷鉄我孫子': [4960, 1740],
  '立沢': [6260, 3220],
};

// 同名異駅（11組・7〜121km離隔）を誤統合しないよう lineId:stationIndex で明示的にハブを割り当てる
const HUB_GROUPS = {
  '谷鉄東京': ['tokai:0', 'musashi-loop:0', 'tono:0', 'yoto:0', 'asano:23'],
  '神田': ['tono:1', 'asano:18'],
  '秋葉原': ['tono:2', 'asano:15'],
  '谷鉄上野': ['tohoku:0', 'tono:3', 'matsusato:0', 'asano:10'],
  '汐留': ['tokai:2', 'rinkai:0'],
  '新浜松町': ['tokai:4', 'bay-monorail:7'],
  '谷鉄品川': ['yanaka-line:0', 'tokai:7', 'bay-monorail:0', 'gotanda:3', 'oimachi:9'],
  '大井町': ['tokai:13', 'oimachi:0'],
  '谷鉄渋谷': ['yanaka-line:5', 'musashi-loop:2', 'yamanote-west:0'],
  '谷鉄調布': ['musashi-loop:7', 'yamanote-west:19'],
  '谷鉄府中': ['musashi-loop:11', 'tama:13', 'yamanote-west:24'],
  '国分寺': ['okumusashi:31', 'tama:16', 'musashi-loop:13'],
  '菅仙谷': ['okumusashi:20', 'tama:7'],
  '仲町': ['okumusashi:34', 'hachioji:17'],
  '谷鉄小平': ['okumusashi:36', 'hachioji:18'],
  '奈良橋': ['okumusashi:42', 'musashi-branch:2'],
  '武蔵村山': ['okumusashi:45', 'musashi-branch:0', 'musashi:0'],
  '谷鉄八王子': ['hachioji:0', 'hinotama:0'],
  '谷鉄川崎': ['tokai:27', 'hamasaki:0'],
  '谷鉄横浜': ['okumusashi:0', 'hamasaki:9'],
  '新大船': ['tokai:49', 'zushi-hayama:0'],
  '酒匂': ['tokai:75', 'sagami-tanzawa:30'],
  '小田原': ['tokai:80', 'sagami-tanzawa:35'],
  '新戸田': ['tohoku:7', 'musashi-loop:27'],
  '谷鉄大宮': ['tohoku:15', 'takasaki:0'],
  '大成': ['tohoku:17', 'takasaki:1'],
  '谷鉄松戸': ['musashi-loop:33', 'matsusato:8'],
  '谷鉄我孫子': ['matsusato:20', 'moriya:0'],
  '立沢': ['yoto:36', 'tako-branch:0'],
};

const HUB_BY_STOP = {};
for (const [hubId, keys] of Object.entries(HUB_GROUPS)) {
  for (const key of keys) {
    HUB_BY_STOP[key] = hubId;
  }
}

// 各路線の八方位模式アンカー: [stationIndex, expectedName, x?, y?, viaPoints?]
// 北が上・東が右、並走区間は ±48px オフセットで分離
const PLANS = {
  'yanaka-line': [
    [0, '谷鉄品川'],
    [5, '谷鉄渋谷'],
    [9, '高田馬場', 2880, 2940],
    [10, '目白', 2880, 2820],
    [13, '谷中（日暮里）', 3400, 2420, [[3040, 2420]]],
  ],
  tokai: [
    [0, '谷鉄東京'],
    [2, '汐留'],
    [4, '新浜松町'],
    [7, '谷鉄品川'],
    [13, '大井町'],
    [27, '谷鉄川崎'],
    [49, '新大船', null, null, [[2520, 5080]]],
    [75, '酒匂'],
    [80, '小田原'],
  ],
  tohoku: [
    [0, '谷鉄上野'],
    [7, '新戸田', null, null, [[3640, 2320]]],
    [15, '谷鉄大宮'],
    [17, '大成'],
    [36, '谷鉄宇都宮', 3700, 120],
  ],
  'musashi-loop': [
    [0, '谷鉄東京', 3640, 3348],
    [2, '谷鉄渋谷', 2880, 3480, [[3496, 3480]]],
    [7, '谷鉄調布'],
    [11, '谷鉄府中', 1840, 3360],
    [13, '新国分寺', 1840, 3040],
    [25, '谷鉄朝霧', 2600, 1980, [[2360, 2440]]],
    [27, '新戸田'],
    [31, '草加', 4200, 1980],
    [33, '谷鉄松戸'],
    [35, '小岩', 4440, 2860],
    [39, '門前仲町', 4060, 3348, [[4440, 3348]]],
    [40, '谷鉄東京', 3640, 3348],
  ],
  okumusashi: [
    [0, '谷鉄横浜'],
    [20, '菅仙谷'],
    [31, '国分寺', 1888, 3040, [[2140, 3292]]],
    [34, '仲町', 1888, 2760],
    [36, '谷鉄小平', 1888, 2620],
    [42, '奈良橋', 1420, 2620],
    [45, '武蔵村山', 1100, 2620],
    [55, '新飯能', 980, 2040],
    [73, '熊谷', 1440, 740],
    [94, '谷鉄秩父', 320, 1340],
  ],
  'musashi-branch': [
    [0, '武蔵村山', 1100, 2668],
    [2, '奈良橋', 1420, 2668],
    [3, '新玉川上水', 1520, 2800],
  ],
  tama: [
    [0, '新百合ヶ丘', 1860, 4080],
    [7, '菅仙谷', 2092, 3780, [[2092, 3960]]],
    [13, '谷鉄府中', 1792, 3360],
    [16, '国分寺', 1792, 3040],
  ],
  'yamanote-west': [
    [0, '谷鉄渋谷', 2832, 3480],
    [8, '谷鉄中野', 2740, 2960],
    [15, '武蔵境', 2260, 2960],
    [19, '谷鉄調布', 2308, 3492],
    [24, '谷鉄府中', 1840, 3312],
  ],
  'sagami-tanzawa': [
    [0, '橋本', 960, 4060],
    [14, '谷鉄厚木', 960, 4640],
    [30, '酒匂', 512, 5172],
    [35, '小田原', 272, 5412],
  ],
  hamasaki: [
    [0, '谷鉄川崎', 2820, 4752],
    [9, '谷鉄横浜', 2460, 4972],
  ],
  'zushi-hayama': [
    [0, '新大船'],
    [2, '谷鉄鎌倉', 1980, 5340],
    [6, '逗子・葉山', 2220, 5480],
  ],
  tono: [
    [0, '谷鉄東京'],
    [1, '神田'],
    [2, '秋葉原'],
    [3, '谷鉄上野'],
  ],
  'bay-monorail': [
    [0, '谷鉄品川'],
    [3, '有明', 3920, 3960],
    [4, '豊洲', 3920, 3680],
    [7, '新浜松町'],
  ],
  rinkai: [
    [0, '汐留'],
    [2, '勝どき', 3980, 3500],
    [5, '谷中帝都国立臨海公園', 4360, 3880],
  ],
  asano: [
    [0, '三ノ輪橋', 4160, 2180],
    [7, '浅草', 4160, 2580],
    [10, '上野', 3688, 2500, [[3980, 2580]]],
    [15, '秋葉原', 3688, 2800],
    [18, '新神田', 3688, 3000],
    [23, '東京駅北口', 3688, 3300],
    [24, '銀座一丁目', 3688, 3420],
  ],
  gotanda: [
    [0, '五反田', 3080, 3960],
    [3, '谷鉄品川'],
  ],
  oimachi: [
    [0, '大井町', 3408, 4460],
    [9, '谷鉄品川', 3408, 3960, [[3540, 4328], [3540, 4092]]],
  ],
  hachioji: [
    [0, '谷鉄八王子'],
    [9, '谷鉄立川', 1400, 3060],
    [17, '仲町', 1840, 2760],
    [18, '谷鉄小平', 1840, 2620],
    [27, '谷鉄清瀬', 2260, 2200],
  ],
  hinotama: [
    [0, '谷鉄八王子'],
    [9, '谷鉄五日市', 600, 3100],
    [15, '神宮寺', 220, 3100],
  ],
  musashi: [
    [0, '武蔵村山'],
    [5, '谷鉄拝島', 820, 2900],
  ],
  yoto: [
    [0, '谷鉄東京'],
    [1, '日本橋', 3820, 3300],
    [11, '谷鉄船橋', 4760, 3300],
    [23, '谷鉄千葉', 5360, 3720],
    [32, '八街ろ', 5960, 3520],
    [36, '立沢'],
    [38, '富里市', 6260, 3060],
  ],
  'tako-branch': [
    [0, '立沢'],
    [11, '多古町', 7040, 3140],
  ],
  moriya: [
    [0, '我孫子', 4960, 1740],
    [5, '谷鉄守谷', 4840, 1180],
  ],
  takasaki: [
    [0, '谷鉄大宮', 2912, 1680],
    [1, '大成', 2912, 1560],
    [14, '谷鉄行田', 2240, 880],
    [22, '大泉', 1840, 480],
    [26, '本庄', 1320, 480],
    [31, '谷鉄高崎', 800, 280],
  ],
  matsusato: [
    [0, '谷鉄上野'],
    [8, '谷鉄松戸'],
    [20, '谷鉄我孫子'],
    [30, '谷鉄取手', 5640, 1700],
    [55, '谷鉄潮来', 7080, 1640],
    [67, '谷鉄鉾田', 7080, 1080],
    [78, '谷鉄水戸', 7080, 580],
    [87, '城里中央', 6780, 160],
  ],
};

function octilinear(points) {
  const result = [points[0]];
  for (const end of points.slice(1)) {
    const start = result.at(-1);
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const diagonal = Math.min(Math.abs(dx), Math.abs(dy));
    if (diagonal && Math.abs(dx) !== Math.abs(dy)) {
      result.push([start[0] + Math.sign(dx) * diagonal, start[1] + Math.sign(dy) * diagonal]);
    }
    if (dx || dy) result.push(end);
  }
  return result;
}

function along(points, t) {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  if (total === 0) throw new Error('Empty schematic segment');
  let distance = total * t;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const ratio = lengths[i] ? distance / lengths[i] : 0;
      return {
        x: points[i][0] + (points[i + 1][0] - points[i][0]) * ratio,
        y: points[i][1] + (points[i + 1][1] - points[i][1]) * ratio + Y_OFFSET,
        dx: points[i + 1][0] - points[i][0],
        dy: points[i + 1][1] - points[i][1],
      };
    }
    distance -= lengths[i];
  }
  throw new Error('Failed to sample schematic segment');
}

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// 線分 p1-p2 と矩形 box（+pad余白）の交差判定（Liang-Barsky）
function segIntersectsBox(p1, p2, box, pad = 12) {
  const minX = box.x - pad;
  const maxX = box.x + box.w + pad;
  const minY = box.y - pad;
  const maxY = box.y + box.h + pad;
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  let t0 = 0;
  let t1 = 1;
  const checks = [
    [-dx, p1[0] - minX],
    [dx, maxX - p1[0]],
    [-dy, p1[1] - minY],
    [dy, maxY - p1[1]],
  ];
  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return t0 <= t1;
}

function directionPriority(dx, dy) {
  const len = Math.hypot(dx, dy) || 1;
  const nx = Math.round(-dy / len);
  const ny = Math.round(dx / len);
  const normals = [
    [nx, ny],
    [-nx, -ny],
  ];
  const base = [
    [1, 0],
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, -0.5],
    [1, 0.5],
    [-1, -0.5],
    [-1, 0.5],
    [0.5, -1],
    [0.5, 1],
    [-0.5, -1],
    [-0.5, 1],
    [1, -1],
    [1, 1],
    [-1, -1],
    [-1, 1],
  ];
  const seen = new Set();
  const dirs = [];
  for (const [vx, vy] of [...normals, ...base]) {
    if (vx === 0 && vy === 0) continue;
    const key = `${vx},${vy}`;
    if (!seen.has(key)) {
      seen.add(key);
      dirs.push([vx, vy]);
    }
  }
  return dirs;
}

export function buildSchematic(source) {
  if (!Array.isArray(source) || source.length === 0) {
    throw new Error('Missing KML route source');
  }
  const nodes = new Map();
  const routes = source.map((line, lineOrder) => {
    const plan = PLANS[line.id];
    if (!plan) throw new Error(`Missing layout plan for ${line.id}`);

    const anchors = plan.map(([stationIndex, expectedName, x, y, via = []], idx) => {
      const isClosingLoop = !!line.loop && idx === plan.length - 1 && stationIndex === line.stations.length;
      if (!isClosingLoop) {
        const st = line.stations[stationIndex];
        if (!st) throw new Error(`Missing station index ${stationIndex} on ${line.id}`);
        if (st.name !== expectedName) {
          throw new Error(`Station mismatch on ${line.id}[${stationIndex}]: expected "${expectedName}", got "${st.name}"`);
        }
      }
      const hubId = HUB_BY_STOP[`${line.id}:${stationIndex}`];
      let point;
      if (x != null && y != null) {
        point = [x, y];
      } else if (hubId && hubs[hubId]) {
        point = hubs[hubId];
      } else {
        throw new Error(`Missing coordinates for anchor ${line.id}[${stationIndex}] (${expectedName})`);
      }
      return { stationIndex, point, via };
    });

    const path = [];
    const stops = [];
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1];
      const b = anchors[i];
      if (b.stationIndex <= a.stationIndex) {
        throw new Error(`Invalid anchor order on ${line.id}: ${a.stationIndex} -> ${b.stationIndex}`);
      }
      const segment = octilinear([a.point, ...b.via, b.point]);
      path.push(...segment.slice(i === 1 ? 0 : 1).map(([px, py]) => [px, py + Y_OFFSET]));

      for (let n = a.stationIndex; n <= b.stationIndex; n++) {
        if (n >= line.stations.length || stops.some((s) => s.index === n)) continue;
        const station = line.stations[n];
        const stopKey = `${line.id}:${n}`;
        const hubId = HUB_BY_STOP[stopKey];
        const id = hubId || stopKey;
        const p = along(segment, (n - a.stationIndex) / (b.stationIndex - a.stationIndex));
        stops.push({ id, index: n, name: station.name, ...p });

        if (!nodes.has(id)) {
          const center = hubId ? hubs[hubId] : null;
          nodes.set(id, {
            id,
            name: hubId || station.name,
            names: [],
            routes: [],
            x: center ? center[0] : p.x,
            y: center ? center[1] + Y_OFFSET : p.y,
            dx: p.dx,
            dy: p.dy,
            platforms: [],
            endpoint: false,
            firstIndex: n,
          });
        }
        const node = nodes.get(id);
        node.platforms.push({ route: line.id, x: p.x, y: p.y });
        if (!node.names.includes(station.name)) node.names.push(station.name);
        if (!node.routes.includes(line.id)) node.routes.push(line.id);
        node.endpoint ||= !line.loop && (n === 0 || n === line.stations.length - 1);
      }
    }

    if (stops.length !== line.stations.length) {
      throw new Error(`Stop count mismatch on ${line.id}: got ${stops.length}, expected ${line.stations.length}`);
    }

    return {
      id: line.id,
      name: line.name,
      color: line.color,
      code: String(lineOrder + 1).padStart(2, '0'),
      loop: !!line.loop,
      path,
      stops,
    };
  });

  // 衝突回避ラベル配置（乗換ハブ・終端駅を優先）
  const stations = [...nodes.values()].sort(
    (a, b) => b.routes.length - a.routes.length || Number(b.endpoint) - Number(a.endpoint) || a.firstIndex - b.firstIndex
  );
  const occupied = [];
  const markers = stations.flatMap((s) => s.platforms.map((p) => ({ x: p.x - 20, y: p.y - 20, w: 40, h: 40 })));
  const allSegments = routes.flatMap((r) =>
    r.path.slice(1).map((pt, i) => [r.path[i], pt])
  );

  for (const s of stations) {
    const isHub = s.routes.length > 1;
    const size = isHub ? 44 : 32;
    const textForWidth = s.name.trimEnd();
    const charScale = isHub ? 1.09 : 1.05;
    const width =
      [...textForWidth].reduce((w, ch) => w + size * (ch.charCodeAt(0) < 128 ? 0.65 : charScale), 0) +
      (isHub ? 20 : 14);
    const dirs = directionPriority(s.dx, s.dy);
    const nearbySegments = allSegments.filter(
      ([p1, p2]) =>
        Math.min(p1[0], p2[0]) <= s.x + 560 &&
        Math.max(p1[0], p2[0]) >= s.x - 560 &&
        Math.min(p1[1], p2[1]) <= s.y + 560 &&
        Math.max(p1[1], p2[1]) >= s.y - 560
    );

    let best = null;
    for (const distance of [28, 42, 58, 78, 102, 130, 165, 205, 250, 305, 370]) {
      for (const [vx, vy] of dirs) {
        const x = s.x + vx * distance;
        const y = s.y + vy * distance;
        const anchor = vx < 0 ? 'end' : vx === 0 ? 'middle' : 'start';
        const box = {
          x: x - (anchor === 'end' ? width : anchor === 'middle' ? width / 2 : 0) - 6,
          y: y - size / 2 - 7,
          w: width + 12,
          h: size + 14,
        };
        if (box.x < 35 || box.y < 290 || box.x + box.w > sheet.width - 35 || box.y + box.h > 5770) {
          continue;
        }
        const collisions = occupied.filter((b) => overlap(box, b)).length;
        const markerHits = markers.filter((b) => overlap(box, b)).length;
        const lineHits = nearbySegments.filter(([p1, p2]) => segIntersectsBox(p1, p2, box)).length;
        const score = collisions * 1e7 + markerHits * 1e5 + lineHits * 3e3 + distance + (vx === 0 ? 6 : 0);
        if (!best || score < best.score) {
          best = { x, y, anchor, box, score, size, distance, collisions };
        }
      }
      if (best && best.score < 3e3) break;
    }

    if (!best) throw new Error(`No label space for ${s.name} (${s.id})`);
    s.label = best;
    occupied.push(best.box);
  }

  return {
    routes,
    stations,
    sheet,
    totalStops: routes.reduce((sum, r) => sum + r.stops.length, 0),
    labelOverlaps: stations.reduce((n, s) => n + s.label.collisions, 0),
  };
}
