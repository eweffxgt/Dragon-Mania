/* =========================================================
 * 成长曲线
 *
 * 由「等级数值表」拟合得出：数值严格按 1.2 的等比增长
 *   数值(L) = 数值(100) × 1.2^(L-100)
 *
 * 表里两列同时命中同一条曲线（拟合误差 < 0.001%）。
 * 因为表给的是 100 级数据，这里直接以 100 级为锚点，
 * 这样 100 级能 1:1 复现表里的数字，不用反推基础值。
 *
 * 攻血比恒定在 3.1 左右，所以同级对局的击杀手数在任何等级都一样。
 * 注意：双精度整数上限 2^53 ≈ 9.0e15，本曲线到 Lv172 左右会溢出。
 * ========================================================= */
const CURVE = {
  k: 1.2,
  refLevel: 100,
  maxLevel: 200
};

function curveValue(v100, level) {
  var lv = Math.max(1, Math.min(CURVE.maxLevel, Math.floor(level || 1)));
  return Math.round(v100 * Math.pow(CURVE.k, lv - CURVE.refLevel));
}

/* hp100 / atk100 传角色 100 级的血量与攻击 */
function curveStats(level, hp100, atk100) {
  return {
    hp: curveValue(hp100, level),
    atk: curveValue(atk100, level)
  };
}

/* 从 1 级基础值算（等价写法，留作参考） */
function curveStat(base1, level) {
  return Math.round(base1 * Math.pow(CURVE.k, Math.max(1, level) - 1));
}
