const mongoose = require('mongoose');
require('dotenv').config();

// 导入模型
const User = require('../src/models/User');
const UserAuth = require('../src/models/UserAuth');
const Event = require('../src/models/Event');
const UserEventRelation = require('../src/models/UserEventRelation');
const PointsRecord = require('../src/models/PointsRecord');

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 创建测试用户
async function createTestUsers() {
  console.log('👤 创建测试用户...');

  const users = [
    {
      nickname: '网球爱好者小王',
      avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKxrUx7SBp1xGcHebTXS1AiaVVKVibKt8h1XiaN6CIVGu2cj2GDcHBL4JIa1CJicQn7ZibGKOLd1CgC1TA/132',
      total_points: 1500,
      status: 'active'
    },
    {
      nickname: '业余选手张三',
      avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKxrUx7SBp1xGcHebTXS1AiaVVKVibKt8h1XiaN6CIVGu2cj2GDcHBL4JIa1CJicQn7ZibGKOLd1CgC1TA/132',
      total_points: 2800,
      status: 'active'
    },
    {
      nickname: '网球新手李四',
      avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKxrUx7SBp1xGcHebTXS1AiaVVKVibKt8h1XiaN6CIVGu2cj2GDcHBL4JIa1CJicQn7ZibGKOLd1CgC1TA/132',
      total_points: 800,
      status: 'active'
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = new User(userData);
    await user.save();
    createdUsers.push(user);

    // 为每个用户创建微信认证记录
    const userAuth = new UserAuth({
      user_id: user._id,
      auth_type: 'wechat',
      auth_id: `wx_test_${user._id.toString().slice(-8)}`,
      is_primary: true
    });
    await userAuth.save();

    console.log(`  ✅ 创建用户: ${user.nickname} (${user.total_points}积分)`);
  }

  return createdUsers;
}

// 创建测试事件
async function createTestEvents() {
  console.log('🎾 创建测试事件...');

  const events = [
    {
      title: '温布尔登锦标赛 2024',
      category: '网球比赛',
      start_time: new Date('2024-07-01T09:00:00Z'),
      end_time: new Date('2024-07-01T18:00:00Z'),
      location: '全英俱乐部，伦敦',
      max_participants: 128,
      status: 'published',
      description: '世界顶级网球赛事，草地网球的最高殿堂',
      ext_info: {
        eventType: '男子单打',
        registrationDeadline: '2024-06-15',
        organizer: { name: '温布尔登网球俱乐部' },
        surface: '草地',
        prizePool: 50000,
        registrationFee: 0
      }
    },
    {
      title: '法国网球公开赛 2024',
      category: '网球比赛',
      start_time: new Date('2024-05-26T09:00:00Z'),
      end_time: new Date('2024-06-09T18:00:00Z'),
      location: '罗兰·加洛斯球场，巴黎',
      max_participants: 128,
      status: 'ongoing',
      description: '红土之王的较量，法网公开赛',
      ext_info: {
        eventType: '男子单打',
        registrationDeadline: '2024-05-01',
        organizer: { name: '法国网球协会' },
        surface: '红土',
        prizePool: 45000,
        registrationFee: 100
      }
    },
    {
      title: '澳大利亚网球公开赛 2024',
      category: '网球比赛',
      start_time: new Date('2024-01-14T09:00:00Z'),
      end_time: new Date('2024-01-28T18:00:00Z'),
      location: '墨尔本公园，墨尔本',
      max_participants: 128,
      status: 'ended',
      description: '新年第一个大满贯赛事',
      ext_info: {
        eventType: '男子单打',
        registrationDeadline: '2023-12-15',
        organizer: { name: '澳大利亚网球协会' },
        surface: '硬地',
        prizePool: 55000,
        registrationFee: 150
      }
    }
  ];

  const createdEvents = [];
  for (const eventData of events) {
    const event = new Event(eventData);
    await event.save();
    createdEvents.push(event);
    console.log(`  ✅ 创建事件: ${event.title} (${event.status})`);
  }

  return createdEvents;
}

// 创建用户事件关系
async function createUserEventRelations(users, events) {
  console.log('🔗 创建用户事件关系...');

  // 用户1参加事件1和2
  const relation1 = new UserEventRelation({
    user_id: users[0]._id,
    event_id: events[0]._id,
    signup_status: 'approved',
    signup_time: new Date(),
    is_signin: true,
    points: 100,
    points_type: 'participation'
  });
  await relation1.save();

  const relation2 = new UserEventRelation({
    user_id: users[0]._id,
    event_id: events[1]._id,
    signup_status: 'approved',
    signup_time: new Date(),
    is_signin: false,
    points: 0,
    points_type: 'participation'
  });
  await relation2.save();

  // 用户2参加事件1
  const relation3 = new UserEventRelation({
    user_id: users[1]._id,
    event_id: events[0]._id,
    signup_status: 'approved',
    signup_time: new Date(),
    is_signin: true,
    points: 150,
    points_type: 'participation',
    rank: 1
  });
  await relation3.save();

  console.log('  ✅ 创建了3个用户事件关系');
}

// 创建积分记录
async function createPointsRecords(users) {
  console.log('💰 创建积分记录...');

  const records = [
    {
      user_id: users[0]._id,
      amount: 100,
      reason: '参与温布尔登锦标赛',
      balance_after: 1500
    },
    {
      user_id: users[1]._id,
      amount: 150,
      reason: '温布尔登锦标赛第一名',
      balance_after: 2800
    },
    {
      user_id: users[2]._id,
      amount: 50,
      reason: '新用户注册奖励',
      balance_after: 800
    }
  ];

  for (const recordData of records) {
    const record = new PointsRecord(recordData);
    await record.save();
    console.log(`  ✅ 创建积分记录: ${recordData.reason} (+${recordData.amount})`);
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始创建测试数据...\n');

    await connectDB();

    // 清空现有数据（仅用于测试）
    console.log('🧹 清空现有数据...');
    await User.deleteMany({});
    await UserAuth.deleteMany({});
    await Event.deleteMany({});
    await UserEventRelation.deleteMany({});
    await PointsRecord.deleteMany({});

    // 创建测试数据
    const users = await createTestUsers();
    const events = await createTestEvents();
    await createUserEventRelations(users, events);
    await createPointsRecords(users);

    console.log('\n🎉 测试数据创建完成！');
    console.log('📊 数据统计:');
    console.log(`  - 用户: ${users.length}个`);
    console.log(`  - 事件: ${events.length}个`);
    console.log(`  - 用户事件关系: 3个`);
    console.log(`  - 积分记录: 3个`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { main };