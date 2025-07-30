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

    if (this.data.countdown > 0) {
      wx.showToast({
        title: '请稍后再试',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '发送中...',
      mask: true
    });

    // 调用后端SMS API
    const { API } = require('../../../utils/api');
    API.sendSmsCode({ phone: phone })
      .then(res => {
        wx.hideLoading();
        if (res.success) {
          // 开始倒计时
          this.setData({ countdown: 60 });
          this.startCountdown();
          
          wx.showToast({
            title: '验证码已发送',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.message || '发送失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('发送验证码失败:', err);
        
        // 网络失败时使用本地开发模式
        if (err.message && err.message.includes('网络')) {
          // 开始倒计时（开发模式下也要有倒计时）
          this.setData({ countdown: 60 });
          this.startCountdown();
          
          wx.showToast({
            title: '验证码已发送（开发模式）',
            icon: 'success'
          });
          
          // 在开发模式下，显示固定验证码给开发者
          setTimeout(() => {
            wx.showModal({
              title: '开发模式提示',
              content: '当前为开发模式，验证码为：1234',
              showCancel: false,
              confirmText: '知道了'
            });
          }, 1000);
        } else {
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        }
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
      
      console.log('微信登录成功:', loginData);
      
      const loginType = loginData.user?.loginType;
      const successMessage = loginType === 'wechat_fallback' ? '登录成功（开发模式）' : '登录成功';
      
      wx.showToast({
        title: successMessage,
        icon: 'success'
      });
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        this.redirectToUser();
      }, 1000);
      
    }).catch(err => {
      this.setData({ loginLoading: false });
      
      console.error('微信登录失败:', err);
      
      // 提供更友好的错误信息
      let errorMessage = '登录失败';
      if (err.message) {
        if (err.message.includes('用户取消')) {
          errorMessage = '用户取消授权';
        } else if (err.message.includes('网络')) {
          errorMessage = '网络连接失败';
        } else if (err.message.includes('凭证')) {
          errorMessage = '微信授权失败';
        } else {
          errorMessage = err.message;
        }
      }
      
      wx.showModal({
        title: '登录失败',
        content: `${errorMessage}\n\n您可以尝试：\n1. 检查网络连接\n2. 重新打开小程序\n3. 使用手机验证码登录`,
        confirmText: '重试',
        cancelText: '使用验证码',
        success: (res) => {
          if (res.confirm) {
            // 重试微信登录
            setTimeout(() => {
              this.wxLogin();
            }, 500);
          } else {
            // 切换到手机验证码登录
            // 这里可以添加切换逻辑
            wx.showToast({
              title: '请使用手机验证码登录',
              icon: 'none'
            });
          }
        }
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

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    this.setData({ loginLoading: true });

    // 调用短信验证登录API
    const { API } = require('../../../utils/api');
    API.verifySmsCode({ phone: phone, code: code })
      .then(res => {
        this.setData({ loginLoading: false });
        
        if (res.success) {
          // 保存登录信息
          auth.saveLoginInfo(res.data);
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
          
          // 延迟跳转，让用户看到成功提示
          setTimeout(() => {
            this.redirectToUser();
          }, 1000);
        } else {
          wx.showToast({
            title: res.message || '验证失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        this.setData({ loginLoading: false });
        
        console.error('短信验证登录失败:', err);
        
        // 网络失败时回退到开发模式登录
        if (err.message && err.message.includes('网络')) {
          const nickname = `网球选手${phone.slice(-4)}`;
          auth.devLogin(nickname, phone).then(loginData => {
            wx.showToast({
              title: '登录成功（开发模式）',
              icon: 'success'
            });
            
            setTimeout(() => {
              this.redirectToUser();
            }, 1000);
          }).catch(devErr => {
            wx.showToast({
              title: '登录失败',
              icon: 'none'
            });
          });
        } else {
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        }
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