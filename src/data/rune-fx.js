/* =========================================================
 * 魔符在战斗中的效果
 *
 * 每个角色最多装备 2 个魔符，建卡时把效果折算成 runeFx 挂在角色身上，
 * 战斗里按需读取，避免每次结算都遍历魔符列表。
 * ========================================================= */
const RuneFx = (function () {
  /* 由装备列表生成效果表；没有魔符返回 {} */
  function build(recs) {
    var fx = {};
    (recs || []).forEach(function (rec) {
      if (!rec || typeof rec.t !== 'number') return;
      var def = RUNE.DEFS[rec.t];
      if (!def) return;
      var v = RUNE.value(rec.t, rec.r);
      if (fx[def.id] == null || v > fx[def.id]) fx[def.id] = v;
    });
    return fx;
  }

  /* 被「征服」封印时所有魔符失效 */
  function of(char) {
    if (!char || !char.runeFx) return {};
    if (char.runeMute) return {};
    if ((char.statuses || []).some(function (s) { return s.id === 'runeMute'; })) return {};
    return char.runeFx;
  }

  function val(char, id) {
    var fx = of(char);
    return fx[id] || 0;
  }

  /* ---------- 数值调整 ---------- */

  /* 直接伤害的额外倍率（狂战 / 纯净 / 蛮勇 / 残酷） */
  function directBonus(char) {
    var ratio = char.maxHp > 0 ? char.hp / char.maxHp : 1;
    var add = 0;
    var berserk = val(char, 'berserk');
    if (berserk) add += berserk * (1 - ratio) / 100;
    var pure = val(char, 'pure');
    if (pure) add += pure * ratio / 100;
    var brave = val(char, 'brave');
    if (brave && ratio > 0.15) add += brave / 100;
    return add;
  }

  /* 群体（间接）伤害倍率：浩劫提升、神龟减免 */
  function aoeOut(char) { return val(char, 'havoc') / 100; }
  function aoeIn(char) { return val(char, 'turtle') / 100; }

  /* 正面 / 负面效果的强度系数 */
  function positiveOut(char) { return 1 + val(char, 'miracle') / 100; }
  function positiveIn(char) { return 1 + val(char, 'accept') / 100; }
  function negativeOut(char) { return 1 + val(char, 'witch') / 100; }
  function negativeIn(char) { return Math.max(0, 1 - val(char, 'disdain') / 100); }

  return {
    build: build,
    of: of,
    val: val,
    directBonus: directBonus,
    aoeOut: aoeOut,
    aoeIn: aoeIn,
    positiveOut: positiveOut,
    positiveIn: positiveIn,
    negativeOut: negativeOut,
    negativeIn: negativeIn
  };
})();
