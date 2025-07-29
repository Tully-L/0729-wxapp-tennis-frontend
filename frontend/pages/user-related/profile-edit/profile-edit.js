// profile-edit.js
const auth = require('../../../utils/auth.js');
const { API } = require('../../../utils/api.js');

Page({
  data: {
    userInfo: null,
    formData: {
      nickname: '',
      phone: '',
      region: '',
      bio: '',
      avatar: null
    },
    submitting: false
  },

  onLoad: function() {
    // 检查登录状态
    const isLoggedIn = auth.checkLogin();
    if (!isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 获取用户信息
    const userInfo = auth.getUserInfo();
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        formData: {
          nickname: userInfo.nickName || '',
          phone: userInfo.phone || '',
          region: userInfo.region || '',
          bio: userInfo.bio || '',
          avatar: userInfo.avatarUrl || null
        }
      });
    }
  },

  // 输入昵称
  inputNickname: function(e) {
    this.setData({
      'formData.nickname': e.detail.value
    });
  },

  // 输入手机号
  inputPhone: function(e) {
    this.setData({
      'formData.phone': e.detail.value
    });
  },

  // 输入地区
  inputRegion: function(e) {
    this.setData({
      'formData.region': e.detail.value
    });
  },

  // 输入个人简介
  inputBio: function(e) {
    this.setData({
      'formData.bio': e.detail.value
    });
  },

  // 选择头像
  chooseAvatar: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          'formData.avatar': tempFilePath
        });
      },
      fail: (err) => {
        console.error('选择头像失败:', err);
        wx.showToast({
          title: '选择头像失败',
          icon: 'none'
        });
      }
    });
  },

  // 验证表单
  validateForm: function() {
    const { formData } = this.data;
    
    if (!formData.nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return false;
    }

    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 保存资料 - 增强版本
  saveProfile: function() {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ submitting: true });

    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    // 准备更新数据
    const updateData = {
      nickname: this.data.formData.nickname.trim(),
      phone: this.data.formData.phone.trim(),
      region: this.data.formData.region.trim()
    };

    // 调用后端API更新用户资料
    API.updateUserProfile(updateData).then(res => {
      wx.hideLoading();
      this.setData({ submitting: false });

      if (res.success) {
        // 更新本地存储的用户信息
        const updatedUserInfo = {
          ...this.data.userInfo,
          nickName: updateData.nickname,
          phone: updateData.phone,
          region: updateData.region,
          bio: this.data.formData.bio,
          avatarUrl: this.data.formData.avatar
        };

        wx.setStorageSync('userInfo', updatedUserInfo);
        
        // 清除缓存的用户资料，强制重新加载
        wx.removeStorageSync('userProfile');
        wx.removeStorageSync('userStats');

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.message || '保存失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ submitting: false });
      
      console.error('保存用户资料失败:', err);
      
      // 网络失败时使用本地保存
      const updatedUserInfo = {
        ...this.data.userInfo,
        nickName: updateData.nickname,
        phone: updateData.phone,
        region: updateData.region,
        bio: this.data.formData.bio,
        avatarUrl: this.data.formData.avatar
      };

      wx.setStorageSync('userInfo', updatedUserInfo);

      wx.showToast({
        title: '保存成功（离线模式）',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    });
  },

  // 取消编辑
  cancel: function() {
    wx.navigateBack();
  }
});