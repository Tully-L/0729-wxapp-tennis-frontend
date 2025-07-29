const { API } = require('./api.js');

// 检查登录状态
const checkLogin = () => {
  const token = wx.getStorageSync('token');
  const refreshToken = wx.getStorageSync('refreshToken');
  return !!(token || refreshToken);
};

// 获取用户信息
const getUserInfo = () => {
  return wx.getStorageSync('userInfo') || null;
};

// 获取token
const getToken = () => {
  return wx.getStorageSync('token') || null;
};

// 获取刷新token
const getRefreshToken = () => {
  return wx.getStorageSync('refreshToken') || null;
};

// 保存登录信息
const saveLoginInfo = (loginData) => {
  const { accessToken, refreshToken, user } = loginData;
  
  if (accessToken) {
    wx.setStorageSync('token', accessToken);
  }
  
  if (refreshToken) {
    wx.setStorageSync('refreshToken', refreshToken);
  }
  
  if (user) {
    wx.setStorageSync('userInfo', user);
  }
  
  // 更新全局数据
  const app = getApp();
  if (app) {
    app.globalData.isLoggedIn = true;
    app.globalData.userInfo = user;
  }
};

// 微信登录
const wechatLogin = () => {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '登录中...',
      mask: true
    });

    // 获取微信登录凭证
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          // 获取用户信息
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (userRes) => {
              // 调用后端登录接口
              API.login({
                code: loginRes.code,
                userInfo: userRes.userInfo
              }).then(res => {
                wx.hideLoading();
                
                if (res.success) {
                  saveLoginInfo(res.data);
                  resolve(res.data);
                } else {
                  reject(new Error(res.message || '登录失败'));
                }
              }).catch(err => {
                wx.hideLoading();
                console.error('微信登录API调用失败:', err);
                
                // 网络失败时使用开发模式登录
                devLogin().then(resolve).catch(reject);
              });
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('获取用户信息失败:', err);
              
              // 用户拒绝授权时使用开发模式登录
              devLogin().then(resolve).catch(reject);
            }
          });
        } else {
          wx.hideLoading();
          reject(new Error('获取微信登录凭证失败'));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('微信登录失败:', err);
        reject(err);
      }
    });
  });
};

// 开发模式登录
const devLogin = (nickname = '网球选手', phone = '13800138000') => {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '登录中...',
      mask: true
    });

    API.devLogin({
      nickname: nickname,
      phone: phone
    }).then(res => {
      wx.hideLoading();
      
      if (res.success) {
        saveLoginInfo(res.data);
        resolve(res.data);
      } else {
        reject(new Error(res.message || '登录失败'));
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('开发模式登录失败:', err);
      
      // 完全离线时的本地模拟登录
      const mockUser = {
        id: 'user_' + Date.now(),
        nickname: nickname,
        phone: phone,
        avatar: null,
        stats: {
          participationCount: 0,
          wins: 0,
          losses: 0,
          etaPoints: 1000
        }
      };
      
      const mockLoginData = {
        accessToken: 'mock_token_' + Date.now(),
        refreshToken: 'mock_refresh_' + Date.now(),
        user: mockUser
      };
      
      saveLoginInfo(mockLoginData);
      resolve(mockLoginData);
    });
  });
};

// 刷新token
const refreshAccessToken = () => {
  return new Promise((resolve, reject) => {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      reject(new Error('没有刷新令牌'));
      return;
    }

    API.refreshToken({
      refreshToken: refreshToken
    }).then(res => {
      if (res.success) {
        const { accessToken, refreshToken: newRefreshToken } = res.data;
        
        wx.setStorageSync('token', accessToken);
        if (newRefreshToken) {
          wx.setStorageSync('refreshToken', newRefreshToken);
        }
        
        resolve(accessToken);
      } else {
        reject(new Error(res.message || '刷新令牌失败'));
      }
    }).catch(err => {
      console.error('刷新令牌失败:', err);
      reject(err);
    });
  });
};

// 检查token是否即将过期并自动刷新
const checkAndRefreshToken = () => {
  return new Promise((resolve, reject) => {
    const token = getToken();
    
    if (!token) {
      reject(new Error('没有访问令牌'));
      return;
    }

    // 简单的token过期检查（实际应用中可以解析JWT）
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // 如果token在30分钟内过期，则刷新
        if (payload.exp && (payload.exp - currentTime) < 1800) {
          refreshAccessToken().then(resolve).catch(reject);
          return;
        }
      }
    } catch (e) {
      console.log('Token解析失败，跳过自动刷新');
    }
    
    resolve(token);
  });
};

