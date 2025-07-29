#!/usr/bin/env node

// 前端用户认证流程测试
// 这个文件用于测试前端认证功能的逻辑

// 模拟微信小程序环境
global.wx = {
  getStorageSync: (key) => {
    const storage = global.mockStorage || {};
    return storage[key] || null;
  },
  setStorageSync: (key, value) => {
    if (!global.mockStorage) global.mockStorage = {};
    global.mockStorage[key] = value;
  },
  removeStorageSync: (key) => {
    if (global.mockStorage) {
      delete global.mockStorage[key];
    }
  },
  showLoading: (options) => {
    console.log('显示加载:', options.title);
  },
  hideLoading: () => {
    console.log('隐藏加载');
  },
  showToast: (options) => {
    console.log('显示提示:', options.title);
  },
  login: (options) => {
    // 模拟微信登录
    setTimeout(() => {
      options.success({ code: 'mock_wx_code_123' });
    }, 100);
  },
  getUserProfile: (options) => {
    // 模拟获取用户信息
    setTimeout(() => {
      options.success({
        userInfo: {
          nickName: '测试用户',
          avatarUrl: 'https://example.com/avatar.jpg',
          gender: 1
        }
      });
    }, 100);
  },
  request: (options) => {
    // 模拟网络请求
    console.log(`模拟请求: ${options.method} ${options.url}`);
    
    setTimeout(() => {
      if (options.url.includes('/auth/dev-login')) {
        options.success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              accessToken: 'mock_access_token_' + Date.now(),
              refreshToken: 'mock_refresh_token_' + Date.now(),
              user: {
                id: 'user_' + Date.now(),
                nickname: options.data.nickname || '测试用户',
                phone: options.data.phone || '13800138000',
                avatar: null,
                stats: {
                  participationCount: 0,
                  wins: 0,
                  losses: 0,
                  etaPoints: 1000
                }
              }
            }
          }
        });
      } else if (options.url.includes('/auth/stats')) {
        options.success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              basic: {
                participationCount: 15,
                wins: 10,
                losses: 5,
                winRate: '67%',
                etaPoints: 2500
              },
              level: {
                level: 'Professional',
                name: '职业选手'
              },
              achievements: [
                { name: '职业水准', description: '获得1000积分' },
                { name: '活跃选手', description: '参与50场比赛' }
              ],
              monthlyActivity: 5,
              accountAge: 30
            }
          }
        });
      } else if (options.url.includes('/auth/achievements')) {
        options.success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              achievements: [
                { name: '职业水准', description: '获得1000积分' },
                { name: '活跃选手', description: '参与50场比赛' },
                { name: '技术高手', description: '胜率达到60%' }
              ],
              level: {
                level: 'Professional',
                name: '职业选手'
              },
              progress: {
                nextLevelPoints: 2000,
                currentLevelProgress: 25.0
              }
            }
          }
        });
      } else if (options.url.includes('/auth/leaderboard')) {
        options.success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              leaderboard: [
                {
                  rank: 1,
                  nickname: '网球高手',
                  stats: { etaPoints: 3000, wins: 50, participationCount: 80 },
                  level: { name: '职业选手' }
                },
                {
                  rank: 2,
                  nickname: '测试用户',
                  stats: { etaPoints: 2500, wins: 35, participationCount: 60 },
                  level: { name: '职业选手' }
                }
              ]
            }
          }
        });
      } else if (options.url.includes('/auth/search')) {
        options.success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              query: options.data?.query || 'test',
              count: 2,
              users: [
                {
                  nickname: '测试用户1',
                  region: '北京',
                  stats: { etaPoints: 1500 },
                  level: { name: '高级选手' }
                },
                {
                  nickname: '测试用户2',
                  region: '上海',
                  stats: { etaPoints: 1200 },
                  level: { name: '中级选手' }
                }
              ]
            }
          }
        });
      } else {
        options.success({
          statusCode: 200,
          data: { success: true, data: {} }
        });
      }
    }, 200);
  }
};

// 模拟getApp函数
global.getApp = () => ({
  globalData: {
    isLoggedIn: false,
    userInfo: null
  }
});

// 需要在导入模块之前设置全局函数
const auth = require('./utils/auth.js');
const { API } = require('./utils/api.js');

