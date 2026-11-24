/* =========================================================
 * 角色选择界面
 *
 * 点主界面的 FIGHT 先到这里：上方三个大窗口是上场的三条龙，
 * 下方长条可以横向滑动，显示已拥有的角色头像。
 * 依次点三个头像选满阵容 → 弹窗确认 → 是进战斗，否重新选。
 *
 * 坐标按「角色选择界面.png」原图 5970×3000 量出来（设计像素）。
 * ========================================================= */
const Select = (function () {
  var WINS = [
    { x: 59, y: 59, w: 215, h: 218 },
    { x: 312, y: 59, w: 216, h: 218 },
    { x: 566, y: 59, w: 215, h: 218 }
  ];
  var STRIP = { x: 59, y: 298, w: 722, h: 80 };

  var CELL_W = 74;      /* 每个头像格子宽 */
  var AVA_W = 58;
  var AVA_H = 65;

  var picks = [];       /* 已选角色 */
  var asking = false;   /* 是否正在弹确认窗 */

  function el(id) { return document.getElementById(id); }

  function owned() {
    return (typeof GUIDE_DEX !== 'undefined') ? GUIDE_DEX : [];
  }

  function render() {
    var grid = el('selectGrid');
    if (!grid) return;

    var html = '';

    /* 上方三个窗口 */
    for (var i = 0; i < 3; i++) {
      var w = WINS[i];
      var ch = picks[i];
      html += '<div class="sel-win' + (ch ? '' : ' empty') + '" style="left:' + w.x +
              'px;top:' + w.y + 'px;width:' + w.w + 'px;height:' + w.h + 'px;">';
      html += '<img class="sel-full" src="' + (ch ? ch.full : GUIDE_BLANK_FULL) + '" alt="">';
      if (ch) {
        html += '<div class="sel-name">' + ch.name + '</div>';
      } else if (i === picks.length) {
        html += '<div class="sel-hint">选择第 ' + (i + 1) + ' 位</div>';
      }
      html += '</div>';
    }

    /* 下方头像条 */
    html += '<div class="sel-strip" id="selStrip" style="left:' + STRIP.x + 'px;top:' +
            STRIP.y + 'px;width:' + STRIP.w + 'px;height:' + STRIP.h + 'px;">';
    html += '<div class="sel-track" style="width:' + (owned().length * CELL_W + 12) + 'px;">';
    owned().forEach(function (c) {
      var used = picks.indexOf(c) >= 0;
      html += '<button type="button" class="sel-cell' + (used ? ' used' : '') + '"' +
              ' data-name="' + c.name + '" title="' + c.name + '"' +
              ' style="width:' + CELL_W + 'px;">' +
              '<img src="' + c.avatar + '" alt="" style="width:' + AVA_W +
              'px;height:' + AVA_H + 'px;">' +
              (used ? '<i class="sel-mark">✓</i>' : '') +
              '</button>';
    });
    html += '</div></div>';

    grid.innerHTML = html;
    bindStrip();
  }

  function bindStrip() {
    var strip = el('selStrip');
    if (!strip) return;

    /* 鼠标滚轮 → 横向滚动 */
    strip.addEventListener('wheel', function (e) {
      if (e.deltaY === 0) return;
      strip.scrollLeft += e.deltaY;
      e.preventDefault();
    }, { passive: false });

    /* 按住拖动 */
    var down = false, startX = 0, startLeft = 0, moved = 0;
    strip.addEventListener('pointerdown', function (e) {
      down = true; moved = 0;
      startX = e.clientX; startLeft = strip.scrollLeft;
      strip.classList.add('dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > moved) moved = Math.abs(dx);
      strip.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      strip.classList.remove('dragging');
    });

    var cells = strip.querySelectorAll('.sel-cell');
    for (var i = 0; i < cells.length; i++) {
      cells[i].addEventListener('click', function (e) {
        if (moved > 6) return;            /* 拖动时不触发选择 */
        var name = e.currentTarget.getAttribute('data-name');
        pickByName(name);
      });
    }
  }

  function pickByName(name) {
    if (asking || picks.length >= 3) return;
    var list = owned();
    var ch = null;
    for (var i = 0; i < list.length; i++) if (list[i].name === name) ch = list[i];
    if (!ch) return;
    if (picks.indexOf(ch) >= 0) return;

    picks.push(ch);
    if (typeof Sfx !== 'undefined' && Sfx.select) Sfx.select();
    render();

    if (picks.length === 3) askConfirm();
  }

  /* ---------- 确认弹窗 ---------- */
  function askConfirm() {
    asking = true;
    var box = el('selConfirm');
    if (!box) return;
    var names = picks.map(function (c) { return c.name; }).join('　·　');
    var t = el('selConfirmTeam');
    if (t) t.textContent = names;
    box.classList.remove('hidden');
  }

  function hideConfirm() {
    asking = false;
    var box = el('selConfirm');
    if (box) box.classList.add('hidden');
  }

  function confirmYes() {
    hideConfirm();
    var team = picks.slice();
    if (typeof Sfx !== 'undefined' && Sfx.select) Sfx.select();
    close();
    if (Select.onConfirm) Select.onConfirm(team);
  }

  function confirmNo() {
    hideConfirm();
    picks = [];
    if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
    render();
  }

  /* ---------- 开关 ---------- */
  function open() {
    picks = [];
    asking = false;
    hideConfirm();
    var s = el('selectScreen');
    if (s) s.classList.remove('hidden');
    render();
    var strip = el('selStrip');
    if (strip) strip.scrollLeft = 0;
  }

  function close() {
    var s = el('selectScreen');
    if (s) s.classList.add('hidden');
  }

  function bind() {
    var yes = el('selYes');
    var no = el('selNo');
    var back = el('selBack');
    if (yes) yes.addEventListener('click', confirmYes);
    if (no) no.addEventListener('click', confirmNo);
    if (back) {
      back.addEventListener('click', function () {
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        close();
        if (Select.onClose) Select.onClose();
      });
    }
  }

  return {
    open: open,
    close: close,
    render: render,
    bind: bind,
    onConfirm: null,
    onClose: null
  };
})();
