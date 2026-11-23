/* =========================================================
 * 玩家状态（内存）
 *
 * 目前还没有存档，这里就是「一局游戏里所有会变的东西」：
 *   - 每个角色的等级和喂养档位（0 / 1 / 2）
 *   - 金币、果实
 * 战斗和管理界面都从这里读，等接入存档时只要把读写
 * 换成持久化即可，其它代码不用动。
 * ========================================================= */
const PlayerState = (function () {
  var entries = {};          /* name -> { level, feed } */
  var wallet = {
    gold: 10000000,          /* 初始金币 1000 万 */
    fruit: 100000           /* 初始果实 10 万 */
  };

  /* 取（必要时创建）某个角色的状态，返回的是活对象，可直接改 */
  function entry(name, baseLevel) {
    if (!name) return { level: 1, feed: 0 };
    var e = entries[name];
    if (!e) {
      e = { level: Math.max(1, Math.floor(baseLevel || 1)), feed: 0 };
      entries[name] = e;
    }
    return e;
  }

  function levelOf(name, fallback) {
    var e = entries[name];
    return e ? e.level : Math.max(1, Math.floor(fallback || 1));
  }

  function reset() {
    entries = {};
    wallet.gold = 10000000;
    wallet.fruit = 100000;
  }

  return {
    entry: entry,
    levelOf: levelOf,
    reset: reset,
    wallet: wallet
  };
})();
