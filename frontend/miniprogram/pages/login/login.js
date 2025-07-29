const api = require('../../utils/api.js');

Page({
  data: {
    phone: '',
    code: '',
    countdown: 0,
    isRegister: false,
    userInfo: null
  },

  onLoad(options) {
    // 检查是否已经登录
    const token = wx.getStorageSync('token');
    if (token) {
      this.redirectToUser();
    }
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

  // 微信登录
  wxLogin() {
    console.log('点击了微信登录');
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo
        });
        this.login();
      },
      fail: (err) => {
        console.log('获取用户信息失败', err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    });
  },

  // 登录
  login() {
    const { phone, code, userInfo } = this.data;
    
    if (!phone || !code) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '登录中...',
      mask: true
    });

    // 模拟登录请求
    setTimeout(() => {
      wx.hideLoading();
      
      // 保存登录状态
      wx.setStorageSync('token', 'mock_token_' + Date.now());
      wx.setStorageSync('userInfo', userInfo || {
        nickname: '网球选手',
        avatar: null
      });

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      this.redirectToUser();
    }, 1500);
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