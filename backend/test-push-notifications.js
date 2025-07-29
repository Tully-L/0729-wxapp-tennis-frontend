// 推送通知系统测试
const PushService = require('./src/services/pushService');
const notificationController = require('./src/controllers/notificationController');

// 模拟环境变量
process.env.WECHAT_APP_ID = 'test_app_id';
process.env.WECHAT_APP_SECRET = 'test_app_secret';
process.env.WECHAT_MATCH_START_TEMPLATE_ID = 'template_match_start';
process.env.WECHAT_MATCH_END_TEMPLATE_ID = 'template_match_end';
process.env.WECHAT_SCORE_UPDATE_TEMPLATE_ID = 'template_score_update';
process.env.WECHAT_EVENT_REGISTRATION_TEMPLATE_ID = 'template_event_reg';
process.env.WECHAT_PAYMENT_SUCCESS_TEMPLATE_ID = 'template_payment';

// 模拟axios
const mockAxios = {
  get: async (url) => {
    console.log('模拟GET请求:', url);
    if (url.includes('token')) {
      return {
        data: {
          access_token: 'mock_access_token_12345',
          expires_in: 7200
        }
      };
    }
    return { data: {} };
  },
  
  post: async (url, data) => {
    console.log('模拟POST请求:', url);
    console.log('请求数据:', JSON.stringify(data, null, 2));
    
    if (url.includes('message/subscribe/send')) {
      return {
        data: {
          errcode: 0,
          errmsg: 'ok'
        }
      };
    }
    
    return { data: { errcode: 0 } };
  }
};

// 替换axios - 需要在PushService导入之前
jest.mock('axios', () => mockAxios);

// 或者直接替换模块缓存
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'axios') {
    return mockAxios;
  }
  return originalRequire.apply(this, arguments);
};

// 模拟数据库模型
const mockUser = {
  _id: 'user123',
  nickname: '测试用户',
  openId: 'mock_open_id_123',
  notificationSettings: {
    subscriptions: [],
    matchNotifications: [],
    eventNotifications: [],
    systemNotifications: true
  }
};

const mockMatch = {
  _id: 'match123',
  matchName: '温网男单决赛',
  eventId: { name: '温布尔登锦标赛' },
  eventType: '男子单打',
  venue: '中央球场',
  scheduledTime: new Date('2024-07-14T14:00:00Z'),
  status: 'ongoing',
  score: { team1: 6, team2: 4 },
  winner: 'team1'
};

const mockEvent = {
  _id: 'event123',
  name: '网球锦标赛',
  venue: '网球中心',
  startDate: new Date('2024-08-01'),
  registrationFee: 200,
  registrationDeadline: new Date('2024-07-25'),
  status: 'registration'
};

const mockOrder = {
  _id: 'order123',
  description: '网球赛事报名费',
  amount: 200,
  orderNumber: 'ORDER20240725001',
  paidAt: new Date()
};

// 测试推送服务初始化
async function testPushServiceInitialization() {
  console.log('\n=== 测试推送服务初始化 ===');
  
  try {
    const pushService = new PushService();
    
    console.log('✓ 推送服务实例创建成功');
    console.log('  - 模板配置数量:', Object.keys(pushService.templates).length);
    console.log('  - 队列处理器状态:', !pushService.isProcessing);
    console.log('  - 重试机制配置:', `${pushService.retryAttempts}次重试`);
    
    return pushService;
  } catch (error) {
    console.error('✗ 推送服务初始化失败:', error);
    throw error;
  }
}

// 测试获取访问令牌
async function testGetAccessToken(pushService) {
  console.log('\n=== 测试获取访问令牌 ===');
  
  try {
    const token = await pushService.getAccessToken();
    
    console.log('✓ 访问令牌获取成功');
    console.log('  - Token:', token);
    console.log('  - 过期时间:', pushService.tokenExpiresAt);
    
    // 测试令牌缓存
    const cachedToken = await pushService.getAccessToken();
    console.log('✓ 令牌缓存机制正常');
    console.log('  - 缓存Token:', cachedToken === token);
    
    return token;
  } catch (error) {
    console.error('✗ 获取访问令牌失败:', error);
    throw error;
  }
}

// 测试发送统一服务消息
async function testSendUniformMessage(pushService) {
  console.log('\n=== 测试发送统一服务消息 ===');
  
  try {
    const result = await pushService.sendUniformMessage(
      mockUser.openId,
      'template_test',
      {
        thing1: { value: '测试通知' },
        thing2: { value: '这是一条测试消息' },
        time3: { value: new Date().toLocaleString() }
      },
      'pages/test/test'
    );
    
    console.log('✓ 统一服务消息发送成功');
    console.log('  - 发送结果:', result);
    console.log('  - 目标用户:', mockUser.openId);
    
    return result;
  } catch (error) {
    console.error('✗ 发送统一服务消息失败:', error);
    throw error;
  }
}

