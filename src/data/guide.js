/* =========================================================
 * 图鉴数据
 *
 * 每页 16 个窗口（8 列 × 2 行），空位显示「头像-空白」。
 * 排序：按名字拼音首字母（A → Z），暂时手工排好。
 * avatar 指向 assets/avatars/ 下的原生 51×57 像素图。
 * ========================================================= */
const GUIDE_PER_PAGE = 16;

const GUIDE_DEX = [
  { name: '奥亚龙',     elements: ['ancient', 'holy', 'fire'],     avatar: 'assets/avatars/aoya.png' },
  { name: '巴哈吉尔龙', elements: ['ancient', 'holy', 'water'],    avatar: 'assets/avatars/bahajier.png' },
  { name: '博卡拉龙',   elements: ['ancient', 'earth', 'fire'],    avatar: 'assets/avatars/bokara.png' },
  { name: '城市守护龙', elements: ['overlord', 'dark', 'earth'],   avatar: 'assets/avatars/city.png' },
  { name: '恩罗加龙',   elements: ['ancient', 'holy', 'earth'],    avatar: 'assets/avatars/enluojia.png' },
  { name: '弗洛斯克龙', elements: ['ancient', 'holy', 'grass'],    avatar: 'assets/avatars/fuluosike.png' },
  { name: '格洛姆龙',   elements: ['ancient', 'holy', 'dark'],     avatar: 'assets/avatars/geluomu.png' },
  { name: '酷斯龙',     elements: ['ancient', 'holy', 'steel'],    avatar: 'assets/avatars/kusu.png' },
  { name: '莱斯克龙',   elements: ['ancient', 'holy', 'light'],    avatar: 'assets/avatars/laiske.png' },
  { name: '棱镜龙',     elements: ['overlord', 'void', 'light'],   avatar: 'assets/avatars/prism.png' },
  { name: '尼尔龙',     elements: ['ancient', 'holy', 'void'],     avatar: 'assets/avatars/nier.png' },
  { name: '文丘龙',     elements: ['ancient', 'holy', 'breeze'],   avatar: 'assets/avatars/wenqiu.png' },
  { name: '伊奥斯加龙', elements: ['ancient', 'fire', 'grass'],    avatar: 'assets/avatars/yiao.png' },
  { name: '佐尔托龙',   elements: ['ancient', 'holy', 'electric'], avatar: 'assets/avatars/zuoerto.png' },
];

const GUIDE_BLANK_AVATAR = 'assets/avatars/blank.png';
