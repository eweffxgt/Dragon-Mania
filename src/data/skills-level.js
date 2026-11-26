/* =========================================================
 * 技能等级系统
 *
 *   0     普通攻击，没有任何额外效果
 *   1-5   非精通（每个元素一个四字名，数值逐级上升）
 *   6     精通，效果见「技能对照表-精通」
 *
 * 依赖 skills.js 里的 SKILL_BY_ELEMENT / side2kind，
 * 以及 elements.js 里的 ELEMENTS。
 * ========================================================= */
const SKILL_MAX_LEVEL = 6;

/* 0->1, 1->2 ... 5->6 的金币价格 */
const SKILL_COST = [30000, 80000, 180000, 350000, 600000, 1500000];

function pctText(v) {
  var n = Math.round(v * 1000) / 10;
  return (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)) + '%';
}

/* 非精通技能：每个元素一组数值，v[i] 对应 1..5 级 */
const SKILL_NOVICE = {
  fire: {
    name: '烈焰冲击', side: 'enemy',
    v: [0.35, 0.45, 0.55, 0.65, 0.75],
    ops: function (n) { return [{ op: 'damage', k: n, to: 'otherEnemies' }]; },
    desc: function (n) {
      return '对主目标造成 100% 攻击伤害，并对其余敌人造成 ' + pctText(n) + ' 攻击伤害。';
    },
  },
  breeze: {
    name: '疾风扰袭', side: 'enemy',
    v: [0.40, 0.50, 0.60, 0.70, 0.80],
    ops: function (n) {
      return [{ op: 'status', id: 'weaken', value: Math.round(n * 100), turns: 2, to: 'target' }];
    },
    desc: function (n) {
      return '使目标造成的伤害降低 ' + pctText(n) + '，持续 2 回合。';
    },
  },
  earth: {
    name: '磐石护体', side: 'ally',
    v: [[0.95, 0.50], [1.00, 0.50], [1.05, 0.60], [1.10, 0.60], [1.15, 0.70]],
    ops: function (n) {
      return [
        { op: 'status', id: 'guard', k: n[0], indirect: 0.30, turns: 2, to: 'target' },
        { op: 'status', id: 'guard', k: n[1], indirect: 0.30, turns: 2, to: 'otherAllies' },
      ];
    },
    desc: function (n) {
      return '为友方目标附加护罩：抵挡 ' + pctText(n[0]) + ' 直接伤害与 30% 间接伤害；' +
        '其余友军抵挡 ' + pctText(n[1]) + ' 直接伤害，持续 2 回合。';
    },
  },
  water: {
    name: '流水润泽', side: 'ally',
    v: [[1.00, 0.40], [1.10, 0.40], [1.20, 0.45], [1.30, 0.45], [1.40, 0.50]],
    ops: function (n) {
      return [
        { op: 'heal', k: n[0], to: 'target' },
        { op: 'heal', k: n[1], to: 'otherAllies' },
      ];
    },
    desc: function (n) {
      return '为友方目标恢复 ' + pctText(n[0]) + ' 攻击力的生命，其余友军恢复 ' +
        pctText(n[1]) + ' 攻击力的生命。';
    },
  },
  grass: {
    name: '藤蔓缠绕', side: 'enemy',
    v: [0.30, 0.40, 0.50, 0.60, 0.70],
    ops: function (n) {
      return [{ op: 'status', id: 'poison', value: n, turns: 2, to: 'target' }];
    },
    desc: function (n) {
      return '让目标中毒，2 回合内共承受 ' + pctText(n) + ' 攻击力的伤害。';
    },
  },
  steel: {
    name: '钢铁反震', side: 'ally',
    v: [[0.75, 0.25], [0.85, 0.30], [0.95, 0.35], [1.05, 0.40], [1.15, 0.45]],
    ops: function (n) {
      return [
        { op: 'status', id: 'retaliate', k: n[0], indirect: 0.30, turns: 2, to: 'target' },
        { op: 'status', id: 'retaliate', k: n[1], indirect: 0.30, turns: 2, to: 'otherAllies' },
      ];
    },
    desc: function (n) {
      return '为友方目标附加反伤光环：受到直接攻击时反弹 ' + pctText(n[0]) + ' 攻击伤害，' +
        '其余友军反弹 ' + pctText(n[1]) + '，两者对间接伤害反弹 30%，持续 2 回合。';
    },
  },
  electric: {
    name: '电弧连锁', side: 'enemy',
    v: [[0.40, 0.20, 0.30], [0.50, 0.25, 0.40], [0.60, 0.30, 0.50],
        [0.70, 0.35, 0.60], [0.80, 0.40, 0.70]],
    ops: function (n) {
      return [
        { op: 'damage', k: n[0], to: 'randomOther' },
        { op: 'chance', p: n[1], ops: [{ op: 'damage', k: n[2], to: 'randomOther' }] },
      ];
    },
    desc: function (n) {
      return '额外对另一名敌人造成 ' + pctText(n[0]) + ' 攻击伤害，并有 ' + pctText(n[1]) +
        ' 概率再对第三名敌人造成 ' + pctText(n[2]) + ' 攻击伤害。';
    },
  },
  void: {
    name: '虚空吞噬', side: 'enemy',
    v: [0.35, 0.45, 0.55, 0.65, 0.75],
    ops: function (n) { return [{ op: 'damage', k: 0, to: 'target', drain: n }]; },
    desc: function (n) {
      return '吸取目标生命，为自己恢复相当于 ' + pctText(n) + ' 攻击力的生命。';
    },
  },
  light: {
    name: '光耀冲击', side: 'enemy',
    v: [0.35, 0.45, 0.55, 0.65, 0.75],
    ops: function (n) { return [{ op: 'damage', k: n, to: 'otherEnemies' }]; },
    desc: function (n) {
      return '对主目标造成 100% 攻击伤害，并对其余敌人造成 ' + pctText(n) + ' 攻击伤害。';
    },
  },
  dark: {
    name: '暗影侵蚀', side: 'enemy',
    v: [0.30, 0.40, 0.50, 0.60, 0.70],
    ops: function (n) {
      return [{ op: 'status', id: 'burn', value: n, turns: 2, to: 'target' }];
    },
    desc: function (n) {
      return '灼蚀目标，2 回合内共承受 ' + pctText(n) + ' 攻击力的伤害。';
    },
  },
  holy: {
    name: '神圣佑护', side: 'ally',
    v: [[0.20, 0.35], [0.30, 0.40], [0.40, 0.45], [0.50, 0.50], [0.55, 0.60]],
    ops: function (n) {
      return [
        { op: 'status', id: 'atk_up', value: Math.round(n[0] * 100), turns: 2, to: 'target' },
        { op: 'status', id: 'maxhp_up', value: Math.round(n[1] * 100), turns: 2, to: 'target' },
      ];
    },
    desc: function (n) {
      return '使一名友军造成的伤害提升 ' + pctText(n[0]) + '，生命上限提升 ' +
        pctText(n[1]) + '，持续 2 回合。';
    },
  },
  ancient: {
    name: '远古咒缚', side: 'enemy',
    v: [0.05, 0.15, 0.25, 0.35, 0.45],
    ops: function (n) {
      var v = Math.round(n * 100);
      return [
        { op: 'status', id: 'weaken', value: v, turns: 2, to: 'target' },
        { op: 'status', id: 'atk_up', value: v, turns: 2, to: 'caster' },
      ];
    },
    desc: function (n) {
      return '使目标造成的伤害降低 ' + pctText(n) + '，自身造成的伤害提升 ' +
        pctText(n) + '，持续 2 回合。';
    },
  },
  overlord: {
    name: '霸主威慑', side: 'ally',
    v: [0.40, 0.45, 0.50, 0.60, 0.70],
    ops: function (n) {
      return [
        { op: 'status', id: 'shield', k: n, turns: 2, to: 'target' },
        { op: 'status', id: 'taunt', turns: 2, to: 'target' },
      ];
    },
    desc: function (n) {
      return '为友方目标附加 ' + pctText(n) + ' 攻击力的护盾，并嘲讽敌人只能攻击它，持续 2 回合。';
    },
  },
};