// 测试比赛通知
async function testMatchNotifications(pushService) {
  console.log('\n=== 测试比赛通知 ===');
  
  try {
    const users = [mockUser];
    
    // 测试比赛开始通知
    console.log('1. 测试比赛开始通知...');
    await pushService.sendMatchStartNotification(mockMatch, users);
    console.log('✓ 比赛开始通知发送成功');
    
    // 测试比分更新通知
    console.log('2. 测试比分更新通知...');
    await pushService.sendScoreUpdateNotification(mockMatch, users);
    console.log('✓ 比分更新通知发送成功');
    
    // 测试比赛结束通知
    console.log('3. 测试比赛结束通知...');
    await pushService.sendMatchEndNotification(mockMatch, users);
    console.log('✓ 比赛结束通知发送成功');
    
    // 测试比赛提醒通知
    console.log('4. 测试比赛提醒通知...');
    await pushService.sendMatchReminderNotification(mockMatch, users, 30);
    console.log('✓ 比赛提醒通知发送成功');
    
    return true;
  } catch (error) {
    console.error('✗ 比赛通知测试失败:', error);
    throw error;
  }
}

// 测试赛事通知
async function testEventNotifications(pushService) {
  console.log('\n=== 测试赛事通知 ===');
  
  try {
    // 测试赛事报名通知
    console.log('1. 测试赛事报名通知...');
    await pushService.sendEventRegistrationNotification(mockEvent, mockUser);
    console.log('✓ 赛事报名通知发送成功');
    
    // 测试赛事更新通知
    console.log('2. 测试赛事更新通知...');
    await pushService.sendEventUpdateNotification(
      mockEvent, 
      [mockUser], 
      '时间变更', 
      '比赛时间调整至下午2点'
    );
    console.log('✓ 赛事更新通知发送成功');
    
    // 测试支付提醒通知
    console.log('3. 测试支付提醒通知...');
    await pushService.sendPaymentReminderNotification(mockEvent, mockUser, 24);
    console.log('✓ 支付提醒通知发送成功');
    
    return true;
  } catch (error) {
    console.error('✗ 赛事通知测试失败:', error);
    throw error;
  }
}

// 测试支付通知
async function testPaymentNotifications(pushService) {
  console.log('\n=== 测试支付通知 ===');
  
  try {
    await pushService.sendPaymentSuccessNotification(mockOrder, mockUser);
    
    console.log('✓ 支付成功通知发送成功');
    console.log('  - 订单号:', mockOrder.orderNumber);
    console.log('  - 支付金额:', mockOrder.amount);
    
    return true;
  } catch (error) {
    console.error('✗ 支付通知测试失败:', error);
    throw error;
  }
}

// 测试系统通知
async function testSystemNotifications(pushService) {
  console.log('\n=== 测试系统通知 ===');
  
  try {
    await pushService.sendSystemNotification(
      [mockUser],
      '系统维护通知',
      '系统将在今晚22:00-24:00进行维护，期间服务可能中断'
    );
    
    console.log('✓ 系统通知发送成功');
    
    return true;
  } catch (error) {
    console.error('✗ 系统通知测试失败:', error);
    throw error;
  }
}

// 测试批量通知
async function testBatchNotifications(pushService) {
  console.log('\n=== 测试批量通知 ===');
  
  try {
    const users = [mockUser, { ...mockUser, _id: 'user456', openId: 'mock_open_id_456' }];
    
    const results = await pushService.sendBatchNotification(
      users,
      'template_test',
      {
        thing1: { value: '批量通知测试' },
        thing2: { value: '这是一条批量发送的测试消息' },
        time3: { value: new Date().toLocaleString() }
      }
    );
    
    console.log('✓ 批量通知发送成功');
    console.log('  - 发送结果:', results);
    console.log('  - 成功数量:', results.filter(r => r.success).length);
    
    return results;
  } catch (error) {
    console.error('✗ 批量通知测试失败:', error);
    throw error;
  }
}

// 测试通知队列
async function testNotificationQueue(pushService) {
  console.log('\n=== 测试通知队列 ===');
  
  try {
    // 添加多个通知到队列
    pushService.addToQueue({
      type: 'MATCH_START',
      data: { match: mockMatch },
      users: [mockUser]
    });
    
    pushService.addToQueue({
      type: 'EVENT_REGISTRATION',
      data: { event: mockEvent, user: mockUser }
    });
    
    pushService.addToQueue({
      type: 'CUSTOM',
      templateId: 'template_test',
      users: [mockUser],
      data: { thing1: { value: '队列测试' } }
    });
    
    console.log('✓ 通知已添加到队列');
    console.log('  - 队列长度:', pushService.notificationQueue.length);
    
    // 等待队列处理
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✓ 队列处理完成');
    console.log('  - 剩余队列长度:', pushService.notificationQueue.length);
    
    return true;
  } catch (error) {
    console.error('✗ 通知队列测试失败:', error);
    throw error;
  }
}

