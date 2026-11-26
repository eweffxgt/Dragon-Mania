/* =========================================================
 * 状态（buff / debuff）表
 * kind: 'buff' | 'debuff'
 * short: 状态栏上的像素小标签
 * val(v): 鼠标悬停时的说明文字
 * ========================================================= */
const STATUSES = {
  /* ---------------- 增益 ---------------- */
  atk_up: {
    name: '伤害提升', short: '伤↑', kind: 'buff', color: '#ffb057',
    val: (v) => `造成伤害 +${v}%`,
  },
  def_up: {
    name: '防御提升', short: '防↑', kind: 'buff', color: '#5cc9ff',
    val: (v) => `受到伤害 -${v}%`,
  },
  crit_up: {
    name: '暴击提升', short: '暴↑', kind: 'buff', color: '#ffe14d',
    val: (v) => `暴击率 +${v}%`,
  },
  regen: {
    name: '回春', short: '回春', kind: 'buff', color: '#5cff9d',
    val: (v) => `每回合恢复 ${fmtNum(v)} 生命`,
  },
  shield: {
    name: '护盾', short: '盾', kind: 'buff', color: '#9fd8ff',
    val: (v) => `优先吸收 ${fmtNum(v)} 点伤害（可消耗）`,
  },
  guard: {
    name: '石之守护', short: '减伤', kind: 'buff', color: '#c9a06a',
    val: (v, s) => `每次直接伤害最多吸收 ${fmtNum(v)}`
      + (s && s.indirect ? `；间接伤害最多吸收 ${fmtNum(s.indirect)}` : '')
      + '（不消耗，持续到回合结束）',
  },
  maxhp_up: {
    name: '生命充盈', short: '生命↑', kind: 'buff', color: '#ff9ad5',
    val: (v) => `生命上限 +${v}%`,
  },
  immune: {
    name: '负面免疫', short: '免疫', kind: 'buff', color: '#7dff9f',
    val: () => '免疫新施加的负面状态',
  },
  vengeance: {
    name: '复仇印记', short: '复仇', kind: 'buff', color: '#ff6b3d',
    val: (v) => `阵亡时对全体敌人造成 ${Math.round(v * 100)}% 攻击伤害`,
  },
  retaliate: {
    name: '复仇反击', short: '反击', kind: 'buff', color: '#ffa14d',
    val: (v, s) => `被直接攻击时反弹 ${fmtNum(v)} 点伤害`
      + (s && s.indirect ? `；间接伤害减免 ${fmtNum(s.indirect)}` : ''),
  },
  taunt: {
    name: '嘲讽', short: '嘲讽', kind: 'buff', color: '#ffd166',
    val: () => '敌人只能攻击它',
  },

  /* ---------------- 减益 ---------------- */
  poison: {
    name: '中毒', short: '毒', kind: 'debuff', color: '#8ee06a',
    val: (v) => `每回合损失 ${fmtNum(v)} 生命`,
  },
  burn: {
    name: '灼烧', short: '燃', kind: 'debuff', color: '#ff8a3d',
    val: (v) => `每回合损失 ${fmtNum(v)} 生命，造成伤害 -15%`,
  },
  vuln: {
    name: '易伤', short: '易伤', kind: 'debuff', color: '#ff5d8f',
    val: (v) => `受到伤害 +${v}%`,
  },
  weaken: {
    name: '虚弱', short: '虚弱', kind: 'debuff', color: '#9aa7c7',
    val: (v) => `造成伤害 -${v}%`,
  },
  def_down: {
    name: '破防', short: '破防', kind: 'debuff', color: '#ff9f6b',
    val: (v) => `受到伤害 +${v}%`,
  },
  atk_down: {
    name: '攻弱', short: '攻↓', kind: 'debuff', color: '#b58cff',
    val: (v) => `造成伤害 -${v}%`,
  },
  paralyze: {
    name: '麻痹', short: '麻痹', kind: 'debuff', color: '#ffe14d',
    val: () => '有 35% 概率无法行动',
  },
  seal: {
    name: '封印', short: '封印', kind: 'debuff', color: '#b06bff',
    val: () => '无法使用任何主动技能',
  },
  runeMute: {
    name: '封符', short: '封符', kind: 'debuff', color: '#8fa0c8',
    val: () => '魔符效果失效',
  },
};
