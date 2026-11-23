/* =========================================================
 * 图鉴数据
 *
 * 每页 16 个窗口（8 列 × 2 行），空位显示「头像-空白」。
 * 排序：按名字拼音首字母（A → Z），暂时手工排好。
 * avatar 指向 assets/avatars/ 下的原生 51×57 像素图。
 * ========================================================= */
const GUIDE_PER_PAGE = 16;

const GUIDE_DEX = [
  { name: '奥亚龙',     elements: ['ancient', 'holy', 'fire'],     avatar: 'assets/avatars/aoya.png', full: 'assets/full/aoya.png', level: 1 },
  { name: '巴哈吉尔龙', elements: ['ancient', 'holy', 'water'],    avatar: 'assets/avatars/bahajier.png', full: 'assets/full/bahajier.png', level: 1 },
  { name: '博卡拉龙',   elements: ['ancient', 'earth', 'fire'],    avatar: 'assets/avatars/bokara.png', full: 'assets/full/bokara.png', level: 100 },
  { name: '城市守护龙', elements: ['overlord', 'dark', 'earth'],   avatar: 'assets/avatars/city.png', full: 'assets/full/city.png', level: 100 },
  { name: '恩罗加龙',   elements: ['ancient', 'holy', 'earth'],    avatar: 'assets/avatars/enluojia.png', full: 'assets/full/enluojia.png', level: 1 },
  { name: '弗洛斯克龙', elements: ['ancient', 'holy', 'grass'],    avatar: 'assets/avatars/fuluosike.png', full: 'assets/full/fuluosike.png', level: 1 },
  { name: '格洛姆龙',   elements: ['ancient', 'holy', 'dark'],     avatar: 'assets/avatars/geluomu.png', full: 'assets/full/geluomu.png', level: 1 },
  { name: '酷斯龙',     elements: ['ancient', 'holy', 'steel'],    avatar: 'assets/avatars/kusu.png', full: 'assets/full/kusu.png', level: 100 },
  { name: '莱斯克龙',   elements: ['ancient', 'holy', 'light'],    avatar: 'assets/avatars/laiske.png', full: 'assets/full/laiske.png', level: 100 },
  { name: '棱镜龙',     elements: ['overlord', 'void', 'light'],   avatar: 'assets/avatars/prism.png', full: 'assets/full/prism.png', level: 100 },
  { name: '尼尔龙',     elements: ['ancient', 'holy', 'void'],     avatar: 'assets/avatars/nier.png', full: 'assets/full/nier.png', level: 1 },
  { name: '文丘龙',     elements: ['ancient', 'holy', 'breeze'],   avatar: 'assets/avatars/wenqiu.png', full: 'assets/full/wenqiu.png', level: 1 },
  { name: '伊奥斯加龙', elements: ['ancient', 'fire', 'grass'],    avatar: 'assets/avatars/yiao.png', full: 'assets/full/yiao.png', level: 100 },
  { name: '佐尔托龙',   elements: ['ancient', 'holy', 'electric'], avatar: 'assets/avatars/zuoerto.png', full: 'assets/full/zuoerto.png', level: 1 },
];

const GUIDE_BLANK_AVATAR = 'assets/avatars/blank.png';
const GUIDE_BLANK_FULL = 'assets/full/blank.png';
