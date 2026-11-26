/* =========================================================
 * 入口：绑定按钮、快捷键，启动战斗
 * ========================================================= */
(function () {
  'use strict';

  /* 设计分辨率（2:1，与参考图一致）。整个画面等比缩放到窗口，多余部分留黑。
   *
   * 竖屏（手机竖着拿）时，把 840×420 的画面整体旋转 90° 铺满屏幕：
   * 画面看起来是横的，玩家把手机横过来就正了 —— 这样竖屏下也不会只剩中间一小条。 */
  const DESIGN_W = 840;
  const DESIGN_H = 420;

  let rotated = false;
  let hintTimer = 0;

  function fitStage() {
    const stage = document.getElementById('stage');
    if (!stage) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const portrait = vh > vw;

    /* 旋转后，可用宽高互换 */
    const availW = portrait ? vh : vw;
    const availH = portrait ? vw : vh;
    const k = Math.min(availW / DESIGN_W, availH / DESIGN_H);

    stage.style.transform = (portrait ? 'rotate(90deg) ' : '') + 'scale(' + k + ')';

    if (portrait !== rotated) {
      rotated = portrait;
      showRotateHint(portrait);
    }
  }

  /* 竖屏时给一次「把手机横过来」的提示（2.4s 后淡出） */
  function showRotateHint(show) {
    const el = document.getElementById('rotateHint');
    if (!el) return;
    if (hintTimer) {
      clearTimeout(hintTimer);
      hintTimer = 0;
    }
    if (!show) {
      el.className = 'rotate-hint';
      return;
    }
    el.className = 'rotate-hint show';
    hintTimer = setTimeout(function () {
      el.className = 'rotate-hint';
      hintTimer = 0;
    }, 2400);
  }

  function boot() {
    /* 网页版把「自动」按钮换成了「全屏」，这里要能容忍它不存在 */
    const btnAuto = document.getElementById('btnAuto');
    const btnSound = document.getElementById('btnSound');
    const btnRestart = document.getElementById('btnRestart');

    /* 调试用 URL 参数：?auto=1 自动战斗   ?speed=2 加速 */
    const params = new URLSearchParams(location.search);
    if (params.get('speed')) {
      const s = Number(params.get('speed'));
      if (s > 0) Battle.setTimeScale(1 / s);
    }
    if (params.get('auto') === '1') {
      Battle.setAuto(true);
      if (btnAuto) {
        btnAuto.textContent = '自动 开';
        btnAuto.classList.add('on');
      }
    }

    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        const on = Battle.setAuto(!Battle.isAuto());
        btnAuto.textContent = '自动 ' + (on ? '开' : '关');
        btnAuto.classList.toggle('on', on);
        Sfx.click();
      });
    }

    btnSound.addEventListener('click', () => {
      const on = Sfx.toggle();
      btnSound.textContent = '音效 ' + (on ? '开' : '关');
      btnSound.classList.toggle('on', on);
      if (on) Sfx.click();
    });

    btnRestart.addEventListener('click', () => {
      UI.clearOverlay();
      Battle.init();
      Sfx.click();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Battle.cancelCard();
        return;
      }
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        e.preventDefault();
        Sfx.select();
        Battle.chooseCard(Number(e.key) - 1);
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        UI.clearOverlay();
        Battle.init();
      }
    });
  }

  /* =========================================================
   * 主界面 / 管理 / 图鉴
   * ========================================================= */
  let battleStarted = false;

  function el(id) {
    return document.getElementById(id);
  }

  function showMenu() {
    const menu = el('menuScreen');
    const sub = el('subScreen');
    const gd = el('guideScreen');
    const mg = el('manageScreen');
    if (sub) sub.classList.add('hidden');
    if (gd) gd.classList.add('hidden');
    if (mg) mg.classList.add('hidden');
    if (menu) menu.classList.remove('hidden');
    removeBoot();
  }

  function hideMenu() {
    const menu = el('menuScreen');
    if (menu) menu.classList.add('hidden');
  }

  /* 管理界面点四个按钮：升级进升级界面，其余三个先留空 */
  function openGrowth(act, label, char) {
    if (act === 'level') {
      LevelUp.open(char);
      return;
    }
    if (act === 'star') {
      StarUp.open(char);
      return;
    }
    if (act === 'skill') {
      SkillUp.open(char);
      return;
    }
    showGrowth(label, char);
  }

  /* 养成子界面：升星 / 魔符 / 技能（空白页） */
  function showGrowth(label, char) {
    const sub = el('subScreen');
    const title = el('subTitle');
    const hint = el('subHint');
    if (sub) sub.classList.remove('hidden');
    if (title) title.textContent = label;
    if (hint) hint.textContent = (char ? char.name + ' · ' : '') + '这个养成界面还没做，先留空';
  }

  function removeBoot() {
    const b = el('boot');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function startBattle(team) {
    hideMenu();
    const sub = el('subScreen');
    if (sub) sub.classList.add('hidden');
    const gs = el('guideScreen');
    if (gs) gs.classList.add('hidden');
    const ms = el('manageScreen');
    if (ms) ms.classList.add('hidden');
    const ls = el('levelScreen');
    if (ls) ls.classList.add('hidden');
    const sts = el('starScreen');
    if (sts) sts.classList.add('hidden');
    const sks = el('skillScreen');
    if (sks) sks.classList.add('hidden');
    const ss = el('selectScreen');
    if (ss) ss.classList.add('hidden');
    removeBoot();
    UI.clearOverlay();
    Battle.init(team);
    battleStarted = true;
  }

  /* =========================================================
   * 彩蛋：左龙头 1 次 → 右龙头 1 次 → 左龙头 2 次，
   * 弹出「是否重置存档？」。没有音效也没有额外视觉反馈。
   * ========================================================= */
  let dragonSeq = [];
  let dragonTimer = 0;

  function dragonTap(which) {
    if (dragonTimer) clearTimeout(dragonTimer);
    dragonSeq.push(which);
    if (dragonSeq.length > 4) dragonSeq.shift();
    dragonTimer = setTimeout(function () { dragonSeq = []; dragonTimer = 0; }, 2500);

    if (dragonSeq.join('') === 'LRLL') {
      dragonSeq = [];
      clearTimeout(dragonTimer);
      dragonTimer = 0;
      openResetConfirm();
    }
  }

  function openResetConfirm() {
    const d = el('resetConfirm');
    if (d) d.classList.remove('hidden');
  }

  function closeResetConfirm() {
    const d = el('resetConfirm');
    if (d) d.classList.add('hidden');
  }

  function doResetSave() {
    closeResetConfirm();
    if (typeof PlayerState !== 'undefined') {
      PlayerState.reset();          /* 清空角色 + 星光 + 金币果实回默认，并落盘 */
      if (typeof UI !== 'undefined' && UI.refresh) UI.refresh();
    }
    showMenu();
  }

  function bindMenu() {
    const fight = el('menuFight');
    const manage = el('menuManage');
    const guide = el('menuGuide');
    const back = el('subBack');

    const dl = el('menuDragonL');
    const dr = el('menuDragonR');
    if (dl) dl.addEventListener('click', function () { dragonTap('L'); });
    if (dr) dr.addEventListener('click', function () { dragonTap('R'); });

    const yes = el('resetYes');
    const no = el('resetNo');
    if (yes) yes.addEventListener('click', doResetSave);
    if (no) no.addEventListener('click', closeResetConfirm);

    if (fight) {
      fight.addEventListener('click', function () {
        Sfx.select();
        Select.open();          /* 先选阵容，再进战斗 */
      });
    }
    if (manage) {
      manage.addEventListener('click', function () {
        Sfx.click();
        Manage.open();
      });
    }
    if (guide) {
      guide.addEventListener('click', function () {
        Sfx.click();
        Guide.open();
      });
    }
    if (back) {
      back.addEventListener('click', function () {
        Sfx.click();
        const sub = el('subScreen');
        if (sub) sub.classList.add('hidden');
        Manage.open();
      });
    }
  }

  function start() {
    fitStage();
    requestAnimationFrame(fitStage);
    window.addEventListener('load', fitStage);
    window.addEventListener('resize', fitStage);
    window.addEventListener('orientationchange', () => setTimeout(fitStage, 120));

    /* 视口变化（含地址栏收起 / 手机旋转 / iframe 尺寸晚到）都重新适配 */
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(fitStage);
      ro.observe(document.documentElement);
      ro.observe(document.body);
    }
    let n = 0;
    const timer = setInterval(() => {
      fitStage();
      if (++n > 12) clearInterval(timer);
    }, 150);

    /* 读存档（同步读本地，异步再尝试小工具 Storage） */
    PlayerState.load().then(function (fromRemote) {
      if (fromRemote) {
        /* 首次在新设备上：拿到云端档后重建一次界面数据 */
        if (typeof Manage !== 'undefined') Manage.render();
        if (typeof LevelUp !== 'undefined') LevelUp.render();
      }
    });

    /* 战斗结算的「回到主界面」 */
    UI.onExit = function () { showMenu(); };

    bindMenu();
    Guide.bind();
    Guide.onClose = showMenu;
    Manage.bind();
    Manage.onClose = showMenu;
    Select.bind();
    Select.onConfirm = function (team) { startBattle(team); };
    Select.onClose = showMenu;
    LevelUp.bind();
    LevelUp.onGrowth = function (act, label, char) { openGrowth(act, label, char); };

    StarUp.bind();
    StarUp.onGrowth = function (act, label, char) { openGrowth(act, label, char); };
    StarUp.onClose = function () { Manage.open(); };

    SkillUp.bind();
    SkillUp.onGrowth = function (act, label, char) { openGrowth(act, label, char); };
    SkillUp.onClose = function () { Manage.open(); };
    LevelUp.onClose = function () { Manage.open(); };
    Manage.setOnOpen(openGrowth);

    /* URL 参数（调试 / 截图用）：
     *   ?auto=1        直接进战斗
     *   ?screen=manage 直接看管理页
     *   ?screen=guide  直接看图鉴页
     * 默认先进主界面。 */
    const params = new URLSearchParams(location.search);

    /* ?seed=123 固定随机种子：同一场战斗可以复现，抽帧做视频用 */
    const seed = params.get('seed');
    if (seed) Battle.setSeed(seed);

    const screen = params.get('screen');
    if (screen === 'select') {
      Select.open();
    } else if (screen === 'level') {
      var lvP = params.get('lv'), fdP = params.get('feed');
      LevelUp.open(GUIDE_DEX[Number(params.get('idx')) || 0],
        lvP == null ? null : Number(lvP),
        fdP == null ? null : Number(fdP));
    } else if (screen === 'star') {
      var stP = params.get('stars'), crP = params.get('crystal');
      if (crP != null) {
        var ch0 = GUIDE_DEX[Number(params.get('idx')) || 0];
        var ele0 = (ch0.elements || [])[0] || 'ancient';
        PlayerState.addCrystal(ele0, Number(crP) || 0);
      }
      StarUp.open(GUIDE_DEX[Number(params.get('idx')) || 0],
        stP == null ? null : Number(stP));
    } else if (screen === 'skill') {
      SkillUp.open(GUIDE_DEX[Number(params.get('idx')) || 0],
        params.get('el'), params.get('slv') == null ? null : Number(params.get('slv')));
    } else if (screen === 'growth') {
      Manage.open(Number(params.get('page')) || 0);
      showGrowth(params.get('label') || '升 级', null);
    } else if (screen === 'guide') {
      Guide.open(Number(params.get('page')) || 0);
    } else if (screen === 'manage') {
      Manage.open(Number(params.get('page')) || 0);
    } else if (params.get('auto') === '1') {
      boot();
      startBattle();
    } else {
      showMenu();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
