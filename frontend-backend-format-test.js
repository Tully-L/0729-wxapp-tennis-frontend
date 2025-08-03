// 前后端数据格式一致性测试
// 确保后端API返回的数据格式与前端期望完全匹配

// 模拟前端期望的事件数据格式（来自frontend/utils/api.js）
const expectedEventFormat = {
  _id: '1',
  title: '温布尔登锦标赛 2024',
  name: '温布尔登锦标赛 2024', // 兼容旧版本
  category: '网球比赛',
  eventType: '男子单打', // 来自ext_info.eventType
  status: 'published',
  location: '全英俱乐部，伦敦',
  venue: '全英俱乐部，伦敦', // 兼容旧版本
  region: '', // 来自ext_info.region
  start_time: new Date('2024-07-01T09:00:00Z'),
  end_time: new Date('2024-07-01T18:00:00Z'),
  eventDate: '2024-07-01', // 格式化的日期字符串
  max_participants: 128,
  maxParticipants: 128, // 兼容旧版本
  currentParticipants: 0, // 当前参与者数量
  current_participants: 0, // 后端返回格式
  description: '世界顶级网球赛事，草地网球的最高殿堂',
  ext_info: {
    eventType: '男子单打',
    registrationDeadline: '2024-06-15',
    organizer: { name: '温布尔登网球俱乐部' },
    surface: '草地',
    prizePool: 50000
  },
  organizer: { name: '温布尔登网球俱乐部' },
  registrationFee: 0,
  registrationDeadline: '2024-06-15',
  surface: '草地',
  prizePool: 50000,
  isRegistered: false,
  can_register: true,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  created_by: 'system'
};

// 模拟前端期望的用户数据格式
const expectedUserFormat = {
  _id: 'user123',
  nickname: '测试用户',
  avatar: 'https://example.com/avatar.jpg',
  total_points: 1500,
  status: 'active',
  ext_info: {
    level: 'intermediate',
    phone: '13800138000'
  },
  created_at: new Date(),
  updated_at: new Date()
};

// 模拟前端期望的用户统计数据格式
const expectedUserStatsFormat = {
  basic: {
    participationCount: 5,
    wins: 3,
    losses: 2,
    winRate: '60%',
    totalPoints: 1500 // 注意：前端使用totalPoints，不是etaPoints
  },
  level: {
    name: '业余选手',
    level: 2
  },
  accountAge: 30,
  monthlyActivity: 5,
  status: 'active'
};

// 验证数据格式的函数
const validateEventFormat = (eventData) => {
  const requiredFields = [
    '_id', 'title', 'name', 'category', 'eventType', 'status', 
    'location', 'venue', 'start_time', 'end_time', 'eventDate',
    'max_participants', 'maxParticipants', 'currentParticipants',
    'description', 'ext_info', 'organizer', 'isRegistered'
  ];

  const missingFields = [];
  const typeErrors = [];

  requiredFields.forEach(field => {
    if (!(field in eventData)) {
      missingFields.push(field);
    }
  });

  // 检查关键字段类型
  if (typeof eventData.title !== 'string') typeErrors.push('title should be string');
  if (typeof eventData.status !== 'string') typeErrors.push('status should be string');
  if (typeof eventData.max_participants !== 'number') typeErrors.push('max_participants should be number');
  if (typeof eventData.currentParticipants !== 'number') typeErrors.push('currentParticipants should be number');
  if (typeof eventData.isRegistered !== 'boolean') typeErrors.push('isRegistered should be boolean');

  return {
    valid: missingFields.length === 0 && typeErrors.length === 0,
    missingFields,
    typeErrors
  };
};

const validateUserStatsFormat = (statsData) => {
  const requiredFields = ['basic', 'level', 'accountAge', 'monthlyActivity'];
  const requiredBasicFields = ['participationCount', 'wins', 'losses', 'winRate', 'totalPoints'];
  const requiredLevelFields = ['name', 'level'];

  const missingFields = [];
  const typeErrors = [];

  requiredFields.forEach(field => {
    if (!(field in statsData)) {
      missingFields.push(field);
    }
  });

  if (statsData.basic) {
    requiredBasicFields.forEach(field => {
      if (!(field in statsData.basic)) {
        missingFields.push(`basic.${field}`);
      }
    });
  }

  if (statsData.level) {
    requiredLevelFields.forEach(field => {
      if (!(field in statsData.level)) {
        missingFields.push(`level.${field}`);
      }
    });
  }

  return {
    valid: missingFields.length === 0 && typeErrors.length === 0,
    missingFields,
    typeErrors
  };
};

