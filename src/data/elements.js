/* =========================================================
 * 元素表
 *
 * 当前上场 13 个元素：
 *   神圣 / 古代 / 霸主 / 草(植物) / 火(火焰) / 水(流水) / 电(闪电)
 *   暗(黑暗) / 光(光明) / 虚空 / 微风 / 钢铁 / 大地
 *
 * 克制关系见文件下方的 ELEMENT_STRONG / ELEMENT_WEAK（来自「元素克制表.txt」）：
 *   技能元素 打 目标主元素：
 *     目标是该技能的「有力元素」 → ×1.5
 *     目标是该技能的「无力元素」 → ×0.5
 *     其它                      → ×1
 * ========================================================= */
const ELEMENTS = {
  holy: {
    id: 'holy', name: '神圣',
    color: '#ffe066', light: '#fffbe0', dark: '#7a5f10',
    desc: '治疗、护盾与审判之光',
    icon: [
      '..######..',
      '.#..##..#.',
      '#...##...#',
      '#...##...#',
      '#.######.#',
      '#...##...#',
      '#...##...#',
      '.#..##..#.',
      '..######..',
      '..........',
    ],
  },
  ancient: {
    id: 'ancient', name: '古代',
    color: '#c9a06a', light: '#f0d9b5', dark: '#5e4326',
    desc: '坚不可摧的远古造物',
    icon: [
      '....##....',
      '...####...',
      '..##..##..',
      '..##..##..',
      '.########.',
      '.##.##.##.',
      '##########',
      '#........#',
      '##########',
      '..........',
    ],
  },
  overlord: {
    id: 'overlord', name: '霸主',
    color: '#e2453a', light: '#ff9a8f', dark: '#671410',
    desc: '以威压统御战场',
    icon: [
      '#........#',
      '##..##..##',
      '###.##.###',
      '##########',
      '##########',
      '#.#.##.#.#',
      '##########',
      '#........#',
      '##########',
      '..........',
    ],
  },
  grass: {
    id: 'grass', name: '草',
    color: '#6ddc6a', light: '#c8ffc2', dark: '#1f5a1e',
    desc: '生生不息，毒与治愈',
    icon: [
      '......###.',
      '....#####.',
      '...######.',
      '..#######.',
      '.#######..',
      '.######...',
      '..####....',
      '.####.....',
      '###.......',
      '..........',
    ],
  },
  fire: {
    id: 'fire', name: '火',
    color: '#ff8a3d', light: '#ffd0a8', dark: '#6b2a08',
    desc: '灼烧一切的高温',
    icon: [
      '....##....',
      '...####...',
      '..#.##.#..',
      '.###..###.',
      '.########.',
      '##.####.##',
      '.########.',
      '.########.',
      '..######..',
      '...####...',
    ],
  },
  water: {
    id: 'water', name: '水',
    color: '#4fb8ff', light: '#c5ecff', dark: '#0d3f66',
    desc: '治愈之流与刺骨寒意',
    icon: [
      '....##....',
      '...####...',
      '...####...',
      '..######..',
      '##########',
      '##########',
      '##########',
      '.########.',
      '..######..',
      '..........',
    ],
  },
  electric: {
    id: 'electric', name: '电',
    color: '#ffe93b', light: '#fffdc0', dark: '#6b5c00',
    desc: '连锁的雷霆与麻痹',
    icon: [
      '.....###..',
      '....###...',
      '...###....',
      '..###.....',
      '.#######..',
      '...####...',
      '..###.....',
      '.###......',
      '##........',
      '..........',
    ],
  },
  dark: {
    id: 'dark', name: '暗',
    color: '#a76bff', light: '#dcc4ff', dark: '#3d1a6b',
    desc: '侵蚀、汲取与夜幕',
    icon: [
      '...####...',
      '..####....',
      '.####.....',
      '.###......',
      '.###......',
      '.###......',
      '.####.....',
      '..####....',
      '...####...',
      '..........',
    ],
  },
  light: {
    id: 'light', name: '光',
    color: '#9ff4ff', light: '#f0ffff', dark: '#1c5f70',
    desc: '贯穿战场的纯白光束',
    icon: [
      '....##....',
      '#...##...#',
      '##..##..##',
      '..######..',
      '##########',
      '..######..',
      '##..##..##',
      '#...##...#',
      '....##....',
      '..........',
    ],
  },
  void: {
    id: 'void', name: '虚空',
    color: '#8b7bff', light: '#d8d2ff', dark: '#241a52',
    desc: '吞噬规则的空洞',
    icon: [
      '..######..',
      '.##....##.',
      '##......##',
      '#..####..#',
      '#..#..#..#',
      '#..####..#',
      '##......##',
      '.##....##.',
      '..######..',
      '..........',
    ],
  },
  earth: {
    id: 'earth', name: '大地',
    color: '#b4855a', light: '#e8cfa8', dark: '#4a2f16',
    desc: '厚重的大地与岩层',
    icon: [
      '....##....',
      '...####...',
      '..##..##..',
      '..##..##..',
      '.########.',
      '.##.##.##.',
      '##########',
      '#........#',
      '##########',
      '..........',
    ],
  },
  breeze: {
    id: 'breeze', name: '微风',
    color: '#8fe3d0', light: '#e2fffa', dark: '#2c6b62',
    desc: '迅捷的顺风与护佑',
    icon: [
      '..........',
      '..######..',
      '.##....##.',
      '##..##..##',
      '##..###.##',
      '##...##..#',
      '.##....##.',
      '..######..',
      '..........',
      '..........',
    ],
  },
  steel: {
    id: 'steel', name: '钢铁',
    color: '#b8c4d4', light: '#f0f4ff', dark: '#4a5468',
    desc: '无坚不摧的钢铁之躯',
    icon: [
      '##########',
      '##########',
      '##.####.##',
      '##.####.##',
      '##########',
      '.########.',
      '.########.',
      '..######..',
      '...####...',
      '....##....',
    ],
  },
};

