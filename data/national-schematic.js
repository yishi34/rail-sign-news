import { EXTERNAL_TRANSFERS } from './external-transfers.js';

export const sheet = { width: 36000, height: 26000 };
const Y_OFFSET = 420;
const P = 76;
const KDX = 22800;
const KDY = 10900; // Kanto local y=340 corresponds to national y=11240

const k = (x, y) => [KDX + x, KDY + y];

// 地理的相対位置（北=上・南=下・東=右・西=左）を保持した乗換ハブの基準座標
const hubs = {
  // ===== 首都圏コア（metro-schematic.js 準拠の相対座標）=====
  '谷鉄東京': k(5560, 5380),
  '秋葉原': k(5560, 4420),
  '谷鉄上野': k(5560, 3820),
  '汐留': k(5560, 5820),
  '新浜松町': k(5560, 6140),
  '谷鉄品川': k(5080, 6620),
  '大井町': k(5080, 7480),
  '谷鉄渋谷': k(4340, 5700),
  // 多摩・西東京
  '谷鉄調布': k(3560, 5700),
  '谷鉄府中': k(2600, 5480),
  '谷鉄国分寺': k(2638, 4980),
  '菅仙谷': k(3060, 6640),
  '仲町': k(2600, 4480),
  '谷鉄小平': k(2600, 4200),
  '奈良橋': k(1840, 4200),
  '武蔵村山': k(1300, 4200),
  '谷鉄八王子': k(1320, 5600),
  // 神奈川・湘南
  '谷鉄川崎': k(4280, 8220),
  '谷鉄横浜': k(3300, 8920),
  '新大船': k(2560, 9300),
  '酒匂': k(740, 9300),
  '小田原': k(340, 9700),
  // 北関東・千葉・茨城
  '新戸田': k(4960, 3000),
  '谷鉄大宮': k(4460, 2580),
  '大成': k(4460, 2320),
  '谷鉄松戸': k(6820, 3400),
  '谷鉄我孫子': k(7640, 2840),
  '立沢': k(9480, 5260),
  '谷鉄高崎': k(1120, 680),

  // ===== 全国幹線・地方ハブ =====
  // 東北
  '金剛沢': [30700, 4800],
  '谷鉄仙台': [30900, 4300],
  // 甲信越・北陸・東海
  '上諏訪': [18200, 14200],
  '谷鉄長野': [18200, 10200],
  '新富士': [19600, 19800],
  '谷鉄名古屋': [14400, 17400],
  // 関西
  '谷鉄西大寺': [12600, 17800],
  '谷鉄高槻': [11800, 16000],
  '谷鉄大阪梅田': [10600, 17800],
  // 中国・四国
  '和気': [9000, 15600],
  '谷鉄岡山': [8000, 16200],
  '海田市': [5400, 16800],
  // 九州
  '谷鉄門司港': [1800, 16600],
  '谷鉄熊本': [1800, 22000],
};

// 同名異駅を誤統合しないよう lineId:stationIndex で明示的に乗換ハブを定義
const HUB_GROUPS = {
  // 首都圏
  '谷鉄東京': ['tokai:0', 'musashi-loop:0', 'tono:0', 'yoto:0'],
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
  '谷鉄高崎': ['takasaki:31', 'gatama:7'],
  // 全国
  '金剛沢': ['tohoku:90', 'yamagata:7'],
  '谷鉄仙台': ['tohoku:95', 'yamagata:0'],
  '上諏訪': ['toyama:65', 'kitadake-climb:0', 'nagano:0'],
  '谷鉄長野': ['gatama:35', 'nagano:23'],
  '新富士': ['tokai:125', 'toyama:0'],
  '谷鉄名古屋': ['tokai:214', 'meifu:0'],
  '谷鉄西大寺': ['tokai:261', 'daira:0', 'wakayama:0'],
  '谷鉄高槻': ['daira:23', 'osaka:16'],
  '谷鉄大阪梅田': ['tokai:277', 'sanyo:0'],
  '和気': ['sanyo:40', 'tsuyama:0'],
  '谷鉄岡山': ['sanyo:46', 'setouchi:0'],
  '海田市': ['sanyo:78', 'fuchucho-branch:0', 'kure-branch:0'],
  '谷鉄門司港': ['sanyo:145', 'kyushu:0'],
  '谷鉄熊本': ['kyushu:79', 'oita:0'],
};

const DISPLAY_NAME_OVERRIDES = {
  'okumusashi:31': '谷鉄国分寺',
  'tama:16': '谷鉄国分寺',
  'asano:23': '東京北口',
  'matsusato:23': '新つくし野',
  'matsusato:26': '新布施',
};

