const fs = require('fs');

// 简单的 .env 文件解析
function loadEnv() {
  try {
    const envContent = fs.readFileSync('./backend/.env', 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    }
  } catch (error) {
    console.error('读取 .env 文件失败:', error.message);
  }
}

// 加载环境变量
loadEnv();

// 模拟推送服务
const PushService = require('./backend/src/services/pushService');

async function testPushService() {
  try {
    console.log('🔔 测试推送服务...\n');
    
    // 创建推送服务实例
    const pushService = new PushService();
    
    // 测试获取 access_token
    console.log('1️⃣ 测试获取 access_token...');
    const token = await pushService.getAccessToken();
    console.log('✅ Access token 获取成功:', token.substring(0, 20) + '...\n');
    
    // 测试推送服务统计
    console.log('2️⃣ 推送服务统计:');
    const stats = pushService.getNotificationStats();
    console.log('📊 统计信息:', stats);
    
    // 模拟测试用户
    const testUser = {
      _id: 'test_user_id',
      openId: 'test_open_id', // 这里需要真实的 openId 才能发送消息
      nickName: '测试用户'
    };
    
    console.log('\n3️⃣ 测试通知功能...');
    console.log('⚠️  注意: 需要真实的用户 openId 才能发送实际的推送消息');
    console.log('当前使用测试 openId:', testUser.openId);
    
    // 测试系统通知（不会真正发送，因为 openId 是测试的）
    const result = await pushService.sendTestNotification(testUser, 'system');
    console.log('📤 测试通知结果:', result ? '成功' : '失败');
    
    console.log('\n✅ 推送服务测试完成!');
    console.log('💡 提示: 要发送真实的推送消息，需要用户在小程序中授权并获取真实的 openId');
    
  } catch (error) {
    console.error('❌ 推送服务测试失败:', error.message);
  }
}

testPushService();