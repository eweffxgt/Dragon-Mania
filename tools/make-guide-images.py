# -*- coding: utf-8 -*-
"""把新手指南做成 5 张 1080x1440 竖版图（配实机截图）"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"D:\demo\龙之城重置"
R3 = os.path.join(ROOT, "推广", "raw3")
R4 = os.path.join(ROOT, "推广", "raw4")
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

os.makedirs(OUT, exist_ok=True)


def f(size, bold=True):
    return ImageFont.truetype(FB if bold else FR, size)


def bg(page):
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
    # 页码
    pf = f(26, False)
    d.text((W - 100, H - 58), "%d / 5" % page, font=pf, fill=(255, 214, 160))
    return im


def kicker(d, text, y=64):
    font = f(28)
    tw = d.textlength(text, font=font)
    x = (W - tw) / 2
    d.rectangle([x - 22, y - 10, x + tw + 22, y + 40], fill=CRIMSON, outline=GOLD, width=3)
    d.text((x, y - 2), text, font=font, fill=YELLOW)


def center(d, y, text, font, fill, stroke=6):
    tw = d.textlength(text, font=font)
    d.text(((W - tw) / 2, y), text, font=font, fill=fill, stroke_width=stroke, stroke_fill=INK)


def shot(im, path, top, width, pad=0):
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
    d.rectangle([x - 5, top - 5, x + width + 4, top + sh + 4], outline=GOLD, width=5)
    return top + sh


def chips(im, y, items):
    d = ImageDraw.Draw(im)
    font = f(28)
    pad, gap = 20, 14
    widths = [d.textlength(t, font=font) + pad * 2 for t in items]
    total = sum(widths) + gap * (len(items) - 1)
    x = (W - total) / 2
    for t, tw in zip(items, widths):
        d.rectangle([x, y, x + tw, y + 54], fill=INK, outline=GOLD, width=3)
        d.text((x + pad, y + 9), t, font=font, fill=CREAM)
        x += tw + gap


def lines(im, y, items, size=31, gap=52, bullet=True):
    d = ImageDraw.Draw(im)
    font = f(size, bold=False)
    for it in items:
        bold_part = None
        if "|" in it:
            bold_part, rest = it.split("|", 1)
        if bullet:
            d.rectangle([92, y + 15, 108, y + 31], fill=GOLD)
            x = 132
        else:
            x = 92
        if bold_part:
            bf = f(size)
            d.text((x, y), bold_part, font=bf, fill=YELLOW, stroke_width=3, stroke_fill=INK)
            x += d.textlength(bold_part, font=bf)
            d.text((x, y), rest, font=font, fill=CREAM, stroke_width=3, stroke_fill=INK)
        else:
            d.text((x, y), it, font=font, fill=CREAM, stroke_width=3, stroke_fill=INK)
        y += gap
    return y


# ---------------- 1 封面 ----------------
im = bg(1)
d = ImageDraw.Draw(im)
kicker(d, "新手指南")
center(d, 120, "龙之城", f(150), GOLD, stroke=9)
center(d, 288, "开局 100 万金币怎么花才不亏", f(38, False), CREAM, stroke=4)
b = shot(im, os.path.join(R4, "battle.png"), 376, 990)
chips(im, b + 40, ["24 条龙", "无限车轮战", "自动存档"])
y = lines(im, b + 150, ["三条龙 vs 无限车轮战|，杀得越多奖励越多",
                        "开局 100 万金币|，先别乱花，看完这 5 页"], 30, 56)
center(d, y + 60, "共 5 页 · 往左滑 →", f(28, False), (255, 214, 160), stroke=3)
im.save(os.path.join(OUT, "指南-1-封面.png"), quality=95)
print("1 封面")

# ---------------- 2 战斗怎么打 ----------------
im = bg(2)
d = ImageDraw.Draw(im)
kicker(d, "① 战斗怎么打")
center(d, 116, "点卡 → 点敌人", f(64), GOLD, stroke=7)
b = shot(im, os.path.join(R4, "battle.png"), 250, 940)
y = b + 40
y = lines(im, y, [
    "所有卡|先打一下 100% 攻击，再触发效果",
    "治疗卡|打敌人 = 只打这一下，不治疗",
    "车轮战|打死立刻补位，越往后敌人越强",
    "三条全灭|才算结束，按击杀数给金币",
], 28, 48)
im.save(os.path.join(OUT, "指南-2-战斗.png"), quality=95)
print("2 战斗")

# ---------------- 3 四条养成线 ----------------
im = bg(3)
d = ImageDraw.Draw(im)
kicker(d, "② 四条养成线")
center(d, 116, "钱该给谁", f(64), GOLD, stroke=7)
b1 = shot(im, os.path.join(R4, "level.png"), 250, 900)
y = b1 + 56
y = lines(im, y, [
    "升级|：喂果实，3 次升 1 级，属性 ×1.2 指数涨",
    "升星|：0→16 星，攻击生命一起翻，最高 ×341",
    "技能|：0 级只会普攻，6 级变精通大招",
    "魔符|：每条龙 2 个，打怪掉，5 个同级合成 1 个",
], 28, 58)
center(d, y + 70, "四个系统都在「管理」里点进去", f(28, False), (255, 214, 160), stroke=3)
im.save(os.path.join(OUT, "指南-3-养成.png"), quality=95)
print("3 养成")

# ---------------- 4 开局怎么花钱 ----------------
im = bg(4)
d = ImageDraw.Draw(im)
kicker(d, "③ 开局怎么花")
center(d, 116, "先技能，再升星", f(64), GOLD, stroke=7)
b1 = shot(im, os.path.join(R3, "star.png"), 250, 900)
y = b1 + 56
y = lines(im, y, [
    "11 万金币|：把主力的两个技能点到 2 级",
    "9 个水晶|：升到 3 星，属性直接 ×2.99",
    "剩下的钱|：买果实升等级，别一次花光",
    "别只练一条|：三条一起站场，短板会先死",
], 28, 58)
center(d, y + 70, "一局车轮战约 7 万金币，缺钱就去打两局", f(28, False), (255, 214, 160), stroke=3)
im.save(os.path.join(OUT, "指南-4-花钱.png"), quality=95)
print("4 花钱")

# ---------------- 5 克制 + 避坑 ----------------
im = bg(5)
d = ImageDraw.Draw(im)
kicker(d, "④ 记住这张克制表")
center(d, 116, "克制 ×1.5，被克 ×0.5", f(48), GOLD, stroke=6)
pairs = [
    "火焰 → 微风", "微风 → 大地", "大地 → 流水", "流水 → 火焰",
    "植物 → 虚空", "钢铁 → 植物", "闪电 → 钢铁", "虚空 → 闪电",
    "光明 → 微风/大地/闪电", "黑暗 → 火焰/流水/植物",
    "古代 → 微风/植物/光明/黑暗", "神圣 → 火焰/大地/光明/黑暗",
]
font = f(26, False)
y = 226
for i, t in enumerate(pairs):
    col = i % 2
    cx = 92 + col * 470
    cy = y + (i // 2) * 54
    d.rectangle([cx, cy + 12, cx + 12, cy + 24], fill=GOLD)
    d.text((cx + 24, cy), t, font=font, fill=CREAM, stroke_width=3, stroke_fill=INK)
d.rectangle([92, 570, W - 92, 578], fill=(120, 6, 44))
note = f(30)
d.text((92, 600), "霸主没有克制谁，但古代和神圣都被它克", font=note, fill=YELLOW, stroke_width=3, stroke_fill=INK)

center(d, 690, "⑤ 五个坑", f(48), GOLD, stroke=6)
lines(im, 782, [
    "别把资源全砸一条龙",
    "魔符一个只能给一条龙，装错能卸回",
    "凑够 5 个同级就合成，越合越强",
    "金币是通用货币，缺钱就去打一局",
    "存档自动保存，关掉不丢",
], 28, 52)
im.save(os.path.join(OUT, "指南-5-克制.png"), quality=95)
print("5 克制")
print("完成")
