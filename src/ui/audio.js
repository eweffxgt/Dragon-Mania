/* =========================================================
 * 8-bit 音效（WebAudio 振荡器，无需素材）
 * 浏览器要求先有用户交互才能出声，所以第一次点击时才会启动。
 * ========================================================= */
const Sfx = (function () {
  'use strict';
  let ctx = null;
  let on = true;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function beep(freq, dur, type, vol, slideTo) {
    if (!on) return;
    const c = ensure();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), c.currentTime + dur);
    g.gain.setValueAtTime(vol == null ? 0.05 : vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  }

  return {
    click() { beep(660, 0.05, 'square', 0.03); },
    select() { beep(880, 0.06, 'square', 0.035); },
    hit() { beep(200, 0.10, 'square', 0.05, 90); },
    crit() { beep(340, 0.16, 'square', 0.06, 120); },
    heal() { beep(560, 0.12, 'triangle', 0.05, 880); },
    cast() { beep(440, 0.14, 'triangle', 0.04, 700); },
    ko() { beep(160, 0.35, 'sawtooth', 0.06, 50); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.14, 'square', 0.05), i * 110)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'square', 0.05), i * 140)); },
    toggle() { on = !on; return on; },
    isOn() { return on; },
  };
})();
