// app.js
App({
  onLaunch: function () {
    // Check if user is logged in
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
    }
    
    // Get system info
    wx.getWindowInfo({
      success: e => {
        this.globalData.statusBarHeight = e.statusBarHeight;
        this.globalData.windowHeight = e.windowHeight;
        this.globalData.windowWidth = e.windowWidth;
      }
    });
  },
  
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    statusBarHeight: 0,
    windowHeight: 0,
    windowWidth: 0,
    baseUrl: 'https://api.tennisheat.com',
    primaryColor: '#0A4A39'
  }
}) 