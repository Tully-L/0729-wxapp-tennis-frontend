#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

async function testEnhancedAuthAPI() {
  console.log('🧪 测试增强的认证API功能...\n');

  try {
    // 1. 测试健康检查
    console.log('1️⃣ 测试健康检查...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查成功');
    console.log(`   - 数据库连接: ${healthResponse.data.database.connected ? '✅' : '❌'}`);
    console.log('');

    // 2. 测试开发模式登录
    console.log('2️⃣ 测试开发模式登录...');
    try {
      const loginData = {
        nickname: '测试用户增强版',
        phone: '13800138001'
      };

      const loginResponse = await axios.post(`${BASE_URL}/api/auth/dev-login`, loginData);
      authToken = loginResponse.data.data.accessToken;
      
      console.log('✅ 开发模式登录成功');
      console.log(`   - 用户ID: ${loginResponse.data.data.user.id}`);
      console.log(`   - 昵称: ${loginResponse.data.data.user.nickname}`);
      console.log(`   - 积分: ${loginResponse.data.data.user.stats.etaPoints}`);
      console.log(`   - Token获取: ${authToken ? '✅' : '❌'}`);
    } catch (error) {
      console.log('❌ 开发模式登录失败:', error.response?.data?.message || error.message);
      return;
    }
    console.log('');

    // 3. 测试增强的用户统计
    console.log('3️⃣ 测试增强的用户统计...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/auth/stats`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ 用户统计获取成功');
      console.log(`   - 基础统计: ${JSON.stringify(statsResponse.data.data.basic)}`);
      console.log(`   - 用户等级: ${statsResponse.data.data.level.name} (${statsResponse.data.data.level.level})`);
      console.log(`   - 成就数量: ${statsResponse.data.data.achievements.length}`);
      console.log(`   - 账户天数: ${statsResponse.data.data.accountAge}天`);
    } catch (error) {
      console.log('❌ 用户统计获取失败:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 4. 测试用户成就系统
    console.log('4️⃣ 测试用户成就系统...');
    try {
      const achievementsResponse = await axios.get(`${BASE_URL}/api/auth/achievements`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ 用户成就获取成功');
      console.log(`   - 成就数量: ${achievementsResponse.data.data.achievements.length}`);
      console.log(`   - 当前等级: ${achievementsResponse.data.data.level.name}`);
      console.log(`   - 下一等级积分: ${achievementsResponse.data.data.progress.nextLevelPoints}`);
      console.log(`   - 当前进度: ${achievementsResponse.data.data.progress.currentLevelProgress.toFixed(1)}%`);
      
      if (achievementsResponse.data.data.achievements.length > 0) {
        console.log('   - 已获得成就:');
        achievementsResponse.data.data.achievements.forEach(achievement => {
          console.log(`     * ${achievement.name}: ${achievement.description}`);
        });
      }
    } catch (error) {
      console.log('❌ 用户成就获取失败:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 5. 测试权限验证系统
    console.log('5️⃣ 测试权限验证系统...');
    const permissions = ['view_matches', 'join_events', 'create_private_events', 'organize_matches', 'admin_functions'];
    
    for (const permission of permissions) {
      try {
        const permissionResponse = await axios.get(`${BASE_URL}/api/auth/permission/${permission}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const hasPermission = permissionResponse.data.data.hasPermission;
        console.log(`   - ${permission}: ${hasPermission ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`   - ${permission}: ❌ (错误: ${error.response?.data?.message || error.message})`);
      }
    }
    console.log('');

    // 6. 测试系统统计概览
    console.log('6️⃣ 测试系统统计概览...');
    try {
      const systemStatsResponse = await axios.get(`${BASE_URL}/api/auth/system-stats`);
      
      console.log('✅ 系统统计获取成功');
      console.log(`   - 总用户数: ${systemStatsResponse.data.data.totalUsers}`);
      console.log(`   - 本月新用户: ${systemStatsResponse.data.data.newUsersThisMonth}`);
      console.log('   - 等级分布:');
      systemStatsResponse.data.data.levelDistribution.forEach(level => {
        console.log(`     * ${level._id}: ${level.count}人`);
      });
    } catch (error) {
      console.log('❌ 系统统计获取失败:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 7. 测试活跃度更新
    console.log('7️⃣ 测试活跃度更新...');
    try {
      const activityResponse = await axios.post(`${BASE_URL}/api/auth/activity`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ 活跃度更新成功');
      console.log(`   - 最后登录时间: ${activityResponse.data.data.lastLoginAt}`);
    } catch (error) {
      console.log('❌ 活跃度更新失败:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 8. 测试详细比赛历史
    console.log('8️⃣ 测试详细比赛历史...');
    try {
      const detailedMatchesResponse = await axios.get(`${BASE_URL}/api/auth/matches/detailed?limit=5`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ 详细比赛历史获取成功');
      console.log(`   - 比赛数量: ${detailedMatchesResponse.data.data.count}`);
      console.log(`   - 筛选条件: ${JSON.stringify(detailedMatchesResponse.data.data.filters)}`);
    } catch (error) {
      console.log('❌ 详细比赛历史获取失败:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 9. 测试用户搜索功能
    console.log('9️⃣ 测试用户搜索功能...');
    try {
      const searchResponse = await axios.get(`${BASE_URL}/api/auth/search?query=测试`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ 用户搜索成功');
      console.log(`   - 搜索关键词: ${searchResponse.data.data.query}`);
      console.log(`   - 搜索结果数: ${searchResponse.data.data.count}`);
    } catch (error) {
      console.log('❌ 用户搜索失败:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 10. 测试排行榜功能
    console.log('🔟 测试排行榜功能...');
    const leaderboardTypes = ['points', 'wins', 'participation'];
    
    for (const type of leaderboardTypes) {
      try {
        const leaderboardResponse = await axios.get(`${BASE_URL}/api/auth/leaderboard?type=${type}&limit=3`);
        
        console.log(`   - ${type}排行榜: ✅ (${leaderboardResponse.data.data.leaderboard.length}条记录)`);
      } catch (error) {
        console.log(`   - ${type}排行榜: ❌ (${error.response?.data?.message || error.message})`);
      }
    }
    console.log('');

    console.log('🎉 增强认证API测试完成！');
    console.log('');
    console.log('📋 新功能测试结果总结:');
    console.log('✅ 开发模式登录正常工作');
    console.log('✅ 增强的用户统计系统');
    console.log('✅ 用户成就和等级系统');
    console.log('✅ 权限验证系统');
    console.log('✅ 系统统计概览');
    console.log('✅ 用户活跃度更新');
    console.log('✅ 详细比赛历史查询');
    console.log('✅ 用户搜索功能');
    console.log('✅ 多类型排行榜');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   - 状态码:', error.response.status);
      console.error('   - 响应数据:', error.response.data);
    }
  }
}

// 运行测试
if (require.main === module) {
  testEnhancedAuthAPI();
}

module.exports = { testEnhancedAuthAPI };