// 退出登录
const logout = () => {
  return new Promise((resolve) => {
    // 清除本地存储
    wx.removeStorageSync('token');
    wx.removeStorageSync('refreshToken');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('userProfile');
    wx.removeStorageSync('userStats');
    wx.removeStorageSync('userAchievements');
    wx.removeStorageSync('userClubs');
    
    // 更新全局数据
    const app = getApp();
    if (app) {
      app.globalData.isLoggedIn = false;
      app.globalData.userInfo = null;
    }
    
    resolve();
  });
};

// 跳转到登录页面
const goToLogin = () => {
  wx.navigateTo({
    url: '/pages/user-related/login/login'
  });
};

// 更新用户活跃度
const updateUserActivity = () => {
  if (checkLogin()) {
    API.updateUserActivity().catch(err => {
      console.log('更新用户活跃度失败:', err);
    });
  }
};

// 检查用户权限
const checkUserPermission = (permission) => {
  return new Promise((resolve, reject) => {
    if (!checkLogin()) {
      reject(new Error('用户未登录'));
      return;
    }

    API.checkUserPermission(permission).then(res => {
      if (res.success) {
        resolve(res.data.hasPermission);
      } else {
        reject(new Error(res.message || '权限检查失败'));
      }
    }).catch(reject);
  });
};

// 获取用户详细统计信息
const getUserStats = () => {
  return new Promise((resolve, reject) => {
    if (!checkLogin()) {
      reject(new Error('用户未登录'));
      return;
    }

    // 先从缓存获取
    const cachedStats = wx.getStorageSync('userStats');
    if (cachedStats) {
      resolve(cachedStats);
    }

    // 从服务器获取最新数据
    API.getUserStats().then(res => {
      if (res.success) {
        wx.setStorageSync('userStats', res.data);
        resolve(res.data);
      } else {
        if (!cachedStats) {
          reject(new Error(res.message || '获取用户统计失败'));
        }
      }
    }).catch(err => {
      if (!cachedStats) {
        reject(err);
      }
    });
  });
};

// 获取用户成就
const getUserAchievements = () => {
  return new Promise((resolve, reject) => {
    if (!checkLogin()) {
      reject(new Error('用户未登录'));
      return;
    }

    // 先从缓存获取
    const cachedAchievements = wx.getStorageSync('userAchievements');
    if (cachedAchievements) {
      resolve(cachedAchievements);
    }

    // 从服务器获取最新数据
    API.getUserAchievements().then(res => {
      if (res.success) {
        wx.setStorageSync('userAchievements', res.data);
        resolve(res.data);
      } else {
        if (!cachedAchievements) {
          reject(new Error(res.message || '获取用户成就失败'));
        }
      }
    }).catch(err => {
      if (!cachedAchievements) {
        reject(err);
      }
    });
  });
};

// 搜索用户
const searchUsers = (query, limit = 20) => {
  return new Promise((resolve, reject) => {
    if (!checkLogin()) {
      reject(new Error('用户未登录'));
      return;
    }

    API.searchUsers({ query, limit }).then(res => {
      if (res.success) {
        resolve(res.data);
      } else {
        reject(new Error(res.message || '搜索用户失败'));
      }
    }).catch(reject);
  });
};

// 获取排行榜
const getLeaderboard = (type = 'points', limit = 10) => {
  return new Promise((resolve, reject) => {
    API.getLeaderboard({ type, limit }).then(res => {
      if (res.success) {
        resolve(res.data);
      } else {
        reject(new Error(res.message || '获取排行榜失败'));
      }
    }).catch(reject);
  });
};

module.exports = {
  checkLogin,
  getUserInfo,
  getToken,
  getRefreshToken,
  saveLoginInfo,
  wechatLogin,
  devLogin,
  refreshAccessToken,
  checkAndRefreshToken,
  logout,
  goToLogin,
  updateUserActivity,
  checkUserPermission,
  getUserStats,
  getUserAchievements,
  searchUsers,
  getLeaderboard
}; 