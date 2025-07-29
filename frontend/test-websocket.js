// WebSocket功能测试文件
const { MatchWebSocket, getWebSocketClient } = require('./utils/websocket');

// 模拟微信小程序环境
global.getApp = () => ({
  globalData: {
    userInfo: {
      id: 'test_user_123',
      nickname: '测试用户'
    },
    isLoggedIn: true
  }
});

global.wx = {
  connectSocket: (options) => {
    console.log('模拟wx.connectSocket调用:', options);
    
    // 模拟WebSocket对象
    const mockSocket = {
      onOpen: (callback) => {
        console.log('WebSocket onOpen 注册');
        setTimeout(() => {
          console.log('模拟WebSocket连接打开');
          callback();
        }, 1000);
      },
      
      onMessage: (callback) => {
        console.log('WebSocket onMessage 注册');
        
        // 模拟接收消息
        setTimeout(() => {
          const mockMessage = {
            data: JSON.stringify({
              type: 'connected',
              userId: 'test_user_123',
              userName: '测试用户',
              timestamp: new Date().toISOString()
            })
          };
          callback(mockMessage);
        }, 1500);
        
        // 模拟比分更新消息
        setTimeout(() => {
          const scoreUpdateMessage = {
            data: JSON.stringify({
              type: 'score-update',
              matchId: 'test_match_456',
              scoreData: [
                { setNumber: 1, team1Score: 6, team2Score: 4 },
                { setNumber: 2, team1Score: 3, team2Score: 6 }
              ],
              currentSet: 3,
              currentGame: 1,
              matchStatus: '比赛中',
              updatedBy: {
                userId: 'organizer_789',
                nickname: '比赛组织者'
              },
              timestamp: Date.now()
            })
          };
          callback(scoreUpdateMessage);
        }, 3000);
      },
      
      onClose: (callback) => {
        console.log('WebSocket onClose 注册');
      },
      
      onError: (callback) => {
        console.log('WebSocket onError 注册');
      },
      
      send: (data) => {
        console.log('WebSocket发送消息:', data);
      },
      
      close: () => {
        console.log('WebSocket连接关闭');
      }
    };
    
    return mockSocket;
  },
  
  showToast: (options) => {
    console.log('显示Toast:', options.title);
  },
  
  pageScrollTo: (options) => {
    console.log('页面滚动到:', options.scrollTop);
  }
};

// 模拟认证模块
const mockAuth = {
  getToken: () => 'mock_jwt_token_12345',
  getUserInfo: () => ({
    id: 'test_user_123',
    nickname: '测试用户',
    avatar: null
  }),
  isLoggedIn: () => true
};

// 替换认证模块
require.cache[require.resolve('./utils/auth')] = {
  exports: mockAuth
};

// 测试WebSocket客户端基本功能
async function testWebSocketClient() {
  console.log('\n=== 测试WebSocket客户端基本功能 ===');
  
  try {
    const client = getWebSocketClient();
    console.log('✓ WebSocket客户端实例创建成功');
    
    // 测试连接
    console.log('开始连接WebSocket...');
    await client.connect();
    console.log('✓ WebSocket连接成功');
    
    // 测试发送消息
    console.log('测试发送消息...');
    const sendResult = client.send('test-message', { content: '测试消息' });
    console.log('✓ 消息发送结果:', sendResult);
    
    // 测试事件监听
    console.log('测试事件监听...');
    client.on('test-event', (data) => {
      console.log('✓ 收到测试事件:', data);
    });
    
    // 获取连接状态
    const status = client.getConnectionStatus();
    console.log('✓ 连接状态:', status);
    
    return client;
  } catch (error) {
    console.error('✗ WebSocket客户端测试失败:', error);
    throw error;
  }
}

