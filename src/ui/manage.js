/* =========================================================
 * 管理界面
 *
 * 底图直接用 assets/manage.png（整张「管理界面」）。
 * 一页三个角色窗口（x 59.1 / 312.4 / 565.6，宽 215.3），
 * 窗口内：上方全身图，下方左边头像+名字、右边 2×2 四个按钮。
 * 坐标都是从原图 5970×3000 上量出来的设计像素。
 * ========================================================= */
const Manage = (function () {
  /* ---------- 版式 ---------- */
  var WIN_X = [59.1, 312.4, 565.6];
  var WIN_W = 215.3;
  var PER_PAGE = 3;

  var BODY_Y = 58.8;
  var BODY_H = 218.4;

  var AVA_Y = 298.2;
  var AVA_W = 71.8;
  var AVA_H = 79.8;

  var BTN_W = 38.0;
  var BTN_H = 16.8;
  /* 相对窗口左边的偏移 */
  var BTN_POS = [
    { x: 109.7, y: 315.0, label: '升级', key: 'level' },
    { x: 164.6, y: 315.0, label: '升星', key: 'star' },
    { x: 109.7, y: 348.6, label: '魔符', key: 'rune' },
    { x: 164.6, y: 348.6, label: '技能', key: 'skill' },
  ];

  var page = 0;
  var onOpen = null;   /* 打开养成子界面时的回调，由 main.js 注入 */

  function el(id) {
    return document.getElementById(id);
  }

  function pageCount() {
    return Math.max(1, Math.ceil(GUIDE_DEX.length / PER_PAGE));
  }

  function render() {
    var grid = el('manageGrid');
    if (!grid) return;

    var start = page * PER_PAGE;
    var html = '';

    for (var i = 0; i < PER_PAGE; i++) {
      var d = GUIDE_DEX[start + i];
      var wx = WIN_X[i];

      /* 全身图 */
      html += '<div class="m-body" style="left:' + wx + 'px;top:' + BODY_Y +
              'px;width:' + WIN_W + 'px;height:' + BODY_H + 'px;">';
      html += '<img class="m-full" src="' + (d ? d.full : GUIDE_BLANK_FULL) + '" alt="">';
      html += '</div>';

      /* 头像 + 名字 */
      html += '<div class="m-ava" style="left:' + wx + 'px;top:' + AVA_Y +
              'px;width:' + AVA_W + 'px;height:' + AVA_H + 'px;">';
      html += '<img class="m-ava-img" src="' + (d ? d.avatar : GUIDE_BLANK_AVATAR) + '" alt="">';
      if (d) html += '<div class="m-name">' + d.name + '</div>';
      html += '</div>';

      /* 四个按钮 */
      for (var k = 0; k < BTN_POS.length; k++) {
        var b = BTN_POS[k];
        html += '<button type="button" class="m-btn' + (d ? '' : ' off') + '"' +
                ' data-act="' + b.key + '" data-idx="' + i + '"' +
                (d ? '' : ' disabled') +
                ' style="left:' + (wx + b.x) + 'px;top:' + b.y +
                'px;width:' + BTN_W + 'px;height:' + BTN_H + 'px;">' + b.label + '</button>';
      }
    }

    grid.innerHTML = html;

    var prev = el('managePrev');
    var next = el('manageNext');
    if (prev) prev.disabled = page <= 0;
    if (next) next.disabled = page >= pageCount() - 1;

    /* 按钮事件 */
    var btns = grid.querySelectorAll('.m-btn');
    for (var n = 0; n < btns.length; n++) {
      btns[n].addEventListener('click', function (e) {
        var b = e.currentTarget;
        if (b.disabled) return;
        var idx = page * PER_PAGE + Number(b.getAttribute('data-idx'));
        var ch = GUIDE_DEX[idx];
        if (!ch) return;
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        if (onOpen) onOpen(b.getAttribute('data-act'), b.textContent, ch);
      });
    }
  }

  function open(startPage) {
    page = 0;
    if (startPage != null && !isNaN(startPage)) {
      page = Math.max(0, Math.min(pageCount() - 1, Math.floor(startPage)));
    }
    render();
    var s = el('manageScreen');
    if (s) s.classList.remove('hidden');
  }

  function close() {
    var s = el('manageScreen');
    if (s) s.classList.add('hidden');
  }

  function prev() {
    if (page <= 0) return;
    page--;
    render();
    if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
  }

  function next() {
    if (page >= pageCount() - 1) return;
    page++;
    render();
    if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
  }

  function bind() {
    var p = el('managePrev');
    var n = el('manageNext');
    var b = el('manageBack');
    if (p) p.addEventListener('click', prev);
    if (n) n.addEventListener('click', next);
    if (b) {
      b.addEventListener('click', function () {
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        close();
        if (Manage.onClose) Manage.onClose();
      });
    }
  }

  return {
    open: open,
    close: close,
    render: render,
    prev: prev,
    next: next,
    bind: bind,
    onClose: null,
    setOnOpen: function (fn) { onOpen = fn; },
    pageCount: pageCount
  };
})();
