// 为Atlas数据库创建测试数据的脚本
const mongoose = require('mongoose');

// Atlas连接字符串
const MONGODB_URI = 'mongodb+srv://Tully:147LBlei258@cluster0.cfkzz8t.mongodb.net/tennis_heat?retryWrites=true&w=majority&appName=Cluster0';

// 简化的模型定义
const userSchema = new mongoose.Schema({
  nickname: String,
  avatar: String,
  total_points: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const userAuthSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  auth_type: String,
  auth_id: String,
  is_primary: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const eventSchema = new mongoose.Schema({
  title: String,
  category: String,
  start_time: Date,
  end_time: Date,
  location: String,
  max_participants: Number,
  status: { type: String, default: 'published' },
  description: String,
  ext_info: mongoose.Schema.Types.Mixed,
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const userEventRelationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  signup_status: { type: String, default: 'pending' },
  signup_time: { type: Date, default: Date.now },
  is_signin: { type: Boolean, default: false },
  points: { type: Number, default: 0 },
  points_type: String,
  rank: Number,
  created_at: { type: Date, default: Date.now }
});

const pointsRecordSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  reason: String,
  balance_after: Number,
  created_at: { type: Date, default: Date.now }
});

// 创建模型
const User = mongoose.model('User', userSchema);
const UserAuth = mongoose.model('UserAuth', userAuthSchema);
const Event = mongoose.model('Event', eventSchema);
const UserEventRelation = mongoose.model('UserEventRelation', userEventRelationSchema);
const PointsRecord = mongoose.model('PointsRecord', pointsRecordSchema);

async function createTestData() {
  try {
    console.log('🔄 连接MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 连接成功!');

    // 清空现有数据
    console.log('🧹 清空现有数据...');
    await User.deleteMany({});
    await UserAuth.deleteMany({});
    await Event.deleteMany({});
    await UserEventRelation.deleteMany({});
    await PointsRecord.deleteMany({});

    // 创建用户
    console.log('👤 创建测试用户...');
    const users = await User.create([
      {
        nickname: '网球爱好者小王',
        avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKxrUx7SBp1xGcHebTXS1AiaVVKVibKt8h1XiaN6CIVGu2cj2GDcHBL4JIa1CJicQn7ZibGKOLd1CgC1TA/132',
        total_points: 1500
      },
      {
        nickname: '业余选手张三',
        avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKxrUx7SBp1xGcHebTXS1AiaVVKVibKt8h1XiaN6CIVGu2cj2GDcHBL4JIa1CJicQn7ZibGKOLd1CgC1TA/132',
        total_points: 2800
      },
      {
        nickname: '网球新手李四',
        avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKxrUx7SBp1xGcHebTXS1AiaVVKVibKt8h1XiaN6CIVGu2cj2GDcHBL4JIa1CJicQn7ZibGKOLd1CgC1TA/132',
        total_points: 800
      }
    ]);

    // 为每个用户创建认证记录
    console.log('🔐 创建用户认证记录...');
    for (const user of users) {
      await UserAuth.create({
        user_id: user._id,
        auth_type: 'wechat',
        auth_id: `wx_test_${user._id.toString().slice(-8)}`,
        is_primary: true
      });
    }

    // 创建事件
    console.log('🎾 创建测试事件...');
    const events = await Event.create([
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
    ]);

    // 创建用户事件关系
    console.log('🔗 创建用户事件关系...');
    await UserEventRelation.create([
      {
        user_id: users[0]._id,
        event_id: events[0]._id,
        signup_status: 'approved',
        is_signin: true,
        points: 100,
        points_type: 'participation'
      },
      {
        user_id: users[1]._id,
        event_id: events[0]._id,
        signup_status: 'approved',
        is_signin: true,
        points: 150,
        points_type: 'participation',
        rank: 1
      },
      {
        user_id: users[0]._id,
        event_id: events[1]._id,
        signup_status: 'approved',
        is_signin: false,
        points: 0,
        points_type: 'participation'
      }
    ]);

    // 创建积分记录
    console.log('💰 创建积分记录...');
    await PointsRecord.create([
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
    ]);

    console.log('\n🎉 测试数据创建完成！');
    console.log('📊 数据统计:');
    console.log(`  - 用户: ${users.length}个`);
    console.log(`  - 事件: ${events.length}个`);
    console.log(`  - 用户事件关系: 3个`);
    console.log(`  - 积分记录: 3个`);

  } catch (error) {
    console.error('❌ 创建数据失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

createTestData();
