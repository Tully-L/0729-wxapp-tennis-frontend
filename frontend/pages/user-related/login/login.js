const auth = require('../../../utils/auth.js');

Page({
  data: {
    phone: '',
    code: '',
    countdown: 0,
    isRegister: false,
    userInfo: null,
    loginLoading: false
  },

  onLoad(options) {
    // 检查是否已经登录
    if (auth.checkLogin()) {
      this.redirectToUser();
    }
    
    // 更新用户活跃度
    auth.updateUserActivity();
  },

  // 输入手机号
  inputPhone(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 输入验证码
  inputCode(e) {
    this.setData({
      code: e.detail.value
    });
  },

  // 获取验证码
  getCode() {
    const phone = this.data.phone;
    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    // 开始倒计时
    this.setData({ countdown: 60 });
    this.startCountdown();

    // 模拟发送验证码
    wx.showToast({
      title: '验证码已发送',
      icon: 'success'
    });
  },

  // 倒计时
  startCountdown() {
    const timer = setInterval(() => {
      if (this.data.countdown > 0) {
        this.setData({
          countdown: this.data.countdown - 1
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);
  },

  // 微信登录 - 增强版本
  wxLogin() {
    if (this.data.loginLoading) return;
    
    this.setData({ loginLoading: true });
    
    auth.wechatLogin().then(loginData => {
      this.setData({ loginLoading: false });
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        this.redirectToUser();
      }, 1000);
      
    }).catch(err => {
      this.setData({ loginLoading: false });
      
      console.error('微信登录失败:', err);
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      });
    });
  },

  // 手机号登录 - 增强版本
  login() {
    if (this.data.loginLoading) return;
    
    const { phone, code } = this.data;
    
    if (!phone || !code) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    this.setData({ loginLoading: true });

    // 使用开发模式登录，传入手机号作为用户标识
    const nickname = `网球选手${phone.slice(-4)}`;
    
    auth.devLogin(nickname, phone).then(loginData => {
      this.setData({ loginLoading: false });
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        this.redirectToUser();
      }, 1000);
      
    }).catch(err => {
      this.setData({ loginLoading: false });
      
      console.error('手机号登录失败:', err);
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      });
    });
  },

  // 跳转到用户页面
  redirectToUser() {
    wx.switchTab({
      url: '/pages/user/user'
    });
  },

  // 切换登录/注册模式
  toggleMode() {
    this.setData({
      isRegister: !this.data.isRegister
    });
  }
}); 