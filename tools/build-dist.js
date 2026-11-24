/* =========================================================
 * 生成小工具包用的 dist/ 目录
 *
 *   node tools/build-dist.js
 *
 * 规则：
 *   - dist/index.html 由根 index.html 派生（去掉网页版全屏增强，全屏按钮换回「自动」）
 *   - 样式、脚本、素材按原样复制
 *   - **只复制小工具平台白名单内的扩展名**，README.md / .txt 这类会被跳过
 *
 * 平台白名单：jpg css gif svg png js jpeg json html woff2 webp woff
 * ========================================================= */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const ALLOWED = [
  ".jpg", ".css", ".gif", ".svg", ".png", ".js", ".jpeg",
  ".json", ".html", ".woff2", ".webp", ".woff"
];

function ok(file) {
  return ALLOWED.indexOf(path.extname(file).toLowerCase()) >= 0;
}

/* 清空 dist（只删内容，保留目录） */
function clean(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { clean(p); fs.rmdirSync(p); }
    else fs.unlinkSync(p);
  }
}

function copyDir(src, dst, skipNames, skipped) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipNames && skipNames.indexOf(e.name) >= 0) { skipped.push(path.join(dst, e.name)); continue; }
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d, skipNames, skipped);
    else if (ok(e.name)) fs.copyFileSync(s, d);
    else skipped.push(s);
  }
}

/* 1) index.html */
let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
html = html.replace(/<!-- 网页版强制全屏增强：小工具版本（dist\/index\.html）不加载这一行 -->\s*\n/, "");
html = html.replace(/\s*<script defer src="\.\/src\/ui\/fullscreen\.js"><\/script>/g, "");
html = html.replace('<button id="btnFull" class="px-btn">全屏</button>',
                    '<button id="btnAuto" class="px-btn">自动 关</button>');
fs.mkdirSync(DIST, { recursive: true });
clean(DIST);
fs.writeFileSync(path.join(DIST, "index.html"), html, "utf8");

/* 2) 样式 */
fs.mkdirSync(path.join(DIST, "styles"), { recursive: true });
fs.copyFileSync(path.join(ROOT, "styles", "pixel.css"), path.join(DIST, "styles", "pixel.css"));

/* 3) 脚本 + 素材 */
const skipped = [];
copyDir(path.join(ROOT, "src"), path.join(DIST, "src"), ["fullscreen.js"], skipped);
copyDir(path.join(ROOT, "assets"), path.join(DIST, "assets"), null, skipped);

/* 4) 自检 */
let total = 0, bad = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else {
      total++;
      if (!ok(p)) bad.push(path.relative(DIST, p));
    }
  }
})(DIST);

console.log("dist 文件数:", total);
if (skipped.length) {
  console.log("跳过（不在白名单 / 指定排除）:");
  skipped.forEach((p) => console.log("  -", path.relative(ROOT, p)));
}
if (bad.length) {
  console.log("!! 仍有不合规文件:");
  bad.forEach((p) => console.log("  -", p));
  process.exit(1);
}
console.log("扩展名全部在白名单内 ✓");
