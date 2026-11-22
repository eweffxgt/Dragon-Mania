# -*- coding: utf-8 -*-
"""把抽好的游戏帧合成一条 1080x1920 / 24fps 的竖版推广视频（输出 JPEG 序列，交给 ffmpeg 编码）"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"D:\demo\龙之城重置"
FRAMES = os.path.join(ROOT, "tools", "frames")
OUT = os.path.join(ROOT, "tools", "vid")
W, H = 1080, 1920
FPS = 24

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


def center(d, y, text, font, fill, stroke=5, sf=INK):
    tw = d.textlength(text, font=font)
    d.text(((W - tw) / 2, y), text, font=font, fill=fill, stroke_width=stroke, stroke_fill=sf)


def bg():
    im = Image.new("RGB", (W, H), MAROON)
    d = ImageDraw.Draw(im)
    for x in range(0, W, 54):
        d.line([(x, 0), (x, H)], fill=(60, 2, 24), width=1)
    for y in range(0, H, 54):
        d.line([(0, y), (W, y)], fill=(60, 2, 24), width=1)
    d.rectangle([22, 22, W - 23, H - 23], outline=GOLD, width=4)
    for cx, cy in [(22, 22), (W - 42, 22), (22, H - 42), (W - 42, H - 42)]:
        d.rectangle([cx, cy, cx + 20, cy + 20], fill=GOLD)
    return im


GW, GH = 1080, 540
GX, GY = 0, 380


def paste_game(im, src, zoom=1.0):
    """把 2:1 游戏画面贴到面板位置，zoom 做轻微推镜"""
    g = src.convert("RGB")
    if zoom != 1.0:
        cw, ch = int(g.width / zoom), int(g.height / zoom)
        left, top = (g.width - cw) // 2, (g.height - ch) // 2
        g = g.crop((left, top, left + cw, top + ch))
    g = g.resize((GW, GH), Image.LANCZOS)
    im.paste(g, (GX, GY))
    d = ImageDraw.Draw(im)
    d.rectangle([GX - 5, GY - 5, GX + GW + 4, GY + GH + 4], outline=GOLD, width=5)


def tag(d, text, y, size=34, color=YELLOW):
    font = f(size)
    tw = d.textlength(text, font=font)
    x = (W - tw) / 2
    d.rectangle([x - 22, y - 10, x + tw + 22, y + size + 18], fill=CRIMSON, outline=GOLD, width=3)
    d.text((x, y), text, font=font, fill=color)


def progress(im, p):
    d = ImageDraw.Draw(im)
    d.rectangle([40, H - 60, W - 40, H - 52], fill=(96, 3, 36))
    d.rectangle([40, H - 60, 40 + int((W - 80) * max(0.0, min(1.0, p))), H - 52], fill=GOLD)


MENU = Image.open(os.path.join(ROOT, "assets", "menu.jpg"))
END = Image.open(os.path.join(FRAMES, "end-24000.png"))
BAT = [Image.open(os.path.join(FRAMES, "b%03d.png" % i)) for i in range(81)]
AV = [Image.open(os.path.join(ROOT, "assets", "avatars", n + ".png"))
      for n in ["kusu", "bokara", "prism", "laiske", "yiao", "city"]]

SEG1, SEG2 = 2.6, 1.4          # 主界面 / 点击
BAT_FRAMES = len(BAT) * 3      # 每个源帧展示 3 次 = 8fps
SEG3 = BAT_FRAMES / FPS
SEG4, SEG5 = 2.5, 3.4
TOTAL = SEG1 + SEG2 + SEG3 + SEG4 + SEG5
N = int(round(TOTAL * FPS))

os.makedirs(OUT, exist_ok=True)
for i in range(N):
    t = i / FPS
    im = bg()
    d = ImageDraw.Draw(im)

    if t < SEG1:                       # ---- 主界面 ----
        k = min(1.0, t / 0.5)
        s = 0.94 + 0.06 * k
        g = MENU.convert("RGB")
        gw = int(GW * s)
        g = g.resize((gw, int(gw / 2)), Image.LANCZOS)
        im.paste(g, ((W - gw) // 2, GY + (GH - g.height) // 2))
        d.rectangle([GX - 5, GY - 5, GX + GW + 4, GY + GH + 4], outline=GOLD, width=5)
        a = int(255 * k)
        tag(d, "像素风 · 回合制 · 小红书小工具", 100)
        center(d, 170, "龙之城", f(130), GOLD, stroke=8)
        center(d, 320, "三条龙打三条龙", f(46, False), CREAM, stroke=4)
        center(d, 960, "13 种元素互相克制", f(50, False), CREAM, stroke=4)
        center(d, 1060, "打对 ×1.5 ｜ 打错 ×0.5", f(44, False), (255, 214, 160), stroke=4)
        aw, gap = 108, 18
        total = len(AV) * aw + (len(AV) - 1) * gap
        ax = (W - total) / 2
        for a in AV:
            box = a.resize((aw - 10, int((aw - 10) * a.height / a.width)), Image.NEAREST)
            d.rectangle([ax, 1130, ax + aw, 1130 + 124], fill=INK, outline=GOLD, width=3)
            im.paste(box, (int(ax + 5), int(1130 + (124 - box.height) / 2)), box)
            ax += aw + gap
        center(d, 1330, "不用下载 · 点开就玩", f(50), YELLOW, stroke=4)

    elif t < SEG1 + SEG2:              # ---- 点击 FIGHT ----
        p = (t - SEG1) / SEG2
        g = MENU.convert("RGB").resize((GW, GH), Image.LANCZOS)
        im.paste(g, (GX, GY))
        d.rectangle([GX - 5, GY - 5, GX + GW + 4, GY + GH + 4], outline=GOLD, width=5)
        # 点击光圈
        cx, cy = GX + GW * 0.5, GY + GH * 0.42
        r = 12 + 190 * min(1.0, p * 1.8)
        alpha = int(200 * (1 - p))
        ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(ring).ellipse([cx - r, cy - r, cx + r, cy + r],
                                     outline=(255, 241, 160, alpha), width=6)
        im.paste(ring, (0, 0), ring)
        tag(d, "点 FIGHT 开打", 100)
        center(d, 170, "龙之城", f(130), GOLD, stroke=8)
        center(d, 960, "三条龙轮流出招", f(52, False), CREAM, stroke=4)
        center(d, 1070, "谁先被打光谁输", f(46, False), (255, 214, 160), stroke=4)

    elif t < SEG1 + SEG2 + SEG3:       # ---- 战斗 ----
        p = (t - SEG1 - SEG2) / SEG3
        idx = min(len(BAT) - 1, int(p * len(BAT)))
        zoom = 1.0 + 0.05 * p
        paste_game(im, BAT[idx], zoom)
        tag(d, "实机演示", 100)
        center(d, 210, "龙之城 v1.02", f(62), GOLD, stroke=5)
        if p < 0.25:
            cap = "技能分两段：先打 100% 攻击"
        elif p < 0.55:
            cap = "中毒 / 封印 / 嘲讽 / 减伤"
        else:
            cap = "克制打对，差三倍伤害"
        center(d, 960, cap, f(56), GOLD, stroke=5)
        center(d, 1070, "13 种元素 · 每个角色 3 张技能卡", f(38, False), (255, 214, 160), stroke=3)
        center(d, 1170, "×1.5", f(158), GOLD, stroke=9)
        center(d, 1400, "克制加成 ｜ 一局 3~8 回合", f(42, False), (255, 214, 160), stroke=4)
        center(d, 1580, "小红书 · 搜「龙之城」", f(44), YELLOW, stroke=4)

    elif t < SEG1 + SEG2 + SEG3 + SEG4:  # ---- 结算 ----
        p = (t - SEG1 - SEG2 - SEG3) / SEG4
        paste_game(im, END, 1.0 + 0.04 * p)
        tag(d, "4 回合结束", 100)
        center(d, 210, "龙之城 v1.02", f(62), GOLD, stroke=5)
        center(d, 960, "胜  利", f(110), YELLOW, stroke=7)
        center(d, 1120, "敌方全员被击败 · 4 回合", f(46, False), CREAM, stroke=4)
        center(d, 1300, "再来一把？", f(76), GOLD, stroke=6)
        center(d, 1460, "输赢都能复盘每条龙的输出", f(38, False), (255, 214, 160), stroke=3)

    else:                               # ---- CTA ----
        p = (t - SEG1 - SEG2 - SEG3 - SEG4) / SEG5
        g = MENU.convert("RGB").resize((GW, GH), Image.LANCZOS)
        im.paste(g, (GX, GY))
        d.rectangle([GX - 5, GY - 5, GX + GW + 4, GY + GH + 4], outline=GOLD, width=5)
        tag(d, "小红书里点开就玩", 100)
        center(d, 170, "龙之城", f(130), GOLD, stroke=8)
        center(d, 320, "v1.02", f(52), YELLOW, stroke=5)
        # 龙头像条
        aw, gap = 120, 20
        total = len(AV) * aw + (len(AV) - 1) * gap
        x = (W - total) / 2
        for a in AV:
            box = a.resize((aw - 10, int((aw - 10) * a.height / a.width)), Image.NEAREST)
            d.rectangle([x, 1000, x + aw, 1000 + 134], fill=INK, outline=GOLD, width=3)
            im.paste(box, (int(x + 5), int(1000 + (134 - box.height) / 2)), box)
            x += aw + gap
        center(d, 1200, "点下面就能玩", f(50), CREAM, stroke=4)

    progress(im, t / TOTAL)
    im.save(os.path.join(OUT, "%04d.jpg" % i), quality=92)

print("frames:", N, "| 时长:", round(TOTAL, 2), "秒")
