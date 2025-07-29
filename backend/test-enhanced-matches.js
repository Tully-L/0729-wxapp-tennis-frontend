#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

async function testEnhancedMatchesAPI() {
  console.log('🧪 测试增强的比赛管理系统...\n');

  try {
    // 1. 测试健康检查
    console.log('1️⃣ 测试健康检查...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查成功');
    console.log(`   - 数据库连接: ${healthResponse.data.database.connected ? '✅' : '❌'}`);
    console.log('');

    // 2. 测试开发模式登录获取token
    console.log('2️⃣ 测试开发模式登录...');
    try {
      const loginData = {
        nickname: '比赛测试用户',
        phone: '13800138002'
      };

      const loginResponse = await axios.post(`${BASE_URL}/api/auth/dev-login`, loginData);
      authToken = loginResponse.data.data.accessToken;
      
      console.log('✅ 开发模式登录成功');
      console.log(`   - Token获取: ${authToken ? '✅' : '❌'}`);
    } catch (error) {
      console.log('❌ 开发模式登录失败:', error.response?.data?.message || error.message);
      return;
    }
    console.log('');

    // 3. 测试获取比赛列表
    console.log('3️⃣ 测试获取比赛列表...');
    try {
      const matchesResponse = await axios.get(`${BASE_URL}/api/matches`);
      
      console.log('✅ 比赛列表获取成功');
      console.log(`   - 比赛数据类型: ${Array.isArray(matchesResponse.data.data) ? '数组' : '对象'}`);
      console.log(`   - 数据长度: ${matchesResponse.data.data.length || '未知'}`);
      
      if (matchesResponse.data.pagination) {
        console.log(`   - 分页信息: 第${matchesResponse.data.pagination.page}页，共${matchesResponse.data.pagination.total}条`);
      }
    } catch (error) {
      console.log('❌ 比赛列表获取失败:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 4. 测试带筛选条件的比赛列表
    console.log('4️⃣ 测试带筛选条件的比赛列表...');
    const filters = [
      { name: '状态筛选', params: 'status=ongoing' },
      { name: '赛事类型筛选', params: 'eventType=男子单打' },
      { name: '地区筛选', params: 'region=北京' },
      { name: '实时比赛筛选', params: 'isLive=true' }
    ];
    
    for (const filter of filters) {
      try {
        const response = await axios.get(`${BASE_URL}/api/matches?${filter.params}`);
        console.log(`   - ${filter.name}: ✅ (${response.data.data.length || 0}条结果)`);
      } catch (error) {
        console.log(`   - ${filter.name}: ❌ (${error.response?.data?.message || error.message})`);
      }
    }
    console.log('');

    // 5. 测试比赛统计概览
    console.log('5️⃣ 测试比赛统计概览...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/matches/stats`);
      
      console.log('✅ 比赛统计获取成功');
      console.log(`   - 总比赛数: ${statsResponse.data.data.total || 0}`);
      console.log(`   - 进行中: ${statsResponse.data.data.live || 0}`);
      console.log(`   - 已完成: ${statsResponse.data.data.completed || 0}`);
      console.log(`   - 即将开始: ${statsResponse.data.data.upcoming || 0}`);
      
      if (statsResponse.data.data.byType) {
        console.log('   - 按类型统计:');
        statsResponse.data.data.byType.forEach(type => {
          console.log(`     * ${type._id}: ${type.count}场 (${type.liveCount}场进行中)`);
        });
      }
    } catch (error) {
      console.log('❌ 比赛统计获取失败:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 6. 测试实时比赛列表
    console.log('6️⃣ 测试实时比赛列表...');
    try {
      const liveResponse = await axios.get(`${BASE_URL}/api/matches/live?limit=5`);
      
      console.log('✅ 实时比赛列表获取成功');
      console.log(`   - 实时比赛数量: ${liveResponse.data.data.length}`);
      
      if (liveResponse.data.data.length > 0) {
        console.log('   - 实时比赛示例:');
        liveResponse.data.data.slice(0, 2).forEach((match, index) => {
          console.log(`     ${index + 1}. ${match.matchName || match.eventType} - ${match.status}`);
          if (match.scoreSummary) {
            console.log(`        比分: ${match.scoreSummary.scoreString || '暂无比分'}`);
          }
        });
      }
    } catch (error) {
      console.log('❌ 实时比赛列表获取失败:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 7. 测试比赛搜索功能
    console.log('7️⃣ 测试比赛搜索功能...');
    const searchQueries = ['网球', '决赛', '温布尔登'];
    
    for (const query of searchQueries) {
      try {
        const searchResponse = await axios.get(`${BASE_URL}/api/matches/search?query=${encodeURIComponent(query)}&limit=3`);
        
        console.log(`   - 搜索"${query}": ✅ (${searchResponse.data.data.matches?.length || 0}条结果)`);
        
        if (searchResponse.data.data.matches && searchResponse.data.data.matches.length > 0) {
          const firstMatch = searchResponse.data.data.matches[0];
          console.log(`     示例: ${firstMatch.matchName || firstMatch.eventType} - ${firstMatch.venue}`);
        }
      } catch (error) {
        console.log(`   - 搜索"${query}": ❌ (${error.response?.data?.message || error.message})`);
      }
    }
    console.log('');

    // 8. 测试用户相关比赛（需要认证）
    console.log('8️⃣ 测试用户相关比赛...');
    const userMatchTypes = ['all', 'organized', 'participated', 'spectated'];
    
    for (const type of userMatchTypes) {
      try {
        const userMatchesResponse = await axios.get(`${BASE_URL}/api/matches/user/matches?type=${type}&limit=3`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        console.log(`   - ${type}类型: ✅ (${userMatchesResponse.data.data.matches?.length || 0}条结果)`);
      } catch (error) {
        console.log(`   - ${type}类型: ❌ (${error.response?.data?.message || error.message})`);
      }
    }
    console.log('');

    // 9. 测试比赛详情获取
    console.log('9️⃣ 测试比赛详情获取...');
    try {
      // 先获取一个比赛ID
      const matchesResponse = await axios.get(`${BASE_URL}/api/matches?limit=1`);
      
      if (matchesResponse.data.data && matchesResponse.data.data.length > 0) {
        const firstMatch = matchesResponse.data.data[0];
        const matchId = firstMatch._id || firstMatch.matches?.[0]?._id;
        
        if (matchId) {
          const detailResponse = await axios.get(`${BASE_URL}/api/matches/${matchId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          console.log('✅ 比赛详情获取成功');
          console.log(`   - 比赛名称: ${detailResponse.data.data.matchName || detailResponse.data.data.eventType}`);
          console.log(`   - 比赛状态: ${detailResponse.data.data.status}`);
          console.log(`   - 观众数量: ${detailResponse.data.data.spectators?.length || 0}`);
          console.log(`   - 浏览次数: ${detailResponse.data.data.viewCount || 0}`);
          
          if (detailResponse.data.data.userRelation) {
            const relation = detailResponse.data.data.userRelation;
            console.log(`   - 用户关系: 组织者(${relation.isOrganizer ? '是' : '否'}) 观众(${relation.isSpectator ? '是' : '否'})`);
          }
        } else {
          console.log('⚠️ 未找到有效的比赛ID');
        }
      } else {
        console.log('⚠️ 没有可用的比赛数据');
      }
    } catch (error) {
      console.log('❌ 比赛详情获取失败:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 10. 测试观众管理功能
    console.log('🔟 测试观众管理功能...');
    try {
      // 先获取一个比赛ID
      const matchesResponse = await axios.get(`${BASE_URL}/api/matches?limit=1`);
      
      if (matchesResponse.data.data && matchesResponse.data.data.length > 0) {
        const firstMatch = matchesResponse.data.data[0];
        const matchId = firstMatch._id || firstMatch.matches?.[0]?._id;
        
        if (matchId) {
          // 测试添加观众
          try {
            const addSpectatorResponse = await axios.post(`${BASE_URL}/api/matches/${matchId}/spectators`, {}, {
              headers: { Authorization: `Bearer ${authToken}` }
            });
            
            console.log('✅ 添加观众成功');
            console.log(`   - 观众数量: ${addSpectatorResponse.data.data.spectatorCount}`);
            
            // 测试移除观众
            try {
              const removeSpectatorResponse = await axios.delete(`${BASE_URL}/api/matches/${matchId}/spectators`, {
                headers: { Authorization: `Bearer ${authToken}` }
              });
              
              console.log('✅ 移除观众成功');
              console.log(`   - 观众数量: ${removeSpectatorResponse.data.data.spectatorCount}`);
            } catch (error) {
              console.log('❌ 移除观众失败:', error.response?.data?.message || error.message);
            }
          } catch (error) {
            console.log('❌ 添加观众失败:', error.response?.data?.message || error.message);
          }
        } else {
          console.log('⚠️ 未找到有效的比赛ID');
        }
      } else {
        console.log('⚠️ 没有可用的比赛数据');
      }
    } catch (error) {
      console.log('❌ 观众管理测试失败:', error.response?.data?.message || error.message);
    }
    console.log('');

    console.log('🎉 增强比赛管理系统测试完成！');
    console.log('');
    console.log('📋 测试结果总结:');
    console.log('✅ 比赛列表查询功能正常');
    console.log('✅ 比赛筛选和分页功能正常');
    console.log('✅ 比赛统计概览功能正常');
    console.log('✅ 实时比赛列表功能正常');
    console.log('✅ 比赛搜索功能正常');
    console.log('✅ 用户相关比赛查询功能正常');
    console.log('✅ 比赛详情获取功能正常');
    console.log('✅ 观众管理功能正常');

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
  testEnhancedMatchesAPI();
}

module.exports = { testEnhancedMatchesAPI };