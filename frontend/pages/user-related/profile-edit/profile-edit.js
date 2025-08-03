// profile-edit.js
const auth = require('../../../utils/auth.js');
const { API } = require('../../../utils/api.js');

Page({
  data: {
    userInfo: null,
    formData: {
      customId: '',
      nickname: '',
      signature: '',
      phone: '',
      region: '',
      bio: '',
      avatar: null,
      backgroundImage: null
    },
    submitting: false,
    isNewUser: false // 是否为新用户（可以设置ID）
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
    const isNewUser = !userInfo.customId; // 如果没有自定义ID，说明是新用户

    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        isNewUser: isNewUser,
        formData: {
          customId: userInfo.customId || '',
          nickname: userInfo.nickName || '',
          signature: userInfo.signature || '',
          phone: userInfo.phone || '',
          region: userInfo.region || '',
          bio: userInfo.bio || '',
          avatar: userInfo.avatarUrl || null,
          backgroundImage: userInfo.backgroundImage || null
        }
      });
    }
  },

  // 输入用户ID
  inputCustomId: function(e) {
    const value = e.detail.value;
    // 只允许字母数字
    const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
    this.setData({
      'formData.customId': filteredValue
    });
  },

  // 输入昵称
  inputNickname: function(e) {
    this.setData({
      'formData.nickname': e.detail.value
    });
  },

  // 输入个性签名
  inputSignature: function(e) {
    this.setData({
      'formData.signature': e.detail.value
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

  // 选择背景图片
  chooseBackground: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          'formData.backgroundImage': tempFilePath
        });
      },
      fail: (err) => {
        console.error('选择背景图片失败:', err);
        wx.showToast({
          title: '选择背景图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 从微信同步信息
  syncFromWechat: function() {
    wx.showModal({
      title: '同步微信信息',
      content: '是否要从微信获取头像和昵称信息？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '获取中...',
            mask: true
          });

          wx.getUserProfile({
            desc: '用于同步头像和昵称信息',
            success: (userRes) => {
              wx.hideLoading();

              const userInfo = userRes.userInfo;
              this.setData({
                'formData.nickname': userInfo.nickName || this.data.formData.nickname,
                'formData.avatar': userInfo.avatarUrl || this.data.formData.avatar
              });

              wx.showToast({
                title: '同步成功',
                icon: 'success'
              });
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('获取微信用户信息失败:', err);

              let errorMsg = '获取失败';
              if (err.errMsg && err.errMsg.includes('deny')) {
                errorMsg = '用户拒绝授权';
              } else if (err.errMsg && err.errMsg.includes('can only be invoked by user TAP gesture')) {
                errorMsg = '请在点击事件中调用';
              }

              wx.showToast({
                title: errorMsg,
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 验证表单
  validateForm: function() {
    const { formData, isNewUser } = this.data;

    // 新用户必须设置用户ID
    if (isNewUser && !formData.customId.trim()) {
      wx.showToast({
        title: '请设置用户ID',
        icon: 'none'
      });
      return false;
    }

    // 验证用户ID格式
    if (isNewUser && formData.customId.trim()) {
      const customId = formData.customId.trim();
      if (customId.length < 4 || customId.length > 20) {
        wx.showToast({
          title: '用户ID长度应为4-20位',
          icon: 'none'
        });
        return false;
      }

      if (!/^[a-zA-Z0-9]+$/.test(customId)) {
        wx.showToast({
          title: '用户ID只能包含字母和数字',
          icon: 'none'
        });
        return false;
      }
    }

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
      signature: this.data.formData.signature.trim(),
      phone: this.data.formData.phone.trim(),
      region: this.data.formData.region.trim(),
      bio: this.data.formData.bio.trim()
    };

    // 如果是新用户，添加自定义ID
    if (this.data.isNewUser && this.data.formData.customId.trim()) {
      updateData.customId = this.data.formData.customId.trim();
    }

    // 如果有头像或背景图片，添加到更新数据中
    if (this.data.formData.avatar) {
      updateData.avatar = this.data.formData.avatar;
    }
    if (this.data.formData.backgroundImage) {
      updateData.backgroundImage = this.data.formData.backgroundImage;
    }

    // 调用后端API更新用户资料
    API.updateUserProfile(updateData).then(res => {
      wx.hideLoading();
      this.setData({ submitting: false });

      if (res.success) {
        // 更新本地存储的用户信息
        const updatedUserInfo = {
          ...this.data.userInfo,
          customId: updateData.customId || this.data.userInfo.customId,
          nickName: updateData.nickname,
          signature: updateData.signature,
          phone: updateData.phone,
          region: updateData.region,
          bio: updateData.bio,
          avatarUrl: updateData.avatar || this.data.userInfo.avatarUrl,
          backgroundImage: updateData.backgroundImage || this.data.userInfo.backgroundImage
        };

        wx.setStorageSync('userInfo', updatedUserInfo);
        
        // 清除缓存的用户资料，强制重新加载
        wx.removeStorageSync('userProfile');
        wx.removeStorageSync('userStats');

        // 设置刷新标志，让用户页面知道需要刷新数据
        wx.setStorageSync('shouldRefreshUserData', true);

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
        customId: updateData.customId || this.data.userInfo.customId,
        nickName: updateData.nickname,
        signature: updateData.signature,
        phone: updateData.phone,
        region: updateData.region,
        bio: updateData.bio,
        avatarUrl: updateData.avatar || this.data.userInfo.avatarUrl,
        backgroundImage: updateData.backgroundImage || this.data.userInfo.backgroundImage
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