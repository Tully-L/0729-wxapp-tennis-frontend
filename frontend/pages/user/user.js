// user.js
const { API } = require('../../utils/api');
const util = require('../../utils/util');
const auth = require('../../utils/auth.js');

Page({
  data: {
    // User info
    userInfo: null,
    isLoggedIn: false,
    
    // Profile data
    profile: null,
    loading: true,
    
    // Enhanced user stats
    userStats: null,
    statsLoading: false,
    
    // User achievements
    achievements: [],
    achievementsLoading: false,
    
    // Match history
    matches: [],
    matchesLoading: false,
    matchesPage: 1,
    matchesPageSize: 10,
    hasMoreMatches: true,
    
    // Match filters
    matchFilters: {
      type: 'all',      // all, singles, doubles
      status: 'all'     // all, completed, ongoing, upcoming
    },
    
    // Clubs
    clubs: [],
    clubsLoading: false,
    
    // Leaderboard
    leaderboard: [],
    leaderboardType: 'points' // points, wins, participation
  },
  
  onLoad: function() {
    this.checkLoginStatus();
  },

  onShow: function() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const isLoggedIn = auth.checkLogin();
    const userInfo = auth.getUserInfo();
    
    this.setData({
      isLoggedIn: isLoggedIn,
      userInfo: userInfo
    });
    
    if (isLoggedIn) {
      // 更新用户活跃度
      auth.updateUserActivity();
      
      // Load from cache first, then refresh
      const cachedProfile = wx.getStorageSync('userProfile');
      if (cachedProfile) {
        this.setData({ profile: cachedProfile, loading: false });
      }
      this.loadUserProfile();

      // 加载用户统计数据
      this.loadUserStats();
      
      // 加载用户成就
      this.loadUserAchievements();

      const cachedClubs = wx.getStorageSync('userClubs');
      if (cachedClubs) {
        this.setData({ clubs: cachedClubs, clubsLoading: false });
      }
      this.loadUserClubs();

      this.loadUserMatches();
      
      // 加载排行榜
      this.loadLeaderboard();
    }
  },
  
  onPullDownRefresh: function() {
    if (this.data.isLoggedIn) {
      Promise.all([
        this.loadUserProfile(),
        this.loadUserClubs(),
        this.resetAndLoadMatches()
      ]).then(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  },
  
  onReachBottom: function() {
    if (this.data.isLoggedIn && this.data.hasMoreMatches && !this.data.matchesLoading) {
      this.loadMoreMatches();
    }
  },
  
  // Load user profile
  loadUserProfile: function() {
    this.setData({ loading: true });
    
    // 使用模拟数据，因为API返回的是模拟数据
    const mockProfile = {
      id: this.data.userInfo ? (this.data.userInfo.id || 'user123') : 'user123',
      nickname: this.data.userInfo ? (this.data.userInfo.nickName || '网球选手') : '网球选手',
      avatar: this.data.userInfo ? this.data.userInfo.avatarUrl : null,
      stats: {
        participationCount: 15,
        wins: 10,
        losses: 5,
        winRate: '67%',
        etaPoints: 2500
      }
    };
    
    // 计算胜率
    if (mockProfile.stats) {
      mockProfile.stats.winRate = util.calculateWinRate(
        mockProfile.stats.wins,
        mockProfile.stats.participationCount
      );
    }
    
    this.setData({
      profile: mockProfile,
      loading: false
    });
    wx.setStorageSync('userProfile', mockProfile);
  },
  
  // Load user clubs
  loadUserClubs: function() {
    this.setData({ clubsLoading: true });
    
    return API.getClubs()
      .then(res => {
        this.setData({
          clubs: res.data || [],
          clubsLoading: false
        });
        wx.setStorageSync('userClubs', res.data || []);
      })
      .catch(err => {
        console.error('Failed to load clubs:', err);
        this.setData({ clubsLoading: false });
      });
  },
  
  // Load user match history
  loadUserMatches: function() {
    if (this.data.matchesLoading) return Promise.resolve();
    
    this.setData({ matchesLoading: true });
    
    // 使用模拟数据
    const mockMatches = [
      {
        _id: '1',
        eventType: '男子单打',
        stage: '决赛',
        status: 'completed',
        venue: '中央球场',
        duration: '2h15',
        players: [
          { name: '费德勒', ranking: 1 },
          { name: '纳达尔', ranking: 2 }
        ],
        date: '2024-01-15',
        venue: '温布尔登'
      },
      {
        _id: '2',
        eventType: '女子双打',
        stage: '半决赛',
        status: 'ongoing',
        venue: '1号球场',
        duration: '1h45',
        players: [
          { name: '小威廉姆斯', ranking: 1 },
          { name: '大威廉姆斯', ranking: 2 }
        ],
        date: '2024-01-20',
        venue: '美国公开赛'
      }
    ];
    
    // 模拟分页
    setTimeout(() => {
      this.setData({
        matches: this.data.matchesPage === 1 ? mockMatches : [...this.data.matches, ...mockMatches],
        hasMoreMatches: this.data.matchesPage < 3, // 模拟只有3页数据
        matchesLoading: false
      });
    }, 500);
  },
  
  // Reset and reload matches
  resetAndLoadMatches: function() {
    this.setData({
      matches: [],
      matchesPage: 1,
      hasMoreMatches: true
    });
    
    return this.loadUserMatches();
  },
  
  // Load more matches
  loadMoreMatches: function() {
    this.setData({
      matchesPage: this.data.matchesPage + 1
    });
    
    this.loadUserMatches();
  },
  
  // Apply match filter
  applyMatchFilter: function(e) {
    const { field, value } = e.currentTarget.dataset;
    
    this.setData({
      [`matchFilters.${field}`]: value,
      matches: [],
      matchesPage: 1,
      hasMoreMatches: true
    });
    
    this.loadUserMatches();
  },
  
  // Navigate to match detail
  goToMatchDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },
  
  // Navigate to club detail
  goToClubDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/club/club?id=${id}`
    });
  },
  
  // Login
  login: function() {
    auth.goToLogin();
  },

  // Logout
  logout: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          auth.logout();
          this.setData({
            isLoggedIn: false,
            profile: null,
            matches: [],
            clubs: []
          });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },
  
  // Load user stats - Enhanced
  loadUserStats: function() {
    this.setData({ statsLoading: true });
    
    auth.getUserStats().then(stats => {
      this.setData({
        userStats: stats,
        statsLoading: false
      });
    }).catch(err => {
      console.error('加载用户统计失败:', err);
      this.setData({ statsLoading: false });
    });
  },
  
  // Load user achievements
  loadUserAchievements: function() {
    this.setData({ achievementsLoading: true });
    
    auth.getUserAchievements().then(achievementData => {
      this.setData({
        achievements: achievementData.achievements || [],
        achievementsLoading: false
      });
    }).catch(err => {
      console.error('加载用户成就失败:', err);
      this.setData({ achievementsLoading: false });
    });
  },
  
  // Load leaderboard
  loadLeaderboard: function() {
    auth.getLeaderboard(this.data.leaderboardType, 10).then(leaderboardData => {
      this.setData({
        leaderboard: leaderboardData.leaderboard || []
      });
    }).catch(err => {
      console.error('加载排行榜失败:', err);
    });
  },
  
  // Switch leaderboard type
  switchLeaderboardType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      leaderboardType: type
    });
    this.loadLeaderboard();
  },
  
  // View user achievements
  viewAchievements: function() {
    if (this.data.achievements.length === 0) {
      wx.showToast({
        title: '暂无成就',
        icon: 'none'
      });
      return;
    }
    
    const achievementList = this.data.achievements.map(achievement => 
      `🏆 ${achievement.name}\n${achievement.description}`
    ).join('\n\n');
    
    wx.showModal({
      title: '我的成就',
      content: achievementList,
      showCancel: false,
      confirmText: '确定'
    });
  },
  
  // Check user permission
  checkPermission: function(permission) {
    return new Promise((resolve) => {
      auth.checkUserPermission(permission).then(hasPermission => {
        resolve(hasPermission);
      }).catch(err => {
        console.error('权限检查失败:', err);
        resolve(false);
      });
    });
  },
  
  // Search users
  searchUsers: function() {
    wx.showModal({
      title: '搜索用户',
      editable: true,
      placeholderText: '请输入用户昵称或地区',
      success: (res) => {
        if (res.confirm && res.content) {
          auth.searchUsers(res.content, 10).then(searchData => {
            if (searchData.users && searchData.users.length > 0) {
              const userList = searchData.users.map(user => 
                `${user.nickname} (${user.region || '未知地区'})\n等级: ${user.level.name} | 积分: ${user.stats.etaPoints}`
              ).join('\n\n');
              
              wx.showModal({
                title: `搜索结果 (${searchData.count}个)`,
                content: userList,
                showCancel: false,
                confirmText: '确定'
              });
            } else {
              wx.showToast({
                title: '未找到相关用户',
                icon: 'none'
              });
            }
          }).catch(err => {
            console.error('搜索用户失败:', err);
            wx.showToast({
              title: '搜索失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },
  
  // View detailed stats
  viewDetailedStats: function() {
    if (!this.data.userStats) {
      wx.showToast({
        title: '统计数据加载中',
        icon: 'none'
      });
      return;
    }
    
    const stats = this.data.userStats;
    const statsText = `基础统计:
参与比赛: ${stats.basic.participationCount}场
胜场: ${stats.basic.wins}场
败场: ${stats.basic.losses}场
胜率: ${stats.basic.winRate}
积分: ${stats.basic.etaPoints}

等级信息:
当前等级: ${stats.level.name}
账户天数: ${stats.accountAge}天
本月活跃: ${stats.monthlyActivity}场比赛`;
    
    wx.showModal({
      title: '详细统计',
      content: statsText,
      showCancel: false,
      confirmText: '确定'
    });
  },
  
  // Edit profile
  editProfile: function() {
    wx.navigateTo({
      url: '/pages/user-related/profile-edit/profile-edit'
    });
  }
}); 