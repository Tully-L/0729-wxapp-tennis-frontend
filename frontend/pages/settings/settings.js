// pages/settings/settings.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    appVersion: 'v2.11.5',
    companyName: '深圳市鸣世智能科技有限公司',
    businessEmail: 'business@ljtennis.com'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '设置'
    });
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 跳转到收货地址页面
   */
  goToAddress() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 2000
    });
    // TODO: 实现后跳转到收货地址页面
    // wx.navigateTo({
    //   url: '/pages/address/address'
    // });
  },

  /**
   * 跳转到授权设置页面
   */
  goToAuth() {
    wx.showModal({
      title: '授权设置',
      content: '您可以在微信设置中管理小程序的授权权限',
      confirmText: '去设置',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting({
            success: (settingRes) => {
              console.log('授权设置结果', settingRes.authSetting);
            }
          });
        }
      }
    });
  },

  /**
   * 跳转到用户使用须知页面
   */
  goToUserAgreement() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 2000
    });
    // TODO: 实现后跳转到用户协议页面
    // wx.navigateTo({
    //   url: '/pages/agreement/agreement'
    // });
  },

  /**
   * 跳转到关于我们页面
   */
  goToAbout() {
    wx.showModal({
      title: '关于LJ网球社',
      content: 'LJ网球社致力于为网球爱好者提供专业的赛事平台和优质的网球体验。\n\n我们秉承"热爱网球·享受运动"的理念，打造最具活力的网球社区。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 跳转到意见反馈页面
   */
  goToFeedback() {
    wx.showActionSheet({
      itemList: ['问题反馈', '功能建议', '联系客服'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.showFeedbackModal('问题反馈');
            break;
          case 1:
            this.showFeedbackModal('功能建议');
            break;
          case 2:
            this.contactCustomerService();
            break;
        }
      }
    });
  },

  /**
   * 显示反馈弹窗
   */
  showFeedbackModal(type) {
    wx.showModal({
      title: type,
      content: '感谢您的反馈！请通过以下方式联系我们：\n\n邮箱：feedback@ljtennis.com\n电话：400-123-4567',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 联系客服
   */
  contactCustomerService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00\n\n或者您可以通过邮箱联系我们：\nservice@ljtennis.com',
      confirmText: '拨打电话',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567',
            fail: () => {
              wx.showToast({
                title: '拨打失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  /**
   * 跳转到场馆工作人员页面
   */
  goToVenueStaff() {
    wx.showModal({
      title: '场馆工作人员',
      content: '您是场馆工作人员吗？请联系管理员获取专用入口权限。',
      confirmText: '联系管理员',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.contactAdmin();
        }
      }
    });
  },

  /**
   * 联系管理员
   */
  contactAdmin() {
    wx.showModal({
      title: '联系管理员',
      content: '管理员邮箱：admin@ljtennis.com\n请说明您的场馆信息和工作职责',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: 'LJ网球社 - 设置',
      path: '/pages/settings/settings',
      imageUrl: '/images/icon/logo.png'
    };
  }
});
