/* =========================================================
 * 网页版（GitHub Pages）全屏增强
 *
 * 只有根目录的 index.html 会加载这个文件；
 * 小工具版本（dist/index.html）里没有这行 <script>，所以完全不受影响。
 *
 * 按钮位置：战斗信息栏右上角（原来「自动」的位置），
 * 它在舞台内部，所以竖屏旋转时会跟着画面一起转，方向永远一致。
 *
 * 行为：
 *   1. 点「全屏」进入全屏，再点「退出全屏」退出
 *   2. 首次点击/触摸页面时自动尝试进入全屏（浏览器要求必须有用户手势）
 *   3. 退出全屏后不再自动重进，避免打扰
 *   4. iOS Safari 不支持元素全屏 → 隐藏按钮，提示「添加到主屏幕」
 * 关闭自动全屏：网址加 ?fs=0
 * ========================================================= */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  function currentFs() {
    return doc.fullscreenElement || doc.webkitFullscreenElement ||
      doc.mozFullScreenElement || doc.msFullscreenElement || null;
  }

  function requestFs(node) {
    var fn = node.requestFullscreen || node.webkitRequestFullscreen ||
      node.mozRequestFullScreen || node.msRequestFullscreen;
    if (!fn) return null;
    try {
      var p = fn.call(node);
      if (p && typeof p.catch === 'function') p.catch(function () {});
      return p;
    } catch (e) { return null; }
  }

  function exitFs() {
    var fn = doc.exitFullscreen || doc.webkitExitFullscreen ||
      doc.mozCancelFullScreen || doc.msExitFullscreen;
    if (!fn) return;
    try {
      var p = fn.call(doc);
      if (p && typeof p.catch === 'function') p.catch(function () {});
    } catch (e) {}
  }

  function canFullscreen() {
    return !!(root.requestFullscreen || root.webkitRequestFullscreen ||
      root.mozRequestFullScreen || root.msRequestFullscreen);
  }

  /* iOS 上的 Safari 没有元素全屏，只能靠「添加到主屏幕」 */
  function isIosSafari() {
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  }

  function hasParam(s) {
    return (location.search || '').indexOf(s) >= 0;
  }

  var autoWanted = !hasParam('fs=0');
  var userExited = false;

  /* ---------------- iOS 提示（唯一注入的样式） ---------------- */
  function tip(text) {
    var css = '.fs-tip{position:fixed;left:50%;bottom:14%;transform:translateX(-50%);z-index:9991;' +
      'padding:7px 15px;font:13px/1.5 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;' +
      'color:#ffbf29;background:rgba(51,19,24,.92);border:2px solid #610327;' +
      'box-shadow:0 0 0 2px #ffbf29;white-space:nowrap;opacity:0;pointer-events:none;' +
      'transition:opacity .25s;}.fs-tip.show{opacity:1;}';
    var st = doc.createElement('style');
    st.type = 'text/css';
    if (st.styleSheet) st.styleSheet.cssText = css;
    else st.appendChild(doc.createTextNode(css));
    (doc.head || doc.documentElement).appendChild(st);

    var t = doc.createElement('div');
    t.className = 'fs-tip';
    t.textContent = text;
    doc.body.appendChild(t);
    setTimeout(function () { t.className = 'fs-tip show'; }, 16);
    setTimeout(function () {
      t.className = 'fs-tip';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, 2600);
  }

  function init() {
    var btn = doc.getElementById('btnFull');
    var ok = canFullscreen() && !isIosSafari();

    /* ---- 按钮：不支持就直接藏掉 ---- */
    if (btn) {
      if (!ok) {
        btn.style.display = 'none';
      } else {
        var sync = function () {
          var on = !!currentFs();
          btn.textContent = on ? '退出全屏' : '全屏';
          if (on) btn.classList.add('on');
          else btn.classList.remove('on');
        };
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof Sfx !== 'undefined' && Sfx && Sfx.click) Sfx.click();
          if (currentFs()) { userExited = true; exitFs(); }
          else { userExited = false; requestFs(root); }
        });
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
          .forEach(function (ev) { doc.addEventListener(ev, sync); });
        sync();
      }
    }

    /* ---- 首次交互自动进全屏 ---- */
    if (autoWanted && ok) {
      var once = function () {
        doc.removeEventListener('touchstart', once, true);
        doc.removeEventListener('mousedown', once, true);
        if (!userExited && !currentFs()) requestFs(root);
      };
      doc.addEventListener('touchstart', once, true);
      doc.addEventListener('mousedown', once, true);
    }

    /* ---- iOS：提示添加到主屏幕 ---- */
    if (isIosSafari() && autoWanted && !window.navigator.standalone) {
      setTimeout(function () { tip('想要全屏：分享 → 添加到主屏幕'); }, 1600);
    }
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
