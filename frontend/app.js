// app.js
const auth = require('./utils/auth.js');
const { initWebSocket } = require('./utils/websocket.js');
const { initNotificationSystem } = require('./utils/notification.js');

App({
  onLaunch: function () {
    console.log('🎾 网球热小程序启动');
    
    // 初始化用户登录状态
    this.initUserStatus();
    
    // Get system info
    wx.getWindowInfo({
      success: e => {
        this.globalData.statusBarHeight = e.statusBarHeight;
        this.globalData.windowHeight = e.windowHeight;
        this.globalData.windowWidth = e.windowWidth;
      }
    });
    
    // 检查并刷新token
    this.checkTokenStatus();
    
    // 初始化实时通信和通知系统（暂时禁用以避免连接错误）
    // this.initRealTimeServices();
  },
  
  onShow: function() {
    // 每次显示时更新用户活跃度
    if (this.globalData.isLoggedIn) {
      auth.updateUserActivity();
    }
  },
  
  // 初始化用户状态
  initUserStatus: function() {
    const isLoggedIn = auth.checkLogin();
    const userInfo = auth.getUserInfo();
    
    this.globalData.isLoggedIn = isLoggedIn;
    this.globalData.userInfo = userInfo;
    
    console.log('用户登录状态:', isLoggedIn);
    if (userInfo) {
      console.log('用户信息:', userInfo.nickName || userInfo.nickname);
    }
  },
  
  // 检查token状态
  checkTokenStatus: function() {
    if (this.globalData.isLoggedIn) {
      auth.checkAndRefreshToken().then(token => {
        console.log('Token状态正常');
      }).catch(err => {
        console.log('Token检查失败:', err.message);
        // Token失效，清除登录状态
        this.clearUserStatus();
      });
    }
  },
  
  // 更新用户状态
  updateUserStatus: function(userInfo) {
    this.globalData.isLoggedIn = true;
    this.globalData.userInfo = userInfo;
  },
  
  // 清除用户状态
  clearUserStatus: function() {
    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
    
    // 断开WebSocket连接
    if (this.globalData.wsService) {
      this.globalData.wsService.disconnect();
    }
  },

  // 初始化实时服务
  initRealTimeServices: function() {
    try {
      // 初始化通知系统
      if (typeof initNotificationSystem === 'function') {
        initNotificationSystem().then(() => {
          console.log('📱 通知系统初始化成功');
        }).catch(err => {
          console.error('📱 通知系统初始化失败:', err);
        });
      }

      // 如果用户已登录，初始化WebSocket
      if (this.globalData.isLoggedIn) {
        this.initWebSocketConnection();
      }
    } catch (error) {
      console.error('实时服务初始化失败:', error);
    }
  },

  // 初始化WebSocket连接
  initWebSocketConnection: function() {
    try {
      if (typeof initWebSocket === 'function') {
        const wsService = initWebSocket();
        this.globalData.wsService = wsService;

        // 监听连接状态
        wsService.on('connected', () => {
          console.log('🔌 WebSocket连接成功');
          this.globalData.isWebSocketConnected = true;
        });

        wsService.on('disconnected', () => {
          console.log('🔌 WebSocket连接断开');
          this.globalData.isWebSocketConnected = false;
        });

        wsService.on('error', (error) => {
          console.error('🔌 WebSocket连接错误:', error);
          this.globalData.isWebSocketConnected = false;
        });

        wsService.on('websocket_unavailable', () => {
          console.log('🔌 WebSocket服务不可用，应用将使用轮询模式');
          this.globalData.isWebSocketConnected = false;
          this.globalData.websocketUnavailable = true;
        });
      }
    } catch (error) {
      console.error('WebSocket初始化失败:', error);
    }
  },

  // 获取WebSocket服务
  getWebSocketService: function() {
    return this.globalData.wsService;
  },
  
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    statusBarHeight: 0,
    windowHeight: 0,
    windowWidth: 0,
    isWebSocketConnected: false,
    websocketUnavailable: false,
    baseUrl: 'https://zero729-wxapp-tennis.onrender.com/api',
    primaryColor: '#0A4A39',
    // WebSocket and real-time features
    wsService: null,
    isWebSocketConnected: false,
    notificationManager: null
  }
}) 