/* =========================================================
 * 队伍配置
 *
 * 数值来自「数值对照表.txt」（血量 / 攻击力）。伤害只跟角色攻击力有关，
 * 不再看技能自身的威力，也不再计算防御。
 *
 * elements: [主元素, 副元素, 副元素]
 *   - 主元素 = 角色的「属性」，被什么克制只看它
 *   - 三个元素各对应一张技能卡
 *
 * 头像：assets/avatars/*.png（由「头像-*.png」按 30px 像素质点下采样）
 * ========================================================= */
const PLAYER_TEAM = [
  {
    name: '酷斯龙', title: '古岩守望', level: 10,
    elements: ['ancient', 'holy', 'steel'],
    hp: 20014343843, atk: 6211348089, crit: 10,
    avatarUrl: 'assets/avatars/kusu.png',
  },
  {
    name: '博卡拉龙', title: '熔岩行者', level: 10,
    elements: ['ancient', 'earth', 'fire'],
    hp: 19945328865, atk: 6142333110, crit: 10,
    avatarUrl: 'assets/avatars/bokara.png',
  },
  {
    name: '棱镜龙', title: '棱光之影', level: 10,
    elements: ['overlord', 'void', 'light'],
    hp: 20359418737, atk: 5866273195, crit: 10,
    avatarUrl: 'assets/avatars/prism.png',
  },
];

const ENEMY_TEAM = [
  {
    name: '莱斯克龙', title: '圣辉巨龙', level: 10,
    elements: ['ancient', 'holy', 'light'],
    hp: 20014343843, atk: 6211348089, crit: 10,
    avatarUrl: 'assets/avatars/laiske.png',
  },
  {
    name: '伊奥斯加龙', title: '烈焰幼龙', level: 10,
    elements: ['ancient', 'fire', 'grass'],
    hp: 19945328865, atk: 6142333110, crit: 10,
    avatarUrl: 'assets/avatars/yiao.png',
  },
  {
    name: '城市守护龙', title: '暗影壁垒', level: 10,
    elements: ['overlord', 'dark', 'earth'],
    hp: 20566463673, atk: 6211348089, crit: 10,
    avatarUrl: 'assets/avatars/city.png',
  },
];
