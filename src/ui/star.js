/* =========================================================
 * 升星界面
 *
 * 底图 assets/star.png（整张「升星界面」）。左侧角色窗口和升级界面
 * 同款；右上 4 个星位 + USE；右中金币 / 对应元素水晶；右下三档水晶商店。
 *
 * 星级 0~16：
 *   1-4 黄星 → 5-8 逐颗换粉星 → 9-12 换暗红星 → 13-16 换彩星
 * 升星消耗角色「第一个元素」对应的水晶。
 * ========================================================= */
const StarUp = (function () {
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

  /* 4 个星位：底图里星形洞口的实测外框（源 360×330，间距 510），
   * 换算到设计坐标 50.65×46.2；星贴图与洞口是同一张图，1:1 覆盖即可严丝合缝。 */
  var SLOT_W = 50.65, SLOT_H = 46.2, SLOT_Y = 50.4;
  var SLOT_X = [350.35, 422.11, 493.87, 565.63];

  var USE = { x: 680, y: 55, w: 105, h: 37 };

  var GOLD_BOX = { x: 515, y: 126, w: 97, h: 29 };
  var CRY_BOX = { x: 684, y: 126, w: 97, h: 29 };

  var CARDS = [
    { x: 336, y: 198, w: 121, h: 158 },
    { x: 488, y: 198, w: 121, h: 158 },
    { x: 640, y: 198, w: 121, h: 158 }
  ];

  var wallet = PlayerState.wallet;
  var current = null;
  var tipTimer = 0;
  var pendingConfirm = false;

  function el(id) { return document.getElementById(id); }

  function stateOf(ch) {
    if (!ch) return null;
    return PlayerState.entry(ch.name, ch.level);
  }

  /* 角色第一个元素 → 水晶元素 id */
  function crystalElement(ch) {
    if (!ch) return 'ancient';
    var els = ch.elements || [];
    return els[0] || 'ancient';
  }

  function crystalName(element) {
    var e = (typeof ELEMENTS !== 'undefined') ? ELEMENTS[element] : null;
    return (e ? e.name : '未知') + '水晶';
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

  function tip(text) {
    var t = el('stTip');
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
    var grid = el('stGrid');
    if (!grid || !current) return;

    var st = stateOf(current);
    var stars = st.stars || 0;
    var ele = crystalElement(current);
    var have = PlayerState.crystalOf(ele);
    var cost = STAR.costOf(stars);
    var maxed = stars >= STAR.MAX;
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
      html += '<button type="button" class="m-btn' + (b.key === 'star' ? ' on' : '') + '"' +
              ' data-act="' + b.key + '" style="left:' + b.x + 'px;top:' + b.y +
              'px;width:' + BTN_W + 'px;height:' + BTN_H + 'px;">' +
              '<span>' + b.label + '</span></button>';
    }

    /* 4 个星位 */
    var slots = STAR.slots(stars);
    for (var k = 0; k < 4; k++) {
      var kind = slots[k];
      var x = SLOT_X[k];
      if (kind > 0) {
        html += '<img class="st-star" src="' + STAR.SPRITE[kind - 1] + '" alt=""' +
                ' style="left:' + x + 'px;top:' + SLOT_Y + 'px;width:' + SLOT_W +
                'px;height:' + SLOT_H + 'px;">';
      }
      html += '<div class="st-slot" style="left:' + x + 'px;top:' + SLOT_Y +
              'px;width:' + SLOT_W + 'px;height:' + SLOT_H + 'px;"></div>';
    }

    /* USE */
    var canUse = !maxed && have >= cost;
    html += '<button type="button" class="st-use' + (canUse ? '' : ' off') + '" id="stUse"' +
            ' style="left:' + USE.x + 'px;top:' + USE.y + 'px;width:' + USE.w +
            'px;height:' + USE.h + 'px;"></button>';

    /* 金币 / 水晶 */
    html += '<div class="lv-bal" style="left:' + GOLD_BOX.x + 'px;top:' + GOLD_BOX.y +
            'px;width:' + GOLD_BOX.w + 'px;height:' + GOLD_BOX.h + 'px;">' + fmt(wallet.gold) + '</div>';
    html += '<div class="lv-bal st-cry" style="left:' + CRY_BOX.x + 'px;top:' + CRY_BOX.y +
            'px;width:' + CRY_BOX.w + 'px;height:' + CRY_BOX.h + 'px;" title="' +
            crystalName(ele) + '">' + fmt(have) + '</div>';

    /* 消耗提示（贴在 USE 左边的空档） */
    /* 消耗提示：放在星位下方的黄色空隙里，右对齐到第 4 颗星 */
    var costLeft = 596, costW = 74, costTop = 63;
    if (maxed) {
      html += '<div class="st-cost maxed" style="left:' + costLeft + 'px;top:' + costTop +
              'px;width:' + costW + 'px;">满星</div>';
    } else {
      html += '<div class="st-cost' + (have >= cost ? '' : ' off') + '" style="left:' + costLeft +
              'px;top:' + costTop + 'px;width:' + costW + 'px;" title="' + crystalName(ele) +
              '">消耗<br>' + fmt(cost) + ' 水晶</div>';
    }

    /* 三个水晶商品 */
    for (var m = 0; m < CARDS.length; m++) {
      var c = CARDS[m];
      var n = STAR.PACKS[m];
      var price = STAR.packPrice(n);
      var afford = wallet.gold >= price;
      var ix = c.x + 8, iw = 97;

      html += '<div class="lv-qty" style="left:' + ix + 'px;top:' + (c.y + 14) +
              'px;width:' + iw + 'px;">' + fmt(n) + ' ' + crystalName(ele) + '</div>';
      html += '<div class="lv-price' + (afford ? '' : ' off') + '" style="left:' + ix +
              'px;top:' + (c.y + 27) + 'px;width:' + iw + 'px;">' + fmt(price) + ' 金</div>';
      var bx = c.x + 6, bw = 105, by = c.y + 113, bh = 29;
      html += '<button type="button" class="lv-buy' + (afford ? '' : ' off') + '"' +
              ' data-idx="' + m + '" style="left:' + bx + 'px;top:' + by +
              'px;width:' + bw + 'px;height:' + bh + 'px;"></button>';
    }

    grid.innerHTML = html;
    bindGrid(grid);
  }

  function bindGrid(grid) {
    var use = el('stUse');
    if (use) use.addEventListener('click', askUpgrade);

    var buys = grid.querySelectorAll('.lv-buy');
    for (var i = 0; i < buys.length; i++) {
      buys[i].addEventListener('click', function (e) {
        doBuy(Number(e.currentTarget.getAttribute('data-idx')));
      });
    }

    var btns = grid.querySelectorAll('.m-btn');
    for (var k = 0; k < btns.length; k++) {
      btns[k].addEventListener('click', function (e) {
        var act = e.currentTarget.getAttribute('data-act');
        if (act === 'star') return;
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        if (StarUp.onGrowth) StarUp.onGrowth(act, e.currentTarget.textContent, current);
      });
    }
  }

  /* ---------- 升星流程：先弹确认，再扣水晶 ---------- */
  function askUpgrade() {
    if (!current) return;
    var st = stateOf(current);
    var stars = st.stars || 0;
    if (stars >= STAR.MAX) {
      tip('已经满星了');
      return;
    }
    var ele = crystalElement(current);
    var cost = STAR.costOf(stars);
    var have = PlayerState.crystalOf(ele);
    if (have < cost) {
      tip(crystalName(ele) + '不足');
      return;
    }

    var dialog = el('stConfirm');
    var title = el('stConfirmTitle');
    if (title) {
      title.textContent = '当前升星消耗 ' + cost + ' ' + crystalName(ele) + '，是否继续';
    }
    if (dialog) dialog.classList.remove('hidden');
    pendingConfirm = true;
    if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
  }

  function closeConfirm() {
    var dialog = el('stConfirm');
    if (dialog) dialog.classList.add('hidden');
    pendingConfirm = false;
  }

  function doUpgrade() {
    closeConfirm();
    if (!current) return;
    var st = stateOf(current);
    var stars = st.stars || 0;
    if (stars >= STAR.MAX) return;
    var ele = crystalElement(current);
    var cost = STAR.costOf(stars);
    if (!PlayerState.spendCrystal(ele, cost)) {
      tip(crystalName(ele) + '不足');
      return;
    }
    st.stars = stars + 1;
    PlayerState.save();
    if (typeof Sfx !== 'undefined' && Sfx.select) Sfx.select();
    tip('升星成功 → ' + st.stars + ' 星');
    render();
  }

  function doBuy(idx) {
    var n = STAR.PACKS[idx];
    if (!n || !current) return;
    var price = STAR.packPrice(n);
    if (wallet.gold < price) {
      tip('金币不足');
      return;
    }
    var ele = crystalElement(current);
    wallet.gold -= price;
    PlayerState.addCrystal(ele, n);
    PlayerState.save();
    if (typeof Sfx !== 'undefined' && Sfx.select) Sfx.select();
    tip('购买成功：+' + fmt(n) + ' ' + crystalName(ele));
    render();
  }

  /* ---------- 打开 / 关闭 ---------- */
  function open(ch, debugStars) {
    current = ch || GUIDE_DEX[0];
    var st0 = stateOf(current);
    if (debugStars != null && !isNaN(debugStars)) {
      st0.stars = Math.max(0, Math.min(STAR.MAX, Math.floor(debugStars)));
    }
    /* 打开时把其它界面收起来，避免叠在一起 */
    ['levelScreen', 'manageScreen', 'guideScreen', 'subScreen', 'menuScreen'].forEach(function (id) {
      var n = el(id);
      if (n) n.classList.add('hidden');
    });
    var s = el('starScreen');
    if (s) s.classList.remove('hidden');
    closeConfirm();
    render();
  }

  function close() {
    closeConfirm();
    var s = el('starScreen');
    if (s) s.classList.add('hidden');
  }

  function bind() {
    var b = el('stBack');
    if (b) {
      b.addEventListener('click', function () {
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        close();
        if (StarUp.onClose) StarUp.onClose();
      });
    }
    var yes = el('stYes');
    if (yes) yes.addEventListener('click', doUpgrade);
    var no = el('stNo');
    if (no) no.addEventListener('click', closeConfirm);
  }

  return {
    open: open,
    close: close,
    render: render,
    bind: bind,
    onClose: null,
    onGrowth: null,
    stateOf: stateOf,
    crystalElement: crystalElement,
    crystalName: crystalName
  };
})();
