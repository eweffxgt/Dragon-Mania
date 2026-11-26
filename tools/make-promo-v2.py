# -*- coding: utf-8 -*-
"""生成第二版推广卡（1080x1440）"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"D:\demo\龙之城重置"
RAW = os.path.join(ROOT, "推广", "raw3")
OUT = os.path.join(ROOT, "推广")
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


def kicker(d, text, y=78):
    font = f(30)
    tw = d.textlength(text, font=font)
    x = (W - tw) / 2
    d.rectangle([x - 24, y - 12, x + tw + 24, y + 44], fill=CRIMSON, outline=GOLD, width=3)
    d.text((x, y - 2), text, font=font, fill=YELLOW)


def chips(im, y, items):
    d = ImageDraw.Draw(im)
    font = f(30)
    pad, gap = 22, 14
    widths = [d.textlength(t, font=font) + pad * 2 for t in items]
    total = sum(widths) + gap * (len(items) - 1)
    x = (W - total) / 2
    for t, tw in zip(items, widths):
        d.rectangle([x, y, x + tw, y + 58], fill=INK, outline=GOLD, width=3)
        d.text((x + pad, y + 10), t, font=font, fill=CREAM)
        x += tw + gap


def shot(im, path, top, width):
    s = Image.open(path).convert("RGB")
    sh = int(width * s.height / s.width)
    s = s.resize((width, sh), Image.LANCZOS)
    x = (W - width) // 2
    shadow = Image.new("RGBA", (width + 40, sh + 40), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rectangle([20, 26, width + 20, sh + 26], fill=(0, 0, 0, 130))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    im.paste(shadow, (x - 20, top - 20), shadow)
    im.paste(s, (x, top))
    d = ImageDraw.Draw(im)
    d.rectangle([x - 6, top - 6, x + width + 5, top + sh + 5], outline=GOLD, width=6)
    return top + sh


def bullets(im, y, items, size=32):
    d = ImageDraw.Draw(im)
    font = f(size, bold=False)
    for it in items:
        d.rectangle([110, y + 16, 126, y + 32], fill=GOLD)
        d.text((152, y), it, font=font, fill=CREAM, stroke_width=3, stroke_fill=INK)
        y += 54
    return y


def footer(im, text, y=1240):
    d = ImageDraw.Draw(im)
    font = f(32, bold=False)
    tw = d.textlength(text, font=font)
    d.text(((W - tw) / 2, y), text, font=font, fill=(255, 214, 160), stroke_width=3, stroke_fill=INK)


# ---------------- 封面 ----------------
im = bg()
d = ImageDraw.Draw(im)
kicker(d, "版本更新 · v1.10")
center(d, 126, "龙之城", f(160), GOLD, stroke=9)
center(d, 306, "升星 · 技能 · 魔符 全部上线", f(42, False), CREAM, stroke=4)
b1 = shot(im, os.path.join(RAW, "star.png"), 400, 900)
chips(im, b1 + 34, ["16 星", "6 级技能", "15 种魔符"])
bullets(im, b1 + 108, ["升星：攻击和生命一起翻倍，最高 341 倍", "技能：0 级普攻，6 级变成精通大招", "魔符：打怪掉，五个同级合成一个高级"], 30)
footer(im, "点开就能玩 · 不用下载", 1150)
im.save(os.path.join(OUT, "推广2-封面-1080x1440.png"), quality=95)
print("封面 ok")

# ---------------- 第二张：技能 + 魔符 ----------------
im = bg()
d = ImageDraw.Draw(im)
kicker(d, "新增养成")
center(d, 128, "技能 · 魔符", f(72), GOLD, stroke=7)
center(d, 232, "一条龙三个技能，两个魔符位", f(36, False), CREAM, stroke=4)
b1 = shot(im, os.path.join(RAW, "skill.png"), 330, 880)
b2 = shot(im, os.path.join(RAW, "rune.png"), b1 + 40, 880)
footer(im, "魔符靠打怪掉，五个同级合成一个高级", b2 + 26)
im.save(os.path.join(OUT, "推广2-2-1080x1440.png"), quality=95)
print("第二张 ok")
