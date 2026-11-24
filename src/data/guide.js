/* =========================================================
 * 图鉴数据（同时也是管理界面的角色表）
 *
 * 按名字拼音首字母排序（A → Z），暂时手工排好。
 * avatar 指向 assets/avatars/ 下的原生 51×57 像素图，
 * full   指向 assets/full/ 下的 420×420 全身图。
 * level 是初始等级；血量 / 攻击按等级走成长曲线，
 * 1 级基础值见 src/data/stats.js。
 * ========================================================= */
const GUIDE_PER_PAGE = 16;

const GUIDE_DEX = [
  { name: '奥亚龙',       elements: ['ancient', 'holy', 'fire'],       avatar: 'assets/avatars/aoya.png',            full: 'assets/full/aoya.png',            level: 10 },
  { name: '巴哈吉尔龙',   elements: ['ancient', 'holy', 'water'],      avatar: 'assets/avatars/bahajier.png',        full: 'assets/full/bahajier.png',        level: 10 },
  { name: '博卡拉龙',     elements: ['ancient', 'earth', 'fire'],      avatar: 'assets/avatars/bokara.png',          full: 'assets/full/bokara.png',          level: 10 },
  { name: '城市守护龙',   elements: ['overlord', 'dark', 'earth'],     avatar: 'assets/avatars/city.png',            full: 'assets/full/city.png',            level: 10 },
  { name: '恩罗加龙',     elements: ['ancient', 'holy', 'earth'],      avatar: 'assets/avatars/enluojia.png',        full: 'assets/full/enluojia.png',        level: 10 },
  { name: '弗朗格罗斯龙', elements: ['overlord', 'void', 'fire'],      avatar: 'assets/avatars/fulanggeluosi.png',   full: 'assets/full/fulanggeluosi.png',   level: 10 },
  { name: '弗洛斯克龙',   elements: ['ancient', 'holy', 'grass'],      avatar: 'assets/avatars/fuluosike.png',       full: 'assets/full/fuluosike.png',       level: 10 },
  { name: '格洛姆龙',     elements: ['ancient', 'holy', 'dark'],       avatar: 'assets/avatars/geluomu.png',         full: 'assets/full/geluomu.png',         level: 10 },
  { name: '黄金流明龙',   elements: ['overlord', 'light', 'electric'], avatar: 'assets/avatars/huangjinliuming.png', full: 'assets/full/huangjinliuming.png', level: 10 },
  { name: '铠甲幻龙',     elements: ['overlord', 'light', 'breeze'],   avatar: 'assets/avatars/kaijiahuan.png',      full: 'assets/full/kaijiahuan.png',      level: 10 },
  { name: '酷斯龙',       elements: ['ancient', 'holy', 'steel'],      avatar: 'assets/avatars/kusu.png',            full: 'assets/full/kusu.png',            level: 10 },
  { name: '拉帝纳龙',     elements: ['overlord', 'fire', 'void'],      avatar: 'assets/avatars/ladina.png',          full: 'assets/full/ladina.png',          level: 10 },
  { name: '莱斯克龙',     elements: ['ancient', 'holy', 'light'],      avatar: 'assets/avatars/laiske.png',          full: 'assets/full/laiske.png',          level: 10 },
  { name: '棱镜龙',       elements: ['overlord', 'void', 'light'],     avatar: 'assets/avatars/prism.png',           full: 'assets/full/prism.png',           level: 10 },
  { name: '烈焰韦尼斯龙', elements: ['overlord', 'electric', 'fire'],  avatar: 'assets/avatars/lieyanweinisi.png',   full: 'assets/full/lieyanweinisi.png',   level: 10 },
  { name: '卢兹拉龙',     elements: ['ancient', 'light', 'dark'],      avatar: 'assets/avatars/luzila.png',          full: 'assets/full/luzila.png',          level: 10 },
  { name: '米格拉龙',     elements: ['overlord', 'water', 'electric'], avatar: 'assets/avatars/migela.png',          full: 'assets/full/migela.png',          level: 10 },
  { name: '尼尔龙',       elements: ['ancient', 'holy', 'void'],       avatar: 'assets/avatars/nier.png',            full: 'assets/full/nier.png',            level: 10 },
  { name: '索尔登龙',     elements: ['ancient', 'earth', 'light'],     avatar: 'assets/avatars/suoerdeng.png',       full: 'assets/full/suoerdeng.png',       level: 10 },
  { name: '文丘龙',       elements: ['ancient', 'holy', 'breeze'],     avatar: 'assets/avatars/wenqiu.png',          full: 'assets/full/wenqiu.png',          level: 10 },
  { name: '乌姆布拉龙',   elements: ['overlord', 'fire', 'electric'],  avatar: 'assets/avatars/wumubula.png',        full: 'assets/full/wumubula.png',        level: 10 },
  { name: '伊奥斯加龙',   elements: ['ancient', 'fire', 'grass'],      avatar: 'assets/avatars/yiao.png',            full: 'assets/full/yiao.png',            level: 10 },
  { name: '伊克斯龙',     elements: ['ancient', 'electric', 'fire'],   avatar: 'assets/avatars/yikesi.png',          full: 'assets/full/yikesi.png',          level: 10 },
  { name: '佐尔托龙',     elements: ['ancient', 'holy', 'electric'],   avatar: 'assets/avatars/zuoerto.png',         full: 'assets/full/zuoerto.png',         level: 10 },
];

const GUIDE_BLANK_AVATAR = 'assets/avatars/blank.png';
const GUIDE_BLANK_FULL = 'assets/full/blank.png';
