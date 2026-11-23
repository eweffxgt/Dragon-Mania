/* =========================================================
 * 成长曲线
 *
 * 由「角色等级数值表」拟合得出：数值严格按 1.2 的等比增长
 *   数值(L) = 基础值 × 1.2^(L-1)
 * 拟合误差在 0.001% 以内（L10 那一行有取整噪声）。
 *
 * 表里两列同时命中同一条曲线：
 *   血量 1 级 255 → 100 级 17,598,819,586
 *   攻击 1 级  82 → 100 级  5,659,228,259
 * 攻血比恒为 3.1098，所以同级对局的击杀手数在任何等级都一样。
 *
 * 注意：双精度整数上限 2^53 ≈ 9.0e15，本曲线到 Lv172 左右会溢出。
 * ========================================================= */
const CURVE = {
  hp1: 255,
  atk1: 82,
  k: 1.2,
  maxLevel: 170          /* 超过这个等级双精度会失真，先挡一下 */
};

function curveStat(base, level) {
  var lv = Math.max(1, Math.min(CURVE.maxLevel, Math.floor(level || 1)));
  return Math.round(base * Math.pow(CURVE.k, lv - 1));
}

function curveStats(level) {
  return {
    hp: curveStat(CURVE.hp1, level),
    atk: curveStat(CURVE.atk1, level)
  };
}
