/* =========================================================
 * 技能表（严格按「技能对照表.txt」最新版）
 *
 * 每个元素 1 个技能；角色 3 个元素 → 3 张技能卡。
 * 表里每个技能都写了两段：基础效果 + 「trained mastery effect」（精通效果），
 * 这里把两段都实现为默认生效（没有额外的解锁系统）。
 *
 * 伤害只跟施法者的攻击力（DAS）有关，技能只决定倍率和附加效果。
 *
 * 字段
 *   name   技能名
 *   side   'enemy' | 'ally'  主目标所在阵营
 *   desc   效果说明（卡牌 tooltip / 战斗播报）
 *   ops    效果序列，按顺序执行：
 *     { op:'damage', k, to, once }        k × 施法者攻击 的伤害
 *     { op:'heal', k, to, capByTarget }   k × 施法者攻击 的治疗
 *     { op:'status', id, k|value, turns, to }
 *     { op:'dispel', kind:'buff'|'debuff', to }
 *     { op:'steal', maxTurns }            把目标的正面状态转给施法者
 *     { op:'chance', p, ops }             概率触发
 *     { op:'onKill', ifStatus?, ops }     主目标被这一下打死时触发
 *
 *   to: 'target'(默认) | 'otherEnemies' | 'enemies' | 'allies' | 'otherAllies'
 *       | 'caster' | 'randomOther'
 * ========================================================= */
const SKILL_DEFS = {

  /* 火：灼烧之炭 —— 150% 分摊伤害 + 击杀连锁 */
  fire: {
    name: '灼烧之炭', side: 'enemy',
    desc: '先对主目标造成 100% 攻击伤害；其余敌人各受 85%，若主目标被击败，其余敌人再受一次 85%。',
    ops: [
      { op: 'damage', k: 0.85, to: 'otherEnemies' },
      { op: 'onKill', ops: [{ op: 'damage', k: 0.85, to: 'otherEnemies' }] },
    ],
  },

  /* 微风：暴风灾难 —— 单体强虚弱 + 群体虚弱 */
  breeze: {
    name: '暴风灾难', side: 'enemy',
    desc: '先造成 100% 攻击伤害；目标造成伤害 -90%（2 回合），其余敌人 -40%（2 回合）。',
    ops: [
      { op: 'status', id: 'weaken', value: 90, turns: 2, to: 'target' },
      { op: 'status', id: 'weaken', value: 40, turns: 2, to: 'otherEnemies' },
    ],
  },

  /* 大地：不破之石 —— 减伤（不消耗），持续 6 回合（4 + 精通 2）
   * 目标：直接伤害每次最多吸收 120% 攻击，间接（中毒/灼烧）40%
   * 其余：直接 70%，间接 20% */
  earth: {
    name: '不破之石', side: 'ally',
    desc: '为目标附加「石之守护」6 回合：每次直接伤害最多吸收 120% 攻击（超出部分才进血），间接伤害最多吸收 40%；其余友军为 70% / 20%。护盾不会被消耗。',
    ops: [
      { op: 'status', id: 'guard', k: 1.2, ik: 0.4, turns: 6, to: 'target' },
      { op: 'status', id: 'guard', k: 0.7, ik: 0.2, turns: 6, to: 'otherAllies' },
    ],
  },

  /* 水：救死扶伤 —— 群体治疗 + 净化 */
  water: {
    name: '救死扶伤', side: 'ally',
    desc: '治疗目标 150% 攻击的生命，其余友军各 55%；并清除目标身上所有负面状态。',
    ops: [
      { op: 'heal', k: 1.5, to: 'target' },
      { op: 'heal', k: 0.55, to: 'otherAllies' },
      { op: 'dispel', kind: 'debuff', to: 'target' },
    ],
  },

  /* 草：疯狂感染 —— 纯持续伤害 + 击杀扩散 */
  grass: {
    name: '疯狂感染', side: 'enemy',
    desc: '先造成 100% 攻击伤害；并使目标中毒，2 回合内共造成 80% 攻击的伤害。带感染的敌人被击败时，其余敌人同样中毒 80% × 2 回合。',
    ops: [
      { op: 'status', id: 'poison', k: 0.4, turns: 2, to: 'target' },
      { op: 'onKill', ifStatus: 'poison', ops: [
        { op: 'status', id: 'poison', k: 0.4, turns: 2, to: 'otherEnemies' },
      ] },
    ],
  },

  /* 钢铁：终极复仇 —— 主光环 125% 反伤 + 副光环 50% 反伤 + 两种光环各减 40% 间接伤害 */
  steel: {
    name: '终极复仇', side: 'ally',
    desc: '主目标 2 回合内被直接攻击时反弹 125% 攻击伤害；其余友军反弹 50%；两种光环都对间接伤害（中毒/灼烧）各减免 40% 攻击。若主目标阵亡，对全体敌人造成 80% 攻击伤害。',
    ops: [
      { op: 'status', id: 'retaliate', k: 1.25, ik: 0.4, turns: 2, to: 'target' },
      { op: 'status', id: 'retaliate', k: 0.5, ik: 0.4, turns: 2, to: 'otherAllies' },
      { op: 'status', id: 'vengeance', value: 0.8, turns: 2, to: 'target' },
    ],
  },

  /* 电：燃烧殆尽 —— 三连跳伤害 + 先手驱散 */
  electric: {
    name: '燃烧殆尽', side: 'enemy',
    desc: '先清除主目标所有正面状态，再造成 100% 攻击伤害；另一名敌人受 90%，50% 概率再让第三名敌人受 80%。',
    preOps: [
      { op: 'dispel', kind: 'buff', to: 'target' },
    ],
    ops: [
      { op: 'damage', k: 0.9, to: 'randomOther' },
      { op: 'chance', p: 0.5, ops: [{ op: 'damage', k: 0.8, to: 'randomOther' }] },
    ],
  },

  /* 虚空：黑暗仪式 —— 吸血 + 转移正面状态 */
  void: {
    name: '黑暗仪式', side: 'enemy',
    desc: '先造成 100% 攻击伤害，再把目标当前生命的一部分（85% 攻击）吸给自己；若目标有正面状态，把它们转给自己（最多 2 回合）。',
    ops: [
      { op: 'heal', k: 0.85, to: 'caster', capByTarget: true },
      { op: 'steal', maxTurns: 2 },
    ],
  },

  /* 暗：惊恐失语 —— 封印 */
  dark: {
    name: '惊恐失语', side: 'enemy',
    desc: '先造成 100% 攻击伤害；50% 概率使目标 2 回合内无法使用任何主动技能（封印）。',
    ops: [
      { op: 'chance', p: 0.5, ops: [{ op: 'status', id: 'seal', turns: 2, to: 'target' }] },
    ],
  },

  /* 光：治愈之光 —— 分摊伤害 + 群体治疗 */
  light: {
    name: '治愈之光', side: 'enemy',
    desc: '先对主目标造成 100% 攻击伤害；其余敌人各受 85%，命中时 80% 概率为全体友军回复 10% 攻击的生命。',
    ops: [
      { op: 'damage', k: 0.85, to: 'otherEnemies' },
      { op: 'chance', p: 0.8, ops: [{ op: 'heal', k: 0.1, to: 'allies' }] },
    ],
  },

  /* 古代：大量汲取 —— 汲取伤害 + 削攻 + 群体增伤 */
  ancient: {
    name: '大量汲取', side: 'enemy',
    desc: '先造成 100% 攻击伤害，并使目标造成伤害 -60%（2 回合）；同时全体友军造成伤害 +25%（2 回合）。',
    /* 时长 2 回合 = 完整覆盖 2 个大回合，第 3 回合开始时消失 */
    ops: [
      { op: 'status', id: 'weaken', value: 60, turns: 2, to: 'target' },
      { op: 'status', id: 'atk_up', value: 25, turns: 2, to: 'allies' },
    ],
  },

  /* 神圣：天降鸿福 —— 全体增伤 + 生命上限 */
  holy: {
    name: '天降鸿福', side: 'ally',
    desc: '全体友军造成伤害 +50%，生命上限 +50%，持续 2 回合。',
    /* 时长 2 回合 = 完整覆盖 2 个大回合，第 3 回合开始时消失 */
    ops: [
      { op: 'status', id: 'atk_up', value: 50, turns: 2, to: 'allies' },
      { op: 'status', id: 'maxhp_up', value: 50, turns: 2, to: 'allies' },
    ],
  },

  /* 霸主：坚韧不拔 —— 护盾 + 嘲讽 + 群体免疫 */
  overlord: {
    name: '坚韧不拔', side: 'ally',
    desc: '为目标附加 70% 攻击的护盾，并嘲讽敌人 2 回合（只能攻击它）；全体友军 1 回合内免疫新的负面状态。',
    ops: [
      { op: 'status', id: 'shield', k: 0.7, turns: 2, to: 'target' },
      { op: 'status', id: 'taunt', turns: 2, to: 'target' },
      { op: 'status', id: 'immune', turns: 1, to: 'allies' },
    ],
  },
};

