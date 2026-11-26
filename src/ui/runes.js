/* =========================================================
 * 魔符界面
 *
 * 底图 assets/rune.png。左侧角色窗口和升级界面同款；
 * 右上两个方框是已装备魔符，右边长条是选中魔符的说明；
 * 下方 5×3 网格是本账号的全部魔符（按稀有度降序、同名相邻）。
 * ========================================================= */
const RuneUp = (function () {
  var BODY = { x: 59, y: 59, w: 215, h: 218 };
  var AVA = { x: 59, y: 298, w: 72, h: 80 };
  var BTN_W = 41, BTN_H = 20;
  var BTN_POS = [
    { x: 165, y: 311, label: '升级', key: 'level' },
    { x: 220, y: 311, label: '升星', key: 'star' },
    { x: 165, y: 345, label: '魔符', key: 'rune' },
    { x: 220, y: 345, label: '技能', key: 'skill' }
  ];

  var SLOTS = [
    { x: 359, y: 67, w: 63, h: 63 },
    { x: 448, y: 67, w: 63, h: 63 }
  ];
  var DESC = { x: 540, y: 67, w: 194, h: 63 };

  var CELL = 55;
  var CELL_X = [359, 439, 519, 599, 680];
  var CELL_Y = [172, 248, 323];
  var PER_PAGE = CELL_X.length * CELL_Y.length;   /* 15 */

  var ARROW = { w: 34, h: 62, y: 228 };
  var LEFT_X = 305, RIGHT_X = 742;

  var current = null;
  var page = 0;
  var selected = null;       /* 选中的库存下标 */
  var tipTimer = 0;

  function el(id) { return document.getElementById(id); }

  function fmt(n) {
    n = Math.round(n);
    if (n >= 100000000) return (n / 100000000) + '亿';
    if (n >= 10000) return (n / 10000) + '万';
    return String(n);
  }

  function tip(text) {
    var t = el('rnTip');
    if (!t) return;
    t.textContent = text;
    t.classList.add('on');
    if (tipTimer) clearTimeout(tipTimer);
    tipTimer = setTimeout(function () { t.classList.remove('on'); tipTimer = 0; }, 1500);
  }

  /* 库存排序：稀有度降序，同稀有度按名字（拼音/字符序） */
  function sortedList() {
    var list = PlayerState.runeList().slice();
    list.sort(function (a, b) {
      if (b.r !== a.r) return b.r - a.r;
      var an = (RUNN_DEF(a)).name, bn = (RUNN_DEF(b)).name;
      return an < bn ? -1 : (an > bn ? 1 : 0);
    });
    return list;
  }

  function RUNN_DEF(rec) { return RUNE.DEFS[rec.t] || { name: '???' }; }

  function render() {
    var grid = el('rnGrid');
    if (!grid || !current) return;

    var list = sortedList();
    var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (page >= pages) page = pages - 1;
    if (page < 0) page = 0;

    var eq = PlayerState.equippedOf(current.name);
    var html = '';

    /* 左侧角色 */
    html += '<div class="m-body" style="left:' + BODY.x + 'px;top:' + BODY.y +
            'px;width:' + BODY.w + 'px;height:' + BODY.h + 'px;">' +
            '<img class="m-full" src="' + current.full + '" alt=""></div>';
    html += '<div class="m-ava" style="left:' + AVA.x + 'px;top:' + AVA.y +
            'px;width:' + AVA.w + 'px;height:' + AVA.h + 'px;">' +
            '<img class="m-ava-img" src="' + current.avatar + '" alt="">' +
            '<div class="m-name">' + current.name + '</div></div>';

    for (var i = 0; i < BTN_POS.length; i++) {
      var b = BTN_POS[i];
      html += '<button type="button" class="m-btn' + (b.key === 'rune' ? ' on' : '') + '"' +
              ' data-act="' + b.key + '" style="left:' + b.x + 'px;top:' + b.y +
              'px;width:' + BTN_W + 'px;height:' + BTN_H + 'px;"><span>' + b.label + '</span></button>';
    }

    /* 两个装备位 */
    for (var s = 0; s < SLOTS.length; s++) {
      var sl = SLOTS[s];
      var rec = eq[s];
      html += '<button type="button" class="rn-slot' + (rec ? '' : ' empty') + '" data-slot="' + s +
              '" style="left:' + sl.x + 'px;top:' + sl.y + 'px;width:' + sl.w +
              'px;height:' + sl.h + 'px;">' +
              (rec ? '<img src="' + RUNE.sprite(rec.r, rec.t) + '" alt="">' : '') +
              '</button>';
    }

    /* 说明 */
    html += '<div class="rn-desc" style="left:' + (DESC.x + 8) + 'px;top:' + (DESC.y + 6) +
            'px;width:' + (DESC.w - 16) + 'px;height:' + (DESC.h - 12) + 'px;">' +
            descHtml(list) + '</div>';

    /* 库存网格 */
    var start = page * PER_PAGE;
    for (var k = 0; k < PER_PAGE; k++) {
      var idx = start + k;
      var cx = CELL_X[k % CELL_X.length];
      var cy = CELL_Y[Math.floor(k / CELL_X.length)];
      var item = list[idx];
      if (!item) {
        html += '<div class="rn-cell empty" style="left:' + cx + 'px;top:' + cy +
                'px;width:' + CELL + 'px;height:' + CELL + 'px;"></div>';
      } else {
        var on = (selected === idx);
        html += '<button type="button" class="rn-cell' + (on ? ' on' : '') + '" data-idx="' + idx +
                '" style="left:' + cx + 'px;top:' + cy + 'px;width:' + CELL +
                'px;height:' + CELL + 'px;">' +
                '<img src="' + RUNE.sprite(item.r, item.t) + '" alt=""></button>';
      }
    }

    /* 翻页箭头 */
    if (pages > 1) {
      html += '<button type="button" class="rn-arrow left"' + (page <= 0 ? ' disabled' : '') +
              ' id="rnPrev" style="left:' + LEFT_X + 'px;top:' + ARROW.y + 'px;width:' +
              ARROW.w + 'px;height:' + ARROW.h + 'px;"></button>';
      html += '<button type="button" class="rn-arrow right"' + (page >= pages - 1 ? ' disabled' : '') +
              ' id="rnNext" style="left:' + RIGHT_X + 'px;top:' + ARROW.y + 'px;width:' +
              ARROW.w + 'px;height:' + ARROW.h + 'px;"></button>';
    }

    grid.innerHTML = html;
    bindGrid(grid, list);
  }

  function descHtml(list) {
    if (selected == null || !list[selected]) {
      return '<div class="rn-none">未选择魔符</div>';
    }
    var rec = list[selected];
    var def = RUNN_DEF(rec);
    var color = RUNE.COLOR[rec.r] || '#fff2d6';
    return '<div class="rn-head"><span style="color:' + color + '">【' +
      RUNE.RARITY[rec.r] + '】' + def.name + '</span></div>' +
      '<div class="rn-body">' + RUNE.desc(rec.t, rec.r) + '</div>';
  }

  function bindGrid(grid, list) {
    var cells = grid.querySelectorAll('.rn-cell[data-idx]');
    for (var i = 0; i < cells.length; i++) {
      cells[i].addEventListener('click', function (e) {
        var idx = Number(e.currentTarget.getAttribute('data-idx'));
        if (selected === idx) {
          doEquip(list[idx]);
        } else {
          selected = idx;
          if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
          render();
        }
      });
    }

    var slots = grid.querySelectorAll('.rn-slot');
    for (var k = 0; k < slots.length; k++) {
      slots[k].addEventListener('click', function (e) {
        var s = Number(e.currentTarget.getAttribute('data-slot'));
        var eq = PlayerState.equippedOf(current.name);
        if (!eq[s]) return;
        eq[s] = null;
        PlayerState.save();
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        render();
      });
    }

    var prev = el('rnPrev');
    var next = el('rnNext');
    if (prev) prev.addEventListener('click', function () { page--; render(); });
    if (next) next.addEventListener('click', function () { page++; render(); });

    var btns = grid.querySelectorAll('.m-btn');
    for (var m = 0; m < btns.length; m++) {
      btns[m].addEventListener('click', function (e) {
        var act = e.currentTarget.getAttribute('data-act');
        if (act === 'rune') return;
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        if (RuneUp.onGrowth) RuneUp.onGrowth(act, e.currentTarget.textContent, current);
      });
    }
  }

  function doEquip(rec) {
    if (!rec) return;
    var eq = PlayerState.equippedOf(current.name);
    var slot = eq[0] ? (eq[1] ? 0 : 1) : 0;
    eq[slot] = { t: rec.t, r: rec.r };
    PlayerState.save();
    if (typeof Sfx !== 'undefined' && Sfx.select) Sfx.select();
    tip('装备 ' + RUNE.RARITY[rec.r] + '·' + RUNN_DEF(rec).name);
    render();
  }

  function open(ch) {
    current = ch || GUIDE_DEX[0];
    page = 0;
    selected = null;
    ['levelScreen', 'starScreen', 'skillScreen', 'manageScreen', 'guideScreen', 'subScreen', 'menuScreen']
      .forEach(function (id) {
        var n = el(id);
        if (n) n.classList.add('hidden');
      });
    var s = el('runeScreen');
    if (s) s.classList.remove('hidden');
    render();
  }

  function close() {
    var s = el('runeScreen');
    if (s) s.classList.add('hidden');
  }

  function bind() {
    var b = el('rnBack');
    if (b) {
      b.addEventListener('click', function () {
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        close();
        if (RuneUp.onClose) RuneUp.onClose();
      });
    }
  }

  return {
    open: open,
    close: close,
    render: render,
    bind: bind,
    onClose: null,
    onGrowth: null
  };
})();
