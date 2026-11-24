# -*- coding: utf-8 -*-
"""生成「这次更新」的竖版推广卡（1080x1440）"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"D:\demo\龙之城重置"
RAW = os.path.join(ROOT, "推广", "raw2")
OUT = os.path.join(ROOT, "推广")
AV = os.path.join(ROOT, "assets", "avatars")
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


def center_text(d, y, text, font, fill, stroke=6, stroke_fill=INK):
    tw = d.textlength(text, font=font)
    d.text(((W - tw) / 2, y), text, font=font, fill=fill,
           stroke_width=stroke, stroke_fill=stroke_fill)
    return y + font.size


def kicker(d, text, y=78):
    font = f(30)
    tw = d.textlength(text, font=font)
    x = (W - tw) / 2
    d.rectangle([x - 24, y - 12, x + tw + 24, y + 44], fill=CRIMSON, outline=GOLD, width=3)
    d.text((x, y - 2), text, font=font, fill=YELLOW)


def chips(im, y, items):
    d = ImageDraw.Draw(im)
    font = f(30)
    pad_x, gap = 24, 16
    widths = [d.textlength(t, font=font) + pad_x * 2 for t in items]
    total = sum(widths) + gap * (len(items) - 1)
    x = (W - total) / 2
    for t, tw in zip(items, widths):
        d.rectangle([x, y, x + tw, y + 60], fill=INK, outline=GOLD, width=3)
        d.text((x + pad_x, y + 11), t, font=font, fill=CREAM)
        x += tw + gap


def paste_shot(im, path, top, width):
    shot = Image.open(path).convert("RGB")
    sh = int(width * shot.height / shot.width)
    shot = shot.resize((width, sh), Image.LANCZOS)
    x = (W - width) // 2

    shadow = Image.new("RGBA", (width + 40, sh + 40), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rectangle([20, 26, width + 20, sh + 26], fill=(0, 0, 0, 130))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    im.paste(shadow, (x - 20, top - 20), shadow)

    im.paste(shot, (x, top))
    d = ImageDraw.Draw(im)
    d.rectangle([x - 6, top - 6, x + width + 5, top + sh + 5], outline=GOLD, width=6)
    return top + sh


def bullets(im, y, items, size=34):
    d = ImageDraw.Draw(im)
    font = f(size, bold=False)
    for it in items:
        d.rectangle([110, y + 18, 126, y + 34], fill=GOLD)
        d.text((152, y), it, font=font, fill=CREAM, stroke_width=3, stroke_fill=INK)
        y += 58
    return y


def footer(im, slogan, y=1180):
    d = ImageDraw.Draw(im)
    font = f(34, bold=False)
    tw = d.textlength(slogan, font=font)
    d.text(((W - tw) / 2, y + 26), slogan, font=font, fill=(255, 214, 160),
           stroke_width=3, stroke_fill=INK)


# ---------------- 封面 ----------------
im = bg()
d = ImageDraw.Draw(im)
kicker(d, "版本更新 · v1.03")
center_text(d, 132, "龙之城", f(170), GOLD, stroke=9)
center_text(d, 322, "24 条龙 · 无限车轮战", f(48, False), CREAM, stroke=4)

bottom = paste_shot(im, os.path.join(RAW, "battle.png"), 430, 940)
chips(im, bottom + 44, ["24 条龙", "随机车轮战", "自动存档"])
bullets(im, bottom + 118, ["每个敌人 1 万金币，按击杀数结算", "杀掉立刻补位，越往后敌人越强"], 32)
footer(im, "点开就能玩 · 不用下载", 1240)
im.save(os.path.join(OUT, "更新-封面-1080x1440.png"), quality=95)
print("封面 ok")

# ---------------- 第二张：选择 + 升级 ----------------
im = bg()
d = ImageDraw.Draw(im)
kicker(d, "新增")
center_text(d, 150, "选阵容 · 养成", f(72), GOLD, stroke=7)
center_text(d, 268, "三条龙自己挑，喂果实升级", f(40, False), CREAM, stroke=4)
b1 = paste_shot(im, os.path.join(RAW, "select.png"), 372, 880)
b2_top = b1 + 34
b2 = paste_shot(im, os.path.join(RAW, "level.png"), b2_top, 880)
footer(im, "存档本地保存，退出重进还在", b2 + 16)
im.save(os.path.join(OUT, "更新-2-1080x1440.png"), quality=95)
print("第二张 ok")
