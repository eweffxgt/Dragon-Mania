/* =========================================================
 * 网页版（GitHub Pages）强制全屏增强
 *
 * 只有根目录的 index.html 会加载这个文件；
 * 小工具版本（dist/index.html）里没有这行 <script>，所以完全不受影响。
 *
 * 行为：
 *   1. 右下角一个「全屏」按钮，点了就进/退全屏
 *   2. 首次点击/触摸页面时自动尝试进全屏（浏览器要求必须有用户手势）
 *   3. 退出全屏后不再自动重进，避免打扰
 *   4. iOS Safari 不支持元素全屏，只隐藏按钮（配合 meta 支持添加到主屏幕后全屏）
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

  function matches(search) {
    var q = location.search || '';
    return q.indexOf(search) >= 0;
  }

  var autoWanted = !matches('fs=0');
  var userExited = false;

  /* ---------------- 样式（注入，不碰 pixel.css） ---------------- */
  function injectStyle() {
    var css =
      '.fs-btn{position:fixed;right:10px;bottom:10px;z-index:9990;' +
      'width:64px;height:30px;line-height:26px;text-align:center;' +
      'font:700 12px/26px -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;' +
      'letter-spacing:1px;color:#ffbf29;background:rgba(51,19,24,.82);' +
      'border:2px solid #610327;box-shadow:0 0 0 2px rgba(255,191,41,.55);' +
      'cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;' +
      'transition:opacity .2s;opacity:.72;}' +
      '.fs-btn:hover,.fs-btn:active{opacity:1;}' +
      '.fs-btn.on{color:#331318;background:#ffbf29;}' +
      '.fs-tip{position:fixed;left:50%;bottom:52px;transform:translateX(-50%);z-index:9991;' +
      'padding:6px 14px;font:12px/1.5 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;' +
      'color:#ffbf29;background:rgba(51,19,24,.9);border:2px solid #610327;' +
      'box-shadow:0 0 0 2px #ffbf29;white-space:nowrap;opacity:0;pointer-events:none;' +
      'transition:opacity .25s;}' +
      '.fs-tip.show{opacity:1;}';
    var st = doc.createElement('style');
    st.type = 'text/css';
    st.appendChild(doc.createTextNode(css));
    (doc.head || doc.documentElement).appendChild(st);
  }

  function tip(text) {
    var t = doc.createElement('div');
    t.className = 'fs-tip';
    t.textContent = text;
    doc.body.appendChild(t);
    setTimeout(function () { t.className = 'fs-tip show'; }, 16);
    setTimeout(function () {
      t.className = 'fs-tip';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, 2200);
  }

  function syncBtn(btn) {
    var on = !!currentFs();
    btn.textContent = on ? '退出全屏' : '全屏';
    btn.className = 'fs-btn' + (on ? ' on' : '');
    btn.style.width = on ? '84px' : '64px';
  }

  function tryFullscreen() {
    if (!canFullscreen() || currentFs()) return;
    requestFs(root);
  }

  function init() {
    injectStyle();

    /* ---- 按钮 ---- */
    if (canFullscreen() && !isIosSafari()) {
      var btn = doc.createElement('div');
      btn.className = 'fs-btn';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', '切换全屏');
      btn.textContent = '全屏';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (currentFs()) {
          userExited = true;
          exitFs();
        } else {
          userExited = false;
          tryFullscreen();
        }
      });
      doc.body.appendChild(btn);

      var onChange = function () { syncBtn(btn); };
      ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
        .forEach(function (ev) { doc.addEventListener(ev, onChange); });
    }

    /* ---- 首次交互自动进全屏 ---- */
    if (autoWanted && canFullscreen() && !isIosSafari()) {
      var once = function () {
        doc.removeEventListener('touchstart', once, true);
        doc.removeEventListener('mousedown', once, true);
        if (!userExited && !currentFs()) tryFullscreen();
      };
      doc.addEventListener('touchstart', once, true);
      doc.addEventListener('mousedown', once, true);
    }

    /* ---- iOS：提示添加到主屏幕 ---- */
    if (isIosSafari() && autoWanted && !window.navigator.standalone) {
      setTimeout(function () {
        tip('想要全屏：分享 → 添加到主屏幕');
      }, 1500);
    }
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
