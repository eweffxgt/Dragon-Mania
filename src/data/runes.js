/* =========================================================
 * 魔符
 *
 * 15 种，每种 5 个稀有度（普通 / 优秀 / 稀有 / 史诗 / 传奇）。
 * 数值来自「魔符对照表.txt」，五种稀有度对应一行里的五个数字。
 * 贴图来自「魔符」文件夹里的五张集合图（3 列 × 6 行，前 15 格有效）。
 * ========================================================= */
const RUNE = (function () {
  var RARITY = ['普通', '优秀', '稀有', '史诗', '传奇'];

  /* 稀有度配色（描边 / 文字） */
  var COLOR = ['#c9c9c9', '#6fd46f', '#5aa8ff', '#ffbf29', '#c07bff'];

  /* 战斗掉落权重：50% 普通 / 40% 优秀 / 10% 稀有 */
  var DROP_WEIGHT = [50, 40, 10, 0, 0];

  /* 五个低级合成一个高一级 */
  var COMBINE_NEED = 5;

  /* id / 名字 / 数值（普通→传奇）/ 说明模板（{x} 会替换成数值） */
  var DEFS = [
    { id: 'miracle', name: '奇迹', v: [42, 90, 216, 385, 720],
      desc: '自身施放的所有正面效果强度提高 {x}%。' },
    { id: 'mirror', name: '魔镜', v: [36, 44, 55, 62, 84],
      desc: '{x}% 概率把施加在自身身上的负面效果复制给施放者。' },
    { id: 'turtle', name: '神龟', v: [21, 38, 49, 60, 75],
      desc: '自身受到的群体伤害降低 {x}%。' },
    { id: 'berserk', name: '狂战', v: [84, 250, 556, 1010, 1705],
      desc: '生命越低，直接伤害越高，最多提高 {x}%。' },
    { id: 'absorb', name: '汲取', v: [10, 15, 24, 37, 59],
      desc: '每当另一条龙阵亡，回复自身 {x}% 生命上限。' },
    { id: 'accept', name: '接纳', v: [62, 206, 420, 772, 1517],
      desc: '自身受到的正面效果强度提高 {x}%。' },
    { id: 'witch', name: '巫术', v: [32, 90, 216, 420, 720],
      desc: '自身施放的所有负面效果强度提高 {x}%。' },
    { id: 'brave', name: '蛮勇', v: [79, 194, 394, 790, 1471],
      desc: '开场献祭 15% 生命，直接伤害提高 {x}%（生命高于 15% 时生效）。' },
    { id: 'cruel', name: '残酷', v: [53, 163, 315, 607, 1021],
      desc: '50% 概率暴击，并额外造成 {x}% 直接伤害。' },
    { id: 'dodge', name: '闪避', v: [26, 35, 47, 57, 78],
      desc: '{x}% 概率闪避 90% 的直接伤害。' },
    { id: 'conquer', name: '征服', v: [31, 34, 40, 47, 57],
      desc: '{x}% 概率封印主目标的魔符 1 回合。' },
    { id: 'disdain', name: '蔑视', v: [18, 26, 48, 61, 80],
      desc: '自身受到的负面效果强度降低 {x}%。' },
    { id: 'havoc', name: '浩劫', v: [28, 110, 204, 395, 736],
      desc: '自身施放的群体伤害提高 {x}%。' },
    { id: 'pure', name: '纯净', v: [88, 257, 494, 966, 1895],
      desc: '生命越高，伤害越高，最多提高 {x}%。' },
    { id: 'rebirth', name: '重生', v: [21, 30, 41, 48, 59],
      desc: '阵亡时以 {x}% 生命复活一次。' }
  ];

  var BY_ID = {};
  DEFS.forEach(function (d, i) { d.index = i; BY_ID[d.id] = d; });

  /* 贴图：assets/runes/{rarity}_{index}.png */
  function sprite(rarity, index) {
    return 'assets/runes/' + rarity + '_' + index + '.png';
  }

  function value(index, rarity) {
    var d = DEFS[index];
    if (!d) return 0;
    var r = Math.max(0, Math.min(4, Math.floor(rarity)));
    return d.v[r];
  }

  function name(index) {
    var d = DEFS[index];
    return d ? d.name : '???';
  }

  function desc(index, rarity) {
    var d = DEFS[index];
    if (!d) return '';
    return d.desc.replace('{x}', value(index, rarity));
  }

  /* 战斗掉落：返回 { t, r } */
  function rollDrop() {
    var total = 0;
    DROP_WEIGHT.forEach(function (w) { total += w; });
    var x = Math.random() * total;
    var r = 0;
    for (var i = 0; i < DROP_WEIGHT.length; i++) {
      x -= DROP_WEIGHT[i];
      if (x <= 0) { r = i; break; }
    }
    var t = Math.floor(Math.random() * DEFS.length);
    return { t: t, r: r };
  }

  return {
    RARITY: RARITY,
    COLOR: COLOR,
    DEFS: DEFS,
    BY_ID: BY_ID,
    COMBINE_NEED: COMBINE_NEED,
    DROP_WEIGHT: DROP_WEIGHT,
    sprite: sprite,
    value: value,
    name: name,
    desc: desc,
    rollDrop: rollDrop,
    MAX_EQUIP: 2
  };
})();
