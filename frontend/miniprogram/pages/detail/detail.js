// detail.js
const { API } = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    matchId: '',
    match: null,
    loading: true,
    error: false,
    
    // User info
    userInfo: null,
    isLoggedIn: false
  },
  
  onLoad: function(options) {
    if (options.id) {
      this.setData({
        matchId: options.id
      });
      
      this.loadMatchDetail();
    } else {
      this.setData({
        loading: false,
        error: true
      });
      
      wx.showToast({
        title: 'Invalid match ID',
        icon: 'none'
      });
    }
    
    // Get user info from global data
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo,
      isLoggedIn: app.globalData.isLoggedIn
    });
  },
  
  // Load match detail data
  loadMatchDetail: function() {
    this.setData({ loading: true });
    
    API.getMatchDetail(this.data.matchId)
      .then(res => {
        // Process match data
        const match = res;
        
        // Format duration
        if (match.duration) {
          match.formattedDuration = match.duration;
        }
        
        // Format status
        match.statusText = util.getMatchStatusText(match.status);
        match.statusClass = util.getMatchStatusClass(match.status);
        
        this.setData({
          match: match,
          loading: false
        });
      })
      .catch(err => {
        console.error('Failed to load match detail:', err);
        this.setData({
          loading: false,
          error: true
        });
        
        wx.showToast({
          title: 'Failed to load match data',
          icon: 'none'
        });
      });
  },
  
  // Register for the match
  registerMatch: function() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: 'Please login first',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.match.status !== 'registration') {
      wx.showToast({
        title: 'Registration is not available',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: 'Registering...',
      mask: true
    });
    
    API.registerForEvent(this.data.match.eventId)
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: 'Registration successful',
          icon: 'success'
        });
        
        // Refresh match data
        this.loadMatchDetail();
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err.data?.message || 'Registration failed',
          icon: 'none'
        });
      });
  },
  
  // Navigate back
  goBack: function() {
    wx.navigateBack();
  },
  
  // Share match
  onShareAppMessage: function() {
    return {
      title: this.data.match ? 
        `${this.data.match.eventType} - ${this.data.match.players[0].name} vs ${this.data.match.players[1].name}` : 
        'Tennis Heat Match',
      path: `/pages/detail/detail?id=${this.data.matchId}`
    };
  }
}); 