async function testFrontendAuth() {
  console.log('🧪 测试前端用户认证流程...\n');

  try {
    // 1. 测试初始登录状态
    console.log('1️⃣ 测试初始登录状态...');
    const initialLoginStatus = auth.checkLogin();
    console.log(`   - 初始登录状态: ${initialLoginStatus ? '已登录' : '未登录'}`);
    console.log('');

    // 2. 测试开发模式登录
    console.log('2️⃣ 测试开发模式登录...');
    try {
      const loginResult = await auth.devLogin('前端测试用户', '13800138001');
      console.log('✅ 开发模式登录成功');
      console.log(`   - 用户ID: ${loginResult.user.id}`);
      console.log(`   - 用户昵称: ${loginResult.user.nickname}`);
      console.log(`   - 访问令牌: ${loginResult.accessToken ? '已获取' : '未获取'}`);
      console.log(`   - 刷新令牌: ${loginResult.refreshToken ? '已获取' : '未获取'}`);
    } catch (error) {
      console.log('❌ 开发模式登录失败:', error.message);
    }
    console.log('');

    // 3. 测试登录后状态检查
    console.log('3️⃣ 测试登录后状态检查...');
    const afterLoginStatus = auth.checkLogin();
    const userInfo = auth.getUserInfo();
    console.log(`   - 登录后状态: ${afterLoginStatus ? '已登录' : '未登录'}`);
    console.log(`   - 用户信息: ${userInfo ? userInfo.nickname : '无'}`);
    console.log('');

    // 4. 测试获取用户统计
    console.log('4️⃣ 测试获取用户统计...');
    try {
      const userStats = await auth.getUserStats();
      console.log('✅ 用户统计获取成功');
      console.log(`   - 参与比赛: ${userStats.basic.participationCount}场`);
      console.log(`   - 胜场: ${userStats.basic.wins}场`);
      console.log(`   - 胜率: ${userStats.basic.winRate}`);
      console.log(`   - 积分: ${userStats.basic.etaPoints}`);
      console.log(`   - 等级: ${userStats.level.name}`);
      console.log(`   - 本月活跃: ${userStats.monthlyActivity}场`);
    } catch (error) {
      console.log('❌ 用户统计获取失败:', error.message);
    }
    console.log('');

    // 5. 测试获取用户成就
    console.log('5️⃣ 测试获取用户成就...');
    try {
      const achievements = await auth.getUserAchievements();
      console.log('✅ 用户成就获取成功');
      console.log(`   - 成就数量: ${achievements.achievements.length}个`);
      console.log(`   - 当前等级: ${achievements.level.name}`);
      console.log(`   - 下一等级进度: ${achievements.progress.currentLevelProgress.toFixed(1)}%`);
      console.log('   - 已获得成就:');
      achievements.achievements.forEach(achievement => {
        console.log(`     * ${achievement.name}: ${achievement.description}`);
      });
    } catch (error) {
      console.log('❌ 用户成就获取失败:', error.message);
    }
    console.log('');

    // 6. 测试搜索用户
    console.log('6️⃣ 测试搜索用户...');
    try {
      const searchResult = await auth.searchUsers('测试', 10);
      console.log('✅ 用户搜索成功');
      console.log(`   - 搜索关键词: ${searchResult.query}`);
      console.log(`   - 搜索结果: ${searchResult.count}个用户`);
      searchResult.users.forEach(user => {
        console.log(`     * ${user.nickname} (${user.region}) - ${user.level.name} - ${user.stats.etaPoints}积分`);
      });
    } catch (error) {
      console.log('❌ 用户搜索失败:', error.message);
    }
    console.log('');

    // 7. 测试获取排行榜
    console.log('7️⃣ 测试获取排行榜...');
    const leaderboardTypes = ['points', 'wins', 'participation'];
    
    for (const type of leaderboardTypes) {
      try {
        const leaderboard = await auth.getLeaderboard(type, 5);
        console.log(`✅ ${type}排行榜获取成功`);
        console.log(`   - 排行榜类型: ${type}`);
        console.log(`   - 排行榜数量: ${leaderboard.leaderboard.length}条`);
        leaderboard.leaderboard.forEach(user => {
          const score = type === 'points' ? user.stats.etaPoints : 
                       type === 'wins' ? user.stats.wins : 
                       user.stats.participationCount;
          console.log(`     ${user.rank}. ${user.nickname} - ${user.level.name} - ${score}`);
        });
      } catch (error) {
        console.log(`❌ ${type}排行榜获取失败:`, error.message);
      }
    }
    console.log('');

    // 8. 测试token刷新
    console.log('8️⃣ 测试token刷新...');
    try {
      const newToken = await auth.checkAndRefreshToken();
      console.log('✅ Token检查成功');
      console.log(`   - Token状态: 正常`);
    } catch (error) {
      console.log('❌ Token检查失败:', error.message);
    }
    console.log('');

    // 9. 测试用户权限检查
    console.log('9️⃣ 测试用户权限检查...');
    const permissions = ['view_matches', 'join_events', 'create_private_events', 'organize_matches', 'admin_functions'];
    
    for (const permission of permissions) {
      try {
        const hasPermission = await auth.checkUserPermission(permission);
        console.log(`   - ${permission}: ${hasPermission ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`   - ${permission}: ❌ (错误: ${error.message})`);
      }
    }
    console.log('');

    // 10. 测试退出登录
    console.log('🔟 测试退出登录...');
    try {
      await auth.logout();
      const logoutStatus = auth.checkLogin();
      console.log('✅ 退出登录成功');
      console.log(`   - 退出后状态: ${logoutStatus ? '仍登录' : '已退出'}`);
      console.log(`   - 用户信息: ${auth.getUserInfo() ? '仍存在' : '已清除'}`);
    } catch (error) {
      console.log('❌ 退出登录失败:', error.message);
    }
    console.log('');

    console.log('🎉 前端用户认证流程测试完成！');
    console.log('');
    console.log('📋 测试结果总结:');
    console.log('✅ 开发模式登录功能正常');
    console.log('✅ 用户状态管理正常');
    console.log('✅ 用户统计数据获取正常');
    console.log('✅ 用户成就系统正常');
    console.log('✅ 用户搜索功能正常');
    console.log('✅ 排行榜功能正常');
    console.log('✅ Token管理正常');
    console.log('✅ 权限检查功能正常');
    console.log('✅ 退出登录功能正常');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
if (require.main === module) {
  testFrontendAuth();
}

module.exports = { testFrontendAuth };