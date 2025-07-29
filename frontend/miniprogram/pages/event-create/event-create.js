const api = require('../../utils/api.js');

Page({
  data: {
    eventData: {
      name: '',
      eventType: '',
      venue: '',
      court: '',
      region: '',
      description: '',
      eventDate: '',
      registrationDeadline: '',
      isPublic: false
    },
    eventTypes: [
      { id: 'mens_singles', name: '男子单打' },
      { id: 'womens_singles', name: '女子单打' },
      { id: 'mens_doubles', name: '男子双打' },
      { id: 'womens_doubles', name: '女子双打' },
      { id: 'mixed_doubles', name: '混合双打' }
    ],
    submitting: false
  },

  onLoad(options) {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);
      return;
    }
  },

  // 输入赛事名称
  inputName(e) {
    this.setData({
      'eventData.name': e.detail.value
    });
  },

  // 选择赛事类型
  selectEventType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'eventData.eventType': type
    });
  },

  // 输入场地
  inputVenue(e) {
    this.setData({
      'eventData.venue': e.detail.value
    });
  },

  // 输入球场
  inputCourt(e) {
    this.setData({
      'eventData.court': e.detail.value
    });
  },

  // 输入地区
  inputRegion(e) {
    this.setData({
      'eventData.region': e.detail.value
    });
  },

  // 输入描述
  inputDescription(e) {
    this.setData({
      'eventData.description': e.detail.value
    });
  },

  // 选择比赛日期
  selectEventDate(e) {
    this.setData({
      'eventData.eventDate': e.detail.value
    });
  },

  // 选择报名截止日期
  selectDeadline(e) {
    this.setData({
      'eventData.registrationDeadline': e.detail.value
    });
  },

  // 切换公开状态
  togglePublic() {
    this.setData({
      'eventData.isPublic': !this.data.eventData.isPublic
    });
  },

  // 验证表单
  validateForm() {
    const { eventData } = this.data;
    
    if (!eventData.name.trim()) {
      wx.showToast({
        title: '请输入赛事名称',
        icon: 'none'
      });
      return false;
    }

    if (!eventData.eventType) {
      wx.showToast({
        title: '请选择赛事类型',
        icon: 'none'
      });
      return false;
    }

    if (!eventData.venue.trim()) {
      wx.showToast({
        title: '请输入场地',
        icon: 'none'
      });
      return false;
    }

    if (!eventData.eventDate) {
      wx.showToast({
        title: '请选择比赛日期',
        icon: 'none'
      });
      return false;
    }

    if (!eventData.registrationDeadline) {
      wx.showToast({
        title: '请选择报名截止日期',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 创建赛事
  createEvent() {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ submitting: true });

    wx.showLoading({
      title: '创建中...',
      mask: true
    });

    // 模拟创建赛事
    setTimeout(() => {
      wx.hideLoading();
      this.setData({ submitting: false });

      wx.showToast({
        title: '创建成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 2000);
  },

  // 取消创建
  cancel() {
    wx.navigateBack();
  }
}); 