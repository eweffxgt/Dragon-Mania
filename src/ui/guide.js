/* =========================================================
 * 图鉴界面
 *
 * 底图直接用 assets/guide.png（整张「图鉴界面」），
 * 16 个窗口（8 列 × 2 行）的位置是从原图 5970×3000 上量出来的，
 * 换算成 840×420 设计坐标后写死在下面。
 * ========================================================= */
const Guide = (function () {
  /* ---------- 版式（设计像素，来自原图测量） ---------- */
  var COLS = [59.1, 152.0, 244.8, 337.7, 430.6, 523.4, 616.3, 709.1];
  var ROWS = [84.0, 222.6];
  var SLOT_W = 71.6;
  var SLOT_H = 79.7;
  var BAR_DY = 14.7;   /* 元素条相对窗口底部的偏移（含图标下移，视觉居中） */
  var BAR_H = 29.6;

  var page = 0;

  function el(id) {
    return document.getElementById(id);
  }

  function pageCount() {
    return Math.max(1, Math.ceil(GUIDE_LIST().length / GUIDE_PER_PAGE));
  }

  function slotPos(i) {
    var col = i % 8;
    var row = Math.floor(i / 8);
    return {
      l: COLS[col],
      t: ROWS[row],
      w: SLOT_W,
      h: SLOT_H,
      bl: COLS[col] + 2,
      bt: ROWS[row] + SLOT_H + BAR_DY,
      bw: SLOT_W - 4
    };
  }

  function iconHtml(eid) {
    var e = (typeof ELEMENTS !== 'undefined' && ELEMENTS[eid]) || null;
    var src = e && e.iconUrl ? e.iconUrl : '';
    if (!src) return '';
    return '<img class="g-icon" src="' + src + '" alt="">';
  }

  function render() {
    var grid = el('guideGrid');
    if (!grid) return;

    var start = page * GUIDE_PER_PAGE;
    var html = '';

    for (var i = 0; i < GUIDE_PER_PAGE; i++) {
      var list = GUIDE_LIST();
    var d = list[start + i];
      var p = slotPos(i);

      /* 窗口：头像 + 底部名字条（和战斗界面同一套样式） */
      html += '<div class="g-slot" style="left:' + p.l + 'px;top:' + p.t +
              'px;width:' + p.w + 'px;height:' + p.h + 'px;">';
      html += '<img class="g-ava" src="' + (d ? d.avatar : GUIDE_BLANK_AVATAR) + '" alt="">';
      if (d) html += '<div class="g-name">' + d.name + '</div>';
      html += '</div>';

      /* 元素条：窗口下方横向均匀排列 */
      html += '<div class="g-bar" style="left:' + p.bl + 'px;top:' + p.bt +
              'px;width:' + p.bw + 'px;height:' + BAR_H + 'px;">';
      if (d) {
        for (var k = 0; k < d.elements.length; k++) {
          html += iconHtml(d.elements[k]);
        }
      }
      html += '</div>';
    }

    grid.innerHTML = html;

    /* 箭头可用状态 */
    var prev = el('guidePrev');
    var next = el('guideNext');
    if (prev) prev.disabled = page <= 0;
    if (next) next.disabled = page >= pageCount() - 1;
  }

  function open(startPage) {
    page = 0;
    if (startPage != null && !isNaN(startPage)) {
      page = Math.max(0, Math.min(pageCount() - 1, Math.floor(startPage)));
    }
    render();
    var s = el('guideScreen');
    if (s) s.classList.remove('hidden');
    if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
  }

  function close() {
    var s = el('guideScreen');
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
    var p = el('guidePrev');
    var n = el('guideNext');
    var b = el('guideBack');
    if (p) p.addEventListener('click', prev);
    if (n) n.addEventListener('click', next);
    if (b) {
      b.addEventListener('click', function () {
        close();
        if (typeof Guide !== 'undefined' && Guide.onClose) Guide.onClose();
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
    pageCount: pageCount
  };
})();
