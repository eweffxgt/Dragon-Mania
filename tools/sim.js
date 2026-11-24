/* =========================================================
 * 无头模拟器：不打开浏览器，直接跑战斗引擎。
 *   用法：node tools/sim.js [场次]
 *   用途：验证战斗流程不卡死、检查胜率与回合数是否合理。
 * ========================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const FILES = [
  'src/data/elements.js',
  'src/data/statuses.js',
  'src/data/skills.js',
  'src/data/stats.js',
  'src/data/curve.js',
  'src/data/state.js',
  'src/data/guide.js',
  'src/data/characters.js',
  'src/engine/battle.js',
];

let onFinished = null;

global.UI = {
  build() {}, refresh() {}, rebuildChar() {}, renderCards() {}, setHint() {},
  showTargets() {}, clearTargets() {}, log() {}, floatText() {},
  shake() {}, lunge() {}, cast() {}, clearOverlay() {},
  gameOver(result, st) {
    if (onFinished) {
      const fn = onFinished;
      onFinished = null;
      fn(result, st);
    }
  },
};

global.Sfx = {
  click() {}, select() {}, hit() {}, crit() {}, heal() {},
  cast() {}, ko() {}, win() {}, lose() {}, toggle() {}, isOn() { return false; },
};

FILES.forEach((rel) => {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInThisContext(code, { filename: rel });
});

const N = Number(process.argv[2] || 100);

Battle.setTimeScale(0);
Battle.setAuto(true);

function runOne() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('战斗超时，可能卡死')), 120000);
    onFinished = (result, st) => {
      clearTimeout(timer);
      resolve({
        result,
        kills: st.kills || 0,
        reward: st.reward || 0,
        rounds: st.round,
        allyHp: st.chars.filter((c) => c.side === 'ally').reduce((a, c) => a + Math.max(0, c.hp), 0),
        allyMax: st.chars.filter((c) => c.side === 'ally').reduce((a, c) => a + c.maxHp, 0),
        byUid: Object.assign({}, st.stats.byUid),
        dmgAlly: st.stats.ally.dmg,
        dmgEnemy: st.stats.enemy.dmg,
      });
    };
    Battle.init();
  });
}

(async () => {
  const stats = { win: 0, lose: 0, kills: 0, rounds: [], survivors: [], dmgAlly: 0, dmgEnemy: 0, byUid: {} };
  for (let i = 0; i < N; i++) {
    const r = await runOne();
    stats.lose++;
    stats.kills = (stats.kills || 0) + r.kills;
    stats.rounds.push(r.rounds);
    stats.rounds.push(r.rounds);
    stats.dmgAlly += r.dmgAlly;
    stats.dmgEnemy += r.dmgEnemy;
    Object.keys(r.byUid).forEach(k => { stats.byUid[k] = (stats.byUid[k]||0) + r.byUid[k]; });
    if (r.rounds > 60) console.log('!! 异常长局：' + r.rounds + ' 回合');
  }

  const fmtComma = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const sorted = stats.rounds.slice().sort((a, b) => a - b);

  console.log('---------------------------------------');
  console.log(`场次        ${N}`);
  console.log(`场均击杀    ${(stats.kills / N).toFixed(1)} 个`);
  console.log(`场均金币    ${fmtComma(stats.kills / N * 10000)}`);
  console.log(`平均回合    ${avg(stats.rounds).toFixed(1)}`);
  console.log(`最短 / 最长  ${sorted[0]} / ${sorted[sorted.length - 1]}`);
  console.log(`中位回合    ${sorted[Math.floor(sorted.length / 2)]}`);
  console.log(`胜利时剩余  ${(avg(stats.survivors) * 100).toFixed(0)}% 总生命`);
  console.log(`场均伤害    我方 ${(stats.dmgAlly / N / 1e8).toFixed(1)}亿 / 敌方 ${(stats.dmgEnemy / N / 1e8).toFixed(1)}亿`);
  console.log('---------------------------------------');
  const names = { p0:'酷斯龙', p1:'博卡拉龙', p2:'棱镜龙', e0:'莱斯克龙', e1:'伊奥斯加龙', e2:'城市守护龙' };
  Object.keys(stats.byUid).sort().forEach(k => console.log(`  ${names[k]||k} 场均 ${(stats.byUid[k]/N/1e8).toFixed(1)}亿`));
})().catch((e) => {
  console.error('模拟失败：', e);
  process.exit(1);
});