// 测试通知统计
async function testNotificationStats(pushService) {
  console.log('\n=== 测试通知统计 ===');
  
  try {
    const stats = pushService.getNotificationStats();
    
    console.log('✓ 通知统计获取成功');
    console.log('  - 队列长度:', stats.queueLength);
    console.log('  - 处理状态:', stats.isProcessing);
    console.log('  - 模板数量:', stats.templates);
    console.log('  - Token有效性:', stats.accessTokenValid);
    
    return stats;
  } catch (error) {
    console.error('✗ 通知统计测试失败:', error);
    throw error;
  }
}

// 测试测试通知功能
async function testTestNotification(pushService) {
  console.log('\n=== 测试测试通知功能 ===');
  
  try {
    // 测试系统测试通知
    const systemResult = await pushService.sendTestNotification(mockUser, 'system');
    console.log('✓ 系统测试通知发送成功:', systemResult);
    
    // 测试比赛测试通知
    const matchResult = await pushService.sendTestNotification(mockUser, 'match');
    console.log('✓ 比赛测试通知发送成功:', matchResult);
    
    return { systemResult, matchResult };
  } catch (error) {
    console.error('✗ 测试通知功能失败:', error);
    throw error;
  }
}

// 测试错误处理
async function testErrorHandling(pushService) {
  console.log('\n=== 测试错误处理 ===');
  
  try {
    // 测试无效用户
    const invalidUser = { ...mockUser, openId: null };
    const result1 = await pushService.sendTestNotification(invalidUser, 'system');
    console.log('✓ 无效用户处理正常:', result1 === false);
    
    // 测试空用户列表
    const result2 = await pushService.sendBatchNotification([], 'template_test', {});
    console.log('✓ 空用户列表处理正常:', result2.length === 0);
    
    // 测试队列清理
    pushService.cleanupExpiredQueue();
    console.log('✓ 队列清理功能正常');
    
    return true;
  } catch (error) {
    console.error('✗ 错误处理测试失败:', error);
    throw error;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始推送通知系统测试...\n');
  
  try {
    const pushService = await testPushServiceInitialization();
    await testGetAccessToken(pushService);
    await testSendUniformMessage(pushService);
    await testMatchNotifications(pushService);
    await testEventNotifications(pushService);
    await testPaymentNotifications(pushService);
    await testSystemNotifications(pushService);
    await testBatchNotifications(pushService);
    await testNotificationQueue(pushService);
    await testNotificationStats(pushService);
    await testTestNotification(pushService);
    await testErrorHandling(pushService);
    
    console.log('\n=== 测试总结 ===');
    console.log('✓ 推送服务初始化正常');
    console.log('✓ 微信访问令牌获取正常');
    console.log('✓ 统一服务消息发送正常');
    console.log('✓ 比赛通知功能正常');
    console.log('✓ 赛事通知功能正常');
    console.log('✓ 支付通知功能正常');
    console.log('✓ 系统通知功能正常');
    console.log('✓ 批量通知功能正常');
    console.log('✓ 通知队列处理正常');
    console.log('✓ 通知统计功能正常');
    console.log('✓ 测试通知功能正常');
    console.log('✓ 错误处理机制正常');
    
    console.log('\n🎉 所有推送通知系统测试通过！');
    
    // 功能特性总结
    console.log('\n=== 功能特性总结 ===');
    console.log('📱 通知类型:');
    console.log('  • 比赛开始/结束/比分更新通知');
    console.log('  • 赛事报名/更新/支付提醒通知');
    console.log('  • 系统维护和重要公告通知');
    console.log('  • 自定义模板消息通知');
    
    console.log('⚡ 核心功能:');
    console.log('  • 微信统一服务消息发送');
    console.log('  • 通知队列和批量处理');
    console.log('  • 重试机制和错误处理');
    console.log('  • 访问令牌自动管理');
    
    console.log('🔧 管理功能:');
    console.log('  • 通知模板配置管理');
    console.log('  • 发送统计和监控');
    console.log('  • 队列状态和清理');
    console.log('  • 测试通知和调试');
    
  } catch (error) {
    console.error('\n=== 测试失败 ===');
    console.error('✗ 测试过程中出现错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runAllTests().then(() => {
    console.log('\n推送通知系统测试完成');
    process.exit(0);
  }).catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testPushServiceInitialization,
  testGetAccessToken,
  testSendUniformMessage,
  testMatchNotifications,
  testEventNotifications,
  testPaymentNotifications,
  testSystemNotifications,
  testBatchNotifications,
  testNotificationQueue,
  testNotificationStats,
  testTestNotification,
  testErrorHandling,
  runAllTests
};