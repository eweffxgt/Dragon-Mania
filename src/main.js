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

    Battle.init();
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

    boot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
