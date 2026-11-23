/* =========================================================
 * 升级界面（喂养果实升级）
 *
 * 底图 assets/level.png（整张「升级界面」）。左侧是角色窗口
 * （和管理界面同款），右侧上方是等级 + 喂养进度条 + FEED，
 * 下方是金币/果实余额和三个果实商品。
 *
 * 养成数据暂时只存在内存里（还没做存档），刷新会重置。
 * ========================================================= */
const LevelUp = (function () {
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

  var LV_BOX = { x: 308, y: 55, w: 38, h: 37 };      /* 等级小方框 */
  var BAR = { x: 363, y: 59, w: 300, h: 29 };        /* 喂养进度条 */
  var FEED = { x: 680, y: 55, w: 105, h: 37 };       /* FEED 按钮 */

  var GOLD_BOX = { x: 515, y: 126, w: 97, h: 29 };   /* 金币数 */
  var FRUIT_BOX = { x: 684, y: 126, w: 97, h: 29 };  /* 果实数 */

  var CARDS = [
    { x: 336, y: 198, w: 121, h: 158 },
    { x: 488, y: 198, w: 121, h: 158 },
    { x: 640, y: 198, w: 121, h: 158 }
  ];

  /* ---------- 数值（这几个数是拍板的占位，改这里就能调） ---------- */
  var START_GOLD = 1000000;      /* 初始金币 100万 */
  var START_FRUIT = 10000;       /* 初始果实 1万 */

  /* 每次喂养消耗 = 100 × 当前等级 果实 */
  function feedCost(level) {
    return 100 * Math.max(1, level);
  }

  var SHOP = [
    { fruit: 1000, price: 100000 },
    { fruit: 1000000, price: 100000000 },
    { fruit: 1000000000, price: 100000000000 }
  ];

  /* ---------- 运行时状态（内存） ---------- */
  var wallet = { gold: START_GOLD, fruit: START_FRUIT };
  var chars = {};           /* name -> { level, feed } */
  var current = null;       /* 当前角色 */
  var tipTimer = 0;

  function el(id) { return document.getElementById(id); }

  function stateOf(ch) {
    if (!ch) return null;
    var st = chars[ch.name];
    if (!st) {
      st = { level: ch.level || 1, feed: 0 };
      chars[ch.name] = st;
    }
    return st;
  }

  /* 数字缩写：1000 / 100万 / 10亿 */
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
    var t = el('lvTip');
    if (!t) return;
    t.textContent = text;
    t.classList.add('on');
    if (tipTimer) clearTimeout(tipTimer);
    tipTimer = setTimeout(function () {
      t.classList.remove('on');
      tipTimer = 0;
    }, 1400);
  }

  function render() {
    var grid = el('lvGrid');
    if (!grid || !current) return;

    var st = stateOf(current);
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
      html += '<button type="button" class="m-btn' + (b.key === 'level' ? ' on' : '') + '"' +
              ' data-act="' + b.key + '" style="left:' + b.x + 'px;top:' + b.y +
              'px;width:' + BTN_W + 'px;height:' + BTN_H + 'px;">' +
              '<span>' + b.label + '</span></button>';
    }

    /* 等级 */
    html += '<div class="lv-num" style="left:' + LV_BOX.x + 'px;top:' + LV_BOX.y +
            'px;width:' + LV_BOX.w + 'px;height:' + LV_BOX.h + 'px;">' + st.level + '</div>';

    /* 喂养进度：0 / 1/3 / 2/3 */
    var pct = st.feed / 3;
    html += '<div class="lv-bar" style="left:' + BAR.x + 'px;top:' + BAR.y +
            'px;width:' + BAR.w + 'px;height:' + BAR.h + 'px;">' +
            '<div class="lv-bar-fill" style="width:' + (BAR.w * pct) + 'px;"></div>' +
            '<div class="lv-bar-seg" style="left:' + (BAR.w / 3 - 1) + 'px;"></div>' +
            '<div class="lv-bar-seg" style="left:' + (BAR.w * 2 / 3 - 1) + 'px;"></div>' +
            '</div>';

    /* 喂养消耗 */
    var cost = feedCost(st.level);
    html += '<div class="lv-cost" style="left:' + BAR.x + 'px;top:' + BAR.y +
            'px;width:' + BAR.w + 'px;height:' + BAR.h + 'px;">消耗 ' + fmt(cost) + ' 果实</div>';

    /* FEED */
    var canFeed = wallet.fruit >= cost;
    html += '<button type="button" class="lv-feed' + (canFeed ? '' : ' off') + '" id="lvFeed"' +
            ' style="left:' + FEED.x + 'px;top:' + FEED.y + 'px;width:' + FEED.w +
            'px;height:' + FEED.h + 'px;"></button>';
    if (!canFeed) {
      html += '<div class="lv-mask" style="left:' + FEED.x + 'px;top:' + FEED.y +
              'px;width:' + FEED.w + 'px;height:' + FEED.h + 'px;"></div>';
    }

    /* 金币 / 果实 */
    html += '<div class="lv-bal" style="left:' + GOLD_BOX.x + 'px;top:' + GOLD_BOX.y +
            'px;width:' + GOLD_BOX.w + 'px;height:' + GOLD_BOX.h + 'px;">' + fmt(wallet.gold) + '</div>';
    html += '<div class="lv-bal" style="left:' + FRUIT_BOX.x + 'px;top:' + FRUIT_BOX.y +
            'px;width:' + FRUIT_BOX.w + 'px;height:' + FRUIT_BOX.h + 'px;">' + fmt(wallet.fruit) + '</div>';

    /* 三个商品 */
    for (var k = 0; k < CARDS.length; k++) {
      var c = CARDS[k];
      var s = SHOP[k];
      var afford = wallet.gold >= s.price;
      var ix = c.x + 8, iw = c.w - 16;

      html += '<div class="lv-qty" style="left:' + ix + 'px;top:' + (c.y + 14) +
              'px;width:' + iw + 'px;" title="' + s.fruit + ' 果实">' + fmt(s.fruit) + ' 果实</div>';
      html += '<div class="lv-price' + (afford ? '' : ' off') + '" style="left:' + ix +
              'px;top:' + (c.y + 27) + 'px;width:' + iw + 'px;" title="' + s.price + ' 金币">' +
              fmt(s.price) + ' 金</div>';
      html += '<button type="button" class="lv-buy' + (afford ? '' : ' off') + '"' +
              ' data-idx="' + k + '" style="left:' + (c.x + 8) + 'px;top:' + (c.y + 113) +
              'px;width:' + iw + 'px;height:29px;"></button>';
      if (!afford) {
        html += '<div class="lv-mask" style="left:' + (c.x + 8) + 'px;top:' + (c.y + 113) +
                'px;width:' + iw + 'px;height:29px;"></div>';
      }
    }

    grid.innerHTML = html;
    bindGrid(grid);
  }

  function bindGrid(grid) {
    var feed = el('lvFeed');
    if (feed) feed.addEventListener('click', doFeed);

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
        if (act === 'level') return;           /* 已经在这一页 */
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        if (LevelUp.onGrowth) LevelUp.onGrowth(act, e.currentTarget.textContent, current);
      });
    }
  }

  function doFeed() {
    if (!current) return;
    var st = stateOf(current);
    var cost = feedCost(st.level);
    if (wallet.fruit < cost) {
      tip('果实不足，先去商店买');
      return;
    }
    wallet.fruit -= cost;
    if (st.feed < 2) {
      st.feed += 1;
      tip('喂养 ' + (st.feed) + '/3');
    } else {
      st.level += 1;
      st.feed = 0;
      tip('升级！Lv.' + st.level);
    }
    if (typeof Sfx !== 'undefined' && Sfx.select) Sfx.select();
    render();
  }

  function doBuy(idx) {
    var s = SHOP[idx];
    if (!s) return;
    if (wallet.gold < s.price) {
      tip('金币不足');
      return;
    }
    wallet.gold -= s.price;
    wallet.fruit += s.fruit;
    tip('购买成功：+' + fmt(s.fruit) + ' 果实');
    if (typeof Sfx !== 'undefined' && Sfx.select) Sfx.select();
    render();
  }

  function open(ch, debugLevel, debugFeed) {
    current = ch || GUIDE_DEX[0];
    var st0 = stateOf(current);
    if (debugLevel != null && !isNaN(debugLevel)) st0.level = Math.max(1, Math.floor(debugLevel));
    if (debugFeed != null && !isNaN(debugFeed)) st0.feed = Math.max(0, Math.min(2, Math.floor(debugFeed)));
    var s = el('levelScreen');
    if (s) s.classList.remove('hidden');
    render();
  }

  function close() {
    var s = el('levelScreen');
    if (s) s.classList.add('hidden');
  }

  function bind() {
    var b = el('lvBack');
    if (b) {
      b.addEventListener('click', function () {
        if (typeof Sfx !== 'undefined' && Sfx.click) Sfx.click();
        close();
        if (LevelUp.onClose) LevelUp.onClose();
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
    wallet: wallet,
    feedCost: feedCost,
    stateOf: stateOf
  };
})();