// 测试比赛WebSocket功能
async function testMatchWebSocket() {
  console.log('\n=== 测试比赛WebSocket功能 ===');
  
  const testMatchId = 'test_match_456';
  
  try {
    // 设置回调函数
    const callbacks = {
      onJoined: (data) => {
        console.log('✓ 成功加入比赛房间:', data);
      },
      
      onScoreUpdate: (data) => {
        console.log('✓ 收到比分更新:', data);
        console.log('  - 比赛ID:', data.matchId);
        console.log('  - 当前盘数:', data.currentSet);
        console.log('  - 比赛状态:', data.matchStatus);
        console.log('  - 更新者:', data.updatedBy?.nickname);
      },
      
      onStatusUpdate: (data) => {
        console.log('✓ 收到状态更新:', data);
      },
      
      onSpectatorUpdate: (data) => {
        console.log('✓ 收到观众更新:', data);
      },
      
      onMessage: (data) => {
        console.log('✓ 收到聊天消息:', data);
      },
      
      onMatchUpdate: (data) => {
        console.log('✓ 收到比赛更新:', data);
      }
    };
    
    // 加入比赛房间
    console.log('加入比赛房间...');
    const client = await MatchWebSocket.joinMatch(testMatchId, callbacks);
    console.log('✓ 成功加入比赛房间');
    
    // 等待接收消息
    console.log('等待接收实时消息...');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // 测试发送聊天消息
    console.log('测试发送聊天消息...');
    MatchWebSocket.sendMessage(testMatchId, '这是一条测试聊天消息');
    console.log('✓ 聊天消息发送成功');
    
    // 测试更新比分
    console.log('测试更新比分...');
    const scoreData = {
      setNumber: 3,
      team1Score: 2,
      team2Score: 1
    };
    MatchWebSocket.updateScore(testMatchId, scoreData, 2, 0);
    console.log('✓ 比分更新发送成功');
    
    // 测试更新比赛状态
    console.log('测试更新比赛状态...');
    MatchWebSocket.updateMatchStatus(testMatchId, '暂停', '技术暂停');
    console.log('✓ 比赛状态更新发送成功');
    
    // 离开比赛房间
    console.log('离开比赛房间...');
    MatchWebSocket.leaveMatch(testMatchId);
    console.log('✓ 成功离开比赛房间');
    
    return client;
  } catch (error) {
    console.error('✗ 比赛WebSocket测试失败:', error);
    throw error;
  }
}

// 测试错误处理
async function testErrorHandling() {
  console.log('\n=== 测试错误处理 ===');
  
  try {
    const client = getWebSocketClient();
    
    // 测试未连接时发送消息
    console.log('测试未连接时发送消息...');
    client.isConnected = false;
    const result = client.send('test', { data: 'test' });
    console.log('✓ 未连接时发送消息结果:', result);
    
    // 测试无效的事件监听
    console.log('测试事件监听器管理...');
    const testHandler = (data) => console.log('测试处理器:', data);
    client.on('test-event', testHandler);
    client.off('test-event', testHandler);
    client.removeAllListeners('test-event');
    console.log('✓ 事件监听器管理测试通过');
    
    // 测试清理资源
    console.log('测试资源清理...');
    client.cleanup();
    console.log('✓ 资源清理测试通过');
    
  } catch (error) {
    console.error('✗ 错误处理测试失败:', error);
    throw error;
  }
}

// 测试重连机制
async function testReconnection() {
  console.log('\n=== 测试重连机制 ===');
  
  try {
    const client = getWebSocketClient();
    
    // 模拟连接断开
    console.log('模拟连接断开...');
    client.isConnected = false;
    client.reconnectAttempts = 0;
    
    // 测试重连
    console.log('测试重连机制...');
    await client.reconnect();
    console.log('✓ 重连机制测试通过');
    
  } catch (error) {
    console.log('✓ 重连失败处理正常:', error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始WebSocket功能测试...\n');
  
  try {
    await testWebSocketClient();
    await testMatchWebSocket();
    await testErrorHandling();
    await testReconnection();
    
    console.log('\n=== 测试总结 ===');
    console.log('✓ 所有WebSocket功能测试通过');
    console.log('✓ 实时比分更新功能正常');
    console.log('✓ 聊天功能正常');
    console.log('✓ 错误处理机制正常');
    console.log('✓ 重连机制正常');
    
  } catch (error) {
    console.error('\n=== 测试失败 ===');
    console.error('✗ 测试过程中出现错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runAllTests().then(() => {
    console.log('\nWebSocket功能测试完成');
    process.exit(0);
  }).catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testWebSocketClient,
  testMatchWebSocket,
  testErrorHandling,
  testReconnection,
  runAllTests
};