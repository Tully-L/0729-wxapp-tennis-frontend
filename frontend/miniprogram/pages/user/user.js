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
    clubsLoading: false
  },
  
  onLoad: function() {
    // Check login status
    const isLoggedIn = auth.checkLogin();
    const userInfo = auth.getUserInfo();
    
    this.setData({
      isLoggedIn: isLoggedIn,
      userInfo: userInfo
    });
    
    if (isLoggedIn) {
      this.loadUserProfile();
      this.loadUserClubs();
      this.loadUserMatches();
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
    
    return API.getUserProfile(this.data.userInfo.id)
      .then(res => {
        // Process profile data
        const profile = res;
        
        // Calculate win rate
        if (profile.stats) {
          profile.stats.winRate = util.calculateWinRate(
            profile.stats.wins,
            profile.stats.participationCount
          );
        }
        
        this.setData({
          profile: profile,
          loading: false
        });
      })
      .catch(err => {
        console.error('Failed to load user profile:', err);
        this.setData({ loading: false });
        
        wx.showToast({
          title: 'Failed to load profile',
          icon: 'none'
        });
      });
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
    
    const params = {
      page: this.data.matchesPage,
      pageSize: this.data.matchesPageSize,
      ...this.data.matchFilters
    };
    
    return API.getUserMatches(this.data.userInfo.id, params)
      .then(res => {
        const newMatches = res.data || [];
        
        this.setData({
          matches: [...this.data.matches, ...newMatches],
          hasMoreMatches: newMatches.length === this.data.matchesPageSize,
          matchesLoading: false
        });
      })
      .catch(err => {
        console.error('Failed to load user matches:', err);
        this.setData({ matchesLoading: false });
      });
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
  
  // Edit profile
  editProfile: function() {
    wx.navigateTo({
      url: '/pages/profile/edit'
    });
  }
}); 