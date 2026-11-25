/* =========================================================
 * 玩家状态（带存档 + 版本迁移）
 *
 * 存档结构（v2）：
 *   {
 *     v: 2,
 *     ts: 1732531200000,              // 最后保存时间，多端合并时用
 *     wallet: { gold, fruit },
 *     chars: {
 *       "酷斯龙": {
 *         level: 27, feed: 1,         // 等级 / 喂养档位 0-2
 *         stars: 0,                   // 升星
 *         runes: [],                  // 魔符（id 字符串数组）
 *         skills: {}                  // 技能等级 { "holy": 3 }
 *       }
 *     }
 *   }
 *
 * 三条规则，改存档前必须守住：
 *   1. **不要改 SaveStorage.KEY**（key 里的 v1 是历史命名，真版本看 data.v）
 *   2. **不要改角色名字** —— 存档按名字索引，改名 = 丢该角色进度
 *   3. 加字段时：SAVE_VERSION +1，并在 migrate() 里补一条补丁，
 *      同时给 hydrate 的默认值，缺字段的老档才能平滑升级
 * ========================================================= */
const PlayerState = (function () {
  var SAVE_VERSION = 3;
  var DEFAULT_GOLD = 1000000;    /* 初始金币 100 万（只对第一次玩的新档生效） */
  var DEFAULT_FRUIT = 100000;    /* 初始果实 10 万 */
  var DEFAULT_LEVEL = 10;        /* 所有角色初始等级 */
  var MAX_STARS = 5;
  var MAX_RUNES = 6;

  var entries = {};              /* name -> { level, feed, stars, runes, skills } */
  var wallet = { gold: DEFAULT_GOLD, fruit: DEFAULT_FRUIT };
  var crystals = {};             /* 元素 id -> 水晶数量 */
  var savedAt = 0;

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

  function clampStars(v) {
    var n = Math.floor(Number(v) || 0);
    return n < 0 ? 0 : (n > MAX_STARS ? MAX_STARS : n);
  }

  function clampRunes(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (x) { return typeof x === 'string' && x; }).slice(0, MAX_RUNES);
  }

  function clampSkills(obj) {
    var out = {};
    if (!obj || typeof obj !== 'object') return out;
    Object.keys(obj).forEach(function (k) {
      var v = Math.floor(Number(obj[k]) || 0);
      if (v > 0) out[k] = v > 99 ? 99 : v;
    });
    return out;
  }

  /* 一条角色记录的标准形状（新档 / 老档补字段都用它） */
  function blankChar(baseLevel) {
    return {
      level: clampLevel(baseLevel == null ? DEFAULT_LEVEL : baseLevel),
      feed: 0,
      stars: 0,
      runes: [],
      skills: {}
    };
  }

  /* 把任意来源的记录规整成标准形状（缺字段给默认值，坏数据被夹紧） */
  function normalizeChar(src, baseLevel) {
    var rec = blankChar(baseLevel);
    if (!src || typeof src !== 'object') return rec;
    rec.level = clampLevel(src.level == null ? rec.level : src.level);
    rec.feed = clampFeed(src.feed);
    rec.stars = clampStars(src.stars);
    rec.runes = clampRunes(src.runes);
    rec.skills = clampSkills(src.skills);
    return rec;
  }

  /* 取（必要时创建）某个角色的状态，返回的是活对象，可直接改 */
  function entry(name, baseLevel) {
    if (!name) return blankChar(baseLevel);
    var e = entries[name];
    if (!e) {
      e = blankChar(baseLevel);
      entries[name] = e;
    }
    return e;
  }

  /* ---------- 水晶（升星材料，按元素分） ---------- */
  function crystalOf(element) {
    if (!element) return 0;
    return crystals[element] || 0;
  }

  function addCrystal(element, n) {
    if (!element || !n) return 0;
    crystals[element] = Math.max(0, (crystals[element] || 0) + Math.floor(n));
    return crystals[element];
  }

  function spendCrystal(element, n) {
    if (!element || !n) return false;
    var have = crystals[element] || 0;
    if (have < n) return false;
    crystals[element] = have - n;
    return true;
  }

  function crystalMap() {
    var out = {};
    Object.keys(crystals).forEach(function (k) { out[k] = crystals[k]; });
    return out;
  }

  function levelOf(name, fallback) {
    var e = entries[name];
    return e ? e.level : clampLevel(fallback == null ? DEFAULT_LEVEL : fallback);
  }

  /* ---------- 存档 ---------- */
  function snapshot() {
    var chars = {};
    Object.keys(entries).forEach(function (k) {
      var e = entries[k];
      chars[k] = {
        level: e.level,
        feed: e.feed,
        stars: e.stars,
        runes: e.runes.slice(),
        skills: Object.assign({}, e.skills)
      };
    });
    return {
      v: SAVE_VERSION,
      ts: Date.now(),
      chars: chars,
      crystals: crystalMap(),
      wallet: { gold: wallet.gold, fruit: wallet.fruit }
    };
  }

  /* 老档升级：每个版本加一段，逐级往后推 */
  function migrate(data) {
    if (!data || typeof data !== 'object') return null;
    var v = Math.floor(Number(data.v) || 1);

    if (v < 2) {
      /* v1 -> v2：补上升星 / 魔符 / 技能三个字段 */
      data.chars = data.chars || {};
      Object.keys(data.chars).forEach(function (k) {
        var c = data.chars[k] || {};
        if (c.stars == null) c.stars = 0;
        if (!Array.isArray(c.runes)) c.runes = [];
        if (!c.skills || typeof c.skills !== 'object') c.skills = {};
        data.chars[k] = c;
      });
      v = 2;
    }

    if (v < 3) {
      /* v2 -> v3：加水晶（升星材料） */
      if (!data.crystals || typeof data.crystals !== 'object') data.crystals = {};
      v = 3;
    }

    /* 留给下个版本：
     * if (v < 4) { ...; v = 4; }
     */

    data.v = v;
    return data;
  }

  function hydrate(raw) {
    var data = migrate(raw);
    if (!data) return false;
    var changed = false;

    if (data.chars && typeof data.chars === 'object') {
      Object.keys(data.chars).forEach(function (k) {
        entries[k] = normalizeChar(data.chars[k]);
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
    if (data.crystals && typeof data.crystals === 'object') {
      Object.keys(data.crystals).forEach(function (k) {
        var n = Math.floor(Number(data.crystals[k]) || 0);
        crystals[k] = n > 0 ? n : 0;
        changed = true;
      });
    }
    if (typeof data.ts === 'number') savedAt = data.ts;
    return changed;
  }

  function save() {
    if (typeof SaveStorage === 'undefined') return false;
    savedAt = Date.now();
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
    crystals = {};
    if (!keepWallet) {
      wallet.gold = DEFAULT_GOLD;
      wallet.fruit = DEFAULT_FRUIT;
    }
    save();
  }

  return {
    entry: entry,
    levelOf: levelOf,
    crystalOf: crystalOf,
    addCrystal: addCrystal,
    spendCrystal: spendCrystal,
    crystalMap: crystalMap,
    crystals: crystals,
    snapshot: snapshot,
    hydrate: hydrate,
    migrate: migrate,
    save: save,
    load: load,
    reset: reset,
    wallet: wallet,
    savedAt: function () { return savedAt; },
    DEFAULT_LEVEL: DEFAULT_LEVEL,
    DEFAULT_GOLD: DEFAULT_GOLD,
    DEFAULT_FRUIT: DEFAULT_FRUIT,
    MAX_STARS: MAX_STARS,
    MAX_RUNES: MAX_RUNES,
    SAVE_VERSION: SAVE_VERSION
  };
})();
