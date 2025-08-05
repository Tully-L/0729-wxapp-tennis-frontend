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

    console.log('🔍 加载赛事详情，ID:', this.data.eventId);

    // 调用真实的API获取赛事详情
    API.getEventDetail(this.data.eventId)
      .then(res => {
        console.log('📋 赛事详情API响应:', res);

        if (res.success && res.data) {
          const event = res.data;

          // 格式化赛事数据以适配前端显示
          const formattedEvent = {
            _id: event._id,
            name: event.title || event.name,
            title: event.title,
            eventType: event.ext_info?.eventType || event.category,
            status: event.status === 'published' ? 'registration' : event.status,
            venue: event.ext_info?.venue || event.location,
            court: event.ext_info?.court || '',
            region: event.ext_info?.region || '',
            eventDate: event.start_time ? new Date(event.start_time).toISOString().split('T')[0] : '',
            registrationDeadline: event.ext_info?.registrationDeadline || '',
            description: event.description || '暂无描述',
            location: event.location,
            start_time: event.start_time,
            end_time: event.end_time,
            max_participants: event.max_participants,
            organizer: {
              name: event.ext_info?.organizer?.name || '赛事组织者',
              contact: '',
              email: ''
            },
            rules: [
              '请按时参加比赛',
              '遵守比赛规则',
              '保持良好的体育精神'
            ],
            prizes: [
              '参与奖励',
              '优秀表现奖'
            ],
            registrationFee: '免费',
            maxParticipants: event.max_participants || 20,
            coverImage: null
          };

          console.log('✅ 格式化后的赛事数据:', formattedEvent);

          this.setData({
            event: formattedEvent,
            loading: false,
            isRegistered: false, // TODO: 检查用户是否已报名
            registrationCount: 0 // TODO: 获取实际报名人数
          });
        } else {
          console.error('❌ 获取赛事详情失败:', res);
          this.setData({
            loading: false,
            error: true
          });
        }
      })
      .catch(err => {
        console.error('❌ 赛事详情API调用失败:', err);
        this.setData({
          loading: false,
          error: true
        });

        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
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
  
  // 分享功能已移除
});