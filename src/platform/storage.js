/* =========================================================
 * 存档存储层
 *
 * 一条链路上三个来源，按优先级：
 *   1. 小红书小工具 Storage API（window.xhs.miniTool，异步、版本受限）
 *   2. 浏览器 localStorage（网页版 / 本地打开）
 *   3. 内存（都不可用时，至少本次会话不丢）
 *
 * 写：同步写 localStorage（网页立刻生效），同时异步推一份到小工具 Storage。
 * 读：同步读 localStorage；启动后如果拿到小工具的数据会再 hydrate 一次。
 * ========================================================= */
const SaveStorage = (function () {
  var KEY = 'dragon-city-save-v1';
  var memory = null;

  function ls() {
    try {
      if (typeof localStorage === 'undefined') return null;
      var probe = '__dc_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return localStorage;
    } catch (e) {
      return null;
    }
  }

  function mini() {
    var m = (typeof window !== 'undefined' && window.xhs && window.xhs.miniTool) || null;
    return (m && typeof m.setStorage === 'function' && typeof m.getStorage === 'function') ? m : null;
  }

  /* 同步读：localStorage → 内存 */
  function read() {
    var store = ls();
    if (store) {
      try {
        var raw = store.getItem(KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) { /* 坏档当没有 */ }
    }
    return memory;
  }

  /* 写：localStorage 同步 + 小工具 Storage 异步 */
  function write(data) {
    memory = data;
    var store = ls();
    if (store) {
      try { store.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 配额满就只留内存 */ }
    }
    var m = mini();
    if (m) {
      try {
        m.setStorage({ key: KEY, data: JSON.stringify(data) });
      } catch (e) { /* 小工具接口失败不影响主流程 */ }
    }
    return true;
  }

  /* 启动时尝试从小工具 Storage 拉一次（异步，可能没有权限 / 版本不够） */
  function pull() {
    var m = mini();
    if (!m) return Promise.resolve(null);
    try {
      return Promise.resolve(m.getStorage({ key: KEY })).then(function (res) {
        if (res && typeof res.data === 'string' && res.data) {
          return JSON.parse(res.data);
        }
        return null;
      }).catch(function () { return null; });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  function clear() {
    memory = null;
    var store = ls();
    if (store) { try { store.removeItem(KEY); } catch (e) {} }
    var m = mini();
    if (m && typeof m.removeStorage === 'function') {
      try { m.removeStorage({ key: KEY }); } catch (e) {}
    }
  }

  return { read: read, write: write, pull: pull, clear: clear, KEY: KEY };
})();
