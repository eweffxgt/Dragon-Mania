/* =========================================================
 * 技能界面
 *
 * 底图 assets/skill.png（整张「技能界面」）。左侧角色窗口和升级界面
 * 同款；右上红色区域显示当前选中技能的效果；右下三行，每行一个
 * 元素技能：元素图标 + 6 个等级格 + UP 按钮。
 *
 * 等级：0 = 普通攻击，1-5 = 非精通，6 = 精通（满级）
 * 升级花金币，价格见 SKILL_COST。
 * ========================================================= */
const SkillUp = (function () {
  /* ---------- 版式（设计像素，按原图 5970×3000 量出来） ---------- */
  var BODY = { x: 59, y: 59, w: 215, h: 218 };
  var AVA = { x: 59, y: 298, w: 72, h: 80 };
  var BTN_W = 41, BTN_H = 20;
  var BTN_POS = [
    { x: 165, y: 311, label: '升级', key: 'level' },
    { x: 220, y: 311, label: '升星', key: 'star' },
    { x: 165, y: 345, label: '魔符', key: 'rune' },
    { x: 220, y: 345, label: '技能', key: 'skill' }
  ];

  var DESC = { x: 322, y: 67, w: 449, h: 113 };

  /* 三行的纵向位置 */
  var ROW_Y = [206, 269, 332];
  /* 每行六个等级格 */
  var CELL_X = [384, 435, 485, 536, 587, 637];
  var CELL_W = 25, CELL_H = 38;
  /* 元素图标：底图图标框内芯（源图实测）设计坐标
   *   x 320.80..358.79  y 205.80..243.60，中心 (339.73, 224.63)
   * 每行往下 63px 重复；32×32 的图标严格居中到内芯中心。 */
  var ICON_IMG = 32;
  var ICON_LEFT = 323.73;        /* 339.73 - 16 */
  var ICON_TOP_OFFSET = 2.63;    /* rowY 206 -> 208.63，中心 224.63 */
  /* UP 按钮 */
  var UP = { x: 692, w: 76, h: 29, dy: 4 };

  var wallet = PlayerState.wallet;
  var current = null;
  var selected = null;      /* 当前选中的元素 id */
  var tipTimer = 0;

  function el(id) { return document.getElementById(id); }

  function stateOf(ch) {
    if (!ch) return null;
    return PlayerState.entry(ch.name, ch.level);
  }

  function elementsOf(ch) {
    return (ch && ch.elements ? ch.elements : []).slice(0, 3);
  }

  function fmt(n) {
    n = Math.round(n);
    if (n >= 100000000) {
      var y = n / 100000000;
      return (y % 1 === 0 ? y : y.toFixed(1)) + '亿';
    }
    if (n >= 10000) {
      var w = n / 10000;
      return (w % 1 === 0 ? w : w.toFixed(1)) + '万';
    }
    return String(n);
  }

  function elemName(elId) {
    var e = (typeof ELEMENTS !== 'undefined') ? ELEMENTS[elId] : null;
    return e ? e.name : elId;
  }

  function tip(text) {
    var t = el('skTip');
    if (!t) return;
    t.textContent = text;
    t.classList.add('on');
    if (tipTimer) clearTimeout(tipTimer);
    tipTimer = setTimeout(function () {
      t.classList.remove('on');
      tipTimer = 0;
    }, 1500);
  }

  function render() {
    var grid = el('skGrid');
    if (!grid || !current) return;

    var st = stateOf(current);
    var els = elementsOf(current);
    var levels = st.skills || {};
    var html = '';

    /* 全身图 */
    html += '<div class="m-body" style="left:' + BODY.x + 'px;top:' + BODY.y +
            'px;width:' + BODY.w + 'px;height:' + BODY.h + 'px;">' +
            '<img class="m-full" src="' + current.full + '" alt=""></div>';

    /* 头像 + 名字 */
    html += '<div class="m-ava" style="left:' + AVA.x + 'px;top:' + AVA.y +
            'px;width:' + AVA.w + 'px;height:' + AVA.h + 'px;">' +
            '<img class="m-ava-img" src="' + current.avatar + '" alt="">' +
            '<div class="m-name">' + current.name + '</div></div>';

    /* 四个按钮 */
    for (var i = 0; i < BTN_POS.length; i++) {
      var b = BTN_POS[i];
      html += '<button type="button" class="m-btn' + (b.key === 'skill' ? ' on' : '') + '"' +
              ' data-act="' + b.key + '" style="left:' + b.x + 'px;top:' + b.y +
              'px;width:' + BTN_W + 'px;height:' + BTN_H + 'px;">' +
              '<span>' + b.label + '</span></button>';
    }

    /* 右上：技能说明 */
    html += '<div class="sk-desc" style="left:' + (DESC.x + 12) + 'px;top:' + (DESC.y + 10) +
            'px;width:' + (DESC.w - 24) + 'px;height:' + (DESC.h - 20) + 'px;">' +
            descHtml(els, levels) + '</div>';

    /* 时间到 3 行 */
    for (var r = 0; r < els.length && r < 3; r++) {
      var elId = els[r];
      var lv = Math.floor(Number(levels[elId]) || 0);
      var y = ROW_Y[r];
      var on = (selected === elId);

      /* 行选择热区（图标 + 六个格子） */
      var rowLeft = 316;
      var rowW = (CELL_X[CELL_X.length - 1] + CELL_W) - rowLeft;
      html += '<button type="button" class="sk-row' + (on ? ' on' : '') + '" data-el="' + elId + '"' +
              ' style="left:' + rowLeft + 'px;top:' + (y - 6) + 'px;width:' + rowW +
              'px;height:' + (CELL_H + 12) + 'px;"></button>';

      /* 元素图标 */
      var icon = (typeof ELEMENTS !== 'undefined' && ELEMENTS[elId] && ELEMENTS[elId].iconUrl) || '';
      html += '<div class="sk-icon" style="left:' + ICON_LEFT +
              'px;top:' + (y + ICON_TOP_OFFSET) + 'px;width:' + ICON_IMG +
              'px;height:' + ICON_IMG + 'px;">' +
              (icon ? '<img src="' + icon + '" alt="">' : '') + '</div>';

      /* 6 个等级格 */
      for (var c = 0; c < CELL_X.length; c++) {
        var filled = c < lv;
        html += '<div class="sk-cell' + (filled ? ' on' : '') + (filled && lv >= 6 ? ' max' : '') +
                '" style="left:' + CELL_X[c] + 'px;top:' + y + 'px;width:' + CELL_W +
                'px;height:' + CELL_H + 'px;"></div>';
      }

      /* UP 按钮 */
      var cost = (typeof skillCostOf === 'function') ? skillCostOf(lv) : 0;
      var maxed = lv >= 6;
      var afford = !maxed && wallet.gold >= cost;
      html += '<button type="button" class="sk-up' + (afford ? '' : ' off') + '"' +
              ' data-el="' + elId + '"' +
              ' style="left:' + UP.x + 'px;top:' + (y + UP.dy) + 'px;width:' + UP.w +
              'px;height:' + UP.h + 'px;"></button>';
    }

    grid.innerHTML = html;
    bindGrid(grid);
  }

  /* 红框内容：选中的技能说明；没选就提示未选择 */
  function descHtml(els, levels) {
    if (!selected || els.indexOf(selected) < 0) {
      return '<div class="sk-none">未选择技能</div>';
    }
    var lv = Math.floor(Number(levels[selected]) || 0);
    var card = (typeof skillAt === 'function') ? skillAt(selected, lv) : null;
    if (!card) return '<div class="sk-none">未选择技能</div>';

    var head = elemName(selected) + ' · ' + card.name +
      '<span class="sk-lv">Lv.' + lv + (lv >= 6 ? ' 精通' : '') + '</span>';
    var cost = (typeof skillCostOf === 'function') ? skillCostOf(lv) : 0;
    var foot = (lv >= 6)
      ? '已精通'
      : '升级消耗 ' + fmt(cost) + ' 金币（持有 ' + fmt(wallet.gold) + '）';

    return '<div class="sk-head">' + head + '</div>' +
           '<div class="sk-body">' + card.desc + '</div>' +
           '<div class="sk-foot' + (lv >= 6 ? ' ok' : (wallet.gold < cost ? ' bad' : '')) + '">' +
           foot + '</div>';
  }

  function bindGrid(grid) {
    var rows = grid.querySelectorAll('.sk-row');
    for (var i = 0; i < rows.length; i++) {
      rows[i].addEventListener('click', function (e) {
        selected = e.currentTarget.getAttribute('data-el');
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        render();
      });
    }

    var ups = grid.querySelectorAll('.sk-up');
    for (var k = 0; k < ups.length; k++) {
      ups[k].addEventListener('click', function (e) {
        doUpgrade(e.currentTarget.getAttribute('data-el'));
      });
    }

    var btns = grid.querySelectorAll('.m-btn');
    for (var m = 0; m < btns.length; m++) {
      btns[m].addEventListener('click', function (e) {
        var act = e.currentTarget.getAttribute('data-act');
        if (act === 'skill') return;
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        if (SkillUp.onGrowth) SkillUp.onGrowth(act, e.currentTarget.textContent, current);
      });
    }
  }

  function doUpgrade(elId) {
    if (!current || !elId) return;
    var lv = PlayerState.skillLevel(current.name, elId);
    if (lv >= 6) {
      tip('已经精通了');
      return;
    }
    var cost = (typeof skillCostOf === 'function') ? skillCostOf(lv) : 0;
    if (wallet.gold < cost) {
      tip('金币不足');
      return;
    }
    wallet.gold -= cost;
    PlayerState.setSkillLevel(current.name, elId, lv + 1);
    PlayerState.save();
    selected = elId;
    if (typeof Sfx !== 'undefined' && Sfx.select) Sfx.select();
    tip(elemName(elId) + ' 升到 Lv.' + (lv + 1));
    render();
  }

  /* ---------- 打开 / 关闭 ---------- */
  function open(ch, debugEl, debugLv) {
    current = ch || GUIDE_DEX[0];
    if (debugEl && debugLv != null && !isNaN(debugLv)) {
      PlayerState.setSkillLevel(current.name, debugEl, debugLv);
    }
    selected = null;

    ['levelScreen', 'starScreen', 'manageScreen', 'guideScreen', 'subScreen', 'menuScreen']
      .forEach(function (id) {
        var n = el(id);
        if (n) n.classList.add('hidden');
      });
    var s = el('skillScreen');
    if (s) s.classList.remove('hidden');
    render();
  }

  function close() {
    var s = el('skillScreen');
    if (s) s.classList.add('hidden');
  }

  function bind() {
    var b = el('skBack');
    if (b) {
      b.addEventListener('click', function () {
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        close();
        if (SkillUp.onClose) SkillUp.onClose();
      });
    }
  }

  return {
    open: open,
    close: close,
    render: render,
    bind: bind,
    onClose: null,
    onGrowth: null,
    stateOf: stateOf
  };
})();