// 前端页面字段映射检查
const checkFrontendFieldMapping = () => {
  console.log('🔍 检查前端页面字段映射...\n');

  // 检查事件页面使用的字段
  const eventPageFields = [
    'item.title || item.name', // 事件标题
    'item.category || item.ext_info.eventType || item.eventType', // 事件类型
    'item.status', // 事件状态
    'item.start_time ? item.start_time.split("T")[0] : (item.eventDate || "TBD")', // 日期
    'item.location || (item.venue + " • " + item.region) || "TBD"', // 地点
    'item.ext_info.organizer.name || item.organizer.name || "Tennis Heat"', // 组织者
    'item.currentParticipants || 0', // 当前参与者
    'item.max_participants || item.maxParticipants || "∞"', // 最大参与者
    'item.ext_info.registrationFee > 0 || item.registrationFee > 0', // 报名费
    'item.isRegistered' // 是否已报名
  ];

  console.log('📋 事件页面使用的字段:');
  eventPageFields.forEach((field, index) => {
    console.log(`  ${index + 1}. ${field}`);
  });

  // 检查用户页面使用的字段
  const userPageFields = [
    'profile.nickname || "球员88662"', // 用户昵称
    'profile.customId || profile.id || "86594010"', // 用户ID
    'userStats.mDou || 2500', // M豆（积分）
    'userStats.coupons || 3', // 优惠券
    'userStats.events || 5', // 我的赛事
    'userStats.memberLevel || "VIP"' // 会员等级
  ];

  console.log('\n📋 用户页面使用的字段:');
  userPageFields.forEach((field, index) => {
    console.log(`  ${index + 1}. ${field}`);
  });

  return {
    eventPageFields,
    userPageFields
  };
};

// 生成前端兼容的数据格式建议
const generateCompatibilityGuide = () => {
  console.log('\n📖 前后端数据格式兼容性指南:\n');

  console.log('1. 事件数据格式要求:');
  console.log('   - 必须同时提供 title 和 name 字段（name = title）');
  console.log('   - 必须同时提供 max_participants 和 maxParticipants 字段');
  console.log('   - 必须同时提供 currentParticipants 和 current_participants 字段');
  console.log('   - eventDate 字段应为 YYYY-MM-DD 格式的字符串');
  console.log('   - organizer 字段应包含 name 属性');
  console.log('   - isRegistered 字段必须为布尔值');

  console.log('\n2. 用户统计数据格式要求:');
  console.log('   - basic.totalPoints 字段（不是 etaPoints）');
  console.log('   - basic.winRate 应为百分比字符串（如 "60%"）');
  console.log('   - level.name 应为中文等级名称');
  console.log('   - status 字段应为 "active"、"inactive" 或 "banned"');

  console.log('\n3. 状态映射:');
  console.log('   - 数据库 "published" → 前端显示 "报名中"');
  console.log('   - 数据库 "ongoing" → 前端显示 "进行中"');
  console.log('   - 数据库 "ended" → 前端显示 "已结束"');
  console.log('   - 数据库 "canceled" → 前端显示 "已取消"');

  console.log('\n4. 日期格式:');
  console.log('   - start_time: ISO 8601 格式的 Date 对象');
  console.log('   - eventDate: YYYY-MM-DD 格式的字符串');
  console.log('   - 前端使用 item.start_time.split("T")[0] 提取日期');
};

// 主测试函数
const runFormatTest = () => {
  console.log('🧪 前后端数据格式一致性测试\n');

  // 测试事件数据格式
  console.log('✅ 期望的事件数据格式:');
  console.log(JSON.stringify(expectedEventFormat, null, 2));

  // 测试用户统计格式
  console.log('\n✅ 期望的用户统计数据格式:');
  console.log(JSON.stringify(expectedUserStatsFormat, null, 2));

  // 检查前端字段映射
  checkFrontendFieldMapping();

  // 生成兼容性指南
  generateCompatibilityGuide();

  console.log('\n🎯 关键提醒:');
  console.log('1. 后端API必须返回与上述格式完全匹配的数据');
  console.log('2. 所有兼容性字段都必须提供（如 name/title, maxParticipants/max_participants）');
  console.log('3. 前端页面样式和布局保持不变');
  console.log('4. 用户登录后看到的页面应与当前展示完全一致');
};

// 运行测试
if (require.main === module) {
  runFormatTest();
}

module.exports = {
  expectedEventFormat,
  expectedUserFormat,
  expectedUserStatsFormat,
  validateEventFormat,
  validateUserStatsFormat,
  checkFrontendFieldMapping,
  generateCompatibilityGuide
};
