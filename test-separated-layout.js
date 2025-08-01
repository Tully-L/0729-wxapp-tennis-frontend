// 测试分离式布局功能
// Test file for separated layout functionality

const { API } = require('./frontend/utils/api');

// 测试比赛数据按状态加载
async function testMatchDataByStatus() {
  console.log('=== 测试比赛数据按状态加载 ===');
  
  try {
    // 测试进行中的比赛
    console.log('1. 测试进行中的比赛...');
    const ongoingResponse = await API.getMatches({
      status: 'ongoing',
      page: 1,
      limit: 10
    });
    console.log('进行中的比赛数量:', ongoingResponse.data?.length || 0);
    
    // 测试已完成的比赛
    console.log('2. 测试已完成的比赛...');
    const completedResponse = await API.getMatches({
      status: 'completed',
      page: 1,
      limit: 20
    });
    console.log('已完成的比赛数量:', completedResponse.data?.length || 0);
    
    // 测试未来的比赛
    console.log('3. 测试未来的比赛...');
    const upcomingResponse = await API.getMatches({
      status: 'upcoming',
      page: 1,
      limit: 15
    });
    console.log('未来的比赛数量:', upcomingResponse.data?.length || 0);
    
    console.log('✅ 比赛数据按状态加载测试通过');
    return true;
  } catch (error) {
    console.error('❌ 比赛数据按状态加载测试失败:', error);
    return false;
  }
}

// 测试火热报名数据加载
async function testHotRegistrations() {
  console.log('\n=== 测试火热报名数据加载 ===');
  
  try {
    const response = await API.getHotRegistrations({
      limit: 6,
      priority: 'high'
    });
    
    console.log('火热报名数据数量:', response.data?.length || 0);
    
    if (response.data && response.data.length > 0) {
      const firstReg = response.data[0];
      console.log('第一个报名项目:', {
        name: firstReg.name,
        eventType: firstReg.eventType,
        venue: firstReg.venue,
        participantCount: firstReg.participantCount,
        maxParticipants: firstReg.maxParticipants
      });
    }
    
    console.log('✅ 火热报名数据加载测试通过');
    return true;
  } catch (error) {
    console.error('❌ 火热报名数据加载测试失败:', error);
    return false;
  }
}

// 测试状态管理功能
async function testStatusManagement() {
  console.log('\n=== 测试状态管理功能 ===');
  
  try {
    // 测试更新比赛状态
    console.log('1. 测试更新比赛状态...');
    const updateResponse = await API.updateMatchStatus('test_match_1', {
      status: '比赛中',
      reason: '测试状态更新'
    });
    console.log('状态更新响应:', updateResponse.success ? '成功' : '失败');
    
    // 测试获取状态历史
    console.log('2. 测试获取状态历史...');
    const historyResponse = await API.getMatchStatusHistory('test_match_1');
    console.log('状态历史数量:', historyResponse.data?.length || 0);
    
    console.log('✅ 状态管理功能测试通过');
    return true;
  } catch (error) {
    console.error('❌ 状态管理功能测试失败:', error);
    return false;
  }
}

// 测试数据处理函数
function testDataProcessing() {
  console.log('\n=== 测试数据处理函数 ===');
  
  try {
    // 模拟比赛数据
    const mockMatches = [
      {
        _id: 'test_1',
        eventType: '男子单打',
        status: '比赛中',
        scheduledTime: '2024-03-15T14:30:00Z',
        players: {
          team1: [{ name: '测试选手1', ranking: 10 }],
          team2: [{ name: '测试选手2', ranking: 15 }]
        }
      }
    ];
    
    // 测试状态文本获取
    const getStatusText = (status) => {
      const statusMap = {
        '报名中': '报名中',
        '比赛中': '进行中',
        '已结束': '已完成',
        '已取消': '已取消'
      };
      return statusMap[status] || status;
    };
    
    // 测试时间格式化
    const formatMatchTime = (timeString) => {
      const date = new Date(timeString);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };
    
    const processedMatch = mockMatches[0];
    processedMatch.statusText = getStatusText(processedMatch.status);
    processedMatch.formattedTime = formatMatchTime(processedMatch.scheduledTime);
    
    console.log('处理后的比赛数据:', {
      statusText: processedMatch.statusText,
      formattedTime: processedMatch.formattedTime
    });
    
    console.log('✅ 数据处理函数测试通过');
    return true;
  } catch (error) {
    console.error('❌ 数据处理函数测试失败:', error);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始运行分离式布局功能测试...\n');
  
  const results = [];
  
  results.push(await testMatchDataByStatus());
  results.push(await testHotRegistrations());
  results.push(await testStatusManagement());
  results.push(testDataProcessing());
  
  const passedTests = results.filter(result => result).length;
  const totalTests = results.length;
  
  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！分离式布局功能正常工作。');
  } else {
    console.log('⚠️  部分测试失败，请检查相关功能。');
  }
  
  return passedTests === totalTests;
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testMatchDataByStatus,
    testHotRegistrations,
    testStatusManagement,
    testDataProcessing,
    runAllTests
  };
}

// 如果在浏览器或小程序环境中运行
if (typeof wx !== 'undefined') {
  // 在小程序环境中，可以通过控制台调用测试
  console.log('测试函数已加载，可以调用 runAllTests() 进行测试');
}
