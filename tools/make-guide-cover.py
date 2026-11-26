# -*- coding: utf-8 -*-
"""重做指南封面：纯排版 + 龙头像墙，不放游戏截图"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"D:\demo\龙之城重置"
AV = os.path.join(ROOT, "assets", "avatars")
OUT = os.path.join(ROOT, "推广", "指南")
W, H = 1080, 1440

MAROON = (70, 2, 28)
INK = (51, 19, 24)
GOLD = (255, 191, 41)
YELLOW = (254, 242, 46)
CREAM = (255, 242, 214)
CRIMSON = (194, 9, 53)
FB = "C:/Windows/Fonts/msyhbd.ttc"
FR = "C:/Windows/Fonts/msyh.ttc"


def f(size, bold=True):
    return ImageFont.truetype(FB if bold else FR, size)


def bg():
    im = Image.new("RGB", (W, H), MAROON)
    d = ImageDraw.Draw(im)
    for x in range(0, W, 45):
        d.line([(x, 0), (x, H)], fill=(60, 2, 24), width=1)
    for y in range(0, H, 45):
        d.line([(0, y), (W, y)], fill=(60, 2, 24), width=1)
    d.rectangle([26, 26, W - 27, H - 27], outline=GOLD, width=5)
    d.rectangle([40, 40, W - 41, H - 41], outline=(120, 6, 44), width=2)
    for cx, cy in [(26, 26), (W - 46, 26), (26, H - 46), (W - 46, H - 46)]:
        d.rectangle([cx, cy, cx + 20, cy + 20], fill=GOLD)
    return im


def center(d, y, text, font, fill, stroke=6, stroke_fill=INK):
    tw = d.textlength(text, font=font)
    d.text(((W - tw) / 2, y), text, font=font, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
    return tw


im = bg()
d = ImageDraw.Draw(im)

# ---------- 顶部标签 ----------
kf = f(30)
tw = d.textlength("新手指南 · 5 页看完", font=kf)
kx = (W - tw) / 2
d.rectangle([kx - 26, 60, kx + tw + 26, 114], fill=CRIMSON, outline=GOLD, width=3)
d.text((kx, 70), "新手指南 · 5 页看完", font=kf, fill=YELLOW)

# ---------- 主标题 ----------
center(d, 150, "龙之城", f(190), GOLD, stroke=11)

# ---------- 副标题 ----------
center(d, 396, "三条龙，能杀穿多少波？", f(46), CREAM, stroke=5)

# ---------- 龙头像墙 ----------
names = sorted([n for n in os.listdir(AV) if n.endswith(".png") and "blank" not in n])[:10]
cell_w, cell_h, gap = 96, 108, 12
total = len(names) * cell_w + (len(names) - 1) * gap
x = (W - total) / 2
y0 = 500
for n in names:
    a = Image.open(os.path.join(AV, n)).convert("RGBA")
    a = a.resize((cell_w, cell_h), Image.LANCZOS)
    card = Image.new("RGB", (cell_w, cell_h), (110, 4, 32))
    card.paste(a, (0, 0), a)
    im.paste(card, (int(x), y0))
    dd = ImageDraw.Draw(im)
    dd.rectangle([int(x) - 3, y0 - 3, int(x) + cell_w + 2, y0 + cell_h + 2], outline=GOLD, width=3)
    x += cell_w + gap

# ---------- 三个大数字 ----------
stats = [("24", "条龙"), ("16", "星满级"), ("×341", "属性倍率")]
stat_f = f(78)
label_f = f(26, False)
col_w = W / 3
for i, (num, label) in enumerate(stats):
    cx = col_w * (i + 0.5)
    nw = d.textlength(num, font=stat_f)
    d.text((cx - nw / 2, 690), num, font=stat_f, fill=YELLOW, stroke_width=6, stroke_fill=INK)
    lw = d.textlength(label, font=label_f)
    d.text((cx - lw / 2, 800), label, font=label_f, fill=CREAM, stroke_width=3, stroke_fill=INK)

# 分隔线
d.rectangle([120, 866, W - 120, 872], fill=(120, 6, 44))

# ---------- 钩子文案 ----------
center(d, 906, "开局 100 万金币", f(44), GOLD, stroke=5)
center(d, 968, "怎么花才不亏", f(44), GOLD, stroke=5)

# ---------- 底部提示 ----------
hint = f(28, False)
tw2 = d.textlength("金币怎么赚 · 技能怎么点 · 魔符怎么合", font=hint)
d.text(((W - tw2) / 2, 1064), "金币怎么赚 · 技能怎么点 · 魔符怎么合", font=hint,
       fill=(255, 214, 160), stroke_width=3, stroke_fill=INK)

# 三枚小标签
tags = ["避坑", "克制表", "养成优先级"]
tf = f(28)
pads, tg = 22, 16
ws = [d.textlength(t, font=tf) + pads * 2 for t in tags]
tt = sum(ws) + tg * (len(tags) - 1)
tx = (W - tt) / 2
for t, w in zip(tags, ws):
    d.rectangle([tx, 1130, tx + w, 1184], fill=INK, outline=GOLD, width=3)
    d.text((tx + pads, 1140), t, font=tf, fill=CREAM)
    tx += w + tg

im.save(os.path.join(OUT, "指南-1-封面.png"), quality=95)
print("新封面 ok")