const HUB_BY_STOP = {};
for (const [hubId, keys] of Object.entries(HUB_GROUPS)) {
  for (const key of keys) {
    HUB_BY_STOP[key] = hubId;
  }
}

// 各路線の八方位模式アンカー: [stationIndex, expectedName, x?, y?, viaPoints?]
const PLANS = {
  // ===== 幹線・全国路線 =====
  tokai: [
    [0, '谷鉄東京'],
    [2, '汐留'],
    [4, '新浜松町'],
    [7, '谷鉄品川'],
    [13, '大井町'],
    [27, '谷鉄川崎'],
    [49, '新大船', null, null, [k(3200, 9300)]],
    [75, '酒匂'],
    [80, '小田原'],
    [93, '谷鉄熱海', 22200, 21200],
    [125, '新富士'],
    [138, '谷鉄静岡', 18000, 21200],
    [167, '谷鉄浜松', 15800, 21200],
    [180, '豊橋', 15200, 20000],
    [214, '谷鉄名古屋', null, null, [[15200, 18200]]],
    [258, '谷鉄奈良', 13000, 17800, [[14400, 18800], [13400, 18800]]],
    [261, '谷鉄西大寺'],
    [277, '谷鉄大阪梅田'],
  ],
  sanyo: [
    [0, '谷鉄大阪梅田'],
    [12, '谷鉄神戸', 9800, 17200],
    [30, '谷鉄姫路', 9800, 15600],
    [40, '和気'],
    [46, '谷鉄岡山'],
    [58, '福山', 7200, 16800],
    [78, '海田市', null, null, [[5800, 16800]]],
    [79, '谷鉄広島', 5050, 16800],
    [100, '岩国', 4400, 17400],
    [145, '谷鉄門司港', null, null, [[3400, 17400], [2600, 16600]]],
  ],
  kyushu: [
    [0, '谷鉄門司港'],
    [28, '横手', 1000, 18800],
    [56, '八女', 1500, 20800],
    [79, '谷鉄熊本'],
    [111, '谷鉄鹿児島中央', 1500, 24400, [[1500, 22300]]],
  ],
  oita: [
    [0, '谷鉄熊本'],
    [7, '大平', 2800, 22200],
    [15, '玉来', 3600, 21400],
    [30, '谷鉄大分', 4300, 20700],
  ],
  tohoku: [
    [0, '谷鉄上野'],
    [7, '新戸田', null, null, [k(5560, 3600)]],
    [15, '谷鉄大宮'],
    [17, '大成'],
    [36, '谷鉄宇都宮', ...k(5560, 500)],
    [44, '谷鉄黒磯', 29000, 9500],
    [61, '谷鉄郡山', 29800, 7900],
    [74, '谷鉄福島', 29800, 6500],
    [90, '金剛沢'],
    [95, '谷鉄仙台'],
    [127, '谷鉄一ノ関', 31600, 2400],
    [155, '谷鉄盛岡', 31600, 600],
  ],
  yamagata: [
    [0, '谷鉄仙台', 30900 - P, 4300],
    [7, '金剛沢', 30700 - P, 4800],
    [23, '谷鉄山形', 28200, 4800],
  ],
  setouchi: [
    [0, '谷鉄岡山'],
    [16, '横井', 8000, 17800],
    [32, '田野々', 6800, 19000],
    [63, '谷鉄松山', 4800, 19600],
  ],
  tsuyama: [
    [0, '和気'],
    [7, '並木', 9000, 14800],
    [27, '谷鉄津山', 8200, 13600],
  ],
  'fuchucho-branch': [
    [0, '海田市'],
    [1, '府中町', 5350, 16300, [[5400, 16350]]],
  ],
  'kure-branch': [
    [0, '海田市'],
    [6, '谷鉄呉', 5400, 17700],
    [7, '広', 5800, 17700],
  ],
  meifu: [
    [0, '谷鉄名古屋'],
    [7, '海津', 13600, 16600],
    [13, '谷鉄岐阜', 13600, 15500],
  ],
  osaka: [
    [0, '谷鉄京都', 12600, 15200],
    [16, '谷鉄高槻', 11800, 16000],
    [37, '大阪阿倍野橋', 11287, 18600, [[11287, 16513]]],
  ],
  daira: [
    [0, '谷鉄西大寺', 12600, 17800 - P],
    [16, '私市', 12600, 16600],
    [23, '高槻南', 11800, 16000 + P, [[11800, 16600]]],
    [31, '江坂', 10500, 15776, [[11500, 15776]]],
  ],
  wakayama: [
    [0, '谷鉄西大寺'],
    [15, '五條', 12600, 19800],
    [30, '谷鉄和歌山', 10200, 20600, [[11000, 20600]]],
  ],
  toyama: [
    [0, '新富士'],
    [27, '甲斐落合', 19200, 17000],
    [65, '上諏訪'],
    [83, '穂高', 16600, 12600],
    [110, '谷鉄富山', 13800, 9800],
  ],
  'kitadake-climb': [
    [0, '上諏訪', 18200 - P, 14200],
    [3, '北岳登山口', 18200 - P, 15600],
  ],
  nagano: [
    [0, '上諏訪'],
    [6, '谷鉄佐久', 19400, 13200],
    [12, '本郷', 18900, 12200],
    [23, '谷鉄長野', null, null, [[18900, 10900]]],
  ],
  gatama: [
    [0, '草津温泉', 21400, 9400],
    [7, '谷鉄高崎', null, null, [[23504, 11580 - P], [23920, 11580 - P]]],
    [25, '新上田', 18000, 11580, [[21200, 11580]]],
    [35, '谷鉄長野', null, null, [[17500, 11580], [17500, 10900]]],
    [49, '直江津', 18200, 7400],
  ],

  // ===== 首都圏23路線（metro-schematic.js と同一相対座標）=====
  'yanaka-line': [
    [0, '谷鉄品川'],
    [5, '谷鉄渋谷'],
    [9, '高田馬場', ...k(4340, 4780)],
    [10, '目白', ...k(4340, 4560)],
    [13, '谷中（日暮里）', ...k(5140, 3820), [k(4620, 3820)]],
  ],
  'musashi-loop': [
    [0, '谷鉄東京', ...k(5560, 5380 + P)],
    [2, '谷鉄渋谷', ...k(4340, 5700), [k(5060, 5456), k(4816, 5700)]],
    [7, '谷鉄調布'],
    [11, '谷鉄府中', ...k(2600, 5480)],
    [13, '新国分寺', ...k(2900, 4870), [k(2600, 5170)]],
    [25, '谷鉄朝霧', ...k(3900, 3000), [k(3520, 3900)]],
    [27, '新戸田'],
    [31, '草加', ...k(6420, 3000)],
    [33, '谷鉄松戸'],
    [35, '小岩', ...k(6820, 4440)],
    [39, '門前仲町', ...k(6180, 5380 + P), [k(6820, 5380 + P)]],
    [40, '谷鉄東京', ...k(5560, 5380 + P)],
  ],
  okumusashi: [
    [0, '谷鉄横浜'],
    [20, '菅仙谷', null, null, [k(2920, 8920), k(2920, 6780)]],
    [31, '国分寺', ...k(2600 + P, 4980), [k(3060, 5364)]],
    [34, '仲町', ...k(2600 + P, 4480)],
    [36, '谷鉄小平', ...k(2600 + P, 4200)],
    [42, '奈良橋', ...k(1840, 4200)],
    [45, '武蔵村山', ...k(1300, 4200)],
    [55, '新飯能', ...k(1220, 3300)],
    [73, '熊谷', ...k(1980, 1380)],
    [94, '谷鉄秩父', ...k(360, 2280)],
  ],
  'musashi-branch': [
    [0, '武蔵村山', ...k(1300, 4200 + P)],
    [2, '奈良橋', ...k(1840, 4200 + P)],
    [3, '新玉川上水', ...k(2020, 4460)],
  ],
  tama: [
    [0, '新百合ヶ丘', ...k(2620, 7180)],
    [7, '菅仙谷', ...k(3060 - P, 6640), [k(3060 - P, 6920)]],
    [13, '谷鉄府中', ...k(2600 - P, 5480)],
    [16, '国分寺', ...k(2600, 4980), [k(2600 - P, 5056)]],
  ],
  'yamanote-west': [
    [0, '谷鉄渋谷', ...k(4340 - P, 5700)],
    [8, '谷鉄中野', ...k(4140, 4660)],
    [15, '武蔵境', ...k(3560, 4660)],
    [19, '谷鉄調布', ...k(3560 + P, 5700 - P)],
    [24, '谷鉄府中', ...k(2600, 5480 - P)],
  ],
  'sagami-tanzawa': [
    [0, '橋本', ...k(1320, 6580)],
    [14, '谷鉄厚木', ...k(1320, 7960)],
    [30, '酒匂', ...k(740 - P, 9300 - P)],
    [35, '小田原', ...k(340 - P, 9700 - P)],
  ],
  hamasaki: [
    [0, '谷鉄川崎', ...k(4140, 8080)],
    [9, '谷鉄横浜', ...k(3300, 8920)],
  ],
  'zushi-hayama': [
    [0, '新大船'],
    [2, '谷鉄鎌倉', ...k(2760, 9500)],
    [6, '逗子・葉山', ...k(3140, 9760)],
  ],
  tono: [
    [0, '谷鉄東京'],
    [1, '神田', ...k(5560, 4780)],
    [2, '秋葉原'],
    [3, '谷鉄上野'],
  ],
  'bay-monorail': [
    [0, '谷鉄品川'],
    [3, '有明', ...k(5980, 6620)],
    [4, '豊洲', ...k(5980, 6140)],
    [7, '新浜松町'],
  ],
  rinkai: [
    [0, '汐留'],
    [2, '勝どき', ...k(6100, 5820)],
    [5, '谷中帝都国立臨海公園', ...k(6680, 6400)],
  ],
  asano: [
    [0, '三ノ輪橋', ...k(6460, 3640)],
    [7, '浅草', ...k(6460, 4220)],
    [10, '上野', ...k(5560 + P, 3820), [k(6060, 3820)]],
    [15, '秋葉原', ...k(5560 + P, 4420)],
    [18, '新神田', ...k(5560 + P, 4750)],
    [23, '東京駅北口', ...k(5560 + P, 5290)],
    [24, '銀座一丁目', ...k(5560 + P, 5580)],
  ],
  gotanda: [
    [0, '五反田', ...k(4460, 6620)],
    [3, '谷鉄品川'],
  ],
  oimachi: [
    [0, '大井町', ...k(5080 + P, 7480)],
    [9, '谷鉄品川', ...k(5080 + P, 6620), [k(5480, 7156), k(5480, 6944)]],
  ],
  hachioji: [
    [0, '谷鉄八王子'],
    [9, '谷鉄立川', ...k(1980, 4940)],
    [17, '仲町', ...k(2600, 4480)],
    [18, '谷鉄小平', ...k(2600, 4200)],
    [27, '谷鉄清瀬', ...k(3300, 3500)],
  ],
  hinotama: [
    [0, '谷鉄八王子'],
    [9, '谷鉄五日市', ...k(800, 5080)],
    [15, '神宮寺', ...k(200, 5080)],
  ],
  musashi: [
    [0, '武蔵村山'],
    [5, '谷鉄拝島', ...k(940, 4560)],
  ],
  yoto: [
    [0, '谷鉄東京'],
    [1, '日本橋', ...k(5980, 5380)],
    [11, '谷鉄船橋', ...k(7300, 5380)],
    [23, '谷鉄千葉', ...k(8220, 6040)],
    [32, '八街ろ', ...k(9060, 5720)],
    [36, '立沢'],
    [38, '富里市', ...k(9480, 4980)],
  ],
  'tako-branch': [
    [0, '立沢'],
    [11, '多古町', ...k(10700, 5260)],
  ],
  moriya: [
    [0, '我孫子', ...k(7640, 2840)],
    [5, '谷鉄守谷', ...k(7480, 2000)],
  ],
  takasaki: [
    [0, '谷鉄大宮', ...k(4460 - P, 2580)],
    [1, '大成', ...k(4460 - P, 2320)],
    [14, '谷鉄行田', ...k(3360, 1500)],
    [22, '大泉', ...k(2720, 940)],
    [26, '本庄', ...k(1940, 940)],
    [31, '谷鉄高崎', ...k(1120, 680)],
  ],
  matsusato: [
    [0, '谷鉄上野'],
    [8, '谷鉄松戸'],
    [20, '谷鉄我孫子'],
    [30, '谷鉄取手', ...k(8620, 2760)],
    [55, '谷鉄潮来', ...k(10780, 2680)],
    [67, '谷鉄鉾田', ...k(10780, 1860)],
    [78, '谷鉄水戸', ...k(10780, 1100)],
    [87, '城里中央', ...k(10320, 500)],
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
        y: points[i][1] + (points[i + 1][1] - points[i][1]) * ratio,
        dx: points[i + 1][0] - points[i][0],
        dy: points[i + 1][1] - points[i][1],
      };
    }
    distance -= lengths[i];
  }
  throw new Error('Failed to sample schematic segment');
}

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function segIntersectsBox(p1, p2, box, pad = 21) {
  const minX = box.x - pad;
  const maxX = box.x + box.w + pad;
  const minY = box.y - pad;
  const maxY = box.y + box.h + pad;
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  let t0 = 0;
  let t1 = 1;
  for (const [p, q] of [
    [-dx, p1[0] - minX],
    [dx, maxX - p1[0]],
    [-dy, p1[1] - minY],
    [dy, maxY - p1[1]],
  ]) {
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

export function buildNationalSchematic(source) {
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
      path.push(...segment.slice(i === 1 ? 0 : 1));

      for (let n = a.stationIndex; n <= b.stationIndex; n++) {
        if (n >= line.stations.length || stops.some((s) => s.index === n)) continue;
        const station = line.stations[n];
        const stopKey = `${line.id}:${n}`;
        const hubId = HUB_BY_STOP[stopKey];
        const id = hubId || stopKey;
        const displayName = DISPLAY_NAME_OVERRIDES[stopKey] || station.name;
        const p = along(segment, (n - a.stationIndex) / (b.stationIndex - a.stationIndex));
        stops.push({ id, index: n, name: station.name, ...p });

        if (!nodes.has(id)) {
          const center = hubId ? hubs[hubId] : null;
          const ext = EXTERNAL_TRANSFERS[id] || null;
          nodes.set(id, {
            id,
            name: hubId || displayName,
            names: [],
            routes: [],
            x: center ? center[0] : p.x,
            y: center ? center[1] : p.y,
            dx: p.dx,
            dy: p.dy,
            platforms: [],
            endpoint: false,
            firstIndex: n,
            externalTransfers: ext ? ext.lines : [],
            transferNote: ext ? ext.short : '',
          });
        }
        const node = nodes.get(id);
        node.platforms.push({ route: line.id, x: p.x, y: p.y });
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
      color: line.color,
      code: String(lineOrder + 1).padStart(2, '0'),
      loop: !!line.loop,
      path,
      stops,
    };
  });

  const stations = [...nodes.values()].sort(
    (a, b) => b.routes.length - a.routes.length || Number(b.endpoint) - Number(a.endpoint) || a.firstIndex - b.firstIndex
  );
  const occupied = [];
  const markers = stations.flatMap((s) => s.platforms.map((p) => ({ x: p.x - 28, y: p.y - 28, w: 56, h: 56 })));
  const allSegments = routes.flatMap((r) => r.path.slice(1).map((pt, i) => [r.path[i], pt]));

  const hashimoto = stations.find((s) => s.id === 'sagami-tanzawa:0');
  const esaka = stations.find((s) => s.id === 'daira:31');
  const externalThroughLines = [];
  if (hashimoto) {
    externalThroughLines.push({
      id: 'keio-sagamihara-through',
      routeId: 'sagami-tanzawa',
      fromId: hashimoto.id,
      name: '京王線直通（調布・新宿方面）',
      label: '京王線直通',
      color: '#dd0077',
      path: [
        [hashimoto.x, hashimoto.y],
        [hashimoto.x, hashimoto.y - 140],
        [hashimoto.x + 280, hashimoto.y - 420],
      ],
      labelPos: { x: hashimoto.x + 318, y: hashimoto.y - 438 },
    });
  }
  if (esaka) {
    externalThroughLines.push({
      id: 'midosuji-through',
      routeId: 'daira',
      fromId: esaka.id,
      name: '大阪メトロ御堂筋線直通（新大阪・梅田方面）',
      label: '大阪メトロ御堂筋線直通',
      color: '#e5171f',
      path: [
        [esaka.x, esaka.y],
        [esaka.x - 120, esaka.y],
        [esaka.x - 120, esaka.y + 380],
      ],
      labelPos: { x: esaka.x - 120 + 36, y: esaka.y + 380 + 10 },
    });
  }

  for (const t of externalThroughLines) {
    for (let i = 1; i < t.path.length; i++) {
      allSegments.push([t.path[i - 1], t.path[i]]);
    }
    occupied.push({
      x: t.labelPos.x - 10,
      y: t.labelPos.y - 34,
      w: t.label.length * 42 + 24,
      h: 68,
    });
  }

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
      if (b.x < 40 || b.y < Y_OFFSET + 40 || b.x + b.w > sheet.width - 40 || b.y + b.h > 24650) {
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
    externalThroughLines,
    sheet,
    totalStops: routes.reduce((sum, r) => sum + r.stops.length, 0),
    labelOverlaps: stations.reduce((n, s) => n + s.label.collisions, 0),
    labelMarkerHits: stations.reduce((n, s) => n + s.label.markerHits, 0),
    labelLineHits: stations.reduce((n, s) => n + s.label.lineHits, 0),
  };
}