/* =========================================================
 * 元素图标（从「元素图标汇总.png」切出来的单图）
 * ========================================================= */
const ELEMENT_ICON_IMAGES = {
  holy: 'assets/icons/holy.png',
  ancient: 'assets/icons/ancient.png',
  overlord: 'assets/icons/overlord.png',
  grass: 'assets/icons/grass.png',
  fire: 'assets/icons/fire.png',
  water: 'assets/icons/water.png',
  electric: 'assets/icons/electric.png',
  dark: 'assets/icons/dark.png',
  light: 'assets/icons/light.png',
  void: 'assets/icons/void.png',
  breeze: 'assets/icons/breeze.png',
  steel: 'assets/icons/steel.png',
  earth: 'assets/icons/earth.png',
};

/* =========================================================
 * 技能卡面贴图（assets/cards/*.png）
 * ========================================================= */
const ELEMENT_CARD_IMAGES = {
  holy: 'assets/cards/holy.png',
  ancient: 'assets/cards/ancient.png',
  overlord: 'assets/cards/overlord.png',
  grass: 'assets/cards/grass.png',
  fire: 'assets/cards/fire.png',
  water: 'assets/cards/water.png',
  electric: 'assets/cards/electric.png',
  dark: 'assets/cards/dark.png',
  light: 'assets/cards/light.png',
  void: 'assets/cards/void.png',
  breeze: 'assets/cards/breeze.png',
  steel: 'assets/cards/steel.png',
  earth: 'assets/cards/earth.png',
};

Object.keys(ELEMENT_ICON_IMAGES).forEach((el) => {
  if (ELEMENTS[el]) ELEMENTS[el].iconUrl = ELEMENT_ICON_IMAGES[el];
});
Object.keys(ELEMENT_CARD_IMAGES).forEach((el) => {
  if (ELEMENTS[el]) ELEMENTS[el].cardImage = ELEMENT_CARD_IMAGES[el];
});

/* 元素固定顺序（用于图鉴 / 调试） */
const ELEMENT_ORDER = [
  'holy', 'ancient', 'overlord', 'grass', 'fire', 'water',
  'electric', 'dark', 'light', 'void', 'breeze', 'steel', 'earth',
];

/* =========================================================
 * 元素克制（严格按「元素克制表.txt」）
 *
 * 火焰：有力：微风            无力：火，闪电，古代
 * 微风：有力：大地            无力：微风，虚空
 * 大地：有力：流水            无力：大地，钢铁
 * 流水：有力：火焰            无力：流水，植物
 * 植物：有力：虚空            无力：植物，光明
 * 钢铁：有力：植物            无力：钢铁，黑暗，古代
 * 闪电：有力：钢铁            无力：闪电，黑暗
 * 虚空：有力：闪电            无力：虚空，微风
 * 光明：有力：微风，大地，闪电  无力：光明
 * 黑暗：有力：火焰，流水，植物  无力：黑暗
 * 古代：有力：微风，植物，光明，黑暗  无力：霸主
 * 神圣：有力：火焰，大地，光明，黑暗  无力：霸主
 * 霸主：有力：—              无力：—
 * ========================================================= */
const ELEMENT_STRONG = {
  fire: ['breeze'],
  breeze: ['earth'],
  earth: ['water'],
  water: ['fire'],
  grass: ['void'],
  steel: ['grass'],
  electric: ['steel'],
  void: ['electric'],
  light: ['breeze', 'earth', 'electric'],
  dark: ['fire', 'water', 'grass'],
  ancient: ['breeze', 'grass', 'light', 'dark'],
  holy: ['fire', 'earth', 'light', 'dark'],
  overlord: [],
};

const ELEMENT_WEAK = {
  fire: ['fire', 'electric', 'ancient'],
  breeze: ['breeze', 'void'],
  earth: ['earth', 'steel'],
  water: ['water', 'grass'],
  grass: ['grass', 'light'],
  steel: ['steel', 'dark', 'ancient'],
  electric: ['electric', 'dark'],
  void: ['void', 'breeze'],
  light: ['light'],
  dark: ['dark'],
  ancient: ['overlord'],
  holy: ['overlord'],
  overlord: [],
};

function inList(list, v) {
  for (var i = 0; i < list.length; i++) if (list[i] === v) return true;
  return false;
}

/** 技能元素 打 目标主元素：1.5 / 1 / 0.5 */
function elementMatchup(atkElement, defElement) {
  if (!atkElement || !defElement) return 1;
  if (inList(ELEMENT_STRONG[atkElement] || [], defElement)) return 1.5;
  if (inList(ELEMENT_WEAK[atkElement] || [], defElement)) return 0.5;
  return 1;
}

function matchupLabel(m) {
  return m > 1 ? '克制' : m < 1 ? '被克' : '均势';
}

/** 给 tooltip 用 */
function elementBeats(el) {
  return (ELEMENT_STRONG[el] || []).slice();
}
function elementBeatenBy(el) {
  return (ELEMENT_WEAK[el] || []).slice();
}
function elementNames(list) {
  return list.map(function (e) { return ELEMENTS[e] ? ELEMENTS[e].name : e; }).join(' ');
}

/** 大数字缩写：20566463673 → 205.7亿 */
function fmtNum(n) {
  n = Math.round(n);
  var neg = n < 0;
  if (neg) n = -n;
  var out;
  if (n >= 100000000) out = (n / 100000000).toFixed(1) + '亿';
  else if (n >= 10000) out = (n / 10000).toFixed(1) + '万';
  else out = String(n);
  return neg ? '-' + out : out;
}
