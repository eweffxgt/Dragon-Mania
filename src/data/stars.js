/* =========================================================
 * 升星数据
 *
 * 星级 0~16 共 17 种状态，展示成 4 个星位：
 *   1-4 星    全黄星
 *   5-8 星    逐颗把黄星换成粉星
 *   9-12 星   逐颗把粉星换成暗红星
 *   13-16 星  逐颗把暗红星换成彩星
 *
 * 升星消耗「角色第一个元素对应的水晶」。
 * ========================================================= */
const STAR = (function () {
  var MAX = 16;

  /* 从 N 星升到 N+1 星消耗的水晶数（16 段） */
  var COST = [1, 3, 5, 6, 7, 10, 11, 20, 22, 24, 26, 30, 33, 36, 39, 44];

  /* 星级对攻击 / 生命上限的倍率（1 星..16 星） */
  var MULT = [
    1.44, 2.07, 2.99, 4.3, 6.19, 8.92, 12.84, 18.49,
    26.62, 38.34, 55.21, 79.5, 114.48, 164.84, 237.38, 341.82
  ];

  /* 商城：10 万金币 / 水晶，三档 */
  var PRICE = 100000;
  var PACKS = [1, 10, 100];

  /* 星位贴图：1 黄 / 2 粉 / 3 暗红 / 4 彩 */
  var SPRITE = [
    'assets/stars/star1.png',
    'assets/stars/star2.png',
    'assets/stars/star3.png',
    'assets/stars/star4.png'
  ];

  /* 4 个星位分别显示哪一种（0 = 空） */
  function slots(level) {
    var out = [0, 0, 0, 0];
    if (!level || level <= 0) return out;
    var tier = Math.floor((level - 1) / 4);   /* 0..3 */
    var idx = (level - 1) % 4;                /* 0..3 */
    var cur = Math.min(4, tier + 1);
    var prev = tier;
    for (var i = 0; i < 4; i++) out[i] = i >= (3 - idx) ? cur : prev;
    return out;
  }

  /* 当前星级还给到下一级需要的碎片？不，返回升下一级要的水晶数；满星返回 0 */
  function costOf(level) {
    if (level >= MAX) return 0;
    return COST[level];
  }

  /* 星级倍率（0 星 = 1 倍） */
  function mult(level) {
    if (!level || level <= 0) return 1;
    return MULT[Math.min(level, MAX) - 1];
  }

  function packPrice(n) {
    return n * PRICE;
  }

  return {
    MAX: MAX,
    COST: COST,
    MULT: MULT,
    PRICE: PRICE,
    PACKS: PACKS,
    SPRITE: SPRITE,
    slots: slots,
    costOf: costOf,
    mult: mult,
    packPrice: packPrice
  };
})();

/* 便捷函数：给战斗 / 面板取星级倍率 */
function starMult(level) {
  return (typeof STAR !== 'undefined') ? STAR.mult(level) : 1;
}
