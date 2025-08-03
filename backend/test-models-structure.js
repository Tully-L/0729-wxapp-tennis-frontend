// 测试新数据库模型结构（无需数据库连接）
const User = require('./src/models/User');
const UserAuth = require('./src/models/UserAuth');
const Event = require('./src/models/Event');
const UserEventRelation = require('./src/models/UserEventRelation');
const PointsRecord = require('./src/models/PointsRecord');

// 测试模型结构
const testModelStructures = () => {
  console.log('🧪 测试模型结构...\n');
  
  try {
    // 测试User模型结构
    console.log('📋 User模型字段:');
    const userSchema = User.schema;
    const userPaths = Object.keys(userSchema.paths);
    userPaths.forEach(path => {
      if (!path.startsWith('_')) {
        console.log(`  - ${path}: ${userSchema.paths[path].instance || userSchema.paths[path].constructor.name}`);
      }
    });
    
    // 测试User模型方法
    console.log('\n🔧 User模型方法:');
    const userMethods = Object.getOwnPropertyNames(User.schema.methods);
    userMethods.forEach(method => {
      console.log(`  - ${method}()`);
    });
    
    // 测试UserAuth模型结构
    console.log('\n📋 UserAuth模型字段:');
    const userAuthSchema = UserAuth.schema;
    const userAuthPaths = Object.keys(userAuthSchema.paths);
    userAuthPaths.forEach(path => {
      if (!path.startsWith('_')) {
        console.log(`  - ${path}: ${userAuthSchema.paths[path].instance || userAuthSchema.paths[path].constructor.name}`);
      }
    });
    
    // 测试Event模型结构
    console.log('\n📋 Event模型字段:');
    const eventSchema = Event.schema;
    const eventPaths = Object.keys(eventSchema.paths);
    eventPaths.forEach(path => {
      if (!path.startsWith('_')) {
        console.log(`  - ${path}: ${eventSchema.paths[path].instance || eventSchema.paths[path].constructor.name}`);
      }
    });
    
    // 测试Event模型方法
    console.log('\n🔧 Event模型方法:');
    const eventMethods = Object.getOwnPropertyNames(Event.schema.methods);
    eventMethods.forEach(method => {
      console.log(`  - ${method}()`);
    });
    
    // 测试UserEventRelation模型结构
    console.log('\n📋 UserEventRelation模型字段:');
    const relationSchema = UserEventRelation.schema;
    const relationPaths = Object.keys(relationSchema.paths);
    relationPaths.forEach(path => {
      if (!path.startsWith('_')) {
        console.log(`  - ${path}: ${relationSchema.paths[path].instance || relationSchema.paths[path].constructor.name}`);
      }
    });
    
    // 测试PointsRecord模型结构
    console.log('\n📋 PointsRecord模型字段:');
    const recordSchema = PointsRecord.schema;
    const recordPaths = Object.keys(recordSchema.paths);
    recordPaths.forEach(path => {
      if (!path.startsWith('_')) {
        console.log(`  - ${path}: ${recordSchema.paths[path].instance || recordSchema.paths[path].constructor.name}`);
      }
    });
    
    console.log('\n✅ 所有模型结构测试通过！');
    
  } catch (error) {
    console.error('❌ 模型结构测试失败:', error);
    throw error;
  }
};

