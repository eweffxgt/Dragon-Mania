# -*- coding: utf-8 -*-
"""界面使用指南：每页一个界面 + 按钮说明（1080x1440）"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"D:\demo\龙之城重置"
RAW = os.path.join(ROOT, "推广", "raw5")
OUT = os.path.join(ROOT, "推广", "指南2")
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


def bg(page, total):
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
    d.text((W - 104, H - 60), "%d / %d" % (page, total), font=f(26, False), fill=(255, 214, 160))
    return im


def center(d, y, text, font, fill, stroke=6):
    tw = d.textlength(text, font=font)
    d.text(((W - tw) / 2, y), text, font=font, fill=fill, stroke_width=stroke, stroke_fill=INK)


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
    d.rectangle([x - 5, top - 5, x + width + 4, top + sh + 4], outline=GOLD, width=5)
    return top + sh


def bullets(im, y, items, size=27, gap=47):
    d = ImageDraw.Draw(im)
    font = f(size, bold=False)
    for it in items:
        head, rest = (it.split("|", 1) + [""])[:2] if "|" in it else (None, it)
        d.rectangle([86, y + 14, 100, y + 28], fill=GOLD)
        x = 118
        if head:
            bf = f(size)
            d.text((x, y), head, font=bf, fill=YELLOW, stroke_width=3, stroke_fill=INK)
            x += d.textlength(head, font=bf)
        d.text((x, y), rest, font=font, fill=CREAM, stroke_width=3, stroke_fill=INK)
        y += gap
    return y


PAGES = [
    ("界面说明", "主界面", "menu.png",
     ["FIGHT|：开始一局车轮战",
      "MANAGE|：养成的总入口",
      "GUIDE|：24 条龙图鉴",
      "两侧龙头|：彩蛋，别乱点"]),
    ("界面说明", "战斗界面", "battle.png",
     ["上方 HUD|：回合数 / 击杀数",
      "右下三张卡|：点卡 → 再点敌人出招",
      "左侧我方 3 条|，右侧敌方 3 条",
      "重开|= 离开战斗，按击杀数结算"]),
    ("界面说明", "选阵容", "select.png",
     ["三个窗口|= 三个上场位置",
      "点头像|放进当前窗口",
      "左右箭头|翻页，点「返回」退出",
      "选满 3 条|弹确认框"]),
    ("界面说明", "管理界面", "manage.png",
     ["一页三条龙|，左右箭头翻页",
      "四个按钮|：升级 / 升星 / 魔符 / 技能",
      "点按钮|进入对应养成界面",
      "右下角「返回」|回主界面"]),
    ("界面说明", "升级界面", "level.png",
     ["FEED|：喂果实，3 次升 1 级",
      "进度条|= 当前喂养进度",
      "三张礼包|= 买果实（金币）",
      "等级越高|属性按 1.2 倍指数涨"]),
    ("界面说明", "升星界面", "star.png",
     ["USE|：消耗水晶升 1 星",
      "4 个星位|= 当前星级（最高 16）",
      ["", "水晶|= 角色第一个元素的专属材料"][1],
      ["", "升星同时加攻击和生命，最高 ×341"][1]]),
    ("界面说明", "技能界面", "skill.png",
     ["三行|= 这条龙的三个元素技能",
      "点行|选中，看右侧说明",
      "UP|：花金币升 1 级（0→6）",
      ["", "0 级只有普攻，6 级变精通"][1]]),
    ("界面说明", "魔符界面", "rune.png",
     ["两个方框|= 已装备的魔符（各加生命/攻击）",
      "下方 5×3|= 魔符库，按稀有度排序",
      ["", "点魔符 → 合成 / 装备"][1],
      ["", "同一魔符只能给一条龙"][1]]),
    ("界面说明", "图鉴", "guide.png",
     ["16 格一页|，左右箭头翻页",
      ["", "头像 + 名字 + 三个元素"][1],
      ["", "空格=未收集"][1]]),
]

TOTAL = len(PAGES) + 2

# ---------------- 封面 ----------------
im = bg(1, TOTAL)
d = ImageDraw.Draw(im)
kf = f(30)
tw = d.textlength("界面使用说明", font=kf)
kx = (W - tw) / 2
d.rectangle([kx - 26, 70, kx + tw + 26, 124], fill=CRIMSON, outline=GOLD, width=3)
d.text((kx, 80), "界面使用说明", font=kf, fill=YELLOW)

center(d, 200, "龙之城", f(180), GOLD, stroke=10)
center(d, 430, "每个界面怎么用", f(52), CREAM, stroke=5)
center(d, 510, "每个按钮干什么", f(52), CREAM, stroke=5)

d.rectangle([120, 620, W - 120, 626], fill=(120, 6, 44))

center(d, 680, "从主界面到魔符", f(34, False), GOLD, stroke=4)
center(d, 742, "4 个养成界面 · 9 个界面 · 全部按钮", f(30, False), CREAM, stroke=3)

# 目录
toc = ["主界面", "战斗", "选人", "管理", "升级", "升星", "技能", "魔符", "图鉴", "战斗机制"]
tf = f(28)
per = 3
for i, t in enumerate(toc):
    col, row = i % per, i // per
    cx = 150 + col * 280
    cy = 840 + row * 66
    d.rectangle([cx, cy + 10, cx + 12, cy + 22], fill=GOLD)
    d.text((cx + 24, cy), t, font=tf, fill=CREAM, stroke_width=3, stroke_fill=INK)

center(d, 1160, "共 %d 页 · 往左滑 →" % TOTAL, f(28, False), (255, 214, 160), stroke=3)
im.save(os.path.join(OUT, "指南2-1-封面.png"), quality=95)
print("封面")

# ---------------- 各界面 ----------------
for i, (kick, title, img, items) in enumerate(PAGES):
    page = i + 2
    im = bg(page, TOTAL)
    d = ImageDraw.Draw(im)
    kf = f(28)
    tw = d.textlength(kick, font=kf)
    kx = (W - tw) / 2
    d.rectangle([kx - 22, 62, kx + tw + 22, 112], fill=CRIMSON, outline=GOLD, width=3)
    d.text((kx, 70), kick, font=kf, fill=YELLOW)
    center(d, 132, title, f(62), GOLD, stroke=7)

    b = shot(im, os.path.join(RAW, img), 244, 960)
    y = bullets(im, b + 48, items, 28, 54)
    center(d, y + 40, "点右下角「返回」回到上一级", f(26, False), (255, 214, 160), stroke=3)
    im.save(os.path.join(OUT, "指南2-%d-%s.png" % (page, title)), quality=95)
    print(page, title)

# ---------------- 最后一页：战斗机制 ----------------
im = bg(TOTAL, TOTAL)
d = ImageDraw.Draw(im)
kf = f(28)
tw = d.textlength("战斗机制", font=kf)
kx = (W - tw) / 2
d.rectangle([kx - 22, 62, kx + tw + 22, 112], fill=CRIMSON, outline=GOLD, width=3)
d.text((kx, 70), "战斗机制", font=kf, fill=YELLOW)
center(d, 132, "怎么打才能赢", f(56), GOLD, stroke=7)

b = shot(im, os.path.join(RAW, "battle.png"), 240, 880)
y = b + 40
y = bullets(im, y, [
    "出招顺序|：我1 → 敌1 → 我2 → 敌2 → 我3 → 敌3",
    "每张卡|先打 100% 攻击，再触发技能效果",
    "元素克制|：×1.5 / ×1 / ×0.5，差三倍",
    "车轮战|：敌人死了立刻补位，等级每 6 个 +5",
    "结算|：每条命 1 万金币，全灭才结束",
], 27, 48)
im.save(os.path.join(OUT, "指南2-%d-战斗机制.png" % TOTAL), quality=95)
print("战斗机制")
print("完成，共", TOTAL, "页")
