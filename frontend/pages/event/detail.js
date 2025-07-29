// event detail.js
const { API } = require('../../utils/api');
const util = require('../../utils/util');
const auth = require('../../utils/auth.js');

Page({
  data: {
    eventId: '',
    event: null,
    loading: true,
    error: false,
    
    // User info
    userInfo: null,
    isLoggedIn: false,
    isRegistered: false,
    
    // Registration data
    registrations: [],
    registrationCount: 0
  },
  
  onLoad: function(options) {
    if (options.id) {
      this.setData({
        eventId: options.id
      });
      
      this.loadEventDetail();
    } else {
      this.setData({
        loading: false,
        error: true
      });
      
      wx.showToast({
        title: '赛事ID无效',
        icon: 'none'
      });
    }
    
    // 检查登录状态
    const isLoggedIn = auth.checkLogin();
    const userInfo = auth.getUserInfo();
    
    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn
    });
  },
  
  // 加载赛事详情
  loadEventDetail: function() {
    this.setData({ loading: true });
    
    // 模拟赛事详情数据
    const mockEvent = {
      _id: this.data.eventId,
      name: '温布尔登锦标赛 2024',
      eventType: '男子单打',
      status: 'registration',
      venue: '全英俱乐部',
      court: '中央球场',
      region: '伦敦',
      eventDate: '2024-07-01',
      registrationDeadline: '2024-06-15',
      description: '世界最著名的网球锦标赛之一，在草地球场上进行。这是一项历史悠久的赛事，吸引了全世界最优秀的网球选手参与。',
      organizer: { 
        name: '温布尔登网球俱乐部',
        contact: '020-1234-5678',
        email: 'info@wimbledon.org'
      },
      rules: [
        '参赛选手必须年满18周岁',
        '需要提供有效的网球等级证明',
        '比赛采用三盘两胜制',
        '遵守国际网球联合会规则'
      ],
      prizes: [
        '冠军：奖金 £50,000 + 奖杯',
        '亚军：奖金 £25,000 + 奖牌',
        '四强：奖金 £10,000',
        '八强：奖金 £5,000'
      ],
      registrationFee: '£500',
      maxParticipants: 128,
      coverImage: null
    };
    
    setTimeout(() => {
      this.setData({
        event: mockEvent,
        loading: false,
        isRegistered: Math.random() > 0.7, // 随机模拟是否已报名
        registrationCount: Math.floor(Math.random() * 100) + 20 // 随机报名人数
      });
    }, 1000);
  },
  
  // 报名赛事
  registerEvent: function() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        auth.goToLogin();
      }, 1500);
      return;
    }
    
    if (this.data.event.status !== 'registration') {
      wx.showToast({
        title: '该赛事不在报名期',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.isRegistered) {
      wx.showToast({
        title: '您已报名该赛事',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认报名',
      content: `报名费：${this.data.event.registrationFee}\n确定要报名参加 ${this.data.event.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.processRegistration();
        }
      }
    });
  },
  
  // 处理报名流程
  processRegistration: function() {
    wx.showLoading({
      title: '报名中...',
      mask: true
    });
    
    // 模拟报名API调用
    setTimeout(() => {
      wx.hideLoading();
      
      // 模拟报名成功
      this.setData({
        isRegistered: true,
        registrationCount: this.data.registrationCount + 1
      });
      
      wx.showToast({
        title: '报名成功',
        icon: 'success'
      });
      
      // 显示报名成功详情
      setTimeout(() => {
        wx.showModal({
          title: '报名成功',
          content: `您已成功报名 ${this.data.event.name}，请按时参赛并关注赛事通知。`,
          showCancel: false,
          confirmText: '知道了'
        });
      }, 1500);
    }, 2000);
  },
  
  // 取消报名
  cancelRegistration: function() {
    wx.showModal({
      title: '取消报名',
      content: '确定要取消报名吗？报名费将按规定退还。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '取消中...',
            mask: true
          });
          
          setTimeout(() => {
            wx.hideLoading();
            
            this.setData({
              isRegistered: false,
              registrationCount: this.data.registrationCount - 1
            });
            
            wx.showToast({
              title: '已取消报名',
              icon: 'success'
            });
          }, 1500);
        }
      }
    });
  },
  
  // 联系主办方
  contactOrganizer: function() {
    const phone = this.data.event.organizer.contact;
    wx.showModal({
      title: '联系主办方',
      content: `电话：${phone}`,
      confirmText: '拨打',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: phone,
            fail: (err) => {
              console.error('拨打电话失败:', err);
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
  
  // 返回
  goBack: function() {
    wx.navigateBack();
  },
  
  // 分享
  onShareAppMessage: function() {
    return {
      title: this.data.event ? `${this.data.event.name} - 网球赛事` : '网球赛事',
      path: `/pages/event/detail?id=${this.data.eventId}`
    };
  }
});