/* 从 ops 推断「有没有伤害 / 最大伤害系数 / 卡片分类」 */
function analyzeSkill(side, ops) {
  var hasDamage = side === 'enemy';
  var dmgK = side === 'enemy' ? 1.0 : 0;
  (function walk(list) {
    (list || []).forEach(function (o) {
      if (o.op === 'damage') {
        hasDamage = true;
        if ((o.k || 0) > dmgK) dmgK = o.k || 0;
      }
      if (o.ops) walk(o.ops);
    });
  })(ops);
  return { hasDamage: hasDamage, dmgK: dmgK, kind: side2kind(side, hasDamage) };
}

const SKILL_CACHE = {};

/* 取某元素在指定等级（0~6）的技能卡 */
function skillAt(element, level) {
  var lv = Math.floor(Number(level) || 0);
  if (lv < 0) lv = 0;
  if (lv > SKILL_MAX_LEVEL) lv = SKILL_MAX_LEVEL;
  var key = element + ':' + lv;
  if (SKILL_CACHE[key]) return SKILL_CACHE[key];

  var meta = (typeof ELEMENTS !== 'undefined' && ELEMENTS[element]) || {};
  var card;

  if (lv <= 0) {
    card = {
      id: element, element: element, level: 0, name: '普通攻击', side: 'enemy',
      desc: '普通攻击，没有额外效果。',
      ops: [], preOps: [], hasDamage: true, dmgK: 1, kind: 'attack',
      iconUrl: meta.iconUrl || '', cardImage: meta.cardImage || '',
    };
  } else if (lv >= SKILL_MAX_LEVEL) {
    var m = SKILL_BY_ELEMENT[element];
    card = {
      id: element, element: element, level: SKILL_MAX_LEVEL,
      name: m.name, side: m.side, desc: m.desc,
      ops: m.ops, preOps: m.preOps || [],
      hasDamage: m.hasDamage, dmgK: m.dmgK, kind: m.kind,
      iconUrl: m.iconUrl, cardImage: m.cardImage, mastered: true,
    };
  } else {
    var def = SKILL_NOVICE[element];
    var n = def.v[lv - 1];
    var ops = def.ops(n);
    var an = analyzeSkill(def.side, ops);
    card = {
      id: element, element: element, level: lv, name: def.name, side: def.side,
      desc: def.desc(n), ops: ops, preOps: [], mastered: false,
      hasDamage: an.hasDamage, dmgK: an.dmgK, kind: an.kind,
      iconUrl: meta.iconUrl || '', cardImage: meta.cardImage || '',
    };
  }
  SKILL_CACHE[key] = card;
  return card;
}

/* 按 { element: level } 生成三张技能卡；levels 缺省时用 fallbackLevel */
function skillsOfLevels(elements, levels, fallbackLevel) {
  return elements.map(function (el) {
    var lv = (levels && levels[el] != null) ? levels[el] : (fallbackLevel || 0);
    return skillAt(el, lv);
  });
}

/* 升一级要花多少金币（满级返回 0） */
function skillCostOf(level) {
  var lv = Math.floor(Number(level) || 0);
  if (lv >= SKILL_MAX_LEVEL) return 0;
  return SKILL_COST[lv];
}

/* 技能展示名：0 级统一显示「普通攻击」 */
function skillDisplayName(element, level) {
  var card = skillAt(element, level);
  return card.name;
}
