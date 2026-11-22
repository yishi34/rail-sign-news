export const sheet = { width: 11200, height: 10450 };
const Y_OFFSET = 340;
const P = 76;

const ROUTE_COLOR_OVERRIDES = {
  okumusashi: '#f8b500',
  'musashi-branch': '#d99100',
};

// 地理的相対位置（北=上・南=下・東=右・西=左）を保持した乗換ハブの基準座標（Y_OFFSET加算前）
const hubs = {
  // 都心コア
  '谷鉄東京': [5560, 5040],
  '神田': [5560, 4440],
  '秋葉原': [5560, 4080],
  '谷鉄上野': [5560, 3480],
  '汐留': [5560, 5480],
  '新浜松町': [5560, 5800],
  '谷鉄品川': [5080, 6280],
  '大井町': [5080, 7140],
  '谷鉄渋谷': [4340, 5360],
  // 多摩・西東京
  '谷鉄調布': [3560, 5360],
  '谷鉄府中': [2600, 5140],
  '谷鉄国分寺': [2638, 4640],
  '菅仙谷': [3060, 6300],
  '仲町': [2600, 4140],
  '谷鉄小平': [2600, 3860],
  '奈良橋': [1840, 3860],
  '武蔵村山': [1300, 3860],
  '谷鉄八王子': [1320, 5260],
  // 神奈川・湘南
  '谷鉄川崎': [4280, 7880],
  '谷鉄横浜': [3300, 8580],
  '新大船': [2560, 8960],
  '酒匂': [740, 8960],
  '小田原': [340, 9360],
  // 北部（埼玉・栃木・群馬）
  '新戸田': [4960, 2660],
  '谷鉄大宮': [4460, 2240],
  '大成': [4460, 1980],
  // 東部・北東（千葉・茨城）
  '谷鉄松戸': [6820, 3060],
  '谷鉄我孫子': [7640, 2500],
  '立沢': [9480, 4920],
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
  '谷鉄国分寺': ['okumusashi:31', 'tama:16'],
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
// 北が上・東が右、並走区間は ±P (76px) オフセットで分離
const PLANS = {
  'yanaka-line': [
    [0, '谷鉄品川'],
    [5, '谷鉄渋谷'],
    [9, '高田馬場', 4340, 4440],
    [10, '目白', 4340, 4220],
    [13, '谷中（日暮里）', 5140, 3480, [[4620, 3480]]],
  ],
  tokai: [
    [0, '谷鉄東京'],
    [2, '汐留'],
    [4, '新浜松町'],
    [7, '谷鉄品川'],
    [13, '大井町'],
    [27, '谷鉄川崎'],
    [49, '新大船', null, null, [[3200, 8960]]],
    [75, '酒匂'],
    [80, '小田原'],
  ],
  tohoku: [
    [0, '谷鉄上野'],
    [7, '新戸田', null, null, [[5560, 3260]]],
    [15, '谷鉄大宮'],
    [17, '大成'],
    [36, '谷鉄宇都宮', 5560, 160],
  ],
  'musashi-loop': [
    [0, '谷鉄東京', 5560, 5040 + P],
    [2, '谷鉄渋谷', 4340, 5360, [[5060, 5116], [4816, 5360]]],
    [7, '谷鉄調布'],
    [11, '谷鉄府中', 2600, 5140],
    [13, '新国分寺', 2900, 4530, [[2600, 4830]]],
    [25, '谷鉄朝霧', 3900, 2660, [[3520, 3560]]],
    [27, '新戸田'],
    [31, '草加', 6420, 2660],
    [33, '谷鉄松戸'],
    [35, '小岩', 6820, 4100],
    [39, '門前仲町', 6180, 5040 + P, [[6820, 5040 + P]]],
    [40, '谷鉄東京', 5560, 5040 + P],
  ],
  okumusashi: [
    [0, '谷鉄横浜'],
    [20, '菅仙谷', null, null, [[2920, 8580], [2920, 6440]]],
    [31, '国分寺', 2600 + P, 4640, [[3060, 5024]]],
    [34, '仲町', 2600 + P, 4140],
    [36, '谷鉄小平', 2600 + P, 3860],
    [42, '奈良橋', 1840, 3860],
    [45, '武蔵村山', 1300, 3860],
    [55, '新飯能', 1220, 2960],
    [73, '熊谷', 1980, 1040],
    [94, '谷鉄秩父', 360, 1940],
  ],
  'musashi-branch': [
    [0, '武蔵村山', 1300, 3860 + P],
    [2, '奈良橋', 1840, 3860 + P],
    [3, '新玉川上水', 2020, 4120],
  ],
  tama: [
    [0, '新百合ヶ丘', 2620, 6840],
    [7, '菅仙谷', 3060 - P, 6300, [[3060 - P, 6580]]],
    [13, '谷鉄府中', 2600 - P, 5140],
    [16, '国分寺', 2600, 4640, [[2600 - P, 4716]]],
  ],
  'yamanote-west': [
    [0, '谷鉄渋谷', 4340 - P, 5360],
    [8, '谷鉄中野', 4140, 4320],
    [15, '武蔵境', 3560, 4320],
    [19, '谷鉄調布', 3560 + P, 5360 - P],
    [24, '谷鉄府中', 2600, 5140 - P],
  ],
  'sagami-tanzawa': [
    [0, '橋本', 1320, 6240],
    [14, '谷鉄厚木', 1320, 7620],
    [30, '酒匂', 740 - P, 8960 - P],
    [35, '小田原', 340 - P, 9360 - P],
  ],
  hamasaki: [
    [0, '谷鉄川崎', 4140, 7740],
    [9, '谷鉄横浜', 3300, 8580],
  ],
  'zushi-hayama': [
    [0, '新大船'],
    [2, '谷鉄鎌倉', 2760, 9160],
    [6, '逗子・葉山', 3140, 9420],
  ],
  tono: [
    [0, '谷鉄東京'],
    [1, '神田'],
    [2, '秋葉原'],
    [3, '谷鉄上野'],
  ],
  'bay-monorail': [
    [0, '谷鉄品川'],
    [3, '有明', 5980, 6280],
    [4, '豊洲', 5980, 5800],
    [7, '新浜松町'],
  ],
  rinkai: [
    [0, '汐留'],
    [2, '勝どき', 6100, 5480],
    [5, '谷中帝都国立臨海公園', 6680, 6060],
  ],
  asano: [
    [0, '三ノ輪橋', 6460, 3300],
    [7, '浅草', 6460, 3880],
    [10, '上野', 5560 + P, 3480, [[6060, 3480]]],
    [15, '秋葉原', 5560 + P, 4080],
    [18, '新神田', 5560 + P, 4440],
    [23, '東京駅北口', 5560 + P, 5040],
    [24, '銀座一丁目', 5560 + P, 5240],
  ],
  gotanda: [
    [0, '五反田', 4460, 6280],
    [3, '谷鉄品川'],
  ],
  oimachi: [
    [0, '大井町', 5080 + P, 7140],
    [9, '谷鉄品川', 5080 + P, 6280, [[5480, 6816], [5480, 6604]]],
  ],
  hachioji: [
    [0, '谷鉄八王子'],
    [9, '谷鉄立川', 1980, 4600],
    [17, '仲町', 2600, 4140],
    [18, '谷鉄小平', 2600, 3860],
    [27, '谷鉄清瀬', 3300, 3160],
  ],
  hinotama: [
    [0, '谷鉄八王子'],
    [9, '谷鉄五日市', 800, 4740],
    [15, '神宮寺', 200, 4740],
  ],
  musashi: [
    [0, '武蔵村山'],
    [5, '谷鉄拝島', 940, 4220],
  ],
  yoto: [
    [0, '谷鉄東京'],
    [1, '日本橋', 5980, 5040],
    [11, '谷鉄船橋', 7300, 5040],
    [23, '谷鉄千葉', 8220, 5700],
    [32, '八街ろ', 9060, 5380],
    [36, '立沢'],
    [38, '富里市', 9480, 4640],
  ],
  'tako-branch': [
    [0, '立沢'],
    [11, '多古町', 10700, 4920],
  ],
  moriya: [
    [0, '我孫子', 7640, 2500],
    [5, '谷鉄守谷', 7480, 1660],
  ],
  takasaki: [
    [0, '谷鉄大宮', 4460 - P, 2240],
    [1, '大成', 4460 - P, 1980],
    [14, '谷鉄行田', 3360, 1160],
    [22, '大泉', 2720, 600],
    [26, '本庄', 1940, 600],
    [31, '谷鉄高崎', 1120, 340],
  ],
  matsusato: [
    [0, '谷鉄上野'],
    [8, '谷鉄松戸'],
    [20, '谷鉄我孫子'],
    [30, '谷鉄取手', 8620, 2420],
    [55, '谷鉄潮来', 10780, 2340],
    [67, '谷鉄鉾田', 10780, 1520],
    [78, '谷鉄水戸', 10780, 760],
    [87, '城里中央', 10320, 160],
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
function segIntersectsBox(p1, p2, box, pad = 21) {
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
        const displayName = hubId === '谷鉄国分寺' ? '谷鉄国分寺' : station.name;
        if (!node.names.includes(displayName)) node.names.push(displayName);
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
      color: ROUTE_COLOR_OVERRIDES[line.id] || line.color,
      code: String(lineOrder + 1).padStart(2, '0'),
      loop: !!line.loop,
      path,
      stops,
    };
  });

  // 引出線なし・駅ドット直近（<=62px）に横書き／縦書きで文字・ドット・路線線分すべて非重複配置
  const stations = [...nodes.values()].sort(
    (a, b) => b.routes.length - a.routes.length || Number(b.endpoint) - Number(a.endpoint) || a.firstIndex - b.firstIndex
  );
  const occupied = [];
  const markers = stations.flatMap((s) => s.platforms.map((p) => ({ x: p.x - 28, y: p.y - 28, w: 56, h: 56 })));
  const allSegments = routes.flatMap((r) => r.path.slice(1).map((pt, i) => [r.path[i], pt]));

  const HORIZ_DIRS = [
    [1, 0],
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, -0.6],
    [1, 0.6],
    [-1, -0.6],
    [-1, 0.6],
    [1, -1],
    [1, 1],
    [-1, -1],
    [-1, 1],
    [0.6, -1.3],
    [0.6, 1.3],
    [-0.6, -1.3],
    [-0.6, 1.3],
  ];

  for (const s of stations) {
    const isHub = s.routes.length > 1;
    const size = isHub ? 48 : 36;
    const chars = [...s.name.trimEnd()];
    const charScale = isHub ? 1.09 : 1.05;
    const horizW = chars.reduce((w, ch) => w + size * (ch.charCodeAt(0) < 128 ? 0.65 : charScale), 0) + (isHub ? 18 : 12);
    const horizH = size * 1.40;
    const vertW = size * 1.44;
    const vertH = chars.length * size * 1.10 + 12;

    const minPx = Math.min(...s.platforms.map((p) => p.x), s.x);
    const maxPx = Math.max(...s.platforms.map((p) => p.x), s.x);
    const minPy = Math.min(...s.platforms.map((p) => p.y), s.y);
    const maxPy = Math.max(...s.platforms.map((p) => p.y), s.y);

    const isHorizontalTrack = Math.abs(s.dx) > Math.abs(s.dy) * 1.5;
    const nearbySegments = allSegments.filter(
      ([p1, p2]) =>
        Math.min(p1[0], p2[0]) <= maxPx + 650 &&
        Math.max(p1[0], p2[0]) >= minPx - 650 &&
        Math.min(p1[1], p2[1]) <= maxPy + 650 &&
        Math.max(p1[1], p2[1]) >= minPy - 650
    );

    const candidates = [];
    // 縦書き候補（水平区間で最優先、他区間の非ハブでも衝突回避に利用）
    if (isHorizontalTrack || !isHub) {
      const orientPenalty = isHorizontalTrack ? 0 : 120;
      for (const gap of [28, 38, 48, 58]) {
        for (const dirY of [-1, 1]) {
          for (const shiftX of [0, -18, 18]) {
            const x = s.x + shiftX;
            const anchor = dirY < 0 ? 'end' : 'start';
            const y = dirY < 0 ? minPy - gap : maxPy + gap;
            const topY = dirY < 0 ? y - vertH : y;
            const box = { x: x - vertW * 0.44 - 5, y: topY - 4, w: vertW + 10, h: vertH + 8 };
            candidates.push({
              vertical: true,
              x,
              y,
              anchor,
              box,
              gap,
              orientPenalty: orientPenalty + Math.abs(shiftX),
            });
          }
        }
      }
    }

    // 横書き候補（縦・斜め区間とハブ駅で優先）
    const horizOrientPenalty = isHorizontalTrack && !isHub ? 60 : 0;
    for (const gap of [30, 40, 50, 62]) {
      for (const [vx, vy] of HORIZ_DIRS) {
        const baseX = vx > 0 ? maxPx : vx < 0 ? minPx : s.x;
        const baseY = vy > 0 ? maxPy : vy < 0 ? minPy : s.y;
        const x = baseX + vx * gap;
        const y = baseY + vy * gap;
        const anchor = vx < 0 ? 'end' : vx === 0 ? 'middle' : 'start';
        const box = {
          x: x - (anchor === 'end' ? horizW : anchor === 'middle' ? horizW / 2 : 0) - 5,
          y: y - horizH / 2 - 5,
          w: horizW + 10,
          h: horizH + 10,
        };
        candidates.push({
          vertical: false,
          x,
          y,
          anchor,
          box,
          gap,
          orientPenalty: horizOrientPenalty + (vx === 0 ? 8 : 0),
        });
      }
    }

    let best = null;
    for (const c of candidates) {
      const b = c.box;
      if (b.x < 35 || b.y < 360 || b.x + b.w > sheet.width - 35 || b.y + b.h > 9850) {
        continue;
      }
      const collisions = occupied.filter((o) => overlap(b, o)).length;
      const markerHits = markers.filter((m) => overlap(b, m)).length;
      const lineHits = nearbySegments.filter(([p1, p2]) => segIntersectsBox(p1, p2, b)).length;
      const score = collisions * 1e7 + markerHits * 2e5 + lineHits * 5e4 + c.orientPenalty + c.gap;
      if (!best || score < best.score) {
        best = {
          x: c.x,
          y: c.y,
          anchor: c.anchor,
          box: c.box,
          score,
          size,
          distance: c.gap,
          vertical: c.vertical,
          collisions,
          markerHits,
          lineHits,
        };
      }
    }

    if (!best) throw new Error(`No adjacent label space for ${s.name} (${s.id})`);
    s.label = best;
    occupied.push(best.box);
  }

  return {
    routes,
    stations,
    sheet,
    totalStops: routes.reduce((sum, r) => sum + r.stops.length, 0),
    labelOverlaps: stations.reduce((n, s) => n + s.label.collisions, 0),
    labelMarkerHits: stations.reduce((n, s) => n + s.label.markerHits, 0),
    labelLineHits: stations.reduce((n, s) => n + s.label.lineHits, 0),
  };
}
