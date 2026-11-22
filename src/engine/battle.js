/* =========================================================
 * 战斗引擎
 *
 * 出招顺序固定：我1 → 敌1 → 我2 → 敌2 → 我3 → 敌3，循环，阵亡的角色跳过。
 *
 * 伤害 = 施法者攻击力(DAS) × 技能倍率 × 元素倍率 × 各种增减 × 暴击
 *   - 不再计算防御，技能自身也没有「威力」数值
 *   - 元素倍率：技能元素 打 目标主元素，有力 ×1.5 / 无力 ×0.5 / 其它 ×1
 * ========================================================= */
const Battle = (function () {
  'use strict';

  const ORDER = ['p0', 'e0', 'p1', 'e1', 'p2', 'e2'];

  /* ---------- 可播种随机数（?seed= 用，保证同种子同一场战斗） ---------- */
  let rngState = 0;
  let rngOn = false;
  function rnd() {
    if (!rngOn) return Math.random();
    rngState = (rngState + 0x6D2B79F5) | 0;
    var t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function setSeed(seed) {
    var n = Number(seed);
    if (!isFinite(n) || n === 0) { rngOn = false; return; }
    rngState = n >>> 0 || 1;
    rngOn = true;
  }

  /* 平衡开关：默认 1 = 完全按「数值对照表.txt」结算。
   * 敌方阵容的输出牌比我们多，AI 对 AI 我方胜率偏低；
   * 想让对局更好打，把 enemyOutgoing 调小（例如 0.8），不影响任何数值表。 */
  const BALANCE = { enemyOutgoing: 1 };

  /* 对手龙（敌方）的通用规则：
   *   startFullHp           每局开局固定 100% 生命，不继承上一局
   *   missChance            打出的攻击有 20% 概率落空（不造成伤害、不附加效果）
   *   skipDefensiveChance   60% 概率不选择防御类技能（护盾 / 治疗 / 免疫 / 净化 / 生命上限） */
  const ENEMY_RULES = {
    startFullHp: true,
    missChance: 0.2,
    skipDefensiveChance: 0.6,
  };

  /* 判断一个技能是不是「防御类」：护盾 / 治疗 / 免疫 / 净化 / 生命上限 */
  function isDefensive(sk) {
    var ops = flattenOps(sk.ops);
    return ops.some(function (o) {
      return o.op === 'heal' || o.op === 'dispel' ||
        o.id === 'shield' || o.id === 'guard' || o.id === 'regen' || o.id === 'immune' || o.id === 'maxhp_up';
    });
  }

  let TS = 1;                                   // 时间缩放（模拟器里设为 0）
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms * TS));
  const rand = (a, b) => a + rnd() * (b - a);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  let S = null;
  let token = 0;
  let resolver = null;
  let autoPlay = false;

  /* ================= 基础工具 ================= */
  function nameHtml(c) {
    return '<b style="color:' + ELEMENTS[c.element].color + '">' + c.name + '</b>';
  }
  function sideTag(c) {
    return c.side === 'ally'
      ? '<span class="tg tg-ally">我方</span>'
      : '<span class="tg tg-enemy">敌方</span>';
  }
  function aliveOf(st, side) {
    return st.chars.filter((c) => c.side === side && c.alive);
  }
  function other(side) {
    return side === 'ally' ? 'enemy' : 'ally';
  }
  function statusOf(c, id) {
    return c.statuses.find((s) => s.id === id);
  }
  function removeStatus(c, id) {
    c.statuses = c.statuses.filter((s) => s.id !== id);
  }

  /* ================= 状态 ================= */
  function applyStatus(char, def) {
    if (!char.alive) return null;
    const meta = STATUSES[def.id];
    if (meta && meta.kind === 'debuff' && statusOf(char, 'immune')) {
      UI.log('　' + nameHtml(char) + ' 处于【负面免疫】，抵抗了【' + meta.name + '】', 'log-status');
      return null;
    }
    let s = statusOf(char, def.id);
    if (s) {
      /* 控制类（封印 / 麻痹）不刷新持续时间，避免被无限控住 */
      if (def.id === 'seal' || def.id === 'paralyze') return null;
      s.turns = Math.max(s.turns, def.turns);
      if (def.id === 'guard') {
        /* 减伤额度不叠加，取更高的一档 */
        s.value = Math.max(s.value || 0, def.value || 0);
        s.indirect = Math.max(s.indirect || 0, def.indirect || 0);
      } else if ((def.value || 0) > 0) {
        s.value = def.id === 'shield' ? s.value + def.value : Math.max(s.value, def.value);
      }
    } else {
      s = {
        id: def.id,
        turns: def.turns,
        value: def.value || 0,
        indirect: def.indirect || 0,
        casterUid: def.casterUid || '',
        element: def.element || '',
      };
      char.statuses.push(s);
    }
    if (def.id === 'maxhp_up') {
      const add = Math.round(char.maxHp * ((def.value || 0) / 100));
      char.maxHp += add;
      char.hp += add;
      s.hpAdd = (s.hpAdd || 0) + add;
    }
    return s;
  }

  function tickStatuses(char) {
    const removed = [];
    char.statuses.forEach((s) => {
      s.turns -= 1;
      if (s.turns <= 0) removed.push(s);
    });
    char.statuses = char.statuses.filter((s) => s.turns > 0);
    removed.forEach((s) => {
      if (s.id === 'maxhp_up' && s.hpAdd) {
        char.maxHp = Math.max(1, char.maxHp - s.hpAdd);
        char.hp = Math.min(char.hp, char.maxHp);
      }
    });
  }

  function mods(c) {
    const m = { atkPct: 0, critAdd: 0, takenPct: 0, dealtPct: 0 };
    c.statuses.forEach((s) => {
      switch (s.id) {
        case 'atk_up': m.atkPct += s.value; break;
        case 'atk_down': m.atkPct -= s.value; break;
        case 'crit_up': m.critAdd += s.value; break;
        case 'vuln': m.takenPct += s.value; break;
        case 'def_down': m.takenPct += s.value; break;
        case 'weaken': m.dealtPct -= s.value; break;
        case 'burn': m.dealtPct -= 15; break;
        default: break;
      }
    });
    return m;
  }

  /* ================= 伤害计算 ================= */
  function calcDamage(user, target, element, k) {
    const um = mods(user);
    const tm = mods(target);
    const atk = user.atk * (1 + um.atkPct / 100);

    let dmg = atk * (k == null ? 1 : k);
    if (user.side === 'enemy') dmg *= BALANCE.enemyOutgoing;
    dmg *= (1 + um.dealtPct / 100) * (1 + tm.takenPct / 100);

    /* 元素克制：技能元素 vs 目标主元素 → ×1.5 / ×1 / ×0.5 */
    const mult = elementMatchup(element, target.element);
    dmg *= mult;

    const crit = rnd() * 100 < (user.crit + um.critAdd);
    if (crit) dmg *= 1.6;
    dmg *= rand(0.94, 1.06);

    /* 第 10 回合起「白热化」：伤害逐回合放大，避免互相治疗拖成僵局 */
    if (S && S.round > 10) dmg *= 1 + (S.round - 10) * 0.18;

    return { dmg: Math.max(1, Math.round(dmg)), crit, mult };
  }

  /* ================= 结算动作 ================= */
  async function damage(st, target, amount, opts) {
    opts = opts || {};
    let dmg = Math.max(1, Math.round(amount));
    let absorbed = 0;
    let guarded = 0;

    /* 石之守护：每次伤害按 direct / indirect 分别封顶，额度本身不消耗 */
    const gd = statusOf(target, 'guard');
    if (gd && dmg > 0 && !opts.noGuard) {
      const cap = opts.dot ? (gd.indirect || 0) : (gd.value || 0);
      guarded = Math.min(cap, dmg);
      dmg -= guarded;
    }

    const sh = statusOf(target, 'shield');
    if (sh && dmg > 0) {
      absorbed = Math.min(sh.value, dmg);
      sh.value -= absorbed;
      dmg -= absorbed;
      if (sh.value <= 0) removeStatus(target, 'shield');
    }
    if (dmg > 0) target.hp = Math.max(0, target.hp - dmg);
    if (opts.source && st.stats) {
      st.stats[opts.source.side].dmg += dmg + absorbed;
      st.stats.byUid[opts.source.uid] = (st.stats.byUid[opts.source.uid] || 0) + dmg + absorbed;
    }

    UI.refresh(st);

    if (guarded > 0) UI.floatText(target.uid, '减伤 -' + fmtNum(guarded), 'shield');
    if (absorbed > 0) UI.floatText(target.uid, '盾 -' + fmtNum(absorbed), 'shield');
    if (dmg > 0) {
      const multTxt = opts.mult > 1 ? '×1.5 ' : (opts.mult < 1 ? '×½ ' : '');
      UI.floatText(
        target.uid,
        (opts.crit ? '暴击 ' : '') + multTxt + fmtNum(dmg),
        opts.crit ? 'crit' : (opts.dot ? 'dot' : (opts.mult > 1 ? 'eff' : 'dmg'))
      );
      UI.shake(target.uid);
    }

    if (opts.dot) {
      const d = STATUSES[opts.dot];
      if (dmg > 0) {
        UI.log('　' + nameHtml(target) + ' 受到【' + d.name + '】侵蚀 <b class="num">' + fmtNum(dmg) + '</b> 点伤害', 'log-dmg');
      } else {
        UI.log('　' + nameHtml(target) + ' 的【' + d.name + '】伤害被完全吸收'
          + (guarded > 0 ? '（石之守护 ' + fmtNum(guarded) + '）' : ''), 'log-status');
      }
      Sfx.hit();
    } else if (dmg > 0) {
      UI.log(
        '　' + nameHtml(opts.source) + ' 对 ' + nameHtml(target) + ' 造成 <b class="num">' + fmtNum(dmg) + '</b> 点伤害' +
        (opts.crit ? ' <span class="crit">暴击！</span>' : '') +
        (opts.mult > 1 ? ' <span class="eff-up">有力 ×1.5</span>' : '') +
        (opts.mult > 0 && opts.mult < 1 ? ' <span class="eff-down">无力 ×0.5</span>' : '') +
        (guarded > 0 ? '（减伤 ' + fmtNum(guarded) + '）' : '') +
        (absorbed > 0 ? '（护盾吸收 ' + fmtNum(absorbed) + '）' : ''),
        'log-dmg'
      );
      if (opts.crit) Sfx.crit(); else Sfx.hit();
    } else {
      UI.log('　' + nameHtml(opts.source) + ' 的攻击被 ' + nameHtml(target) + ' 完全挡下'
        + (guarded > 0 ? '（石之守护 ' + fmtNum(guarded) + '）' : '')
        + (absorbed > 0 ? '（护盾 ' + fmtNum(absorbed) + '）' : ''), 'log-status');
      Sfx.hit();
    }

    /* 复仇反击：被直接命中时把伤害反弹给攻击者（DoT / 反弹本身不再触发） */
    if (!opts.dot && !opts.reflect && opts.source && opts.source.uid !== target.uid) {
      const rt = statusOf(target, 'retaliate');
      if (rt && target.alive && opts.source.alive && rt.value > 0) {
        UI.log('　' + nameHtml(target) + ' 的【复仇反击】将伤害弹回给 ' + nameHtml(opts.source), 'log-status');
        await damage(st, opts.source, rt.value, { reflect: true, source: target, mult: 1 });
      }
    }

    if (target.hp <= 0 && target.alive) {
      target.alive = false;
      target.hp = 0;
      const revenge = statusOf(target, 'vengeance');
      target.statuses = [];
      UI.refresh(st);
      UI.log(nameHtml(target) + ' 倒下了！', 'log-ko');
      Sfx.ko();
      await sleep(420);
      if (revenge && st.token === token) await triggerVengeance(st, target, revenge);
    }

    checkEnd(st);
    await sleep(opts.dot ? 320 : 260);
    return dmg;
  }

  /* 复仇印记：携带者阵亡时，对全体敌人造成伤害 */
  async function triggerVengeance(st, dead, s) {
    const caster = st.byUid[s.casterUid] || dead;
    const foes = aliveOf(st, other(dead.side));
    if (!foes.length) return;
    UI.log('　【复仇印记】爆发！' + nameHtml(caster) + ' 的力量倾泻在敌方全体身上', 'log-status');
    for (let i = 0; i < foes.length; i++) {
      if (st.over || st.token !== token) return;
      const res = calcDamage(caster, foes[i], s.element || 'steel', s.value || 0.8);
      await damage(st, foes[i], res.dmg, { crit: res.crit, mult: res.mult, source: caster });
    }
  }

  async function heal(st, target, amount, label) {
    if (!target.alive || amount <= 0) return;
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + Math.round(amount));
    const real = target.hp - before;
    UI.refresh(st);
    if (real > 0) UI.floatText(target.uid, '+' + fmtNum(real), 'heal');
    UI.log(
      '　' + nameHtml(target) + ' 恢复 <b class="num-heal">' + fmtNum(real) + '</b> 点生命' +
      (label ? '（' + label + '）' : ''),
      'log-heal'
    );
    Sfx.heal();
    await sleep(220);
  }

  function logStatusApplied(target, s) {
    const d = STATUSES[s.id];
    if (!d) return;
    UI.log(
      '　' + nameHtml(target) + (d.kind === 'buff' ? ' 获得' : ' 陷入') +
      '【' + d.name + '】' + (s.value ? ' ' + fmtVal(s.id, s.value) : '') + '（' + s.turns + ' 回合）',
      'log-status'
    );
  }

  /* 状态值显示：护盾/中毒这类是点数，其它是百分比 */
  function fmtVal(id, v) {
    if (id === 'shield' || id === 'poison' || id === 'regen' || id === 'burn') return fmtNum(v);
    if (id === 'guard') return fmtNum(v);
    if (id === 'vengeance') return Math.round(v * 100) + '%';
    return v + '%';
  }

  /* ================= 效果执行 ================= */
  function targetsOf(st, actor, ctx, to) {
    const foeSide = other(actor.side);
    const t = ctx.target;
    switch (to) {
      case 'otherEnemies': return aliveOf(st, foeSide).filter((c) => c !== t);
      case 'enemies': return aliveOf(st, foeSide);
      case 'allies': return aliveOf(st, actor.side);
      case 'otherAllies': return aliveOf(st, actor.side).filter((c) => c !== t);
      case 'caster': return actor.alive ? [actor] : [];
      case 'randomOther': {
        const pool = aliveOf(st, foeSide).filter((c) => c !== t && (ctx.hit || []).indexOf(c.uid) < 0);
        if (!pool.length) return [];
        const one = pool[Math.floor(rnd() * pool.length)];
        return [one];
      }
      default: return t && t.alive ? [t] : [];
    }
  }

  function opValue(actor, op) {
    return op.k != null ? Math.round(op.k * actor.atk) : (op.value || 0);
  }

  async function runOp(st, actor, ctx, op) {
    if (st.over || st.token !== token) return;
    const skill = ctx.skill;

    /* ---- 伤害 ---- */
    if (op.op === 'damage') {
      const list = targetsOf(st, actor, ctx, op.to);
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        if (!t.alive || st.over) continue;
        const res = calcDamage(actor, t, skill.element, op.k);
        const hpBefore = t.hp;
        await damage(st, t, res.dmg, { crit: res.crit, mult: res.mult, source: actor });
        /* 吸血：按实际打掉的生命回复施法者 */
        if (op.drain) {
          const dealt = Math.max(0, hpBefore - t.hp);
          if (dealt > 0) await heal(st, actor, dealt, '汲取');
        }
        ctx.hit = ctx.hit || [];
        if (ctx.hit.indexOf(t.uid) < 0) ctx.hit.push(t.uid);
        if (t === ctx.target && !t.alive) ctx.targetDied = true;
      }
      return;
    }

    /* ---- 治疗 ---- */
    if (op.op === 'heal') {
      const list = targetsOf(st, actor, ctx, op.to);
      for (let i = 0; i < list.length; i++) {
        if (st.over) return;
        let amount = opValue(actor, op);
        /* 吸血类：治疗量不超过目标当前生命 */
        if (op.capByTarget && ctx.target) {
          amount = Math.min(amount, Math.max(0, ctx.hpBefore != null ? ctx.hpBefore : ctx.target.hp));
        }
        await heal(st, list[i], amount, op.capByTarget ? '汲取' : skill.name);
      }
      return;
    }

    /* ---- 上状态 ---- */
    if (op.op === 'status') {
      const list = targetsOf(st, actor, ctx, op.to);
      if (!list.length) return;
      UI.cast(list[0].uid);
      Sfx.cast();
      list.forEach((t) => {
        const s = applyStatus(t, {
          id: op.id,
          turns: op.turns,
          value: opValue(actor, op),
          indirect: op.ik != null ? Math.round(op.ik * actor.atk) : 0,
          casterUid: actor.uid,
          element: skill.element,
        });
        if (s) logStatusApplied(t, s);
      });
      UI.refresh(st);
      await sleep(170);
      return;
    }

    /* ---- 驱散 ---- */
    if (op.op === 'dispel') {
      const list = targetsOf(st, actor, ctx, op.to);
      if (!list.length) return;
      Sfx.cast();
      list.forEach((t) => {
        const before = t.statuses.length;
        t.statuses = t.statuses.filter((s) => {
          const d = STATUSES[s.id];
          return !(d && d.kind === op.kind);
        });
        const n = before - t.statuses.length;
        if (n > 0) {
          UI.log('　' + nameHtml(t) + ' 的 ' + n + ' 个' + (op.kind === 'buff' ? '正面' : '负面') + '状态被清除', 'log-status');
        } else {
          UI.log('　' + nameHtml(t) + ' 没有可以清除的状态', 'log-status');
        }
      });
      UI.refresh(st);
      await sleep(170);
      return;
    }

    /* ---- 偷取正面状态 ---- */
    if (op.op === 'steal') {
      const t = ctx.target;
      if (!t || !t.alive) return;
      const buffs = t.statuses.filter((s) => STATUSES[s.id] && STATUSES[s.id].kind === 'buff');
      if (!buffs.length) {
        UI.log('　' + nameHtml(t) + ' 身上没有可夺取的正面状态', 'log-status');
        return;
      }
      buffs.forEach((s) => {
        const turns = Math.min(s.turns, op.maxTurns || 2);
        const copy = { id: s.id, turns: turns, value: s.value, casterUid: actor.uid, element: s.element };
        if (s.id === 'maxhp_up') copy.value = s.value;
        applyStatus(actor, copy);
        UI.log('　' + nameHtml(actor) + ' 夺取了 ' + nameHtml(t) + ' 的【' + STATUSES[s.id].name + '】（' + turns + ' 回合）', 'log-status');
      });
      t.statuses = t.statuses.filter((s) => !(STATUSES[s.id] && STATUSES[s.id].kind === 'buff'));
      UI.refresh(st);
      await sleep(200);
      return;
    }

    /* ---- 概率触发 ---- */
    if (op.op === 'chance') {
      if (rnd() < (op.p == null ? 0.5 : op.p)) {
        for (let i = 0; i < op.ops.length; i++) await runOp(st, actor, ctx, op.ops[i]);
      } else if (op.failText) {
        UI.log('　' + op.failText, 'log-status');
      }
      return;
    }

    /* ---- 击杀触发 ---- */
    if (op.op === 'onKill') {
      if (!ctx.targetDied) return;
      if (op.ifStatus && ctx.before.indexOf(op.ifStatus) < 0) return;
      UI.log('　【' + skill.name + '】连锁触发！', 'log-status');
      for (let i = 0; i < op.ops.length; i++) await runOp(st, actor, ctx, op.ops[i]);
    }
  }

  /* ================= 出招 =================
   * 统一规则：任何技能打在「对手」身上，都先结算一次 100% 攻击力的伤害，
   * 再结算技能自己的附加效果。辅助技能打敌方就只有这一下（等于普通攻击）。 */
  async function perform(st, actor, skill, target) {
    const toFoe = target.side !== actor.side;

    const cls = actor.side === 'ally' ? 'log-ally' : 'log-enemy';
    UI.log(
      '　' + sideTag(actor) + nameHtml(actor) + ' → ' + nameHtml(target) +
      ' 使用 <b class="skname">' + skill.name + '</b>' +
      (toFoe && skill.side === 'ally' ? '（普通攻击）' : ''),
      cls
    );

    UI.lunge(actor.uid);
    await sleep(140);

    /* 对手龙的攻击有 20% 概率落空 */
    if (actor.side === 'enemy' && toFoe && rnd() < ENEMY_RULES.missChance) {
      UI.floatText(target.uid, 'MISS', 'status');
      UI.log('　' + nameHtml(actor) + ' 的攻击落空了，没有命中 ' + nameHtml(target) + '！', 'log-status');
      await sleep(420);
      return;
    }

    const ctx = {
      skill,
      target,
      before: target.statuses.map((s) => s.id),
      hpBefore: target.hp,
      targetDied: false,
    };

    /* ---- 第一步：对敌方先打一次 100% 攻击 ----
     * 少数技能（如闪电「燃烧殆尽」）在伤害前还有前置效果，写在 preOps 里。 */
    if (toFoe) {
      const pre = skill.preOps || [];
      for (let i = 0; i < pre.length; i++) {
        await runOp(st, actor, ctx, pre[i]);
        if (st.over || st.token !== token) return;
      }
      if (target.alive) {
        const res = calcDamage(actor, target, skill.element, 1.0);
        await damage(st, target, res.dmg, { crit: res.crit, mult: res.mult, source: actor });
        if (!target.alive) ctx.targetDied = true;
        if (st.over || st.token !== token) return;
      }
      /* 辅助技能指向敌方：到此为止，没有任何附加效果 */
      if (skill.side === 'ally') {
        await sleep(160);
        return;
      }
    }

    /* ---- 第二步：技能自己的附加效果 ---- */
    for (let i = 0; i < skill.ops.length; i++) {
      await runOp(st, actor, ctx, skill.ops[i]);
      if (st.over || st.token !== token) return;
    }

    await sleep(160);
  }

  /* ================= 回合流程 ================= */
  function checkEnd(st) {
    const allyAlive = aliveOf(st, 'ally').length > 0;
    const enemyAlive = aliveOf(st, 'enemy').length > 0;
    if (allyAlive && enemyAlive) return false;
    st.over = true;
    st.phase = 'over';
    st.result = allyAlive ? 'win' : 'lose';
    return true;
  }

  function nextIndex(st, from) {
    for (let i = 1; i <= st.order.length; i++) {
      const idx = (from + i) % st.order.length;
      const c = st.byUid[st.order[idx]];
      if (c && c.alive) return idx;
    }
    return -1;
  }

  async function takeTurn(st, actor) {
    st.phase = 'turnStart';
    st.pendingCard = null;
    UI.clearTargets();
    UI.refresh(st);
    UI.renderCards(actor, false);
    UI.setHint(actor.side === 'ally' ? '你的回合' : '敌方行动中…', actor.side === 'ally');
    UI.log('<span class="tag-turn">R' + st.round + '</span> ' + sideTag(actor) + ' ' + nameHtml(actor) + ' 的回合', 'log-sys');
    await sleep(280);
    if (st.token !== token) return;

    /* 封印 */
    if (statusOf(actor, 'seal')) {
      UI.floatText(actor.uid, '封印!', 'status');
      UI.log('　' + nameHtml(actor) + ' 被【封印】，无法使用任何技能！', 'log-status');
      await sleep(620);
      await endOfTurn(st, actor);
      return;
    }

    /* 麻痹 */
    if (statusOf(actor, 'paralyze') && rnd() < 0.35) {
      UI.floatText(actor.uid, '麻痹!', 'status');
      UI.log('　' + nameHtml(actor) + ' 被【麻痹】，无法行动！', 'log-status');
      await sleep(620);
      await endOfTurn(st, actor);
      return;
    }

    /* 持续伤害 */
    const dots = ['poison', 'burn'];
    for (let i = 0; i < dots.length; i++) {
      const s = statusOf(actor, dots[i]);
      if (!s) continue;
      await damage(st, actor, s.value, { dot: dots[i] });
      if (st.over || st.token !== token) return;
      if (!actor.alive) { await endOfTurn(st, actor); return; }
    }

    /* 行动 */
    if (actor.side === 'ally' && !autoPlay) {
      st.phase = 'awaiting';
      UI.renderCards(actor, true);
      UI.setHint('你的回合　·　选择一张技能卡（按 1 / 2 / 3）', true);
      const action = await new Promise((res) => { resolver = res; });
      if (st.token !== token) return;
      st.phase = 'resolving';
      st.pendingCard = null;
      UI.clearTargets();
      UI.renderCards(actor, false);
      await perform(st, actor, action.skill, action.target);
    } else {
      st.phase = 'resolving';
      await sleep(actor.side === 'ally' ? 180 : 560);
      if (st.token !== token) return;
      const action = autoChoose(st, actor);
      await perform(st, actor, action.skill, action.target);
    }

    if (st.over || st.token !== token) return;
    await endOfTurn(st, actor);
  }

  async function endOfTurn(st, actor) {
    if (st.token !== token) return;
    const regen = statusOf(actor, 'regen');
    if (regen && actor.alive) await heal(st, actor, regen.value, '回春');
    tickStatuses(actor);
    UI.refresh(st);
    await sleep(110);
  }

  /* ================= 自动出招（敌方 AI / 自动战斗） ================= */
  /* 把技能的效果树摊平，方便 AI 判断这个技能干什么用 */
  function flattenOps(ops, out) {
    out = out || [];
    (ops || []).forEach(function (o) {
      out.push(o);
      if (o.ops) flattenOps(o.ops, out);
    });
    return out;
  }

  /* 把技能效果折算成「相当于多少次普通攻击」（1.0 = 一次 100% 攻击） */
  function opWeight(actor, skill, op, allyCount) {
    const cnt = op.to === 'allies' || op.to === 'enemies' ? allyCount
      : (op.to === 'otherAllies' || op.to === 'otherEnemies') ? Math.max(1, allyCount - 1) : 1;
    if (op.op === 'damage') return (op.k || 1);
    if (op.op === 'heal') return (op.k || 0) * cnt * 0.6;
    if (op.op === 'dispel') return 0.55;
    if (op.op === 'steal') return 0.6;
    if (op.op !== 'status') return 0;
    const pct = op.value != null ? op.value / 100 : 0;
    const turns = op.turns || 1;
    switch (op.id) {
      case 'atk_up': return pct * turns * cnt * 0.7;
      case 'maxhp_up': return pct * cnt * 1.0;
      case 'shield': return (op.k || 0) * cnt * 0.6;
      case 'guard': return (op.k || 0) * cnt * 1.1;
      case 'poison': return (op.k || 0) * turns * 0.55 * cnt;
      case 'seal': return 0.85;
      case 'paralyze': return 0.5;
      case 'immune': return 0.45;
      case 'vengeance': return 0.6;
      case 'weaken': return pct * turns * cnt * 0.5;
      case 'vuln': return pct * turns * cnt * 0.5;
      default: return 0.25;
    }
  }

  function autoChoose(st, actor) {
    const allies = aliveOf(st, actor.side);
    const foes = tauntedFoes(st, actor) || aliveOf(st, other(actor.side));
    if (!foes.length) return { skill: actor.skills[0], target: actor };

    const weakest = allies.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b));
    const ratio = weakest.hp / weakest.maxHp;
    const buffed = allies.every((a) => a.statuses.some((s) => s.id === 'atk_up'));
    const skipDefensive = actor.side === 'enemy' && rnd() < ENEMY_RULES.skipDefensiveChance;

    const cand = [];

    actor.skills.forEach((sk) => {
      const ops = flattenOps(sk.ops);

      if (sk.side === 'enemy') {
        foes.forEach((foe) => {
          const mult = elementMatchup(sk.element, foe.element);
          /* 统一规则：打敌方先算一次 100% 攻击，再叠加技能效果 */
          let score = 1.0 * mult;
          ops.forEach((o) => { score += opWeight(actor, sk, o, allies.length) * mult; });
          score *= 1 + 0.6 * (1 - foe.hp / foe.maxHp);   // 集中火力：越残血越优先
          cand.push({ skill: sk, target: foe, score });
        });
        return;
      }

      /* 辅助技能的两种用法：
       *   A. 打友方 → 正常结算辅助/削弱效果
       *   B. 打敌方 → 只当作一次普通攻击
       * 对手龙 60% 概率「不出防御类技能」时，只保留 B 这种攻击用法。 */
      const skipped = skipDefensive && isDefensive(sk);

      if (!skipped) {
        let score = 0;
        ops.forEach((o) => { score += opWeight(actor, sk, o, allies.length); });
        if (buffed && ops.some((o) => o.id === 'atk_up')) score *= 0.15;
        if (ratio > 0.95) {
          const onlyDefensive = ops.every((o) => o.id === 'shield' || o.op === 'heal' || o.id === 'immune' || o.id === 'regen');
          if (onlyDefensive) score *= 0.35;
        }
        cand.push({ skill: sk, target: weakest, score });
      }

      /* 普通攻击用法：1.0 × 元素克制 */
      foes.forEach((foe) => {
        const mult = elementMatchup(sk.element, foe.element);
        let score = 1.0 * mult;
        score *= 1 + 0.6 * (1 - foe.hp / foe.maxHp);
        cand.push({ skill: sk, target: foe, score });
      });
    });

    if (!cand.length) return { skill: actor.skills[0], target: actor };
    cand.sort((a, b) => b.score - a.score);
    if (rnd() < 0.82 || cand.length === 1) return cand[0];
    return cand[Math.min(cand.length - 1, 1 + Math.floor(rnd() * 2))];
  }

  /* ================= 主循环 ================= */
  async function run(st) {
    UI.log('<span class="tag-turn">◆</span> 战斗开始！出招顺序：我1 → 敌1 → 我2 → 敌2 → 我3 → 敌3，循环往复。', 'log-sys');
    await sleep(400);

    while (!st.over && st.token === token) {
      const idx = nextIndex(st, st.turnIndex);
      if (idx < 0) break;
      if (st.turnIndex >= 0 && idx <= st.turnIndex) st.round += 1;
      if (st.round === 11) {
        UI.log('<span class="tag-turn">◆</span> 战场进入白热化：此后每回合全场伤害提升 18%！', 'log-sys');
      }
      if (st.round > 40) {
        const ah = aliveOf(st, 'ally').reduce((a, c) => a + c.hp, 0);
        const eh = aliveOf(st, 'enemy').reduce((a, c) => a + c.hp, 0);
        st.over = true;
        st.result = ah >= eh ? 'win' : 'lose';
        UI.log('<span class="tag-turn">◆</span> 战斗超时，按剩余总生命判定：' + (st.result === 'win' ? '我方获胜' : '敌方获胜'), 'log-sys');
        break;
      }
      st.turnIndex = idx;
      st.activeUid = st.order[idx];
      await takeTurn(st, st.byUid[st.activeUid]);
    }

    if (st.token !== token) return;
    checkEnd(st);
    st.phase = 'over';
    UI.setHint('战斗结束', false);
    UI.clearTargets();
    await sleep(400);
    UI.gameOver(st.result, st);
    if (st.result === 'win') Sfx.win(); else Sfx.lose();
  }

  /* ================= 构造战斗 ================= */
  function makeChar(tpl, side, slot) {
    const elements = (tpl.elements || [tpl.element]).slice();
    return {
      uid: (side === 'ally' ? 'p' : 'e') + slot,
      side,
      slot,
      name: tpl.name,
      title: tpl.title,
      level: tpl.level,
      elements,                 // [主元素, 副元素, 副元素]
      element: elements[0],     // 主元素 = 属性，决定被什么克制
      avatarUrl: tpl.avatarUrl || '',
      /* 每局重建角色，对手龙固定 100% 生命开局，不继承上一局的损耗 */
      maxHp: tpl.hp,
      hp: tpl.hp,
      atk: tpl.atk,
      crit: tpl.crit == null ? 10 : tpl.crit,
      skills: skillsOfElements(elements),
      statuses: [],
      alive: true,
    };
  }

  function init() {
    token += 1;
    resolver = null;

    const chars = [];
    PLAYER_TEAM.forEach((t, i) => chars.push(makeChar(t, 'ally', i)));
    ENEMY_TEAM.forEach((t, i) => chars.push(makeChar(t, 'enemy', i)));

    const byUid = {};
    chars.forEach((c) => { byUid[c.uid] = c; });

    S = {
      chars,
      byUid,
      order: ORDER.slice(),
      turnIndex: -1,
      round: 1,
      activeUid: null,
      phase: 'idle',
      over: false,
      result: null,
      pendingCard: null,
      auto: autoPlay,
      stats: { ally: { dmg: 0 }, enemy: { dmg: 0 }, byUid: {} },
      token,
    };

    UI.build(S);
    run(S);
  }

  /* ================= 玩家输入接口 ================= */
  /* 有嘲讽时，敌方技能只能选带嘲讽的目标 */
  function tauntedFoes(st, actor) {
    const foes = aliveOf(st, other(actor.side));
    const t = foes.filter((f) => statusOf(f, 'taunt'));
    return t.length ? t : null;
  }

  function validTargets(actor, skill) {
    const foes = tauntedFoes(S, actor) || aliveOf(S, other(actor.side));
    if (skill.side === 'enemy') return foes;
    /* 辅助技能：友方 = 正常强化；敌方 = 只当普通攻击 */
    return aliveOf(S, actor.side).concat(foes);
  }

  function commit(skill, target) {
    const res = resolver;
    resolver = null;
    if (!S) return;
    S.pendingCard = null;
    UI.clearTargets();
    if (res) res({ skill, target });
  }

  function chooseCard(index) {
    if (!S || S.phase !== 'awaiting') return;

    /* 再次点击同一张卡 = 取消 */
    if (S.pendingCard === index) { cancelCard(); return; }

    const actor = S.byUid[S.activeUid];
    if (!actor) return;
    const skill = actor.skills[index];
    if (!skill) return;

    const targets = validTargets(actor, skill);
    if (!targets.length) return;
    if (targets.length === 1) {
      S.pendingCard = null;
      commit(skill, targets[0]);
      return;
    }

    S.pendingCard = index;
    UI.showTargets(actor, skill, targets);
  }

  function chooseTarget(uid) {
    if (!S || S.phase !== 'awaiting' || S.pendingCard === null) return;
    const actor = S.byUid[S.activeUid];
    const skill = actor && actor.skills[S.pendingCard];
    const target = S.byUid[uid];
    if (!skill || !target) return;
    if (validTargets(actor, skill).indexOf(target) < 0) return;
    commit(skill, target);
  }

  function cancelCard() {
    if (!S || S.pendingCard === null) return;
    S.pendingCard = null;
    UI.clearTargets();
    UI.setHint('你的回合　·　选择一张技能卡（按 1 / 2 / 3）', true);
  }

  function setAuto(v) {
    autoPlay = !!v;
    if (S) {
      S.auto = autoPlay;
      if (autoPlay && S.phase === 'awaiting' && S.pendingCard !== null) cancelCard();
    }
    return autoPlay;
  }

  return {
    init,
    chooseCard,
    chooseTarget,
    cancelCard,
    setAuto,
    isAuto: () => autoPlay,
    setTimeScale: (v) => { TS = v; },
    setSeed: setSeed,
    getState: () => S,
  };
})();
