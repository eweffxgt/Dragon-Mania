/* =========================================================
 * 玩家状态（带存档）
 *
 * 存的东西：
 *   - 每个角色的等级和喂养档位（0 / 1 / 2）
 *   - 金币、果实
 *
 * 读写都过 SaveStorage（小工具 Storage / localStorage / 内存三选一），
 * 任何一次改动后调用 PlayerState.save() 落盘。
 * ========================================================= */
const PlayerState = (function () {
  var SAVE_VERSION = 1;
  var DEFAULT_GOLD = 10000000;   /* 初始金币 1000 万 */
  var DEFAULT_FRUIT = 100000;    /* 初始果实 10 万 */
  var DEFAULT_LEVEL = 10;        /* 所有角色初始等级 */

  var entries = {};              /* name -> { level, feed } */
  var wallet = { gold: DEFAULT_GOLD, fruit: DEFAULT_FRUIT };

  function clampLevel(v) {
    var n = Math.floor(Number(v) || 0);
    if (n < 1) n = 1;
    if (n > 170) n = 170;
    return n;
  }

  function clampFeed(v) {
    var n = Math.floor(Number(v) || 0);
    return n < 0 ? 0 : (n > 2 ? 2 : n);
  }

  /* 取（必要时创建）某个角色的状态，返回的是活对象，可直接改 */
  function entry(name, baseLevel) {
    if (!name) return { level: DEFAULT_LEVEL, feed: 0 };
    var e = entries[name];
    if (!e) {
      e = { level: clampLevel(baseLevel == null ? DEFAULT_LEVEL : baseLevel), feed: 0 };
      entries[name] = e;
    }
    return e;
  }

  function levelOf(name, fallback) {
    var e = entries[name];
    return e ? e.level : clampLevel(fallback == null ? DEFAULT_LEVEL : fallback);
  }

  /* ---------- 存档 ---------- */
  function snapshot() {
    var chars = {};
    Object.keys(entries).forEach(function (k) {
      chars[k] = { level: entries[k].level, feed: entries[k].feed };
    });
    return {
      v: SAVE_VERSION,
      chars: chars,
      wallet: { gold: wallet.gold, fruit: wallet.fruit }
    };
  }

  function hydrate(data) {
    if (!data || typeof data !== 'object') return false;
    var changed = false;

    if (data.chars && typeof data.chars === 'object') {
      Object.keys(data.chars).forEach(function (k) {
        var s = data.chars[k];
        if (!s) return;
        entries[k] = { level: clampLevel(s.level), feed: clampFeed(s.feed) };
        changed = true;
      });
    }
    if (data.wallet && typeof data.wallet === 'object') {
      if (typeof data.wallet.gold === 'number' && isFinite(data.wallet.gold)) {
        wallet.gold = Math.max(0, Math.round(data.wallet.gold));
        changed = true;
      }
      if (typeof data.wallet.fruit === 'number' && isFinite(data.wallet.fruit)) {
        wallet.fruit = Math.max(0, Math.round(data.wallet.fruit));
        changed = true;
      }
    }
    return changed;
  }

  function save() {
    if (typeof SaveStorage === 'undefined') return false;
    return SaveStorage.write(snapshot());
  }

  /* 启动时调用：先读本地，再异步尝试小工具 Storage */
  function load() {
    if (typeof SaveStorage === 'undefined') return Promise.resolve(false);
    var local = SaveStorage.read();
    if (local) hydrate(local);

    return SaveStorage.pull().then(function (remote) {
      /* 小工具有数据、且本地没有时用它（首次换设备就是这条路径） */
      if (remote && !local) {
        hydrate(remote);
        return true;
      }
      return false;
    });
  }

  function reset(keepWallet) {
    entries = {};
    if (!keepWallet) {
      wallet.gold = DEFAULT_GOLD;
      wallet.fruit = DEFAULT_FRUIT;
    }
    save();
  }

  return {
    entry: entry,
    levelOf: levelOf,
    snapshot: snapshot,
    hydrate: hydrate,
    save: save,
    load: load,
    reset: reset,
    wallet: wallet,
    DEFAULT_LEVEL: DEFAULT_LEVEL,
    DEFAULT_GOLD: DEFAULT_GOLD,
    DEFAULT_FRUIT: DEFAULT_FRUIT
  };
})();
