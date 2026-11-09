export const CATEGORIES = {
  health: { name: '健康', color: '#f8c471', symbol: '✦' },
  selfcare: { name: '个人护理', color: '#eccce5', symbol: '≈' },
  office: { name: '办公室', color: '#fa6856', symbol: '✿' },
  transport: { name: '交通', color: '#529483', symbol: '↝' },
  switch: { name: '角色交换', color: '#8865b4', symbol: '⇄' },
  food: { name: '食品', color: '#f58b25', symbol: '✳' },
  fashion: { name: '服饰', color: '#3e52aa', symbol: '✧' },
};

// Coordinates are in the exported Illustrator board's 1287 × 1819 image.
const cells = [
  ['start', 202, 374], ['health', 347, 374], ['selfcare', 492, 374],
  ['office', 637, 374], ['transport', 855, 374], ['switch', 1072, 479],
  ['office', 927, 584], ['food', 782, 584], ['fashion', 637, 584],
  ['transport', 420, 584], ['health', 202, 690], ['food', 347, 795],
  ['office', 492, 795], ['switch', 637, 795], ['selfcare', 782, 795],
  ['health', 927, 795], ['transport', 1072, 900], ['fashion', 927, 1005],
  ['food', 782, 1005], ['office', 637, 1005], ['selfcare', 492, 1005],
  ['switch', 347, 1005], ['fashion', 202, 1110], ['selfcare', 347, 1216],
  ['health', 492, 1216], ['food', 637, 1216], ['fashion', 782, 1216],
  ['switch', 927, 1216], ['office', 1072, 1321], ['health', 927, 1426],
  ['selfcare', 782, 1426], ['switch', 637, 1426], ['selfcare', 492, 1426],
  ['fashion', 347, 1426], ['transport', 202, 1531], ['food', 347, 1636],
  ['health', 492, 1636], ['office', 637, 1636], ['switch', 782, 1636],
  ['selfcare', 927, 1636], ['finish', 1072, 1636],
];
export const BOARD = cells.map(([category, x, y], index) => ({ index, category, x, y }));
export const FINISH = BOARD.length - 1;

const card = (id, category, name, blue, pink, knowledge = '', detail = '') =>
  ({ id, category, name, blue, pink, knowledge, detail, image: `assets/cards/${id}.png` });

// Signed amounts: income is positive; spending is negative. One of each unique card
// for the first prototype. Salary artwork pages 13/14 are retained as source copies.
export const CARDS = [
  card('shampoo', 'selfcare', '洗发水', -7, -15, '女性个人护理产品有时会比男性同类产品定价更高，即使成分相同。'),
  card('razor', 'selfcare', '剃须刀', -6, -8, '面向女性销售的剃须刀，可能带有更高的价格标签。'),
  card('haircut', 'selfcare', '理发', -20, -35, '即使发型相似，理发服务也可能向女性收取更高费用。'),
  card('body-wash', 'selfcare', '沐浴露', -8, -16, '相似成分的个人护理产品，也可能因面向不同性别的营销而产生价格差异。'),
  card('salary', 'office', '发薪日', 100, 80, '系统性偏见和不平等的议价机会，可能造成收入差距。', '按当前角色领取工资。'),
  card('performance', 'office', '绩效评估', 20, -15, '同样坚定的表达，可能被评价为有领导力，也可能被解读为过于强势。', 'Blue：领导潜力，获得奖励。Pink：被评价为过于强势，扣除费用。'),
  card('dress-code', 'office', '着装要求', -15, -35, '更严格的职场着装期待，可能带来额外支出。', 'Blue：休闲着装。Pink：商务正装。'),
  card('milk', 'food', '牛奶', -4, -4, '', '这次购买，两种角色支付相同的价格。'),
  card('apple', 'food', '苹果', -2, -2, '', '这次购买，两种角色支付相同的价格。'),
  card('yogurt', 'food', '酸奶', -3, -3, '', '这次购买，两种角色支付相同的价格。'),
  card('vegetables', 'food', '蔬菜', -6, -6, '', '这次购买，两种角色支付相同的价格。'),
  card('night-travel', 'transport', '夜晚回家', 0, -10, '夜晚独自步行时对骚扰和人身安全的担忧，可能让人选择更贵的交通方式。', 'Blue：步行。Pink：出租车。'),
  card('public-transit', 'transport', '公共交通', -2, -8, '对深夜出行安全的顾虑，可能使人改用价格更高的网约车。', 'Blue：夜班公交。Pink：网约车。'),
  card('car-repair', 'transport', '汽车维修', -100, -120, '同样的汽车维修服务，也可能出现与性别相关的报价差异。'),
  card('safety', 'transport', '安全用品', 0, -15, '为出行购买安全用品，会带来交通费用以外的支出。', 'Blue：无需购买。Pink：购买防身喷雾。'),
  card('medical', 'health', '医疗服务', 0, -50, '部分与女性相关的医疗服务不一定能获得完整保险覆盖。', 'Blue：保险全额覆盖。Pink：保险部分覆盖。'),
  card('medication', 'health', '药品费用', -50, -60, '与生殖健康等需求相关的药品，可能带来额外经济负担。'),
  card('painkillers', 'health', '止痛药', -8, -8, '', '这次购买，两种角色支付相同的价格。'),
  card('jacket', 'fashion', '夹克', -15, -20, '功能性口袋不足，可能意味着还需要购买一个包。', 'Pink 合计 $20，包含 $5 的包费。'),
  card('jeans', 'fashion', '牛仔裤', -15, -20, '较小的口袋可能无法满足携带需要，带来额外的配件支出。', 'Pink 合计 $20，包含 $5 的包费。'),
  card('bag', 'fashion', '包', -60, -100, '将女性的包作为奢侈品营销，可能推高其价格。'),
  card('gloves', 'fashion', '手套', -10, -13, '面向女性的手套可能更强调外观，而这些营销和设计差异也会影响价格。'),
];
export const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]));
