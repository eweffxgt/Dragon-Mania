/* =========================================================
 * 渲染层：负责所有 DOM 与动画，不参与任何战斗逻辑。
 *
 * 单个状态栏结构（参考图）：
 *   [左：元素 + 等级] [中：头像 + 血条] [右：buff / debuff]
 * ========================================================= */
const UI = (function () {
  'use strict';

  const R = { panels: {} };
  let E = null;

  /* ---------------- 初始化 ---------------- */
  function cache() {
    if (E) return;
    E = {
      stage: document.getElementById('stage'),
      ally: document.getElementById('allySide'),
      enemy: document.getElementById('enemySide'),
      cards: document.getElementById('cards'),
      hint: document.getElementById('cardsHint'),
      order: document.getElementById('orderBar'),
      log: document.getElementById('log'),
      round: document.getElementById('roundNum'),
    kills: document.getElementById('killNum'),
      fx: document.getElementById('fxLayer'),
      overlay: document.getElementById('overlay'),
    };
  }

  function build(st) {
    cache();
    R.panels = {};
    R.panelPips = [];
    E.ally.innerHTML = '';
    E.enemy.innerHTML = '';
    E.order.innerHTML = '';
    E.log.innerHTML = '';
    E.cards.innerHTML = '';
    setHint('准备中…', false);

    /* 首屏占位：JS 已经能画真实界面了，把它移除 */
    var boot = document.getElementById('boot');
    if (boot && boot.parentNode) boot.parentNode.removeChild(boot);

    ['ally', 'enemy'].forEach((side) => {
      const host = side === 'ally' ? E.ally : E.enemy;
      st.chars
        .filter((c) => c.side === side)
        .sort((a, b) => a.slot - b.slot)
        .forEach((c) => {
          const el = createPanel(c);
          host.appendChild(el);
          /* 头像要等元素进入文档、拿到真实尺寸后再画，避免拉伸变形 */
          const cv = el.querySelector('canvas.avatar');
          if (cv) PixelArt.drawAvatar(cv, c);
          /* 元素图标优先用切好的正式图，没有的才画像素图 */
          const drawElem = (node, eid) => {
            if (node && node.tagName === 'CANVAS') PixelArt.drawIcon(node, eid, 2);
          };
          drawElem(el.querySelector('.e-main'), c.element);
          c.elements.slice(1).forEach((eid, i) => {
            drawElem(el.querySelector('.e-sub' + i), eid);
          });
        });
    });

    /* 出招顺序条（紧凑：只显示 我1/敌1 + 颜色，名字放 title） */
    st.order.forEach((uid) => {
      const c = st.byUid[uid];
      const el = document.createElement('div');
      el.className = 'pip';
      el.style.setProperty('--pc', ELEMENTS[c.element].color);
      el.title = ELEMENTS[c.element].name + ' · ' + c.name;
      el.innerHTML = '<i>' + (c.side === 'ally' ? '我' : '敌') + (c.slot + 1) + '</i>';
      E.order.appendChild(el);
      R.panelPips.push(el);
    });

    refresh(st);
  }

  /* ---------------- 单个角色状态栏 ---------------- */
  function createPanel(c) {
    const el = document.createElement('div');
    el.className = 'panel';
    el.dataset.uid = c.uid;
    el.style.setProperty('--elem', ELEMENTS[c.element].color);

    const mainEl = ELEMENTS[c.element];
    const tip = '主元素：' + mainEl.name +
      '｜克制 ' + elementNames(elementBeats(c.element)) +
      '｜被克 ' + elementNames(elementBeatenBy(c.element)) +
      '　（攻 ' + c.atk + ' · 防 ' + c.def + '）';
    el.title = c.title + '　' + tip;

    const avatar = c.avatarUrl
      ? '<img class="avatar-img" src="' + c.avatarUrl + '" alt="' + c.name + '">'
      : '<canvas class="avatar" width="64" height="64"></canvas>';

    const iconOf = (eid, extraCls) => {
      const e = ELEMENTS[eid];
      return e.iconUrl
        ? '<img class="eicon ' + extraCls + '" src="' + e.iconUrl + '" alt="">'
        : '<canvas class="eicon ' + extraCls + '"></canvas>';
    };

    const subs = c.elements.slice(1).map((eid, i) => {
      const e = ELEMENTS[eid];
      return '<div class="elem-box" title="副元素：' + e.name + '（决定第 ' + (i + 2) + ' 张技能卡）">' +
        iconOf(eid, 'e-sub' + i) + '</div>';
    }).join('');

    el.innerHTML =
      '<div class="panel-main">' +
        '<div class="p-left">' +
          '<div class="elem-box" title="主元素：' + mainEl.name + '">' +
            iconOf(c.element, 'e-main') + '</div>' +
          subs +
        '</div>' +
        '<div class="p-mid">' +
          '<div class="portrait">' + avatar +
            '<div class="pname">' + c.name + '</div>' +
          '</div>' +
          '<div class="hpbar"><i></i></div>' +
          '<div class="lv-badge">' + c.level + '</div>' +
        '</div>' +
        '<div class="p-right"><div class="statuses"></div></div>' +
      '</div>' +
      '<div class="target-tag"></div>' +
      '<div class="ko-mark">K.O.</div>';

    const ref = {
      el,
      hpFill: el.querySelector('.hpbar i'),
      hpBar: el.querySelector('.hpbar'),
      statuses: el.querySelector('.statuses'),
      targetTag: el.querySelector('.target-tag'),
    };
    R.panels[c.uid] = ref;

    el.addEventListener('click', () => {
      if (el.classList.contains('targetable')) Battle.chooseTarget(c.uid);
      else Sfx.click();
    });

    return el;
  }

  function updatePanel(c, st) {
    const r = R.panels[c.uid];
    if (!r) return;

    const pct = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
    r.hpFill.style.width = pct + '%';
    r.hpBar.classList.toggle('low', pct <= 25 && c.alive);

    r.el.classList.toggle('active', c.uid === st.activeUid);
    r.el.classList.toggle('dead', !c.alive);
    r.el.classList.toggle('has-status', c.statuses.length > 0);

    r.statuses.innerHTML = c.statuses
      .map((s) => {
        const d = STATUSES[s.id];
        if (!d) return '';
        const value = s.id === 'shield' ? fmtNum(s.value) : '';
        const turns = s.id === 'shield' ? '' : '<i>' + s.turns + '</i>';
        return '<span class="chip ' + d.kind + '" style="--c:' + d.color + '" title="' +
          d.name + '：' + d.val(s.value, s) + '（剩余 ' + s.turns + ' 回合）">' +
          d.short + value + turns + '</span>';
      })
      .join('');
  }

  /* ---------------- 整体刷新 ---------------- */
  function refresh(st) {
    if (!E) return;
    E.round.textContent = st.round;
    if (E.kills) E.kills.textContent = st.kills || 0;

    st.chars.forEach((c) => updatePanel(c, st));

    if (R.panelPips) {
      st.order.forEach((uid, i) => {
        const c = st.byUid[uid];
        const el = R.panelPips[i];
        if (!el) return;
        el.classList.toggle('active', uid === st.activeUid);
        el.classList.toggle('dead', !c.alive);
      });
    }
  }

  /* ---------------- 车轮战：槽位换人后重建该面板 ---------------- */
  function rebuildChar(st, c) {
    if (!E) return;
    const old = R.panels[c.uid];
    if (!old || !old.el || !old.el.parentNode) return;

    const fresh = createPanel(c);          /* 内部会重建 R.panels[c.uid] */
    old.el.parentNode.replaceChild(fresh, old.el);

    /* 头像若用 canvas 需要重绘（现在都用图片，保底处理） */
    const cv = fresh.querySelector('canvas.avatar');
    if (cv) PixelArt.drawAvatar(cv, c);

    /* 出招顺序条上的颜色 / 提示跟着换 */
    const i = st.order.indexOf(c.uid);
    const pip = R.panelPips && R.panelPips[i];
    if (pip) {
      pip.style.setProperty('--pc', ELEMENTS[c.element].color);
      pip.title = ELEMENTS[c.element].name + ' · ' + c.name;
    }
    updatePanel(c, st);
  }

  /* ---------------- 卡牌区 ---------------- */
  function renderCards(actor, enabled) {
    if (!E) return;
    E.cards.innerHTML = '';
    E.cards.classList.toggle('disabled', !enabled);

    actor.skills.forEach((sk, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'card' + (enabled ? '' : ' disabled');
      el.style.setProperty('--elem', ELEMENTS[sk.element].color);

      const isBuff = sk.kind === 'buff';
      const elDef = ELEMENTS[sk.element];
      const elTip = '有力：' + (elementNames(elementBeats(sk.element)) || '无') +
        '　无力：' + (elementNames(elementBeatenBy(sk.element)) || '无');
      el.title = '【' + elDef.name + '】' + sk.name + '\n' + sk.desc +
        (sk.side === 'ally' ? '\n（对敌方使用 = 普通攻击，无附加效果）' : '') +
        '\n' + elTip;

      if (sk.cardImage) {
        /* 有正式卡面贴图：整张卡就是贴图 */
        el.innerHTML =
          '<img class="card-img" src="' + sk.cardImage + '" alt="' + sk.name + '">' +
          '<span class="card-key">' + (i + 1) + '</span>';
      } else {
        /* 还没给贴图的元素：沿用程序生成的像素卡面（同版式，无文字） */
        el.innerHTML =
          '<div class="card-gen">' +
            '<div class="gen-medal">' +
              (elDef.iconUrl
                ? '<img class="gen-icon-img" src="' + elDef.iconUrl + '" alt="">'
                : '<canvas class="gen-icon"></canvas>') +
            '</div>' +
            '<div class="gen-art"><canvas class="gen-art-cv"></canvas></div>' +
          '</div>' +
          '<span class="card-key">' + (i + 1) + '</span>';
      }

      E.cards.appendChild(el);

      /* 进入文档后再画，才能拿到真实画框尺寸 */
      const mv = el.querySelector('canvas.gen-icon');
      if (mv) PixelArt.drawIcon(mv, sk.element, 2);
      const av = el.querySelector('canvas.gen-art-cv');
      if (av) PixelArt.drawCardArt(av, sk);

      if (enabled) {
        el.addEventListener('click', () => {
          Sfx.select();
          Battle.chooseCard(i);
        });
      }
    });
  }

  function setHint(text, hot) {
    if (!E) return;
    E.hint.textContent = text;
    E.hint.classList.toggle('hot', !!hot);
  }

  /* ---------------- 目标选择 ---------------- */
  function showTargets(actor, skill, targets) {
    clearTargets();
    targets.forEach((t) => {
      const r = R.panels[t.uid];
      if (!r) return;
      r.el.classList.add('targetable');
      if (t.side === actor.side) {
        r.targetTag.className = 'target-tag';
        r.targetTag.textContent = '强 化';
      } else {
        const m = elementMatchup(skill.element, t.element);
        r.targetTag.className = 'target-tag ' + (m > 1 ? 'up' : (m < 1 ? 'down' : 'even'));
        r.targetTag.textContent = m > 1 ? '有力 ×1.5' : (m < 1 ? '无力 ×0.5' : '×1');
      }
    });
    const idx = actor.skills.indexOf(skill);
    if (E.cards && E.cards.children[idx]) {
      E.cards.children[idx].classList.add('selected');
    }
    setHint(
      skill.side === 'ally'
        ? '点友方 = 强化　·　点敌方 = 普通攻击（Esc 取消）'
        : '选择敌方目标　·　' + ELEMENTS[skill.element].name + '属性（Esc 取消）',
      true
    );
  }

  function clearTargets() {
    Object.keys(R.panels).forEach((uid) => {
      const r = R.panels[uid];
      r.el.classList.remove('targetable');
      if (r.targetTag) {
        r.targetTag.className = 'target-tag';
        r.targetTag.textContent = '';
      }
    });
    if (E && E.cards) {
      Array.prototype.forEach.call(E.cards.children, (c) => c.classList.remove('selected'));
    }
  }

  /* ---------------- 战斗播报 ---------------- */
  function log(html, cls) {
    if (!E) return;
    const line = document.createElement('div');
    line.className = 'log-line ' + (cls || 'log-sys');
    line.innerHTML = html;
    E.log.appendChild(line);
    while (E.log.childNodes.length > 240) E.log.removeChild(E.log.firstChild);
    E.log.scrollTop = E.log.scrollHeight;
  }

  /* ---------------- 特效 ---------------- */
  /* 飘字层在 stage 内（会跟着竖屏旋转一起转），所以用布局坐标而不是屏幕坐标 */
  function offsetInStage(node) {
    var x = 0;
    var y = 0;
    var cur = node;
    while (cur && cur !== E.stage) {
      x += cur.offsetLeft || 0;
      y += cur.offsetTop || 0;
      cur = cur.offsetParent;
    }
    return { x: x, y: y, w: node.offsetWidth, h: node.offsetHeight };
  }

  function floatText(uid, text, cls) {
    const r = R.panels[uid];
    if (!r || !E || !E.fx) return;
    const box = offsetInStage(r.el);
    const el = document.createElement('div');
    el.className = 'float-num ' + (cls || 'dmg');
    el.textContent = text;
    el.style.left = box.x + box.w / 2 + (Math.random() * 26 - 13) + 'px';
    el.style.top = box.y + box.h * 0.32 + 'px';
    el.style.transform = 'translateX(-50%)';
    E.fx.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1000);
  }

  function shake(uid) {
    const r = R.panels[uid];
    if (!r) return;
    r.el.classList.remove('hit');
    void r.el.offsetWidth;
    r.el.classList.add('hit');
    setTimeout(() => r.el.classList.remove('hit'), 260);
  }

  function lunge(uid) {
    const r = R.panels[uid];
    if (!r) return;
    r.el.classList.remove('lunge');
    void r.el.offsetWidth;
    r.el.classList.add('lunge');
    setTimeout(() => r.el.classList.remove('lunge'), 320);
  }

  function cast(uid) {
    const r = R.panels[uid];
    if (!r) return;
    r.el.classList.remove('cast');
    void r.el.offsetWidth;
    r.el.classList.add('cast');
    setTimeout(() => r.el.classList.remove('cast'), 420);
  }

  /* ---------------- 结算 ---------------- */
  function gameOver(result, st) {
    if (!E) return;
    const win = result === 'win';
    const rows = st.chars
      .map((c) => {
        const col = ELEMENTS[c.element].color;
        return '<div class="ov-row">' +
          '<span class="ov-name" style="color:' + col + '">' + c.name + '</span>' +
          '<span class="ov-hp">' + fmtNum(Math.max(0, c.hp)) + ' / ' + fmtNum(c.maxHp) + '</span>' +
          '<span class="ov-state">' + (c.alive ? '存活' : '阵亡') + '</span>' +
          '</div>';
      })
      .join('');

    const kills = st.kills || 0;
    const reward = st.reward || 0;
    E.overlay.innerHTML =
      '<div class="overlay-box">' +
        '<div class="ov-title ' + (win ? 'win' : 'lose') + '">战  果</div>' +
        '<div class="ov-kills">击杀 <b>' + kills + '</b> 个敌人</div>' +
        '<div class="ov-reward">获得 <b>' + fmtNum(reward) + '</b> 金币</div>' +
        runeDropHtml(st) +
        '<div class="ov-sub">共经过 ' + st.round + ' 回合</div>' +
        '<div class="ov-list">' + rows + '</div>' +
        '<button type="button" class="px-btn big" id="ovExit">回 到 主 界 面</button>' +
      '</div>';
    E.overlay.classList.remove('hidden');
    const btn = E.overlay.querySelector('#ovExit');
    if (btn) {
      btn.addEventListener('click', () => {
        clearOverlay();
        if (UI.onExit) UI.onExit();
      });
    }
  }


  /* 本场掉落的魔符（最多显示 8 个图标） */
  function runeDropHtml(st) {
    const drops = st && st.runeDrops ? st.runeDrops : [];
    if (!drops.length || typeof RUNE === 'undefined') return '';
    const shown = drops.slice(0, 8).map(function (d) {
      return '<img class="ov-rune" src="' + RUNE.sprite(d.r, d.t) + '" alt="">';
    }).join('');
    const more = drops.length > 8 ? '<span class="ov-rune-more">+' + (drops.length - 8) + '</span>' : '';
    return '<div class="ov-runes">魔符 <b>' + drops.length + '</b> 个 ' + shown + more + '</div>';
  }
  function clearOverlay() {
    if (!E) return;
    E.overlay.classList.add('hidden');
    E.overlay.innerHTML = '';
  }

  return {
    build, refresh, rebuildChar, renderCards, setHint,
    showTargets, clearTargets,
    log, floatText, shake, lunge, cast,
    gameOver, clearOverlay,
    refs: R,
  };
})();
