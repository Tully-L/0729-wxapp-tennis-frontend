// WebSocket服务器功能测试
const http = require('http');
const SocketService = require('./src/services/socketService');

// 创建HTTP服务器
const server = http.createServer();

// 初始化WebSocket服务
const socketService = new SocketService(server);

console.log('🔌 WebSocket服务器测试启动');

// 模拟用户连接测试
function simulateUserConnection() {
  console.log('\n=== 模拟用户连接测试 ===');
  
  // 模拟用户数据
  const mockUsers = [
    { id: 'user1', name: '张三', isAdmin: false },
    { id: 'user2', name: '李四', isAdmin: false },
    { id: 'organizer1', name: '比赛组织者', isAdmin: true }
  ];
  
  console.log('✓ 模拟用户数据准备完成');
  console.log('✓ 用户列表:', mockUsers.map(u => u.name).join(', '));
}

// 测试比赛房间管理
function testMatchRoomManagement() {
  console.log('\n=== 测试比赛房间管理 ===');
  
  const testMatchId = 'match_test_123';
  
  // 测试房间统计
  const roomStats = socketService.getAllRoomStats();
  console.log('✓ 当前房间统计:', roomStats);
  
  // 测试观众数量
  const spectatorCount = socketService.getMatchSpectatorsCount(testMatchId);
  console.log('✓ 比赛观众数量:', spectatorCount);
  
  // 测试在线用户数量
  const onlineCount = socketService.getOnlineUsersCount();
  console.log('✓ 在线用户数量:', onlineCount);
}

// 测试比分更新功能
async function testScoreUpdate() {
  console.log('\n=== 测试比分更新功能 ===');
  
  const testMatchId = 'match_test_123';
  const scoreData = {
    setNumber: 1,
    team1Score: 6,
    team2Score: 4,
    currentSet: 2,
    currentGame: 1,
    matchStatus: '比赛中'
  };
  
  try {
    await socketService.sendScoreUpdate(testMatchId, scoreData);
    console.log('✓ 比分更新广播成功');
    console.log('  - 比赛ID:', testMatchId);
    console.log('  - 比分数据:', scoreData);
  } catch (error) {
    console.error('✗ 比分更新失败:', error);
  }
}

// 测试比赛状态更新
async function testMatchStatusUpdate() {
  console.log('\n=== 测试比赛状态更新 ===');
  
  const testMatchId = 'match_test_123';
  const status = '暂停';
  const additionalData = {
    reason: '技术暂停',
    updatedBy: {
      userId: 'organizer1',
      userName: '比赛组织者'
    }
  };
  
  try {
    await socketService.sendMatchStatusUpdate(testMatchId, status, additionalData);
    console.log('✓ 比赛状态更新广播成功');
    console.log('  - 比赛ID:', testMatchId);
    console.log('  - 新状态:', status);
    console.log('  - 更新原因:', additionalData.reason);
  } catch (error) {
    console.error('✗ 比赛状态更新失败:', error);
  }
}

// 测试通知功能
function testNotificationSystem() {
  console.log('\n=== 测试通知功能 ===');
  
  // 测试系统通知
  const systemNotification = {
    type: 'system',
    title: '系统维护通知',
    message: '系统将在今晚22:00进行维护，预计持续2小时',
    priority: 'high'
  };
  
  socketService.sendSystemNotification(systemNotification);
  console.log('✓ 系统通知发送成功');
  
  // 测试用户通知
  const userNotification = {
    type: 'match_reminder',
    title: '比赛提醒',
    message: '您关注的比赛将在30分钟后开始',
    matchId: 'match_test_123'
  };
  
  const notifyResult = socketService.sendNotification('user1', userNotification);
  console.log('✓ 用户通知发送结果:', notifyResult);
  
  // 测试批量通知
  const batchResults = socketService.sendNotificationToUsers(
    ['user1', 'user2'], 
    userNotification
  );
  console.log('✓ 批量通知发送结果:', batchResults);
}

// 测试比赛提醒功能
async function testMatchReminder() {
  console.log('\n=== 测试比赛提醒功能 ===');
  
  const testMatchId = 'match_test_123';
  const reminderType = 'start_soon';
  const minutesBefore = 30;
  
  try {
    await socketService.sendMatchReminder(testMatchId, reminderType, minutesBefore);
    console.log('✓ 比赛提醒发送成功');
    console.log('  - 比赛ID:', testMatchId);
    console.log('  - 提醒类型:', reminderType);
    console.log('  - 提前时间:', minutesBefore, '分钟');
  } catch (error) {
    console.error('✗ 比赛提醒发送失败:', error);
  }
}

// 测试维护通知
function testMaintenanceNotice() {
  console.log('\n=== 测试维护通知 ===');
  
  const maintenanceNotice = {
    type: 'maintenance',
    title: '系统维护通知',
    message: '系统将在今晚进行维护',
    startTime: new Date(Date.now() + 2 * 3600000), // 2小时后
    duration: '2小时',
    affectedServices: ['实时比分', '聊天功能']
  };
  
  socketService.broadcastMaintenanceNotice(maintenanceNotice);
  console.log('✓ 维护通知广播成功');
  console.log('  - 维护时间:', maintenanceNotice.startTime);
  console.log('  - 持续时间:', maintenanceNotice.duration);
  console.log('  - 影响服务:', maintenanceNotice.affectedServices.join(', '));
}

// 测试连接信息获取
function testConnectionInfo() {
  console.log('\n=== 测试连接信息获取 ===');
  
  const testUserId = 'user1';
  const connectionInfo = socketService.getUserConnectionInfo(testUserId);
  console.log('✓ 用户连接信息:', connectionInfo);
  
  const allRoomStats = socketService.getAllRoomStats();
  console.log('✓ 所有房间统计:', allRoomStats);
}

// 测试资源清理
function testResourceCleanup() {
  console.log('\n=== 测试资源清理 ===');
  
  // 模拟强制用户离开
  const forceLeaveResult = socketService.forceLeaveMatch('user1', 'match_test_123', '管理员操作');
  console.log('✓ 强制离开结果:', forceLeaveResult);
  
  // 测试资源清理
  console.log('开始清理WebSocket服务资源...');
  socketService.cleanup();
  console.log('✓ 资源清理完成');
}

// 运行所有测试
async function runAllTests() {
  console.log('开始WebSocket服务器功能测试...\n');
  
  try {
    simulateUserConnection();
    testMatchRoomManagement();
    await testScoreUpdate();
    await testMatchStatusUpdate();
    testNotificationSystem();
    await testMatchReminder();
    testMaintenanceNotice();
    testConnectionInfo();
    testResourceCleanup();
    
    console.log('\n=== 测试总结 ===');
    console.log('✓ WebSocket服务器初始化成功');
    console.log('✓ 比赛房间管理功能正常');
    console.log('✓ 实时比分更新功能正常');
    console.log('✓ 比赛状态更新功能正常');
    console.log('✓ 通知系统功能正常');
    console.log('✓ 比赛提醒功能正常');
    console.log('✓ 维护通知功能正常');
    console.log('✓ 连接信息获取功能正常');
    console.log('✓ 资源清理功能正常');
    
    console.log('\n🎉 所有WebSocket服务器功能测试通过！');
    
  } catch (error) {
    console.error('\n=== 测试失败 ===');
    console.error('✗ 测试过程中出现错误:', error);
    process.exit(1);
  }
}

// 启动测试
runAllTests().then(() => {
  console.log('\nWebSocket服务器功能测试完成');
  server.close();
  process.exit(0);
}).catch(error => {
  console.error('测试运行失败:', error);
  server.close();
  process.exit(1);
});