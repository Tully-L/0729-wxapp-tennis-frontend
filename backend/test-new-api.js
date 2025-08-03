// 测试新数据库结构的API接口
const mongoose = require('mongoose');
const User = require('./src/models/User');
const UserAuth = require('./src/models/UserAuth');
const Event = require('./src/models/Event');
const UserEventRelation = require('./src/models/UserEventRelation');
const PointsRecord = require('./src/models/PointsRecord');

// 连接数据库
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-heat';
    await mongoose.connect(mongoURI);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

// 测试用户模型
const testUserModel = async () => {
  console.log('\n🧪 测试用户模型...');
  
  try {
    // 创建测试用户
    const testUser = new User({
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      total_points: 1500,
      status: 'active',
      ext_info: {
        level: 'intermediate',
        phone: '13800138000'
      }
    });
    
    await testUser.save();
    console.log('✅ 用户创建成功:', testUser._id);
    
    // 测试用户方法
    const level = testUser.getUserLevel();
    console.log('✅ 用户等级:', level);
    
    const canParticipate = testUser.canParticipateInEvent();
    console.log('✅ 可参与活动:', canParticipate);
    
    // 更新积分
    await testUser.updatePoints(100, '测试奖励');
    console.log('✅ 积分更新成功，当前积分:', testUser.total_points);
    
    return testUser;
  } catch (error) {
    console.error('❌ 用户模型测试失败:', error);
    throw error;
  }
};

// 测试用户认证模型
const testUserAuthModel = async (userId) => {
  console.log('\n🧪 测试用户认证模型...');
  
  try {
    // 创建微信认证
    const wechatAuth = new UserAuth({
      user_id: userId,
      auth_type: 'wechat',
      auth_id: 'test_openid_123',
      is_primary: true
    });
    
    await wechatAuth.save();
    console.log('✅ 微信认证创建成功');
    
    // 创建手机认证
    const phoneAuth = new UserAuth({
      user_id: userId,
      auth_type: 'phone',
      auth_id: '13800138000',
      is_primary: false
    });
    
    await phoneAuth.save();
    console.log('✅ 手机认证创建成功');
    
    // 测试查找用户
    const foundUser = await UserAuth.findUserByAuth('wechat', 'test_openid_123');
    console.log('✅ 通过认证查找用户成功:', foundUser ? foundUser._id : 'null');
    
    return { wechatAuth, phoneAuth };
  } catch (error) {
    console.error('❌ 用户认证模型测试失败:', error);
    throw error;
  }
};

// 测试事件模型
const testEventModel = async (userId) => {
  console.log('\n🧪 测试事件模型...');
  
  try {
    // 创建测试事件
    const testEvent = new Event({
      title: '测试网球比赛',
      category: '网球比赛',
      start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 7天后+4小时
      location: '北京网球中心',
      max_participants: 32,
      description: '这是一个测试网球比赛',
      status: 'published',
      ext_info: {
        organizer: { name: '测试组织者' },
        registrationFee: 100,
        surface: '硬地'
      },
      created_by: userId
    });
    
    await testEvent.save();
    console.log('✅ 事件创建成功:', testEvent._id);
    
    // 测试事件方法
    const canRegister = testEvent.canRegister();
    console.log('✅ 可以报名:', canRegister);
    
    // 更新状态
    await testEvent.updateStatus('ongoing');
    console.log('✅ 状态更新成功，当前状态:', testEvent.status);
    
    // 获取统计信息
    const stats = await testEvent.getEventStats();
    console.log('✅ 事件统计:', stats);
    
    return testEvent;
  } catch (error) {
    console.error('❌ 事件模型测试失败:', error);
    throw error;
  }
};

// 测试用户事件关系模型
const testUserEventRelationModel = async (userId, eventId) => {
  console.log('\n🧪 测试用户事件关系模型...');
  
  try {
    // 创建用户事件关系
    const relation = new UserEventRelation({
      user_id: userId,
      event_id: eventId,
      signup_status: 'registered',
      points: 0,
      points_type: 'participation'
    });
    
    await relation.save();
    console.log('✅ 用户事件关系创建成功');
    
    // 测试签到
    await relation.signIn();
    console.log('✅ 签到成功');
    
    // 添加积分
    await relation.addPoints(50, 'participation');
    console.log('✅ 积分添加成功，当前积分:', relation.points);
    
    // 设置排名
    await relation.setRank(1);
    console.log('✅ 排名设置成功，当前排名:', relation.rank);
    
    return relation;
  } catch (error) {
    console.error('❌ 用户事件关系模型测试失败:', error);
    throw error;
  }
};

// 测试积分记录模型
const testPointsRecordModel = async (userId, eventId, relationId) => {
  console.log('\n🧪 测试积分记录模型...');
  
  try {
    // 创建积分记录
    const record = await PointsRecord.createRecord(
      userId,
      eventId,
      relationId,
      100,
      '比赛获胜奖励',
      1600 // 余额
    );
    
    console.log('✅ 积分记录创建成功:', record._id);
    
    // 获取用户积分历史
    const history = await PointsRecord.getUserPointsHistory(userId, 1, 10);
    console.log('✅ 用户积分历史:', history.records.length, '条记录');
    
    // 获取事件积分统计
    const eventStats = await PointsRecord.getEventPointsStats(eventId);
    console.log('✅ 事件积分统计:', eventStats);
    
    return record;
  } catch (error) {
    console.error('❌ 积分记录模型测试失败:', error);
    throw error;
  }
};

// 主测试函数
const runTests = async () => {
  console.log('🚀 开始测试新数据库结构...\n');
  
  try {
    await connectDB();
    
    // 清理测试数据
    await User.deleteMany({ nickname: '测试用户' });
    await UserAuth.deleteMany({ auth_id: { $in: ['test_openid_123', '13800138000'] } });
    await Event.deleteMany({ title: '测试网球比赛' });
    
    // 运行测试
    const user = await testUserModel();
    const auths = await testUserAuthModel(user._id);
    const event = await testEventModel(user._id);
    const relation = await testUserEventRelationModel(user._id, event._id);
    const record = await testPointsRecordModel(user._id, event._id, relation._id);
    
    console.log('\n🎉 所有测试通过！');
    console.log('📊 测试结果汇总:');
    console.log(`- 用户ID: ${user._id}`);
    console.log(`- 事件ID: ${event._id}`);
    console.log(`- 关系ID: ${relation._id}`);
    console.log(`- 记录ID: ${record._id}`);
    
  } catch (error) {
    console.error('\n💥 测试失败:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
};

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
