/* =========================================================
 * 程序化像素美术（占位图）
 *  - drawAvatar(canvas, char)  生成 16×16 像素头像
 *  - drawIcon(canvas, element) 绘制元素图标
 *  - drawGlyph(canvas, name)   绘制技能图标
 * 之后接入正式美术时，把 avatarUrl / iconUrl 填上就会直接换成图片。
 * ========================================================= */
const PixelArt = (function () {
  'use strict';

  /* ---------------- 随机数 ---------------- */
  function hashSeed(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------- 颜色工具 ---------------- */
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hex(r, g, b) {
    const f = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return '#' + f(r) + f(g) + f(b);
  }
  function mix(a, b, t) {
    const A = hex2rgb(a), B = hex2rgb(b);
    return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }

  /* ---------------- 通用位图绘制 ---------------- */
  function drawBitmap(canvas, rows, palette, cell) {
    const h = rows.length;
    const w = rows[0].length;
    canvas.width = w * cell;
    canvas.height = h * cell;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = palette[rows[y][x]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  /* ---------------- 像素图标 ---------------- */
  const GLYPHS = {
    sword: [
      '....##....',
      '....##....',
      '....##....',
      '....##....',
      '....##....',
      '..######..',
      '....##....',
      '....##....',
      '...####...',
      '..........',
    ],
    hammer: [
      '..######..',
      '.########.',
      '.########.',
      '..######..',
      '....##....',
      '....##....',
      '....##....',
      '....##....',
      '....##....',
      '...####...',
    ],
    shield: [
      '##########',
      '##########',
      '##+####+##',
      '##+####+##',
      '##########',
      '##########',
      '.########.',
      '.########.',
      '..######..',
      '...####...',
    ],
    plus: [
      '...####...',
      '...####...',
      '...####...',
      '##########',
      '##########',
      '##########',
      '...####...',
      '...####...',
      '...####...',
      '..........',
    ],
    star: [
      '....##....',
      '....##....',
      '..######..',
      '##########',
      '.########.',
      '..######..',
      '.##.##.##.',
      '.#..##..#.',
      '....##....',
      '..........',
    ],
    bolt: [
      '.....###..',
      '....###...',
      '...###....',
      '..###.....',
      '.#######..',
      '...####...',
      '..###.....',
      '.###......',
      '##........',
      '..........',
    ],
    flame: [
      '....##....',
      '...####...',
      '..#.##.#..',
      '.###..###.',
      '.########.',
      '##.####.##',
      '.########.',
      '.########.',
      '..######..',
      '...####...',
    ],
    leaf: [
      '......###.',
      '....#####.',
      '...######.',
      '..#######.',
      '.#######..',
      '.######...',
      '..####....',
      '.####.....',
      '###.......',
      '..........',
    ],
    drop: [
      '....##....',
      '...####...',
      '...####...',
      '..######..',
      '##########',
      '##########',
      '##########',
      '.########.',
      '..######..',
      '..........',
    ],
    eye: [
      '..######..',
      '.##....##.',
      '##..##..##',
      '#..####..#',
      '#..####..#',
      '##..##..##',
      '.##....##.',
      '..######..',
      '..........',
      '..........',
    ],
    crown: [
      '#........#',
      '##..##..##',
      '###.##.###',
      '##########',
      '##########',
      '#.#.##.#.#',
      '##########',
      '#........#',
      '##########',
      '..........',
    ],
    moon: [
      '...####...',
      '..####....',
      '.####.....',
      '.###......',
      '.###......',
      '.###......',
      '.####.....',
      '..####....',
      '...####...',
      '..........',
    ],
    void: [
      '..######..',
      '.##....##.',
      '##......##',
      '#..####..#',
      '#..#..#..#',
      '#..####..#',
      '##......##',
      '.##....##.',
      '..######..',
      '..........',
    ],
    gem: [
      '....##....',
      '...####...',
      '..######..',
      '.##.##.##.',
      '##########',
      '.########.',
      '..######..',
      '...####...',
      '....##....',
      '..........',
    ],
    burst: [
      '....##....',
      '.#..##..#.',
      '..######..',
      '..######..',
      '##########',
      '##########',
      '..######..',
      '..######..',
      '.#..##..#.',
      '....##....',
    ],
    spike: [
      '....##....',
      '....##....',
      '...####...',
      '...####...',
      '..######..',
      '..######..',
      '.########.',
      '##########',
      '..........',
      '..........',
    ],
    chain: [
      '##........',
      '###.......',
      '.###......',
      '..###.....',
      '...###....',
      '....###...',
      '.....###..',
      '......###.',
      '.......###',
      '........##',
    ],
    swirl: [
      '..######..',
      '.##....##.',
      '##..##..##',
      '#..####..#',
      '#..##....#',
      '##..###.##',
      '.##....##.',
      '..######..',
      '..........',
      '..........',
    ],
  };

  /* ---------------- 元素图标 ---------------- */
  function drawIcon(canvas, elementId, cell) {
    const el = ELEMENTS[elementId] || ELEMENTS.holy;
    drawBitmap(canvas, el.icon, {
      '#': el.color,
      '+': el.light,
      '-': el.dark,
    }, cell || 2);
  }

  /* ---------------- 技能图标 ---------------- */
  function drawGlyph(canvas, glyphName, color, cell) {
    const rows = GLYPHS[glyphName] || GLYPHS.star;
    const light = mix(color, '#ffffff', 0.55);
    const dark = mix(color, '#05070d', 0.55);
    drawBitmap(canvas, rows, {
      '#': color,
      '+': light,
      '-': dark,
      '.': null,
    }, cell || 4);
  }

  /* ---------------- 卡面大图（占位，自适应画框比例） ---------------- */
  function drawCardArt(canvas, skill) {
    const el = ELEMENTS[skill.element] || ELEMENTS.holy;
    const w = canvas.clientWidth || 130;
    const h = canvas.clientHeight || 90;

    const GX = 20;
    const GY = Math.max(10, Math.min(30, Math.round((GX * h) / w)));
    const cell = Math.max(2, Math.round(Math.max(w / GX, h / GY)));

    canvas.width = GX * cell;
    canvas.height = GY * cell;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    /* 底色 + 轻微抖动 */
    for (let y = 0; y < GY; y++) {
      for (let x = 0; x < GX; x++) {
        let c = mix('#331318', el.dark, 0.22);
        if ((((x >> 1) + (y >> 1)) & 1) === 0) c = mix(c, '#000000', 0.14);
        ctx.fillStyle = c;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    /* 中央菱形光晕：实心 + 抖动边缘 */
    const cx = GX / 2;
    const cy = GY / 2;
    const rmax = Math.min(GX, GY) * 0.55;
    for (let y = 0; y < GY; y++) {
      for (let x = 0; x < GX; x++) {
        const d = Math.abs(x + 0.5 - cx) + Math.abs(y + 0.5 - cy);
        if (d <= rmax) {
          ctx.fillStyle = mix('#331318', el.color, 0.2);
          ctx.fillRect(x * cell, y * cell, cell, cell);
        } else if (d <= rmax + 3 && Math.round(d) % 2 === 0) {
          ctx.fillStyle = mix('#331318', el.color, 0.1);
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }

    /* 四角小方块 */
    ctx.fillStyle = mix(el.color, '#fff2d6', 0.4);
    [[0, 0], [GX - 1, 0], [0, GY - 1], [GX - 1, GY - 1]].forEach(([x, y]) => {
      ctx.fillRect(x * cell, y * cell, cell, cell);
    });

    /* 大徽记（技能图案） */
    const rows = GLYPHS[skill.glyph] || GLYPHS.star;
    const ps = Math.max(2, Math.floor(Math.min(canvas.width, canvas.height) * 0.72 / rows.length));
    const ox = Math.round((canvas.width - rows[0].length * ps) / 2);
    const oy = Math.round((canvas.height - rows.length * ps) / 2);

    ctx.fillStyle = '#140709';
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < rows[0].length; x++) {
        if (rows[y][x] === '.') continue;
        ctx.fillRect(ox + x * ps - 2, oy + y * ps - 2, ps + 4, ps + 4);
      }
    }

    const palette = {
      '#': el.color,
      '+': mix(el.color, '#ffffff', 0.6),
      '-': mix(el.color, '#000000', 0.45),
    };
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < rows[0].length; x++) {
        const c = palette[rows[y][x]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(ox + x * ps, oy + y * ps, ps, ps);
      }
    }

    /* 扫描线 */
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#000';
    for (let y = 0; y < canvas.height; y += 4) ctx.fillRect(0, y, canvas.width, 1);
    ctx.globalAlpha = 1;
  }

  /* ---------------- 角色头像 ---------------- */
  const SKINS = ['#f6d0a8', '#e8b98c', '#d09a68', '#b57a4e', '#8f5b35', '#fbe3c8'];
  const HAIRS = ['#2b2131', '#4a2f22', '#6b4a2a', '#1c1c28', '#8a8fa6', '#c9b28a'];

  function drawAvatar(canvas, char) {
    /* 头像格数按画框实际比例算，保证任何尺寸下都不被拉伸 */
    const boxW = canvas.clientWidth || 84;
    const boxH = canvas.clientHeight || 96;
    const GW = 16;
    const GH = Math.max(14, Math.min(30, Math.round((GW * boxH) / boxW)));
    const CELL = Math.max(2, Math.round(Math.max(boxW / GW, boxH / GH)));

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const r = rng(hashSeed(`${char.uid}|${char.name}|${char.element}`));
    const el = ELEMENTS[char.element] || ELEMENTS.holy;

    const bgTop = mix(el.dark, '#331318', 0.5);
    const bgBot = mix(el.dark, '#190a0e', 0.78);
    const skin = SKINS[Math.floor(r() * SKINS.length)];
    const hair = r() < 0.35 ? mix(el.color, '#331318', 0.35) : HAIRS[Math.floor(r() * HAIRS.length)];
    const cloth = mix(el.color, '#331318', 0.5);
    const clothHi = mix(el.color, '#331318', 0.24);
    const clothLo = mix(el.color, '#331318', 0.72);
    const skinShade = mix(skin, '#7a3d1e', 0.38);
    const outline = '#150709';

    const bg = [];
    const fig = [];
    for (let y = 0; y < GH; y++) {
      bg.push(new Array(GW).fill(null));
      fig.push(new Array(GW).fill(null));
    }

    /* --- 背景 --- */
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        let c = mix(bgTop, bgBot, y / (GH - 1));
        if ((((x >> 1) + (y >> 1)) & 1) === 0) c = mix(c, el.color, 0.1);
        bg[y][x] = c;
      }
    }

    const put = (x, y, c) => {
      if (x >= 0 && x < GW && y >= 0 && y < GH) fig[y][x] = c;
    };
    const rect = (x0, y0, w, h, c) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(x, y, c);
    };

    /* --- 比例锚点 --- */
    const headH = Math.max(6, Math.round(GH * 0.4));
    const headTop = Math.max(2, Math.round(GH * 0.2));
    const headBot = Math.min(GH - 4, headTop + headH - 1);
    const neckY = headBot + 1;
    const torsoTop = neckY + 1;
    const hairTop = Math.max(0, headTop - 2);

    /* --- 躯干（半身） --- */
    put(7, torsoTop, clothHi);              // 领口
    put(8, torsoTop, clothHi);
    if (torsoTop + 1 < GH) rect(4, torsoTop + 1, 8, 1, cloth);
    const bodyTop = torsoTop + 2;
    if (bodyTop < GH) {
      rect(3, bodyTop, 10, GH - bodyTop, cloth);
      for (let y = bodyTop; y < GH; y++) {
        put(2, y, clothLo);
        put(13, y, clothLo);
      }
      put(3, bodyTop, clothHi);            // 肩部高光
      put(12, bodyTop, clothHi);
    }
    const gemY = Math.min(GH - 2, torsoTop + 3);
    put(7, gemY, el.color);                // 胸口宝石
    put(8, gemY, el.light);

    /* --- 脖子 --- */
    if (neckY < torsoTop) rect(7, neckY, 2, 1, skinShade);

    /* --- 头 --- */
    for (let y = headTop; y <= headBot; y++) {
      for (let x = 5; x <= 10; x++) {
        if ((y === headTop || y === headBot) && (x === 5 || x === 10)) continue;
        put(x, y, skin);
      }
    }

    /* --- 发型 --- */
    const style = Math.floor(r() * 4);
    if (style === 0) {
      rect(5, hairTop, 6, 2, hair);
      put(5, hairTop + 2, hair);
      put(10, hairTop + 2, hair);
    } else if (style === 1) {
      rect(4, hairTop, 8, 2, hair);
      rect(4, hairTop + 2, 1, 2, hair);
      rect(11, hairTop + 2, 1, 2, hair);
      put(7, hairTop - 1, el.light);       // 冠饰
      put(8, hairTop - 1, el.light);
    } else if (style === 2) {
      rect(5, hairTop, 6, 2, hair);
      rect(4, hairTop + 2, 1, torsoTop + 2 - (hairTop + 2), hair);   // 长发
      rect(11, hairTop + 2, 1, torsoTop + 2 - (hairTop + 2), hair);
    } else {
      const hood = mix(el.color, '#331318', 0.42);
      rect(4, hairTop - 1, 8, 4, hood);
      rect(4, hairTop + 3, 1, 3, hood);
      rect(11, hairTop + 3, 1, 3, hood);
      put(7, hairTop - 2, mix(hood, '#fff2d6', 0.3));
      put(8, hairTop - 2, mix(hood, '#fff2d6', 0.3));
    }
    put(6, hairTop, mix(hair, '#ffffff', 0.3));   // 发梢高光

    /* --- 五官 --- */
    const browY = headTop + Math.max(2, Math.round(headH * 0.34));
    const eyeY = browY + 1;
    const mouthY = Math.min(headBot - 1, headTop + Math.round(headH * 0.72));
    put(6, browY, skinShade);
    put(9, browY, skinShade);
    put(6, eyeY, '#160c12');
    put(9, eyeY, '#160c12');
    put(7, mouthY, skinShade);
    put(8, mouthY, skinShade);

    /* --- 描边 + 合成 --- */
    canvas.width = GW * CELL;
    canvas.height = GH * CELL;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const fc = fig[y][x];
        let color;
        if (fc) {
          const edge =
            !fig[y - 1] || !fig[y - 1][x] ||
            !fig[y + 1] || !fig[y + 1][x] ||
            !fig[y][x - 1] || !fig[y][x + 1];
          color = edge ? mix(fc, outline, 0.55) : fc;
        } else {
          color = bg[y][x];
        }
        ctx.fillStyle = color;
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }

  return { drawAvatar, drawIcon, drawGlyph, drawCardArt, GLYPHS, mix };
})();
