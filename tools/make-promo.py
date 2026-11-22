# -*- coding: utf-8 -*-
"""生成小红书推广图：1 张竖版封面 + 3 张实机截图卡（1080x1440 / 3:4）"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"D:\demo\龙之城重置"
RAW = os.path.join(ROOT, "推广", "raw")
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


def paste_shot(im, shot_path, top, width):
    shot = Image.open(shot_path).convert("RGB")
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


def kicker(d, text, y=78):
    font = f(30)
    tw = d.textlength(text, font=font)
    x = (W - tw) / 2
    d.rectangle([x - 24, y - 12, x + tw + 24, y + 44], fill=CRIMSON, outline=GOLD, width=3)
    d.text((x, y - 2), text, font=font, fill=YELLOW)


def chips(im, y, items):
    d = ImageDraw.Draw(im)
    font = f(30)
    pad_x, gap = 26, 18
    widths = [d.textlength(t, font=font) + pad_x * 2 for t in items]
    total = sum(widths) + gap * (len(items) - 1)
    x = (W - total) / 2
    for t, tw in zip(items, widths):
        d.rectangle([x, y, x + tw, y + 62], fill=INK, outline=GOLD, width=3)
        d.text((x + pad_x, y + 12), t, font=font, fill=CREAM)
        x += tw + gap


def bullets(im, y, items, size=36):
    d = ImageDraw.Draw(im)
    font = f(size, bold=False)
    for it in items:
        d.rectangle([110, y + 18, 126, y + 34], fill=GOLD)
        d.text((152, y), it, font=font, fill=CREAM, stroke_width=3, stroke_fill=INK)
        y += 60
    return y


def footer(im, slogan, y=1118):
    """底部：6 条龙的头像条 + 一句口号"""
    d = ImageDraw.Draw(im)
    names = ["kusu", "bokara", "prism", "laiske", "yiao", "city"]
    aw, ah, gap = 118, 132, 22
    total = len(names) * aw + (len(names) - 1) * gap
    x = (W - total) / 2
    for n in names:
        av = Image.open(os.path.join(AV, n + ".png")).convert("RGBA")
        av = av.resize((aw - 12, int((aw - 12) * av.height / av.width)), Image.NEAREST)
        d.rectangle([x, y, x + aw, y + ah], fill=INK, outline=GOLD, width=3)
        im.paste(av, (int(x + 6), int(y + (ah - av.height) / 2)), av)
        x += aw + gap

    font = f(34, bold=False)
    tw = d.textlength(slogan, font=font)
    d.text(((W - tw) / 2, y + ah + 26), slogan, font=font, fill=(255, 214, 160),
           stroke_width=3, stroke_fill=INK)


def cover(path):
    im = bg()
    d = ImageDraw.Draw(im)
    kicker(d, "像素风 · 回合制 · 小红书小工具")

    title_font = f(186)
    title = "龙之城"
    vfont = f(40)
    vtext = "v1.02"
    tw = d.textlength(title, font=title_font)
    vw = d.textlength(vtext, font=vfont)
    gap = 30
    total = tw + gap + vw + 32
    tx = (W - total) / 2
    ty = 132
    d.text((tx, ty), title, font=title_font, fill=GOLD, stroke_width=9, stroke_fill=INK)

    # 版本角标（和标题作为一组居中）
    vx = tx + tw + gap
    vy = ty + 104
    d.rectangle([vx, vy - 6, vx + vw + 30, vy + 52], fill=CRIMSON, outline=GOLD, width=3)
    d.text((vx + 15, vy), vtext, font=vfont, fill=YELLOW)

    center_text(d, 352, "三条龙打三条龙", f(52, False), CREAM, stroke=5)

    bottom = paste_shot(im, os.path.join(RAW, "c-guard.png"), 445, 940)
    chips(im, bottom + 46, ["13 元素克制", "6 条龙 3v3", "小工具直接开"])

    d = ImageDraw.Draw(im)
    center_text(d, bottom + 134, "小红书里点开就玩 · 不用下载", f(38, False), YELLOW, stroke=5)
    footer(im, "6 条龙 · 3 打 3 · 13 种元素互相克制", 1150)
    im.save(path, quality=95)
    print("cover ok")


def shot_card(path, kicker_text, title, subtitle, shot, items, footer_text):
    im = bg()
    d = ImageDraw.Draw(im)
    kicker(d, kicker_text)
    center_text(d, 145, title, f(78), GOLD, stroke=7)
    center_text(d, 268, subtitle, f(40, False), CREAM, stroke=4)

    bottom = paste_shot(im, os.path.join(RAW, shot), 420, 940)
    bullets(im, bottom + 56, items, 34)
    footer(im, footer_text, 1118)
    im.save(path, quality=95)
    print("card ok:", os.path.basename(path))


cover(os.path.join(OUT, "封面-1080x1440.png"))

shot_card(os.path.join(OUT, "实机1-开局.png"),
          "实机画面 ①", "左我右敌", "中间是实时战斗日志",
          "a-open.png",
          ["回合固定：我1 → 敌1 → 我2 → 敌2 → 我3 → 敌3",
           "阵亡自动跳过，每个角色 3 张技能卡"],
          "开局每条龙都是满血，先出手的一方占优")

shot_card(os.path.join(OUT, "实机2-战斗.png"),
          "实机画面 ②", "技能分两段", "先 100% 伤害，再算附加效果",
          "c-guard.png",
          ["中毒 / 封印 / 嘲讽 / 反击 / 减伤 都会生效",
           "AOE 技能按「主目标 100% + 其余 85%」分摊"],
          "打不过不是数值问题，是克制关系没算对")

shot_card(os.path.join(OUT, "实机3-结算.png"),
          "实机画面 ③", "8 回合收场", "三杀之后看结算",
          "d-end.png",
          ["元素克制 ×1.5 是翻盘关键",
           "输赢都能复盘每条龙的输出"],
          "每局 3~8 回合，等电梯就能打一把")