/* ---------------------------------------------------------
 * 生成技能实例
 * --------------------------------------------------------- */
const SKILL_BY_ELEMENT = {};

(function buildSkills() {
  Object.keys(SKILL_DEFS).forEach(function (el) {
    var def = SKILL_DEFS[el];
    /* 对敌技能一律自带一次 100% 攻击，所以 dmgK 从 1.0 起算 */
    var hasDamage = def.side === 'enemy';
    var dmgK = def.side === 'enemy' ? 1.0 : 0;
    (function walk(ops) {
      (ops || []).forEach(function (o) {
        if (o.op === 'damage') {
          hasDamage = true;
          if ((o.k || 0) > dmgK) dmgK = o.k || 0;
        }
        if (o.ops) walk(o.ops);
      });
    })(def.ops);

    SKILL_BY_ELEMENT[el] = {
      id: el,
      element: el,
      name: def.name,
      side: def.side,
      desc: def.desc,
      ops: def.ops,
      preOps: def.preOps || [],      /* 伤害前的前置效果（燃烧殆尽用来先驱散） */
      hasDamage: hasDamage,
      dmgK: dmgK,
      iconUrl: (ELEMENTS[el] && ELEMENTS[el].iconUrl) || '',
      cardImage: (ELEMENTS[el] && ELEMENTS[el].cardImage) || '',
      kind: side2kind(def.side, hasDamage),
    };
  });
})();

/** 卡面上的分类：对敌有伤害=攻击，对友=增益，对敌无伤害=削弱 */
function side2kind(side, hasDamage) {
  if (side === 'ally') return 'buff';
  return hasDamage ? 'attack' : 'debuff';
}

/** 按元素数组取技能（第一个是主元素） */
function skillsOfElements(elements) {
  return elements.map(function (el) { return SKILL_BY_ELEMENT[el]; }).filter(Boolean);
}