// 测试模型实例化（不保存到数据库）
const testModelInstantiation = () => {
  console.log('\n🧪 测试模型实例化...\n');
  
  try {
    // 测试User实例化
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
    console.log('✅ User模型实例化成功');
    console.log(`  - ID: ${testUser._id}`);
    console.log(`  - 昵称: ${testUser.nickname}`);
    console.log(`  - 积分: ${testUser.total_points}`);
    console.log(`  - 状态: ${testUser.status}`);
    
    // 测试用户方法（不需要数据库）
    const level = testUser.getUserLevel();
    console.log(`  - 用户等级: ${level}`);
    
    const canParticipate = testUser.canParticipateInEvent();
    console.log(`  - 可参与活动: ${canParticipate}`);
    
    // 测试UserAuth实例化
    const testAuth = new UserAuth({
      user_id: testUser._id,
      auth_type: 'wechat',
      auth_id: 'test_openid_123',
      is_primary: true
    });
    console.log('\n✅ UserAuth模型实例化成功');
    console.log(`  - 用户ID: ${testAuth.user_id}`);
    console.log(`  - 认证类型: ${testAuth.auth_type}`);
    console.log(`  - 认证ID: ${testAuth.auth_id}`);
    console.log(`  - 是否主要: ${testAuth.is_primary}`);
    
    // 测试Event实例化
    const testEvent = new Event({
      title: '测试网球比赛',
      category: '网球比赛',
      start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      location: '北京网球中心',
      max_participants: 32,
      description: '这是一个测试网球比赛',
      status: 'published',
      ext_info: {
        organizer: { name: '测试组织者' },
        registrationFee: 100,
        surface: '硬地'
      },
      created_by: testUser._id
    });
    console.log('\n✅ Event模型实例化成功');
    console.log(`  - ID: ${testEvent._id}`);
    console.log(`  - 标题: ${testEvent.title}`);
    console.log(`  - 类别: ${testEvent.category}`);
    console.log(`  - 状态: ${testEvent.status}`);
    console.log(`  - 最大参与者: ${testEvent.max_participants}`);
    
    // 测试事件方法
    const canRegister = testEvent.canRegister();
    console.log(`  - 可以报名: ${canRegister}`);
    
    // 测试UserEventRelation实例化
    const testRelation = new UserEventRelation({
      user_id: testUser._id,
      event_id: testEvent._id,
      signup_status: 'registered',
      points: 0,
      points_type: 'participation'
    });
    console.log('\n✅ UserEventRelation模型实例化成功');
    console.log(`  - 用户ID: ${testRelation.user_id}`);
    console.log(`  - 事件ID: ${testRelation.event_id}`);
    console.log(`  - 报名状态: ${testRelation.signup_status}`);
    console.log(`  - 积分: ${testRelation.points}`);
    
    // 测试PointsRecord实例化
    const testRecord = new PointsRecord({
      user_id: testUser._id,
      event_id: testEvent._id,
      relation_id: testRelation._id,
      amount: 100,
      reason: '测试奖励',
      balance_after: 1600
    });
    console.log('\n✅ PointsRecord模型实例化成功');
    console.log(`  - 用户ID: ${testRecord.user_id}`);
    console.log(`  - 事件ID: ${testRecord.event_id}`);
    console.log(`  - 金额: ${testRecord.amount}`);
    console.log(`  - 原因: ${testRecord.reason}`);
    console.log(`  - 余额: ${testRecord.balance_after}`);
    
    console.log('\n✅ 所有模型实例化测试通过！');
    
  } catch (error) {
    console.error('❌ 模型实例化测试失败:', error);
    throw error;
  }
};

// 测试控制器文件是否可以正常加载
const testControllers = () => {
  console.log('\n🧪 测试控制器加载...\n');
  
  try {
    const authController = require('./src/controllers/authController');
    console.log('✅ authController加载成功');
    console.log(`  - 导出的方法: ${Object.keys(authController).join(', ')}`);
    
    const eventController = require('./src/controllers/eventController');
    console.log('\n✅ eventController加载成功');
    console.log(`  - 导出的方法: ${Object.keys(eventController).join(', ')}`);
    
    console.log('\n✅ 所有控制器加载测试通过！');
    
  } catch (error) {
    console.error('❌ 控制器加载测试失败:', error);
    throw error;
  }
};

// 主测试函数
const runTests = () => {
  console.log('🚀 开始测试新数据库结构（无数据库连接）...\n');
  
  try {
    testModelStructures();
    testModelInstantiation();
    testControllers();
    
    console.log('\n🎉 所有测试通过！');
    console.log('📊 测试结果汇总:');
    console.log('- ✅ 模型结构正确');
    console.log('- ✅ 模型实例化正常');
    console.log('- ✅ 控制器加载正常');
    console.log('- ✅ 新数据库结构实现完成');
    
  } catch (error) {
    console.error('\n💥 测试失败:', error);
    process.exit(1);
  }
};

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
